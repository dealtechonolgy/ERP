const Database = require('better-sqlite3');
const db = new Database('./dev.db');

// عرض كل الجداول
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('📋 الجداول الموجودة:', tables);

// عرض بيانات المستخدمين
try {
  const users = db.prepare('SELECT id, email, name, role FROM User').all();
  console.table(users);
} catch (err) {
  console.log('⚠️ جدول User مش موجود');
}

// عرض بيانات المشاريع (لو موجودة)
try {
  const projects = db.prepare('SELECT * FROM projects LIMIT 5').all();
  console.table(projects);
} catch (err) {}

// عرض بيانات المواد الخام
try {
  const materials = db.prepare('SELECT * FROM raw_materials LIMIT 5').all();
  console.table(materials);
} catch (err) {}
