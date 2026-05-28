import { drizzle } from "drizzle-orm/node-postgres";
import pg from 'pg';
const { Pool } = pg;
import { env } from '$env/dynamic/private';

let dbUrl: string;
if (env.DB_CREDENTIALS) {
  const dbCreds = JSON.parse(env.DB_CREDENTIALS);
  dbUrl = `postgresql://${dbCreds.username}:${dbCreds.password}@${dbCreds.host}:${dbCreds.port}/${dbCreds.dbClusterIdentifier}?sslmode=no-verify&hot_standby_feedback=on`;
} else if (env.DB_URL) {
    dbUrl = env.DB_URL;
  } else {
    throw new Error('No database configuration found.');
  }

  export const pool = new Pool({
    connectionString: dbUrl,
    query_timeout: 3000,
    statement_timeout: 3000,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 15,
    min: 5,
  });


  pool.on('error', (err) => {
    console.error('Database pool error:', {
      message: err.message,
      code: err.code,
      timestamp: new Date().toISOString()
    });

    if (err.message?.includes('conflict with recovery') || 
        err.message?.includes('canceling statement due to conflict')) {
      console.warn('Replica conflict detected - this is expected behavior');
    return;
    }

  });

  const db = drizzle(pool, { });
  export default db;
