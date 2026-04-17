import { AppBar, Toolbar, Typography } from '@mui/material';

export default function Topbar() {
    return (
        <AppBar position="static" elevation={1} sx={{ backgroundColor: '#1976d2' }}>
            <Toolbar>
                <Typography variant="h6" component="div">
                    Vizko - Collect, analyze and visualize data.
                </Typography>
            </Toolbar>
        </AppBar>
    );
}