import { createPool, Pool, RowDataPacket } from 'mysql2/promise';
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

// Use RowDataPacket as base to satisfy mysql2 constraints
const query = async <T extends RowDataPacket[] = RowDataPacket[]>(
  sql: string,
  params?: any[]
): Promise<T> => {
  const [rows] = await pool.execute<T>(sql, params);
  return rows;
};

export { pool, query };
