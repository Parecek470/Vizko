import { useState } from 'react';
import {
    AppBar, Toolbar, Typography, Button,
    IconButton, Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions, Chip, Stack, Divider,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { TOKEN_KEY } from '../utils/auth';

export default function Topbar({ isTeacherView }) {
    const [aboutOpen, setAboutOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const isLoginPage = location.pathname === '/login';

    const handleLogout = () => {
        localStorage.removeItem(TOKEN_KEY);
        navigate('/');
    };

    return (
        <>
            <AppBar position="static" elevation={1} sx={{ backgroundColor: '#1976d2' }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Vizko - Collect, analyze and visualize data.
                    </Typography>

                    {/* About button */}
                    <IconButton
                        color="inherit"
                        onClick={() => setAboutOpen(true)}
                        aria-label="About this application"
                        sx={{ mr: 1 }}
                    >
                        <InfoOutlinedIcon />
                    </IconButton>

                    {/* Teacher/Student toggle — hidden on login page */}
                    {!isLoginPage && (
                        isTeacherView ? (
                            <>
                                <Button
                                    color="inherit"
                                    component={RouterLink}
                                    to="/"
                                    sx={{ fontWeight: 'bold', mr: 1 }}
                                >
                                    Student Access
                                </Button>
                                <Button
                                    color="inherit"
                                    startIcon={<LogoutIcon />}
                                    onClick={handleLogout}
                                    sx={{ fontWeight: 'bold' }}
                                >
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <Button color="inherit" component={RouterLink} to="/login" sx={{ fontWeight: 'bold' }}>
                                Teacher Access
                            </Button>
                        )
                    )}
                </Toolbar>
            </AppBar>

            {/* About Dialog */}
            <Dialog open={aboutOpen} onClose={() => setAboutOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>About Vizko</DialogTitle>
                <DialogContent>
                    <DialogContentText gutterBottom>
                        <strong>Vizko</strong> is a web application for creating forms, collecting student
                        responses, and visualizing the results through interactive charts and analytics.
                        It was built as a bachelor's degree final project.
                    </DialogContentText>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        AUTHOR
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        Marek Mänzel — A23B0227P, Západočeská univerzita v Plzni, 2025/2026
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        TECH STACK
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                        {['React', 'Vite', 'Material UI', 'FastAPI', 'Python', 'Docker'].map((tech) => (
                            <Chip key={tech} label={tech} size="small" variant="outlined" />
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAboutOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}