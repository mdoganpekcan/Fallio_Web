-- 1. Wallet tablosundan diamonds sütununu kaldır
ALTER TABLE public.wallet DROP COLUMN IF EXISTS diamonds;

-- 2. Earning rules tablosunu kaldır (Artık kredi sistemi var)
DROP TABLE IF EXISTS public.earning_rules;

-- 3. Varsa başka elmas referanslarını temizle (Kısıtlamaları kontrol etmemiz gerekebilir ama şimdilik doğrudan drop)
-- (Gerekirse buraya başka temizlik komutları eklenebilir)
