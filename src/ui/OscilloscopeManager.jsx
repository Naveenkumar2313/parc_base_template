import React, { useRef, useEffect } from 'react';
import Oscilloscope from './Oscilloscope';
import useCircuitStore from '../store/circuitStore';

const OscilloscopeManager = () => {
    const scopeRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        let startTime = performance.now();

        const loop = (time) => {
            if (scopeRef.current) {
                const state = useCircuitStore.getState();
                const nodeId = state.probeNodeId;

                // Track real-world seconds mapping cleanly to local bounds calculations
                const t = (time - startTime) / 1000.0;

                let voltage = 0;
                // Specifically extract pure algebra targets dynamically from the active simulation state buffer mappings
                if (nodeId !== null && state.simulationState && state.simulationState.voltages) {
                    voltage = state.simulationState.voltages[nodeId] || 0;
                }

                // Batch the immediate native time variable into the physical renderer securely!
                scopeRef.current.pushDataBatch([{ time: t, voltage }]);
            }
            animationRef.current = requestAnimationFrame(loop);
        };

        animationRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationRef.current);
    }, []);

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', backgroundColor: '#181a1b', borderRadius: '4px' }}>
            <Oscilloscope ref={scopeRef} width={800} height={200} />
        </div>
    );
};

export default OscilloscopeManager;
