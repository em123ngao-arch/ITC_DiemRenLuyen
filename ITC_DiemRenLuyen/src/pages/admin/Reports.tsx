import React, { useState, useEffect } from 'react';
import { Card, Table, Form, Select, Button, Typography, Space, Tag, Row, Col, Statistic, message } from 'antd';
import { FileExcelOutlined, FilePdfOutlined, FilterOutlined } from '@ant-design/icons';
import api from '../../utils/api';
import { useOutletContext } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const { Title, Text } = Typography;
const { Option } = Select;

export const Reports: React.FC = () => {
  const { currentUser } = useOutletContext<{ currentUser: any }>();
  const [form] = Form.useForm();
  const [stats, setStats] = useState({ excellent: 0, good: 0, fair: 0, poor: 0 });
  const [semester, setSemester] = useState('HK1_2025-2026');
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      const students = res.data.filter((u: any) => u.role === 'Sinh viên' || u.role === 'student');
      const mapped = students.map((u: any) => {
        const p = u.points?.find((pt: any) => pt.semester === semester);
        const total = p ? (p.finalScore ?? p.advisorScore ?? p.monitorScore ?? p.studentSelfScore ?? 0) : 0;
        
        let rank = 'Kém';
        if (total >= 90) rank = 'Xuất sắc';
        else if (total >= 80) rank = 'Tốt';
        else if (total >= 65) rank = 'Khá';
        else if (total >= 50) rank = 'Trung bình';
        else if (total >= 35) rank = 'Yếu';

        return {
          key: u.id,
          id: u.id,
          name: u.name,
          class: u.classId || u.class?.id || 'Chưa có',
          total,
          rank
        };
      });
      setAllStudents(mapped);
      setFilteredData(mapped);
      computeStats(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [semester]);

  const computeStats = (data: any[]) => {
    const newStats = { excellent: 0, good: 0, fair: 0, poor: 0 };
    data.forEach(item => {
      if (item.total >= 90) newStats.excellent++;
      else if (item.total >= 80) newStats.good++;
      else if (item.total >= 65) newStats.fair++;
      else newStats.poor++;
    });
    setStats(newStats);
  };

  const handleFilter = () => {
    const values = form.getFieldsValue();
    let result = [...allStudents];

    if (values.class && values.class !== 'all') {
      result = result.filter(item => item.class.toLowerCase() === values.class.toLowerCase());
    }

    if (values.type === 'reward') {
      result = result.filter(item => item.total >= 80);
    } else if (values.type === 'warning') {
      result = result.filter(item => item.total < 50);
    }

    setFilteredData(result);
    computeStats(result);
  };

  const exportExcel = () => {
    if (filteredData.length === 0) {
      message.warning('Không có dữ liệu để xuất');
      return;
    }
    const exportData = filteredData.map((item, index) => ({
      'STT': index + 1,
      'MSSV': item.id,
      'Họ và tên': item.name,
      'Lớp': item.class,
      'Tổng ĐRL': item.total,
      'Xếp loại': item.rank
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Báo cáo ĐRL');
    XLSX.writeFile(workbook, 'Bao_Cao_Diem_Ren_Luyen.xlsx');
  };

  const exportPDF = () => {
    if (filteredData.length === 0) {
      message.warning('Không có dữ liệu để xuất');
      return;
    }
    const doc = new jsPDF();
    
    // Config encoding for Vietnamese if possible, or use standard English chars for pdf
    // jspdf default font doesn't support vi, let's just make it simple
    doc.text('Bao Cao Diem Ren Luyen', 14, 15);
    
    const tableColumn = ['STT', 'MSSV', 'Ho va ten', 'Lop', 'Tong DRL', 'Xep loai'];
    const tableRows: any[] = [];

    filteredData.forEach((item, index) => {
      const rowData = [
        index + 1,
        item.id,
        // Replace unicode chars to normal for default font compatibility if needed
        item.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D"),
        item.class,
        item.total,
        item.rank.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
      ];
      tableRows.push(rowData);
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    
    doc.save('Bao_Cao_Diem_Ren_Luyen.pdf');
  };

  const columns = [
    { title: 'MSSV', dataIndex: 'id', key: 'id' },
    { title: 'Họ và tên', dataIndex: 'name', key: 'name' },
    { title: 'Lớp', dataIndex: 'class', key: 'class' },
    { title: 'Tổng ĐRL', dataIndex: 'total', key: 'total', render: (total: number) => <span className="font-bold">{total}</span> },
    { 
      title: 'Xếp loại', 
      dataIndex: 'rank', 
      key: 'rank',
      render: (rank: string) => {
        let color = 'blue';
        if (rank === 'Xuất sắc') color = 'green';
        if (rank === 'Yếu' || rank === 'Kém') color = 'red';
        return <Tag color={color}>{rank}</Tag>;
      }
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <Title level={2}>Báo cáo & Thống kê</Title>
          <Text type="secondary">Thống kê điểm rèn luyện, kết xuất danh sách khen thưởng / cảnh cáo</Text>
        </div>
        <Space>
          <Button type="primary" onClick={exportExcel} className="bg-green-600 hover:bg-green-700" icon={<FileExcelOutlined />}>
            Xuất Excel
          </Button>
          <Button danger onClick={exportPDF} icon={<FilePdfOutlined />}>
            Xuất PDF
          </Button>
        </Space>
      </div>

      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card className="shadow-sm border-l-4 border-l-green-500">
            <Statistic title="Xuất sắc (>90)" value={stats.excellent} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <Statistic title="Tốt / Khá (65-89)" value={stats.good + stats.fair} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm border-l-4 border-l-orange-500">
            <Statistic title="Trung bình / Yếu" value={stats.poor} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="shadow-sm border-l-4 border-l-purple-500">
            <Statistic title="Tổng sinh viên" value={stats.excellent + stats.good + stats.fair + stats.poor} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm">
        <Form form={form} layout="inline" className="mb-6 flex-wrap gap-y-4" onFinish={handleFilter}>
          <Form.Item name="faculty" label="Khoa">
            <Select disabled showSearch optionFilterProp="children" placeholder="Chọn Khoa" style={{ width: 150 }} defaultValue="all">
              <Option value="all">Tất cả</Option>
              <Option value="cntt">CNTT</Option>
              <Option value="qtkt">QTKT</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="major" label="Ngành">
            <Select disabled showSearch optionFilterProp="children" placeholder="Chọn Ngành" style={{ width: 150 }} defaultValue="all">
              <Option value="all">Tất cả</Option>
              <Option value="khmt">KHMT</Option>
              <Option value="httt">HTTT</Option>
            </Select>
          </Form.Item>

          <Form.Item name="batch" label="Khóa">
            <Select disabled showSearch optionFilterProp="children" placeholder="Chọn Khóa" style={{ width: 120 }} defaultValue="all">
              <Option value="all">Tất cả</Option>
              <Option value="k24">Khóa 24</Option>
              <Option value="k25">Khóa 25</Option>
            </Select>
          </Form.Item>

          <Form.Item name="class" label="Lớp" initialValue={(currentUser?.role === 'Lớp trưởng' || currentUser?.role === 'Cố vấn học tập') ? currentUser?.classId : "all"}>
            <Select 
              showSearch 
              optionFilterProp="children" 
              style={{ width: 120 }}
              disabled={(currentUser?.role === 'Lớp trưởng' || currentUser?.role === 'Cố vấn học tập')}
            >
              <Option value="all">Tất cả Lớp</Option>
              {(currentUser?.role === 'Lớp trưởng' || currentUser?.role === 'Cố vấn học tập') ? (
                <Option value={currentUser?.classId}>{currentUser?.classId}</Option>
              ) : (
                <>
                  <Option value="CLC01">CLC01</Option>
                  <Option value="CLC02">CLC02</Option>
                  <Option value="CLC03">CLC03</Option>
                </>
              )}
            </Select>
          </Form.Item>

          <Form.Item name="type" label="Loại danh sách" initialValue="all">
            <Select showSearch optionFilterProp="children" style={{ width: 200 }}>
              <Option value="all">Tất cả sinh viên</Option>
              <Option value="reward">Danh sách khen thưởng</Option>
              <Option value="warning">Danh sách cảnh cáo/kém</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<FilterOutlined />}>Lọc dữ liệu</Button>
          </Form.Item>
        </Form>

        <Table scroll={{ x: 'max-content' }} 
          columns={columns} 
          dataSource={filteredData} 
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};
