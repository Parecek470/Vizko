import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Card, CardContent } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function QuestionVisualizer({ formId, question }) {
    const [chartData, setChartData] = useState([]);
    const [textResponses, setTextResponses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: In the next step, we need to build this backend endpoint.
        // For now, this is how the component expects the data to arrive.
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                // Example: GET /forms/1/analytics/questions/5
                const res = await fetch(`http://localhost:8000/forms/${formId}/analytics/questions/${question.id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (question.question_type === 'text_open') {
                        setTextResponses(data.responses); // Expecting an array of strings
                    } else {
                        setChartData(data.distribution); // Expecting [{ name: 'Option A', count: 12 }, ...]
                    }
                }
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            }
            setLoading(false);
        };

        fetchAnalytics();
    }, [formId, question.id, question.question_type]);

    if (loading) return <Typography>Loading chart data...</Typography>;

    return (
        <Paper sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" gutterBottom>{question.text}</Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 4, textTransform: 'capitalize' }}>
                Question Type: {question.question_type.replace('_', ' ')}
            </Typography>

            <Box sx={{ flexGrow: 1, minHeight: 400 }}>
                {/* RENDER HISTOGRAM FOR DATA QUESTIONS */}
                {['single_choice', 'multiple_choice', 'scale'].includes(question.question_type) && (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#1976d2" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}

                {/* RENDER TEXT CARDS FOR OPEN QUESTIONS */}
                {question.question_type === 'text_open' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {textResponses.length > 0 ? textResponses.map((text, idx) => (
                            <Card key={idx} variant="outlined" sx={{ bgcolor: '#fafafa' }}>
                                <CardContent>
                                    <Typography variant="body1">{text}</Typography>
                                </CardContent>
                            </Card>
                        )) : (
                            <Typography color="text.secondary">No text responses yet.</Typography>
                        )}
                    </Box>
                )}
            </Box>
        </Paper>
    );
}