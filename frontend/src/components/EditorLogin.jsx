import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';
import {publicFetch} from "../utils/api.js";

export default function EditorLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        // 1. Encode credentials for HTTP Basic Auth
        const token = btoa(`${username}:${password}`);

        try {
            // 2. Test the credentials by hitting the locked /forms/ route
            const res = await publicFetch('/forms/', {
                headers: {
                    'Authorization': `Basic ${token}`
                }
            });

            if (res.ok) {
                // 3. Success! Save the token and go to the dashboard
                localStorage.setItem('teacherToken', token);
                navigate('/create');
            } else {
                setError("Incorrect username or password");
            }
        } catch (err) {
            setError("Cannot connect to server.");
        }
    };

    return (
        <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
            <Paper sx={{ p: 5, maxWidth: 400, textAlign: 'center', borderRadius: 2 }} elevation={3}>
                <Typography variant="h4" gutterBottom color="primary">Editor Access</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Please log in to manage your forms.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleLogin}>
                    <TextField
                        fullWidth
                        label="Username"
                        variant="outlined"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        variant="outlined"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{ mb: 3 }}
                    />
                    <Button type="submit" variant="contained" size="large" fullWidth>
                        Log In
                    </Button>
                </form>
            </Paper>
        </Box>
    );
}