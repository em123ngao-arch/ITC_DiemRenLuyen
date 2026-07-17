import React, { useState, useEffect, useMemo } from 'react';
import { Card, Typography, Tag, Button, Input, Select, Row, Col, Badge, Divider, message, Modal, Calendar, Badge as AntBadge } from 'antd';
import { SearchOutlined, FilterOutlined, CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import api from '../../utils/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export const Activities: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activities');
      const formatted = res.data.map((act: any) => {
        const startDate = new Date(act.startTime);
        const endDate = new Date(act.endTime);
        const now = dayjs();
        const start = dayjs(act.startTime);
        const end = dayjs(act.endTime);
        
        let status = 'Đang diễn ra';
        if (now.isBefore(start)) status = 'Sắp diễn ra';
        else if (now.isAfter(end)) status = 'Đã kết thúc';

        return {
          ...act,
          title: act.eventName,
          category: 'Hoạt động trường',
          date: startDate.toLocaleDateString('vi-VN'),
          time: `${startDate.getHours()}:${String(startDate.getMinutes()).padStart(2, '0')} - ${endDate.getHours()}:${String(endDate.getMinutes()).padStart(2, '0')}`,
          status
        };
      });
      setActivities(formatted);
    } catch (err) {
      message.error('Không tải được danh sách hoạt động');
    }
  };

  const fetchSchedule = async () => {
    try {
      const res = await api.get('/activities/my-schedule');
      setSchedule(res.data);
    } catch (err) {
      // message.error('Không tải được lịch');
    }
  };

  useEffect(() => {
    fetchActivities();
    fetchSchedule();
  }, []);

  const handleRegister = async (actId: string) => {
    try {
      const res = await api.post(`/activities/${actId}/register`);
      message.success(res.data.message);
      // Refresh
      fetchActivities();
      fetchSchedule();
    } catch (error) {
      message.error('Lỗi khi đăng ký sự kiện');
    }
  };

  const { openActivities, upcomingActivities } = useMemo(() => {
    return {
      openActivities: activities.filter(act => act.status === 'Đang diễn ra'),
      upcomingActivities: activities.filter(act => act.status === 'Sắp diễn ra' || act.status === 'Đã kết thúc'),
    };
  }, [activities]);

  const renderActivityCard = (act: any) => (
    <Col xs={24} sm={12} lg={8} xl={6} key={act.id} className="[&_.ant-ribbon-wrapper]:h-full [&_.ant-ribbon-wrapper]:flex [&_.ant-ribbon-wrapper]:flex-col">
      <Badge.Ribbon text={act.status} color={act.status === 'Sắp diễn ra' ? 'blue' : act.status === 'Đang diễn ra' ? 'green' : 'gray'}>
        <Card 
          hoverable 
          className="flex-grow flex flex-col w-full"
          bodyStyle={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}
        >
          <Tag color="purple" className="mb-3 self-start">{act.category}</Tag>
          <Title level={5} className="!mb-3">{act.title}</Title>
          
          <div className="flex flex-col gap-2 mb-6 text-gray-600 flex-grow">
            <div className="flex items-center gap-2">
              <CalendarOutlined /> <span>{act.time}, {act.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <EnvironmentOutlined /> <span>{act.location}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-auto pt-4 border-t border-gray-100">
            <span className="font-bold text-blue-600 text-lg">+{act.points} ĐRL</span>
            <Button 
              type={act.isRegistered ? "default" : "primary"} 
              danger={act.isRegistered}
              onClick={() => handleRegister(act.id)}
            >
              {act.isRegistered ? 'Hủy đăng ký' : 'Đăng ký ngay'}
            </Button>
          </div>
        </Card>
      </Badge.Ribbon>
    </Col>
  );

  const dateCellRender = (value: dayjs.Dayjs) => {
    const listData = schedule.filter(s => dayjs(s.startTime).isSame(value, 'day'));
    return (
      <ul className="m-0 p-0 list-none">
        {listData.map(item => (
          <li key={item.id}>
            <AntBadge status="success" text={item.eventName} className="text-xs truncate w-full block" />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Title level={2}>Hoạt động rèn luyện</Title>
          <Text type="secondary">Khám phá và đăng ký tham gia các hoạt động ngoại khóa của trường</Text>
        </div>
        <Button type="primary" size="large" icon={<CalendarOutlined />} onClick={() => setIsScheduleOpen(true)}>
          Lịch của tôi
        </Button>
      </div>

      <Card className="shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input 
            placeholder="Tìm kiếm tên hoạt động..." 
            prefix={<SearchOutlined />} 
            size="large" 
            className="md:max-w-sm"
          />
          <Select showSearch optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())} defaultValue="all" size="large" className="w-full md:w-48" prefix={<FilterOutlined />}>
            <Option value="all">Tất cả danh mục</Option>
            <Option value="hoctap">Học tập</Option>
            <Option value="theluc">Thể lực</Option>
            <Option value="ctxh">Công tác xã hội</Option>
          </Select>
        </div>

        {openActivities.length > 0 && (
          <div className="mb-8">
            <Divider orientation="left"><span className="text-lg font-bold text-green-600">Đang mở đăng ký</span></Divider>
            <Row gutter={[24, 24]} align="stretch">
              {openActivities.map(renderActivityCard)}
            </Row>
          </div>
        )}

        {upcomingActivities.length > 0 && (
          <div>
            <Divider orientation="left"><span className="text-lg font-bold text-blue-600">Sắp diễn ra</span></Divider>
            <Row gutter={[24, 24]} align="stretch">
              {upcomingActivities.map(renderActivityCard)}
            </Row>
          </div>
        )}
      </Card>

      <Modal
        title="Lịch sự kiện đã đăng ký"
        open={isScheduleOpen}
        onCancel={() => setIsScheduleOpen(false)}
        footer={null}
        width={800}
      >
        <Calendar cellRender={dateCellRender} />
      </Modal>
    </div>
  );
};
