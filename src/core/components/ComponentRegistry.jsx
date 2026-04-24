import React, { useState } from 'react';
import { Group, Path, Circle, Text, Rect } from 'react-konva';
import { gridToPixel, pixelToGrid } from '../../canvas/utils';
import useCircuitStore from '../../store/circuitStore';

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
    potentiometer: {
        type: 'potentiometer',
        pins: [
            { id: 'pin1', x: -1, y: 0 },
            { id: 'wiper', x: 0, y: -1 },
            { id: 'pin2', x: 1, y: 0 },
        ],
        renderVisuals: () => (
            <Group>
                <Path data="M -20 0 L -12 0 L -9 -8 L -3 8 L 3 -8 L 9 8 L 12 0 L 20 0" stroke="#2c3e50" strokeWidth={2} lineJoin="round" />
                {/* Arrow representing the wiper tap */}
                <Path data="M 0 -5 L 0 -20" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -3 -8 L 0 -5 L 3 -8" stroke="#2c3e50" strokeWidth={2} fill="#2c3e50" />
            </Group>
        ),
    },
    spst_switch: {
        type: 'spst_switch',
        pins: [
            { id: 'pin1', x: -1, y: 0 },
            { id: 'pin2', x: 1, y: 0 },
        ],
        renderVisuals: ({ isOpen = true } = {}) => (
            <Group>
                <Path data="M -20 0 L -8 0" stroke="#2c3e50" strokeWidth={2} />
                <Circle x={-8} y={0} radius={3} fill="#2c3e50" />
                <Circle x={8} y={0} radius={3} fill="#2c3e50" />
                {isOpen ? (
                    <Path data="M -8 0 L 6 -8" stroke="#2c3e50" strokeWidth={2} />
                ) : (
                    <Path data="M -8 0 L 8 0" stroke="#2c3e50" strokeWidth={2.5} />
                )}
                <Path data="M 8 0 L 20 0" stroke="#2c3e50" strokeWidth={2} />
            </Group>
        ),
    },
    push_button: {
        type: 'push_button',
        pins: [
            { id: 'pin1', x: -1, y: 0 },
            { id: 'pin2', x: 1, y: 0 },
        ],
        renderVisuals: ({ isPressed = false } = {}) => (
            <Group>
                <Path data="M -20 0 L -8 0" stroke="#2c3e50" strokeWidth={2} />
                <Circle x={-8} y={0} radius={3} fill="#2c3e50" />
                <Circle x={8} y={0} radius={3} fill="#2c3e50" />

                {/* Mechanical connection indicator bar */}
                <Path data={`M -8 ${isPressed ? 0 : -5} L 8 ${isPressed ? 0 : -5}`} stroke="#2c3e50" strokeWidth={2.5} />

                {/* Button Body Rectangle */}
                <Rect x={-8} y={isPressed ? -10 : -15} width={16} height={12} fill="#ddd" stroke="#2c3e50" strokeWidth={1.5} cornerRadius={1} />

                <Path data="M 8 0 L 20 0" stroke="#2c3e50" strokeWidth={2} />
            </Group>
        ),
    },
    relay_spdt: {
        type: 'relay_spdt',
        pins: [
            { id: 'coil_pos', x: 0, y: -2 },
            { id: 'coil_neg', x: 0, y: -1 },
            { id: 'com', x: 1, y: -0.5 },
            { id: 'nc', x: 1, y: 0.5 },
            { id: 'no', x: 2, y: 0 }
        ],
        renderVisuals: () => (
            <Group>
                {/* Coil Graphic */}
                <Rect x={-15} y={-40} width={30} height={20} fill="#fcfcfc" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -5 -35 C -15 -35, -15 -25, -5 -25 C 5 -25, 5 -35, 15 -35" stroke="#2c3e50" strokeWidth={1.5} fill="transparent" />

                {/* Switch Graphic normally closed state */}
                <Circle x={20} y={-10} radius={3} fill="#2c3e50" />
                <Circle x={20} y={10} radius={3} fill="#2c3e50" />
                <Circle x={40} y={0} radius={3} fill="#2c3e50" />

                <Path data="M 20 -10 L 40 0" stroke="#2c3e50" strokeWidth={2} />

                <Text text="COIL" x={-13} y={-45} fontSize={9} fill="#555" />
                <Text text="COM" x={24} y={-14} fontSize={9} fill="#555" />
                <Text text="NC" x={24} y={15} fontSize={9} fill="#555" />
                <Text text="NO" x={45} y={-4} fontSize={9} fill="#555" />
            </Group>
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
    zener_diode: {
        type: 'zener_diode',
        pins: [
            { id: 'anode', x: -1, y: 0 },
            { id: 'cathode', x: 1, y: 0 },
        ],
        renderVisuals: () => (
            <Group>
                <Path data="M -20 0 L -10 0" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -10 -10 L -10 10 L 5 0 Z" fill="#2c3e50" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 5 -10 L 5 10" stroke="#2c3e50" strokeWidth={3} />
                <Path data="M 5 -10 L 8 -13" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 5 10 L 2 13" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 5 0 L 20 0" stroke="#2c3e50" strokeWidth={2} />
            </Group>
        ),
    },
    schottky_diode: {
        type: 'schottky_diode',
        pins: [
            { id: 'anode', x: -1, y: 0 },
            { id: 'cathode', x: 1, y: 0 },
        ],
        renderVisuals: () => (
            <Group>
                <Path data="M -20 0 L -10 0" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -10 -10 L -10 10 L 5 0 Z" fill="#2c3e50" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 5 -10 L 5 -7 C 5 -3 8 -3 8 0 C 8 3 5 3 5 7 L 5 10" stroke="#2c3e50" strokeWidth={3} fill="transparent" />
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
    darlington_npn: {
        type: 'darlington_npn',
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
                <Path data="M -5 5 L 10 15 L 20 15" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 5 10 L 10 15 L 3 14 Z" fill="#2c3e50" />
                <Circle x={2} y={0} radius={18} stroke="#2c3e50" strokeWidth={1.5} />
                <Text text="D" x={-2} y={-14} fontSize={10} fill="#2c3e50" fontStyle="bold" />
            </Group>
        ),
    },
    bjt_pnp: {
        type: 'bjt_pnp',
        pins: [
            { id: 'base', x: -1, y: 0 },
            { id: 'collector', x: 1, y: 1 },
            { id: 'emitter', x: 1, y: -1 }
        ],
        renderVisuals: () => (
            <Group>
                <Path data="M -20 0 L -5 0" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -5 -12 L -5 12" stroke="#2c3e50" strokeWidth={4} />
                <Path data="M -5 -5 L 10 -15 L 20 -15" stroke="#2c3e50" strokeWidth={2} />
                {/* Emitter with inward arrow */}
                <Path data="M -5 5 L 10 15 L 20 15" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 1 0 L 8 -6 L 1 -9 Z" fill="#2c3e50" />
                <Circle x={2} y={0} radius={18} stroke="#2c3e50" strokeWidth={1.5} />
            </Group>
        ),
    },
    mosfet_n: {
        type: 'mosfet_n',
        pins: [
            { id: 'gate', x: -1, y: 0 },
            { id: 'drain', x: 1, y: -1 },
            { id: 'source', x: 1, y: 1 }
        ],
        renderVisuals: () => (
            <Group>
                {/* Gate */}
                <Path data="M -20 0 L -5 0" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -5 -12 L -5 12" stroke="#2c3e50" strokeWidth={2} />

                {/* Channel */}
                <Path data="M 0 -10 L 0 -4" stroke="#2c3e50" strokeWidth={3} />
                <Path data="M 0 -3 L 0 3" stroke="#2c3e50" strokeWidth={3} />
                <Path data="M 0 4 L 0 10" stroke="#2c3e50" strokeWidth={3} />

                {/* Drain */}
                <Path data="M 0 -8 L 10 -8 L 10 -20 L 20 -20" stroke="#2c3e50" strokeWidth={2} />

                {/* Source */}
                <Path data="M 0 8 L 10 8 L 10 20 L 20 20" stroke="#2c3e50" strokeWidth={2} />

                <Circle x={5} y={0} radius={18} stroke="#2c3e50" strokeWidth={1.5} />
            </Group>
        ),
    },
    mosfet_p: {
        type: 'mosfet_p',
        pins: [
            { id: 'gate', x: -1, y: 0 },
            { id: 'source', x: 1, y: -1 },
            { id: 'drain', x: 1, y: 1 }
        ],
        renderVisuals: () => (
            <Group>
                {/* Gate */}
                <Path data="M -20 0 L -8 0" stroke="#2c3e50" strokeWidth={2} />
                <Circle x={-6} y={0} radius={2.5} fill="white" stroke="#2c3e50" strokeWidth={1.5} />
                <Path data="M -4 -12 L -4 12" stroke="#2c3e50" strokeWidth={2} />

                {/* Channel */}
                <Path data="M 1 -10 L 1 -4" stroke="#2c3e50" strokeWidth={3} />
                <Path data="M 1 -3 L 1 3" stroke="#2c3e50" strokeWidth={3} />
                <Path data="M 1 4 L 1 10" stroke="#2c3e50" strokeWidth={3} />

                {/* Source */}
                <Path data="M 1 -8 L 10 -8 L 10 -20 L 20 -20" stroke="#2c3e50" strokeWidth={2} />

                {/* Drain */}
                <Path data="M 1 8 L 10 8 L 10 20 L 20 20" stroke="#2c3e50" strokeWidth={2} />

                <Circle x={5} y={0} radius={18} stroke="#2c3e50" strokeWidth={1.5} />
            </Group>
        ),
    },
    jfet_n: {
        type: 'jfet_n',
        pins: [
            { id: 'gate', x: -1, y: 0 },
            { id: 'drain', x: 0, y: -1 },
            { id: 'source', x: 0, y: 1 }
        ],
        renderVisuals: () => (
            <Group>
                {/* Channel bar */}
                <Path data="M 0 -20 L 0 20" stroke="#2c3e50" strokeWidth={3} />
                {/* Gate connection with arrow */}
                <Path data="M -20 0 L -5 0" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -5 0 L -10 -4 L -10 4 Z" fill="#2c3e50" />
                {/* Drain / Source lines */}
                <Path data="M 0 -15 L 20 -15" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 0 15 L 20 15" stroke="#2c3e50" strokeWidth={2} />
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
    or_gate: {
        type: 'or_gate',
        pins: [
            { id: 'in1', x: -1, y: -0.5 },
            { id: 'in2', x: -1, y: 0.5 },
            { id: 'out', x: 1.5, y: 0 }
        ],
        renderVisuals: () => (
            <Group>
                <Path data="M -20 -10 C -10 -10 5 -10 20 0 C 5 10 -10 10 -20 10 C -10 10 -5 0 -20 -10 Z" fill="#fff" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -30 -10 L -20 -10" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -30 10 L -20 10" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 20 0 L 30 0" stroke="#2c3e50" strokeWidth={2} />
                <Text text="OR" x={-5} y={-8} fontSize={12} fill="#2c3e50" />
            </Group>
        ),
    },
    not_gate: {
        type: 'not_gate',
        pins: [
            { id: 'in', x: -1, y: 0 },
            { id: 'out', x: 1, y: 0 }
        ],
        renderVisuals: () => (
            <Group>
                <Path data="M -15 -12 L -15 12 L 12 0 Z" fill="#fff" stroke="#2c3e50" strokeWidth={2} />
                <Circle x={15} y={0} radius={3} fill="#fff" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -25 0 L -15 0" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 18 0 L 25 0" stroke="#2c3e50" strokeWidth={2} />
            </Group>
        ),
    },
    nand_gate: {
        type: 'nand_gate',
        pins: [
            { id: 'in1', x: -1, y: -0.5 },
            { id: 'in2', x: -1, y: 0.5 },
            { id: 'out', x: 1.5, y: 0 }
        ],
        renderVisuals: () => (
            <Group>
                <Path data="M -20 -10 L -20 10 L 0 10 C 12 10, 20 5, 20 0 C 20 -5, 12 -10, 0 -10 Z" fill="#fff" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -20 -10 L -20 10" stroke="#2c3e50" strokeWidth={2} />
                <Circle x={23} y={0} radius={3} fill="#fff" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -30 -10 L -20 -10" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -30 10 L -20 10" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 26 0 L 35 0" stroke="#2c3e50" strokeWidth={2} />
                <Text text="&" x={-10} y={-8} fontSize={16} fill="#2c3e50" fontStyle="bold" />
            </Group>
        ),
    },
    nor_gate: {
        type: 'nor_gate',
        pins: [
            { id: 'in1', x: -1, y: -0.5 },
            { id: 'in2', x: -1, y: 0.5 },
            { id: 'out', x: 1.5, y: 0 }
        ],
        renderVisuals: () => (
            <Group>
                <Path data="M -20 -10 C -10 -10 5 -10 20 0 C 5 10 -10 10 -20 10 C -10 10 -5 0 -20 -10 Z" fill="#fff" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -30 -10 L -20 -10" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -30 10 L -20 10" stroke="#2c3e50" strokeWidth={2} />
                <Circle x={23} y={0} radius={3} fill="#fff" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 26 0 L 35 0" stroke="#2c3e50" strokeWidth={2} />
                <Text text="OR" x={-5} y={-8} fontSize={12} fill="#2c3e50" />
            </Group>
        ),
    },
    xor_gate: {
        type: 'xor_gate',
        pins: [
            { id: 'in1', x: -1, y: -0.5 },
            { id: 'in2', x: -1, y: 0.5 },
            { id: 'out', x: 1.5, y: 0 }
        ],
        renderVisuals: () => (
            <Group>
                <Path data="M -20 -10 C -10 -10 5 -10 20 0 C 5 10 -10 10 -20 10 C -10 10 -5 0 -20 -10 Z" fill="#fff" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -25 -10 C -15 -10 -10 0 -15 10" stroke="#2c3e50" strokeWidth={2} fill="none" />
                <Path data="M -35 -10 L -25 -10" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -35 10 L -25 10" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 20 0 L 30 0" stroke="#2c3e50" strokeWidth={2} />
                <Text text="=1" x={-3} y={-6} fontSize={10} fill="#2c3e50" fontStyle="bold" />
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
    led: {
        type: 'led',
        pins: [
            { id: 'anode', x: -1, y: 0 },
            { id: 'cathode', x: 1, y: 0 },
        ],
        renderVisuals: ({ isLit = false } = {}) => (
            <Group>
                <Path data="M -20 0 L -10 0" stroke="#2c3e50" strokeWidth={2} />
                <Path
                    data="M -10 -10 L -10 10 L 5 0 Z"
                    fill={isLit ? "#ff4444" : "#2c3e50"}
                    stroke="#2c3e50"
                    strokeWidth={2}
                />
                <Path data="M 5 -10 L 5 10" stroke="#2c3e50" strokeWidth={3} />
                <Path data="M 5 0 L 20 0" stroke="#2c3e50" strokeWidth={2} />
                {isLit && (
                    <Group>
                        <Path data="M 8 -14 L 14 -20" stroke="#ff4444" strokeWidth={2} />
                        <Path data="M 2 -14 L -4 -20" stroke="#ff4444" strokeWidth={2} />
                    </Group>
                )}
            </Group>
        ),
    },
    led_green: {
        type: 'led_green',
        pins: [
            { id: 'anode', x: -1, y: 0 },
            { id: 'cathode', x: 1, y: 0 },
        ],
        renderVisuals: ({ isLit = false } = {}) => (
            <Group>
                <Path data="M -20 0 L -10 0" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -10 -10 L -10 10 L 5 0 Z" fill={isLit ? "#44ff44" : "#2c3e50"} stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 5 -10 L 5 10" stroke="#2c3e50" strokeWidth={3} />
                <Path data="M 5 0 L 20 0" stroke="#2c3e50" strokeWidth={2} />
                {isLit && (
                    <Group>
                        <Path data="M 8 -14 L 14 -20" stroke="#44ff44" strokeWidth={2} />
                        <Path data="M 2 -14 L -4 -20" stroke="#44ff44" strokeWidth={2} />
                    </Group>
                )}
            </Group>
        ),
    },
    led_blue: {
        type: 'led_blue',
        pins: [
            { id: 'anode', x: -1, y: 0 },
            { id: 'cathode', x: 1, y: 0 },
        ],
        renderVisuals: ({ isLit = false } = {}) => (
            <Group>
                <Path data="M -20 0 L -10 0" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -10 -10 L -10 10 L 5 0 Z" fill={isLit ? "#4488ff" : "#2c3e50"} stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 5 -10 L 5 10" stroke="#2c3e50" strokeWidth={3} />
                <Path data="M 5 0 L 20 0" stroke="#2c3e50" strokeWidth={2} />
                {isLit && (
                    <Group>
                        <Path data="M 8 -14 L 14 -20" stroke="#4488ff" strokeWidth={2} />
                        <Path data="M 2 -14 L -4 -20" stroke="#4488ff" strokeWidth={2} />
                    </Group>
                )}
            </Group>
        ),
    },
    led_yellow: {
        type: 'led_yellow',
        pins: [
            { id: 'anode', x: -1, y: 0 },
            { id: 'cathode', x: 1, y: 0 },
        ],
        renderVisuals: ({ isLit = false } = {}) => (
            <Group>
                <Path data="M -20 0 L -10 0" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M -10 -10 L -10 10 L 5 0 Z" fill={isLit ? "#ffee00" : "#2c3e50"} stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 5 -10 L 5 10" stroke="#2c3e50" strokeWidth={3} />
                <Path data="M 5 0 L 20 0" stroke="#2c3e50" strokeWidth={2} />
                {isLit && (
                    <Group>
                        <Path data="M 8 -14 L 14 -20" stroke="#ffee00" strokeWidth={2} />
                        <Path data="M 2 -14 L -4 -20" stroke="#ffee00" strokeWidth={2} />
                    </Group>
                )}
            </Group>
        ),
    },
    '555_timer': {
        type: '555_timer',
        pins: [
            { id: 'gnd', x: 0, y: 2 },
            { id: 'trigger', x: -1.5, y: 1 },
            { id: 'output', x: 1.5, y: 1 },
            { id: 'reset', x: 1.5, y: 0 },
            { id: 'vcc', x: 0, y: -2 },
            { id: 'discharge', x: -1.5, y: -1 },
            { id: 'threshold', x: -1.5, y: 0 },
            { id: 'control', x: 1.5, y: -1 }
        ],
        renderVisuals: () => (
            <Group>
                <Rect x={-30} y={-40} width={60} height={80} fill="#f0f0e0" stroke="#2c3e50" strokeWidth={2} cornerRadius={4} />
                <Text text="555" x={-16} y={-6} fontSize={16} fontStyle="bold" fill="#2c3e50" />

                {/* Visual stub pins and labels */}
                {/* Left Side */}
                <Path data="M -30 20 L -40 20" stroke="#2c3e50" strokeWidth={2} />
                <Text text="TRG" x={-26} y={16} fontSize={8} fill="#555" />

                <Path data="M -30 0 L -40 0" stroke="#2c3e50" strokeWidth={2} />
                <Text text="THR" x={-26} y={-4} fontSize={8} fill="#555" />

                <Path data="M -30 -20 L -40 -20" stroke="#2c3e50" strokeWidth={2} />
                <Text text="DIS" x={-26} y={-24} fontSize={8} fill="#555" />

                {/* Right Side */}
                <Path data="M 30 20 L 40 20" stroke="#2c3e50" strokeWidth={2} />
                <Text text="OUT" x={12} y={16} fontSize={8} fill="#555" />

                <Path data="M 30 0 L 40 0" stroke="#2c3e50" strokeWidth={2} />
                <Text text="RST" x={12} y={-4} fontSize={8} fill="#555" />

                <Path data="M 30 -20 L 40 -20" stroke="#2c3e50" strokeWidth={2} />
                <Text text="CTL" x={12} y={-24} fontSize={8} fill="#555" />

                {/* Top / Bottom */}
                <Path data="M 0 -40 L 0 -50" stroke="#2c3e50" strokeWidth={2} />
                <Text text="VCC" x={-10} y={-36} fontSize={8} fill="#555" />

                <Path data="M 0 40 L 0 50" stroke="#2c3e50" strokeWidth={2} />
                <Text text="GND" x={-10} y={30} fontSize={8} fill="#555" />
            </Group>
        ),
    },
    '7805_regulator': {
        type: '7805_regulator',
        pins: [
            { id: 'input', x: -1, y: 0 },
            { id: 'gnd', x: 0, y: 1 },
            { id: 'output', x: 1, y: 0 }
        ],
        renderVisuals: () => (
            <Group>
                <Rect x={-15} y={-25} width={30} height={40} fill="#888" stroke="#333" strokeWidth={2} />
                <Rect x={-12} y={-20} width={24} height={30} fill="#111" stroke="#333" strokeWidth={1} />
                <Text text="7805" x={-12} y={2} fontSize={9} fill="white" fontStyle="bold" />
                <Path data="M -10 10 L -10 25" stroke="#bcbcbc" strokeWidth={3} />
                <Path data="M 0 10 L 0 25" stroke="#bcbcbc" strokeWidth={3} />
                <Path data="M 10 10 L 10 25" stroke="#bcbcbc" strokeWidth={3} />
                {/* Structural map lines to schematic pins */}
                <Path data="M -20 0 L -15 0" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 0 20 L 0 25" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 15 0 L 20 0" stroke="#2c3e50" strokeWidth={2} />
            </Group>
        ),
    },
    'lm317_regulator': {
        type: 'lm317_regulator',
        pins: [
            { id: 'input', x: -1, y: 0 },
            { id: 'adj', x: 0, y: 1 },
            { id: 'output', x: 1, y: 0 }
        ],
        renderVisuals: () => (
            <Group>
                <Rect x={-15} y={-25} width={30} height={40} fill="#888" stroke="#333" strokeWidth={2} />
                <Rect x={-12} y={-20} width={24} height={30} fill="#111" stroke="#333" strokeWidth={1} />
                <Text text="LM317" x={-13} y={2} fontSize={7} fill="white" fontStyle="bold" />
                <Path data="M -10 10 L -10 25" stroke="#bcbcbc" strokeWidth={3} />
                <Path data="M 0 10 L 0 25" stroke="#bcbcbc" strokeWidth={3} />
                <Path data="M 10 10 L 10 25" stroke="#bcbcbc" strokeWidth={3} />
                <Text text="IN" x={-14} y={14} fontSize={7} fill="#aaa" />
                <Text text="ADJ" x={-4} y={14} fontSize={7} fill="#aaa" />
                <Text text="OUT" x={6} y={14} fontSize={7} fill="#aaa" />

                <Path data="M -20 0 L -15 0" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 0 20 L 0 25" stroke="#2c3e50" strokeWidth={2} />
                <Path data="M 15 0 L 20 0" stroke="#2c3e50" strokeWidth={2} />
            </Group>
        ),
    },
    'seven_segment': {
        type: 'seven_segment',
        pins: [
            { id: 'seg_a', x: -1, y: -2 },
            { id: 'seg_b', x: 0, y: -2 },
            { id: 'seg_c', x: 1, y: -2 },
            { id: 'seg_d', x: -1, y: 2 },
            { id: 'seg_e', x: 0, y: 2 },
            { id: 'seg_f', x: -1, y: -1 },
            { id: 'seg_g', x: 0, y: -1 },
            { id: 'com', x: 1, y: 2 }
        ],
        renderVisuals: () => (
            <Group>
                <Rect x={-30} y={-50} width={60} height={80} fill="#111" cornerRadius={4} />
                <Text text="7SEG" x={-16} y={-5} fill="#ff0000" fontSize={12} />
            </Group>
        ),
    },
    'push_button_wokwi': {
        type: 'push_button_wokwi',
        pins: [
            { id: 'pin1', x: -1, y: 0 },
            { id: 'pin2', x: 1, y: 0 }
        ],
        renderVisuals: () => (
            <Group>
                <Rect x={-20} y={-20} width={40} height={40} fill="#ddd" stroke="#333" strokeWidth={2} />
                <Text text="BTN" x={-10} y={-5} fontSize={10} fill="#333" />
            </Group>
        ),
    },
    'servo_wokwi': {
        type: 'servo_wokwi',
        pins: [
            { id: 'vcc', x: 0, y: -1 },
            { id: 'gnd', x: 0, y: 1 },
            { id: 'signal', x: -1, y: 0 }
        ],
        renderVisuals: () => (
            <Group>
                <Rect x={-25} y={-30} width={50} height={40} fill="#cc8800" stroke="#333" strokeWidth={2} />
                <Text text="SERVO" x={-18} y={-5} fontSize={10} fill="white" />
            </Group>
        ),
    },
    'lcd1602': {
        type: 'lcd1602',
        pins: [
            { id: 'vss', x: 0, y: 3 },
            { id: 'vdd', x: 0.5, y: 3 },
            { id: 'vo', x: 1, y: 3 },
            { id: 'rs', x: -2, y: 0 },
            { id: 'rw', x: -2, y: 0.5 },
            { id: 'e', x: -2, y: 1 },
            { id: 'd4', x: -2, y: 1.5 },
            { id: 'd5', x: -2, y: 2 },
            { id: 'd6', x: -2, y: 2.5 },
            { id: 'd7', x: -2, y: 3 },
            { id: 'a', x: 2, y: 0 },
            { id: 'k', x: 2, y: 0.5 }
        ],
        renderVisuals: () => (
            <Group>
                <Rect x={-60} y={-20} width={120} height={50} fill="#4488ff" cornerRadius={3} />
                <Rect x={-55} y={-15} width={110} height={35} fill="#88aaff" cornerRadius={2} />
                <Text text="LCD 1602" x={-30} y={-5} fontSize={12} fill="white" fontStyle="bold" />
            </Group>
        ),
    },
    'neopixel': {
        type: 'neopixel',
        pins: [
            { id: 'din', x: -1, y: 0 },
            { id: 'dout', x: 1, y: 0 },
            { id: 'vcc', x: 0, y: -1 },
            { id: 'gnd', x: 0, y: 1 }
        ],
        renderVisuals: (comp) => (
            <Group>
                <Circle x={0} y={0} radius={18} stroke="#333" strokeWidth={1} fill="none" />
                <Circle x={0} y={0} radius={15} fill={comp?.color || '#333'} />
                <Text text="WS" x={-6} y={-4} fontSize={8} fill="#fff" fontStyle="bold" />
            </Group>
        ),
    },
    'hc_sr04': {
        type: 'hc_sr04',
        pins: [
            { id: 'vcc', x: 0, y: -1 },
            { id: 'trig', x: -1, y: 0 },
            { id: 'echo', x: 1, y: 0 },
            { id: 'gnd', x: 0, y: 1 }
        ],
        renderVisuals: () => (
            <Group>
                <Rect x={-30} y={-20} width={60} height={40} fill="#1a1a2e" stroke="#0f3460" strokeWidth={2} cornerRadius={3} />
                <Circle x={-12} y={0} radius={10} fill="#c0c0c0" stroke="#888" strokeWidth={1} />
                <Circle x={12} y={0} radius={10} fill="#c0c0c0" stroke="#888" strokeWidth={1} />
                <Text text="HC-SR04" x={-22} y={10} fontSize={9} fill="#aaa" fontStyle="bold" />
            </Group>
        ),
    },
    'dht22': {
        type: 'dht22',
        pins: [
            { id: 'vcc', x: 0, y: -1 },
            { id: 'data', x: -1, y: 0 },
            { id: 'gnd', x: 0, y: 1 }
        ],
        renderVisuals: () => (
            <Group>
                <Rect x={-15} y={-25} width={40} height={50} fill="#0d5bc6" cornerRadius={4} />
                <Rect x={-10} y={-20} width={30} height={35} fill="#fff" opacity={0.2} cornerRadius={3} />
                <Text text="DHT22" x={-10} y={-8} fontSize={10} fill="#fff" fontStyle="bold" />
                <Rect x={-8} y={15} width={2} height={10} fill="#aaa" />
                <Rect x={0} y={15} width={2} height={10} fill="#aaa" />
                <Rect x={8} y={15} width={2} height={10} fill="#aaa" />
            </Group>
        ),
    },
    'power_vcc': {
        type: 'power_vcc',
        pins: [{ id: 'vcc', x: 0, y: 1 }],
        renderVisuals: () => (
            <Group>
                <Path data="M 0 0 L 0 20" stroke="#cc0000" strokeWidth={2} />
                <Path data="M -10 -5 L 10 -5" stroke="#cc0000" strokeWidth={3} />
                <Text text="+5V" x={-10} y={-20} fontSize={11} fill="#cc0000" fontStyle="bold" />
            </Group>
        )
    },
    'power_vcc_33': {
        type: 'power_vcc_33',
        pins: [{ id: 'vcc', x: 0, y: 1 }],
        renderVisuals: () => (
            <Group>
                <Path data="M 0 0 L 0 20" stroke="#0066cc" strokeWidth={2} />
                <Path data="M -10 -5 L 10 -5" stroke="#0066cc" strokeWidth={3} />
                <Text text="+3V3" x={-12} y={-20} fontSize={11} fill="#0066cc" fontStyle="bold" />
            </Group>
        )
    },
    'ground_symbol': {
        type: 'ground_symbol',
        pins: [{ id: 'gnd', x: 0, y: -1 }],
        renderVisuals: () => (
            <Group>
                <Path data="M 0 -20 L 0 0" stroke="#333" strokeWidth={2} />
                <Path data="M -10 0 L 10 0" stroke="#333" strokeWidth={2} />
                <Path data="M -7 5 L 7 5" stroke="#333" strokeWidth={2} />
                <Path data="M -4 10 L 4 10" stroke="#333" strokeWidth={2} />
            </Group>
        )
    },
    'voltage_probe': {
        type: 'voltage_probe',
        pins: [{ id: 'probe', x: 0, y: 0 }],
        renderVisuals: (comp, renderProps) => {
            const activeNetlist = useCircuitStore.getState().activeNetlist;
            const simulationState = useCircuitStore.getState().simulationState;
            const probeNode = activeNetlist?.pinToNodeMap[`${renderProps.id}:probe`];
            const v = probeNode !== undefined ? (simulationState?.voltages[probeNode] || 0) : 0;
            return (
                <Group>
                    <Circle x={0} y={0} radius={5} fill="#ff00cc" stroke="white" strokeWidth={2} />
                    <Text text="V" x={-3} y={-4} fontSize={8} fill="white" fontStyle="bold" />
                    <Text text={`${v.toFixed(2)}V`} x={8} y={-5} fill="#ff00cc" fontSize={11} fontStyle="bold" />
                </Group>
            )
        }
    },
    'd_flipflop': {
        type: 'd_flipflop',
        pins: [
            { id: 'd', x: -1.5, y: -0.5 },
            { id: 'clk', x: -1.5, y: 0.5 },
            { id: 'q', x: 1.5, y: -0.5 },
            { id: 'q_bar', x: 1.5, y: 0.5 },
            { id: 'preset', x: 0, y: -1.5 },
            { id: 'clear', x: 0, y: 1.5 }
        ],
        renderVisuals: () => (
            <Group>
                <Rect x={-30} y={-30} width={60} height={60} fill="#fff8e1" stroke="#2c3e50" strokeWidth={2} />
                <Text text="D" x={-24} y={-10} fontSize={10} fill="#2c3e50" fontStyle="bold" />
                <Text text="CLK" x={-28} y={10} fontSize={9} fill="#2c3e50" />
                <Path data="M -22 5 L -16 8 L -22 11" fill="#2c3e50" />
                <Text text="Q" x={16} y={-10} fontSize={10} fill="#2c3e50" fontStyle="bold" />
                <Text text="Q̄" x={12} y={10} fontSize={10} fill="#2c3e50" />
                <Text text="FF-D" x={-14} y={-5} fontSize={11} fontStyle="bold" fill="#555" />
            </Group>
        ),
    },
    'sr_latch': {
        type: 'sr_latch',
        pins: [
            { id: 's', x: -1, y: -0.5 },
            { id: 'r', x: -1, y: 0.5 },
            { id: 'q', x: 1, y: -0.5 },
            { id: 'q_bar', x: 1, y: 0.5 }
        ],
        renderVisuals: () => (
            <Group>
                <Rect x={-20} y={-20} width={40} height={40} fill="#fff8e1" stroke="#2c3e50" strokeWidth={2} />
                <Text text="S" x={-14} y={-8} fontSize={11} fill="#2c3e50" fontStyle="bold" />
                <Text text="R" x={-14} y={5} fontSize={11} fill="#2c3e50" fontStyle="bold" />
                <Text text="Q" x={6} y={-8} fontSize={11} fill="#2c3e50" fontStyle="bold" />
                <Text text="Q̄" x={3} y={5} fontSize={11} fill="#2c3e50" />
                <Text text="SR" x={-6} y={-2} fontSize={10} fill="#666" />
            </Group>
        ),
    },
    'buzzer': {
        type: 'buzzer',
        pins: [
            { id: 'pos', x: -1, y: 0 },
            { id: 'neg', x: 1, y: 0 }
        ],
        renderVisuals: (comp, renderProps) => {
            const isActive = renderProps?.isActive || false;
            const arcColor = isActive ? '#00ff88' : '#2c3e50';
            const arcWidth = isActive ? 2.5 : 1.5;
            return (
                <Group>
                    <Path data="M -20 0 L -15 0" stroke="#666" strokeWidth={2} />
                    <Path data="M 15 0 L 20 0" stroke="#666" strokeWidth={2} />
                    <Circle x={0} y={0} radius={15} fill="#333" stroke="#666" strokeWidth={2} />
                    <Circle x={0} y={0} radius={8} fill="#555" stroke="#888" strokeWidth={1} />
                    <Text text="♪" x={-5} y={-6} fontSize={14} fill="#aaa" />
                    <Path data="M 20 -8 C 25 -4 25 4 20 8" stroke={arcColor} strokeWidth={arcWidth} fill="" />
                    <Path data="M 24 -12 C 31 -6 31 6 24 12" stroke={arcColor} strokeWidth={arcWidth} fill="" />
                </Group>
            );
        },
    },
    'dc_motor': {
        type: 'dc_motor',
        pins: [
            { id: 'pos', x: -1, y: 0 },
            { id: 'neg', x: 1, y: 0 }
        ],
        renderVisuals: (comp, renderProps) => {
            const rpm = renderProps?.rpm || 0;
            return (
                <Group>
                    <Circle x={0} y={0} radius={20} fill="#cc8800" stroke="#8b6914" strokeWidth={3} />
                    <Rect x={-5} y={-25} width={10} height={10} fill="#666" stroke="#444" />
                    <Rect x={-5} y={15} width={10} height={10} fill="#666" stroke="#444" />
                    <Text text="M" x={-6} y={-6} fontSize={18} fill="white" fontStyle="bold" />
                    <Path data="M -10 -18 A 20 20 0 0 1 10 -18" stroke="#fff" strokeWidth={2} fill="" />
                    <Path data="M 8 -21 L 10 -18 L 13 -20" stroke="#fff" strokeWidth={1.5} fill="" />
                    <Text text={`${rpm} RPM`} x={-20} y={28} fill="#00ffcc" fontSize={11} fontStyle="bold" />
                </Group>
            );
        },
    }
};


/**
 * Smart formatter for electrical property magnitude labels natively matching structural logic correctly
 */
export const formatValue = (type, comp) => {
    if (!comp) return '';
    const { value, frequency } = comp;

    if (type === 'resistor' || type === 'potentiometer') return `${value}Ω`;
    if (type === 'capacitor') {
        if (value < 0.000001) return `${(value * 1e9).toFixed(1)}nF`;
        if (value < 0.001) return `${(value * 1e6).toFixed(1)}µF`;
        return `${(value * 1e3).toFixed(1)}mF`;
    }
    if (type === 'inductor') {
        if (value < 0.001) return `${(value * 1e6).toFixed(1)}µH`;
        if (value < 1) return `${(value * 1e3).toFixed(1)}mH`;
        return `${value}H`;
    }
    if (type === 'dcSource' || type === 'voltageSource') return `${value}V`;
    if (type === 'functionGenerator') {
        if (frequency >= 1e6) return `${(frequency / 1e6).toFixed(1)}MHz`;
        if (frequency >= 1e3) return `${(frequency / 1e3).toFixed(1)}kHz`;
        return `${frequency || 1000}Hz`;
    }
    return '';
};

/**
 * Generic Rendering Wrapper for Circuit components.
 * Consumes the ComponentRegistry definition to map an abstract instance into Konva context.
 */
export const CircuitComponent = ({ id, type, value, gridX, gridY, rotation = 0, flip = 1 }) => {
    const schema = ComponentRegistry[type];
    const compData = useCircuitStore(s => s.components[id]);
    const simulationState = useCircuitStore(s => s.simulationState);
    const activeNetlist = useCircuitStore(s => s.activeNetlist);
    const isSelected = useCircuitStore(s => s.selectedComponentIds.includes(id));

    if (!schema) {
        console.warn(`Unknown component type: ${type}`);
        return null;
    }

    // Compute LED lit state reactively
    let renderProps = {};
    if (type.startsWith('led') && activeNetlist && simulationState?.voltages) {
        const anodePin = `${id}:anode`;
        const cathodePin = `${id}:cathode`;
        const anodeNode = activeNetlist.pinToNodeMap[anodePin];
        const cathodeNode = activeNetlist.pinToNodeMap[cathodePin];
        if (anodeNode !== undefined && cathodeNode !== undefined) {
            const va = simulationState.voltages[anodeNode] || 0;
            const vc = simulationState.voltages[cathodeNode] || 0;
            renderProps.isLit = (va - vc) > 0.6;
        }
    }

    // Switch States
    if (type === 'spst_switch') {
        renderProps.isOpen = compData?.isOpen !== false;
    }
    if (type === 'push_button') {
        renderProps.isPressed = compData?.isPressed === true;
    }

    // Buzzer active state
    if (type === 'buzzer' && activeNetlist && simulationState?.voltages) {
        const posPin = `${id}:pos`;
        const negPin = `${id}:neg`;
        const posNode = activeNetlist.pinToNodeMap[posPin];
        const negNode = activeNetlist.pinToNodeMap[negPin];
        if (posNode !== undefined && negNode !== undefined) {
            const vp = simulationState.voltages[posNode] || 0;
            const vn = simulationState.voltages[negNode] || 0;
            const current = Math.abs(vp - vn) / 8.0;
            renderProps.isActive = current > 0.01;
        }
    }

    // DC Motor RPM calculation
    if (type === 'dc_motor' && activeNetlist && simulationState?.voltages) {
        const posPin = `${id}:pos`;
        const negPin = `${id}:neg`;
        const posNode = activeNetlist.pinToNodeMap[posPin];
        const negNode = activeNetlist.pinToNodeMap[negPin];
        if (posNode !== undefined && negNode !== undefined) {
            const vp = simulationState.voltages[posNode] || 0;
            const vn = simulationState.voltages[negNode] || 0;
            const vApplied = Math.abs(vp - vn);
            renderProps.rpm = Math.round(vApplied * (compData?.kv || 100));
        }
        renderProps.id = id;
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
            onMouseDown={(e) => {
                if (type === 'push_button') {
                    useCircuitStore.getState().updateComponentProp(id, 'isPressed', true);
                }
            }}
            onMouseUp={(e) => {
                if (type === 'push_button') {
                    useCircuitStore.getState().updateComponentProp(id, 'isPressed', false);
                }
            }}
            onMouseLeave={(e) => {
                if (type === 'push_button') {
                    useCircuitStore.getState().updateComponentProp(id, 'isPressed', false);
                }
            }}
            onDragStart={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'grab';
            }}
            onDragEnd={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';

                // Extract Konva group pixel constraints natively calculating bounds accurately mapping physics naturally cleanly identically properly cleanly identically mapping coordinates dynamically seamlessly elegantly mathematically precisely efficiently matching logic safely correctly
                const newX = pixelToGrid(e.target.x());
                const newY = pixelToGrid(e.target.y());
                useCircuitStore.getState().updateComponentPosition(id, newX, newY);
            }}
        >
            {/* 0. Selection Visualizer Highlights */}
            {isSelected && (
                <Rect
                    x={-30}
                    y={-30}
                    width={60}
                    height={60}
                    fill="rgba(50, 150, 255, 0.15)"
                    cornerRadius={5}
                />
            )}

            {/* 1. Component Shape Constraints */}
            {schema.renderVisuals(renderProps)}

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
            {(compData?.value !== undefined || type === 'functionGenerator') && (
                <Text
                    x={-20}
                    y={22}
                    text={formatValue(type, compData)}
                    fill="#333"
                    fontSize={13}
                    fontFamily="monospace"
                    fontStyle="bold"
                    listening={false}
                />
            )}
        </Group>
    );
};

export default CircuitComponent;
