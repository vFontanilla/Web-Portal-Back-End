import { createConnection, Connection } from 'mysql2';
import { config } from 'dotenv';

// Load environment variables
config();

const connection: Connection = createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Async query function using Promises
const query = (sql: string, params?: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) {
        console.error('Database query error:', err);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Initial connection test
connection.connect(err => {
  if (err) {
    console.error('❌ Error connecting to the database:', err.stack);
  } else {
    console.log('✅ Connected to MySQL as ID', connection.threadId);
  }
});

export { connection, query };
