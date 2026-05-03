import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, CircularProgress, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForms } from '../context/FormContext';
import {apiFetch} from "../utils/api.js";
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import CopyAllIcon from '@mui/icons-material/CopyAll';
import { getCurrentUsername} from "../utils/auth.js";

export default function FormDetail() {
    const { id } = useParams(); // Gets the ID from the URL
    const navigate = useNavigate();
    const { refreshForms } = useForms();


    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const currentUser = getCurrentUsername();
    const isOwner = form.owner === currentUser;
    const isReadOnly = !isOwner;

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
        apiFetch('/forms/${id}/export/csv').then(async (res) => {
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">{form.title}</Typography>
                    {form.is_shared && (
                        <Chip label="Shared" color="secondary" size="small" sx={{ ml: 1 }} />
                    )}
                    <Chip
                        label={`${form.response_count} Responses`}
                        color="primary"
                        variant="outlined"
                    />
                    <Chip
                        label={form.is_active ? "Live" : "Draft"}
                        color={form.is_active ? "success" : "default"}
                    />
                </Box>

                <Typography color="text.secondary" paragraph>
                    {form.description || "No description provided."}
                </Typography>

                <Typography variant="h2" align={"center"} sx={{ mt: 2, mb: 1 }}>
                    Join Code: <strong>{form.join_code}</strong>
                </Typography>

                <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button variant="contained" color="secondary" onClick={()=>navigate(`/forms/${id}/analytics`)}>
                            View Analytics Dashboard
                        </Button>
                        <Button variant="contained" color="primary" startIcon={<DownloadIcon />} onClick={handleExport}>
                            Export to csv
                        </Button>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button variant="outlined" color="" startIcon={<CopyAllIcon />} onClick={handleDuplicate}>
                            Duplicate form
                        </Button>

                        <Button variant="outlined" color="" startIcon={<EditIcon />} disabled={isReadOnly} onClick={handleEdit}>
                            Edit form
                        </Button>
                    </Box>
                    <Box sx={{minWidth:"40px"}}/>
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }} >
                        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} disabled={isReadOnly} onClick={handleDeleteResponses}>
                            Delete Form Responses
                        </Button>

                        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} disabled={isReadOnly} onClick={handleDelete}>
                            Delete Form
                        </Button>

                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}