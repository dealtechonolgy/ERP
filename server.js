const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const JWT_SECRET = 'your-super-secret-key-change-this-in-production';

// ============================================
// قاعدة بيانات مؤقتة (في الذاكرة)
// ============================================
const users = [
  {
    id: 1,
    email: 'ahmed@construction.com',
    password: '$2a$10$5YKjQ8Z6X6X6X6X6X6X6O',
    name: 'أحمد محمد',
    system: 'construction',
    role: 'admin',
    createdAt: new Date()
  },
  {
    id: 2,
    email: 'mohamed@manufacturing.com',
    password: '$2a$10$5YKjQ8Z6X6X6X6X6X6X6O',
    name: 'محمد علي',
    system: 'manufacturing',
    role: 'admin',
    createdAt: new Date()
  }
];

// تشفير كلمة المرور بشكل صحيح
const hashPassword = (password) => bcrypt.hashSync(password, 10);

// تحديث كلمات المرور المشفرة بشكل صحيح
users[0].password = hashPassword('123456');
users[1].password = hashPassword('123456');

// ============================================
// API Routes
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, system } = req.body;
    
    // التحقق من وجود المستخدم
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'البريد الإلكتروني موجود بالفعل' });
    }
    
    // إنشاء مستخدم جديد
    const newUser = {
      id: users.length + 1,
      email,
      password: hashPassword(password),
      name,
      system: system || 'construction',
      role: 'user',
      createdAt: new Date()
    };
    
    users.push(newUser);
    
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({ 
      success: true, 
      user: userWithoutPassword,
      message: 'تم إنشاء الحساب بنجاح'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, system } = req.body;
    
    console.log('Login attempt:', { email, system });
    
    // البحث عن المستخدم
    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }
    
    // التحقق من كلمة المرور
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    
    if (!isPasswordValid) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }
    
    // التحقق من النظام
    if (system && user.system !== system) {
      console.log('System mismatch:', { userSystem: user.system, requestedSystem: system });
      return res.status(401).json({ error: 'هذا الحساب غير مسجل لهذا النظام' });
    }
    
    // إنشاء JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, system: user.system },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const { password: _, ...userWithoutPassword } = user;
    
    console.log('Login successful:', email);
    
    res.json({
      success: true,
      user: userWithoutPassword,
      token,
      message: 'تم تسجيل الدخول بنجاح'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// Get all users
app.get('/api/users', (req, res) => {
  const usersWithoutPasswords = users.map(({ password, ...user }) => user);
  res.json(usersWithoutPasswords);
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Get projects (مؤقت)
app.get('/api/projects', (req, res) => {
  res.json([
    { id: 1, name: 'برج النيل', location: 'القاهرة', budget: 25000000, progress: 64 },
    { id: 2, name: 'كمبوند الورود', location: 'الإسكندرية', budget: 18000000, progress: 26 },
    { id: 3, name: 'مول المعادي', location: 'المعادي', budget: 35000000, progress: 45 }
  ]);
});

// Get raw materials (مؤقت)
app.get('/api/raw-materials', (req, res) => {
  res.json([
    { id: 1, name: 'بلاستيك', unit: 'كجم', stock: 1000, cost: 25 },
    { id: 2, name: 'صلب', unit: 'كجم', stock: 500, cost: 45 },
    { id: 3, name: 'خشب', unit: 'متر', stock: 300, cost: 30 }
  ]);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// بدء الخادم
app.listen(PORT, () => {
  console.log(`
==================================================
  🚀 Deal ERP Backend Server
==================================================
  Server: http://localhost:${PORT}
  Health: http://localhost:${PORT}/health
  Login: POST http://localhost:${PORT}/api/auth/login
  Register: POST http://localhost:${PORT}/api/auth/register
==================================================
  `);
});
