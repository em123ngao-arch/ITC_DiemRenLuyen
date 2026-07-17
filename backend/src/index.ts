import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import activityRoutes from './routes/activities';
import pointRoutes from './routes/points';
import evidencesRoutes from './routes/evidences';
import settingsRoutes from './routes/settings';
import semesterRoutes from './routes/semesters';
import externalActivityRoutes from './routes/external-activities';
import reportRoutes from './routes/reports';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

import uploadRoutes from './routes/upload';
import path from 'path';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/points', pointRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/evidences', evidencesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/external-activities', externalActivityRoutes);
app.use('/api/reports', reportRoutes);

// Phục vụ file tĩnh trong thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
