import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: parseInt(process.env.DB_PORT ?? '3306', 10),
      user: process.env.DB_USER ?? 'peq',
      password: process.env.DB_PASS ?? 'peqpass',
      database: process.env.DB_NAME ?? 'peq',
      connectionLimit: 10,
      // Read-only: never issue writes via this pool
      multipleStatements: false,
    });
  }
  return pool;
}

export async function query<T>(sql: string, values?: (string | number | null)[]): Promise<T[]> {
  const [rows] = await getPool().execute(sql, values);
  return rows as T[];
}

export async function queryOne<T>(sql: string, values?: (string | number | null)[]): Promise<T | null> {
  const rows = await query<T>(sql, values);
  return rows[0] ?? null;
}

/** Returns all base table names in the current database schema. */
export async function getExistingTables(): Promise<string[]> {
  const rows = await query<{ TABLE_NAME: string }>(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
     ORDER BY TABLE_NAME`
  );
  return rows.map((r) => r.TABLE_NAME);
}
