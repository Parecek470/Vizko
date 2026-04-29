import React from 'react';
import ChoiceVisualizer from './ChoiceVisualizer';
import ScaleVisualizer from './ScaleVisualizer';
import TextVisualizer from './TextVisualizer';

export default function ChartSwitcher({ type, mode, seriesData, question, kdeEnabled, kdeBandwidth }) {
    switch (type) {
        case 'single_choice':
        case 'multiple_choice':
            return <ChoiceVisualizer mode={mode} data={seriesData} kdeEnabled={kdeEnabled} kdeBandwidth={kdeBandwidth} />;
        case 'scale':
            return <ScaleVisualizer mode={mode} data={seriesData} question={question} kdeEnabled={kdeEnabled} kdeBandwidth={kdeBandwidth} />;
        case 'text_open':
            return <TextVisualizer data={seriesData} />;
        default:
            return <div>Unsupported question type: {type}</div>;
    }
}