import 'dotenv/config';
import mysql from 'mysql2/promise';

async function migrate() {
  const host = process.env.SQL_HOST || '127.0.0.1';
  const port = process.env.SQL_PORT ? parseInt(process.env.SQL_PORT) : 3306;
  const user = process.env.SQL_USER || process.env.SQL_ADMIN_USER || 'root';
  const password = process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD || '';
  const database = process.env.SQL_DB_NAME || 'github_analyzer';

  console.log(`Connecting to MySQL at ${host}:${port}/${database}`);
  const connection = await mysql.createConnection({ host, port, user, password, database });
  
  try {
    console.log("Migrating users table...");
    await connection.execute(`SET FOREIGN_KEY_CHECKS = 0;`);
    
    // Check if uid column exists
    const [columns] = await connection.execute(`SHOW COLUMNS FROM users LIKE 'uid'`);
    if (columns.length > 0) {
      await connection.execute(`TRUNCATE TABLE analyzed_profiles;`);
      await connection.execute(`TRUNCATE TABLE users;`);
      await connection.execute(`ALTER TABLE users DROP COLUMN uid;`);
      await connection.execute(`ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL;`);
      await connection.execute(`ALTER TABLE users ADD COLUMN name VARCHAR(255) NOT NULL;`);
      
      // Ensure email is unique
      const [indices] = await connection.execute(`SHOW INDEX FROM users WHERE Key_name = 'email'`);
      if (indices.length === 0) {
        await connection.execute(`ALTER TABLE users ADD UNIQUE (email);`);
      }
      console.log("Migration successful.");
    } else {
      console.log("Migration already applied.");
    }
    
    await connection.execute(`SET FOREIGN_KEY_CHECKS = 1;`);
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await connection.end();
  }
}
migrate();
