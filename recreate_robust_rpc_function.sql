-- Step 1: Drop the old function to ensure a clean slate
DROP FUNCTION IF EXISTS public.get_user_subscription_info(uuid);

-- Step 2: Create the new, more robust function
CREATE OR REPLACE FUNCTION public.get_user_subscription_info(p_user_uuid uuid)
RETURNS TABLE (
  has_active_subscription boolean,
  plan_name text,
  questions_remaining integer,
  subscription_end_date timestamp with time zone,
  can_ask_question boolean
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_sub record;
  v_plan record;
  v_question_count integer;
  v_questions_allowed integer;
  v_questions_remaining integer;
BEGIN
  -- Find the user's most recent active subscription
  SELECT * INTO v_sub
  FROM public.user_subscriptions
  WHERE user_id = p_user_uuid AND status = 'active' AND end_date > now()
  ORDER BY end_date DESC
  LIMIT 1;

  -- If no active subscription, return default free user state
  IF NOT FOUND THEN
    SELECT count(*) INTO v_question_count FROM public.user_questions WHERE user_id = p_user_uuid AND is_premium = false;
    v_questions_remaining := 1 - v_question_count;
    IF v_questions_remaining < 0 THEN v_questions_remaining := 0; END IF;

    RETURN QUERY SELECT false, 'Gratuito', v_questions_remaining, NULL, (v_questions_remaining > 0);
    RETURN;
  END IF;

  -- Get the details of the subscription plan
  SELECT * INTO v_plan
  FROM public.subscription_plans
  WHERE id = v_sub.plan_id;

  -- !! GRACEFUL HANDLING FOR INCONSISTENT DATA !!
  -- If plan is not found, don't crash. Return a default state.
  IF NOT FOUND THEN
    RETURN QUERY SELECT true, 'Plan Inconsistente', 0, v_sub.end_date, false;
    RETURN;
  END IF;

  -- Count questions used during the current subscription period
  SELECT count(*) INTO v_question_count
  FROM public.user_questions
  WHERE user_id = p_user_uuid AND created_at BETWEEN v_sub.start_date AND v_sub.end_date;

  -- Calculate remaining questions
  v_questions_allowed := COALESCE(v_plan.max_questions_per_period, 9999);
  v_questions_remaining := v_questions_allowed - v_question_count;
  IF v_questions_remaining < 0 THEN v_questions_remaining := 0; END IF;

  -- Return the full subscription details
  RETURN QUERY SELECT true, v_plan.name, v_questions_remaining, v_sub.end_date, (v_questions_remaining > 0);
END;
$$;