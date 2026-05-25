import {useState, useEffect, useMemo} from 'react';
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
    CircularProgress, ToggleButton, ToggleButtonGroup, Tooltip, MenuItem, FormControl, InputLabel, Select
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useForms } from '../context/FormContext';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { getCurrentUsername } from '../utils/auth';
import { formatDateTimeShort} from "../utils/date.js";


const SORT_OPTIONS = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'last_submission_at', label: 'Last answer time' },
]

function sortComparator(field, direction){
    return (a, b) => {
        const aVal = a[field] ? new Date(a[field]).getTime() : null;
        const bVal = b[field] ? new Date(b[field]).getTime() : null;

        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return 1;
        if (bVal === null) return -1;

        return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
}

export default function Sidebar() {
    const { forms, loading } = useForms();
    const currentUser = getCurrentUsername();

    // React Router hooks for navigation
    const navigate = useNavigate();
    const location = useLocation();

    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');

    const { myForms, sharedForms } = useMemo(() => {
        const comparator = sortComparator(sortField, sortDirection);
        const mine   = forms.filter(f => f.owner === currentUser).sort(comparator);
        const shared = forms.filter(f => f.owner !== currentUser).sort(comparator);
        return { myForms: mine, sharedForms: shared };
    }, [forms, currentUser, sortField, sortDirection]);



    return (
        <Box
            sx={{
                width: '20vh',
                backgroundColor: '#ffffff',
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
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

            <Box sx={{ px: 2, py: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel id="sort-field-label" sx={{ fontSize: '0.75rem' }}>
                        Sort by
                    </InputLabel>
                    <Select
                        labelId="sort-field-label"
                        value={sortField}
                        label="Sort by"
                        onChange={(e) => setSortField(e.target.value)}
                        sx={{ fontSize: '0.75rem' }}
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.75rem' }}>
                                {opt.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Tooltip title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}>
                    <ToggleButtonGroup
                        value={sortDirection}
                        exclusive
                        onChange={(_, newDir) => { if (newDir) setSortDirection(newDir); }}
                        size="small"
                    >
                        <ToggleButton value="asc" aria-label="Sort ascending">
                            <ArrowUpwardIcon fontSize="small" />
                        </ToggleButton>
                        <ToggleButton value="desc" aria-label="Sort descending">
                            <ArrowDownwardIcon fontSize="small" />
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Tooltip>
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
                            const isActiveRoute = location.pathname === `/forms/${form.id}`;

                            return (
                                <ListItem key={form.id} disablePadding>
                                    <ListItemButton
                                        selected={isActiveRoute}
                                        onClick={() => navigate(`/forms/${form.id}`)}
                                        sx={{
                                            borderLeft: isActiveRoute ? '4px solid #1976d2' : '4px solid transparent',
                                            pl: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                        }}
                                    >
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography
                                                variant="subtitle2"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: isActiveRoute ? 'primary.main' : 'text.primary',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {form.title}
                                            </Typography>

                                            {/* Each line in its own Box to guarantee block stacking */}
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    {`${form.response_count} responses`}
                                                </Typography>
                                                {form.created_at && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {`Created: ${formatDateTimeShort(form.created_at)}`}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                        <Chip
                                            label={form.is_active ? 'Live' : 'Draft'}
                                            size="small"
                                            color={form.is_active ? 'success' : 'default'}
                                            sx={{ fontSize: '0.7rem', height: 20, flexShrink: 0 }}
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
                                                        pl: 2,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                    }}
                                                >
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography
                                                            variant="subtitle2"
                                                            sx={{
                                                                fontWeight: 600,
                                                                color: isActiveRoute ? 'primary.main' : 'text.primary',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {form.title}
                                                        </Typography>

                                                        {/* Each line in its own Box to guarantee block stacking */}
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {`${form.response_count} responses`}
                                                            </Typography>
                                                            {form.created_at && (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {`Created: ${formatDateTimeShort(form.created_at)}`}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                    <Chip
                                                        label="Shared"
                                                        size="small"
                                                        color="secondary"
                                                        sx={{ fontSize: '0.7rem', height: 20, flexShrink: 0 }}
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