import React from 'react';
import {
    Box,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';

/**
 * KdeSettings — compact inline panel, designed to sit next to a ToggleButtonGroup.
 *
 * Props:
 *   kdeEnabled   {boolean}   — whether the KDE curve overlay is on
 *   kdeBandwidth {number}    — bandwidth (h) for the Gaussian kernel
 *   onToggle     {function}  — called with new boolean when switch changes
 *   onBandwidth  {function}  — called with new number when input changes
 *   disabled     {boolean}   — when true, shown but locked (categorical data)
 *   disabledHint {string}    — tooltip text shown when disabled
 */
export default function KdeSettings({
    kdeEnabled,
    kdeBandwidth,
    onToggle,
    onBandwidth,
    disabled = false,
    disabledHint = '',
}) {
    return (
        <Tooltip
            title={disabled ? disabledHint : ''}
            placement="top"
            arrow
            disableHoverListener={!disabled}
        >
            {/* outer span keeps Tooltip working on a disabled child */}
            <Box
                component="span"
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    px: 1.25,
                    height: 34,           // matches MUI size="small" ToggleButtonGroup
                    opacity: disabled ? 0.5 : 1,
                    pointerEvents: disabled ? 'none' : 'auto',
                    bgcolor: 'background.paper',
                    cursor: disabled ? 'not-allowed' : 'default',
                }}
            >
                <ShowChartIcon
                    sx={{ fontSize: 16 }}
                    color={disabled ? 'disabled' : kdeEnabled ? 'primary' : 'action'}
                />

                <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: disabled ? 'text.disabled' : 'text.secondary', userSelect: 'none' }}
                >
                    KDE
                </Typography>

                <Switch
                    size="small"
                    checked={kdeEnabled}
                    onChange={(e) => onToggle(e.target.checked)}
                    disabled={disabled}
                    sx={{ mx: -0.5 }}
                />

                {/* Bandwidth field — only when active */}
                {kdeEnabled && !disabled && (
                    <TextField
                        label="h"
                        type="number"
                        size="small"
                        value={kdeBandwidth}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val > 0) onBandwidth(val);
                        }}
                        inputProps={{ min: 0.01, step: 0.05 }}
                        sx={{
                            width: 80,
                            // Pull the label tightly so height stays compact
                            '& .MuiInputLabel-root': { fontSize: '0.7rem' },
                            '& .MuiInputBase-input': { py: 0.4, fontSize: '0.85rem' },
                        }}
                    />
                )}
            </Box>
        </Tooltip>
    );
}
