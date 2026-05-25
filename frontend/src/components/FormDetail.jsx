import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Button, CircularProgress, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    Snackbar, Alert, Tooltip, Collapse
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForms } from '../context/FormContext';
import {apiFetch} from "../utils/api.js";
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import CopyAllIcon from '@mui/icons-material/CopyAll';
import { getCurrentUsername} from "../utils/auth.js";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import { QRCodeSVG } from 'qrcode.react';
import IconButton from '@mui/material/IconButton';
import {formatDateTimeLong} from "../utils/date.js";


export default function FormDetail() {
    const { id } = useParams(); // Gets the ID from the URL
    const navigate = useNavigate();
    const { refreshForms } = useForms();


    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qrOpen, setQrOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [timelineOpen, setTimelineOpen] = useState(false);



    useEffect(() => {
        const fetchFormDetail = async () => {
            try {
                const res = await apiFetch(`/forms/${id}`);
                if (res.ok){
                    setForm(await res.json());
                }

            } catch (err) {
                console.error("Error fetching form:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFormDetail();
    }, [id]);

    if (loading) return <CircularProgress sx={{ m: 4 }} />;
    if (!form) return <Typography>Form not found.</Typography>;

    const joinUrl = `${window.location.origin}/join?code=${form.join_code ?? ''}`;

    const currentUser = getCurrentUsername();
    const isOwner = form.owner === currentUser;
    const isReadOnly = !isOwner;



    const handleCopyCode = async () => {
        await navigator.clipboard.writeText(form.join_code);
        setCopied(true);
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this form and all its responses?")) return;

        await apiFetch(`/forms/${id}`, { method: 'DELETE' });
        await refreshForms(); // Update sidebar
        navigate('/create'); // Send back to home
    };

    const handleDeleteResponses = async () => {
        if (!window.confirm("Are you sure you want to delete all responses for this form?")) return;
        const res = await apiFetch(`/forms/${id}/submissions`, { method: 'DELETE' });
        if (res.ok) {
            alert("Responses deleted successfully.");
            const updated = await apiFetch(`/forms/${id}`) && refreshForms();
            if (updated.ok) setForm(await updated.json());
        } else {
            console.error("Failed to delete responses:", res.statusText);
        }
    }

    const handleExport = () => {
        apiFetch(`/forms/${id}/export/csv`).then(async (res) => {
            if (!res.ok) return console.error("Export failed:", res.status);
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objectUrl;
            // Read filename from Content-Disposition header
            const disposition = res.headers.get('Content-Disposition');
            const match = disposition?.match(/filename="?([^";\n]+)"?/);
            a.download = match?.[1]?.trim() ?? `export_${id}.csv`;
            a.click();
            URL.revokeObjectURL(objectUrl);
        });
    };

    const handleEdit = () => {
        navigate(`/forms/${id}/edit`);
    }

    const handleDuplicate = async () => {
        const res = await apiFetch(`/forms/${id}/duplicate`, { method: 'POST' });
        if (res.ok) {
            const newForm = await res.json();
            await refreshForms();
            navigate(`/forms/${newForm.id}/edit`);
        } else {
            console.error("Failed to duplicate form:", res.status);
        }
    }

    if (loading) return <CircularProgress sx={{ m: 4 }} />;
    if (!form) return <Typography>Form not found.</Typography>;

    return (
        <Box sx={{ p: 4, maxWidth: 1000, mx: 'auto' }}>
            <Paper sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box sx={{ display: 'flex',flexDirection:"column", gap: 2 }}>
                        <Typography variant="h4" sx={{pt:0}}>{form.title}</Typography>

                        <Typography color="text.secondary" paragraph>
                            {form.description || "No description provided."}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {form.is_shared && (
                            <Chip label="Shared" color="secondary" size="medium" sx={{ ml: 1 }} />
                        )}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width:260,flexShrink:0 , position: 'relative'}}>
                            <Chip
                                label={form.is_active ? "Live" : "Draft"}
                                color={form.is_active ? "success" : "default"}
                            />
                            <Chip
                                label={`${form.response_count} Responses`}
                                color="primary"
                                variant="outlined"
                            />

                            {/* Collapsible timeline */}
                            <Box
                                sx={{
                                    mt: 1,
                                    p: 1,
                                    borderRadius: 2,
                                    backgroundColor: 'grey.50',
                                    border: '1px solid',
                                    borderColor: 'grey.200',
                                    width: '100%',
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => setTimelineOpen((prev) => !prev)}
                                >
                                    <Typography variant="caption" fontWeight={600}>
                                        Form timeline
                                    </Typography>
                                    <IconButton size="small">
                                        {timelineOpen ? (
                                            <ExpandLessIcon fontSize="small" />
                                        ) : (
                                            <ExpandMoreIcon fontSize="small" />
                                        )}
                                    </IconButton>
                                </Box>

                                <Collapse in={timelineOpen} timeout="auto" unmountOnExit>
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            mt: 1,
                                            p: 2,
                                            borderRadius: 2,
                                            backgroundColor: 'background.paper',
                                            boxShadow: 3,
                                            border: '1px solid',
                                            borderColor: 'grey.300',
                                            width: 260,
                                            zIndex: 10,
                                        }}
                                    >
                                        <Box
                                            sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}
                                            component="div"
                                        >
                                        <Typography variant="caption" color="text.secondary">
                                            Created: {formatDateTimeLong(form.created_at) ?? 'Unknown'}
                                        </Typography>

                                        <Typography variant="caption" color="text.secondary">
                                            Last updated: {formatDateTimeLong(form.updated_at) ?? 'Unknown'}
                                        </Typography>

                                        <Typography variant="caption" color="text.secondary">
                                            Open window: {form.opened_at
                                            ? `${formatDateTimeLong(form.opened_at)}${
                                                form.closed_at
                                                    ? ` – ${formatDateTimeLong(form.closed_at)}`
                                                    : ' (still open)'
                                            }`
                                            : 'Not opened yet'}
                                        </Typography>

                                        <Typography variant="caption" color="text.secondary">
                                            Last submission: {formatDateTimeLong(form.last_submission_at) ?? 'No submissions yet'}
                                        </Typography>
                                        </Box>
                                    </Box>
                                </Collapse>
                            </Box>
                        </Box>


                    </Box>




                </Box>





                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 2, mb: 1 }}>
                    <Typography variant="h2">
                        <strong>{form.join_code}</strong>
                    </Typography>
                    <Tooltip title="Copy join code">
                        <IconButton onClick={handleCopyCode} size="large" color="primary">
                            <ContentCopyIcon fontSize="large" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Show QR code">
                        <IconButton onClick={() => setQrOpen(true)} size="large" color="primary">
                            <QrCode2Icon fontSize="large" />
                        </IconButton>
                    </Tooltip>
                </Box>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>



                    {/* Right Side: Safe Actions */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Button variant="contained" color="secondary" onClick={() => navigate(`/forms/${id}/analytics`)}>
                                View Analytics Dashboard
                            </Button>
                            <Button variant="contained" color="primary" startIcon={<DownloadIcon />} onClick={handleExport}>
                                Export to csv
                            </Button>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Button variant="outlined" startIcon={<CopyAllIcon />} onClick={handleDuplicate}>
                                Duplicate form
                            </Button>

                            <Button variant="outlined" startIcon={<EditIcon />} disabled={isReadOnly} onClick={handleEdit}>
                                Edit form
                            </Button>
                        </Box>
                    </Box>

                    {/* Left Side: Destructive Actions */}
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} disabled={isReadOnly} onClick={handleDeleteResponses}>
                            Delete Form Responses
                        </Button>

                        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} disabled={isReadOnly} onClick={handleDelete}>
                            Delete Form
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* QR Code Dialog */}
            <Dialog open={qrOpen} onClose={() => setQrOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Scan to Join</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <QRCodeSVG value={joinUrl} size={220} />
                    <Typography variant="body2" color="text.secondary">
                        {joinUrl}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setQrOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Copy Snackbar */}
            <Snackbar
                open={copied}
                autoHideDuration={2000}
                onClose={() => setCopied(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" variant="filled" onClose={() => setCopied(false)}>
                    Join code copied!
                </Alert>
            </Snackbar>

        </Box>
    );
}