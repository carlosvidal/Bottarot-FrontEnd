-- =========================================
-- MIGRATION PLAN: Fusión de esquemas actual + Phase 3
-- =========================================

-- ANÁLISIS DE DIFERENCIAS:
-- Tu esquema actual tiene estructura similar pero faltan:
-- 1. Funciones PostgreSQL para lógica de negocio
-- 2. Tabla user_questions para límites
-- 3. Tabla payment_transactions para auditoría
-- 4. Políticas RLS
-- 5. Algunos campos adicionales

-- ESTRATEGIA: Migración híbrida - mantener lo bueno, agregar lo que falta

-- =========================================
-- PASO 1: AJUSTAR TABLA PLANS (tu 'plans' → 'subscription_plans')
-- =========================================

-- Rename table to match our naming convention
ALTER TABLE IF EXISTS plans RENAME TO subscription_plans;

-- Add missing columns
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS max_questions_per_period INTEGER,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Rename columns to match our convention
ALTER TABLE subscription_plans RENAME COLUMN price_usd TO price;

-- =========================================
-- PASO 2: AJUSTAR TABLA SUBSCRIPTIONS (tu 'subscriptions' → 'user_subscriptions')
-- =========================================

-- Rename table to match our naming convention
ALTER TABLE IF EXISTS subscriptions RENAME TO user_subscriptions;

-- Add missing columns
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =========================================
-- PASO 3: CREAR TABLAS FALTANTES
-- =========================================

-- Create payment_transactions table (nueva)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id BIGINT REFERENCES user_subscriptions(id),
  paypal_payment_id TEXT,
  paypal_order_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL, -- completed, pending, failed, refunded
  payment_method TEXT DEFAULT 'paypal',
  transaction_data JSONB DEFAULT '{}', -- PayPal response data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_questions table (nueva)
CREATE TABLE IF NOT EXISTS user_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  response TEXT,
  cards_used JSONB DEFAULT '[]',
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- PASO 4: CREAR ÍNDICES
-- =========================================

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_user_questions_user_id ON user_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_questions_created_at ON user_questions(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);

-- =========================================
-- PASO 5: CREAR FUNCIÓN PARA TIMESTAMPS
-- =========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- PASO 6: FUNCIONES DE NEGOCIO
-- =========================================

-- Create function to check if user can ask question
CREATE OR REPLACE FUNCTION can_user_ask_question(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  active_sub RECORD;
  question_count INTEGER;
  week_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user has active subscription
  SELECT us.*, sp.max_questions_per_period
  INTO active_sub
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = user_uuid
    AND us.status = 'active'
    AND (us.end_date IS NULL OR us.end_date > NOW());

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
  SELECT us.*, sp.name as plan_name, sp.max_questions_per_period
  INTO active_sub
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = user_uuid
    AND us.status = 'active'
    AND (us.end_date IS NULL OR us.end_date > NOW());

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

-- =========================================
-- PASO 7: POLÍTICAS RLS
-- =========================================

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

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

-- Users can only see their own chat sessions
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Users can only see their own chat messages
CREATE POLICY "Users can view own chat messages" ON chat_messages
  FOR ALL USING (auth.uid() = (SELECT user_id FROM chat_sessions WHERE id = session_id));

-- =========================================
-- PASO 8: INSERTAR PLANES PREDETERMINADOS
-- =========================================

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

-- =========================================
-- PASO 9: PERMISOS
-- =========================================

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION can_user_ask_question(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription_info(UUID) TO authenticated;

-- =========================================
-- PASO 10: CREAR VISTA PARA SUSCRIPCIONES ACTIVAS
-- =========================================

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

-- =========================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =========================================

COMMENT ON TABLE subscription_plans IS 'Available subscription plans for the tarot application';
COMMENT ON TABLE user_subscriptions IS 'User subscription records linked to PayPal';
COMMENT ON TABLE payment_transactions IS 'Payment transaction history';
COMMENT ON TABLE user_questions IS 'User question history for tracking limits';
COMMENT ON TABLE chat_sessions IS 'User chat sessions for organizing conversations';
COMMENT ON TABLE chat_messages IS 'Individual messages within chat sessions';
COMMENT ON FUNCTION can_user_ask_question(UUID) IS 'Checks if user can ask a new question based on their plan';
COMMENT ON FUNCTION get_user_subscription_info(UUID) IS 'Gets comprehensive subscription info for a user';

-- =========================================
-- VERIFICACIÓN FINAL
-- =========================================

-- Verificar que todo se creó correctamente
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Tables created: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public');
    RAISE NOTICE 'Functions created: %', (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public');
    RAISE NOTICE 'Plans inserted: %', (SELECT COUNT(*) FROM subscription_plans);
END
$$;