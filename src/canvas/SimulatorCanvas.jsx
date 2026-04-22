import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Group, Circle, Text } from 'react-konva';
import { Grid } from './Grid';
import { snapToGrid, pointToGrid } from './utils';
import useCircuitStore from '../store/circuitStore';
import CircuitComponent from '../core/components/ComponentRegistry';
import { Wire, JunctionDots } from './Wire/Wire';

const SimulatorCanvas = () => {
    const stageRef = useRef(null);
    const containerRef = useRef(null);

    // Connect logic map
    const components = useCircuitStore(s => s.components);
    const wires = useCircuitStore(s => s.wires);
    const temporaryWire = useCircuitStore(s => s.temporaryWire);

    // Tools State
    const oscilloscopeProbe = useCircuitStore(s => s.oscilloscopeProbe);

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
        } else if (e.evt.button === 2) {
            // Right-click natively cleanly safely cancels drawing bounds explicitly
            useCircuitStore.getState().clearTemporaryWire();
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
        } else if (useCircuitStore.getState().temporaryWire) {
            const stage = stageRef.current;
            if (!stage) return;
            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            // Re-map literal canvas mouse position straight back into native physics Unit variables
            const relativePoint = {
                x: (pointer.x - stage.x()) / stage.scaleX(),
                y: (pointer.y - stage.y()) / stage.scaleY()
            };
            const gridTarget = pointToGrid(relativePoint);

            // Constantly render trace locally hitting accurate variables explicitly
            useCircuitStore.getState().setTemporaryWire({
                ...useCircuitStore.getState().temporaryWire,
                current: gridTarget
            });
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
                onContextMenu={(e) => e.evt.preventDefault()}
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
                    <JunctionDots wires={wires} />
                    {wires.map((wire, idx) => (
                        <Wire key={idx} start={wire.start} end={wire.end} isTemporary={false} />
                    ))}
                    {temporaryWire && (
                        <Wire
                            start={temporaryWire.start}
                            end={temporaryWire.current}
                            isTemporary={true}
                        />
                    )}
                </Layer>

                <Layer id="component-layer">
                    {/* Main component rendering logic goes here */}
                    {Object.entries(components).map(([id, comp]) => (
                        <CircuitComponent
                            key={id}
                            id={id}
                            type={comp.type}
                            value={comp.value}
                            gridX={comp.x}
                            gridY={comp.y}
                            rotation={0}
                        />
                    ))}
                </Layer>

                <Layer id="selection-layer">
                    {/* Visual Interface Logic Overlay mappings */}
                    <Group
                        x={gridToPixel(oscilloscopeProbe.x)}
                        y={gridToPixel(oscilloscopeProbe.y)}
                        draggable
                        onMouseEnter={(e) => {
                            const container = e.target.getStage()?.container();
                            if (container) container.style.cursor = 'grab';
                        }}
                        onDragStart={(e) => {
                            const container = e.target.getStage()?.container();
                            if (container) container.style.cursor = 'grabbing';
                        }}
                        onDragEnd={(e) => {
                            const container = e.target.getStage()?.container();
                            if (container) container.style.cursor = 'default';

                            const stage = e.target.getStage();
                            const pointer = stage.getPointerPosition();
                            const relativePoint = {
                                x: (pointer.x - stage.x()) / stage.scaleX(),
                                y: (pointer.y - stage.y()) / stage.scaleY()
                            };

                            // Snap rendering immediately specifically
                            const gridTarget = pointToGrid(relativePoint);
                            useCircuitStore.getState().setOscilloscopeProbe(gridTarget);

                            // Dynamically hunt and map logic variables querying strictly structural spatial relationships!
                            const state = useCircuitStore.getState();
                            const netlist = state.activeNetlist;

                            if (netlist && netlist.pinToNodeMap) {
                                import('../core/components/ComponentRegistry').then(({ ComponentRegistry }) => {
                                    let foundMatch = false;
                                    for (const [compId, comp] of Object.entries(state.components)) {
                                        const schema = ComponentRegistry[comp.type];
                                        if (schema && schema.pins) {
                                            schema.pins.forEach(pin => {
                                                if ((comp.x + pin.x) === gridTarget.x && (comp.y + pin.y) === gridTarget.y) {
                                                    const pinStr = `${compId}:${pin.id}`;
                                                    const mappedNode = netlist.pinToNodeMap[pinStr];

                                                    useCircuitStore.getState().setProbeNodeId(mappedNode);
                                                    console.log(`Probe Locked! Tracking physical node: ${mappedNode} at ${gridTarget.x},${gridTarget.y}`);
                                                    foundMatch = true;
                                                }
                                            });
                                        }
                                    }
                                    // If the user drops the probe in blank space, decouple equations immediately.
                                    if (!foundMatch) useCircuitStore.getState().setProbeNodeId(null);
                                });
                            }
                        }}
                    >
                        <Circle radius={10} fill="#00ff33" stroke="#fff" strokeWidth={2} />
                        <Text y={15} x={0} text="CH1" fill="#00ff33" fontSize={14} fontStyle="bold" align="center" offsetX={15} />
                    </Group>
                </Layer>
            </Stage>
        </div>
    );
};

export default SimulatorCanvas;
