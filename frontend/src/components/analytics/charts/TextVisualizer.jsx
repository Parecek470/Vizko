import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';

export default function TextVisualizer({ data }) {
    if (!data || data.length === 0) {
        return <div>No responses yet.</div>;
    }

    return (
        <Box sx={{
            maxHeight: '400px',
            overflowY: 'auto',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1
        }}>
            <List disablePadding>
                {data.map((text, index) => (
                    <React.Fragment key={index}>
                        <ListItem alignItems="flex-start" sx={{ px: 3, py: 2 }}>
                            <ListItemText
                                primary={
                                    <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                        "{text}"
                                    </Typography>
                                }
                            />
                        </ListItem>
                        {/* Only add a divider if it's not the last item */}
                        {index < data.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                ))}
            </List>
        </Box>
    );
}