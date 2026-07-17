import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Upload, Typography, message, List, Tag, Image, Divider } from 'antd';
import { InboxOutlined, UploadOutlined, FileTextOutlined } from '@ant-design/icons';
import api from '../../utils/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

export const EvidenceDeclaration: React.FC = () => {
  const [form] = Form.useForm();
  const [evidences, setEvidences] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvidences = async () => {
    try {
      const res = await api.get('/evidences/personal');
      setEvidences(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchEvidences();
  }, []);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const fileUrls = values.evidenceFiles.map((file: any) => file.response?.url || file.url);
      
      await api.post('/evidences/personal', {
        category: values.category,
        activityName: values.activityName,
        fileUrls
      });
      
      message.success('Đã lưu minh chứng vào Kho thành công!');
      form.resetFields();
      fetchEvidences();
    } catch (error) {
      message.error('Lỗi khi lưu minh chứng!');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    action: api.defaults.baseURL + '/upload',
    headers: {
      authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    onChange(info: any) {
      const { status } = info.file;
      if (status === 'done') {
        message.success(`${info.file.name} tải lên thành công.`);
      } else if (status === 'error') {
        message.error(`${info.file.name} tải lên thất bại.`);
      }
    },
  };

  const categoryMap: Record<string, string> = {
    'dao_duc': 'Ý thức tham gia học tập',
    'quy_che': 'Ý thức chấp hành nội quy',
    'hd_chinh_tri': 'Hoạt động chính trị, xã hội',
    'cong_dan': 'Ý thức công dân',
    'can_bo': 'Công tác cán bộ lớp'
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div>
        <Title level={2}>Khai báo minh chứng cá nhân</Title>
        <Text type="secondary">Kho lưu trữ minh chứng các hoạt động ngoại khóa, chứng chỉ bên ngoài. Dễ dàng sử dụng lại khi đánh giá điểm rèn luyện cuối kỳ.</Text>
      </div>

      <Card className="shadow-sm" title={<span className="text-lg font-bold">Thêm mới minh chứng</span>}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark="optional"
        >
          <Form.Item
            name="category"
            label={<span className="font-medium">Mục rèn luyện (Tiêu chí)</span>}
            rules={[{ required: true, message: 'Vui lòng chọn mục rèn luyện!' }]}
          >
            <Select showSearch optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())} placeholder="-- Chọn mục rèn luyện --" size="large">
              <Option value="dao_duc">1. Đánh giá về ý thức tham gia học tập</Option>
              <Option value="quy_che">2. Đánh giá về ý thức chấp hành nội quy, quy chế, quy định trong Phòng Công tác sinh viên</Option>
              <Option value="hd_chinh_tri">3. Đánh giá về ý thức tham gia các hoạt động chính trị, xã hội, văn hóa, văn nghệ, thể thao</Option>
              <Option value="cong_dan">4. Đánh giá về ý thức công dân trong quan hệ cộng đồng</Option>
              <Option value="can_bo">5. Đánh giá về ý thức và kết quả tham gia công tác cán bộ lớp, các đoàn thể</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="activityName"
            label={<span className="font-medium">Tên hoạt động / Tên thành tích</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên hoạt động!' }]}
          >
            <Input placeholder="Ví dụ: Tham gia chiến dịch Mùa hè xanh tại địa phương..." size="large" />
          </Form.Item>

          <Form.Item
            name="evidenceFiles"
            label={<span className="font-medium">Tải lên minh chứng (Hình ảnh/PDF)</span>}
            valuePropName="fileList"
            getValueFromEvent={(e: any) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
            rules={[{ required: true, message: 'Vui lòng tải lên ít nhất 1 tệp minh chứng!' }]}
          >
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined className="text-blue-500" />
              </p>
              <p className="ant-upload-text font-medium text-gray-700">Nhấp hoặc kéo thả tệp vào khu vực này để tải lên</p>
              <p className="ant-upload-hint text-gray-500">
                Hỗ trợ tải lên một hoặc nhiều tệp. Chấp nhận các định dạng: .jpg, .png, .pdf (Tối đa 5MB)
              </p>
            </Dragger>
          </Form.Item>

          <Form.Item className="mt-8 mb-0">
            <Button type="primary" htmlType="submit" size="large" icon={<UploadOutlined />} loading={loading} className="w-full sm:w-auto">
              Lưu vào Kho
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card className="shadow-sm" title={<span className="text-lg font-bold">Kho minh chứng của tôi</span>}>
        <List
          itemLayout="vertical"
          dataSource={evidences}
          locale={{ emptyText: 'Chưa có minh chứng nào trong kho' }}
          renderItem={(item) => (
            <List.Item className="border-b border-gray-100 py-4 hover:bg-gray-50 transition-colors px-4 rounded-md">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center shrink-0 border border-gray-200">
                  {item.imageUrl?.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                    <Image src={api.defaults.baseURL?.replace('/api', '') + item.imageUrl} className="object-cover w-full h-full" alt="evidence" />
                  ) : (
                    <a href={api.defaults.baseURL?.replace('/api', '') + item.imageUrl} target="_blank" rel="noreferrer" className="flex flex-col items-center text-blue-500 hover:text-blue-600">
                      <FileTextOutlined className="text-3xl mb-1" />
                      <span className="text-xs">Xem File</span>
                    </a>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-800 m-0 mb-1">{item.description}</h4>
                  <div className="flex gap-2 flex-wrap mb-2">
                    <Tag color="blue">{categoryMap[item.category] || 'Khác'}</Tag>
                    <Tag color="green">{item.status}</Tag>
                  </div>
                  <Text type="secondary" className="text-sm">Ngày tải lên: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
                </div>
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};
