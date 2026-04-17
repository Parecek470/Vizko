import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, TextField, Switch, FormGroup,
    FormControlLabel, Button, Alert
} from '@mui/material';

export default function FormBuilder() {
    // 1. Set up state to track user input
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);

    // For handling UI feedback
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // React Router hook to redirect the user after saving
    const navigate = useNavigate();

    // 2. The function that runs when "Save form" is clicked
    const handleSubmit = async () => {
        // Basic validation
        if (!title.trim()) {
            setError("Form name is required.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        // 3. Construct the payload. Notice we include an empty 'pages' array
        // to satisfy our Pydantic FormCreate schema!
        const payload = {
            title: title,
            description: description,
            pages: []
        };

        try {
            const response = await fetch('http://localhost:8000/forms/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                // We successfully created the form!
                // Let's grab the new ID and redirect the user.
                const newForm = await response.json();

                // Navigate back to the dashboard or to the specific form's page
                navigate(`/forms/${newForm.id}`);

                // (Alternatively, navigate('/') to just go back to the main list)
            } else {
                const errorData = await response.json();
                setError(errorData.detail || "Failed to create form on the server.");
            }
        } catch (err) {
            setError("Network error: Could not connect to the backend.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 800, margin: '0 auto', mt: 4 }}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'left' }}>
                <Typography variant="h4" color="primary" gutterBottom textAlign="center">
                    Form Builder Area
                </Typography>

                {/* Show error messages if they exist */}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                    Name of the form:
                </Typography>
                <TextField
                    id="FormName"
                    placeholder="e.g., Midterm Evaluation"
                    fullWidth
                    variant="outlined"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />

                <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                    Description of the form:
                </Typography>
                <TextField
                    id="FormDescription"
                    placeholder="Optional description"
                    fullWidth
                    variant="outlined"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    multiline
                    rows={3} // Makes it a slightly taller text area
                />

                <FormGroup sx={{ mt: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isPublic}
                                onChange={(e) => setIsPublic(e.target.checked)}
                            />
                        }
                        label="Publicize (Make Active)"
                    />
                </FormGroup>

                <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 4 }}
                    fullWidth
                    onClick={handleSubmit}
                    disabled={isSubmitting} // Prevent double-clicks
                >
                    {isSubmitting ? 'Saving...' : 'Save form'}
                </Button>
            </Paper>
        </Box>
    );
}