import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // TODO: In a real app we fetch from DB
    // For now, let's allow "admin" "admin"
    if (username === 'admin' && password === 'admin') {
      const token = jwt.sign(
        { id: 'admin', role: 'Quản trị hệ thống', name: 'Trần Thị Mai' },
        JWT_SECRET,
        { expiresIn: '1d' }
      );
      return res.json({
        token,
        user: { id: 'admin', role: 'Quản trị hệ thống', name: 'Trần Thị Mai' }
      });
    }

    const user = await prisma.user.findUnique({ where: { id: username } });
    if (!user) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mật khẩu không chính xác!' });
    }

    if (user.status !== 'Hoạt động') {
      return res.status(403).json({ message: 'Tài khoản của bạn đang bị khóa!' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, classId: user.classId },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ message: 'Đăng nhập thành công', token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
  }
});

// Demo login without password
router.post('/demo-login', async (req, res) => {
  try {
    const { username } = req.body;
    
    // Find or create user for demo
    let user = await prisma.user.findUnique({ where: { id: username } });
    
    if (!user) {
      // Mock roles based on username
      let role = 'Sinh viên';
      if (username === 'admin_dev') role = 'Quản trị hệ thống';
      if (username === 'gv_nguyen') role = 'Cố vấn học tập';
      if (username === 'ctsv_nt') role = 'Phòng Công tác sinh viên';
      if (username === 'dv_tc') role = 'Đơn vị tổ chức hoạt động';
      if (username === 'p_dt') role = 'Phòng Đào tạo';
      if (username === '501250390') role = 'Ban cán sự lớp';

      user = await prisma.user.create({
        data: {
          id: username,
          name: `Demo ${role}`,
          role: role,
          password: 'demo' // placeholder
        }
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, classId: user.classId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ message: 'Đăng nhập nhanh thành công', token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi đăng nhập nhanh' });
  }
});

export default router;
