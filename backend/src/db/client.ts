import pg from "pg";
import dotenv from "dotenv";
dotenv.config();
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export async function query<T extends pg.QueryResultRow = any>(text: string, params: any[] = []) {
  return pool.query<T>(text, params);
}
