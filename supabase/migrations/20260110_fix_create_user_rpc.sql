-- Existing functinon'ı kaldır
DROP FUNCTION IF EXISTS public.create_user_record;

-- Yeni ve Güncel Fonksiyon (Diamonds yok, Birthdate/Gender var)
CREATE OR REPLACE FUNCTION public.create_user_record(
  p_auth_user_id uuid,
  p_email text,
  p_full_name text DEFAULT '',
  p_avatar_url text DEFAULT '',
  p_zodiac_sign text DEFAULT '',
  p_birth_date date DEFAULT NULL,
  p_gender text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  -- 1. Users tablosuna ekle veya güncelle
  INSERT INTO public.users (
    auth_user_id, email, full_name, avatar_url, zodiac_sign, birthdate, gender, status, created_at, updated_at
  )
  VALUES (
    p_auth_user_id, p_email, p_full_name, p_avatar_url, p_zodiac_sign, p_birth_date, p_gender, 'active', now(), now()
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    auth_user_id = EXCLUDED.auth_user_id,
    birthdate = COALESCE(EXCLUDED.birthdate, public.users.birthdate),
    gender = COALESCE(EXCLUDED.gender, public.users.gender),
    updated_at = now()
  RETURNING id INTO v_user_id;

  -- 2. Profiles tablosunu senkronize et
  INSERT INTO public.profiles (
    user_id, email, full_name, birthdate, gender, zodiac_sign
  )
  VALUES (
    v_user_id, p_email, p_full_name, p_birth_date, p_gender, p_zodiac_sign
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    birthdate = COALESCE(EXCLUDED.birthdate, public.profiles.birthdate),
    gender = COALESCE(EXCLUDED.gender, public.profiles.gender);

  -- 3. Cüzdan oluştur (Sadece Credits)
  INSERT INTO public.wallet (user_id, credits)
  VALUES (v_user_id, 100) -- Başlangıç kredisi 100
  ON CONFLICT (user_id) DO NOTHING;

  RETURN json_build_object('id', v_user_id);
END;
$function$;
