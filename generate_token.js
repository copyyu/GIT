const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// ฟังก์ชันสร้าง short code แบบ base62 ความยาว 6 ตัว
const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function genShortCode(len = 6) {
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const lines = fs.readFileSync('emails.csv', 'utf8').split('\n');
const emails = lines.slice(1).map(line => line.trim()).filter(Boolean);

const usedCodes = new Set();
const mapping = emails.map(email => {
  let code;
  do {
    code = genShortCode();
  } while (usedCodes.has(code));
  usedCodes.add(code);
  return {
    email,
    token: uuidv4(),
    code
  };
});

fs.writeFileSync('mapping.json', JSON.stringify(mapping, null, 2));
console.log('สร้าง mapping.json เสร็จแล้ว');