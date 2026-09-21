const express = require('express');
const path = require('path');
<<<<<<< HEAD
const mysql = require('mysql2/promise');
=======
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
>>>>>>> 0e5e44e (Initial commit)
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

<<<<<<< HEAD
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
=======
const DB_FILE = path.join(__dirname, 'db.json');
const otpChallenges = new Map();

function createMailTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

async function sendLoginOtp(email, otp) {
  const mailTransport = createMailTransport();
  if (!mailTransport) {
    return false;
  }

  await mailTransport.sendMail({
    from: {
      name: process.env.SMTP_FROM_NAME || 'JJCET INSTITUTION',
      address: process.env.SMTP_FROM || process.env.SMTP_USER
    },
    to: email,
    subject: 'Your login OTP',
    text: `Your login OTP is ${otp}. It expires in 5 minutes.`
  });
  return true;
}

function loadData() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const data = JSON.parse(raw || '{}');
      return {
          users: Array.isArray(data.users) && data.users.length ? data.users : [
            { username: 'admin', email: '', password: 'admin123', role: 'staff' },
            { username: 'student', email: '', password: 'student123', role: 'student' }
        ],
        visitors: Array.isArray(data.visitors) ? data.visitors : []
      };
    }
  } catch (err) {
    console.error('Failed to load DB file:', err);
  }

  return {
    users: [
      { username: 'admin', email: '', password: 'admin123', role: 'staff' },
      { username: 'student', email: '', password: 'student123', role: 'student' }
    ],
    visitors: []
  };
}

function saveData(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write DB file:', err);
>>>>>>> 0e5e44e (Initial commit)
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

<<<<<<< HEAD
app.post('/api/users/register', async (req, res) => {
  const { username, password, institutionId, role } = req.body;
=======
app.post('/api/users/register', (req, res) => {
  const { username, email, password, institutionId, role } = req.body;
>>>>>>> 0e5e44e (Initial commit)

  if (!username || !email || !password || !institutionId) {
    return res.status(400).json({ message: 'Username, email Id, password and institution ID are required' });
  }

  if (!/^[^\s@]+@[^\s@]+\.com$/.test(email)) {
    return res.status(400).json({ message: 'Enter valid email address' });
  }

  if (institutionId.toUpperCase() !== 'JJCET') {
    return res.status(403).json({ message: 'Invalid access code' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', [username]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Username already exists' });
    }

<<<<<<< HEAD
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
=======
  const exists = users.some((user) => user.username.toLowerCase() === username.toLowerCase() || (user.email && user.email.toLowerCase() === email.toLowerCase()));
  if (exists) {
    return res.status(409).json({ message: 'Username or email already exists' });
  }

  const newUser = { username, email, password, institutionId, role: role || 'staff' };
  users.push(newUser);
  saveData({ users, visitors: db.visitors });
  res.status(201).json({ message: 'Registration successful' });
});

app.post('/api/users/login', (req, res) => {
  res.status(401).json({ message: 'OTP validation is required. Request an OTP first.' });
});

app.post('/api/users/request-otp', async (req, res) => {
  const { username, password, role } = req.body;

  const db = loadData();
  const user = db.users.find((entry) => entry.username.toLowerCase() === String(username || '').toLowerCase() && entry.password === password && entry.role === role);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!user.email || !/^[^\s@]+@[^\s@]+\.com$/.test(user.email)) {
    return res.status(400).json({ message: 'No valid email address is registered for this username.' });
  }

  const otp = String(crypto.randomInt(100000, 1000000));
  const challengeId = crypto.randomUUID();

  try {
    if (!await sendLoginOtp(user.email, otp)) {
      return res.status(503).json({ message: 'Email service is not configured. Configure SMTP to receive OTP.' });
    }
  } catch (error) {
    console.error('Failed to send login OTP:', error);
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      return res.status(502).json({ message: 'SMTP authentication failed. Check SMTP_USER and SMTP_PASS.' });
    }
    return res.status(502).json({ message: 'Unable to send OTP email.' });
  }

  otpChallenges.set(challengeId, { username: user.username, email: user.email, role, otp, expiresAt: Date.now() + 5 * 60 * 1000 });
  res.json({ message: 'OTP sent to your email address.', challengeId });
});

app.post('/api/users/verify-otp', (req, res) => {
  const { username, role, otp, challengeId } = req.body;
  const challenge = otpChallenges.get(challengeId);

  if (!challenge || challenge.username.toLowerCase() !== String(username || '').toLowerCase() || challenge.role !== role || challenge.expiresAt < Date.now() || challenge.otp !== String(otp || '')) {
    return res.status(401).json({ message: 'Invalid OTP Entered' });
  }

  otpChallenges.delete(challengeId);
  res.json({ message: 'Login successful', user: { username: challenge.username, role } });
>>>>>>> 0e5e44e (Initial commit)
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
<<<<<<< HEAD
=======

  const newVisitor = {
    id: Date.now().toString(),
    ...visitor,
    status: visitor.status || 'pending'
  };
  visitors.push(newVisitor);
  saveData({ users: db.users, visitors });
  res.status(201).json({ message: 'Visitor registered', visitor: newVisitor });
>>>>>>> 0e5e44e (Initial commit)
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
