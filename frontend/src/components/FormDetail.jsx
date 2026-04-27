import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, CircularProgress, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForms } from '../context/FormContext';

export default function FormDetail() {
    const { id } = useParams(); // Gets the ID from the URL
    const navigate = useNavigate();
    const { refreshForms } = useForms();

    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFormDetail = async () => {
            try {
                const res = await fetch(`http://localhost:8000/forms/${id}`);
                if (res.ok) setForm(await res.json());
            } catch (err) {
                console.error("Error fetching form:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFormDetail();
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this form and all its responses?")) return;

        await fetch(`http://localhost:8000/forms/${id}`, { method: 'DELETE' });
        await refreshForms(); // Update sidebar
        navigate('/create'); // Send back to home
    };

    if (loading) return <CircularProgress sx={{ m: 4 }} />;
    if (!form) return <Typography>Form not found.</Typography>;

    return (
        <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
            <Paper sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">{form.title}</Typography>
                    <Chip
                        label={form.is_active ? "Live" : "Draft"}
                        color={form.is_active ? "success" : "default"}
                    />
                </Box>

                <Typography color="text.secondary" paragraph>
                    {form.description || "No description provided."}
                </Typography>

                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                    Join Code: <strong>{form.join_code}</strong>
                </Typography>

                <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                    <Button variant="contained" color="primary">
                        View Analytics Dashboard
                    </Button>
                    <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>
                        Delete Form
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}