import React from 'react';
import Plot from 'react-plotly.js';

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
            // Force X-axis to show the exact scale (e.g., 1 to 5)
            range: [question.scale_min - 0.5, question.scale_max + 0.5],
            dtick: 1
        },
        yaxis: {
            title: mode === 'histogram' ? 'Count' : ''
        }
    };

    const config = { responsive: true, displayModeBar: false };

    // 1. VIOLIN PLOT (Plotly calculates the KDE curve automatically from raw data)
    if (mode === 'violin') {
        return (
            <Plot
                data={[{
                    type: 'violin',
                    x: data, // Just pass the raw array!
                    box: { visible: true }, // Shows a mini box plot inside the violin
                    meanline: { visible: true }, // Shows the mean
                    points: 'all', // Show individual points next to the violin
                    jitter: 0.3,
                    pointpos: -1.5,
                    marker: { color: '#1976d2' },
                    name: '' // Hides the legend name
                }]}
                layout={layout}
                config={config}
                style={{ width: '100%', height: '100%' }}
            />
        );
    }

    // 2. BOX PLOT (Plotly calculates quartiles automatically from raw data)
    if (mode === 'box') {
        return (
            <Plot
                data={[{
                    type: 'box',
                    x: data, // Just pass the raw array!
                    boxpoints: 'all',
                    jitter: 0.3,
                    pointpos: -1.8,
                    marker: { color: '#9c27b0' },
                    name: ''
                }]}
                layout={layout}
                config={config}
                style={{ width: '100%', height: '100%' }}
            />
        );
    }

    // 3. HISTOGRAM
    if (mode === 'histogram') {
        return (
            <Plot
                data={[{
                    type: 'histogram',
                    x: data, // Just pass the raw array!
                    xbins: {
                        start: question.scale_min - 0.5,
                        end: question.scale_max + 0.5,
                        size: 1
                    },
                    marker: { color: '#2e7d32' },
                }]}
                layout={layout}
                config={config}
                style={{ width: '100%', height: '100%' }}
            />
        );
    }

    return null;
}