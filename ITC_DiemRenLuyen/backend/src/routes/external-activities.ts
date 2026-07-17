import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get external activities for a specific student
router.get('/my', authMiddleware, async (req: any, res) => {
  try {
    const activities = await prisma.externalActivity.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Get all pending external activities (for admin/advisor)
router.get('/pending', authMiddleware, async (req: any, res) => {
  try {
    const activities = await prisma.externalActivity.findMany({
      where: { status: 'Chờ duyệt' },
      include: { user: { select: { name: true, classId: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Submit a new external activity
router.post('/', authMiddleware, async (req: any, res) => {
  try {
    const { name, organizer, description, scoreRequest, proofUrl } = req.body;
    const activity = await prisma.externalActivity.create({
      data: {
        userId: req.user.id,
        name,
        organizer,
        description,
        scoreRequest: parseInt(scoreRequest, 10) || 0,
        proofUrl,
        status: 'Chờ duyệt'
      }
    });
    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi khai báo' });
  }
});

// Approve/Reject external activity
router.put('/:id/status', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;
    
    if (!['Quản trị hệ thống', 'Phòng Công tác sinh viên', 'Cố vấn học tập'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Không có quyền' });
    }

    const activity = await prisma.externalActivity.update({
      where: { id },
      data: { status, feedback }
    });
    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật trạng thái' });
  }
});

export default router;
