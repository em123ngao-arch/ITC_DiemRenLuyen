import React, { useState, useMemo, useEffect } from 'react';
import { Table, Tag, Button, Typography, Row, Col, Card, Image, Input, Space, message, Modal, Select, Popconfirm, AutoComplete, Timeline } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, CheckSquareOutlined, CrownOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import api from '../../utils/api';
import dayjs from 'dayjs';
import { criteriaData } from '../student/TrainingScores';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const initialMockStudents = [
  { id: '501250347', name: 'Nguyễn Anh Đô', class: 'CLC01', status: 'pending', total: 85 },
  { id: '501250117', name: 'Trần Vũ Giang Anh', class: 'CLC01', status: 'approved_monitor', total: 90 },
  { id: '501250397', name: 'Phan Tạ Hữu Đức', class: 'CLC01', status: 'approved_advisor', total: 88 },
  { id: '501250433', name: 'Lê Thanh Hậu', class: 'CLC02', status: 'pending', total: 70 },
  { id: '501250122', name: 'Phạm Văn A', class: 'CLC02', status: 'approved_school', total: 65 },
];

export const TeamGrading: React.FC = () => {
  const { currentUser } = useOutletContext<{ currentUser: any }>();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('CLC01');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    if (selectedStudent && selectedStudent.pointsData) {
      api.get(`/points/${selectedStudent.pointsData.id}/audit-logs`)
        .then(res => setAuditLogs(res.data))
        .catch(() => setAuditLogs([]));
    } else {
      setAuditLogs([]);
    }
  }, [selectedStudent]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      const usersData = res.data.map((u: any) => {
        const p = u.points && u.points.length > 0 ? u.points[0] : null;
        let score = p ? p.studentSelfScore : 0;
        let frontendStatus = 'pending';
        
        if (!p || p.status === 'Chưa đánh giá') {
          frontendStatus = 'not_submitted';
          score = p ? p.studentSelfScore : 0;
        } else if (p?.finalScore !== null && p?.finalScore !== undefined) {
          score = p.finalScore;
          frontendStatus = 'approved_school';
        } else if (p?.advisorScore !== null && p?.advisorScore !== undefined) {
          score = p.advisorScore;
          frontendStatus = 'approved_advisor';
        } else if (p?.monitorScore !== null && p?.monitorScore !== undefined) {
          score = p.monitorScore;
          frontendStatus = 'approved_monitor';
        }
        
        return {
          id: u.id,
          name: u.name,
          class: u.classId || 'Chưa phân lớp',
          role: u.role,
          status: frontendStatus,
          total: score,
          pointsData: p
        };
      });
      setStudents(usersData);
      
      // Auto select the first class available
      const classSet = new Set(usersData.map((u: any) => u.class));
      const classesArr = Array.from(classSet) as string[];
      if (classesArr.length > 0 && !classesArr.includes(selectedClass)) {
        setSelectedClass(classesArr[0]);
      }
    } catch (error) {
      message.error('Không thể tải dữ liệu sinh viên!');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (currentUser && (currentUser.role === 'Ban cán sự lớp' || currentUser.role === 'Cố vấn học tập') && currentUser.classId) {
      setSelectedClass(currentUser.classId);
    }
  }, [currentUser]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => s.class === selectedClass);
  }, [students, selectedClass]);

  const classes = useMemo(() => {
    const classSet = new Set(students.map(s => s.class));
    return Array.from(classSet).sort((a, b) => a.localeCompare(b));
  }, [students]);

  const columns = [
    {
      title: 'MSSV',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Họ và tên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Chưa tự ĐG (Nháp)', value: 'not_submitted' },
        { text: 'Chờ duyệt', value: 'pending' },
        { text: 'Lớp trưởng duyệt', value: 'approved_monitor' },
        { text: 'Cố vấn duyệt', value: 'approved_advisor' },
        { text: 'Trường đã duyệt', value: 'approved_school' },
      ],
      onFilter: (value: any, record: any) => record.status === value,
      render: (status: string) => {
        if (status === 'Từ chối') return <Tag color="red">Bị từ chối</Tag>;
        if (status === 'Chưa đánh giá') return <Tag color="default">Chưa nộp (Nháp)</Tag>;
        if (status === 'approved_school') return <Tag color="green">Trường đã duyệt</Tag>;
        
        if (currentUser?.role === 'Cố vấn học tập') {
           if (status === 'Chờ duyệt') return <Tag color="default" className="text-gray-500">Lớp trưởng chưa duyệt</Tag>;
           if (status === 'approved_monitor') return <Tag color="gold">Chờ CVHT duyệt</Tag>;
           if (status === 'approved_advisor') return <Tag color="cyan">Đã duyệt (Chờ Trường)</Tag>;
        }
        if (currentUser?.role === 'Quản trị hệ thống' || currentUser?.role === 'Phòng Công tác sinh viên') {
           if (status === 'Chờ duyệt') return <Tag color="default" className="text-gray-500">Lớp trưởng chưa duyệt</Tag>;
           if (status === 'approved_monitor') return <Tag color="default" className="text-gray-500">CVHT chưa duyệt</Tag>;
           if (status === 'approved_advisor') return <Tag color="gold">Chờ Trường duyệt</Tag>;
        }
        
        // Default for Monitor
        if (status === 'Chờ duyệt') return <Tag color="gold">Chờ Lớp trưởng duyệt</Tag>;
        if (status === 'approved_monitor') return <Tag color="blue">Đã duyệt (Chờ CVHT)</Tag>;
        if (status === 'approved_advisor') return <Tag color="cyan">CVHT đã duyệt</Tag>;
        
        return <Tag color="default">{status}</Tag>;
      },
    },
    {
      title: 'Điểm Tự ĐG',
      dataIndex: 'total',
      key: 'total',
      render: (total: number, record: any) => {
        if (record.status === 'not_submitted') return <span className="font-bold text-gray-400">{total} (Nháp)</span>;
        return <span className="font-bold text-blue-600">{total}</span>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => {
        let isEnabled = true;
        let tooltipMsg = '';

        if (record.status === 'not_submitted' || record.status === 'Chưa đánh giá' || record.status === 'Từ chối') {
          isEnabled = false;
          tooltipMsg = 'Sinh viên chưa nộp bảng điểm';
        } else if (currentUser?.role === 'Cố vấn học tập' && record.status === 'Chờ duyệt') {
          isEnabled = false;
          tooltipMsg = 'Lớp trưởng chưa duyệt';
        } else if ((currentUser?.role === 'Quản trị hệ thống' || currentUser?.role === 'Phòng Công tác sinh viên') && (record.status === 'Chờ duyệt' || record.status === 'approved_monitor')) {
          isEnabled = false;
          tooltipMsg = record.status === 'Chờ duyệt' ? 'Lớp trưởng chưa duyệt' : 'CVHT chưa duyệt';
        } else if (record.status === 'approved_school') {
          isEnabled = false; // Đã chốt điểm cuối
        }

        return (
          <Button 
            type="primary" 
            ghost 
            icon={<EyeOutlined />} 
            onClick={() => setSelectedStudent(record)}
            disabled={!isEnabled}
            title={tooltipMsg}
          >
            Chấm điểm
          </Button>
        );
      },
    },
  ];

  // Logic to determine which status to assign based on user role
  const getNextStatus = () => {
    if (currentUser?.role === 'Quản trị hệ thống' || currentUser?.role === 'Phòng Công tác sinh viên') return 'approved_school';
    if (currentUser?.role === 'Cố vấn học tập') return 'approved_advisor';
    return 'approved_monitor'; // Default to monitor
  };

  const getRequiredPreviousStatus = () => {
    if (currentUser?.role === 'Quản trị hệ thống' || currentUser?.role === 'Phòng Công tác sinh viên') return 'approved_advisor';
    if (currentUser?.role === 'Cố vấn học tập') return 'approved_monitor';
    return 'Chờ duyệt';
  };

  const handleApproveSingle = async () => {
    const nextStatus = getNextStatus();
    try {
      await api.put(`/points/${selectedStudent.id}/grade`, {
        score: selectedStudent.total,
        status: nextStatus
      });
      message.success(`Đã duyệt điểm cho sinh viên ${selectedStudent.name}`);
      
      setStudents(prev => prev.map(s => {
        if (s.id === selectedStudent.id) {
          return { ...s, status: nextStatus };
        }
        return s;
      }));
      
      setSelectedStudent(null);
    } catch (error) {
      message.error('Lỗi khi duyệt điểm!');
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      message.error('Vui lòng nhập lý do bác bỏ!');
      return;
    }
    try {
      await api.put(`/points/${selectedStudent.id}/grade`, {
        score: 0,
        status: 'Từ chối',
        feedback: rejectReason
      });
      message.warning(`Đã bác bỏ điểm của sinh viên ${selectedStudent.name}`);
      
      setStudents(prev => prev.map(s => {
        if (s.id === selectedStudent.id) {
          return { ...s, status: 'Từ chối' };
        }
        return s;
      }));

      setIsRejectModalOpen(false);
      setSelectedStudent(null);
      setRejectReason('');
    } catch (error) {
      message.error('Lỗi khi bác bỏ điểm!');
    }
  };

  const handleApproveAll = async () => {
    const nextStatus = getNextStatus();
    const requiredStatus = getRequiredPreviousStatus();
    
    try {
      const eligibleStudents = filteredStudents.filter(s => s.status === requiredStatus);
      if (eligibleStudents.length === 0) {
        message.info('Không có sinh viên nào cần duyệt!');
        return;
      }
      
      await Promise.all(eligibleStudents.map(s => 
        api.put(`/points/${s.id}/grade`, {
          score: s.total,
          status: nextStatus
        })
      ));

      message.success(`Đã duyệt toàn bộ điểm hợp lệ cho lớp ${selectedClass}`);
      setStudents(prev => prev.map(s => {
        if (s.class === selectedClass && s.status === requiredStatus) {
          return { ...s, status: nextStatus };
        }
        return s;
      }));
    } catch (error) {
      message.error('Có lỗi xảy ra khi duyệt toàn bộ!');
    }
  };

  return (
    <div className="gap-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <Title level={2}>Duyệt điểm tập thể lớp</Title>
          <Text type="secondary">
            Quy trình: Sinh viên tự ĐG {'->'} Lớp trưởng duyệt {'->'} Cố vấn học tập duyệt {'->'} Trường duyệt
          </Text>
        </div>
      </div>

      <Card className="shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <div className="flex items-center gap-3">
              <Text strong>Chọn lớp quản lý:</Text>
              <Select 
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}
                value={selectedClass} 
                onChange={(val) => {
                  setSelectedClass(val);
                  setSelectedStudent(null);
                }} 
                style={{ width: 150 }}
                disabled={!!currentUser?.classId && (currentUser?.role === 'Ban cán sự lớp' || currentUser?.role === 'Cố vấn học tập')}
              >
                {classes.map(c => <Option key={c} value={c as string}>{c as string}</Option>)}
              </Select>
            </div>

            {/* Phân công lớp trưởng cho CVHT / Phòng Công tác sinh viên */}
            {(currentUser?.role === 'Cố vấn học tập' || currentUser?.role === 'Quản trị hệ thống' || currentUser?.role === 'Phòng Công tác sinh viên') && (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 p-2 rounded-lg max-w-md w-full">
                <CrownOutlined className="text-yellow-600 text-lg" />
                <span className="font-medium text-gray-700 whitespace-nowrap">Lớp trưởng:</span>
                <Select
                  showSearch
                  allowClear
                  className="flex-1 min-w-[200px]"
                  placeholder="Nhập tên sinh viên để gán quyền..."
                  value={filteredStudents.find(s => s.role === 'Ban cán sự lớp')?.id || undefined}
                  options={filteredStudents.map(u => ({ value: u.id, label: `${u.name} (${u.id})` }))}
                  onChange={async (value) => {
                    if (!value) return;
                    try {
                      await api.put(`/users/${value}/role`, { role: 'Ban cán sự lớp', classId: selectedClass });
                      message.success('Đã phân công lớp trưởng mới!');
                      fetchUsers();
                    } catch (error) {
                      message.error('Lỗi khi phân công!');
                    }
                  }}
                  filterOption={(inputValue, option: any) =>
                    option!.label.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                  }
                />
              </div>
            )}
          </div>
          
          <Popconfirm
            title="Duyệt tất cả sinh viên?"
            description="Bạn có chắc duyệt tất cả hồ sơ hợp lệ không?"
            onConfirm={handleApproveAll}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button type="primary" size="large" icon={<CheckSquareOutlined />}>Duyệt nhanh toàn bộ</Button>
          </Popconfirm>
        </div>
      </Card>

      <div className="flex-grow flex flex-col lg:flex-row gap-6">
        {/* Left/Main Content - DataTable */}
        <div className={`transition-all duration-300 ${selectedStudent ? 'lg:w-1/2' : 'w-full'}`}>
          <Card className="shadow-sm h-full" styles={{ body: { padding: 0 } }}>
            <Table scroll={{ x: 'max-content' }} 
              columns={columns} 
              dataSource={filteredStudents} 
              rowKey="id"
              pagination={{ pageSize: 10 }}
              rowClassName={(record) => record.id === selectedStudent?.id ? 'bg-blue-50' : ''}
            />
          </Card>
        </div>

        {/* Right Content - Split Screen Grading */}
        {selectedStudent && (
          <div className="lg:w-1/2 w-full h-full">
            <Card className="shadow-sm h-full flex flex-col relative" title={`Đánh giá: ${selectedStudent.name} (${selectedStudent.id})`}
              extra={<Button type="text" icon={<CloseOutlined />} onClick={() => setSelectedStudent(null)} />}>
              
              <div className="flex-grow overflow-y-auto pr-2 pb-16">
                <Title level={5}>Chi tiết tự đánh giá & Minh chứng</Title>
                <div className="bg-gray-50 p-4 rounded-md mb-4 border border-gray-200">
                  {(() => {
                    if (!selectedStudent.pointsData) return <Text>Sinh viên chưa nộp phiếu điểm.</Text>;
                    let details: any = {};
                    let proofs: any = {};
                    try { details = JSON.parse(selectedStudent.pointsData.details || '{}'); } catch(e){}
                    try { proofs = JSON.parse(selectedStudent.pointsData.proofs || '{}'); } catch(e){}
                    
                    const renderedItems: JSX.Element[] = [];
                    criteriaData.forEach((group: any) => {
                       group.children?.forEach((child: any) => {
                          if (details[child.key]) {
                             const score = details[child.key];
                             const proofUrl = proofs[child.key];
                             renderedItems.push(
                               <div key={child.key} className="mb-3 pb-3 border-b border-gray-200 last:border-0">
                                 <div className="flex flex-col sm:flex-row justify-between gap-4 mb-1">
                                   <Text className="flex-1 pr-4">{child.criteria}</Text>
                                   <Text className="font-bold text-blue-600 shrink-0">{score}/{child.maxPoint}</Text>
                                 </div>
                                 {proofUrl && (
                                   <div className="mt-2 bg-white p-2 border border-gray-200 rounded text-center">
                                     <Text className="block text-xs text-gray-500 mb-1 text-left">Ảnh minh chứng:</Text>
                                     <Image 
                                       src={api.defaults.baseURL?.replace('/api', '') + proofUrl} 
                                       alt="Minh chứng" 
                                       style={{ maxHeight: '150px', objectFit: 'contain' }}
                                     />
                                   </div>
                                 )}
                               </div>
                             );
                          }
                       });
                    });

                    if (renderedItems.length === 0) return <Text>Chưa có chi tiết điểm hoặc chưa chọn điểm nào.</Text>;
                    return (
                      <>
                        {renderedItems}
                        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-4 pt-2 border-t-2 border-gray-300">
                          <Text strong>Tổng điểm (Tự ĐG):</Text>
                          <Text className="font-bold text-blue-600 text-lg">{selectedStudent.total}/100</Text>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <Title level={5} className="mt-6">Lịch sử xét duyệt (Audit Log)</Title>
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  {auditLogs.length > 0 ? (
                    <Timeline
                      items={auditLogs.map((log: any) => ({
                        children: (
                          <>
                            <div className="font-medium text-blue-600">{log.actionName} - {log.userName} ({log.userRole})</div>
                            <div className="text-xs text-gray-500">{dayjs(log.createdAt).format('DD/MM/YYYY HH:mm')}</div>
                            {log.comment && <div className="text-sm mt-1 bg-yellow-50 p-2 rounded border border-yellow-100">{log.comment}</div>}
                          </>
                        )
                      }))}
                    />
                  ) : (
                    <Text type="secondary">Chưa có lịch sử xét duyệt</Text>
                  )}
                </div>
              </div>

              {/* Action Buttons Pinned at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex justify-end gap-3 rounded-b-lg">
                <Button danger onClick={() => setIsRejectModalOpen(true)}>Bác bỏ</Button>
                <Button type="primary" icon={<CheckOutlined />} onClick={handleApproveSingle}>Duyệt ({currentUser?.role})</Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      <Modal
        title="Bác bỏ điểm"
        open={isRejectModalOpen}
        onOk={handleReject}
        onCancel={() => setIsRejectModalOpen(false)}
        okText="Xác nhận bác bỏ"
        okButtonProps={{ danger: true }}
      >
        <p className="mb-2">Vui lòng nhập lý do bác bỏ điểm của sinh viên {selectedStudent?.name}:</p>
        <TextArea 
          rows={4} 
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Ví dụ: Minh chứng không hợp lệ, hình ảnh mờ..."
        />
      </Modal>
    </div>
  );
};
