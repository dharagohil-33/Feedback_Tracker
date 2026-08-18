import pg from 'pg';

async function checkPriorityEnum() {
  const host = 'aws-0-ap-south-1.pooler.supabase.com';
  const connectionString = `postgresql://postgres.cadecuuumbueuwfnxmbm:${encodeURIComponent('Dhara@123dhara')}@${host}:6543/postgres`;
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'priority_enum';
    `);
    console.log('PostgreSQL priority_enum labels:', res.rows.map(r => r.enumlabel));
    await client.end();
  } catch (err) {
    console.error('Check enum error:', err);
    await client.end().catch(() => {});
  }
}

checkPriorityEnum();
