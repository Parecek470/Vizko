import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    Box, Typography, Paper, TextField, Switch, FormGroup,
    FormControlLabel, Button, Alert, Card, CardContent,
    IconButton, Select, MenuItem, InputLabel, FormControl,
    Grid, Divider, CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import { useForms } from '../context/FormContext';
import { apiFetch } from '../utils/api.js';

export default function FormBuilder() {
    const navigate = useNavigate();
    const { id } = useParams();               // present when route is /forms/:id/edit
    const location = useLocation();           // reliable way to read current pathname
    const isEditing = location.pathname.includes('edit');

    const { refreshForms } = useForms();

    // --- Form metadata state ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [hasResponses, setHasResponses] = useState(false);
    const [responseCount, setResponseCount] = useState(0);


    // --- Pages / questions state ---
    const [pages, setPages] = useState([{
        page_number: 1,
        title: '',
        questions: []
    }]);

    // --- UI state ---
    const [selectedItem, setSelectedItem] = useState({ type: 'form', pageIndex: null, qIndex: null });
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingForm, setLoadingForm] = useState(false);

    // ==========================================
    // HYDRATE STATE WHEN EDITING
    // ==========================================

    useEffect(() => {
        if (!isEditing || !id) return;

        const fetchAndPopulate = async () => {
            setLoadingForm(true);
            try {
                const res = await apiFetch(`http://localhost:8000/forms/${id}`);
                if (!res.ok) {
                    setError('Failed to load form for editing.');
                    return;
                }
                const form = await res.json();

                // Populate top-level metadata
                setTitle(form.title);
                setDescription(form.description ?? '');
                setIsActive(form.is_active);
                setHasResponses(form.response_count > 0);
                setResponseCount(form.response_count);

                // Populate pages — map API shape to local state shape
                const hydratedPages = form.pages.map(page => ({
                    id: page.id,
                    page_number: page.page_number,
                    title: page.title ?? '',
                    questions: page.questions.map(q => ({
                        id: q.id,
                        text: q.text,
                        question_type: q.question_type,
                        is_required: q.is_required,
                        order: q.order,
                        scale_min: q.scale_min ?? null,
                        scale_max: q.scale_max ?? null,
                        scale_min_label: q.scale_min_label ?? '',
                        scale_max_label: q.scale_max_label ?? '',
                        options: (q.options ?? []).map(opt => ({
                            id: opt.id,
                            text: opt.text,
                            order: opt.order
                        }))
                    }))
                }));

                setPages(hydratedPages);
            } catch (err) {
                setError('Network error while loading form.');
                console.error(err);
            } finally {
                setLoadingForm(false);
            }
        };

        fetchAndPopulate();
    }, [isEditing, id]);

    // ==========================================
    // MUTATION HANDLERS
    // ==========================================

    const handleAddPage = () => {
        const newPages = [...pages, { page_number: pages.length + 1, title: '', questions: [] }];
        setPages(newPages);
        setSelectedItem({ type: 'page', pageIndex: newPages.length - 1, qIndex: null });
    };

    const handleRemovePage = async (pageIndex) => {
        const page = pages[pageIndex];

        if (isEditing && hasResponses) {
            if (pages.length === 1) {
                alert("A form must have at least one page.");
                return;
            }

            const confirmed = window.confirm(
                `Warning: This form has responses. Deleting this page will permanently delete all questions on it and their responses. This cannot be undone. Continue?`
            );
            if (!confirmed) return;

            await apiFetch(`http://localhost:8000/forms/${id}/pages/${page.id}`, {
                method: 'DELETE'
            });
        }

        const newPages = [...pages];
        newPages.splice(pageIndex, 1);
        newPages.forEach((p, i) => p.page_number = i + 1);
        setPages(newPages);
        setSelectedItem({ type: 'form', pageIndex: null, qIndex: null });
    };

    const handlePageChange = (pageIndex, field, value) => {
        const newPages = [...pages];
        newPages[pageIndex][field] = value;
        setPages(newPages);
    };

    const handleAddQuestion = (pageIndex) => {
        const newPages = [...pages];
        const newQuestion = {
            text: 'New Question',
            question_type: 'single_choice',
            is_required: true,
            order: newPages[pageIndex].questions.length + 1,
            options: []
        };
        newPages[pageIndex].questions.push(newQuestion);
        setPages(newPages);
        setSelectedItem({ type: 'question', pageIndex, qIndex: newPages[pageIndex].questions.length - 1 });
    };

    const handleRemoveQuestion = async (pageIndex, qIndex) => {
        const question = pages[pageIndex].questions[qIndex];
        const isLastQuestionOnPage = pages[pageIndex].questions.length === 1;
        const isLastPage = pages.length === 1;

        // Build a single confirmation message that covers both cases
        let warningMessage = `Warning: This form has responses. Deleting this question will permanently delete all responses to it.`;

        if (isLastQuestionOnPage && !isLastPage) {
            warningMessage += `\n\nThis is the last question on Page ${pageIndex + 1}. The page will also be deleted.`;
        }

        if (isEditing && hasResponses) {
            const confirmed = window.confirm(warningMessage + `\n\nThis cannot be undone. Continue?`);
            if (!confirmed) return;

            if (isLastQuestionOnPage && !isLastPage) {
                // Delete the whole page (cascades to the question anyway)
                await apiFetch(`http://localhost:8000/forms/${id}/pages/${pages[pageIndex].id}`, {
                    method: 'DELETE'
                });
            } else {
                // Delete just the question
                await apiFetch(`http://localhost:8000/forms/${id}/questions/${question.id}`, {
                    method: 'DELETE'
                });
            }
        }

        // Update local state
        if (isLastQuestionOnPage && !isLastPage) {
            // Remove the whole page from local state
            const newPages = [...pages];
            newPages.splice(pageIndex, 1);
            newPages.forEach((p, i) => p.page_number = i + 1);
            setPages(newPages);
            setSelectedItem({ type: 'form', pageIndex: null, qIndex: null });
        } else {
            // Remove just the question from local state
            const newPages = [...pages];
            newPages[pageIndex].questions.splice(qIndex, 1);
            newPages[pageIndex].questions.forEach((q, i) => q.order = i + 1);
            setPages(newPages);
            setSelectedItem({ type: 'page', pageIndex, qIndex: null });
        }
    };

    const handleQuestionChange = (pageIndex, qIndex, field, value) => {
        const newPages = [...pages];
        newPages[pageIndex].questions[qIndex][field] = value;
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
        newPages[pageIndex].questions[qIndex].options.forEach((opt, i) => opt.order = i + 1);
        setPages(newPages);
    };

    const handleOptionChange = (pageIndex, qIndex, optIndex, value) => {
        const newPages = [...pages];
        newPages[pageIndex].questions[qIndex].options[optIndex].text = value;
        setPages(newPages);
    };

    // ==========================================
    // SUBMIT — branches on isEditing
    // ==========================================

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError('Form title is required.');
            setSelectedItem({ type: 'form', pageIndex: null, qIndex: null });
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const payload = { title, description, is_active: isActive, pages };

        try {
            let response;

            if (isEditing) {
                if (hasResponses) {
                    // text-only patch 
                    response = await apiFetch(`http://localhost:8000/forms/${id}/text`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });
                } else {
                    // Full structural replace (no responses to protect)
                    response = await apiFetch(`http://localhost:8000/forms/${id}/structure`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });
                }
            }

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.detail || 'An error occurred.');
                return;
            }

            const savedForm = await response.json();
            await refreshForms();
            navigate(`/forms/${savedForm.id}`);

        } catch (err) {
            setError('Network error. Is the backend running?');
        } finally {
            setIsSubmitting(false);
        }
    };


    // ==========================================
    // RENDER HELPERS
    // ==========================================

    const renderFormSettings = () => (
        <Box>
            <Typography variant="h6" gutterBottom>Form Settings</Typography>
            <TextField label="Form Title" fullWidth variant="outlined" value={title} onChange={(e) => setTitle(e.target.value)} sx={{ mb: 2 }} required />
            <TextField label="Description" fullWidth variant="outlined" multiline rows={3} value={description} onChange={(e) => setDescription(e.target.value)} sx={{ mb: 2 }} />
            <FormGroup>
                <FormControlLabel control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />} label="Set as Active (Live)" />
            </FormGroup>
            <Divider sx={{ my: 3 }} />
            <Button variant="contained" color="success" fullWidth size="large" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save & Publish Form'}
            </Button>
        </Box>
    );

    const renderPageSettings = () => {
        const pageIndex = selectedItem.pageIndex;
        const page = pages[pageIndex];
        return (
            <Box>
                <Typography variant="h6" gutterBottom>Page {page.page_number} Settings</Typography>
                <TextField label="Page Title (Optional)" fullWidth value={page.title} onChange={(e) => handlePageChange(selectedItem.pageIndex, 'title', e.target.value)} sx={{ mb: 3 }} />
                <Button variant="outlined" color="error" fullWidth startIcon={<DeleteIcon />} onClick={() => handleRemovePage(selectedItem.pageIndex)} disabled={pages.length === 1}>
                    Delete Page
                </Button>
            </Box>
        );
    }

    const renderQuestionSettings = (pageIndex, qIndex) => {
        const question = pages[pageIndex].questions[qIndex];
        return (
            <Box>
                <Typography variant="h6" gutterBottom>Edit Question</Typography>

                <TextField label="Question Text" fullWidth multiline rows={2} value={question.text} onChange={(e) => handleQuestionChange(pageIndex, qIndex, 'text', e.target.value)} sx={{ mb: 3 }} required />

                <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Question Type</InputLabel>
                    <Select value={question.question_type} label="Question Type" onChange={(e) => handleQuestionChange(pageIndex, qIndex, 'question_type', e.target.value)}>
                        <MenuItem value="single_choice">Single Choice</MenuItem>
                        <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
                        <MenuItem value="scale">Scale (1-N)</MenuItem>
                        <MenuItem value="text_open">Open Text</MenuItem>
                    </Select>
                </FormControl>

                <FormGroup sx={{ mb: 3 }}>
                    <FormControlLabel control={<Switch checked={question.is_required} onChange={(e) => handleQuestionChange(pageIndex, qIndex, 'is_required', e.target.checked)} />} label="Required Question" />
                </FormGroup>

                <Divider sx={{ my: 2 }} />

                {/* Options Editor */}
                {(question.question_type === 'single_choice' || question.question_type === 'multiple_choice') && (
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>Options</Typography>
                        {question.options.map((opt, oIndex) => (
                            <Box key={oIndex} sx={{ display: 'flex', mb: 1 }}>
                                <TextField size="small" fullWidth placeholder={`Option ${oIndex + 1}`} value={opt.text} onChange={(e) => handleOptionChange(pageIndex, qIndex, oIndex, e.target.value)} sx={{ mr: 1 }} />
                                <IconButton size="small" color="error" onClick={() => handleRemoveOption(pageIndex, qIndex, oIndex)} disabled={isEditing && hasResponses}>
                                    <DeleteIcon fontSize="small"  />
                                </IconButton>
                            </Box>
                        ))}
                        <Button size="small" startIcon={<AddCircleIcon />} onClick={() => handleAddOption(pageIndex, qIndex)}  disabled={isEditing && hasResponses}>Add Option</Button>
                    </Box>
                )}

                {/* Scale Editor */}
                {question.question_type === 'scale' && (
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField type="number" label="Min Value" size="small" fullWidth value={question.scale_min || ''} onChange={(e) => handleQuestionChange(pageIndex, qIndex, 'scale_min', parseInt(e.target.value))} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField type="number" label="Max Value" size="small" fullWidth value={question.scale_max || ''} onChange={(e) => handleQuestionChange(pageIndex, qIndex, 'scale_max', parseInt(e.target.value))} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Min Label" size="small" fullWidth value={question.scale_min_label || ''} onChange={(e) => handleQuestionChange(pageIndex, qIndex, 'scale_min_label', e.target.value)} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Max Label" size="small" fullWidth value={question.scale_max_label || ''} onChange={(e) => handleQuestionChange(pageIndex, qIndex, 'scale_max_label', e.target.value)} />
                        </Grid>
                    </Grid>
                )}

                <Divider sx={{ my: 3 }} />
                <Button variant="outlined" color="error" fullWidth startIcon={<DeleteIcon />} onClick={() => handleRemoveQuestion(pageIndex, qIndex)}>
                    Delete Question
                </Button>
            </Box>
        )
    }

    // Dynamic Left Panel Content based on what is selected
    const renderEditorPanel = () => {
        const { type, pageIndex, qIndex } = selectedItem;
        if (type == 'form') return renderFormSettings();
        if (type === 'page') return renderPageSettings(pageIndex);
        if (type === 'question') return renderQuestionSettings(pageIndex, qIndex);
    };


    return (
        <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>

            {/* ========================================== */}
            {/* MAIN PANEL: The Canvas View (Now on Left)  */}
            {/* ========================================== */}
            <Box sx={{
                flexGrow: 1,
                backgroundColor: '#f4f6f8',
                p: { xs: 2, md: 5 },
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <Box sx={{ width: '100%', maxWidth: 800 }}>

                    {/* Header Canvas Block */}
                    <Paper
                        elevation={selectedItem.type === 'form' ? 4 : 1}
                        onClick={() => setSelectedItem({ type: 'form', pageIndex: null, qIndex: null })}
                        sx={{
                            p: 4, mb: 4, cursor: 'pointer',
                            borderTop: '8px solid #1976d2',
                            outline: selectedItem.type === 'form' ? '2px solid #1976d2' : 'none'
                        }}
                    >
                        <Typography variant="h3">{title || "Untitled Form"}</Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>{description || "Form Description"}</Typography>
                    </Paper>

                    {/* Pages Canvas Loop */}
                    {pages.map((page, pIndex) => (
                        <Box key={pIndex} sx={{ mb: 6 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h5" sx={{ flexGrow: 1, color: '#424242' }}>
                                    Page {page.page_number}: {page.title}
                                </Typography>
                                <Button size="small" onClick={() => setSelectedItem({ type: 'page', pageIndex: pIndex, qIndex: null })}>
                                    Page Settings
                                </Button>
                            </Box>

                            {/* Questions Canvas Loop */}
                            {page.questions.map((question, qIndex) => {
                                const isSelected = selectedItem.type === 'question' && selectedItem.pageIndex === pIndex && selectedItem.qIndex === qIndex;
                                return (
                                    <Paper
                                        key={qIndex}
                                        elevation={isSelected ? 4 : 1}
                                        onClick={() => setSelectedItem({ type: 'question', pageIndex: pIndex, qIndex: qIndex })}
                                        sx={{
                                            p: 3, mb: 2, cursor: 'pointer',
                                            borderLeft: isSelected ? '4px solid #1976d2' : '4px solid transparent',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Typography variant="h6" gutterBottom>
                                            {question.text || "Empty Question"}
                                            {question.is_required && <span style={{ color: 'red' }}> *</span>}
                                        </Typography>

                                        {/* Visual Preview Placeholder */}
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', bgcolor: '#f0f0f0', p: 1, borderRadius: 1 }}>
                                            [Preview: {question.question_type.replace('_', ' ')}]
                                        </Typography>
                                    </Paper>
                                );
                            })}

                            {/* Canvas Actions */}
                            <Button
                                variant="outlined"
                                sx={{ mt: 1 }}
                                startIcon={<AddCircleIcon />}
                                onClick={() => handleAddQuestion(pIndex)}
                                disabled={isEditing && hasResponses}
                            >
                                Add Question to Page {page.page_number}
                            </Button>
                        </Box>
                    ))}

                    <Divider sx={{ my: 4 }} />
                    <Button variant="text" size="large" onClick={handleAddPage}>
                        + Add New Page
                    </Button>
                </Box>
            </Box>

            {/* ========================================== */}
            {/* RIGHT PANEL: The Settings Window           */}
            {/* ========================================== */}
            <Box sx={{
                width: 350,
                flexShrink: 0,
                borderLeft: '1px solid #e0e0e0', // Changed from borderRight
                backgroundColor: '#ffffff',
                p: 3,
                overflowY: 'auto',
                boxShadow: '-2px 0 5px rgba(0,0,0,0.05)', // Flipped shadow direction
                zIndex: 10
            }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {renderEditorPanel()}
            </Box>

        </Box>
    );
}