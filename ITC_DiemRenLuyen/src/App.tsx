import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, FloatButton } from 'antd';
import viVN from 'antd/locale/vi_VN';

import { MainLayout } from './components/MainLayout';
import { StudentDashboard } from './pages/student/Dashboard';
import { EvidenceDeclaration } from './pages/student/Evidence';
import { StudentCheckin } from './pages/student/Checkin';
import { TrainingScores } from './pages/student/TrainingScores';
import { Activities } from './pages/student/Activities';
import { TeamGrading } from './pages/monitor/TeamGrading';
import { AdminActivities } from './pages/admin/Activities';
import { ImportAccounts } from './pages/admin/ImportAccounts';
import { SyncData } from './pages/admin/SyncData';
import { Reports } from './pages/admin/Reports';
import { Users } from './pages/admin/Users';
import { Semesters } from './pages/admin/Semesters';
import { ApproveExternal } from './pages/admin/ApproveExternal';
import { ExternalActivities } from './pages/student/ExternalActivities';

import { Login } from './pages/Login';

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
      }}
    >
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            
            {/* Student Routes */}
            <Route path="student/dashboard" element={<StudentDashboard />} />
            <Route path="student/scores" element={<TrainingScores />} />
            <Route path="student/activities" element={<Activities />} />
            <Route path="student/evidence" element={<EvidenceDeclaration />} />
            <Route path="student/checkin" element={<StudentCheckin />} />
            <Route path="student/external" element={<ExternalActivities />} />
            
            {/* Monitor/Advisor Routes */}
            <Route path="grading" element={<TeamGrading />} />
            
            {/* Admin Routes */}
            <Route path="admin" element={<ImportAccounts />} />
            <Route path="admin/users" element={<Users />} />
            <Route path="admin/activities" element={<AdminActivities />} />
            <Route path="admin/sync" element={<SyncData />} />
            <Route path="admin/reports" element={<Reports />} />
            <Route path="admin/semesters" element={<Semesters />} />
            <Route path="admin/approve-external" element={<ApproveExternal />} />
          </Route>
        </Routes>
      </Router>
      
      {/* Scroll to top button */}
      <FloatButton.BackTop />
    </ConfigProvider>
  );
};

export default App;
