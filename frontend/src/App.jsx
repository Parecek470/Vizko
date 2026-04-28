import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';

// Import our new components (we will create these next)
import { FormProvider } from './context/FormContext';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import FormBuilder from './components/FormBuilder';
import FormDetail from './components/FormDetail';
import Join from './components/Join';
import StudentFormViewer from "./components/StudentFormViewer";
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard.jsx';

function App() {
  return (
      <FormProvider>
          <Router>
            {/* CssBaseline kicks out default browser margins and applies a clean baseline font */}
            <CssBaseline />

            {/* Box is an MUI component that acts like a <div> but handles styling beautifully */}
            <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5',overflowX: 'hidden' }}>

              {/* Left Side: The Navigation List */}
              <Sidebar />

              {/* Right Side: The Main Content Area */}
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height:'100vh' }}>
                <Topbar />

                {/* This is where React Router swaps out the main screen */}
                <Box sx={{ flexGrow:1, overflow:'hidden'}}>
                  <Routes>
                    {/* Default page: Maybe a welcome screen, or just the builder for now */}
                    <Route path="/" element={<FormBuilder />} />
                    <Route path="/create" element={<FormBuilder />} />
                    <Route path="/forms/:id" element={<FormDetail />} />
                    <Route path="/join" element={<Join />}/>
                    <Route path="/respond/:code" element={<StudentFormViewer />} />
                    <Route paht="/forms/:formId/analytics" element={<AnalyticsDashboard />} />
                  </Routes>
                </Box>
              </Box>

            </Box>
          </Router>
      </FormProvider>
  );
}

export default App;