import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, List, ListItemButton, ListItemText, Collapse, Typography, Paper, Divider } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import QuestionVisualizer from './QuestionVisualizer';

export default function AnalyticsDashboard() {
    const { formId } = useParams();
    const [form, setForm] = useState(null);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    // State to handle which pages are expanded in the sidebar
    const [openPages, setOpenPages] = useState({});

    // Fetch the form structure (and later, the analytics payload)
    useEffect(() => {
        const fetchForm = async () => {
            const res = await fetch(`http://localhost:8000/forms/${formId}`);
            if (res.ok) {
                const data = await res.json();
                setForm(data);
                // Optionally auto-select the first question of the first page
                if (data.pages?.[0]?.questions?.[0]) {
                    setSelectedQuestion(data.pages[0].questions[0]);
                }
            }
        };
        fetchForm();
    }, [formId]);

    const togglePage = (pageId) => {
        setOpenPages(prev => ({ ...prev, [pageId]: !prev[pageId] }));
    };

    if (!form) return <Typography sx={{ p: 4 }}>Loading analytics...</Typography>;

    return (
        <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}> {/* Assuming 64px Topbar */}

            {/* LEFT SIDEBAR: Form Hierarchy */}
            <Paper elevation={2} sx={{ width: 300, overflowY: 'auto', borderRadius: 0 }}>
                <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                    <Typography variant="h6">Form Structure</Typography>
                </Box>
                <List component="nav">
                    {form.pages.map((page, index) => (
                        <Box key={page.id}>
                            <ListItemButton onClick={() => togglePage(page.id)}>
                                <ListItemText primary={`Page ${page.page_number}: ${page.title || 'Untitled'}`} />
                                {openPages[page.id] ? <ExpandLess /> : <ExpandMore />}
                            </ListItemButton>

                            <Collapse in={openPages[page.id]} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    {page.questions.map((q) => (
                                        <ListItemButton
                                            key={q.id}
                                            sx={{ pl: 4, bgcolor: selectedQuestion?.id === q.id ? 'action.selected' : 'inherit' }}
                                            onClick={() => setSelectedQuestion(q)}
                                        >
                                            <ListItemText
                                                primary={q.text}
                                                secondary={q.question_type.replace('_', ' ')}
                                                primaryTypographyProps={{ noWrap: true }} // Prevents long questions from breaking the sidebar
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

            {/* MIDDLE PART: Detail View */}
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