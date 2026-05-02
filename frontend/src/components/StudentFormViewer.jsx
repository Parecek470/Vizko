import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, CircularProgress, RadioGroup, FormControlLabel, Radio, Checkbox, FormGroup, TextField, Slider, Tooltip } from '@mui/material';
import {publicFetch} from "../utils/api.js";

export default function StudentFormViewer() {
    const { code } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    // State shape: { questionId: { text_value, scale_value, selected_option_ids: [] } }
    const [answers, setAnswers] = useState({});

    useEffect(() => {
        const fetchForm = async () => {
            const res = await publicFetch(`/join/${code}`);
            if (res.ok) setForm(await res.json());
            setLoading(false);
        };
        fetchForm();
    }, [code]);

    const handleAnswerChange = (questionId, payload) => {
        setAnswers(prev => ({ ...prev, [questionId]: { ...prev[questionId], ...payload } }));
    };

    const handleCheckboxChange = (questionId, optionId, isChecked) => {
        setAnswers(prev => {
            const currentSelected = prev[questionId]?.selected_option_ids || [];
            const newSelected = isChecked
                ? [...currentSelected, optionId]
                : currentSelected.filter(id => id !== optionId);
            return { ...prev, [questionId]: { selected_option_ids: newSelected } };
        });
    };

    const handleSubmit = async () => {
        // Transform our dictionary state into the list required by SubmissionCreate schema
        const payload = {
            answers: Object.entries(answers).map(([qId, ans]) => ({
                question_id: parseInt(qId),
                text_value: ans.text_value || null,
                scale_value: ans.scale_value || null,
                selected_option_ids: ans.selected_option_ids || []
            }))
        };

        const res = await publicFetch(`/forms/${form.id}/submissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Thank you! Your responses have been recorded.");
            navigate('/join');
        }
    };

    if (loading) return <CircularProgress sx={{ m: 4 }} />;
    if (!form) return <Typography>Form not available.</Typography>;

    const currentPage = form.pages[currentPageIndex];
    const isLastPage = currentPageIndex === form.pages.length - 1;

    const isQuestionAnswered = (q) => {
        const ans = answers[q.id];
        if (!ans) return false;
        if (q.question_type === 'text_open') return (ans.text_value || '').trim().length > 0;
        if (q.question_type === 'scale') return ans.scale_value != null;
        // single_choice / multiple_choice
        return (ans.selected_option_ids || []).length > 0;
    };

    const isCurrentPageValid = currentPage.questions
        .filter(q => q.is_required)
        .every(q => isQuestionAnswered(q));

    return (
        <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h3" gutterBottom>{form.title}</Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>{form.description}</Typography>

            <Paper sx={{ p: 4, mt: 4 }}>
                <Typography variant="h5" sx={{ mb: 3 }}>
                    Page {currentPage.page_number} {currentPage.title && `- ${currentPage.title}`}
                </Typography>

                {currentPage.questions.map((q) => (
                    <Box key={q.id} sx={{ mb: 4, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            {q.text} {q.is_required && <span style={{ color: 'red' }}>*</span>}
                        </Typography>

                        {/* SINGLE CHOICE */}
                        {q.question_type === 'single_choice' && (
                            <RadioGroup
                                value={answers[q.id]?.selected_option_ids?.[0] || ''}
                                onChange={(e) => handleAnswerChange(q.id, { selected_option_ids: [parseInt(e.target.value)] })}
                            >
                                {q.options.map(opt => (
                                    <FormControlLabel key={opt.id} value={opt.id} control={<Radio />} label={opt.text} />
                                ))}
                            </RadioGroup>
                        )}

                        {/* MULTIPLE CHOICE */}
                        {q.question_type === 'multiple_choice' && (
                            <FormGroup>
                                {q.options.map(opt => (
                                    <FormControlLabel
                                        key={opt.id}
                                        control={<Checkbox checked={(answers[q.id]?.selected_option_ids || []).includes(opt.id)} onChange={(e) => handleCheckboxChange(q.id, opt.id, e.target.checked)} />}
                                        label={opt.text}
                                    />
                                ))}
                            </FormGroup>
                        )}

                        {/* TEXT OPEN */}
                        {q.question_type === 'text_open' && (
                            <TextField
                                fullWidth multiline rows={3}
                                value={answers[q.id]?.text_value || ''}
                                onChange={(e) => handleAnswerChange(q.id, { text_value: e.target.value })}
                            />
                        )}

                        {/* SCALE */}
                        {q.question_type === 'scale' && (
                            <Box sx={{ px: 2 }}>
                                <Slider
                                    min={q.scale_min} max={q.scale_max} step={1} marks valueLabelDisplay="auto"
                                    value={answers[q.id]?.scale_value || q.scale_min}
                                    onChange={(e, val) => handleAnswerChange(q.id, { scale_value: val })}
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption">{q.scale_min_label}</Typography>
                                    <Typography variant="caption">{q.scale_max_label}</Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                ))}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                    <Button disabled={currentPageIndex === 0} onClick={() => setCurrentPageIndex(p => p - 1)}>
                        Previous
                    </Button>

                    {!isLastPage ? (
                        <Tooltip
                            title={!isCurrentPageValid ? 'Please answer all required questions before continuing.' : ''}
                            arrow
                        >
                            <span>
                                <Button variant="contained" disabled={!isCurrentPageValid} onClick={() => setCurrentPageIndex(p => p + 1)}>
                                    Next Page
                                </Button>
                            </span>
                        </Tooltip>
                    ) : (
                        <Tooltip
                            title={!isCurrentPageValid ? 'Please answer all required questions before submitting.' : ''}
                            arrow
                        >
                            <span>
                                <Button variant="contained" color="success" disabled={!isCurrentPageValid} onClick={handleSubmit}>
                                    Submit Responses
                                </Button>
                            </span>
                        </Tooltip>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}