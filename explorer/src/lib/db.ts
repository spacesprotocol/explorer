import { drizzle } from "drizzle-orm/node-postgres";
import pg from 'pg';
const { Pool } = pg;
import { DB_URL } from '$env/static/private';
import * as schema from '$lib/schema';

const pool = new Pool({ connectionString: DB_URL });
const db = drizzle(pool, { schema });

export default db;
