import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table, Typography, Tag, Button, Select, Alert, message, Space, Upload, Image, Modal, Input, Spin, List } from 'antd';
import { SaveOutlined, InfoCircleOutlined, UploadOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import api from '../../utils/api';

const { Title, Text } = Typography;

export const criteriaData = [
  {
    key: 'I',
    criteria: 'I. Trách nhiệm, tinh thần và thái độ trong học tập (tối đa 20 điểm)',
    children: [
      { key: 'I.1', criteria: '1. Tinh thần vượt khó, phấn đấu vươn lên trong học tập' },
      { key: 'I.1.a', criteria: 'a. Có ý thức học tập, tham dự đầy đủ các giờ học', maxPoint: 5 },
      { key: 'I.1.b', criteria: 'b. Đi học muộn 1 lần', maxPoint: -1 },
      { key: 'I.1.c', criteria: 'c. Đi học muộn nhiều lần', maxPoint: -2 },
      { key: 'I.1.d', criteria: 'd. Nghỉ học có phép', maxPoint: -2 },
      { key: 'I.1.e', criteria: 'e. Nghỉ học không phép', maxPoint: -5 },
      { key: 'I.1.f', criteria: 'f. Bỏ giờ học ra ngoài không lý do (Cúp tiết)', maxPoint: -2 },
      { key: 'I.2', criteria: '2. Kết quả học tập' },
      { key: 'I.2.a', criteria: 'a. Kết quả học tập trung bình Học kỳ đạt loại Xuất sắc', maxPoint: 5 },
      { key: 'I.2.b', criteria: 'b. Kết quả học tập trung bình Học kỳ đạt loại Giỏi', maxPoint: 3 },
      { key: 'I.2.c', criteria: 'c. Kết quả học tập trung bình Học kỳ đạt loại Khá', maxPoint: 2 },
      { key: 'I.2.d', criteria: 'd. Đạt chứng chỉ nghề nghiệp (Tin học, Ngoại ngữ...)', maxPoint: 2 },
      { key: 'I.3', criteria: '3. Trách nhiệm và tinh thần tham gia các kỳ thi, cuộc thi' },
      { key: 'I.3.a', criteria: 'a. Không vi phạm quy chế kiểm tra, thi cử', maxPoint: 5 },
      { key: 'I.3.b', criteria: 'b. Là thí sinh tham gia các cuộc thi học thuật do Khoa/ Phòng Công tác sinh viên phát động', maxPoint: 3 },
      { key: 'I.3.c', criteria: 'c. Đạt thành tích các cuộc thi học thuật ở mục 3b', maxPoint: 4 },
      { key: 'I.3.d', criteria: 'd. Tham gia cổ vũ các hoạt động học thuật', maxPoint: 3 },
      { key: 'I.4', criteria: '4. Trách nhiệm và thái độ tham gia các hoạt động học tập, NCKH, ngoại khóa' },
      { key: 'I.4.a', criteria: 'a. Là thành viên thuộc các CLB Học thuật', maxPoint: 2 },
      { key: 'I.4.b', criteria: 'b. Có tham gia các chương trình hội thảo, workshop, tọa đàm...', maxPoint: 5 },
      { key: 'I.4.c', criteria: 'c. Tham quan thực tế doanh nghiệp/tập huấn do Phòng Công tác sinh viên tổ chức', maxPoint: 3 },
      { key: 'I.4.d', criteria: 'd. Không tham gia bất kỳ hoạt động nào', maxPoint: -5 }
    ]
  },
  {
    key: 'II',
    criteria: 'II. Trách nhiệm chấp hành pháp luật và nội quy, quy chế của Phòng Công tác sinh viên (tối đa 25 điểm)',
    children: [
      { key: 'II.1', criteria: '1. Trách nhiệm chấp hành các quy định của pháp luật đối với công dân' },
      { key: 'II.1.a', criteria: 'a. Không vi phạm pháp luật, chủ trương các cấp', maxPoint: 5 },
      { key: 'II.1.b', criteria: 'b. Không vi phạm nội quy thông báo khác của Phòng Công tác sinh viên', maxPoint: 5 },
      { key: 'II.2', criteria: '2. Trách nhiệm chấp hành các nội quy, quy chế và các quy định khác của Phòng Công tác sinh viên' },
      { key: 'II.2.a', criteria: 'a. Tham gia đầy đủ sinh hoạt lớp', maxPoint: 5 },
      { key: 'II.2.b', criteria: 'b. Tham gia đầy đủ sinh hoạt công dân HSSV, sinh hoạt đầu học kỳ', maxPoint: 4 },
      { key: 'II.2.c', criteria: 'c. Vắng sinh hoạt công dân, sinh hoạt đầu học kỳ/khóa không lý do', maxPoint: -4 },
      { key: 'II.2.d', criteria: 'd. Đóng học phí đúng hạn', maxPoint: 5 },
      { key: 'II.2.e', criteria: 'e. Đóng bảo hiểm y tế - tai nạn theo quy định', maxPoint: 3 },
      { key: 'II.2.f', criteria: 'f. Thực hiện khảo sát HĐ giảng dạy và đánh giá học tập theo chỉ thị Phòng Công tác sinh viên', maxPoint: 3 },
      { key: 'II.2.g', criteria: 'g. Hoàn tất hồ sơ HSSV', maxPoint: 3 },
      { key: 'II.2.h', criteria: 'h. Vi phạm xử lý kỷ luật mức khiển trách', maxPoint: -5 },
      { key: 'II.2.i', criteria: 'i. Vi phạm xử lý kỷ luật mức cảnh cáo', maxPoint: -10 },
      { key: 'II.2.j', criteria: 'j. Vi phạm xử lý kỷ luật mức đình chỉ học tập', maxPoint: -25 }
    ]
  },
  {
    key: 'III',
    criteria: 'III. Trách nhiệm tham gia các hoạt động CT-XH, văn hóa, văn nghệ, thể thao, phòng chống tội phạm, TNXH (tối đa 20 điểm)',
    children: [
      { key: 'III.1', criteria: '1. Trách nhiệm và hiệu quả tham gia các hoạt động rèn luyện' },
      { key: 'III.1.a', criteria: 'a. Có tham gia hoạt động cấp Khoa, cấp Trường', maxPoint: 3 },
      { key: 'III.1.b', criteria: 'b. Có tham gia hoạt động từ cấp Thành phố trở lên', maxPoint: 5 },
      { key: 'III.1.c', criteria: 'c. Có tham gia các hoạt động Đoàn - Hội', maxPoint: 3 },
      { key: 'III.1.d', criteria: 'd. Có thành tích, giải thưởng khi tham gia các hoạt động thuộc tiêu chí', maxPoint: 5 },
      { key: 'III.2', criteria: '2. Trách nhiệm tham gia các hoạt động công ích, tình nguyện, CTXH' },
      { key: 'III.2.a', criteria: 'a. Có tham gia các HĐ: Chủ nhật xanh, hiến máu nhân đạo, MHX...', maxPoint: 5 },
      { key: 'III.2.b', criteria: 'b. Tham gia các hoạt động và được khen thưởng', maxPoint: 10 },
      { key: 'III.2.c', criteria: 'c. Là cộng tác viên hỗ trợ tích cực hoạt động/ sự kiện của Phòng Công tác sinh viên', maxPoint: 3 },
      { key: 'III.2.d', criteria: 'd. Tích cực tham gia like và share các thông tin hoạt động từ các kênh của trường', maxPoint: 3 },
      { key: 'III.3', criteria: '3. Tham gia tuyên truyền, phòng chống tội phạm và các tệ nạn' },
      { key: 'III.3.a', criteria: 'a. Tham gia tuyên truyền phòng chống TNXH, an ninh mạng, bảo vệ môi trường', maxPoint: 3 },
      { key: 'III.3.b', criteria: 'b. Có những nội dung sáng tạo phù hợp phục vụ cho công tác tuyên truyền', maxPoint: 3 },
      { key: 'III.3.c', criteria: 'c. Có ý thức like và share đồng hành trong công tác truyền thông', maxPoint: 3 }
    ]
  },
  {
    key: 'IV',
    criteria: 'IV. Trách nhiệm công dân trong quan hệ cộng đồng (tối đa 15 điểm)',
    children: [
      { key: 'IV.1', criteria: '1. Tham gia tuyên truyền các chủ trương của Đảng, chính sách, pháp luật của Nhà nước' },
      { key: 'IV.1.a', criteria: 'a. Chấp hành tốt các chủ trương, chính sách, pháp luật của Đảng và Nhà nước', maxPoint: 5 },
      { key: 'IV.1.b', criteria: 'b. Thực hiện trách nhiệm công dân số, bảo vệ dữ liệu cá nhân, an toàn thông tin', maxPoint: 5 },
      { key: 'IV.1.c', criteria: 'c. Đăng tải thông tin sai sự thật', maxPoint: -5 },
      { key: 'IV.1.d', criteria: 'd. Xúc phạm cá nhân, tổ chức trên mạng xã hội', maxPoint: -5 },
      { key: 'IV.1.e', criteria: 'e. Gian lận học thuật bằng AI', maxPoint: -5 },
      { key: 'IV.1.f', criteria: 'f. Vi phạm quy định bảo mật dữ liệu', maxPoint: -5 },
      { key: 'IV.1.g', criteria: 'g. Vi phạm ATGT, trật tự công cộng', maxPoint: -5 },
      { key: 'IV.2', criteria: '2. Trách nhiệm tham gia các hoạt động xã hội được ghi nhận, biểu dương, khen thưởng' },
      { key: 'IV.2.a', criteria: 'a. Tham gia quyên góp ủng hộ quỹ hỗ trợ được phát động', maxPoint: 3 },
      { key: 'IV.2.b', criteria: 'b. Được biểu dương, khen thưởng trong tham gia các hoạt động xã hội', maxPoint: 3 },
      { key: 'IV.2.c', criteria: 'c. Có tinh thần giúp đỡ bạn học, xây dựng tập thể', maxPoint: 3 },
      { key: 'IV.2.d', criteria: 'd. Tham gia các hoạt động phục vụ cộng đồng, địa phương', maxPoint: 3 }
    ]
  },
  {
    key: 'V',
    criteria: 'V. Trách nhiệm và kết quả tham gia công tác cán bộ lớp, đoàn thể, hoặc có thành tích xuất sắc (tối đa 20 điểm)',
    children: [
      { key: 'V.1', criteria: '1. Trách nhiệm, tinh thần, thái độ, uy tín, kỹ năng tổ chức và hiệu quả công việc' },
      { key: 'V.1.a', criteria: 'a. Là Lớp trưởng, BCH Đoàn trường, BCH Hội sinh viên trường', maxPoint: 5 },
      { key: 'V.1.b', criteria: 'b. Là Lớp phó, BCH Đoàn khoa, BCH LCH SV, BCH CĐ, BCH chi hội lớp', maxPoint: 3 },
      { key: 'V.1.c', criteria: 'c. Là Đảng viên/ Đối tượng Đảng thuộc Đảng CS Việt Nam', maxPoint: 3 },
      { key: 'V.1.d', criteria: 'd. Là Đoàn viên TNCS Hồ Chí Minh', maxPoint: 2 },
      { key: 'V.1.e', criteria: 'e. Là Hội viên Hội Sinh viên Trường', maxPoint: 2 },
      { key: 'V.1.f', criteria: 'f. Là Ban Điều hành/ Ban Chủ nhiệm Câu Lạc bộ/ Đội/ Nhóm', maxPoint: 4 },
      { key: 'V.1.g', criteria: 'g. Được Đoàn thanh niên, Hội sinh viên Trường biểu dương, khen thưởng', maxPoint: 3 },
      { key: 'V.2', criteria: '2. Hỗ trợ và tham gia tích cực vào các hoạt động chung của lớp, khoa và Phòng Công tác sinh viên' },
      { key: 'V.2.a', criteria: 'a. Có ý kiến đóng góp tích cực trong công tác xây dựng phong trào thi đua học tập tốt', maxPoint: 3 },
      { key: 'V.2.b', criteria: 'b. Có đóng góp tích cực trong công tác tổ chức các hoạt động sinh hoạt', maxPoint: 3 },
      { key: 'V.3', criteria: '3. Có thành tích trong nghiên cứu khoa học, tham gia các cuộc thi, sáng kiến...' },
      { key: 'V.3.a', criteria: 'a. Sinh viên có hoàn cảnh gia đình đặc biệt khó khăn nhưng tích cực trong học tập, rèn luyện', maxPoint: 5 },
      { key: 'V.3.b', criteria: 'b. Đạt giải thưởng NCKH hoặc thi đấu cấp Khoa/trường', maxPoint: 5 },
      { key: 'V.3.c', criteria: 'c. Đạt giải thưởng NCKH hoặc thi đấu cấp tỉnh/thành phố trở lên', maxPoint: 10 },
      { key: 'V.3.d', criteria: 'd. Được biểu dương, khen thưởng từ cấp tỉnh/thành phố trở lên ("SV 5 tốt"...)', maxPoint: 10 },
      { key: 'V.3.e', criteria: 'e. Sinh viên nhận bằng khen cấp trung ương', maxPoint: 10 }
    ]
  }
];

export const TrainingScores: React.FC = () => {
  const { currentUser } = useOutletContext<{ currentUser: any }>();
  const [data] = useState(criteriaData);
  const [isEditing, setIsEditing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [proofs, setProofs] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string>('Chưa đánh giá');
  const [rejectFeedback, setRejectFeedback] = useState<string>('');
  const [appealVisible, setAppealVisible] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealProof, setAppealProof] = useState('');
  const [isGradingOpen, setIsGradingOpen] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(true);
  
  // Evidence Vault state
  const [evidenceModalVisible, setEvidenceModalVisible] = useState(false);
  const [vaultEvidences, setVaultEvidences] = useState<any[]>([]);
  const [currentEvidenceKey, setCurrentEvidenceKey] = useState<string | null>(null);

  const fetchVaultEvidences = async () => {
    try {
      const res = await api.get('/evidences/personal');
      setVaultEvidences(res.data);
    } catch (err) {
      console.error('Failed to load evidences');
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get('/settings/grading');
        setIsGradingOpen(res.data.isOpen);
      } catch (err) {
        console.error('Error fetching settings');
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const fetchPoint = async () => {
      try {
        let autoScores: any = {};
        try {
          const actRes = await api.get('/activities');
          const checkedInActs = actRes.data.filter((a: any) => a.hasCheckedIn);
          const totalActPoints = checkedInActs.reduce((sum: number, act: any) => sum + act.points, 0);
          
          if (totalActPoints > 0) {
            let remain = totalActPoints;
            const p1 = Math.min(remain, 3);
            autoScores['III.1.a'] = p1;
            remain -= p1;
            if (remain > 0) {
               autoScores['III.2.a'] = Math.min(remain, 5);
            }
          }
        } catch(e) {}

        const res = await api.get('/points/my-point');
        if (res.data) {
          const currentStatus = res.data.status || 'Chưa đánh giá';
          setStatus(currentStatus);
          
          if (currentStatus === 'Từ chối') {
            setIsEditing(true);
            if (res.data.feedback) {
              setRejectFeedback(res.data.feedback);
              message.error(`Phiếu của bạn bị từ chối với lý do: ${res.data.feedback}`);
            }
          } else {
            setIsEditing(currentStatus === 'Chưa đánh giá');
          }
          
          let savedScores = {};
          if (res.data.details) {
            try { savedScores = JSON.parse(res.data.details); } catch(e) {}
          }

          if (currentStatus === 'Chưa đánh giá' || currentStatus === 'Từ chối') {
            setScores({ ...savedScores, ...autoScores });
          } else {
            setScores(savedScores);
          }
          
          if (res.data.proofs) {
            try { setProofs(JSON.parse(res.data.proofs)); } catch(e) {}
          }
        } else {
          setScores(autoScores);
        }
      } catch (err) {
        console.error('Không thể tải điểm rèn luyện');
      }
    };
    fetchPoint();
  }, []);

  const totalScore = useMemo(() => {
    let total = 0;
    data.forEach(group => {
      let groupSum = 0;
      const maxMatch = group.criteria.match(/tối đa (\d+) điểm/);
      const maxGroupPoint = maxMatch ? parseInt(maxMatch[1]) : 100;
      
      group.children?.forEach(child => {
        if (scores[child.key]) {
          groupSum += Number(scores[child.key]);
        }
      });
      total += Math.min(groupSum, maxGroupPoint);
    });
    return Math.max(0, Math.min(100, total));
  }, [scores, data]);

  const exclusiveGroups = [
    ['I.2.a', 'I.2.b', 'I.2.c'], // Kết quả học tập
    ['II.2.h', 'II.2.i', 'II.2.j'] // Kỷ luật
  ];

  const handleScoreChange = (key: string, value: number) => {
    setScores(prev => {
      const newScores = { ...prev, [key]: value };
      
      // Handle mutually exclusive groups
      if (value !== 0) {
        exclusiveGroups.forEach(group => {
          if (group.includes(key)) {
            group.forEach(siblingKey => {
              if (siblingKey !== key) {
                newScores[siblingKey] = 0;
              }
            });
          }
        });
      }
      
      return newScores;
    });
  };

  const handleSave = async (isDraft: boolean) => {
    try {
      setLoading(true);
      
      // Clean up old event_xyz keys and only keep valid criteria keys
      const cleanScores: Record<string, number> = {};
      Object.keys(scores).forEach(key => {
        if (key.includes('.')) {
          cleanScores[key] = Number(scores[key]) || 0;
        }
      });
      const finalScore = Object.values(cleanScores).reduce((a, b) => a + b, 0);
      const boundedScore = Math.max(0, Math.min(100, finalScore));

      if (!isDraft) {
        const requireProofKeys = [
          'I.2.d', 'I.3.c', 'I.4.b', 'I.4.c',
          'III.1.a', 'III.1.b', 'III.1.c', 'III.1.d',
          'III.2.a', 'III.2.b', 'III.2.c',
          'IV.2.a', 'IV.2.b', 'IV.2.c', 'IV.2.d',
          'V.1.f', 'V.1.g',
          'V.3.b', 'V.3.c', 'V.3.d', 'V.3.e'
        ];
        
        let missingProof = '';
        for (const key of requireProofKeys) {
          if (cleanScores[key] > 0 && !proofs[key]) {
             missingProof = key;
             break;
          }
        }
        
        if (missingProof) {
          message.warning(`Cảnh báo: Bạn chưa tải minh chứng cho các mục đã chọn!`);
        }
      }

      await api.post('/points/submit', { score: boundedScore, isDraft, details: cleanScores, proofs });
      
      if (isDraft) {
        setStatus('Chưa đánh giá');
        setIsEditing(true);
        message.success('Đã lưu nháp điểm tự đánh giá thành công!');
      } else {
        setStatus('Chờ duyệt');
        setIsEditing(false); // Lock after submit
        message.success('Nộp phiếu đánh giá chính thức thành công!');
      }
    } catch (error) {
      message.error(isDraft ? 'Không thể lưu nháp!' : 'Không thể nộp phiếu đánh giá!');
    } finally {
      setLoading(false);
    }
  };

  const handleAppealSubmit = async () => {
    try {
      setLoading(true);
      await api.post('/points/appeal', { reason: appealReason, proofUrl: appealProof });
      message.success('Đã gửi đơn phúc khảo thành công!');
      setAppealVisible(false);
      setStatus('Phúc khảo');
    } catch (error) {
      message.error('Lỗi khi gửi đơn phúc khảo!');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Nội dung đánh giá',
      dataIndex: 'criteria',
      key: 'criteria',
      render: (text: string, record: any) => {
        if (record.children) return <strong className="text-blue-700 block text-[15px]">{text}</strong>;
        
        const isNumeric = /^[0-9]+\./.test(text);
        if (isNumeric) {
          const firstSpaceIndex = text.indexOf(' ');
          if (firstSpaceIndex !== -1) {
            const prefix = text.substring(0, firstSpaceIndex);
            const content = text.substring(firstSpaceIndex + 1);
            return (
              <div className="pl-4 flex font-semibold text-gray-800 mt-2 mb-1 text-[15px]">
                <span className="shrink-0 w-6">{prefix}</span>
                <span className="flex-1 leading-tight">{content}</span>
              </div>
            );
          }
          return <span className="pl-4 font-semibold text-gray-800 block mt-2 mb-1 text-[15px]">{text}</span>;
        }

        const isAlpha = /^[a-z]\./.test(text);
        if (isAlpha) {
          const firstSpaceIndex = text.indexOf(' ');
          if (firstSpaceIndex !== -1) {
            const prefix = text.substring(0, firstSpaceIndex);
            const content = text.substring(firstSpaceIndex + 1);
            return (
              <div className="pl-8 flex text-gray-700 my-1 text-[15px]">
                <span className="shrink-0 font-medium w-6">{prefix}</span>
                <span className="flex-1 leading-tight">{content}</span>
              </div>
            );
          }
        }
        
        return <span className="pl-8 block text-[15px]">{text}</span>;
      }
    },
    {
      title: 'Điểm tối đa',
      dataIndex: 'maxPoint',
      key: 'maxPoint',
      width: 120,
      align: 'center' as const,
      render: (val: number) => val ? <strong>{val}</strong> : ''
    },
    {
      title: 'SV Tự chấm',
      dataIndex: 'selfPoint',
      key: 'selfPoint',
      width: 150,
      align: 'center' as const,
      render: (val: number, record: any) => {
        if (record.children || record.maxPoint === undefined) return null;
        const currentVal = scores[record.key] || 0;
        const isAutoFilled = ['III.1.a', 'III.2.a', 'I.2.a', 'I.2.b', 'I.2.c'].includes(record.key);
        return isEditing && !isAutoFilled ? (
          <Select 
            value={currentVal} 
            onChange={(val) => handleScoreChange(record.key, val)}
            style={{ width: 80 }}
            options={[
              { label: '0', value: 0 },
              { label: record.maxPoint.toString(), value: record.maxPoint }
            ]}
          />
        ) : (
          <span className="font-bold text-blue-600">{currentVal}</span>
        );
      }
    },
    {
      title: 'Minh chứng',
      key: 'proof',
      width: 150,
      align: 'center' as const,
      render: (val: any, record: any) => {
        if (record.children || record.maxPoint === undefined) return null;
        const currentVal = scores[record.key] || 0;
        const currentProofUrl = proofs[record.key];
        
        return (
          <div className="flex flex-col items-center gap-2">
             {currentProofUrl ? (
                <div className="mt-1 bg-white p-1 border border-gray-200 rounded">
                  <Image 
                    src={api.defaults.baseURL?.replace('/api', '') + currentProofUrl} 
                    alt="Minh chứng" 
                    style={{ maxHeight: '60px', objectFit: 'contain' }} 
                  />
                </div>
             ) : (
                currentVal !== 0 ? <span className="text-red-500 text-xs font-medium">Chưa nộp minh chứng</span> : null
             )}
             
             {isEditing && currentVal !== 0 && (
                <div className="flex flex-col gap-1 w-full mt-2">
                  <Upload 
                    showUploadList={false}
                    customRequest={async (options) => {
                      const { file, onSuccess, onError } = options;
                      const formData = new FormData();
                      formData.append('file', file);
                      try {
                        const res = await api.post('/upload', formData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        setProofs(prev => ({ ...prev, [record.key]: res.data.url }));
                        onSuccess?.(res.data);
                        message.success('Tải ảnh lên thành công');
                      } catch(err) {
                        onError?.(err as any);
                        message.error('Lỗi tải ảnh');
                      }
                    }}
                  >
                    <Button size="small" className="w-full text-xs" icon={<UploadOutlined />}>{currentProofUrl ? 'Tải ảnh khác' : 'Tải lên từ máy'}</Button>
                  </Upload>
                  
                  <Button 
                    size="small" 
                    className="w-full text-xs"
                    onClick={() => {
                      setCurrentEvidenceKey(record.key);
                      setEvidenceModalVisible(true);
                      fetchVaultEvidences();
                    }}
                  >
                    Chọn từ Kho
                  </Button>
                </div>
             )}
          </div>
        );
      }
    },
    {
      title: 'BCS duyệt',
      dataIndex: 'monitorPoint',
      key: 'monitorPoint',
      width: 120,
      align: 'center' as const,
      render: () => {
        if (status === 'approved_monitor' || status === 'approved_advisor' || status === 'approved_school') {
          return <Tag color="blue">Đã duyệt</Tag>;
        }
        return <Tag color="default">Chưa duyệt</Tag>;
      }
    },
    {
      title: 'CVHT duyệt',
      dataIndex: 'advisorPoint',
      key: 'advisorPoint',
      width: 120,
      align: 'center' as const,
      render: () => {
        if (status === 'approved_advisor' || status === 'approved_school') {
          return <Tag color="blue">Đã duyệt</Tag>;
        }
        return <Tag color="default">Chưa duyệt</Tag>;
      }
    }
  ];

  if (loadingConfig) {
    return <div className="p-8 text-center"><Spin size="large" /></div>;
  }

  if (!isGradingOpen) {
    return (
      <div className="w-full max-w-[800px] mx-auto mt-12">
        <Card className="shadow-lg text-center p-8 rounded-xl border-t-4 border-t-red-500">
          <div className="text-red-500 text-6xl mb-6">🔒</div>
          <Title level={2}>Cổng chấm điểm đã đóng</Title>
          <Text type="secondary" className="text-lg">
            Hiện tại chưa đến đợt chấm điểm rèn luyện hoặc Phòng Công tác sinh viên đã khóa cổng đăng ký.<br/>
            Vui lòng theo dõi thông báo từ Phòng Công tác HSSV để biết thời gian mở cổng!
          </Text>
          <div className="mt-8">
            <Button type="primary" size="large" onClick={() => window.location.href = '/'}>
              Quay lại Trang chủ
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Title level={2}>Phiếu đánh giá Điểm rèn luyện chi tiết</Title>
          <Text type="secondary">Học kỳ 1 - Năm học 2025-2026</Text>
        </div>
        <div>
          {status === 'Chờ duyệt' && <Tag color="gold" className="text-[14px] px-3 py-1 font-medium">Chờ lớp trưởng duyệt</Tag>}
          {status === 'approved_monitor' && <Tag color="blue" className="text-[14px] px-3 py-1 font-medium">Lớp trưởng đã duyệt</Tag>}
          {status === 'approved_advisor' && <Tag color="cyan" className="text-[14px] px-3 py-1 font-medium">Cố vấn đã duyệt</Tag>}
          {status === 'approved_school' && <Tag color="green" className="text-[14px] px-3 py-1 font-medium">Trường đã duyệt</Tag>}
          {status === 'Từ chối' && <Tag color="red" className="text-[14px] px-3 py-1 font-medium">Bị từ chối</Tag>}
        </div>
      </div>

      {status === 'Từ chối' && rejectFeedback && (
        <Alert
          message={<span className="font-bold text-red-600">Phiếu đánh giá của bạn đã bị từ chối</span>}
          description={<div>Lý do từ chối: <span className="font-medium">{rejectFeedback}</span>. Vui lòng cập nhật lại điểm/minh chứng và nộp lại.</div>}
          type="error"
          showIcon
          className="shadow-sm"
        />
      )}

      <Alert
        message="Lưu ý quan trọng"
        description="Thời gian tự chấm điểm rèn luyện sẽ kết thúc vào ngày 05/01/2026. Vui lòng hoàn thành và nộp trước thời hạn."
        type="warning"
        showIcon
        icon={<InfoCircleOutlined />}
      />

      <Card className="shadow-sm">
        <Table scroll={{ x: 'max-content' }} 
          columns={columns} 
          dataSource={data} 
          pagination={false}
          bordered
          defaultExpandAllRows
        />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6 p-4 bg-gray-50 border rounded-lg">
          <Title level={4} className="!mb-0">Tổng điểm tự đánh giá: <span className="text-blue-600">{totalScore} / 100</span></Title>
          {isEditing ? (
            <Space size="middle">
              <Button 
                type="default" 
                size="large" 
                className="bg-green-600 text-white hover:bg-green-500 border-none"
                onClick={() => handleSave(true)} 
                loading={loading}
              >
                Lưu nháp
              </Button>
              <Button 
                type="primary" 
                size="large" 
                icon={<SaveOutlined />} 
                onClick={() => handleSave(false)} 
                loading={loading}
              >
                Nộp chính thức
              </Button>
            </Space>
          ) : (
            <Space size="middle" align="center">
              <Tag color={status === 'Phúc khảo' ? 'red' : 'green'} className="text-sm px-4 py-2 uppercase font-bold tracking-wider rounded m-0">
                {status === 'approved_school' ? 'ĐÃ CHỐT ĐIỂM (PHÒNG CTSV)' : status === 'Phúc khảo' ? 'ĐANG PHÚC KHẢO' : 'ĐÃ NỘP - CHỜ DUYỆT'}
              </Tag>
              {status === 'approved_school' && (
                <Button 
                  type="primary" 
                  danger 
                  size="large" 
                  onClick={() => setAppealVisible(true)}
                >
                  Làm đơn Phúc khảo
                </Button>
              )}
            </Space>
          )}
        </div>
      </Card>

      <Modal
        title="Làm đơn Phúc khảo điểm rèn luyện"
        open={appealVisible}
        onOk={handleAppealSubmit}
        onCancel={() => setAppealVisible(false)}
        okText="Gửi đơn phúc khảo"
        cancelText="Hủy"
        confirmLoading={loading}
        okButtonProps={{ danger: true }}
      >
        <Alert 
          message="Lưu ý" 
          description="Đơn phúc khảo sẽ được gửi trực tiếp lên cấp Phòng Công tác sinh viên để xem xét duyệt lại. Vui lòng ghi rõ lý do và cung cấp minh chứng hợp lệ." 
          type="warning" 
          showIcon 
          className="mb-4"
        />
        <div className="flex flex-col gap-4">
          <div>
            <Text strong>Lý do phúc khảo:</Text>
            <Input.TextArea 
              rows={4} 
              placeholder="VD: Em bị thiếu điểm ở mục Thành tích NCKH..."
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Text strong>Ảnh minh chứng (nếu có):</Text>
            <Upload 
              customRequest={async (options) => {
                const { file, onSuccess, onError } = options;
                const formData = new FormData();
                formData.append('file', file);
                try {
                  const res = await api.post('/upload', formData);
                  setAppealProof(res.data.url);
                  onSuccess?.(res.data);
                } catch (err) {
                  onError?.(err as any);
                }
              }}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} className="mt-2 ml-2">Tải ảnh lên</Button>
            </Upload>
            {appealProof && (
              <div className="mt-2">
                <Image src={api.defaults.baseURL?.replace('/api', '') + appealProof} width={100} />
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Evidence Vault Modal */}
      <Modal
        title="Chọn minh chứng từ Kho lưu trữ"
        open={evidenceModalVisible}
        onCancel={() => setEvidenceModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setEvidenceModalVisible(false)}>Đóng</Button>
        ]}
        width={600}
      >
        <List
          itemLayout="horizontal"
          dataSource={vaultEvidences}
          locale={{ emptyText: 'Chưa có minh chứng nào trong kho' }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => {
                    if (currentEvidenceKey) {
                      setProofs(prev => ({ ...prev, [currentEvidenceKey]: item.imageUrl }));
                      message.success('Đã chọn minh chứng từ kho');
                      setEvidenceModalVisible(false);
                    }
                  }}
                >
                  Chọn
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  item.imageUrl?.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                    <Image 
                      src={api.defaults.baseURL?.replace('/api', '') + item.imageUrl} 
                      width={60} 
                      height={60} 
                      className="object-cover rounded" 
                    />
                  ) : (
                    <div className="w-[60px] h-[60px] flex items-center justify-center bg-gray-100 rounded text-blue-500">File</div>
                  )
                }
                title={item.description}
                description={
                  <div className="flex gap-2 text-xs">
                    <Tag color="blue">{item.category}</Tag>
                    <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};
