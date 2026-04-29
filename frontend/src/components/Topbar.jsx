import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function Topbar({ isTeacherView }) {
    return (
        <AppBar position="static" elevation={1} sx={{ backgroundColor: '#1976d2' }}>
            <Toolbar>
                {/* flexGrow: 1 pushes the button all the way to the right side */}
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Vizko - Collect, analyze and visualize data.
                </Typography>

                {/* Only render the Teacher Access button if we are on a student layout */}
                {!isTeacherView && (
                    <Button
                        color="inherit"
                        component={RouterLink}
                        to="/login"
                        sx={{ fontWeight: 'bold' }}
                    >
                        Teacher Access
                    </Button>
                )}
            </Toolbar>
        </AppBar>
    );
}