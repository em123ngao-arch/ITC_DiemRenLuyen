import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Sync academic data from training department (Real data from Excel)
router.post('/sync', authMiddleware, async (req: any, res: any) => {
  try {
    const { semester = 'HK1_2025-2026', studentsData } = req.body;
    
    if (!studentsData || !Array.isArray(studentsData)) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ!' });
    }

    const currentSemester = await prisma.semester.findUnique({ where: { id: semester } });
    if (currentSemester?.isLocked) {
      return res.status(403).json({ message: 'Học kỳ đã bị khóa, không thể đồng bộ điểm!' });
    }

    // studentsData is expected to be: [{ mssv: '5012...', rank: 'Xuất sắc' }, ...]
    
    await Promise.all(studentsData.map(async (student: any) => {
      // Find the user by id (MSSV)
      const user = await prisma.user.findUnique({ where: { id: student.mssv } });
      if (!user) return; // Skip if user not found

      const existingPoint = await prisma.point.findFirst({
        where: { userId: user.id, semester }
      });
      
      const academicKeys = ['I.2.a', 'I.2.b', 'I.2.c'];
      
      let details: any = {};
      if (existingPoint && existingPoint.details) {
        try { details = JSON.parse(existingPoint.details); } catch(e){}
      }
      
      // Reset all academic keys
      academicKeys.forEach(k => details[k] = 0);
      
      // Determine points based on rank
      const rank = (student.rank || '').toLowerCase();
      if (rank.includes('xuất sắc')) {
        details['I.2.a'] = 5;
      } else if (rank.includes('giỏi')) {
        details['I.2.b'] = 3;
      } else if (rank.includes('khá') || rank.includes('tốt')) {
        details['I.2.c'] = 2;
      }
      // If none of the above, they get 0 points for these criteria.

      const detailsStr = JSON.stringify(details);

      if (existingPoint) {
        await prisma.point.update({
          where: { id: existingPoint.id },
          data: { details: detailsStr }
        });
      } else {
        await prisma.point.create({
          data: {
            userId: user.id,
            semester,
            details: detailsStr,
            studentSelfScore: 0,
            status: 'Chưa đánh giá'
          }
        });
      }
    }));

    res.json({ message: 'Đồng bộ thành công!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Get point record of currently logged in student
router.get('/my-point', authMiddleware, async (req: any, res: any) => {
  try {
    const { semester = 'HK1_2025-2026' } = req.query;
    
    let point = await prisma.point.findFirst({
      where: {
        userId: req.user.id,
        semester
      }
    });

    res.json(point || {});
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Get statistics
router.get('/statistics', authMiddleware, async (req: any, res: any) => {
  try {
    const { semester = 'HK1_2025-2026' } = req.query;
    const points = await prisma.point.findMany({ where: { semester } });
    const stats = { excellent: 0, good: 0, fair: 0, poor: 0 };
    
    points.forEach((p: any) => {
      const score = p.studentSelfScore || 0;
      if (score >= 90) stats.excellent++;
      else if (score >= 80) stats.good++;
      else if (score >= 65) stats.fair++;
      else stats.poor++;
    });
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Submit / Save student self-evaluation score
router.post('/submit', authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { score, isDraft = false, semester = 'HK1_2025-2026', details, proofs } = req.body;
    const status = isDraft ? 'Chưa đánh giá' : 'Chờ duyệt';

    const currentSemester = await prisma.semester.findUnique({ where: { id: semester } });
    if (currentSemester?.isLocked) {
      return res.status(403).json({ message: 'Học kỳ đã bị khóa, không thể nộp điểm!' });
    }

    const existingPoint = await prisma.point.findFirst({
      where: { userId, semester }
    });

    let point;
    const lockedKeys = ['I.2.a', 'I.2.b', 'I.2.c', 'III.1.a', 'III.2.a'];

    if (existingPoint) {
      let newDetails = details ? { ...details } : {};
      let oldDetails: any = {};
      try {
        if (existingPoint.details) {
          oldDetails = JSON.parse(existingPoint.details);
        }
      } catch (e) {
        console.error(e);
      }

      // Khóa cứng giá trị: Nếu db đã có sẵn điểm tự động thì ghi đè lại giá trị từ db,
      // nếu db chưa có thì bắt buộc bằng 0 (không cho phép client tự gửi điểm khống lên).
      lockedKeys.forEach((key) => {
        if (oldDetails[key] !== undefined) {
          newDetails[key] = oldDetails[key];
        } else {
          newDetails[key] = 0;
        }
      });

      // Tính lại tổng điểm tự chấm của SV dựa trên newDetails đã được lọc sạch
      const groupMaxes: Record<string, number> = { 'I': 20, 'II': 25, 'III': 20, 'IV': 15, 'V': 20 };
      const groupSums: Record<string, number> = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, 'V': 0 };
      
      Object.keys(newDetails).forEach(k => {
        if (k.includes('.')) {
          const group = k.split('.')[0];
          if (groupSums[group] !== undefined) {
            groupSums[group] += Number(newDetails[k]) || 0;
          }
        }
      });
      
      let studentScore = 0;
      Object.keys(groupSums).forEach(group => {
        studentScore += Math.min(groupSums[group], groupMaxes[group]);
      });

      // Calculate activity points and unmapped bonus
      const evidences = await prisma.evidence.findMany({
        where: { userId },
        include: { activity: true }
      });
      const activityPoints = evidences.reduce((sum, ev) => sum + (ev.activity?.points || 0), 0);
      const mappedPoints = Math.min(activityPoints, 8);
      const unmappedBonus = activityPoints - mappedPoints;
      
      studentScore += unmappedBonus;
      studentScore = Math.max(0, Math.min(100, studentScore));

      point = await prisma.point.update({
        where: { id: existingPoint.id },
        data: {
          studentSelfScore: Number(studentScore),
          status: status,
          details: JSON.stringify(newDetails),
          proofs: proofs ? JSON.stringify(proofs) : existingPoint.proofs,
          monitorScore: null,
          advisorScore: null,
          finalScore: null
        }
      });
    } else {
      let newDetails = details ? { ...details } : {};
      // Bắt buộc reset các cột tự động về 0 nếu tạo mới bảng điểm trực tiếp (chưa đồng bộ Excel/quét QR)
      lockedKeys.forEach((key) => {
        newDetails[key] = 0;
      });

      const groupMaxes: Record<string, number> = { 'I': 20, 'II': 25, 'III': 20, 'IV': 15, 'V': 20 };
      const groupSums: Record<string, number> = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, 'V': 0 };
      
      Object.keys(newDetails).forEach(k => {
        if (k.includes('.')) {
          const group = k.split('.')[0];
          if (groupSums[group] !== undefined) {
            groupSums[group] += Number(newDetails[k]) || 0;
          }
        }
      });
      
      let studentScore = 0;
      Object.keys(groupSums).forEach(group => {
        studentScore += Math.min(groupSums[group], groupMaxes[group]);
      });

      // Calculate activity points and unmapped bonus
      const evidences = await prisma.evidence.findMany({
        where: { userId },
        include: { activity: true }
      });
      const activityPoints = evidences.reduce((sum, ev) => sum + (ev.activity?.points || 0), 0);
      const mappedPoints = Math.min(activityPoints, 8);
      const unmappedBonus = activityPoints - mappedPoints;
      
      studentScore += unmappedBonus;
      studentScore = Math.max(0, Math.min(100, studentScore));

      point = await prisma.point.create({
        data: {
          userId,
          semester,
          studentSelfScore: Number(studentScore),
          status: status,
          details: JSON.stringify(newDetails),
          proofs: proofs ? JSON.stringify(proofs) : null
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        pointId: point.id,
        actionBy: req.user.id,
        actionName: status,
        comment: isDraft ? 'Lưu nháp' : 'Nộp phiếu điểm'
      }
    });

    res.json(point);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi nộp điểm' });
  }
});

// Nộp đơn phúc khảo (Student)
router.post('/appeal', authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { reason, proofUrl, semester = 'HK1_2025-2026' } = req.body;

    const currentSemester = await prisma.semester.findUnique({ where: { id: semester } });
    if (currentSemester?.isLocked) {
      return res.status(403).json({ message: 'Học kỳ đã bị khóa, không thể nộp đơn phúc khảo!' });
    }

    const existingPoint = await prisma.point.findFirst({
      where: { userId, semester }
    });

    if (!existingPoint) {
      return res.status(400).json({ message: 'Chưa có bảng điểm để phúc khảo' });
    }

    let currentDetails: any = {};
    try {
      if (existingPoint.details) currentDetails = JSON.parse(existingPoint.details);
    } catch(e) {}
    
    currentDetails['appealReason'] = reason;
    currentDetails['appealProof'] = proofUrl;

    const point = await prisma.point.update({
      where: { id: existingPoint.id },
      data: {
        status: 'Phúc khảo',
        details: JSON.stringify(currentDetails)
      }
    });

    await prisma.auditLog.create({
      data: {
        pointId: point.id,
        actionBy: req.user.id,
        actionName: 'Phúc khảo',
        comment: reason
      }
    });

    res.json(point);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi nộp đơn phúc khảo' });
  }
});

// Grade/Approve point (Monitor / Advisor / School)
router.put('/:userId/grade', authMiddleware, async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { score, status, feedback, details, semester = 'HK1_2025-2026' } = req.body;

    const currentSemester = await prisma.semester.findUnique({ where: { id: semester } });
    if (currentSemester?.isLocked) {
      return res.status(403).json({ message: 'Học kỳ đã bị khóa, không thể duyệt điểm!' });
    }

    const existingPoint = await prisma.point.findFirst({
      where: { userId, semester }
    });

    const updateData: any = { status };
    if (details) {
      updateData.details = typeof details === 'string' ? details : JSON.stringify(details);
    }
    if (feedback) {
      let displayRole = 'Người duyệt';
      if (req.user?.role === 'Sinh viên' || req.user?.role === 'student') displayRole = 'Lớp trưởng';
      else if (req.user?.role === 'Quản trị hệ thống' || req.user?.role === 'admin') displayRole = 'Phòng Công tác sinh viên';
      else if (req.user?.role) displayRole = req.user.role;
      
      const reviewerName = req.user?.name || 'Vô danh';
      updateData.feedback = `${displayRole} (${reviewerName}): ${feedback}`;
    }
    
    if (status === 'approved_monitor') {
      updateData.monitorScore = Number(score);
    } else if (status === 'approved_advisor') {
      if (!existingPoint || (existingPoint.status !== 'approved_monitor' && existingPoint.status !== 'approved_advisor' && existingPoint.status !== 'approved_school')) {
        return res.status(403).json({ message: 'Lớp trưởng phải duyệt trước khi Cố vấn học tập có thể duyệt!' });
      }
      updateData.advisorScore = Number(score);
    } else if (status === 'approved_school') {
      if (!existingPoint || (existingPoint.status !== 'approved_advisor' && existingPoint.status !== 'approved_school' && existingPoint.status !== 'Phúc khảo')) {
        return res.status(403).json({ message: 'Cố vấn học tập phải duyệt trước khi Phòng Công tác sinh viên có thể duyệt!' });
      }
      updateData.finalScore = Number(score);
    } else if (status === 'Từ chối') {
      // Khi bị từ chối, có thể reset điểm của monitor/advisor nếu cần, nhưng để an toàn cứ giữ nguyên
      // Chỉ cập nhật trạng thái và feedback
    }

    let point;
    if (existingPoint) {
      point = await prisma.point.update({
        where: { id: existingPoint.id },
        data: updateData
      });
    } else {
      point = await prisma.point.create({
        data: {
          userId,
          semester,
          studentSelfScore: 0,
          ...updateData
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        pointId: point.id,
        actionBy: req.user?.id || 'system',
        actionName: status,
        comment: feedback || ''
      }
    });

    res.json(point);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi duyệt điểm' });
  }
});

// Get audit logs for a point
router.get('/:pointId/audit-logs', authMiddleware, async (req: any, res: any) => {
  try {
    const { pointId } = req.params;
    const logs = await prisma.auditLog.findMany({
      where: { pointId },
      orderBy: { createdAt: 'desc' }
    });
    
    const users = await prisma.user.findMany({
      where: { id: { in: logs.map((l: any) => l.actionBy) } },
      select: { id: true, name: true, role: true }
    });
    
    const logsWithUser = logs.map((l: any) => {
      const u = users.find((user: any) => user.id === l.actionBy);
      return { ...l, userName: u?.name || 'Vô danh', userRole: u?.role || '' };
    });
    
    res.json(logsWithUser);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
