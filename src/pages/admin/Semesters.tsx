import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Typography, Space, Tag, Modal, Form, Input, DatePicker, message, Switch, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../utils/api';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export const Semesters: React.FC = () => {
  const [semesters, setSemesters] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchSemesters = async () => {
    try {
      const res = await api.get('/semesters');
      setSemesters(res.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách học kỳ');
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      setLoading(true);
      await api.post('/semesters', {
        id: values.id,
        name: values.name,
        startDate: values.dates[0].toDate(),
        endDate: values.dates[1].toDate(),
      });
      message.success('Tạo học kỳ thành công');
      setIsModalOpen(false);
      form.resetFields();
      fetchSemesters();
    } catch (error) {
      message.error('Lỗi khi tạo học kỳ');
    } finally {
      setLoading(false);
    }
  };

  const toggleLock = async (id: string, isLocked: boolean) => {
    try {
      await api.put(`/semesters/${id}/lock`, { isLocked });
      message.success(isLocked ? 'Đã khóa học kỳ' : 'Đã mở khóa học kỳ');
      fetchSemesters();
    } catch (error) {
      message.error('Lỗi khi cập nhật trạng thái khóa');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/semesters/${id}`);
      message.success('Đã xóa học kỳ');
      fetchSemesters();
    } catch (error) {
      message.error('Lỗi khi xóa học kỳ. Vui lòng đảm bảo không có điểm rèn luyện nào đang liên kết.');
    }
  };

  const columns = [
    { title: 'Mã Học Kỳ', dataIndex: 'id', key: 'id', render: (id: string) => <strong>{id}</strong> },
    { title: 'Tên Học Kỳ', dataIndex: 'name', key: 'name' },
    { 
      title: 'Thời gian', 
      key: 'dates', 
      render: (_: any, record: any) => (
        <Space>
          <Tag>{dayjs(record.startDate).format('DD/MM/YYYY')}</Tag>
          -
          <Tag>{dayjs(record.endDate).format('DD/MM/YYYY')}</Tag>
        </Space>
      )
    },
    {
      title: 'Khóa cổng',
      dataIndex: 'isLocked',
      key: 'isLocked',
      render: (isLocked: boolean, record: any) => (
        <Switch 
          checked={isLocked} 
          onChange={(checked) => toggleLock(record.id, checked)}
          checkedChildren="Đã Khóa"
          unCheckedChildren="Đang Mở"
        />
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Popconfirm title="Bạn có chắc chắn muốn xóa học kỳ này không?" onConfirm={() => handleDelete(record.id)}>
           <Button danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Title level={2}>Quản lý Học kỳ</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Thêm Học kỳ
        </Button>
      </div>

      <Card className="shadow-sm">
        <Table scroll={{ x: 'max-content' }} columns={columns} dataSource={semesters} rowKey="id" />
      </Card>

      <Modal
        title="Thêm Học kỳ mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="id" label="Mã Học Kỳ (VD: HK1_2025_2026)" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Tên Học Kỳ" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="dates" label="Thời gian bắt đầu - kết thúc" rules={[{ required: true }]}>
            <RangePicker format="DD/MM/YYYY" className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
