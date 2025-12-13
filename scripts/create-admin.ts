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

if (args[2]) {
  if (validRoles.includes(args[2])) {
    role = args[2];
    if (args[3]) name = args[3];
  } else {
    name = args[2];
  }
}

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

async function createAdmin() {
  console.log(`Creating/Updating admin user: ${email}`);

  // 3. Check if user exists in Auth
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error("Error listing users:", listError);
    return;
  }
  
  let userId = users?.find(u => u.email === email)?.id;

  if (!userId) {
    console.log("User not found in Auth, creating...");
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name }
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return;
    }
    userId = newUser.user.id;
    console.log("User created with ID:", userId);
  } else {
    console.log("User already exists with ID:", userId);
    console.log("Updating password...");
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    if (updateError) {
        console.error("Error updating password:", updateError);
    } else {
        console.log("Password updated successfully.");
    }
  }

  // 4. Ensure Admin Role in public.admin_users
  const { data: adminRecord } = await supabaseAdmin
    .from("admin_users")
    .select("*")
    .eq("email", email)
    .single();

  if (!adminRecord) {
    console.log(`Creating admin_users record with role: ${role}...`);
    const { error: insertError } = await supabaseAdmin
      .from("admin_users")
      .insert({
        auth_user_id: userId,
        email: email,
        role: role, 
        display_name: name
      });
      
    if (insertError) {
        console.error("Error inserting admin record:", insertError);
    } else {
        console.log("Admin record created.");
    }
  } else {
      console.log(`Admin record already exists. Updating role to '${role}'...`);
      const { error: updateRoleError } = await supabaseAdmin
        .from("admin_users")
        .update({ role: role, display_name: name })
        .eq('email', email);
        
      if (updateRoleError) {
          console.error("Error updating admin role:", updateRoleError);
      } else {
          console.log("Admin role updated.");
      }
  }
  
  console.log("Done! You can now login with these credentials.");
}

createAdmin();
