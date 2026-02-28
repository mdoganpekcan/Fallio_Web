-- Migration to automatically sync `admin_users.role` with `auth.users.raw_app_meta_data->'role'`

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.sync_admin_role_to_auth()
RETURNS trigger AS $$
BEGIN
  -- If inserting/updating an admin_user, update auth.users
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE auth.users
    SET raw_app_meta_data = 
        COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
    WHERE id = NEW.auth_user_id;
    RETURN NEW;
  END IF;

  -- If deleting an admin_user, remove the role from auth.users (revert to default)
  IF (TG_OP = 'DELETE') THEN
    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data - 'role'
    WHERE id = OLD.auth_user_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_admin_user_role_change ON public.admin_users;

-- Create the trigger
CREATE TRIGGER on_admin_user_role_change
AFTER INSERT OR UPDATE OF role OR DELETE ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.sync_admin_role_to_auth();

-- One-time sync for existing users
UPDATE auth.users AS a
SET raw_app_meta_data = 
    COALESCE(a.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', au.role)
FROM public.admin_users AS au
WHERE a.id = au.auth_user_id;
