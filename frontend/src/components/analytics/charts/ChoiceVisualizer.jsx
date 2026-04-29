import React from 'react';
import PlotlyComponent from 'react-plotly.js';

const Plot = PlotlyComponent.default || PlotlyComponent;

export default function ChoiceVisualizer({ mode, data }) {
    if (!data || data.length === 0) {
        return <div>No responses yet.</div>;
    }

    const layout = { autosize: true, margin: { l: 50, r: 50, t: 20, b: 50 } };
    const config = { responsive: true, displayModeBar: false };
    const colors = ['#1976d2', '#dc004e', '#388e3c', '#f57c00', '#9c27b0'];

    // Flatten one series' data into raw strings, expanding any multi-select arrays.
    const flatten = (arr) => arr.flatMap(v => Array.isArray(v) ? v : [v]);

    if (mode === 'pie') {
        // Aggregate across all series for a single pie.
        const all = data.flatMap(s => flatten(s.data || []));
        const counts = all.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});
        return (
            <Plot
                data={[{
                    type: 'pie',
                    labels: Object.keys(counts),
                    values: Object.values(counts),
                    hole: 0.4,
                    marker: { colors },
                }]}
                layout={layout}
                config={config}
                style={{ width: '100%', height: '100%' }}
            />
        );
    }

    if (mode === 'histogram') {
        // One histogram trace per series for grouped views.
        const traces = data.map((s, i) => ({
            type: 'histogram',
            name: s.name,
            x: flatten(s.data || []),
            marker: { color: colors[i % colors.length] },
            opacity: data.length > 1 ? 0.7 : 1,
        }));
        return (
            <Plot
                data={traces}
                layout={{
                    ...layout,
                    barmode: 'group',
                    yaxis: { title: 'Count' },
                    xaxis: { title: 'Selected Options' },
                    showlegend: data.length > 1,
                }}
                config={config}
                style={{ width: '100%', height: '100%' }}
            />
        );
    }

    return null;
}