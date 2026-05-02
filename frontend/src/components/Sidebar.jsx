import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Typography,
    Button,
    Chip,
    Divider,
    CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useForms } from '../context/FormContext';
import { getCurrentUsername } from '../utils/auth';

export default function Sidebar() {
    const { forms, loading } = useForms();
    const currentUser = getCurrentUsername();
    const myForms = forms.filter(f => f.owner === currentUser);
    const sharedForms = forms.filter(f => f.owner !== currentUser);

    // React Router hooks for navigation
    const navigate = useNavigate();
    const location = useLocation();


    return (
        <Box
            sx={{
                width: '20vh',
                backgroundColor: '#ffffff',
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                height: '100%' // Fills the vertical space provided by App.jsx
            }}
        >
            {/* Sidebar Header & Action Button */}
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
                    My Forms
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/create')}
                    sx={{ textTransform: 'none', fontWeight: 'bold' }}
                >
                    Create New Form
                </Button>
            </Box>

            <Divider />

            {/* Forms List Area */}
            <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : forms.length === 0 ? (
                    <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: '#888' }}>
                        No forms created yet.
                    </Typography>
                ) : (
                    <List disablePadding>
                        {myForms.map((form) => {
                            // Check if the current URL matches this form to highlight the active tab
                            const isActiveRoute = location.pathname === `/forms/${form.id}`;

                            return (
                                <ListItem key={form.id} disablePadding>
                                    <ListItemButton
                                        selected={isActiveRoute}
                                        onClick={() => navigate(`/forms/${form.id}`)}
                                        sx={{
                                            borderLeft: isActiveRoute ? '4px solid #1976d2' : '4px solid transparent',
                                            pl: 2 // Padding left
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle2" sx={{ fontWeight: isActiveRoute ? 'bold' : 'normal' }}>
                                                    {form.title}
                                                </Typography>
                                            }
                                            secondary={`${form.response_count} Responses`}
                                        />

                                        {/* Visual indicator for Form Status */}
                                        <Chip
                                            label={form.is_active ? "Live" : "Draft"}
                                            size="small"
                                            color={form.is_active ? "success" : "default"}
                                            sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                        {sharedForms.length > 0 && (
                            <>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ p: 2, pb: 1 }}>
                                    <Typography variant="overline" sx={{ color: '#888', fontSize: '0.65rem' }}>
                                        Shared Forms
                                    </Typography>
                                </Box>
                                <List disablePadding>
                                    {sharedForms.map((form) => {
                                        const isActiveRoute = location.pathname === `/forms/${form.id}`;
                                        return (
                                            <ListItem key={form.id} disablePadding>
                                                <ListItemButton
                                                    selected={isActiveRoute}
                                                    onClick={() => navigate(`/forms/${form.id}`)}
                                                    sx={{
                                                        borderLeft: isActiveRoute ? '4px solid #9c27b0' : '4px solid transparent',
                                                        pl: 2
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Typography variant="subtitle2" sx={{ fontWeight: isActiveRoute ? 'bold' : 'normal' }}>
                                                                {form.title}
                                                            </Typography>
                                                        }
                                                        secondary={`${form.response_count} Responses`}
                                                    />
                                                    <Chip
                                                        label="Shared"
                                                        size="small"
                                                        color="secondary"
                                                        sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
                                                    />
                                                </ListItemButton>
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            </>
                        )}
                    </List>
                )}
            </Box>
        </Box>
    );
}