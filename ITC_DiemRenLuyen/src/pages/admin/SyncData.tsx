import React, { useState } from 'react';
import { Card, Button, Typography, Progress, message, Steps, Upload, Switch, Divider, Spin } from 'antd';
import { CloudSyncOutlined, DatabaseOutlined, CheckCircleOutlined, InboxOutlined, SettingOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import api from '../../utils/api';

const { Title, Text } = Typography;
const { Dragger } = Upload;

export const SyncData: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [fileList, setFileList] = useState<any[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isGradingOpen, setIsGradingOpen] = useState<boolean>(true);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings/grading');
        setIsGradingOpen(res.data.isOpen);
      } catch (err) {
        console.error('Error fetching settings');
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  const toggleGrading = async (checked: boolean) => {
    try {
      setLoadingSettings(true);
      await api.put('/settings/grading', { isOpen: checked });
      setIsGradingOpen(checked);
      message.success(checked ? 'Đã MỞ cổng chấm điểm cho sinh viên!' : 'Đã ĐÓNG cổng chấm điểm rèn luyện!');
    } catch (err) {
      message.error('Lỗi khi cập nhật trạng thái cổng!');
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleFileUpload = (file: any) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON and explicitly ignore empty rows or metadata if needed. 
        // We assume headers are MSSV and "Xếp loại" or similar.
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const studentsData = jsonData.map((row: any) => {
           // Try to find columns mapping to mssv and rank
           const mssvKey = Object.keys(row).find(k => k.toLowerCase().includes('mssv') || k.toLowerCase().includes('mã sv'));
           const rankKey = Object.keys(row).find(k => k.toLowerCase().includes('xếp loại') || k.toLowerCase().includes('học lực'));
           
           return {
             mssv: mssvKey ? String(row[mssvKey]) : null,
             rank: rankKey ? String(row[rankKey]) : null
           };
        }).filter(item => item.mssv && item.rank);

        if (studentsData.length === 0) {
           message.error('Không tìm thấy dữ liệu hợp lệ trong file. Vui lòng đảm bảo có cột MSSV và Xếp loại.');
           setFileList([]);
           return;
        }

        setParsedData(studentsData);
        message.success(`Đã đọc thành công ${studentsData.length} dòng dữ liệu.`);
      } catch (err) {
        message.error('Lỗi khi đọc file Excel!');
      }
    };
    reader.readAsBinaryString(file);
    return false; // Prevent default upload
  };

  const handleSync = async () => {
    if (parsedData.length === 0) {
      message.warning('Vui lòng chọn file Excel có dữ liệu trước khi đồng bộ.');
      return;
    }

    setSyncing(true);
    setProgress(0);
    setCurrentStep(0);

    try {
      // Simulate progress for UI
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90;
          const newProgress = prev + Math.floor(Math.random() * 15) + 10;
          if (newProgress > 30 && newProgress < 70) setCurrentStep(1);
          if (newProgress >= 70) setCurrentStep(2);
          return newProgress;
        });
      }, 300);

      await api.post('/points/sync', { studentsData: parsedData });
      
      clearInterval(interval);
      setProgress(100);
      setCurrentStep(3);
      setSyncing(false);
      message.success('Đồng bộ dữ liệu học tập thành công!');
    } catch(err) {
      setSyncing(false);
      setProgress(0);
      message.error('Lỗi khi đồng bộ dữ liệu!');
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <Title level={2}>Cấu hình Hệ thống & Đồng bộ</Title>
        <Text type="secondary">Quản lý trạng thái hệ thống và đồng bộ dữ liệu điểm học tập</Text>
      </div>

      <Card className="shadow-sm border-l-4 border-l-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <Title level={4} className="!mb-1"><SettingOutlined className="mr-2" /> Trạng thái Cổng chấm điểm</Title>
            <Text type="secondary">
              {isGradingOpen 
                ? 'Sinh viên hiện tại ĐANG ĐƯỢC PHÉP vào trang chấm điểm rèn luyện.' 
                : 'Đã KHÓA cổng. Sinh viên sẽ bị chặn khi truy cập trang chấm điểm.'}
            </Text>
          </div>
          <div className="flex items-center gap-3">
            <span className={`font-bold ${isGradingOpen ? 'text-green-500' : 'text-red-500'}`}>
              {isGradingOpen ? 'ĐANG MỞ CỔNG' : 'ĐÃ KHÓA CỔNG'}
            </span>
            {loadingSettings ? <Spin /> : (
              <Switch 
                checked={isGradingOpen} 
                onChange={toggleGrading} 
                className={isGradingOpen ? 'bg-green-500' : 'bg-gray-300'}
              />
            )}
          </div>
        </div>
      </Card>

      <Card className="shadow-sm mt-4">
        <div className="mb-6">
          <Title level={4} className="!mb-1">Đồng bộ điểm học tập</Title>
          <Text type="secondary">Tải lên danh sách điểm học tập (File Excel) để hệ thống tự động điền</Text>
        </div>
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
          <DatabaseOutlined className="text-6xl text-blue-400 mb-6" />
          
          <div className="w-full max-w-lg mb-8 bg-white p-4 rounded shadow-sm border border-gray-100">
             <Dragger
               accept=".xlsx, .xls, .csv"
               beforeUpload={handleFileUpload}
               fileList={fileList}
               onChange={(info) => setFileList(info.fileList.slice(-1))}
               maxCount={1}
             >
               <p className="ant-upload-drag-icon">
                 <InboxOutlined />
               </p>
               <p className="ant-upload-text">Nhấp hoặc kéo thả file Excel vào khu vực này</p>
               <p className="ant-upload-hint">
                 File cần có cột "MSSV" và cột "Xếp loại" (Xuất sắc, Giỏi, Khá...)
               </p>
             </Dragger>
          </div>

          <Button 
            type="primary" 
            size="large" 
            icon={<CloudSyncOutlined />} 
            onClick={handleSync}
            loading={syncing}
            className="w-64 h-12 text-lg mb-8"
            disabled={parsedData.length === 0}
          >
            {syncing ? 'Đang đồng bộ...' : 'Thực hiện Đồng bộ'}
          </Button>

          {(syncing || progress === 100) && (
            <div className="w-full max-w-lg">
              <Progress percent={progress} status={progress === 100 ? 'success' : 'active'} strokeWidth={12} />
              
              <div className="mt-8">
                <Steps
                  current={currentStep}
                  items={[
                    { title: 'Tải lên', description: 'Đang gửi dữ liệu...' },
                    { title: 'Xử lý', description: 'Đang phân tích điểm...' },
                    { title: 'Cập nhật', description: 'Ghi vào CSDL' },
                    { title: 'Hoàn tất', description: 'Thành công', icon: progress === 100 ? <CheckCircleOutlined /> : undefined },
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
