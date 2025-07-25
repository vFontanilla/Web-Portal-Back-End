import { createConnection, Connection } from 'mysql2';
import { config } from 'dotenv';

// Load environment variables from .env
config();

// Create the connection
const connection: Connection = createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Promise-based query function
const query = (sql: string, params?: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) {
        console.error('Database query error:', err);
        return reject(err);
      }
      resolve(results);
    });
  });
};

// Connection test
connection.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to database as id', connection.threadId);
});

// Export
export { connection, query };
