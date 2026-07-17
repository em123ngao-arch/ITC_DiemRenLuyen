import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all users
router.get('/', authMiddleware, async (req, res) => {
  try {
    let whereClause: any = {};
    if ((req.user as any)?.role === 'Ban cán sự lớp' || (req.user as any)?.role === 'Cố vấn học tập') {
      whereClause = { classId: (req.user as any)?.classId };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: { class: true, points: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Bulk import users
router.post('/import', authMiddleware, async (req, res) => {
  try {
    const { users } = req.body;
    
    let createdCount = 0;
    for (const u of users) {
      // Upsert class
      if (u.class) {
        await prisma.class.upsert({
          where: { id: u.class },
          update: {},
          create: { id: u.class, name: u.class }
        });
      }

      const hashedPassword = await bcrypt.hash(u.password || '123456', 10);
      
      const existingUser = await prisma.user.findUnique({ where: { id: u.id } });
      
      if (existingUser) {
        // Prevent blind overwrite of class and role
        if (existingUser.classId && existingUser.classId !== u.class) {
          // Keep existing class, log warning or just don't update class
          await prisma.user.update({
            where: { id: u.id },
            data: {
              name: u.name,
              status: 'Hoạt động'
              // Skip updating classId and role
            }
          });
        } else {
          await prisma.user.update({
            where: { id: u.id },
            data: {
              name: u.name,
              // Only update role if it's currently just a student (to avoid demoting monitor)
              role: existingUser.role === 'Sinh viên' ? u.role : existingUser.role,
              classId: u.class || null,
              status: 'Hoạt động',
            }
          });
        }
      } else {
        await prisma.user.create({
          data: {
            id: u.id,
            name: u.name,
            role: u.role,
            password: hashedPassword,
            classId: u.class || null,
            status: 'Hoạt động',
          }
        });
      }
      
      createdCount++;
    }
    
    res.json({ message: `Đã import/cập nhật thành công ${createdCount} tài khoản (Bỏ qua tự động chuyển lớp/giáng chức)` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi import' });
  }
});

// Assign class monitor
router.put('/:id/role', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, classId } = req.body;

    if (role === 'Ban cán sự lớp' && classId) {
      // Demote existing monitors in the same class
      await prisma.user.updateMany({
        where: {
          classId,
          role: 'Ban cán sự lớp'
        },
        data: {
          role: 'Sinh viên'
        }
      });
    }

    if (role === 'Cố vấn học tập' && classId) {
      // Remove class assignment from existing advisors for this class
      await prisma.user.updateMany({
        where: {
          classId,
          role: 'Cố vấn học tập'
        },
        data: {
          classId: null
        }
      });
    }

    // Promote the selected user and assign class
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role, classId: classId || undefined }
    });

    res.json({ message: 'Cập nhật phân quyền thành công!', user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật phân quyền' });
  }
});

// Delete user and associated data
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting core accounts (safety check)
    const CORE_ACCOUNTS = ['admin', 'admin_dev', 'ctsv_mgr', 'ctsv01', 'ctsv_nt', 'gv_nguyen', 'gv_pham', '501250390', '501250347', 'dv_tc', 'p_dt'];
    if (CORE_ACCOUNTS.includes(id)) {
      return res.status(403).json({ message: 'Không thể xóa tài khoản hệ thống/cốt lõi!' });
    }

    // Delete related data first
    await prisma.evidence.deleteMany({ where: { userId: id } });
    await prisma.registration.deleteMany({ where: { userId: id } });
    await prisma.point.deleteMany({ where: { userId: id } });
    
    // Delete user
    await prisma.user.delete({ where: { id } });

    res.json({ message: 'Đã xóa tài khoản thành công!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi xóa tài khoản' });
  }
});

export default router;
