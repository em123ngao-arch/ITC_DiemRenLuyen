import React, { useState, useMemo, useEffect } from 'react';
import { Card, Table, Typography, Tag, Button, Input, Select, Space, Badge, Upload, message, Modal, Row, Col, AutoComplete, Popconfirm, Image, InputNumber } from 'antd';
import { SaveOutlined, UploadOutlined, CloudUploadOutlined, SearchOutlined, CheckCircleOutlined, InfoCircleOutlined, DeleteOutlined, UserAddOutlined, TeamOutlined, UserOutlined, CrownOutlined, ArrowLeftOutlined, InboxOutlined, EditOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import * as XLSX from 'xlsx';
import api from '../../utils/api';
import { criteriaData } from '../student/TrainingScores';

const { Title, Text } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

export const Users: React.FC = () => {
  const { currentUser } = useOutletContext<{ currentUser: any }>();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [importVisible, setImportVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [appealVisible, setAppealVisible] = useState(false);
  const [appealStudent, setAppealStudent] = useState<any>(null);
  const [appealScore, setAppealScore] = useState<number>(0);
  const [appealScores, setAppealScores] = useState<Record<string, any>>({});
  
  const handleAppealScoreChange = (key: string, value: number | null) => {
    setAppealScores(prev => ({ ...prev, [key]: value || 0 }));
  };

  const handleAppealSubmit = async () => {
    try {
      if (!appealStudent) return;
      let sum = 0;
      Object.keys(appealScores).forEach(key => {
        if (key.includes('.')) sum += Number(appealScores[key]) || 0;
      });
      const newTotal = Math.max(0, Math.min(100, sum));

      await api.put(`/points/${appealStudent.id}/grade`, {
        score: newTotal,
        status: 'approved_school',
        feedback: 'Cập nhật điểm phúc khảo (Phòng Công tác sinh viên)',
        details: appealScores
      });
      message.success('Đã cập nhật điểm phúc khảo thành công!');
      setAppealVisible(false);
      fetchUsers();
    } catch (error) {
      message.error('Lỗi khi cập nhật điểm phúc khảo!');
    }
  };
  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      // Format data from DB back to UI needs
      const formatted = res.data.map((u: any) => ({
        ...u,
        class: u.classId || 'Chưa phân lớp'
      }));
      setUsers(formatted);
    } catch (error) {
      message.error('Không thể tải danh sách người dùng!');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if ((currentUser?.role === 'Ban cán sự lớp' || currentUser?.role === 'Cố vấn học tập') && currentUser?.classId) {
      setSelectedClass(currentUser.classId);
    }
  }, [currentUser]);

  const handleDeleteUser = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      message.success('Đã xóa tài khoản thành công!');
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi xóa tài khoản!');
    }
  };

  // Computed classes
  const classes = useMemo(() => {
    const classMap: Record<string, { count: number, advisor: string | null, monitor: string | null, appealCount: number }> = {};
    
    users.forEach(u => {
      const cls = u.class;
      if (!classMap[cls]) {
        classMap[cls] = { count: 0, advisor: null, monitor: null, appealCount: 0 };
      }
      if (u.role === 'Sinh viên' || u.role === 'Ban cán sự lớp') {
        classMap[cls].count += 1;
        const point = u.points && u.points.length > 0 ? u.points[0] : null;
        if (point && point.status === 'Phúc khảo') {
          classMap[cls].appealCount += 1;
        }
      }
      if (u.role === 'Cố vấn học tập') {
        classMap[cls].advisor = u.name;
      }
      if (u.role === 'Ban cán sự lớp') {
        classMap[cls].monitor = u.name;
      }
    });

    return Object.entries(classMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);
        
        if (json.length === 0) {
          message.error('File Excel trống!');
          return;
        }

        const firstRow = json[0];
        if (!('Mã số HSSV' in firstRow) || !('Họ Và Tên' in firstRow) || !('Lớp' in firstRow)) {
          message.error('File không đúng định dạng! Yêu cầu cột: Mã số HSSV, Họ Và Tên, Lớp');
          return;
        }

        const newUsers = json.map(row => ({
          id: row['Mã số HSSV']?.toString() || Math.random().toString(),
          name: row['Họ Và Tên'],
          class: row['Lớp'] || 'Chưa phân lớp',
          role: row['Vai Trò'] || 'Sinh viên',
          status: 'Hoạt động'
        }));

        try {
          message.loading({ content: 'Đang import...', key: 'import' });
          const res = await api.post('/users/import', { users: newUsers });
          message.success({ content: res.data.message || 'Import thành công!', key: 'import' });
          fetchUsers(); // Refresh data
          setImportVisible(false);
        } catch (apiError: any) {
          message.error({ content: apiError.response?.data?.message || 'Lỗi khi gọi API import!', key: 'import' });
        }
      } catch (error) {
        message.error('Lỗi khi đọc file Excel!');
      }
    };
    reader.readAsBinaryString(file);
    return false; 
  };

  const columns = [
    { title: 'Tài khoản (Mã)', dataIndex: 'id', key: 'id', render: (id: string) => <strong>{id}</strong> },
    { title: 'Họ và tên', dataIndex: 'name', key: 'name' },
    { 
      title: 'Phân quyền', 
      dataIndex: 'role', 
      key: 'role',
      render: (role: string) => {
        const colors: any = { 'Sinh viên': 'default', 'Ban cán sự lớp': 'blue', 'Cố vấn học tập': 'green', 'Quản trị hệ thống': 'purple', 'Phòng Công tác sinh viên': 'red', 'Đơn vị tổ chức hoạt động': 'orange', 'Phòng Đào tạo': 'magenta' };
        return <Tag color={colors[role] || 'default'}>{role}</Tag>;
      }
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string, record: any) => {
        const point = record.points && record.points.length > 0 ? record.points[0] : null;
        const isAppealing = point && point.status === 'Phúc khảo';
        return (
          <Space>
            <Badge status={status === 'Hoạt động' ? 'success' : 'error'} text={status} />
            {isAppealing && <Tag color="red" className="ml-2">Đang phúc khảo</Tag>}
          </Space>
        );
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          {(record.role === 'Sinh viên' || record.role === 'Ban cán sự lớp') && (
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              className="text-blue-600" 
              title="Phúc khảo bảng điểm"
              onClick={() => {
                setAppealStudent(record);
                const p = record.points && record.points.length > 0 ? record.points[0] : null;
                setAppealScore(p?.finalScore ?? p?.advisorScore ?? p?.monitorScore ?? p?.studentSelfScore ?? 0);
                
                let scores = {};
                if (p?.details) {
                  try { scores = JSON.parse(p.details); } catch(e) {}
                }
                setAppealScores(scores);
                setAppealVisible(true);
              }} 
            />
          )}
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa tài khoản này?"
            description="Tài khoản và toàn bộ dữ liệu điểm của người này sẽ bị xóa vĩnh viễn!"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredUsers = useMemo(() => {
    if (!selectedClass) return [];
    return users.filter(u => u.class === selectedClass && 
      (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       u.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, selectedClass, searchTerm]);

  const handleExport = () => {
    try {
      const dataToExport = (selectedClass ? filteredUsers : users).map((u, index) => ({
        'TT': index + 1,
        'Mã số HSSV': u.id,
        'Họ Và Tên': u.name,
        'Lớp': u.class,
        'Vai Trò': u.role,
        'Trạng Thái': u.status
      }));
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "DanhSach");
      XLSX.writeFile(wb, `DanhSach_${selectedClass || 'TatCa'}.xlsx`);
      message.success('Xuất file thành công!');
    } catch (error) {
      message.error('Lỗi khi xuất file!');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Title level={2}>Quản lý Lớp học & Sinh viên</Title>
          <Text type="secondary">Quản lý theo lớp, thêm sinh viên hàng loạt qua file Excel</Text>
        </div>
        <Space>
          <Button type="default" size="large" icon={<InboxOutlined />} onClick={handleExport}>
            Export Excel
          </Button>
          {(currentUser?.role === 'Quản trị hệ thống' || currentUser?.role === 'Phòng Công tác sinh viên') && (
            <Button type="primary" size="large" icon={<UserAddOutlined />} onClick={() => setImportVisible(true)}>
              Import Excel Sinh Viên
            </Button>
          )}
        </Space>
      </div>

      {selectedClass === null ? (
        <Row gutter={[24, 24]}>
          {classes.map(c => (
            <Col xs={24} sm={12} lg={8} xl={6} key={c.name}>
              <Card 
                hoverable 
                className="shadow-sm border border-gray-100 hover:border-blue-400 transition-colors h-full flex flex-col"
                onClick={() => setSelectedClass(c.name)}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <Badge count={c.appealCount} title="Đơn phúc khảo" offset={[10, 0]}>
                    <Title level={4} className="!mb-0 text-blue-600 mr-2">{c.name}</Title>
                  </Badge>
                  <Tag color="blue" icon={<TeamOutlined />}>{c.count} Sinh viên</Tag>
                </div>
                <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-gray-100">
                  <div className="text-gray-600 flex items-center gap-2">
                    <UserOutlined />
                    <span>CVHT: <strong className="text-gray-800">{c.advisor || 'Chưa có'}</strong></span>
                  </div>
                  <div className="text-blue-600 flex items-center gap-2">
                    <CrownOutlined />
                    <span>Lớp trưởng: <strong className="text-blue-800">{c.monitor || 'Chưa phân công'}</strong></span>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="flex flex-col gap-6">
          {(currentUser?.role === 'Quản trị hệ thống' || currentUser?.role === 'Phòng Công tác sinh viên') && (
            <Button 
              type="link" 
              icon={<ArrowLeftOutlined />} 
              onClick={() => { setSelectedClass(null); setSearchTerm(''); }}
              className="self-start px-0 text-gray-500 hover:text-blue-600"
            >
              Quay lại danh sách lớp
            </Button>
          )}

          <Card className="shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Title level={4} className="!mb-0">Danh sách lớp: <span className="text-blue-600">{selectedClass}</span></Title>
                  <Tag color="cyan">{filteredUsers.length} tài khoản</Tag>
                </div>
                
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 p-2 rounded-lg max-w-md">
                    <UserOutlined className="text-green-600 text-lg" />
                    <span className="font-medium text-gray-700 whitespace-nowrap">Phân công Cố vấn:</span>
                    <Select
                      showSearch
                      allowClear
                      className="flex-1"
                      placeholder="Nhập tên hoặc ID..."
                      value={filteredUsers.find(u => u.role === 'Cố vấn học tập')?.id || undefined}
                      options={users.filter(u => u.role === 'Cố vấn học tập').map(u => ({ value: u.id, label: `${u.name} (${u.id})` }))}
                      onChange={async (value) => {
                        if (!value) return;
                        try {
                          await api.put(`/users/${value}/role`, { role: 'Cố vấn học tập', classId: selectedClass });
                          message.success('Đã phân công cố vấn học tập!');
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

                  <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 p-2 rounded-lg max-w-md">
                    <CrownOutlined className="text-yellow-600 text-lg" />
                    <span className="font-medium text-gray-700 whitespace-nowrap">Phân công Lớp trưởng:</span>
                    <Select
                      showSearch
                      allowClear
                      className="flex-1"
                      placeholder="Nhập tên hoặc MSSV..."
                      value={filteredUsers.find(u => u.role === 'Ban cán sự lớp')?.id || undefined}
                      options={filteredUsers.filter(u => u.role === 'Sinh viên' || u.role === 'Ban cán sự lớp').map(u => ({ value: u.id, label: `${u.name} (${u.id})` }))}
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
                </div>
              </div>
              
              <Input 
                placeholder="Tìm theo tên, MSSV..." 
                prefix={<SearchOutlined />} 
                className="w-full sm:max-w-xs self-start"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Table scroll={{ x: 'max-content' }} 
              columns={columns} 
              dataSource={filteredUsers} 
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </div>
      )}

      <Modal
        title="Import danh sách sinh viên"
        open={importVisible}
        onCancel={() => setImportVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Dragger 
          accept=".xlsx, .xls"
          beforeUpload={handleFileUpload}
          showUploadList={false}
          className="p-8 mt-4"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined className="text-blue-500" />
          </p>
          <p className="ant-upload-text text-lg font-medium">Kéo thả file Excel chứa danh sách lớp vào đây</p>
          <p className="ant-upload-hint text-gray-500">
            Hỗ trợ import nhiều lớp cùng lúc. Cột bắt buộc: Mã số HSSV, Họ Và Tên, Lớp.
          </p>
        </Dragger>
      </Modal>

      <Modal
        title={`Cập nhật điểm phúc khảo: ${appealStudent?.name}`}
        open={appealVisible}
        onOk={handleAppealSubmit}
        onCancel={() => setAppealVisible(false)}
        okText="Cập nhật điểm"
        cancelText="Hủy"
        destroyOnClose
      >
        <p className="mb-4 text-gray-600">
          Phòng Công tác sinh viên sử dụng tính năng này để thay đổi trực tiếp điểm tổng kết của sinh viên 
          dựa trên đơn phúc khảo. Điểm sau khi cập nhật sẽ mang trạng thái <b>Đã chốt (Phòng CTSV)</b>.
        </p>
        
        {(() => {
          const p = appealStudent?.points?.[0];
          let reason = '';
          let proof = '';
          if (p?.details) {
            try {
              const d = JSON.parse(p.details);
              reason = d.appealReason || '';
              proof = d.appealProof || '';
            } catch(e) {}
          }
          if (!reason && !proof) return null;
          return (
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-6">
              <Text strong className="text-yellow-800">Lý do phúc khảo của sinh viên:</Text>
              <p className="mt-1 text-gray-700 italic">"{reason}"</p>
              {proof && (
                <div className="mt-3">
                  <Text strong className="text-yellow-800 block mb-2">Ảnh minh chứng:</Text>
                  <Image src={api.defaults.baseURL?.replace('/api', '') + proof} width={150} />
                </div>
              )}
            </div>
          );
        })()}

        <Table scroll={{ x: 'max-content' }} 
          columns={[
            { title: 'Tiêu chí', dataIndex: 'criteria', key: 'criteria', width: '60%' },
            { 
              title: 'Điểm tối đa', 
              dataIndex: 'maxPoint', 
              key: 'maxPoint', 
              width: '15%',
              align: 'center',
              render: (val) => val ? <Text type="secondary">{val}</Text> : null 
            },
            { 
              title: 'Điểm Phúc khảo', 
              key: 'edit',
              width: '25%',
              align: 'center',
              render: (_, record: any) => record.maxPoint ? (
                <InputNumber 
                  min={record.maxPoint < 0 ? record.maxPoint : 0} 
                  max={record.maxPoint > 0 ? record.maxPoint : 0}
                  value={appealScores[record.key] || 0}
                  onChange={val => handleAppealScoreChange(record.key, val)}
                  className="w-full font-bold text-blue-600"
                />
              ) : null
            }
          ]}
          dataSource={criteriaData}
          pagination={false}
          bordered
          size="small"
          scroll={{ y: 400 }}
          defaultExpandAllRows
          className="mb-4"
        />

        <div className="flex items-center justify-end gap-4 p-4 bg-gray-50 border rounded">
          <Text strong className="text-lg">Tổng điểm phúc khảo mới:</Text>
          <Text className="text-2xl font-bold text-blue-600">
            {(() => {
              let sum = 0;
              Object.keys(appealScores).forEach(key => {
                if (key.includes('.')) sum += Number(appealScores[key]) || 0;
              });
              return Math.max(0, Math.min(100, sum));
            })()} / 100
          </Text>
        </div>
      </Modal>
    </div>
  );
};
