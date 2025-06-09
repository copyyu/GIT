const nodemailer = require('nodemailer');
const mapping = require('./mapping.json');

// ตั้งค่าบัญชีอีเมลผู้ส่ง (ตัวอย่างใช้ Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'moonlightvilip@gmail.com',      // ต้องเป็น Gmail ส่วนตัว
    pass: 'mudh pify ehvr hgoj'          // App Password 16 หลัก (ไม่มีเว้นวรรค)
  }
});

mapping.forEach(row => {
  const mailOptions = {
    from: 'moonlightvilip@gmail.com', // ชื่อผู้ส่ง
    to: row.email,                                // อีเมลผู้รับ
    subject: 'TESTLINKKK!!!!!!!!!!!!',
    text: `สวัสดีครับ

TEST01:
https://git-p.onrender.com/file/${row.code}

กรุณาอย่าเผยแพร่ลิงก์นี้ให้ผู้อื่น
ขอบคุณค่ะ/ครับ`
    // ถ้าอยากส่งแบบ HTML ให้ใช้ 'html:' แทน 'text:'
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(`❌ ส่งให้ ${row.email} ไม่สำเร็จ:`, error);
    } else {
      console.log(`✅ ส่งให้ ${row.email} สำเร็จ:`, info.response);
    }
  });
});
