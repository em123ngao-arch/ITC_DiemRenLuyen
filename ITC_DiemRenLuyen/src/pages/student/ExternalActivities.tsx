import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Typography, Space, Tag, Modal, Form, Input, message, Upload, InputNumber } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../utils/api';

const { Title } = Typography;

export const ExternalActivities: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string>('');

  const fetchActivities = async () => {
    try {
      const res = await api.get('/external-activities/my');
      setActivities(res.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách hoạt động');
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleCreate = async (values: any) => {
    if (!fileUrl) {
      return message.error('Vui lòng đính kèm minh chứng');
    }
    try {
      setLoading(true);
      await api.post('/external-activities', {
        ...values,
        proofUrl: fileUrl
      });
      message.success('Khai báo thành công, vui lòng chờ duyệt');
      setIsModalOpen(false);
      form.resetFields();
      setFileUrl('');
      fetchActivities();
    } catch (error) {
      message.error('Lỗi khi khai báo');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    name: 'image',
    action: 'http://localhost:3000/api/upload',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    onChange(info: any) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} tải lên thành công`);
        setFileUrl(info.file.response.url);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} tải lên thất bại.`);
      }
    },
  };

  const columns = [
    { title: 'Tên Hoạt động', dataIndex: 'name', key: 'name' },
    { title: 'Đơn vị tổ chức', dataIndex: 'organizer', key: 'organizer' },
    { title: 'Điểm đề xuất', dataIndex: 'scoreRequest', key: 'scoreRequest' },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        const color = status === 'Đồng ý' ? 'success' : status === 'Từ chối' ? 'error' : 'warning';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    { title: 'Phản hồi', dataIndex: 'feedback', key: 'feedback' },
    { title: 'Ngày khai báo', dataIndex: 'createdAt', key: 'createdAt', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Title level={2}>Khai báo Hoạt động ngoài trường</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Khai báo mới
        </Button>
      </div>

      <Card className="shadow-sm">
        <Table scroll={{ x: 'max-content' }} columns={columns} dataSource={activities} rowKey="id" />
      </Card>

      <Modal
        title="Khai báo Hoạt động ngoài trường"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Tên Hoạt động" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="organizer" label="Đơn vị tổ chức (Nơi cấp giấy chứng nhận)" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Nội dung tham gia/Mô tả thêm">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="scoreRequest" label="Số điểm đề xuất" rules={[{ required: true }]}>
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="Minh chứng (Ảnh/PDF)" required>
             <Upload {...uploadProps} maxCount={1}>
              <Button icon={<UploadOutlined />}>Tải file lên</Button>
            </Upload>
            {fileUrl && (
               <a href={fileUrl} target="_blank" rel="noreferrer" className="block mt-2 text-blue-500">Xem file đã tải lên</a>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
