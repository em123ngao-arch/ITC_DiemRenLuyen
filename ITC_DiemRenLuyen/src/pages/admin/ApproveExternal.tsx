import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Typography, Space, Tag, message, Modal, Input } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../utils/api';

const { Title } = Typography;

export const ApproveExternal: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [feedback, setFeedback] = useState('');

  const fetchActivities = async () => {
    try {
      const res = await api.get('/external-activities/pending');
      setActivities(res.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách');
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/external-activities/${id}/status`, { status: 'Đồng ý', feedback: 'Hợp lệ' });
      message.success('Đã duyệt thành công');
      fetchActivities();
    } catch (error) {
      message.error('Lỗi duyệt');
    }
  };

  const openRejectModal = (item: any) => {
    setSelectedItem(item);
    setFeedback('');
    setIsModalOpen(true);
  };

  const handleReject = async () => {
    if (!feedback) return message.error('Vui lòng nhập lý do từ chối');
    try {
      await api.put(`/external-activities/${selectedItem.id}/status`, { status: 'Từ chối', feedback });
      message.success('Đã từ chối');
      setIsModalOpen(false);
      fetchActivities();
    } catch (error) {
      message.error('Lỗi khi từ chối');
    }
  };

  const columns = [
    { title: 'Sinh viên', key: 'student', render: (_: any, record: any) => <div><strong>{record.user?.name}</strong><br/><span className="text-gray-500">{record.user?.classId}</span></div> },
    { title: 'Tên Hoạt động', dataIndex: 'name', key: 'name' },
    { title: 'Đơn vị tổ chức', dataIndex: 'organizer', key: 'organizer' },
    { title: 'Điểm đề xuất', dataIndex: 'scoreRequest', key: 'scoreRequest' },
    { title: 'Minh chứng', key: 'proof', render: (_: any, record: any) => <a href={record.proofUrl} target="_blank" rel="noreferrer">Xem ảnh</a> },
    { title: 'Ngày nộp', dataIndex: 'createdAt', key: 'createdAt', render: (d: string) => dayjs(d).format('DD/MM/YYYY HH:mm') },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="primary" icon={<CheckOutlined />} onClick={() => handleApprove(record.id)}>Duyệt</Button>
          <Button danger icon={<CloseOutlined />} onClick={() => openRejectModal(record)}>Từ chối</Button>
        </Space>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Title level={2}>Duyệt Khai báo HĐ ngoài trường</Title>
      </div>

      <Card className="shadow-sm">
        <Table scroll={{ x: 'max-content' }} columns={columns} dataSource={activities} rowKey="id" />
      </Card>

      <Modal
        title="Từ chối yêu cầu"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleReject}
      >
        <p>Vui lòng nhập lý do từ chối cho hoạt động: <strong>{selectedItem?.name}</strong></p>
        <Input.TextArea 
          rows={3} 
          value={feedback} 
          onChange={(e) => setFeedback(e.target.value)} 
          placeholder="Ví dụ: Minh chứng không rõ ràng..." 
        />
      </Modal>
    </div>
  );
};
