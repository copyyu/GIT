// ====== Section 1: Import ไลบรารีที่จำเป็น ======
const express = require('express');
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();
const app = express();
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);
const axios = require('axios'); // สำหรับยิง Discord webhook

// ====== Section 2: โหลด mapping และเตรียม lookup ======
const mapping = JSON.parse(fs.readFileSync('mapping.json', 'utf8'));
const codeToEmail = {};
mapping.forEach(row => { codeToEmail[row.code] = row.email; });

// ====== Section 3: ตั้งค่าการเชื่อมต่อ Postgres ======
const useSSL = process.env.DB_USE_SSL === 'true';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {})
});

// ====== Section 4: ฟังก์ชันแจ้งเตือน Discord Real-time ======
// ตั้งค่า DISCORD_WEBHOOK_URL ใน .env
async function notifyDiscord({ email, code, ip, time, userAgent }) {
  if (!process.env.DISCORD_WEBHOOK_URL) return; // ถ้าไม่ตั้ง webhook ไม่ต้องแจ้ง
  const data = {
    username: "PhishBot",
    avatar_url: "https://cdn-icons-png.flaticon.com/512/1828/1828843.png",
    embeds: [
      {
        title: "🚨 มีการคลิก link!",
        color: 0xff9900,
        description: `**Email:** ${email}\n**Code:** ${code}\n**IP:** ${ip}\n**เวลา:** ${time}`,
        footer: { text: userAgent ? userAgent.substring(0, 120) : "" }
      }
    ]
  };
  try {
    await axios.post(process.env.DISCORD_WEBHOOK_URL, data);
    console.log('แจ้ง Discord สำเร็จ');
  } catch (err) {
    console.error('แจ้ง Discord ไม่สำเร็จ:', err.message);
  }
}

// ====== Section 5: เส้นทางหลักของ express ======

// หน้า home (health check)
app.get('/', (req, res) => {
  res.send('OK');
});

// เส้นทางสำหรับ track คลิก phishing link
app.get('/file/:code', async (req, res) => {
  const code = req.params.code;
  const email = codeToEmail[code];

  // เวลาไทย (Asia/Bangkok)
  const thaiTime = dayjs().tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');
  console.log('code:', code, 'email:', email, 'เวลาไทย:', thaiTime);

  if (!email) {
    // ถ้าไม่พบ code ใน mapping ให้ redirect ไป 404 (กัน bot หรือคนมั่ว)
    return res.redirect('https://www.google.com/404');
  }

  // เก็บข้อมูล client
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
  const userAgent = req.get('User-Agent') || '';
  const time = dayjs().tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');

  // log ลง postgres
  try {
    await pool.query(
      'INSERT INTO clicklog(email, code, ip, useragent, time) VALUES ($1, $2, $3, $4, $5)',
      [email, code, ip.replace(/\r|\n|,/g,''), userAgent.replace(/\r|\n|,/g,''), time]
    );
  } catch (err) {
    console.error('Log insert error:', err); // log error
  }

  // แจ้งเตือน Discord real-time
  notifyDiscord({ email, code, ip, time, userAgent });

  // redirect ไปไฟล์ (แก้ลิงก์ไฟล์ตามจริง)
  res.redirect('https://drive.google.com/file/d/1JcI3u9dA_XXXXXX/view?usp=sharing');
});

// ====== Section 6: Start server ======
app.listen(3000, () => {
  console.log('Server running: http://localhost:3000');
});