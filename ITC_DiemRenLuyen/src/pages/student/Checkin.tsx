import React, { useState } from 'react';
import { Card, Input, Button, Typography, message, Result } from 'antd';
import { QrcodeOutlined, ScanOutlined, CameraOutlined, CloseOutlined } from '@ant-design/icons';
import { Scanner } from '@yudiel/react-qr-scanner';
import api from '../../utils/api';

const { Title, Text } = Typography;

export const StudentCheckin: React.FC = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showScanner, setShowScanner] = useState(false);

  // Generate a unique device fingerprint (simple version) on mount
  const [deviceId] = useState(() => {
    let id = localStorage.getItem('deviceId');
    if (!id) {
      id = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('deviceId', id);
    }
    return id;
  });

  const performCheckin = async (qrTokenOrId: string, isDynamicQr = false) => {
    setLoading(true);
    try {
      const payload = isDynamicQr 
        ? { qrToken: qrTokenOrId, deviceId } 
        : { activityId: qrTokenOrId, deviceId };
      await api.post('/activities/checkin', payload);
      setStatus('success');
      message.success('Điểm danh thành công!');
    } catch(err: any) {
      setStatus('error');
      message.error(err.response?.data?.message || 'Mã không hợp lệ hoặc bạn đã điểm danh!');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = () => {
    if (!code.trim()) {
      message.warning('Vui lòng nhập mã sự kiện!');
      return;
    }
    // Nếu sinh viên nhập tay, mặc định coi như không phải QR động
    performCheckin(code, false);
  };

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes.length > 0 && detectedCodes[0].rawValue) {
      const scannedCode = detectedCodes[0].rawValue;
      setCode(scannedCode);
      setShowScanner(false);
      
      // Nếu chuỗi dài (như JWT), coi như là QR động
      const isDynamic = scannedCode.length > 30;
      performCheckin(scannedCode, isDynamic);
    }
  };

  if (status === 'success') {
    return (
      <Card className="max-w-md mx-auto mt-10 shadow-sm">
        <Result
          status="success"
          title="Điểm danh thành công!"
          subTitle="Bạn đã được ghi nhận tham gia sự kiện thành công."
          extra={[
            <Button type="primary" key="console" onClick={() => { setStatus('idle'); setCode(''); }}>
              Điểm danh sự kiện khác
            </Button>
          ]}
        />
      </Card>
    );
  }

  return (
    <div className="max-w-md mx-auto flex flex-col gap-6">
      <div className="text-center">
        <Title level={2}>Điểm danh sự kiện</Title>
        <Text type="secondary">Quét mã QR hoặc nhập mã Code để ghi nhận tham gia</Text>
      </div>

      <Card className="shadow-sm">
        {showScanner ? (
          <div className="flex flex-col items-center mb-6 relative">
             <div className="w-full aspect-square bg-black rounded-lg overflow-hidden relative">
                <Scanner onScan={handleScan} />
             </div>
             <Button 
               danger 
               icon={<CloseOutlined />} 
               className="mt-4" 
               onClick={() => setShowScanner(false)}
             >
               Đóng Camera
             </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 mb-6">
            <QrcodeOutlined className="text-8xl text-gray-400 mb-4" />
            <Button icon={<CameraOutlined />} size="large" onClick={() => setShowScanner(true)}>
              Mở Camera Quét QR
            </Button>
            <Text type="secondary" className="mt-2 text-xs">Tính năng này yêu cầu quyền truy cập Camera</Text>
          </div>
        )}

        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400">HOẶC</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div className="flex flex-col gap-3">
          <Text className="font-medium">Nhập mã Code thủ công:</Text>
          <Input 
            size="large" 
            placeholder="Ví dụ: ITC2026" 
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            prefix={<ScanOutlined className="text-gray-400" />}
          />
          <Button type="primary" size="large" onClick={handleCheckin} className="w-full mt-2">
            Xác nhận Điểm danh
          </Button>
          {status === 'error' && (
            <Text type="danger" className="text-center mt-2">Mã sự kiện không hợp lệ hoặc đã hết hạn.</Text>
          )}
        </div>
      </Card>
    </div>
  );
};
