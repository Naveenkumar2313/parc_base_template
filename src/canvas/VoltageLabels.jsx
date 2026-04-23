import React from 'react';
import { Text } from 'react-konva';
import { gridToPixel } from './utils';
import useCircuitStore from '../store/circuitStore';
import { ComponentRegistry } from '../core/components/ComponentRegistry';

const VoltageLabels = ({ components }) => {
    const simulationState = useCircuitStore(s => s.simulationState);
    const activeNetlist = useCircuitStore(s => s.activeNetlist);

    if (!activeNetlist || !simulationState?.voltages) return null;

    const nodePositions = {};
    for (const [compId, comp] of Object.entries(components)) {
        const schema = ComponentRegistry[comp.type];
        if (!schema) continue;
        schema.pins.forEach(pin => {
            const pinStr = `${compId}:${pin.id}`;
            const nodeId = activeNetlist.pinToNodeMap[pinStr];
            if (nodeId !== undefined && nodeId !== 0 && !nodePositions[nodeId]) {
                nodePositions[nodeId] = { x: comp.x + pin.x, y: comp.y + pin.y };
            }
        });
    }

    return (
        <>
            {Object.entries(nodePositions).map(([nodeId, pos]) => {
                const v = simulationState.voltages[nodeId];
                if (v === undefined) return null;
                return (
                    <Text
                        key={`vlabel-${nodeId}`}
                        x={gridToPixel(pos.x) + 8}
                        y={gridToPixel(pos.y) - 15}
                        text={`${v.toFixed(2)}V`}
                        fill="#ff00cc"
                        fontSize={12}
                        fontFamily="monospace"
                        fontStyle="bold"
                        listening={false}
                    />
                );
            })}
        </>
    );
};

export default VoltageLabels;
