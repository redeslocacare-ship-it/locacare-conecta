
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wwltjlnlutnuypmkwbuy.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) throw new Error('Defina SUPABASE_SERVICE_ROLE_KEY no ambiente antes de rodar este script.');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateAdminPassword() {
  const email = 'admin@locacare.com.br';
  const newPassword = 'loca2026';

  console.log(`🔍 Searching for user: ${email}...`);

  // List users to find the ID
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.error(`❌ User not found: ${email}`);
    // Optional: Create the user if it doesn't exist?
    // For now, just report not found as requested.
    return;
  }

  console.log(`✅ User found. ID: ${user.id}`);
  console.log(`🔄 Updating password...`);

  const { data, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (updateError) {
    console.error('❌ Error updating password:', updateError.message);
  } else {
    console.log('✅ Password updated successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 New Password: ${newPassword}`);
  }
}

updateAdminPassword();
