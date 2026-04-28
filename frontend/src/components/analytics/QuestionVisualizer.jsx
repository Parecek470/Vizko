import { useState, useEffect } from 'react';
import { Box, Typography, Paper, ToggleButton, ToggleButtonGroup, CircularProgress } from '@mui/material';
import ChartSwitcher from './charts/ChartSwitcher';
import { BarChart, PieChart, ShowChart, ScatterPlot } from '@mui/icons-material';

export default function QuestionVisualizer({ formId, question }) {
    // rawData will store an array like: [1, 1, 2, 4, 5] or ["Option A", "Option A", "Option B"]
    const [rawData, setRawData] = useState([]);
    const [loading, setLoading] = useState(true);

    const defaultView = question.question_type === 'scale' ? 'histogram' :
        question.question_type === 'text_open' ? 'text' : 'pie';
    const [viewMode, setViewMode] = useState(defaultView);

    useEffect(() => {
        const fetchRawAnalytics = async () => {
            setLoading(true);
            try {
                // Call the new universal raw-answers endpoint
                const response = await fetch(
                    `http://localhost:8000/forms/${formId}/analytics/raw-answers?q=${question.id}`
                );
                const json = await response.json();

                // Extract the specific array for this question ID.
                // Default to an empty array if nobody has answered yet.
                const questionDataArray = json.data[question.id.toString()] || [];
                setRawData(questionDataArray);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRawAnalytics();
        setViewMode(defaultView);
    }, [formId, question]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

    return (
        <Paper sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="h5">{question.text}</Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                        n = {rawData.length} responses
                    </Typography>
                </Box>

                {question.question_type === 'scale' && (
                    <ToggleButtonGroup size="small" value={viewMode} exclusive onChange={(e, val) => val && setViewMode(val)}>
                        <ToggleButton value="histogram"><BarChart sx={{mr: 1}}/> Hist</ToggleButton>
                        <ToggleButton value="box"><ShowChart sx={{mr: 1}}/> Box</ToggleButton>
                        <ToggleButton value="violin">Violin</ToggleButton>
                    </ToggleButtonGroup>
                )}

                {/* ... other toggle buttons ... */}
            </Box>

            <Box sx={{ flexGrow: 1, minHeight: '300px' }}>
                {/* Pass the RAW array down to the switcher */}
                <ChartSwitcher
                    type={question.question_type}
                    mode={viewMode}
                    data={rawData}
                    question={question} // Pass the question object for min/max labels!
                />
            </Box>
        </Paper>
    );
}