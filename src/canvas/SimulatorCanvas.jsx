import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer } from 'react-konva';
import { Grid } from './Grid';
import { snapToGrid } from './utils';
import useCircuitStore from '../store/circuitStore';
import CircuitComponent from '../core/components/ComponentRegistry';

const SimulatorCanvas = () => {
    const stageRef = useRef(null);
    const containerRef = useRef(null);

    // Connect logic map
    const components = useCircuitStore(s => s.components);

    // Viewport tracking for zoom & pan
    const [stageState, setStageState] = useState({ scale: 1, x: 0, y: 0 });
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // Pan state management
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [isPanning, setIsPanning] = useState(false);

    // Resize observer to keep canvas full size
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            setDimensions({
                width: entry.contentRect.width,
                height: entry.contentRect.height
            });
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Track 'Space' key for panning mode
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space' && !e.repeat) setIsSpacePressed(true);
        };
        const handleKeyUp = (e) => {
            if (e.code === 'Space') {
                setIsSpacePressed(false);
                setIsPanning(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const handleWheel = (e) => {
        e.evt.preventDefault();
        const scaleBy = 1.1;
        const stage = stageRef.current;
        if (!stage) return;

        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

        // Bounds for zoom
        if (newScale < 0.1 || newScale > 5) return;

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };

        setStageState({ scale: newScale, x: newPos.x, y: newPos.y });
    };

    const handleMouseDown = (e) => {
        // Start panning if middle button clicked or space is held down
        if (e.evt.button === 1 || isSpacePressed) {
            setIsPanning(true);
        }
    };

    const handleMouseMove = (e) => {
        // Execute panning
        if (isPanning) {
            setStageState((prev) => ({
                ...prev,
                x: prev.x + e.evt.movementX,
                y: prev.y + e.evt.movementY
            }));
        }
    };

    const handleMouseUp = (e) => {
        if (e.evt.button === 1 || (isSpacePressed && isPanning)) {
            setIsPanning(false);
        }
    };

    const getCursor = () => {
        if (isSpacePressed) return isPanning ? 'grabbing' : 'grab';
        return 'default';
    };

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100vh', // Takes full viewport height by default
                userSelect: 'none',
                cursor: getCursor(),
                backgroundColor: '#fafafa', // Light theme canvas
                overflow: 'hidden'
            }}
        >
            <Stage
                ref={stageRef}
                width={dimensions.width}
                height={dimensions.height}
                scaleX={stageState.scale}
                scaleY={stageState.scale}
                x={stageState.x}
                y={stageState.y}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <Layer id="grid-layer">
                    <Grid
                        stageWidth={dimensions.width}
                        stageHeight={dimensions.height}
                        scale={stageState.scale}
                        x={stageState.x}
                        y={stageState.y}
                        gridSize={20}
                    />
                </Layer>

                <Layer id="wire-layer">
                    {/* Wire rendering logic goes here */}
                </Layer>

                <Layer id="component-layer">
                    {/* Main component rendering logic goes here */}
                    {Object.entries(components).map(([id, comp]) => (
                        <CircuitComponent
                            key={id}
                            id={id}
                            type={comp.type}
                            gridX={comp.x}
                            gridY={comp.y}
                            rotation={0}
                        />
                    ))}
                </Layer>

                <Layer id="selection-layer">
                    {/* Highlighting, bounding boxes, and drag previews go here */}
                </Layer>
            </Stage>
        </div>
    );
};

export default SimulatorCanvas;
