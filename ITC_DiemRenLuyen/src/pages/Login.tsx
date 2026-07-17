import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const { Title, Text } = Typography;

export const USERS = {
  STUDENT: { role: 'Sinh viên', name: 'Nguyễn Anh Đô', id: '501250347' },
  MONITOR: { role: 'Ban cán sự lớp', name: 'Nguyễn Duy Bảo', id: '501250390' },
  ADVISOR: { role: 'Cố vấn học tập', name: 'ThS. Nguyễn Lê Thành', id: 'gv_nguyen' },
  SCHOOL: { role: 'Phòng Công tác sinh viên', name: 'Phòng CTSV', id: 'ctsv_nt' },
  ORGANIZER: { role: 'Đơn vị tổ chức hoạt động', name: 'Khoa CNTT', id: 'dv_tc' },
  ACADEMIC: { role: 'Phòng Đào tạo', name: 'Phòng ĐT', id: 'p_dt' },
  ADMIN: { role: 'Quản trị hệ thống', name: 'Developer (Admin)', id: 'admin_dev' },
};

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', {
        username: values.username,
        password: values.password
      });

      const { user, token } = res.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
      message.success('Đăng nhập thành công!');
      
      if (['Phòng Công tác sinh viên', 'Quản trị hệ thống', 'Phòng Đào tạo'].includes(user.role)) {
        navigate('/admin/users');
      } else {
        navigate('/student/dashboard');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Sai tên đăng nhập hoặc mật khẩu!');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (userKey: keyof typeof USERS) => {
    const mockUser = USERS[userKey];
    try {
      const res = await api.post('/auth/demo-login', { username: mockUser.id });
      const { user, token } = res.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
      message.success(`Đăng nhập nhanh thành công: ${user.name}`);
      
      if (['Quản trị hệ thống', 'Phòng Công tác sinh viên', 'Phòng Đào tạo', 'Đơn vị tổ chức hoạt động'].includes(user.role)) navigate('/admin/activities');
      else if (user.role === 'Cố vấn học tập') navigate('/grading');
      else navigate('/student/dashboard');
    } catch (error) {
      message.error('Lỗi đăng nhập nhanh!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg rounded-2xl overflow-hidden border-0">
        <div className="text-center mb-8">
          <img src="/itc_logo.png" alt="ITC Logo" className="h-20 mx-auto mb-4 object-contain" />
          <Title level={3} className="!mt-0 !mb-1 text-blue-700">HỆ THỐNG ITC-DRL</Title>
          <Text type="secondary">Quản lý điểm rèn luyện sinh viên</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish} requiredMark="optional">
          <Form.Item
            name="username"
            label={<span className="font-medium">Tên đăng nhập (Mã SV/CB)</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          >
            <Input prefix={<UserOutlined className="text-gray-400" />} size="large" placeholder="Nhập mã sinh viên hoặc tài khoản" />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span className="font-medium">Mật khẩu</span>}
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            initialValue="Itc@12345"
          >
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} size="large" placeholder="Nhập mật khẩu" />
          </Form.Item>

          <Form.Item className="mt-6 mb-4">
            <Button type="primary" htmlType="submit" size="large" className="w-full font-medium h-12" loading={loading}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-8 border-t pt-6">
          <Text type="secondary" className="block text-center mb-4">Đăng nhập nhanh (Dành cho Demo)</Text>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={() => quickLogin('STUDENT')}>Sinh viên</Button>
            <Button onClick={() => quickLogin('MONITOR')}>Ban cán sự</Button>
            <Button onClick={() => quickLogin('ADVISOR')}>Cố vấn học tập</Button>
            <Button onClick={() => quickLogin('SCHOOL')}>Phòng CTSV</Button>
            <Button onClick={() => quickLogin('ORGANIZER')}>ĐV Tổ chức</Button>
            <Button onClick={() => quickLogin('ACADEMIC')}>Phòng Đào tạo</Button>
            <Button onClick={() => quickLogin('ADMIN')} className="col-span-2">Quản trị hệ thống</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
