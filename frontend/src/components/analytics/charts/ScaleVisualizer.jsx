import React from 'react';
import PlotlyComponent from 'react-plotly.js';

// Vite CommonJS Interop Fix
const Plot = PlotlyComponent.default || PlotlyComponent;

export default function ScaleVisualizer({ mode, data, question }) {
    // If no data, show a friendly message
    if (!data || data.length === 0) {
        return <div>No responses yet.</div>;
    }

    // Common layout configuration for all scale plots
    const layout = {
        autosize: true,
        margin: { l: 50, r: 20, t: 20, b: 50 },
        xaxis: {
            title: 'Scale Value',
            range: [question.scale_min - 0.5, question.scale_max + 0.5],
            dtick: 1
        },
        yaxis: {
            title: mode === 'histogram' ? 'Count' : ''
        },
        violinmode: 'group',
        boxmode: 'group',
        barmode: 'group',
        showlegend: data.length > 1,
    };

    const config = { responsive: true, displayModeBar: false };

    // Color palette for multiple groups
    const colors = ['#1976d2', '#9c27b0', '#2e7d32', '#f57c00', '#dc004e', '#0288d1'];

    // Build one trace per series (group)
    const plotTraces = data.map((series, index) => {
        const color = colors[index % colors.length];

        const baseTrace = {
            name: series.name, // "CS", "Math", or "All Students"
            x: series.data,    // The raw array of numeric scale values
            showlegend: data.length > 1,
        };

        // 1. VIOLIN PLOT
        if (mode === 'violin') {
            return {
                ...baseTrace,
                type: 'violin',
                box: { visible: true },
                meanline: { visible: true },
                points: 'all',
                jitter: 0.3,
                pointpos: -1.5,
                marker: { color },
            };
        }

        // 2. BOX PLOT
        if (mode === 'box') {
            return {
                ...baseTrace,
                type: 'box',
                boxpoints: 'all',
                jitter: 0.3,
                pointpos: -1.8,
                marker: { color },
            };
        }

        // 3. HISTOGRAM
        if (mode === 'histogram') {
            return {
                ...baseTrace,
                type: 'histogram',
                xbins: {
                    start: question.scale_min - 0.5,
                    end: question.scale_max + 0.5,
                    size: 1
                },
                marker: { color },
                opacity: data.length > 1 ? 0.7 : 1,
            };
        }

        return null;
    }).filter(Boolean);

    if (plotTraces.length === 0) {
        return <div>Unsupported mode: {mode}</div>;
    }

    return (
        <Plot
            data={plotTraces}
            layout={layout}
            config={config}
            style={{ width: '100%', height: '100%' }}
        />
    );
}