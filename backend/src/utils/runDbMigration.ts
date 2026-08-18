import pg from 'pg';
import fs from 'fs';
import path from 'path';

async function run() {
  const poolerHosts = [
    'aws-0-us-east-1.pooler.supabase.com',
    'aws-0-us-west-1.pooler.supabase.com',
    'aws-0-eu-central-1.pooler.supabase.com',
    'aws-0-ap-south-1.pooler.supabase.com',
    'aws-0-ap-southeast-1.pooler.supabase.com',
  ];

  let connected = false;

  for (const host of poolerHosts) {
    if (connected) break;
    const connectionString = `postgresql://postgres.cadecuuumbueuwfnxmbm:${encodeURIComponent('Dhara@123dhara')}@${host}:6543/postgres`;
    console.log(`Connecting to ${host}:6543...`);
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 4000,
    });

    try {
      await client.connect();
      console.log(`✅ Connected to Supabase Pooler at ${host}!`);

      const mig1Path = path.resolve(process.cwd(), '../supabase/migrations/20260818000001_auth_and_schema.sql');
      const mig2Path = path.resolve(process.cwd(), '../supabase/migrations/20260818000002_feedback_file_metadata.sql');

      if (fs.existsSync(mig1Path)) {
        console.log('Running 20260818000001_auth_and_schema.sql...');
        const sql1 = fs.readFileSync(mig1Path, 'utf8');
        await client.query(sql1);
        console.log('✅ 20260818000001_auth_and_schema.sql executed!');
      }

      if (fs.existsSync(mig2Path)) {
        console.log('Running 20260818000002_feedback_file_metadata.sql...');
        const sql2 = fs.readFileSync(mig2Path, 'utf8');
        await client.query(sql2);
        console.log('✅ 20260818000002_feedback_file_metadata.sql executed!');
      }

      await client.query(`
        GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
        GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
        GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
        NOTIFY pgrst, 'reload schema';
      `);

      console.log('✅ Postgrest schema cache reloaded!');
      await client.end();
      connected = true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`Notice on ${host}: ${msg}`);
      await client.end().catch(() => {});
    }
  }

  if (!connected) {
    console.log('Could not reach IPv4 pooler directly.');
  }
}

run();
