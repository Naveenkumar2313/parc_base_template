import React, { useMemo } from 'react';
import { Line, Group, Circle } from 'react-konva';
import { gridToPixel } from '../utils';

// Core algorithm ensuring all traces are locked orthogonally
export const getManhattanPoints = (start, end) => {
    // Trace horizontal first, vertical second
    return [
        { x: start.x, y: start.y },
        { x: end.x, y: start.y },
        { x: end.x, y: end.y }
    ];
};

export const Wire = ({ start, end, isTemporary = false }) => {
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
            stroke={isTemporary ? '#8ab4f8' : '#2c3e50'} // Google-blue for drag-state tracking
            strokeWidth={isTemporary ? 2 : 2.5}
            dash={isTemporary ? [6, 4] : undefined}
            lineCap="round"
            lineJoin="round"
            hitStrokeWidth={15} // Extra margin tracking for wire selections / ray casts
            listening={!isTemporary}
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
