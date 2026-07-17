import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Lấy danh sách minh chứng cá nhân (Kho lưu trữ)
router.get('/personal', authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const evidences = await prisma.evidence.findMany({
      where: { 
        userId, 
        status: 'Đã lưu vào kho'
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(evidences);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách minh chứng cá nhân' });
  }
});

// Lưu minh chứng mới vào Kho
router.post('/personal', authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { category, activityName, fileUrls } = req.body;
    
    if (!fileUrls || fileUrls.length === 0) {
      return res.status(400).json({ message: 'Thiếu file minh chứng' });
    }

    const createdEvidences = await Promise.all(
      fileUrls.map((url: string) => 
        prisma.evidence.create({
          data: {
            userId,
            description: activityName,
            imageUrl: url,
            category,
            status: 'Đã lưu vào kho'
          }
        })
      )
    );

    res.json({ message: 'Lưu minh chứng thành công', evidences: createdEvidences });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lưu minh chứng cá nhân' });
  }
});

export default router;
