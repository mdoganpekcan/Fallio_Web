-- Migration to create the get_full_user_profile RPC for mobile app startup optimization

CREATE OR REPLACE FUNCTION public.get_full_user_profile(p_auth_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_result jsonb;
BEGIN
  -- First, get the public user ID linked to this auth user
  SELECT id INTO v_user_id
  FROM public.users
  WHERE auth_user_id = p_auth_user_id;

  -- If no user exists, return null so the client knows it needs to run ensureUserRecords
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Build a single unified JSON object returning all critical startup info
  SELECT jsonb_build_object(
    'id', u.id,
    'email', u.email,
    'full_name', COALESCE(u.full_name, p.full_name),
    'avatar_url', COALESCE(u.avatar_url, p.avatar_url),
    'birthdate', COALESCE(u.birthdate, p.birthdate),
    'zodiac_sign', COALESCE(u.zodiac_sign, p.zodiac_sign),
    'gender', COALESCE(u.gender, p.gender, 'other'),
    'created_at', u.created_at,
    'wallet', COALESCE(
      (SELECT jsonb_build_object('credits', w.credits, 'diamonds', w.diamonds) 
       FROM public.wallet w WHERE w.user_id = u.id),
      '{"credits": 0, "diamonds": 0}'::jsonb
    ),
    'active_subscription', (
       SELECT jsonb_build_object('plan_name', s.plan_name, 'status', s.status)
       FROM public.subscriptions s
       WHERE s.user_id = u.id AND s.status = 'active'
       LIMIT 1
    )
  ) INTO v_result
  FROM public.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE u.id = v_user_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
