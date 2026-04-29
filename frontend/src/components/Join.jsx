import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';

export default function Join() {
    const [code, setCode] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleJoin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://10.0.1.53:8000/join/${code}`);
            if (res.ok) {
                navigate(`/respond/${code}`);
            } else {
                const data = await res.json();
                setError(data.detail || "Invalid join code");
            }
        } catch (err) {
            setError("Cannot connect to server.");
        }
    };

    return (
        <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
            <Paper sx={{ p: 5, maxWidth: 400, textAlign: 'center', borderRadius: 2 }} elevation={3}>
                <Typography variant="h4" gutterBottom color="primary">Join a Lecture</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Enter the code provided by your teacher.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleJoin}>
                    <TextField
                        fullWidth
                        label="Join Code"
                        variant="outlined"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        sx={{ mb: 3 }}
                    />
                    <Button type="submit" variant="contained" size="large" fullWidth>
                        Enter
                    </Button>
                </form>
            </Paper>
        </Box>
    );
}