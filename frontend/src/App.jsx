import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';

import { FormProvider } from './context/FormContext';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import FormBuilder from './components/FormBuilder';
import FormDetail from './components/FormDetail';
import Join from './components/Join';
import StudentFormViewer from "./components/StudentFormViewer";
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard.jsx';
import EditorLogin from './components/EditorLogin.jsx';

// --- LAYOUTS ---

// 1. The layout for students: Just the Topbar and the Content
const StudentLayout = () => {
  return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f5f5f5' }}>
        <Topbar isTeacherView={false} />
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Outlet /> {/* Child routes will render here */}
        </Box>
      </Box>
  );
};

// 2. The layout for teachers: Topbar, Sidebar, and Content
const TeacherLayout = () => {
  return (
      <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5', overflowX: 'hidden' }}>
        <Sidebar />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <Topbar isTeacherView={true} />
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Outlet /> {/* Child routes will render here */}
          </Box>
        </Box>
      </Box>
  );
};

const AnalyticsLayout = () => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f5f5f5' }}>
            <Topbar isTeacherView={true} />
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <Outlet /> {/* Child routes will render here */}
            </Box>
        </Box>
    )
}

// --- MAIN APP COMPONENT ---

function App() {
  return (
      <FormProvider>
        <Router>
          <CssBaseline />
          <Routes>

            {/* STUDENT ROUTES (Wrapped in StudentLayout) */}
            <Route element={<StudentLayout />}>
              <Route path="/" element={<Join />} />
              <Route path="/join" element={<Join />} />
              <Route path="/respond/:code" element={<StudentFormViewer />} />
              <Route path="/login" element={<EditorLogin />} />
            </Route>

            {/* TEACHER ROUTES (Wrapped in TeacherLayout) */}
            <Route element={<TeacherLayout />}>
              <Route path="/create" element={<FormBuilder />} />
              <Route path="/forms/:id/edit" element={<FormBuilder />} />
              <Route path="/forms/:id" element={<FormDetail />} />
            </Route>

            <Route element={<AnalyticsLayout />}>
              <Route path="/forms/:id/analytics" element={<AnalyticsDashboard />} />
            </Route>

          </Routes>
        </Router>
      </FormProvider>
  );
}

export default App;