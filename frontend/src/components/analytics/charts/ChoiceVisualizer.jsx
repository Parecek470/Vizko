import React from 'react';
import PlotlyComponent from 'react-plotly.js';

// Vite CommonJS Interop Fix: Unwrap the default export if Vite bundled it as an object
const Plot = PlotlyComponent.default || PlotlyComponent;

export default function ChoiceVisualizer({ mode, data }) {
    if (!data || data.length === 0) {
        return <div>No responses yet.</div>;
    }

    // 1. DEFENSIVE CHECK: Detect if we are receiving the old aggregated objects
    // Old format: [{ name: "Math", count: 2 }]
    // New format: ["Math", "Math"]
    const isOldFormat = typeof data[0] === 'object' && data[0] !== null;

    // 2. NORMALIZE THE DATA
    let pieLabels = [];
    let pieValues = [];
    let histogramData = []; // Plotly needs a flat array for histograms

    if (isOldFormat) {
        // --- Handle Old API Format ---
        pieLabels = data.map(item => item.name);
        pieValues = data.map(item => item.count);

        // "Un-aggregate" the objects back into a raw string array for the histogram
        data.forEach(item => {
            for (let i = 0; i < item.count; i++) {
                histogramData.push(item.name);
            }
        });
    } else {
        // --- Handle New Raw API Format ---
        histogramData = data;

        // Manually aggregate for the Pie Chart
        const counts = data.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});

        pieLabels = Object.keys(counts);
        pieValues = Object.values(counts);
    }

    // 3. RENDER THE CHARTS
    const layout = {
        autosize: true,
        margin: { l: 50, r: 50, t: 20, b: 50 },
    };

    const config = { responsive: true, displayModeBar: false };

    if (mode === 'pie') {
        return (
            <Plot
                data={[{
                    type: 'pie',
                    labels: pieLabels,
                    values: pieValues,
                    hole: 0.4,
                    marker: {
                        colors: ['#1976d2', '#dc004e', '#388e3c', '#f57c00', '#9c27b0']
                    }
                }]}
                layout={layout}
                config={config}
                style={{ width: '100%', height: '100%' }}
            />
        );
    }

    if (mode === 'histogram') {
        return (
            <Plot
                data={[{
                    type: 'histogram',
                    x: histogramData, // Now guaranteed to be an array of strings!
                    marker: { color: '#1976d2' }
                }]}
                layout={{
                    ...layout,
                    yaxis: { title: 'Count' },
                    xaxis: { title: 'Selected Options' }
                }}
                config={config}
                style={{ width: '100%', height: '100%' }}
            />
        );
    }

    return null;
}