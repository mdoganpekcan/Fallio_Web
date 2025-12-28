import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

// 0. Parse Arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: npx tsx scripts/create-admin.ts <email> <password> [role] [name]");
  console.error("Roles: admin, moderator, fortune_teller");
  process.exit(1);
}

const email = args[0];
const password = args[1];

// Determine if 3rd arg is role or name
const validRoles = ["admin", "moderator", "fortune_teller"];
let role = "admin";
let name = "Admin User";

// Argument handling improvements
if (args[2]) {
  if (validRoles.includes(args[2].toLowerCase())) {
    role = args[2].toLowerCase();
    if (args[3]) name = args[3];
  } else {
    name = args[2];
    if (args[3] && validRoles.includes(args[3].toLowerCase())) {
      role = args[3].toLowerCase();
    }
  }
}

// 1. Robust Env Loading
const envPaths = [
  path.resolve(__dirname, '../.env.local'),
  path.resolve(__dirname, '../.env')
];

let envLoaded = false;
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    console.log(`Loading env from: ${p}`);
    const envConfig = fs.readFileSync(p, 'utf8');
    envConfig.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.error("Error: .env.local or .env file not found!");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// 2. Client Setup
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createAdmin() {
  console.log(`\n--- Fallio Admin Creator ---`);
  console.log(`Email: ${email}`);
  console.log(`Role:  ${role}`);
  console.log(`Name:  ${name}\n`);

  // 3. Auth Operations
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) return console.error("!! Error listing users:", listError.message);

  let userId = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())?.id;

  if (!userId) {
    console.log("-> User not found in Auth, creating new account...");
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role: role }
    });

    if (createError) return console.error("!! Error creating user:", createError.message);
    userId = newUser.user.id;
    console.log("✅ Auth user created successfully.");
  } else {
    console.log("-> User exists in Auth. Synchronizing password...");
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
      user_metadata: { full_name: name, role: role }
    });
    if (updateError) console.error("!! Password update failed:", updateError.message);
    else console.log("✅ Password updated.");
  }

  // 4. Public Schema Sync (admin_users table)
  console.log("-> Syncing with public.admin_users table...");
  const { error: upsertError } = await supabaseAdmin
    .from("admin_users")
    .upsert({
      auth_user_id: userId,
      email: email.toLowerCase(),
      role: role,
      display_name: name
    }, { onConflict: 'auth_user_id' });

  if (upsertError) {
    console.error("!! Error syncing admin record:", upsertError.message);
    console.log("TIP: Make sure columns in admin_users allow 'text' for role.");
  } else {
    console.log("✅ Public admin record synchronized.");
  }

  console.log("\n✨ Done! You can now login at /admin/login");
}

createAdmin();
