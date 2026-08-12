const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'visitor_db';
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;

let pool;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'src')));

async function initializeDatabase() {
  try {
    const rootConnection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: DB_PORT
    });

    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await rootConnection.end();

    pool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        institutionId VARCHAR(50) NOT NULL,
        role ENUM('staff','student') NOT NULL DEFAULT 'staff',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        mobile VARCHAR(50),
        purpose VARCHAR(255),
        person VARCHAR(255),
        date VARCHAR(20),
        time VARCHAR(20),
        status VARCHAR(50) DEFAULT 'pending',
        checkInDateTime VARCHAR(50),
        checkOutDateTime VARCHAR(50),
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [usersRows] = await pool.query('SELECT COUNT(*) AS count FROM users');
    if (usersRows[0].count === 0) {
      await pool.query(`INSERT INTO users (username, password, institutionId, role) VALUES ?`, [
        [
          ['admin', 'admin123', 'JJCET', 'staff'],
          ['student', 'student123', 'JJCET', 'student']
        ]
      ]);
    }
  } catch (err) {
    console.error('Database initialization failed:', err);
    throw err;
  }
}

function handleServerError(res, error, message) {
  console.error(message, error);
  res.status(500).json({ message });
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT username, role FROM users');
    res.json(rows);
  } catch (err) {
    handleServerError(res, err, 'Failed to fetch users');
  }
});

app.post('/api/users/register', async (req, res) => {
  const { username, password, institutionId, role } = req.body;

  if (!username || !password || !institutionId) {
    return res.status(400).json({ message: 'Username, password and institution ID are required' });
  }

  if (institutionId.toUpperCase() !== 'JJCET') {
    return res.status(403).json({ message: 'Invalid access code' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', [username]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    await pool.query(
      'INSERT INTO users (username, password, institutionId, role) VALUES (?, ?, ?, ?)',
      [username, password, institutionId, role || 'staff']
    );

    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    handleServerError(res, err, 'Failed to register user');
  }
});

app.post('/api/users/login', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Username, password and role are required' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT username, role FROM users WHERE username = ? AND password = ? AND role = ?',
      [username, password, role]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', user: rows[0] });
  } catch (err) {
    handleServerError(res, err, 'Failed to authenticate user');
  }
});

app.get('/api/visitors', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM visitors ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    handleServerError(res, err, 'Failed to fetch visitors');
  }
});

app.post('/api/visitors', async (req, res) => {
  const visitor = req.body;
  if (!visitor || !visitor.name || !visitor.email) {
    return res.status(400).json({ message: 'Visitor name and email are required' });
  }

  try {
    const [duplicate] = await pool.query(
      'SELECT id FROM visitors WHERE email IS NOT NULL AND LOWER(email) = LOWER(?)',
      [visitor.email]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({ message: 'Visitor already exists' });
    }

    const [result] = await pool.query(
      'INSERT INTO visitors (name, email, mobile, purpose, person, date, time, status, checkInDateTime, checkOutDateTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        visitor.name,
        visitor.email,
        visitor.mobile || null,
        visitor.purpose || null,
        visitor.person || null,
        visitor.date || null,
        visitor.time || null,
        visitor.status || 'pending',
        visitor.checkInDateTime || null,
        visitor.checkOutDateTime || null
      ]
    );

    const [newVisitorRows] = await pool.query('SELECT * FROM visitors WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Visitor registered', visitor: newVisitorRows[0] });
  } catch (err) {
    handleServerError(res, err, 'Failed to register visitor');
  }
});

app.put('/api/visitors/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const allowedFields = [
    'name',
    'email',
    'mobile',
    'purpose',
    'person',
    'date',
    'time',
    'status',
    'checkInDateTime',
    'checkOutDateTime'
  ];

  const fields = Object.keys(updates).filter((key) => allowedFields.includes(key));
  if (fields.length === 0) {
    return res.status(400).json({ message: 'No valid visitor fields provided for update' });
  }

  const values = fields.map((field) => updates[field]);
  const assignments = fields.map((field) => `\`${field}\` = ?`).join(', ');

  try {
    const [result] = await pool.query(`UPDATE visitors SET ${assignments} WHERE id = ?`, [...values, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    const [updatedRows] = await pool.query('SELECT * FROM visitors WHERE id = ?', [id]);
    res.json({ message: 'Visitor updated', visitor: updatedRows[0] });
  } catch (err) {
    handleServerError(res, err, 'Failed to update visitor');
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'login.html'));
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server due to database error:', err);
    process.exit(1);
  });
