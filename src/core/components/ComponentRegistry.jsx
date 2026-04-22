import React, { useState } from 'react';
import { Group, Path, Circle, Text, Rect } from 'react-konva';
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

                        // The engine parses seamlessly via worker
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
    functionGenerator: {
        type: 'functionGenerator',
        pins: [
            { id: 'pos', x: 0, y: -1 },
            { id: 'neg', x: 0, y: 1 },
        ],
        renderVisuals: () => (
            <Group>
                <Circle x={0} y={0} radius={15} fill="#fafafa" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -8 0 Q -4 -8, 0 0 T 8 0" stroke="#2c3e50" strokeWidth={1.5} fill="transparent" />
                <Path data="M 0 -20 L 0 -15" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 0 15 L 0 20" stroke="#2c3e50" strokeWidth={2} />
            </Group>
        ),
    },
    capacitor: {
        type: 'capacitor',
        pins: [
            { id: 'pin1', x: -1, y: 0 },
            { id: 'pin2', x: 1, y: 0 },
        ],
        renderVisuals: () => (
            <Group>
                <Path data="M -20 0 L -5 0" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -5 -10 L -5 10" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 5 -10 L 5 10" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 5 0 L 20 0" stroke="#2c3e50" strokeWidth={2} />
            </Group>
        ),
    },
    inductor: {
        type: 'inductor',
        pins: [
            { id: 'pin1', x: -1, y: 0 },
            { id: 'pin2', x: 1, y: 0 },
        ],
        renderVisuals: () => (
            <Group>
                <Path data="M -20 0 L -12 0" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -12 0 C -12 -10, -4 -10, -4 0" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -4 0 C -4 -10, 4 -10, 4 0" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 4 0 C 4 -10, 12 -10, 12 0" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 12 0 L 20 0" stroke="#2c3e50" strokeWidth={2} />
            </Group>
        ),
    },
    diode: {
        type: 'diode',
        pins: [
            { id: 'anode', x: -1, y: 0 },
            { id: 'cathode', x: 1, y: 0 },
        ],
        renderVisuals: () => (
            <Group>
                <Path data="M -20 0 L -10 0" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -10 -10 L -10 10 L 5 0 Z" fill="#2c3e50" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 5 -10 L 5 10" stroke="#2c3e50" strokeWidth={3} />
                <Path data="M 5 0 L 20 0" stroke="#2c3e50" strokeWidth={2} />
            </Group>
        ),
    },
    bjt_npn: {
        type: 'bjt_npn',
        pins: [
            { id: 'base', x: -1, y: 0 },
            { id: 'collector', x: 1, y: -1 },
            { id: 'emitter', x: 1, y: 1 }
        ],
        renderVisuals: () => (
            <Group>
                <Path data="M -20 0 L -5 0" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -5 -12 L -5 12" stroke="#2c3e50" strokeWidth={4} />
                <Path data="M -5 -5 L 10 -15 L 20 -15" stroke="#2c3e50" strokeWidth={2} />
                {/* Emitter with arrow */}
                <Path data="M -5 5 L 10 15 L 20 15" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 5 10 L 10 15 L 3 14 Z" fill="#2c3e50" />
                <Circle x={2} y={0} radius={18} stroke="#2c3e50" strokeWidth={1.5} />
            </Group>
        ),
    },
    opamp: {
        type: 'opamp',
        pins: [
            { id: 'in_inv', x: -1.5, y: -0.5 },
            { id: 'in_noninv', x: -1.5, y: 0.5 },
            { id: 'vcc', x: 0, y: -1.5 },
            { id: 'vee', x: 0, y: 1.5 },
            { id: 'out', x: 1.5, y: 0 }
        ],
        renderVisuals: () => (
            <Group>
                <Path data="M -30 -10 L -20 -10" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -30 10 L -20 10" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 20 0 L 30 0" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 0 -15 L 0 -30" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 0 15 L 0 30" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -20 -20 L -20 20 L 20 0 Z" fill="#fcfcfc" stroke="#2c3e50" strokeWidth={2} />
                <Text text="-" x={-15} y={-14} fontSize={14} fill="#2c3e50" />
                <Text text="+" x={-15} y={6} fontSize={14} fill="#2c3e50" />
            </Group>
        ),
    },
    arduino_uno: {
        type: 'arduino_uno',
        pins: [
            { id: 'D13', x: 2, y: -2 },
            { id: 'D12', x: 2, y: -1 },
            { id: 'GND', x: 2, y: 0 }
        ],
        renderVisuals: () => (
            <Group>
                <Rect x={-30} y={-50} width={60} height={100} fill="#0d5bc6" cornerRadius={4} />
                <Text text="UNO" x={-15} y={-5} fill="white" fontSize={14} fontStyle="bold" rotation={-90} />
                {/* Visual PIN headers */}
                <Rect x={15} y={-45} width={10} height={90} fill="#222" />
                <Circle x={20} y={-40} radius={2} fill="silver" />
                <Circle x={20} y={-20} radius={2} fill="silver" />
                <Circle x={20} y={0} radius={2} fill="silver" />
            </Group>
        ),
    },
    and_gate: {
        type: 'and_gate',
        pins: [
            { id: 'in1', x: -1, y: -0.5 },
            { id: 'in2', x: -1, y: 0.5 },
            { id: 'out', x: 1.5, y: 0 }
        ],
        renderVisuals: () => (
            <Group>
                <Path data="M -20 -10 L -20 10 L 0 10 C 12 10, 20 5, 20 0 C 20 -5, 12 -10, 0 -10 Z" fill="#fff" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -20 -10 L -20 10" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 20 0 L 30 0" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -30 -10 L -20 -10" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -30 10 L -20 10" stroke="#2c3e50" strokeWidth={2} />
                <Text text="&" x={-10} y={-8} fontSize={16} fill="#2c3e50" fontStyle="bold" />
            </Group>
        ),
    },
    sensor_dht11: {
        type: 'sensor_dht11',
        pins: [
            { id: 'vcc', x: 0, y: 1 },
            { id: 'data', x: 0.5, y: 1 },
            { id: 'gnd', x: 1, y: 1 }
        ],
        renderVisuals: () => (
            <Group>
                <Rect x={-10} y={-20} width={40} height={35} fill="#0d98ba" cornerRadius={3} />
                <Rect x={-5} y={-15} width={30} height={25} fill="#fff" opacity={0.3} cornerRadius={2} />
                <Text text="DHT11" x={-5} y={-10} fontSize={10} fill="#fff" fontStyle="bold" />
                <Path data="M 0 15 L 0 20 M 10 15 L 10 20 M 20 15 L 20 20" stroke="#aaa" strokeWidth={3} />
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
export const CircuitComponent = ({ id, type, value, gridX, gridY, rotation = 0, flip = 1 }) => {
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
            scaleX={flip}
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
