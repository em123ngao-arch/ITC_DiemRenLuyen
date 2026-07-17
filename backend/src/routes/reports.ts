import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Báo cáo tình trạng xét duyệt theo lớp
router.get('/status', authMiddleware, async (req: any, res: any) => {
  try {
    const { semester = 'HK1_2025-2026' } = req.query;
    const classes = await prisma.class.findMany({
      include: {
        users: {
          where: { role: { in: ['Sinh viên', 'student'] } },
          include: {
            points: {
              where: { semester }
            }
          }
        }
      }
    });

    const report = classes.map(c => {
      const totalStudents = c.users.length;
      let submitted = 0;
      let approvedSchool = 0;

      c.users.forEach(u => {
        const p = u.points[0];
        if (p && p.status !== 'Chưa đánh giá') {
          submitted++;
        }
        if (p && p.status === 'approved_school') {
          approvedSchool++;
        }
      });

      return {
        classId: c.id,
        className: c.name,
        totalStudents,
        submitted,
        approvedSchool,
        completionRate: totalStudents ? Math.round((approvedSchool / totalStudents) * 100) : 0
      };
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Danh sách sinh viên bị từ chối / thiếu minh chứng
router.get('/issues', authMiddleware, async (req: any, res: any) => {
  try {
    const { semester = 'HK1_2025-2026' } = req.query;
    const points = await prisma.point.findMany({
      where: {
        semester,
        OR: [
          { status: 'Từ chối' },
          { proofs: null }, // Thiếu minh chứng
          { proofs: '{}' }
        ]
      },
      include: {
        user: {
          select: { id: true, name: true, classId: true }
        }
      }
    });

    const report = points.map(p => ({
      userId: p.user.id,
      userName: p.user.name,
      classId: p.user.classId,
      status: p.status,
      issue: p.status === 'Từ chối' ? 'Hồ sơ bị từ chối' : 'Chưa nộp/thiếu minh chứng',
      feedback: p.feedback
    }));

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
