const fs = require('fs');
const nodemailer = require('nodemailer');
const mapping = require('./mapping.json');
const readline = require('readline');

// ดึงรายชื่อกลุ่มทั้งหมดจาก mapping
const allGroups = Array.from(new Set(mapping.map(row => row.group).filter(Boolean)));

if (allGroups.length === 0) {
  console.log('ไม่พบ group ใน mapping.json');
  process.exit(1);
}

console.log('กลุ่มที่สามารถเลือกส่งได้:');
allGroups.forEach((g, idx) => {
  console.log(`${idx + 1}. ${g}`);
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('พิมพ์หมายเลขกลุ่มที่ต้องการส่ง (คั่นด้วย , เช่น 1,3): ', (answer) => {
  const selectedIndexes = answer.split(',').map(s => parseInt(s.trim(), 10) - 1).filter(idx => !isNaN(idx) && idx >= 0 && idx < allGroups.length);
  if (selectedIndexes.length === 0) {
    console.log('เลือกกลุ่มไม่ถูกต้อง');
    rl.close();
    process.exit(1);
  }
  const selectedGroups = selectedIndexes.map(idx => allGroups[idx]);

  // กำหนดชุดเนื้อหาหลายแบบ (เพิ่ม/แก้ไขได้ที่นี่)
  const allContents = {
    content1: {
      subject: 'แจ้งการปรับปรุงโครงสร้างเงินเดือนปี 2568 – เอกสารภายใน',
      text: 
`
ตามนโยบายใหม่ขององค์กรเกี่ยวกับการปรับโครงสร้างเงินเดือนและค่าตอบแทน กรุณาดาวน์โหลดเอกสารแนบเพื่อดูรายละเอียดส่วนบุคคลของท่าน

{link}


โปรดเก็บเป็นความลับ ห้ามส่งต่ออีเมลนี้

แผนกทรัพยากรบุคคล
GIT HR`
    }
    // สามารถเพิ่ม content ใหม่ได้เหมือนเดิมหากต้องการ
  };

  // ฟังก์ชันวนซ้ำทีละกลุ่ม
  function processGroup(i) {
    if (i >= selectedGroups.length) {
      console.log('เสร็จสิ้นทุกกลุ่มที่เลือก');
      rl.close();
      return;
    }
    const groupName = selectedGroups[i];
    const filteredMapping = mapping.filter(row => row.group === groupName);
    if (filteredMapping.length === 0) {
      console.log(`ไม่พบอีเมลในกลุ่ม ${groupName}`);
      processGroup(i + 1);
      return;
    }
    // แสดงตัวเลือกเนื้อหา
    const contentKeys = Object.keys(allContents);
    console.log(`\nเลือกเนื้อหาที่จะใช้กับกลุ่ม ${groupName}:`);
    contentKeys.forEach((key, idx) => {
      console.log(`${idx + 1}. ${allContents[key].subject}`);
    });
    rl.question('พิมพ์หมายเลขเนื้อหาที่ต้องการใช้: ', (contentAns) => {
      const contentIdx = parseInt(contentAns.trim(), 10) - 1;
      if (isNaN(contentIdx) || contentIdx < 0 || contentIdx >= contentKeys.length) {
        console.log('เลือกเนื้อหาไม่ถูกต้อง');
        rl.close();
        process.exit(1);
      }
      const contentKey = contentKeys[contentIdx];
      const content = allContents[contentKey];
      console.log('รายชื่ออีเมลที่จะส่งในกลุ่ม', groupName);
      filteredMapping.forEach(row => {
        console.log('-', row.email);
      });
      rl.question('ต้องการส่งอีเมลให้รายชื่อข้างต้นหรือไม่? (y/n): ', (confirm) => {
        if (confirm.toLowerCase() !== 'y') {
          console.log('ยกเลิกการส่งอีเมลกลุ่มนี้');
          processGroup(i + 1);
          return;
        }
        // ตั้งค่าบัญชีอีเมลผู้ส่ง (ตัวอย่างใช้ Gmail)
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'information1081009@gmail.com',
            pass: 'bzgy kltb dmmi nqbm'
          }
        });
        filteredMapping.forEach(row => {
          const link = `https://git-p.onrender.com/file/${row.code}`;
          const text = content.text.replace('{link}', link).replace('[ชื่อพนักงาน]', row.name || 'พนักงาน');
          // ไม่ต้องแนบไฟล์ใดๆ
          const mailOptions = {
            from: 'moonlightvilip@gmail.com',
            to: row.email,
            subject: content.subject,
            text: text,
            html: `<pre>${text.replace(/\n/g, '<br>')}</pre>`
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log(`❌ ส่งให้ ${row.email} ไม่สำเร็จ:`, error);
            } else {
              console.log(`✅ ส่งให้ ${row.email} สำเร็จ:`, info.response);
            }
          });
        });
        processGroup(i + 1);
      });
    });
  }

  processGroup(0);
});