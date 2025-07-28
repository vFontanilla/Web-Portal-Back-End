import { createPool, Pool, RowDataPacket, OkPacket, ResultSetHeader } from 'mysql2/promise';
import { config } from 'dotenv';

config();

const pool: Pool = createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Use union of expected return types
type DBResponse = RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader;

const query = async <T = DBResponse>(sql: string, params?: any[]): Promise<T> => {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
};

export { pool, query, type DBResponse };
