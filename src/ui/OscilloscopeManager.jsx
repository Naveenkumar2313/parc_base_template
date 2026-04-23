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

                const buffer = state.simulationStateBuffer;
                if (buffer && buffer.length > 0) {
                    const mappedData = buffer.map((simState) => {
                        let voltage = 0;
                        if (nodeId !== null && simState && simState.voltages) {
                            voltage = simState.voltages[nodeId] || 0;
                        }
                        const simTime = simState.time !== undefined ? simState.time : ((time - startTime) / 1000.0);
                        return { time: simTime, voltage };
                    });

                    useCircuitStore.getState().clearSimulationBuffer();
                    scopeRef.current.pushDataBatch(mappedData);
                }
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
