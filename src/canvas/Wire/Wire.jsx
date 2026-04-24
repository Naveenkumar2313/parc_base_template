import React, { useMemo } from 'react';
import { Line, Group, Circle } from 'react-konva';
import { gridToPixel } from '../utils';

import useCircuitStore from '../../store/circuitStore';

// Retrieve generic component block zones
const getBlockedNodes = (components, start, end) => {
    const blocked = new Set();
    Object.values(components).forEach(c => {
        // Block the direct center anchor of standard simple components
        blocked.add(`${c.x},${c.y}`);

        // Large components bounding masks
        if (c.type === 'arduino_uno') {
            for (let i = -1; i <= 1; i++) for (let j = -2; j <= 2; j++) blocked.add(`${c.x + i},${c.y + j}`);
        } else if (c.type === 'opamp' || c.type === 'and_gate') {
            for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) blocked.add(`${c.x + i},${c.y + j}`);
        } else if (c.type.startsWith('bjt') || c.type.startsWith('mosfet')) {
            blocked.add(`${c.x},${c.y - 1}`);
            blocked.add(`${c.x},${c.y + 1}`);
        }
    });

    // Terminals must always be traversable or the math instantly terminates!
    blocked.delete(`${start.x},${start.y}`);
    blocked.delete(`${end.x},${end.y}`);
    return blocked;
};

// Core intelligent routing algorithm ensuring orthogonal collision avoidance
export const getManhattanPoints = (start, end) => {
    // If we're dragging a temporary wire in exact empty space, bypass heavy constraints
    const state = useCircuitStore.getState();
    const components = state ? state.components : {};

    const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    const blocked = getBlockedNodes(components, start, end);

    // Optimization limit window (+/- 20 grid units roughly)
    const padding = 20;
    const minX = Math.min(start.x, end.x) - padding;
    const maxX = Math.max(start.x, end.x) + padding;
    const minY = Math.min(start.y, end.y) - padding;
    const maxY = Math.max(start.y, end.y) + padding;

    const openSet = [{ x: start.x, y: start.y, g: 0, f: manhattan(start, end), parent: null, dir: null }];
    const closedSet = new Set();

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();
        const key = `${current.x},${current.y}`;

        if (current.x === end.x && current.y === end.y) {
            const path = [];
            let curr = current;
            while (curr) {
                path.unshift({ x: curr.x, y: curr.y });
                curr = curr.parent;
            }

            // Path simplification (strip out intermediate straight-line collinear steps to just corner vertices mapping Konva lines cleanly)
            const simplified = [path[0]];
            for (let i = 1; i < path.length - 1; i++) {
                const prev = path[i - 1];
                const next = path[i + 1];
                if (prev.x !== next.x && prev.y !== next.y) {
                    simplified.push(path[i]);
                }
            }
            if (path.length > 1) simplified.push(path[path.length - 1]);
            return simplified;
        }

        closedSet.add(key);

        const neighbors = [
            { x: current.x, y: current.y - 1, dir: 'N' },
            { x: current.x, y: current.y + 1, dir: 'S' },
            { x: current.x - 1, y: current.y, dir: 'W' },
            { x: current.x + 1, y: current.y, dir: 'E' }
        ];

        for (const n of neighbors) {
            if (n.x < minX || n.x > maxX || n.y < minY || n.y > maxY) continue;

            const nKey = `${n.x},${n.y}`;
            if (closedSet.has(nKey)) continue;
            if (blocked.has(nKey) && (n.x !== end.x || n.y !== end.y)) continue;

            // Weight turns heavily so the trace prefers long straight orthogonal stretches
            let turnPenalty = 0;
            if (current.dir && current.dir !== n.dir) {
                turnPenalty = 1.5;
            }

            const gScore = current.g + 1 + turnPenalty;
            const existing = openSet.find(o => o.x === n.x && o.y === n.y);

            if (!existing || gScore < existing.g) {
                if (existing) {
                    existing.g = gScore;
                    existing.f = gScore + manhattan(n, end);
                    existing.parent = current;
                    existing.dir = n.dir;
                } else {
                    openSet.push({
                        ...n,
                        g: gScore,
                        f: gScore + manhattan(n, end),
                        parent: current
                    });
                }
            }
        }
    }

    // Safety Fallback (Should never hit on an infinite grid)
    return [
        { x: start.x, y: start.y },
        { x: end.x, y: start.y },
        { x: end.x, y: end.y }
    ];
};

export const Wire = ({ start, end, isTemporary = false, isSelected = false, onClick }) => {
    const pointsData = useMemo(() => {
        const pts = getManhattanPoints(start, end);
        // Unroll structure specifically for Konva mapping array [x1, y1, x2, y2, x3, y3]
        return pts.reduce((acc, pt) => {
            acc.push(gridToPixel(pt.x), gridToPixel(pt.y));
            return acc;
        }, []);
    }, [start, end]);

    return (
        <Line
            points={pointsData}
            stroke={isSelected ? '#ff0000' : (isTemporary ? '#8ab4f8' : '#2c3e50')} // Red for selected, Google-blue for drag-state tracking
            strokeWidth={isSelected ? 4 : (isTemporary ? 2 : 2.5)}
            dash={isTemporary ? [6, 4] : undefined}
            lineCap="round"
            lineJoin="round"
            hitStrokeWidth={15} // Extra margin tracking for wire selections / ray casts
            listening={!isTemporary}
            onClick={onClick}
        />
    );
};

export const JunctionDots = ({ wires }) => {
    const dots = useMemo(() => {
        // We map every orthogonal unit grid interval passed through by traces.
        // If a coordinate registers >1 distinct structural wire, it is marked as a junction intersection.
        const coordinateMap = {};

        wires.forEach((wire, wireId) => {
            const corners = getManhattanPoints(wire.start, wire.end);
            for (let i = 0; i < corners.length - 1; i++) {
                const p1 = corners[i];
                const p2 = corners[i + 1];

                const dx = Math.sign(p2.x - p1.x);
                const dy = Math.sign(p2.y - p1.y);
                if (dx === 0 && dy === 0) continue;

                let cx = p1.x;
                let cy = p1.y;

                while (true) {
                    const key = `${cx},${cy}`;
                    if (!coordinateMap[key]) coordinateMap[key] = new Set();
                    coordinateMap[key].add(wireId);

                    if (cx === p2.x && cy === p2.y) break;
                    cx += dx;
                    cy += dy;
                }
            }
        });

        const junctionNodes = [];
        for (const [key, idSet] of Object.entries(coordinateMap)) {
            if (idSet.size > 1) { // Multiple specific lines touch this spatial voxel
                const [x, y] = key.split(',').map(Number);
                junctionNodes.push({ x, y });
            }
        }

        return junctionNodes;
    }, [wires]);

    return (
        <Group>
            {dots.map((dot, i) => (
                <Circle
                    key={i}
                    x={gridToPixel(dot.x)}
                    y={gridToPixel(dot.y)}
                    radius={gridToPixel(0.25)}
                    fill="#2c3e50"
                />
            ))}
        </Group>
    );
};

export default Wire;
