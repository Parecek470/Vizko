import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';

// Import our new components (we will create these next)
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import FormBuilder from './components/FormBuilder';

function App() {
  return (
      <Router>
        {/* CssBaseline kicks out default browser margins and applies a clean baseline font */}
        <CssBaseline />

        {/* Box is an MUI component that acts like a <div> but handles styling beautifully */}
        <Box sx={{ display: 'flex',width:'100vw', height: '100vh', backgroundColor: '#f5f5f5' }}>

          {/* Left Side: The Navigation List */}
          <Sidebar />

          {/* Right Side: The Main Content Area */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Topbar />

            {/* This is where React Router swaps out the main screen */}
            <Box sx={{ padding: 4, overflowY: 'auto' }}>
              <Routes>
                {/* Default page: Maybe a welcome screen, or just the builder for now */}
                <Route path="/" element={<FormBuilder />} />
                <Route path="/create" element={<FormBuilder />} />
                {/* Later we can add: <Route path="/forms/:id" element={<FormAnalytics />} /> */}
              </Routes>
            </Box>
          </Box>

        </Box>
      </Router>
  );
}

export default App;