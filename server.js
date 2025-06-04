const express = require('express');
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config(); // เผื่อยังไม่ได้ require dotenv
const app = express();

const mapping = JSON.parse(fs.readFileSync('mapping.json', 'utf8'));
const codeToEmail = {};
mapping.forEach(row => { codeToEmail[row.code] = row.email; });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
}); // <--- ตรงนี้แค่นี้พอ

app.get('/file/:code', async (req, res) => {
  const code = req.params.code;
  const email = codeToEmail[code];

  if (!email) {
    return res.redirect('https://www.google.com/404');
  }

  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
  const userAgent = req.get('User-Agent') || '';
  const time = new Date().toISOString();

  try {
    await pool.query(
      'INSERT INTO clicklog(email, code, ip, useragent, time) VALUES ($1, $2, $3, $4, $5)',
      [email, code, ip.replace(/[\r\n,]/g,''), userAgent.replace(/[\r\n,]/g,''), time]
    );
  } catch (err) {
    console.error('Log insert error:', err);
  }

  res.redirect('https://drive.google.com/file/d/1JcI3u9dA_XXXXXX/view?usp=sharing');
});

app.listen(3000, () => {
  console.log('Server running: http://localhost:3000');
});