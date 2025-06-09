const express = require('express');
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config(); // เผื่อยังไม่ได้ require dotenv
const app = express();
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

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
  const referrer = req.get('Referer') || '';
  const time_clicked = new Date().toISOString();

  // GeoIP
  const geo = geoip.lookup(ip) || {};
  // User Agent
  const parser = new UAParser();
  const ua = parser.setUA(userAgent).getResult();

  // Campaign name (query param หรือ default)
  const campaign_name = req.query.campaign || 'default';

  // Reaction time (null ถ้าไม่มี landing page)
  const reaction_time = null;

  try {
    await pool.query(
      `INSERT INTO clicklog(
        email, code, ip, location_country, location_city, useragent,
        device_type, os, browser, referrer, campaign_name, time_clicked, reaction_time
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        email,
        code,
        ip.replace(/\r|\n|,/g, ''),
        geo.country || '',
        geo.city || '',
        userAgent.replace(/\r|\n|,/g, ''),
        ua.device.type || '',
        ua.os.name + ' ' + ua.os.version,
        ua.browser.name + ' ' + ua.browser.version,
        referrer,
        campaign_name,
        time_clicked,
        reaction_time
      ]
    );
  } catch (err) {
    console.error('Log insert error:', err);
  }

  res.redirect('https://drive.google.com/file/d/1JcI3u9dA_XXXXXX/view?usp=sharing');
});

app.listen(3000, () => {
  console.log('Server running: http://localhost:3000');
});
