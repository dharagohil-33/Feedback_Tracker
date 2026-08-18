import { supabaseAdmin } from '../services/supabase/supabaseClient.js';

async function main() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error('Error listing users:', error);
    return;
  }

  for (const u of data.users) {
    console.log(`User: ${u.email} (ID: ${u.id}), confirmed: ${u.email_confirmed_at}`);
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(u.id, {
      email_confirm: true,
    });
    if (updateErr) {
      console.error(`Failed to confirm ${u.email}:`, updateErr);
    } else {
      console.log(`Successfully confirmed user ${u.email}!`);
    }
  }
}

main();
