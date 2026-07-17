import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Get all activities
router.get('/', authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const activities = await prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        evidences: {
          where: { userId }
        },
        registrations: {
          where: { userId }
        }
      }
    });
    
    const mappedActivities = activities.map(act => {
      const { evidences, registrations, ...rest } = act;
      return {
        ...rest,
        hasCheckedIn: evidences && evidences.length > 0,
        isRegistered: registrations && registrations.length > 0
      };
    });
    
    res.json(mappedActivities);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Get user schedule (Registered events)
router.get('/my-schedule', authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const registrations = await prisma.registration.findMany({
      where: { userId },
      include: { activity: true }
    });
    
    // Format for calendar
    const schedule = registrations.map(reg => ({
      id: reg.activityId,
      eventName: reg.activity.eventName,
      startTime: reg.activity.startTime,
      endTime: reg.activity.endTime,
      location: reg.activity.location,
      points: reg.activity.points
    }));
    
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tải lịch cá nhân' });
  }
});

// Register for an activity
router.post('/:id/register', authMiddleware, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const existing = await prisma.registration.findUnique({
      where: { userId_activityId: { userId, activityId: id } }
    });
    
    if (existing) {
      await prisma.registration.delete({
        where: { id: existing.id }
      });
      return res.json({ message: 'Đã hủy đăng ký thành công', isRegistered: false });
    } else {
      await prisma.registration.create({
        data: { userId, activityId: id }
      });
      return res.json({ message: 'Đăng ký thành công', isRegistered: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi đăng ký' });
  }
});

// Generate Dynamic QR Code & Short Code
const activeShortCodes = new Map<string, { activityId: string, expiresAt: number }>();

router.get('/:id/qrcode', authMiddleware, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    // Generate a short-lived token (expires in 15 seconds)
    const token = jwt.sign({ activityId: id }, JWT_SECRET, { expiresIn: '15s' });
    
    // Generate a 6-character short code
    const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    activeShortCodes.set(shortCode, { activityId: id, expiresAt: Date.now() + 15000 });
    
    // Cleanup old codes randomly to prevent memory leak
    if (Math.random() < 0.1) {
      const now = Date.now();
      for (const [key, value] of activeShortCodes.entries()) {
        if (value.expiresAt < now) activeShortCodes.delete(key);
      }
    }

    res.json({ token, shortCode });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tạo mã QR' });
  }
});

// Checkin for an activity
router.post('/checkin', authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { activityId, qrToken, deviceId } = req.body;
    
    let targetActivityId = activityId;

    // Verify dynamic QR if provided
    if (qrToken) {
      try {
        const decoded = jwt.verify(qrToken, JWT_SECRET) as any;
        targetActivityId = decoded.activityId;
      } catch (err) {
        return res.status(400).json({ message: 'Mã QR đã hết hạn hoặc không hợp lệ!' });
      }
    } else if (activityId && activityId.length === 6) {
      // Handle short code input
      const entry = activeShortCodes.get(activityId.toUpperCase());
      if (!entry || entry.expiresAt < Date.now()) {
        return res.status(400).json({ message: 'Mã xác nhận (Code) đã hết hạn hoặc không đúng!' });
      }
      targetActivityId = entry.activityId;
    }

    if (!targetActivityId) {
      return res.status(400).json({ message: 'Thiếu mã sự kiện!' });
    }

    // Check device fingerprint to prevent proxy check-in
    if (deviceId) {
      const existingCheckin = await prisma.evidence.findFirst({
        where: {
          activityId: targetActivityId,
          description: { startsWith: `Device:${deviceId}` }
        }
      });

      if (existingCheckin && existingCheckin.userId !== userId) {
        return res.status(403).json({ message: 'Thiết bị này đã điểm danh cho một tài khoản khác!' });
      }
    }
    
    // Auto approve evidence for check-in
    const evidence = await prisma.evidence.create({
      data: {
        userId,
        activityId: targetActivityId,
        description: deviceId ? `Device:${deviceId}` : 'Điểm danh nhập mã tay',
        status: 'Đã duyệt'
      }
    });

    const activityInfo = await prisma.activity.findUnique({ where: { id: targetActivityId } });
    
    res.json({ message: `Điểm danh thành công! Lịch sử tham gia sự kiện đã được ghi nhận.`, evidence });
  } catch (error) {
    res.status(500).json({ message: 'Bạn đã điểm danh hoạt động này hoặc có lỗi xảy ra' });
  }
});

// Create activity
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { eventName, time, location, points } = req.body;
    
    const newActivity = await prisma.activity.create({
      data: {
        eventName,
        startTime: new Date(time[0]),
        endTime: new Date(time[1]),
        location,
        points: Number(points)
      }
    });
    
    res.json(newActivity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi tạo hoạt động' });
  }
});

// Delete activity
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.activity.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Xóa hoạt động thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Update activity
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { eventName, description, points, startTime, endTime, location, status } = req.body;
    const activity = await prisma.activity.update({
      where: { id },
      data: { eventName, description, points, startTime, endTime, location, status }
    });
    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật hoạt động' });
  }
});

export default router;
