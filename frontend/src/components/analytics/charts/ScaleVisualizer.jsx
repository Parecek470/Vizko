import React from 'react';
import PlotlyComponent from 'react-plotly.js';

// Vite CommonJS Interop Fix
const Plot = PlotlyComponent.default || PlotlyComponent;

// ---------------------------------------------------------------------------
// Pure-JS Gaussian Kernel Density Estimation
// Returns an array of density values for each point in xPoints.
// ---------------------------------------------------------------------------
function gaussianKDE(data, bandwidth, xPoints) {
    const n = data.length;
    const h = bandwidth;
    const inv_sqrt2pi = 1 / Math.sqrt(2 * Math.PI);
    return xPoints.map(x => {
        let sum = 0;
        for (let i = 0; i < n; i++) {
            const u = (x - data[i]) / h;
            sum += inv_sqrt2pi * Math.exp(-0.5 * u * u);
        }
        return sum / (n * h);
    });
}

// Build a linearly-spaced array of `count` points in [start, end]
function linspace(start, end, count = 200) {
    const step = (end - start) / (count - 1);
    return Array.from({ length: count }, (_, i) => start + i * step);
}

// ---------------------------------------------------------------------------

export default function ScaleVisualizer({ mode, data, question, kdeEnabled, kdeBandwidth }) {
    if (!data || data.length === 0) {
        return <div>No responses yet.</div>;
    }

    const scaleMin = Number.isFinite(question?.scale_min) ? question.scale_min : 1;
    const scaleMax = Number.isFinite(question?.scale_max) ? question.scale_max : 5;

    // Color palette for multiple groups
    const colors = ['#1976d2', '#9c27b0', '#2e7d32', '#f57c00', '#dc004e', '#0288d1'];

    // Common layout configuration for all scale plots
    const layout = {
        autosize: true,
        margin: { l: 50, r: 20, t: 20, b: 50 },
        xaxis: {
            title: 'Scale Value',
            range: [scaleMin - 0.5, scaleMax + 0.5],
            dtick: 1,
        },
        yaxis: {
            // Always show Count on the left — KDE is scaled to match.
            title: mode === 'histogram' ? 'Count' : '',
        },
        violinmode: 'group',
        boxmode: 'group',
        // 'group' keeps split-data bars side-by-side; KDE scatter traces are unaffected.
        barmode: 'group',
        showlegend: data.length > 1 || (mode === 'histogram' && kdeEnabled),
    };

    const config = { responsive: true, displayModeBar: false };

    // Build one (or two, if KDE) trace(s) per series
    const plotTraces = data.flatMap((series, index) => {
        const color = colors[index % colors.length];

        const baseTrace = {
            name: series.name,
            x: series.data,
            showlegend: data.length > 1,
        };

        // 1. VIOLIN PLOT
        if (mode === 'violin') {
            return [{
                ...baseTrace,
                type: 'violin',
                box: { visible: true },
                meanline: { visible: true },
                points: 'all',
                jitter: 0.3,
                pointpos: -1.5,
                marker: { color },
            }];
        }

        // 2. BOX PLOT
        if (mode === 'box') {
            return [{
                ...baseTrace,
                type: 'box',
                boxpoints: 'all',
                jitter: 0.3,
                pointpos: -1.8,
                marker: { color },
            }];
        }

        // 3. HISTOGRAM (+ optional KDE overlay)
        if (mode === 'histogram') {
            const histTrace = {
                ...baseTrace,
                type: 'histogram',
                // No histnorm — keep count units so the left axis never changes.
                xbins: {
                    start: scaleMin - 0.5,
                    end: scaleMax + 0.5,
                    size: 1,
                },
                marker: {
                    color,
                    line: { color: 'rgba(0,0,0,0.35)', width: 1.5 },
                },
                opacity: data.length > 1 ? 0.7 : 0.85,
            };

            if (!kdeEnabled) return [histTrace];

            // Compute KDE and scale to COUNT units: density * n * binWidth.
            // binWidth = 1 for integer scale values, so y_count = kde(x) * n.
            const numericData = series.data.filter(v => typeof v === 'number');
            if (numericData.length < 2) return [histTrace];

            const n = numericData.length;
            const xKde = linspace(scaleMin - 0.5, scaleMax + 0.5, 300);
            const yKde = gaussianKDE(numericData, kdeBandwidth, xKde).map(d => d * n * 1);

            const kdeTrace = {
                name: data.length > 1 ? `${series.name} KDE` : 'KDE',
                x: xKde,
                y: yKde,
                type: 'scatter',
                mode: 'lines',
                line: { color, width: 2.5 },
                showlegend: true,
            };

            return [histTrace, kdeTrace];
        }

        return [];
    });

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