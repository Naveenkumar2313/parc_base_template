import React, { useEffect, useRef, useState, useImperativeHandle } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

const Oscilloscope = React.forwardRef(({ width = 600, height = 400 }, ref) => {
    const containerRef = useRef(null);
    const plotRef = useRef(null);

    // Oscilloscope Hardware Controls
    const [voltsPerDiv, setVoltsPerDiv] = useState(1.0); // Y-Axis Scale
    const [timePerDiv, setTimePerDiv] = useState(0.001); // X-Axis Scale (default 1ms)
    const [triggerLevel, setTriggerLevel] = useState(2.5); // Level to arm (V)
    const [triggerEdge, setTriggerEdge] = useState('rising'); // Edge phase condition

    // Vertical Cursor Constraints natively mapping physical deltas!
    const cursorA = useRef(0.002);
    const cursorB = useRef(0.008);
    const dragRef = useRef({ active: null });
    const [cursorStats, setCursorStats] = useState({ dt: 0.006, freq: 166.6 });

    // Constants
    const RBUFFER_SIZE = 100_000; // Efficient pre-allocated ring buffer
    const VERTICAL_DIVISIONS = 8; // Screen grid format
    const HORIZONTAL_DIVISIONS = 10;

    // Mutable High-Frequency State (bypassing React renders for speed)
    const scopeState = useRef({
        timeData: new Float32Array(RBUFFER_SIZE),
        voltData: new Float32Array(RBUFFER_SIZE),
        head: 0,

        isSweeping: false,
        triggerTime: 0,
        sweepStartIndex: 0,
        lastVoltage: 0,
    });

    const updateStats = () => {
        const dt = Math.abs(cursorA.current - cursorB.current);
        setCursorStats({
            dt,
            freq: dt > 0 ? 1 / dt : 0
        });
        if (plotRef.current) plotRef.current.redraw();
    };

    // 1. Initialize & Manage the uPlot Instance
    useEffect(() => {
        if (!containerRef.current) return;

        // We center the scope grid around 0V physically
        const yMax = (VERTICAL_DIVISIONS / 2) * voltsPerDiv;
        const yMin = -yMax;

        const opts = {
            width,
            height,
            axes: [
                {
                    stroke: '#c7d0d9',
                    grid: { stroke: '#333b47', width: 1 }
                },
                {
                    stroke: '#c7d0d9',
                    grid: { stroke: '#333b47', width: 1 }
                }
            ],
            scales: {
                x: { time: false }, // Direct float processing instead of unix standard Time
                y: { range: [yMin, yMax] }
            },
            series: [
                {}, // Internal x-axis data reference
                {
                    show: true,
                    label: "CH1",
                    stroke: '#00ff33', // Distinctive Phosphor Green 
                    width: 2,
                    points: { show: false } // Speeds up dense plotting
                }
            ],
            hooks: {
                draw: [
                    u => {
                        const { ctx } = u;
                        const cxA = u.valToPos(cursorA.current, 'x', true);
                        const cxB = u.valToPos(cursorB.current, 'x', true);

                        ctx.save();
                        ctx.lineWidth = 2;

                        if (cxA >= u.bbox.left && cxA <= u.bbox.left + u.bbox.width) {
                            ctx.beginPath();
                            ctx.strokeStyle = "rgba(255, 51, 102, 0.9)";
                            ctx.moveTo(cxA, u.bbox.top);
                            ctx.lineTo(cxA, u.bbox.top + u.bbox.height);
                            ctx.stroke();
                        }

                        if (cxB >= u.bbox.left && cxB <= u.bbox.left + u.bbox.width) {
                            ctx.beginPath();
                            ctx.strokeStyle = "rgba(51, 204, 255, 0.9)";
                            ctx.moveTo(cxB, u.bbox.top);
                            ctx.lineTo(cxB, u.bbox.top + u.bbox.height);
                            ctx.stroke();
                        }
                        ctx.restore();
                    }
                ]
            }
        };

        // Instantiate Plot context inside the attached DOM mount
        const plot = new uPlot(opts, [[], []], containerRef.current);
        plotRef.current = plot;

        return () => plot.destroy();
    }, [width, height, voltsPerDiv]); // Refresh entire plot core if base scale alters

    // 2. High-Frequency Streaming Input Hook Handler
    useImperativeHandle(ref, () => ({
        pushDataBatch: (dataArray) => {
            const state = scopeState.current;
            const plot = plotRef.current;
            if (!plot) return;

            const windowTimeLimit = HORIZONTAL_DIVISIONS * timePerDiv;

            // Iteratively swallow data stream values into physical memory block
            dataArray.forEach(pt => {
                const { time, voltage } = pt;

                // Circular buffer recording insertion
                state.timeData[state.head] = time;
                state.voltData[state.head] = voltage;

                // Software Trigger State Machine: Wait for threshold 
                if (!state.isSweeping) {
                    const isRising = triggerEdge === 'rising' && state.lastVoltage < triggerLevel && voltage >= triggerLevel;
                    const isFalling = triggerEdge === 'falling' && state.lastVoltage > triggerLevel && voltage <= triggerLevel;

                    // Target Hit! Arm scope tracking and lock start params
                    if (isRising || isFalling) {
                        state.isSweeping = true;
                        state.triggerTime = time;
                        state.sweepStartIndex = state.head;
                    }
                }
                else {
                    // Hardware is Sweeping: Evaluate completion
                    const relativeTime = time - state.triggerTime;

                    if (relativeTime >= windowTimeLimit) {
                        // The sweep logic completed precisely on the final needed data element.
                        // Extrude a contiguous vector view sequentially from the ring buffer.
                        const sampleCount = (state.head >= state.sweepStartIndex)
                            ? (state.head - state.sweepStartIndex)
                            : ((RBUFFER_SIZE - state.sweepStartIndex) + state.head);

                        const displayTime = new Float32Array(sampleCount);
                        const displayVolts = new Float32Array(sampleCount);

                        let bufIdx = state.sweepStartIndex;
                        for (let i = 0; i < sampleCount; i++) {
                            // Flatten times accurately starting precisely at 0 offset (left wall of scope)
                            displayTime[i] = state.timeData[bufIdx] - state.triggerTime;
                            displayVolts[i] = state.voltData[bufIdx];
                            bufIdx = (bufIdx + 1) % RBUFFER_SIZE;
                        }

                        // Sync visual UI with strict x bounds identical to grid
                        plot.setData([displayTime, displayVolts]);
                        plot.setScale('x', { min: 0, max: windowTimeLimit });

                        // Release lock and immediately search for next edge
                        state.isSweeping = false;
                    }
                }

                // Advance memory pointers safely
                state.lastVoltage = voltage;
                state.head = (state.head + 1) % RBUFFER_SIZE;
            });
        }
    }));

    // Mouse Hook bindings mapped strictly for interacting with native Cursors dynamically safely cleanly natively
    const handleMouseDown = (e) => {
        const plot = plotRef.current;
        if (!plot) return;

        const over = containerRef.current.querySelector('.u-over');
        if (!over) return;

        const overRect = over.getBoundingClientRect();
        const cssX = e.clientX - overRect.left;
        const clickedTime = plot.posToVal(cssX, 'x');

        const distA = Math.abs(cursorA.current - clickedTime);
        const distB = Math.abs(cursorB.current - clickedTime);

        // Tolerance constraints limit capture correctly 
        const windowTimeLimit = HORIZONTAL_DIVISIONS * timePerDiv;
        const tolerance = windowTimeLimit * 0.1;

        if (Math.min(distA, distB) < tolerance) {
            dragRef.current.active = distA < distB ? 'A' : 'B';
        }
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!dragRef.current.active || !plotRef.current) return;
            const over = containerRef.current.querySelector('.u-over');
            if (!over) return;

            const overRect = over.getBoundingClientRect();
            let cssX = e.clientX - overRect.left;

            // Clamp correctly physically limiting interactions escaping target array sequences correctly mapping dynamically natively smoothly 
            if (cssX < 0) cssX = 0;
            if (cssX > overRect.width) cssX = overRect.width;

            const newTime = plotRef.current.posToVal(cssX, 'x');

            if (dragRef.current.active === 'A') cursorA.current = newTime;
            if (dragRef.current.active === 'B') cursorB.current = newTime;

            updateStats();
        };

        const handleMouseUp = () => {
            dragRef.current.active = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return (
        <div style={{ backgroundColor: '#181a1b', padding: '15px', borderRadius: '4px', width: 'fit-content', color: 'white', fontFamily: 'monospace' }}>
            <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #333', paddingBottom: '5px' }}>DSO-101 Oscilloscope</h3>

            {/* Dynamic Graphing Target natively mapped wrapping internal bounds tracking structurally */}
            <div ref={containerRef} onMouseDown={handleMouseDown} style={{ backgroundColor: '#000', border: '1px solid #333', cursor: 'crosshair' }}></div>

            {/* Front Panel Configurations */}
            <div style={{ display: 'flex', gap: '15px', marginTop: '15px', padding: '10px', backgroundColor: '#212426', borderRadius: '4px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>Voltage (V/Div)</label>
                    <select
                        value={voltsPerDiv}
                        onChange={(e) => setVoltsPerDiv(Number(e.target.value))}
                        style={{ padding: '4px', backgroundColor: '#111', color: '#fff', border: '1px solid #444', borderRadius: '2px' }}
                    >
                        <option value={0.5}>500 mV</option>
                        <option value={1.0}>1 V</option>
                        <option value={2.0}>2 V</option>
                        <option value={5.0}>5 V</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>Time (T/Div)</label>
                    <select
                        value={timePerDiv}
                        onChange={(e) => setTimePerDiv(Number(e.target.value))}
                        style={{ padding: '4px', backgroundColor: '#111', color: '#fff', border: '1px solid #444', borderRadius: '2px' }}
                    >
                        <option value={0.0001}>100 µs</option>
                        <option value={0.001}>1 ms</option>
                        <option value={0.01}>10 ms</option>
                        <option value={0.1}>100 ms</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>Trigger Edge</label>
                    <select
                        value={triggerEdge}
                        onChange={(e) => setTriggerEdge(e.target.value)}
                        style={{ padding: '4px', backgroundColor: '#111', color: '#fff', border: '1px solid #444', borderRadius: '2px' }}
                    >
                        <option value="rising">Rising (↑)</option>
                        <option value="falling">Falling (↓)</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>Trigger Lvl (V)</label>
                    <input
                        type="number"
                        step="0.5"
                        value={triggerLevel}
                        onChange={(e) => setTriggerLevel(Number(e.target.value))}
                        style={{ padding: '4px', width: '55px', backgroundColor: '#111', color: '#fff', border: '1px solid #444', borderRadius: '2px' }}
                    />
                </div>

                {/* Vertical Cursors Module */}
                <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', backgroundColor: '#111', padding: '5px 10px', borderRadius: '4px', border: '1px solid #444', minWidth: '120px' }}>
                    <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px', borderBottom: '1px solid #333', paddingBottom: '2px' }}>MEASUREMENT</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
                        <span style={{ color: '#ff3366', fontWeight: 'bold' }}>Δt:</span> <span>{(cursorStats.dt * 1000).toFixed(3)} ms</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '2px' }}>
                        <span style={{ color: '#33ccff', fontWeight: 'bold' }}>Freq:</span> <span>{cursorStats.freq >= 1000 ? (cursorStats.freq / 1000).toFixed(2) + ' kHz' : cursorStats.freq.toFixed(1) + ' Hz'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default Oscilloscope;
