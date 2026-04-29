import { useState, useEffect } from 'react';
import { Box, Typography, Paper, ToggleButton, ToggleButtonGroup, CircularProgress } from '@mui/material';
import ChartSwitcher from './charts/ChartSwitcher';
import { BarChart, PieChart, ShowChart, ScatterPlot } from '@mui/icons-material';
import { apiFetch } from '../../utils/api';

export default function QuestionVisualizer({ formId, question, groupByQuestionId }) {
    // rawData will store an array like: [1, 1, 2, 4, 5] or ["Option A", "Option A", "Option B"]
    const [rawData, setRawData] = useState([]);
    const [totalResponses, setTotalResponses] = useState(0);
    const [loading, setLoading] = useState(true);

    const defaultView = question.question_type === 'scale' ? 'histogram' :
        question.question_type === 'text_open' ? 'text' : 'pie';
    const [viewMode, setViewMode] = useState(defaultView);

    useEffect(() => {
        const fetchRawAnalytics = async () => {
            setLoading(true);
            try {
                let queryParams = `?q=${question.id}`;

                if (groupByQuestionId) {
                    queryParams += `&q=${groupByQuestionId}`;
                }
                // Call the new universal raw-answers endpoint
                const response = await apiFetch(
                    `http://localhost:8000/forms/${formId}/analytics/raw-answers${queryParams}`
                );
                const json = await response.json();

                // Extract the specific array for this question ID.
                // Default to an empty array if nobody has answered yet.
                const questionDataArray = json.data[question.id.toString()] || [];
                let formattedSeries = [];

                setTotalResponses(questionDataArray.filter(v => v !== null).length);
                if(!groupByQuestionId) {
                    formattedSeries = [{
                        name: 'All Students',
                        data: questionDataArray.filter(val => val !== null)
                    }];
                }
                else {
                    // Group data is a SEPARATE array from the API, indexed the same way
                    const groupData = json.data[groupByQuestionId.toString()] || [];
                    const uniqueGroups = [...new Set(groupData)].filter(val => val !== null);

                    formattedSeries = uniqueGroups.map(groupName => {
                        // Extract only answers that match this specific group's index
                        const groupSpecificData = questionDataArray.filter((val, index) => {
                            return groupData[index] === groupName && val !== null;
                        });

                        return {
                            name: groupName,
                            data: groupSpecificData
                        };
                    });
                }
                setRawData(formattedSeries);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRawAnalytics();
        setViewMode(defaultView);
    }, [formId, question, groupByQuestionId]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

    return (
        <Paper sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="h5">{question.text}</Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                        n = {totalResponses} responses
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
                    seriesData={rawData}
                    question={question} // Pass the question object for min/max labels!
                />
            </Box>
        </Paper>
    );
}