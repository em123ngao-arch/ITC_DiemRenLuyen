import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Input, Select, DatePicker, InputNumber, Button, Typography, message, Modal, Table, Space, Popconfirm, Tag, QRCode } from 'antd';
import { SaveOutlined, QrcodeOutlined, DownloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../utils/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export const AdminActivities: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrActivity, setQrActivity] = useState<any>(null);
  const [qrToken, setQrToken] = useState<string>('');
  const [shortCode, setShortCode] = useState<string>('');
  const [countdown, setCountdown] = useState(15);
  const timerRef = useRef<any>(null);

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activities');
      setActivities(res.data);
    } catch (error) {
      message.error('Không thể tải danh sách hoạt động');
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchQrToken = async (id: string) => {
    try {
      const res = await api.get(`/activities/${id}/qrcode`);
      setQrToken(res.data.token);
      setShortCode(res.data.shortCode);
      setCountdown(15);
    } catch (err) {
      console.error('Lỗi lấy mã QR', err);
    }
  };

  const openQrModal = (activity: any) => {
    setQrActivity(activity);
    setQrModalVisible(true);
    fetchQrToken(activity.id);
  };

  const closeQrModal = () => {
    setQrModalVisible(false);
    setQrActivity(null);
    setQrToken('');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (qrModalVisible && qrActivity) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            fetchQrToken(qrActivity.id);
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [qrModalVisible, qrActivity]);

  const handleOpenModal = (record?: any) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({
        ...record,
        time: record.startTime && record.endTime ? [dayjs(record.startTime), dayjs(record.endTime)] : undefined,
      });
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const onFinish = async (values: any) => {
    const formattedValues = {
      ...values,
      time: values.time ? [values.time[0].toISOString(), values.time[1].toISOString()] : [],
    };

    try {
      if (editingId) {
        await api.put(`/activities/${editingId}`, formattedValues);
        message.success('Cập nhật hoạt động thành công!');
        fetchActivities();
        setIsModalVisible(false);
      } else {
        await api.post('/activities', formattedValues);
        message.success('Tạo hoạt động thành công!');
        fetchActivities();
        setIsModalVisible(false);
        setQrModalVisible(true);
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi lưu hoạt động');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/activities/${id}`);
      message.success('Đã xóa hoạt động!');
      fetchActivities();
    } catch (error) {
      message.error('Không thể xóa hoạt động');
    }
  };

  const columns = [
    {
      title: 'Tên hoạt động',
      dataIndex: 'eventName',
      key: 'eventName',
      render: (text: string) => <span className="font-medium">{text}</span>
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_: any, record: any) => {
        if (!record.startTime || !record.endTime) return '-';
        return `${dayjs(record.startTime).format('DD/MM/YYYY HH:mm')} - ${dayjs(record.endTime).format('DD/MM/YYYY HH:mm')}`;
      }
    },
    {
      title: 'Địa điểm',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: any) => {
        const now = dayjs();
        const start = dayjs(record.startTime);
        const end = dayjs(record.endTime);
        
        if (now.isBefore(start)) {
          return <Tag color="warning">Sắp diễn ra</Tag>;
        } else if (now.isAfter(end)) {
          return <Tag color="default">Đã kết thúc</Tag>;
        } else {
          return <Tag color="success">Đang diễn ra</Tag>;
        }
      }
    },
    {
      title: 'Điểm ĐRL',
      dataIndex: 'points',
      key: 'points',
      render: (points: number) => <Tag color="blue">+{points} điểm</Tag>
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="text" className="text-purple-600 hover:text-purple-800" icon={<QrcodeOutlined />} onClick={() => openQrModal(record)}>Mã QR</Button>
          <Button type="text" className="text-blue-600 hover:text-blue-800" icon={<EditOutlined />} onClick={() => handleOpenModal(record)}>Sửa</Button>
          <Popconfirm
            title="Xóa hoạt động?"
            description="Bạn có chắc chắn muốn xóa hoạt động này không?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />}>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Title level={2}>Quản lý hoạt động</Title>
          <Text type="secondary">Tạo sự kiện mới, quản lý điểm và sinh mã QR tự động</Text>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Tạo hoạt động mới
        </Button>
      </div>

      <Card className="shadow-sm">
        <Table scroll={{ x: 'max-content' }} 
          columns={columns} 
          dataSource={activities} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={<span className="text-xl font-semibold">{editingId ? 'Chỉnh sửa hoạt động' : 'Tạo hoạt động mới'}</span>}
        open={isModalVisible}
        onCancel={handleCancelModal}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark="optional"
          className="mt-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <Form.Item
              name="eventName"
              label={<span className="font-medium">Tên hoạt động</span>}
              rules={[{ required: true, message: 'Vui lòng nhập tên hoạt động!' }]}
              className="md:col-span-2"
            >
              <Input placeholder="Ví dụ: Hội thảo Sinh viên NCKH 2026" size="large" />
            </Form.Item>

            <Form.Item
              name="time"
              label={<span className="font-medium">Thời gian diễn ra</span>}
              rules={[{ required: true, message: 'Vui lòng chọn thời gian!' }]}
            >
              <RangePicker showTime size="large" className="w-full" format="DD/MM/YYYY HH:mm" />
            </Form.Item>

            <Form.Item
              name="location"
              label={<span className="font-medium">Địa điểm</span>}
              rules={[{ required: true, message: 'Vui lòng nhập địa điểm!' }]}
            >
              <Input placeholder="Ví dụ: Hội trường A" size="large" />
            </Form.Item>

            <Form.Item
              name="points"
              label={<span className="font-medium">Số ĐRL cộng thêm</span>}
              rules={[{ required: true, message: 'Vui lòng nhập số điểm!' }]}
            >
              <InputNumber min={1} max={20} size="large" className="w-full" addonAfter="Điểm" />
            </Form.Item>

            <Form.Item
              name="target"
              label={<span className="font-medium">Giới hạn đối tượng (Khoa/Khóa)</span>}
            >
              <Select showSearch optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())} mode="multiple" placeholder="Chọn đối tượng tham gia (Để trống = Tất cả)" size="large">
                <Option value="cnnt">Khoa CNTT</Option>
                <Option value="qtkt">Khoa QTKT</Option>
                <Option value="k24">Khóa 24</Option>
                <Option value="k25">Khóa 25</Option>
                <Option value="k26">Khóa 26</Option>
              </Select>
            </Form.Item>
          </div>
          
          <Form.Item className="mb-0 text-right mt-4 pt-4 border-t border-gray-100">
            <Space>
              <Button onClick={handleCancelModal}>Hủy bỏ</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Lưu hoạt động
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={null}
        open={qrModalVisible}
        onCancel={closeQrModal}
        footer={null}
        width={400}
        centered
        destroyOnClose
      >
        {qrActivity && (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <Title level={4} className="mb-2">{qrActivity.eventName}</Title>
            <Text type="secondary" className="mb-6 block">Quét mã để điểm danh tham gia</Text>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 relative">
               {qrToken ? (
                 <>
                   <QRCode value={qrToken} size={250} bordered={false} />
                   <div className="mt-4 pt-4 border-t border-gray-100">
                     <Text type="secondary" className="text-sm">Hoặc nhập mã (Code):</Text>
                     <Title level={2} className="!mt-1 !mb-0 tracking-widest text-blue-600 font-mono">
                       {shortCode}
                     </Title>
                   </div>
                 </>
               ) : (
                 <div className="w-[250px] h-[250px] bg-gray-100 animate-pulse flex items-center justify-center rounded">Đang tải...</div>
               )}
            </div>

            <div className="flex items-center gap-2 text-blue-600 font-medium bg-blue-50 px-4 py-2 rounded-full">
              <SyncOutlined spin />
              <span>Làm mới mã sau {countdown}s</span>
            </div>
            
            <Text type="secondary" className="mt-4 text-xs block max-w-xs">Mã QR động thay đổi liên tục mỗi 15 giây để chống điểm danh giả mạo.</Text>
          </div>
        )}
      </Modal>
    </div>
  );
};
