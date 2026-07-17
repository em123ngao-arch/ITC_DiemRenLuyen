import React, { useState } from 'react';
import { Card, Button, Typography, message, Table, Upload, Space } from 'antd';
import { InboxOutlined, KeyOutlined, DownloadOutlined, CloudUploadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import api from '../../utils/api';

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface StudentRecord {
  'TT': string | number;
  'Mã số HSSV': string;
  'Họ Và Tên': string;
  'Lớp': string;
  'Mật Khẩu'?: string;
  [key: string]: any;
}

export const ImportAccounts: React.FC = () => {
  const [data, setData] = useState<StudentRecord[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<StudentRecord>(worksheet);
        
        if (json.length === 0) {
          message.error('File Excel trống!');
          return;
        }

        const firstRow = json[0];
        if (!('TT' in firstRow) || !('Mã số HSSV' in firstRow) || !('Họ Và Tên' in firstRow) || !('Lớp' in firstRow)) {
          message.error('File không đúng định dạng! Yêu cầu các cột: TT, Mã số HSSV, Họ Và Tên, Lớp');
          return;
        }

        const normalizedData = json.map(row => ({
          ...row,
          'Mã số HSSV': row['Mã số HSSV'].toString(),
          'Mật Khẩu': row['Mật Khẩu'] || ''
        }));

        setData(normalizedData);
        setIsDataLoaded(true);
        message.success(`Đã tải thành công ${normalizedData.length} dòng dữ liệu.`);
      } catch (error) {
        message.error('Lỗi khi đọc file Excel!');
        console.error(error);
      }
    };
    reader.readAsBinaryString(file);
    return false;
  };

  const generatePasswords = () => {
    if (!isDataLoaded || data.length === 0) {
      message.warning('Vui lòng import dữ liệu trước!');
      return;
    }

    const usedPasswords = new Set<string>();
    
    const generateUniquePassword = () => {
      const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const lower = "abcdefghijklmnopqrstuvwxyz";
      const numbers = "0123456789";
      
      while (true) {
        const chars = new Set<string>();
        
        const getRandChar = (charset: string) => {
          let c = charset[Math.floor(Math.random() * charset.length)];
          while (chars.has(c)) {
            c = charset[Math.floor(Math.random() * charset.length)];
          }
          chars.add(c);
        };

        getRandChar(upper);
        getRandChar(lower);
        getRandChar(numbers);
        
        const all = upper + lower + numbers;
        for(let i=0; i<3; i++) {
          getRandChar(all);
        }
        
        const newPwd = Array.from(chars).sort(() => 0.5 - Math.random()).join('');
        if (!usedPasswords.has(newPwd)) {
          usedPasswords.add(newPwd);
          return newPwd;
        }
      }
    };

    const newData = data.map(row => ({
      ...row,
      'Mật Khẩu': row['Mật Khẩu'] ? row['Mật Khẩu'] : generateUniquePassword()
    }));

    setData(newData);
    message.success('Đã tạo mật khẩu hàng loạt thành công!');
  };

  const downloadExcel = () => {
    if (!isDataLoaded || data.length === 0) {
      message.warning('Không có dữ liệu để xuất!');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TaiKhoan");
    
    XLSX.writeFile(workbook, "DanhSachTaiKhoan_MatKhau.xlsx");
    message.success('Đã tải xuống file Excel!');
  };

  const saveToDatabase = async () => {
    try {
      setIsSaving(true);
      const payload = data.map(row => ({
        id: row['Mã số HSSV'],
        name: row['Họ Và Tên'],
        class: row['Lớp'],
        role: 'Sinh viên',
        password: row['Mật Khẩu']
      }));

      const res = await api.post('/users/import', { users: payload });
      message.success(res.data.message || 'Lưu dữ liệu thành công!');
      setData([]);
      setIsDataLoaded(false);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi lưu dữ liệu!');
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    { title: 'TT', dataIndex: 'TT', key: 'TT', width: 60 },
    { title: 'Mã số HSSV', dataIndex: 'Mã số HSSV', key: 'Mã số HSSV', width: 120 },
    { title: 'Họ Và Tên', dataIndex: 'Họ Và Tên', key: 'Họ Và Tên' },
    { title: 'Lớp', dataIndex: 'Lớp', key: 'Lớp', width: 100 },
    { 
      title: 'Mật Khẩu', 
      dataIndex: 'Mật Khẩu', 
      key: 'Mật Khẩu',
      render: (text: string) => text ? <span className="text-green-600 font-mono font-medium">{text}</span> : <span className="text-gray-400 italic">Chưa có</span>
    },
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Title level={2}>Tạo tài khoản hàng loạt (Import)</Title>
          <Text type="secondary">Nhập danh sách sinh viên từ file Excel và tự động tạo mật khẩu</Text>
        </div>
        <Space>
          <Button 
            type="primary" 
            size="large" 
            icon={<KeyOutlined />} 
            onClick={generatePasswords}
            disabled={!isDataLoaded}
            className="bg-green-600 hover:bg-green-500"
          >
            Tạo mật khẩu
          </Button>
          <Button 
            size="large" 
            icon={<DownloadOutlined />} 
            onClick={downloadExcel}
            disabled={!isDataLoaded}
          >
            Tải Excel
          </Button>
          <Button 
            type="primary"
            size="large" 
            icon={<CloudUploadOutlined />} 
            onClick={saveToDatabase}
            disabled={!isDataLoaded}
            loading={isSaving}
          >
            Lưu vào DB
          </Button>
        </Space>
      </div>

      <Card className="shadow-sm">
        {!isDataLoaded ? (
          <Dragger 
            accept=".xlsx, .xls"
            customRequest={({ file, onSuccess }) => {
              handleFileUpload(file as File);
              if (onSuccess) onSuccess("ok");
            }}
            showUploadList={false}
            className="p-10"
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined className="text-blue-500" />
            </p>
            <p className="ant-upload-text text-lg font-medium">Nhấp hoặc kéo thả file Excel vào khu vực này</p>
            <p className="ant-upload-hint text-gray-500">
              Chỉ hỗ trợ file .xlsx hoặc .xls. Yêu cầu các cột bắt buộc: TT, Mã số HSSV, Họ Và Tên, Lớp.
            </p>
          </Dragger>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-blue-50 p-3 rounded border border-blue-100">
              <span className="text-blue-700 font-medium">Đã tải lên {data.length} tài khoản</span>
              <Button type="text" danger onClick={() => { setData([]); setIsDataLoaded(false); }}>Hủy danh sách hiện tại</Button>
            </div>
            <Table scroll={{ x: 'max-content' }} 
              columns={columns} 
              dataSource={data} 
              rowKey="Mã số HSSV"
              pagination={{ pageSize: 10 }}
              size="middle"
            />
          </div>
        )}
      </Card>
    </div>
  );
};
