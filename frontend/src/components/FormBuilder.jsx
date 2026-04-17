import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, TextField, Switch, FormGroup,
    FormControlLabel, Button, Alert, Card, CardContent,
    IconButton, Select, MenuItem, InputLabel, FormControl,
    Grid, Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';

export default function FormBuilder() {
    const navigate = useNavigate();

    // --- Form-Level State ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(false);

    // --- Nested State ---
    // Initialize with one empty page to start
    const [pages, setPages] = useState([{
        page_number: 1,
        title: '',
        questions: []
    }]);

    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ==========================================
    // STATE MUTATION HANDLERS
    // ==========================================

    const handleAddPage = () => {
        setPages([...pages, { page_number: pages.length + 1, title: '', questions: [] }]);
    };

    const handleRemovePage = (pageIndex) => {
        const newPages = [...pages];
        newPages.splice(pageIndex, 1);
        // Re-index page numbers
        newPages.forEach((p, i) => p.page_number = i + 1);
        setPages(newPages);
    };

    const handlePageChange = (pageIndex, field, value) => {
        const newPages = [...pages];
        newPages[pageIndex][field] = value;
        setPages(newPages);
    };

    const handleAddQuestion = (pageIndex) => {
        const newPages = [...pages];
        const newQuestion = {
            text: '',
            question_type: 'single_choice',
            is_required: true,
            order: newPages[pageIndex].questions.length + 1,
            options: [] // Empty by default
        };
        newPages[pageIndex].questions.push(newQuestion);
        setPages(newPages);
    };

    const handleRemoveQuestion = (pageIndex, qIndex) => {
        const newPages = [...pages];
        newPages[pageIndex].questions.splice(qIndex, 1);
        // Re-index question order
        newPages[pageIndex].questions.forEach((q, i) => q.order = i + 1);
        setPages(newPages);
    };

    const handleQuestionChange = (pageIndex, qIndex, field, value) => {
        const newPages = [...pages];
        newPages[pageIndex].questions[qIndex][field] = value;

        // If they switch to a text_open or scale question, clear options to keep payload clean
        if (field === 'question_type' && (value === 'text_open' || value === 'scale')) {
            newPages[pageIndex].questions[qIndex].options = [];
        }

        setPages(newPages);
    };

    const handleAddOption = (pageIndex, qIndex) => {
        const newPages = [...pages];
        newPages[pageIndex].questions[qIndex].options.push({
            text: '',
            order: newPages[pageIndex].questions[qIndex].options.length + 1
        });
        setPages(newPages);
    };

    const handleRemoveOption = (pageIndex, qIndex, optIndex) => {
        const newPages = [...pages];
        newPages[pageIndex].questions[qIndex].options.splice(optIndex, 1);
        // Re-index option order
        newPages[pageIndex].questions[qIndex].options.forEach((opt, i) => opt.order = i + 1);
        setPages(newPages);
    };

    const handleOptionChange = (pageIndex, qIndex, optIndex, value) => {
        const newPages = [...pages];
        newPages[pageIndex].questions[qIndex].options[optIndex].text = value;
        setPages(newPages);
    };

    // ==========================================
    // SUBMISSION HANDLER
    // ==========================================

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError("Form title is required.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        // Construct payload exactly matching schemas.py -> FormCreate
        const payload = {
            title: title,
            description: description,
            is_active: isActive,
            pages: pages
        };

        try {
            console.log(payload);
            const response = await fetch('http://localhost:8000/forms/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const newForm = await response.json();
                navigate(`/forms/${newForm.id}`);
            } else {
                const errorData = await response.json();
                setError(errorData.detail || "Failed to create form.");
            }
        } catch (err) {
            setError("Network error: Could not connect to the backend.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <Box sx={{ maxWidth: 900, margin: '0 auto', pb: 8 }}>
            <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom>Create New Form</Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <TextField
                            label="Form Title"
                            fullWidth
                            variant="outlined"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Description (Optional)"
                            fullWidth
                            variant="outlined"
                            multiline
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                    />
                                }
                                label="Set as Active (Live)"
                            />
                        </FormGroup>
                    </Grid>
                </Grid>
            </Paper>

            {/* --- PAGES RENDER LOOP --- */}
            {pages.map((page, pIndex) => (
                <Card key={pIndex} sx={{ mb: 4, borderLeft: '4px solid #1976d2' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Page {page.page_number}</Typography>
                            {pages.length > 1 && (
                                <IconButton color="error" onClick={() => handleRemovePage(pIndex)}>
                                    <DeleteIcon />
                                </IconButton>
                            )}
                        </Box>

                        <TextField
                            label="Page Title (Optional)"
                            fullWidth
                            size="small"
                            sx={{ mb: 4 }}
                            value={page.title}
                            onChange={(e) => handlePageChange(pIndex, 'title', e.target.value)}
                        />

                        {/* --- QUESTIONS RENDER LOOP --- */}
                        {page.questions.map((question, qIndex) => (
                            <Paper variant="outlined" key={qIndex} sx={{ p: 3, mb: 3, backgroundColor: '#fafafa' }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={8}>
                                        <TextField
                                            label={`Question ${qIndex + 1}`}
                                            fullWidth
                                            size="small"
                                            value={question.text}
                                            onChange={(e) => handleQuestionChange(pIndex, qIndex, 'text', e.target.value)}
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={3}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Type</InputLabel>
                                            <Select
                                                value={question.question_type}
                                                label="Type"
                                                onChange={(e) => handleQuestionChange(pIndex, qIndex, 'question_type', e.target.value)}
                                            >
                                                <MenuItem value="single_choice">Single Choice</MenuItem>
                                                <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
                                                <MenuItem value="scale">Scale (1-N)</MenuItem>
                                                <MenuItem value="text_open">Open Text</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={1}>
                                        <IconButton color="error" onClick={() => handleRemoveQuestion(pIndex, qIndex)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Grid>
                                </Grid>

                                {/* --- CONDITIONAL OPTIONS/SCALE RENDERING --- */}
                                {(question.question_type === 'single_choice' || question.question_type === 'multiple_choice') && (
                                    <Box sx={{ mt: 2, ml: 4 }}>
                                        {question.options.map((opt, oIndex) => (
                                            <Box key={oIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="body2" sx={{ mr: 2, color: 'text.secondary' }}>
                                                    {oIndex + 1}.
                                                </Typography>
                                                <TextField
                                                    size="small"
                                                    placeholder="Option text"
                                                    value={opt.text}
                                                    onChange={(e) => handleOptionChange(pIndex, qIndex, oIndex, e.target.value)}
                                                    sx={{ mr: 1, flexGrow: 1 }}
                                                />
                                                <IconButton size="small" color="error" onClick={() => handleRemoveOption(pIndex, qIndex, oIndex)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                        <Button size="small" startIcon={<AddCircleIcon />} onClick={() => handleAddOption(pIndex, qIndex)}>
                                            Add Option
                                        </Button>
                                    </Box>
                                )}

                                {question.question_type === 'scale' && (
                                    <Grid container spacing={2} sx={{ mt: 1, ml: 2, width: 'calc(100% - 16px)' }}>
                                        <Grid item xs={6} sm={3}>
                                            <TextField type="number" label="Min Value" size="small" fullWidth
                                                       value={question.scale_min || ''}
                                                       onChange={(e) => handleQuestionChange(pIndex, qIndex, 'scale_min', parseInt(e.target.value))} />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <TextField type="number" label="Max Value" size="small" fullWidth
                                                       value={question.scale_max || ''}
                                                       onChange={(e) => handleQuestionChange(pIndex, qIndex, 'scale_max', parseInt(e.target.value))} />
                                        </Grid>
                                    </Grid>
                                )}
                            </Paper>
                        ))}

                        <Button variant="outlined" startIcon={<AddCircleIcon />} onClick={() => handleAddQuestion(pIndex)}>
                            Add Question
                        </Button>
                    </CardContent>
                </Card>
            ))}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button variant="text" onClick={handleAddPage}>+ Add Another Page</Button>
                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : 'Save Complete Form'}
                </Button>
            </Box>
        </Box>
    );
}