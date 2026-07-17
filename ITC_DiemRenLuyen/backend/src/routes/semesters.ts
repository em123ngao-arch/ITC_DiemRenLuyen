import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all semesters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const semesters = await prisma.semester.findMany({
      orderBy: { startDate: 'desc' }
    });
    res.json(semesters);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Create semester
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { id, name, startDate, endDate } = req.body;
    const semester = await prisma.semester.create({
      data: {
        id,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      }
    });
    res.json(semester);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tạo học kỳ' });
  }
});

// Update semester lock status
router.put('/:id/lock', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isLocked } = req.body;
    const semester = await prisma.semester.update({
      where: { id },
      data: { isLocked }
    });
    res.json(semester);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật khóa' });
  }
});

// Delete semester
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.semester.delete({ where: { id } });
    res.json({ message: 'Đã xóa học kỳ' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa học kỳ' });
  }
});

export default router;
