-- =========================================
-- BOTTAROT SUBSCRIPTION SYSTEM SCHEMA
-- Execute in Supabase SQL Editor
-- =========================================

-- First, add timezone and language columns to existing profiles table if not already added
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Mexico_City',
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'es';

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER NOT NULL, -- 7 for weekly, 30 for monthly
  features JSONB DEFAULT '{}',
  max_questions_per_period INTEGER, -- NULL for unlimited, number for limited
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  paypal_subscription_id TEXT UNIQUE,
  paypal_order_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, cancelled, expired
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id),
  paypal_payment_id TEXT,
  paypal_order_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL, -- completed, pending, failed, refunded
  payment_method TEXT DEFAULT 'paypal',
  transaction_data JSONB DEFAULT '{}', -- PayPal response data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user question tracking table (for free plan limits)
CREATE TABLE IF NOT EXISTS user_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  response TEXT,
  cards_used JSONB DEFAULT '[]',
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_user_questions_user_id ON user_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_questions_created_at ON user_questions(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE OR REPLACE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, duration_days, max_questions_per_period, features) VALUES
(
  'Gratuito',
  '1 pregunta por semana, para siempre',
  0.00,
  7,
  1,
  '{"basic_reading": true, "history_limit": 5}'
),
(
  'Semana de Lanzamiento',
  'Preguntas ilimitadas por solo $1',
  1.00,
  7,
  NULL,
  '{"unlimited_questions": true, "premium_readings": true, "full_history": true, "export_pdf": true}'
),
(
  'Ilimitado Semanal',
  '$5 por semana de preguntas ilimitadas',
  5.00,
  7,
  NULL,
  '{"unlimited_questions": true, "premium_readings": true, "full_history": true, "export_pdf": true, "priority_support": true}'
)
ON CONFLICT DO NOTHING;

-- Create RLS (Row Level Security) policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_questions ENABLE ROW LEVEL SECURITY;

-- Subscription plans are readable by everyone (for pricing page)
CREATE POLICY "Subscription plans are readable by everyone" ON subscription_plans
  FOR SELECT USING (is_active = true);

-- Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own questions
CREATE POLICY "Users can view own questions" ON user_questions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own questions" ON user_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a view for active subscriptions
CREATE OR REPLACE VIEW active_user_subscriptions AS
SELECT
  us.*,
  sp.name as plan_name,
  sp.max_questions_per_period,
  sp.features
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.status = 'active'
  AND (us.end_date IS NULL OR us.end_date > NOW());

-- Create function to check if user can ask question
CREATE OR REPLACE FUNCTION can_user_ask_question(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  active_sub RECORD;
  question_count INTEGER;
  week_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user has active subscription
  SELECT * INTO active_sub
  FROM active_user_subscriptions
  WHERE user_id = user_uuid;

  -- If no active subscription, check free plan limits
  IF active_sub IS NULL THEN
    week_start := date_trunc('week', NOW());
    SELECT COUNT(*) INTO question_count
    FROM user_questions
    WHERE user_id = user_uuid
      AND created_at >= week_start;

    -- Free plan: 1 question per week
    RETURN question_count < 1;
  END IF;

  -- If max_questions_per_period is NULL, it's unlimited
  IF active_sub.max_questions_per_period IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check period-based limits
  week_start := date_trunc('week', NOW());
  SELECT COUNT(*) INTO question_count
  FROM user_questions
  WHERE user_id = user_uuid
    AND created_at >= week_start;

  RETURN question_count < active_sub.max_questions_per_period;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION can_user_ask_question(UUID) TO authenticated;

-- Create function to get user's current subscription info
CREATE OR REPLACE FUNCTION get_user_subscription_info(user_uuid UUID)
RETURNS TABLE (
  has_active_subscription BOOLEAN,
  plan_name TEXT,
  questions_remaining INTEGER,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  can_ask_question BOOLEAN
) AS $$
DECLARE
  active_sub RECORD;
  question_count INTEGER;
  week_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user has active subscription
  SELECT * INTO active_sub
  FROM active_user_subscriptions
  WHERE user_id = user_uuid;

  week_start := date_trunc('week', NOW());
  SELECT COUNT(*) INTO question_count
  FROM user_questions
  WHERE user_id = user_uuid
    AND created_at >= week_start;

  IF active_sub IS NULL THEN
    -- Free plan
    RETURN QUERY SELECT
      FALSE as has_active_subscription,
      'Gratuito'::TEXT as plan_name,
      GREATEST(0, 1 - question_count) as questions_remaining,
      NULL::TIMESTAMP WITH TIME ZONE as subscription_end_date,
      can_user_ask_question(user_uuid) as can_ask_question;
  ELSE
    -- Paid plan
    RETURN QUERY SELECT
      TRUE as has_active_subscription,
      active_sub.plan_name,
      CASE
        WHEN active_sub.max_questions_per_period IS NULL THEN -1 -- Unlimited
        ELSE GREATEST(0, active_sub.max_questions_per_period - question_count)
      END as questions_remaining,
      active_sub.end_date as subscription_end_date,
      can_user_ask_question(user_uuid) as can_ask_question;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_subscription_info(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE subscription_plans IS 'Available subscription plans for the tarot application';
COMMENT ON TABLE user_subscriptions IS 'User subscription records linked to PayPal';
COMMENT ON TABLE payment_transactions IS 'Payment transaction history';
COMMENT ON TABLE user_questions IS 'User question history for tracking limits';
COMMENT ON FUNCTION can_user_ask_question(UUID) IS 'Checks if user can ask a new question based on their plan';
COMMENT ON FUNCTION get_user_subscription_info(UUID) IS 'Gets comprehensive subscription info for a user';