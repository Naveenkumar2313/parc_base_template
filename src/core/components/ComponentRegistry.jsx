import React, { useState } from 'react';
import { Group, Path, Circle, Text } from 'react-konva';
import { gridToPixel } from '../../canvas/utils';

/**
 * Interactive Pin component handling "invisible" hover state
 * Glows gently to invite wire connections.
 */
export const PinNode = ({ x, y, id, parentId }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <Circle
            x={gridToPixel(x)}
            y={gridToPixel(y)}
            radius={hovered ? 8 : 12} // Generous hit area
            fill={hovered ? 'rgba(50, 150, 255, 0.4)' : 'transparent'}
            stroke={hovered ? '#3296FF' : 'transparent'}
            strokeWidth={2}
            onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'crosshair';
                setHovered(true);
            }}
            onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
                setHovered(false);
            }}
            onClick={(e) => {
                // Prevent event bubbling when clicking on the pin
                e.cancelBubble = true;
                const state = useCircuitStore.getState();
                const parentState = state.components[parentId];
                if (!parentState) return;

                // Map relative pin schema properties exactly onto standard global absolute layout natively cleanly
                const absX = parentState.x + x;
                const absY = parentState.y + y;

                if (!state.temporaryWire) {
                    // Arm tracking map
                    state.setTemporaryWire({
                        start: { x: absX, y: absY, compId: parentId, pinId: id },
                        current: { x: absX, y: absY }
                    });
                } else {
                    // Snap connection and finalize routing tracking loop safely
                    if (state.temporaryWire.start.compId !== parentId || state.temporaryWire.start.pinId !== id) {
                        state.commitWire({
                            start: state.temporaryWire.start,
                            end: { x: absX, y: absY, compId: parentId, pinId: id }
                        });

                        // Fire logic engine seamlessly processing native arrays actively resolving MNA variables immediately natively mapping variables efficiently
                        import('../solver/netlistExtractor').then(({ extractNetlist }) => {
                            import('../solver/solver').then(({ solveCircuit }) => {
                                const { components, wires } = useCircuitStore.getState();
                                const netlist = extractNetlist(components, wires);
                                solveCircuit(netlist);
                            });
                        });
                    } else {
                        // Cancels identical loop clicks naturally mapped
                        state.clearTemporaryWire();
                    }
                }
            }}
        />
    );
};

/**
 * Standard Schema Registry defining electronic parts.
 * Maps 'type' identifiers to internal structures, pins, and Konva instructions.
 */
export const ComponentRegistry = {
    resistor: {
        type: 'resistor',
        // Define pin positions relative to component origin (-1 and 1 in grid units = 40px gap)
        pins: [
            { id: 'pin1', x: -1, y: 0 },
            { id: 'pin2', x: 1, y: 0 },
        ],
        // Visual definitions using canvas primitives
        renderVisuals: () => (
            <Path
                data="M -20 0 L -12 0 L -9 -8 L -3 8 L 3 -8 L 9 8 L 12 0 L 20 0"
                stroke="#2c3e50"
                strokeWidth={2}
                hitStrokeWidth={10}
                lineJoin="round"
            />
        ),
    },
    dcSource: {
        type: 'dcSource',
        // Vertically oriented DC source, so pins are on the Y axis
        pins: [
            { id: 'pos', x: 0, y: -1 },
            { id: 'neg', x: 0, y: 1 },
        ],
        renderVisuals: () => (
            <Group>
                {/* Upper wire and long plate (+) */}
                <Path data="M 0 -20 L 0 -5" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -12 -5 L 12 -5" stroke="#2c3e50" strokeWidth={2} />

                {/* Lower short plate (-) and bottom wire */}
                <Path data="M -7 5 L 7 5" stroke="#2c3e50" strokeWidth={3} />
                <Path data="M 0 5 L 0 20" stroke="#2c3e50" strokeWidth={2} />

                {/* '+' symbol indicator near the positive plate */}
                <Path data="M 6 -13 L 10 -13 M 8 -15 L 8 -11" stroke="#2c3e50" strokeWidth={1} />
            </Group>
        ),
    },
    ground: {
        type: 'ground',
        pins: [
            { id: 'gnd', x: 0, y: -1 } // Connects upward to circuit
        ],
        renderVisuals: () => (
            <Group>
                {/* Connecting wire */}
                <Path data="M 0 -20 L 0 0" stroke="#2c3e50" strokeWidth={2} />
                {/* Standard decreasing ground chassis plates */}
                <Path data="M -12 0 L 12 0" stroke="#2c3e50" strokeWidth={2.5} />
                <Path data="M -7 6 L 7 6" stroke="#2c3e50" strokeWidth={2.5} />
                <Path data="M -2 12 L 2 12" stroke="#2c3e50" strokeWidth={2.5} />
            </Group>
        ),
    },
};

import useCircuitStore from '../../store/circuitStore';

/**
 * Generic Rendering Wrapper for Circuit components.
 * Consumes the ComponentRegistry definition to map an abstract instance into Konva context.
 */
export const CircuitComponent = ({ id, type, value, gridX, gridY, rotation = 0 }) => {
    const schema = ComponentRegistry[type];
    if (!schema) {
        console.warn(`Unknown component type: ${type}`);
        return null;
    }

    return (
        <Group
            x={gridToPixel(gridX)}
            y={gridToPixel(gridY)}
            rotation={rotation}
            draggable
            onClick={(e) => {
                e.cancelBubble = true;
                useCircuitStore.getState().setSelectedComponentId(id);
            }}
            onDragStart={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'grab';
            }}
            onDragEnd={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
                // Trigger snapping logic update back into Zustand here
            }}
        >
            {/* 1. Component Shape Constraints */}
            {schema.renderVisuals()}

            {/* 2. Map Interactive Logic Hooks (Pins) */}
            {schema.pins.map((pin) => (
                <PinNode
                    key={pin.id}
                    x={pin.x}
                    y={pin.y}
                    id={pin.id}
                    parentId={id}
                />
            ))}

            {/* 3. Physical UI Annotations tracking Property Values Natively */}
            {value !== undefined && (
                <Text
                    x={-15}
                    y={22}
                    text={`${value}${type === 'resistor' ? 'Ω' : 'V'}`}
                    fill="#333"
                    fontSize={13}
                    fontFamily="monospace"
                    fontStyle="bold"
                    listening={false} // Prevents grabbing text boundaries interrupting lines natively
                />
            )}
        </Group>
    );
};

export default CircuitComponent;
