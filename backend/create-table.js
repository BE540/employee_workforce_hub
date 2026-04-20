const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'workforce_poc'
  });

  try {
    await pool.execute(
      `CREATE TABLE IF NOT EXISTS user_projects (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_project (user_id, project_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )`
    );
    console.log('✅ user_projects table created');

    await pool.execute(
      `INSERT IGNORE INTO user_projects (user_id, project_id) VALUES (3, 1), (4, 1)`
    );
    console.log('✅ user_projects seeded');

  } catch(e) {
    console.error('❌ Error:', e.message);
  } finally {
    await pool.end();
  }
})();
