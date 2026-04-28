import React from 'react';
import ChoiceVisualizer from './ChoiceVisualizer';
import ScaleVisualizer from './ScaleVisualizer';
import TextVisualizer from './TextVisualizer';

export default function ChartSwitcher({ type, mode, data, question }) {
    switch (type) {
        case 'single_choice':
        case 'multiple_choice':
            return <ChoiceVisualizer mode={mode} data={data} />;
        case 'scale':
            return <ScaleVisualizer mode={mode} data={data} question={question} />;
        case 'text_open':
            return <TextVisualizer data={data} />;
        default:
            return <div>Unsupported question type: {type}</div>;
    }
}