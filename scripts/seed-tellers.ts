import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

// 1. Load Environment Variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
console.log(`Loading env from: ${envPath}`);

if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
      process.env[key] = value;
    }
  });
} else {
  console.error("Error: .env.local file not found!");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// 2. Create Supabase Admin Client
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const SAMPLE_TELLERS = [
  {
    name: 'Falcı Ada',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ada',
    expertise: ['Kahve Falı', 'Tarot Falı'],
    rating: 4.9,
    price: 100,
    is_online: true,
    is_active: true,
    is_ai: true,
    bio: '15 yıllık deneyimimle kahve ve tarot fallarınızı yorumluyorum. Hislerim çok kuvvetlidir.'
  },
  {
    name: 'Falcı Elif',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elif',
    expertise: ['Tarot Falı', 'Aşk Uyumu'],
    rating: 4.8,
    price: 150,
    is_online: true,
    is_active: true,
    is_ai: false,
    bio: 'Kartların gizemli dünyasında size rehberlik etmek için buradayım.'
  },
  {
    name: 'Falcı Deniz',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deniz',
    expertise: ['El Falı', 'Rüya Tabiri'],
    rating: 4.7,
    price: 120,
    is_online: false,
    is_active: true,
    is_ai: true,
    bio: 'Rüyalarınızın ve el çizgilerinizin size neler söylediğini merak ediyor musunuz?'
  }
];

async function seedTellers() {
  console.log("Seeding fortune tellers...");

  for (const teller of SAMPLE_TELLERS) {
    // Check if exists by name to avoid duplicates
    const { data: existing } = await supabaseAdmin
      .from('fortune_tellers')
      .select('id')
      .eq('name', teller.name)
      .single();

    if (existing) {
      console.log(`Skipping ${teller.name}, already exists.`);
    } else {
      const { error } = await supabaseAdmin
        .from('fortune_tellers')
        .insert(teller);
      
      if (error) {
        console.error(`Error creating ${teller.name}:`, error.message);
      } else {
        console.log(`Created ${teller.name}`);
      }
    }
  }
  
  console.log("Seeding complete!");
}

seedTellers();
