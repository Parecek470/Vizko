import React from 'react';
import {Box, Divider, List, ListItem, ListItemText, Typography} from "@mui/material";

export default function TextVisualizer({ data }) {
    if (!data || data.length === 0) {
        return <div>No responses yet.</div>;
    }

    // Flatten when there is only one series; otherwise group by series name.
    const showGroupHeaders = data.length > 1;

    return (
        <Box sx={{
            maxHeight: '400px',
            overflowY: 'auto',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
        }}>
            {data.map((series, sIdx) => (
                <React.Fragment key={series.name ?? sIdx}>
                    {showGroupHeaders && (
                        <Typography variant="overline" sx={{ px: 3, pt: 2, display: 'block' }}>
                            {series.name}
                        </Typography>
                    )}
                    <List disablePadding>
                        {(series.data ?? []).map((text, index) => (
                            <React.Fragment key={`${sIdx}-${index}`}>
                                <ListItem alignItems="flex-start" sx={{ px: 3, py: 2 }}>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                                "{text}"
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                                {index < series.data.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                </React.Fragment>
            ))}
        </Box>
    );
}