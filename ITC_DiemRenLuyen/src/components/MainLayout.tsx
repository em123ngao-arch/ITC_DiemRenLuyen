import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, theme, Grid } from 'antd';
import {
  DashboardOutlined,
  FormOutlined,
  QrcodeOutlined,
  CheckSquareOutlined,
  PlusCircleOutlined,
  SyncOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

export const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = screens.md === false; // true on small screens (xs, sm)

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) {
      navigate('/login');
    } else {
      setCurrentUser(JSON.parse(userJson));
    }
  }, [navigate]);

  if (!currentUser) return null; // Avoid rendering until user is loaded

  const getMenuItems = () => {
    const items = [];
    
    if (currentUser.role === 'Sinh viên' || currentUser.role === 'Ban cán sự lớp') {
      items.push({ key: '/student/dashboard', icon: <DashboardOutlined />, label: 'Trang chủ' });
      items.push({ key: '/student/scores', icon: <FormOutlined />, label: 'Phiếu điểm chi tiết' });
      items.push({ key: '/student/activities', icon: <PlusCircleOutlined />, label: 'Danh sách hoạt động' });
      items.push({ key: '/student/evidence', icon: <FormOutlined />, label: 'Khai báo minh chứng' });
      items.push({ key: '/student/external', icon: <FormOutlined />, label: 'Khai báo HĐ ngoài trường' });
      items.push({ key: '/student/checkin', icon: <QrcodeOutlined />, label: 'Điểm danh' });
    }

    if (currentUser.role === 'Ban cán sự lớp' || currentUser.role === 'Cố vấn học tập' || currentUser.role === 'Phòng Công tác sinh viên' || currentUser.role === 'Quản trị hệ thống') {
      items.push({ key: '/grading', icon: <CheckSquareOutlined />, label: 'Duyệt điểm tập thể' });
    }

    if (currentUser.role === 'Phòng Công tác sinh viên' || currentUser.role === 'Quản trị hệ thống' || currentUser.role === 'Phòng Đào tạo') {
      items.push({ key: '/admin', icon: <UserAddOutlined />, label: 'Tạo tài khoản (Import)' });
      items.push({ key: '/admin/users', icon: <UserOutlined />, label: 'Quản lý Sinh viên' });
      items.push({ key: '/admin/activities', icon: <PlusCircleOutlined />, label: 'Quản lý hoạt động' });
      items.push({ key: '/admin/approve-external', icon: <CheckSquareOutlined />, label: 'Duyệt HĐ ngoài trường' });
      items.push({ key: '/admin/semesters', icon: <CheckSquareOutlined />, label: 'Quản lý Học kỳ' });
      items.push({ key: '/admin/sync', icon: <SyncOutlined />, label: 'Đồng bộ dữ liệu' });
      items.push({ key: '/admin/reports', icon: <BarChartOutlined />, label: 'Báo cáo & Thống kê' });
    }

    if (currentUser.role === 'Đơn vị tổ chức hoạt động') {
      items.push({ key: '/admin/activities', icon: <PlusCircleOutlined />, label: 'Quản lý hoạt động' });
    }

    return items;
  };

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const roleMenuItems = [
    { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, onClick: handleLogout },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider trigger={null} collapsible collapsed={collapsed} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
          <div className="flex items-center justify-center h-16 border-b border-gray-200 p-2">
            <img 
              src="/itc_logo.png" 
              alt="ITC Logo" 
              className={`object-contain transition-all duration-300 ${collapsed ? 'h-8' : 'h-10'}`} 
            />
          </div>
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={getMenuItems()}
            onClick={handleMenuClick}
            className="mt-2"
          />
        </Sider>
      )}
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} className="flex justify-between items-center pr-4 md:pr-6 shadow-sm z-10">
          <div className="flex items-center">
            {!isMobile && (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: '16px',
                  width: 64,
                  height: 64,
                }}
              />
            )}
            {isMobile && (
              <div className="flex items-center h-full ml-2">
                <Dropdown menu={{ items: getMenuItems(), onClick: handleMenuClick }} trigger={['click']} placement="bottomLeft">
                  <Button type="text" icon={<MenuOutlined />} style={{ fontSize: '20px' }} />
                </Dropdown>
                <img src="/itc_logo.png" alt="ITC Logo" className="h-8 object-contain ml-2" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Dropdown menu={{ items: roleMenuItems }} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-1 rounded-md transition-colors">
                <Avatar icon={<UserOutlined />} className="bg-blue-500" />
                <div className="hidden md:block text-right">
                  <div className="text-sm font-medium leading-none mb-1">{currentUser.name}</div>
                  <div className="text-xs text-gray-500 leading-none">{currentUser.role}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        


        <Content
          style={{
            margin: isMobile ? '16px' : '24px 16px',
            padding: isMobile ? 16 : 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'auto'
          }}
        >
          <Outlet context={{ currentUser }} />
        </Content>
      </Layout>
    </Layout>
  );
};
