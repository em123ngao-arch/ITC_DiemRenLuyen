import React, { useEffect, useState } from 'react';
import { Card, Progress, Button, Typography, Tag, Row, Col, Spin, Empty } from 'antd';
import { CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export const StudentDashboard: React.FC = () => {
  const { currentUser } = useOutletContext<any>();
  const navigate = useNavigate();
  
  const [pointData, setPointData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pointRes, eventsRes] = await Promise.all([
          api.get('/points/my-point'),
          api.get('/activities')
        ]);
        
        setPointData(pointRes.data);
        setEvents(eventsRes.data.slice(0, 3));
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu dashboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = [
    { name: 'Học tập', points: 0, max: 20 },
    { name: 'Nội quy', points: 0, max: 25 },
    { name: 'Hoạt động', points: 0, max: 20 },
    { name: 'Cộng đồng', points: 0, max: 15 },
    { name: 'Thành tích', points: 0, max: 20 },
  ];

  let calculatedScore = 0;
  if (pointData?.details) {
    try {
      const details = JSON.parse(pointData.details);
      Object.entries(details).forEach(([key, val]) => {
        const numVal = Number(val);
        calculatedScore += numVal;
        if (key.startsWith('I.')) chartData[0].points += numVal;
        else if (key.startsWith('II.')) chartData[1].points += numVal;
        else if (key.startsWith('III.')) chartData[2].points += numVal;
        else if (key.startsWith('IV.')) chartData[3].points += numVal;
        else if (key.startsWith('V.')) chartData[4].points += numVal;
      });
    } catch(e) {}
  }

  let finalDisplayScore = pointData?.finalScore 
    ?? pointData?.advisorScore 
    ?? pointData?.monitorScore 
    ?? pointData?.studentSelfScore 
    ?? calculatedScore;
    
  finalDisplayScore = Math.max(0, Math.min(100, finalDisplayScore));

  const getRank = (score: number) => {
    if (score === 0 && !pointData?.details) return 'Chưa có điểm';
    if (score >= 90) return 'Xuất sắc';
    if (score >= 80) return 'Giỏi';
    if (score >= 65) return 'Khá';
    if (score >= 50) return 'Trung bình';
    return 'Yếu';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Title level={2}>Xin chào, {currentUser.name} 👋</Title>
        <Text type="secondary">Tổng quan điểm rèn luyện Học kỳ 1, Năm học 2025-2026</Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center justify-center h-full">
              <Progress 
                type="dashboard" 
                percent={finalDisplayScore} 
                format={(percent) => `${percent} Điểm`} 
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <Title level={4} className="mt-4 mb-0">Xếp loại: {getRank(finalDisplayScore)}</Title>
              {pointData?.status && (
                <Tag color="blue" className="mt-2">{pointData.status}</Tag>
              )}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} md={16}>
          <Card title="Chi tiết theo nhóm tiêu chí" className="h-full shadow-sm">
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 30]} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="points" fill="#1677ff" radius={[4, 4, 0, 0]} name="Điểm đạt được" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Sự kiện sắp diễn ra" className="shadow-sm">
        {events.length > 0 ? (
          <div className="flex flex-col gap-4">
            {events.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-start gap-4">
                  <CalendarOutlined className="text-2xl text-blue-500 mt-1" />
                  <div>
                    <a className="text-lg font-medium block">{item.eventName}</a>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-gray-500 text-sm flex items-center gap-1">
                        <CalendarOutlined /> {dayjs(item.startTime).format('DD/MM/YYYY')}
                      </span>
                      <Tag color="blue">+{item.points} ĐRL</Tag>
                      <Tag color="green">{item.location}</Tag>
                    </div>
                  </div>
                </div>
                {item.hasCheckedIn ? (
                  <Button type="default" disabled className="bg-gray-100 text-green-600 border-green-200 font-medium cursor-not-allowed">
                    <CheckCircleOutlined /> Đã điểm danh
                  </Button>
                ) : (
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => navigate('/student/checkin')}>
                    Điểm danh
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty description="Hiện chưa có sự kiện nào" />
        )}
      </Card>
    </div>
  );
};
