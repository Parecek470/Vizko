import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    List,
    ListItemButton,
    ListItemText,
    Collapse,
    Typography,
    Paper,
    Divider,
    Breadcrumbs,
    Link, MenuItem, Select, InputLabel, FormControl,
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import QuestionVisualizer from './QuestionVisualizer';
import {apiFetch} from "../../utils/api.js";
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { Link as RouterLink } from 'react-router-dom';


export default function AnalyticsDashboard() {
    const { id } = useParams();
    const [form, setForm] = useState(null);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [error, setError] = useState(null); // 1. Add error state

    const [openPages, setOpenPages] = useState({});
    const [groupByQuestionId, setGroupByQuestionId] = useState('');
    const groupableQuestions = form?.pages?.flatMap(page => page.questions).filter(q => q.question_type === 'single_choice' ) || [];

    useEffect(() => {
        const fetchForm = async () => {
            try {
                const res = await apiFetch(`/forms/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setForm(data);
                    if (data.pages?.[0]?.questions?.[0]) {
                        setOpenPages({ [data.pages[0].id]: true });
                        setSelectedQuestion(data.pages[0].questions[0]);
                    }
                } else {
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
            <Paper elevation={2} sx={{ width: '20vh', overflowY: 'auto', borderRadius: 0 }}>
                <Box sx={{ p: 2, bgcolor: 'primary.dark', color: 'white' }}>
                        <Link
                            component={RouterLink}
                            to={`/forms/${id}`}
                            underline="none"
                            color="textDisabled"
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                mb: 2,
                                px: 2,
                                py: 0.5,
                                fontWeight: 600,
                                bgcolor: "rgba(255, 255, 255, 0.1)",
                                borderRadius: 1,
                                '&:hover': {
                                    color: 'white',
                                    textDecoration: 'none',
                                },
                            }}
                        >
                            <NavigateBeforeIcon fontSize="small" />
                             Forms List
                        </Link>

                    <Typography variant="h6">{form?.title || 'Form Analytics'}</Typography>
                    <Typography variant="subtitle1" color="text.secondary">Responses: {form.response_count}</Typography>
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
            {/* Dashboard controls */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Dashboard controls */}
                <Box sx={{ p: 2, bgcolor: 'background.paper', boxShadow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                        Dashboard Controls
                    </Typography>

                    <FormControl sx={{ minWidth: 300 }}>
                        <InputLabel id="group-by-label">Split data by...</InputLabel>
                        <Select
                            labelId="group-by-label"
                            value={groupByQuestionId}
                            label="Split data by..."
                            onChange={(e) => setGroupByQuestionId(e.target.value)}
                        >
                            <MenuItem value="">
                                <em>No grouping</em>
                            </MenuItem>
                            {groupableQuestions.map((q) => (
                                <MenuItem key={q.id} value={q.id.toString()}>
                                    {q.text}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* Question visualizer */}
                <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', bgcolor: '#f5f5f5' }}>
                    {selectedQuestion ? (
                        <QuestionVisualizer formId={form.id} question={selectedQuestion} groupByQuestionId={groupByQuestionId} />
                    ) : (
                        <Typography color="text.secondary">Select a question from the sidebar to view analytics.</Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );
}