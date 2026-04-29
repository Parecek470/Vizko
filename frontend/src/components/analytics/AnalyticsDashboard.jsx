import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, List, ListItemButton, ListItemText, Collapse, Typography, Paper, Divider } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import QuestionVisualizer from './QuestionVisualizer';
import {apiFetch} from "../../utils/api.js";

export default function AnalyticsDashboard() {
    const { id } = useParams();
    const [form, setForm] = useState(null);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [error, setError] = useState(null); // 1. Add error state

    const [openPages, setOpenPages] = useState({});

    useEffect(() => {
        const fetchForm = async () => {
            try {
                const res = await apiFetch(`http://localhost:8000/forms/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setForm(data);
                    if (data.pages?.[0]?.questions?.[0]) {
                        setSelectedQuestion(data.pages[0].questions[0]);
                    }
                } else {
                    // 2. Handle HTTP errors (e.g., 404 Form Not Found)
                    setError("Form not found or server error.");
                }
            } catch (err) {
                setError("Failed to fetch form data. Is the backend running?");
            }
        };
        fetchForm();
    }, [id]);

    const togglePage = (pageId) => {
        setOpenPages(prev => ({ ...prev, [pageId]: !prev[pageId] }));
    };

    // 3. Display error if one occurs
    if (error) return <Typography sx={{ p: 4, color: 'error.main' }}>{error}</Typography>;
    if (!form) return <Typography sx={{ p: 4 }}>Loading analytics...</Typography>;

    return (
        <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
            <Paper elevation={2} sx={{ width: 300, overflowY: 'auto', borderRadius: 0 }}>
                <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                    <Typography variant="h6">Form Structure</Typography>
                </Box>
                <List component="nav">
                    {/* 4. Add Optional Chaining (?.) to pages array */}
                    {form.pages?.map((page, index) => (
                        <Box key={page.id || index}>
                            <ListItemButton onClick={() => togglePage(page.id)}>
                                <ListItemText primary={`Page ${page.page_number || index + 1}: ${page.title || 'Untitled'}`} />
                                {openPages[page.id] ? <ExpandLess /> : <ExpandMore />}
                            </ListItemButton>

                            <Collapse in={openPages[page.id]} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    {/* 5. Add Optional Chaining (?.) to questions array */}
                                    {page.questions?.map((q) => (
                                        <ListItemButton
                                            key={q.id}
                                            sx={{ pl: 4, bgcolor: selectedQuestion?.id === q.id ? 'action.selected' : 'inherit' }}
                                            onClick={() => setSelectedQuestion(q)}
                                        >
                                            <ListItemText
                                                primary={q.text}
                                                secondary={q.question_type?.replace('_', ' ')}
                                                primaryTypographyProps={{ noWrap: true }}
                                            />
                                        </ListItemButton>
                                    ))}
                                </List>
                            </Collapse>
                            <Divider />
                        </Box>
                    ))}
                </List>
            </Paper>

            <Box sx={{ flexGrow: 1, p: 4, overflowY: 'auto', bgcolor: '#f5f5f5' }}>
                {selectedQuestion ? (
                    <QuestionVisualizer formId={form.id} question={selectedQuestion} />
                ) : (
                    <Typography color="text.secondary">Select a question from the sidebar to view analytics.</Typography>
                )}
            </Box>
        </Box>
    );
}