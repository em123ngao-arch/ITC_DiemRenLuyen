import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Lấy trạng thái cổng chấm điểm
router.get('/grading', authMiddleware, async (req: any, res: any) => {
  try {
    const setting = await (prisma as any).setting.findUnique({
      where: { key: 'isGradingOpen' }
    });
    // Mặc định là mở nếu chưa cấu hình
    const isOpen = setting ? setting.value === 'true' : true;
    res.json({ isOpen });
  } catch (error) {
    console.error('Error fetching grading setting:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Admin bật/tắt cổng chấm điểm
router.put('/grading', authMiddleware, async (req: any, res: any) => {
  try {
    if (req.user?.role !== 'Quản trị hệ thống' && req.user?.role !== 'admin' && req.user?.role !== 'Phòng Công tác sinh viên') {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này!' });
    }

    const { isOpen } = req.body;
    const value = isOpen ? 'true' : 'false';

    await (prisma as any).setting.upsert({
      where: { key: 'isGradingOpen' },
      update: { value },
      create: { key: 'isGradingOpen', value }
    });

    res.json({ isOpen, message: 'Cập nhật trạng thái cổng thành công' });
  } catch (error) {
    console.error('Error updating grading setting:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
