import React, { useMemo } from 'react';
import { Shape } from 'react-konva';

export const Grid = ({ stageWidth, stageHeight, scale = 1, x = 0, y = 0, gridSize = 20 }) => {
    return (
        <Shape
            sceneFunc={(context, shape) => {
                // Calculate the bounds of the visible area
                const startX = -Math.ceil(x / scale / gridSize) * gridSize;
                const startY = -Math.ceil(y / scale / gridSize) * gridSize;
                const endX = startX + stageWidth / scale + gridSize;
                const endY = startY + stageHeight / scale + gridSize;

                context.beginPath();
                // Dot radius scaling to remain visible but not overly huge
                const dotRadius = 1 / scale;

                for (let ix = startX; ix <= endX; ix += gridSize) {
                    for (let iy = startY; iy <= endY; iy += gridSize) {
                        context.moveTo(ix, iy);
                        context.arc(ix, iy, dotRadius, 0, Math.PI * 2, false);
                    }
                }
                context.fillStrokeShape(shape);
            }}
            fill="#a0a0a0"
            stroke="#a0a0a0"
            strokeWidth={0}
            listening={false} // The grid shouldn't capture events
        />
    );
};

export default Grid;
