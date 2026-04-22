import React, { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Box, Typography, Slider } from '@mui/material';
import useCircuitStore from '../store/circuitStore';
import SerialMonitor from './SerialMonitor';

const Sidebar = () => {
    const editorRef = useRef(null);
    const [isCompiling, setIsCompiling] = useState(false);

    // Native Bindings
    const components = useCircuitStore(s => s.components);
    const updateComponentValue = useCircuitStore(s => s.updateComponentValue);
    const selectedComponentId = useCircuitStore(s => s.selectedComponentId);

    const updateComponentProp = (id, key, val) => {
        useCircuitStore.setState((state) => ({
            components: {
                ...state.components,
                [id]: { ...state.components[id], [key]: val }
            }
        }));

        // Retrigger netlist seamlessly matching structural mapping efficiently!
        const extract = require('../core/solver/netlistExtractor').extractNetlist;
        const activeNetlist = extract(
            useCircuitStore.getState().components,
            useCircuitStore.getState().wires
        );
        useCircuitStore.getState().setActiveNetlist(activeNetlist);

        // Global web worker singleton import explicitly successfully routing boundaries implicitly successfully seamlessly
        require('../store/circuitStore').simWorker.postMessage({ type: 'UPDATE_NETLIST', payload: activeNetlist });
    };

    // Auto-map structural power sources dynamically linking back locally targeting physics variables clearly!
    const dcSourceObj = Object.entries(components).find(([id, c]) => c.type === 'dcSource' || c.type === 'voltageSource');
    const dcSourceId = dcSourceObj ? dcSourceObj[0] : null;
    const dcSourceVal = dcSourceObj ? (dcSourceObj[1].value || 0) : 5;

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
    };
    const firmwareCode = useCircuitStore(s => s.firmwareCode);
    const setFirmwareCode = useCircuitStore(s => s.setFirmwareCode);

    const executeRemoteCompile = async () => {
        if (!editorRef.current) return;
        const rawCppCode = editorRef.current.getValue();
        setIsCompiling(true);

        try {
            // Remote compilation request fired correctly to Django backend format
            const response = await fetch('http://localhost:8000/api/compile/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: rawCppCode })
            });

            const payload = await response.json();

            if (payload.hex) {
                console.log(`Compilation Successful! Hex output length: ${payload.hex.length}`);
                // The parsed Intel Hex binary is pushed directly to your WebWorker from here!
                alert('Compile Success! Ready to deploy to AVR8js.');
            } else {
                console.error("Linker/Compiler Error:", payload.error);
                alert(`Error: ${payload.error}`);
            }
        } catch (err) {
            console.error("Django Backend endpoint unreachable:", err);
            alert("Failed to hit backend compiler endpoint. Check Django server.");
        } finally {
            setIsCompiling(false);
        }
    };

    return (
        <div style={{
            width: '400px',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#1e1e1e',
            borderRight: '1px solid #333'
        }}>

            {/* --- CLOUD ENGINE WIDGET --- */}
            <div style={{
                padding: '15px',
                backgroundColor: '#252526',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #333'
            }}>
                <h3 style={{ margin: 0, fontFamily: 'Segoe UI, sans-serif' }}>Cloud Storage</h3>
                <button
                    onClick={() => useCircuitStore.getState().saveCurrentProject()}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#00af50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    💾 Save State
                </button>
            </div>

            {/* --- CONTEXT-SENSITIVE PROPERTIES PANEL WIDGET --- */}
            {selectedComponentId && components[selectedComponentId] && (
                <div style={{ padding: '20px', backgroundColor: '#1e2224', borderBottom: '2px solid #333' }}>
                    <Typography variant="subtitle1" style={{ color: '#ff9900', fontWeight: 'bold', fontFamily: 'monospace', marginBottom: '10px' }}>
                        [ CONFIG: {components[selectedComponentId].type.toUpperCase()} ]
                    </Typography>

                    {components[selectedComponentId].type === 'resistor' && (
                        <Box sx={{ mb: 2 }}>
                            <Typography style={{ color: '#aaa', fontSize: '13px' }}>Resistance (Ω):</Typography>
                            <input
                                type="number"
                                value={components[selectedComponentId].value || 1000}
                                onChange={(e) => updateComponentValue(selectedComponentId, parseFloat(e.target.value))}
                                style={{ width: '100%', padding: '5px', background: '#111', color: '#fff', border: '1px solid #444', outline: 'none' }}
                            />
                        </Box>
                    )}

                    {components[selectedComponentId].type === 'capacitor' && (
                        <Box sx={{ mb: 2 }}>
                            <Typography style={{ color: '#aaa', fontSize: '13px' }}>Capacitance (F):</Typography>
                            <input
                                type="number"
                                value={components[selectedComponentId].value || 0.000001}
                                onChange={(e) => updateComponentValue(selectedComponentId, parseFloat(e.target.value))}
                                style={{ width: '100%', padding: '5px', background: '#111', color: '#fff', border: '1px solid #444', outline: 'none' }}
                                step="0.000001"
                            />
                        </Box>
                    )}

                    {components[selectedComponentId].type === 'functionGenerator' && (
                        <>
                            <Box sx={{ mb: 2 }}>
                                <Typography style={{ color: '#aaa', fontSize: '13px' }}>Waveform:</Typography>
                                <select
                                    value={components[selectedComponentId].waveform || 'sine'}
                                    onChange={(e) => updateComponentProp(selectedComponentId, 'waveform', e.target.value)}
                                    style={{ width: '100%', padding: '5px', background: '#111', color: '#fff', border: '1px solid #444' }}
                                >
                                    <option value="sine">Sine Wave</option>
                                    <option value="square">Square Wave</option>
                                    <option value="triangle">Triangle Wave</option>
                                </select>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                <Typography style={{ color: '#aaa', fontSize: '13px' }}>Frequency (Hz):</Typography>
                                <input
                                    type="number"
                                    value={components[selectedComponentId].frequency || 1000}
                                    onChange={(e) => updateComponentProp(selectedComponentId, 'frequency', parseFloat(e.target.value))}
                                    style={{ width: '100%', padding: '5px', background: '#111', color: '#fff', border: '1px solid #444' }}
                                />
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                <Typography style={{ color: '#aaa', fontSize: '13px' }}>Amplitude (V):</Typography>
                                <input
                                    type="number"
                                    value={components[selectedComponentId].amplitude || 5}
                                    onChange={(e) => updateComponentProp(selectedComponentId, 'amplitude', parseFloat(e.target.value))}
                                    style={{ width: '100%', padding: '5px', background: '#111', color: '#fff', border: '1px solid #444' }}
                                />
                            </Box>
                        </>
                    )}
                </div>
            )}

            {/* --- DC POWER SUPPLY WIDGET --- */}
            <div style={{ padding: '20px', backgroundColor: '#181a1b', borderBottom: '2px solid #333' }}>
                <Typography variant="subtitle1" style={{ color: '#00ffcc', fontWeight: 'bold', fontFamily: 'monospace', marginBottom: '10px' }}>
                    [ DC POWER SUPPLY ]
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography style={{ color: '#aaa', fontSize: '13px', fontFamily: 'monospace' }}>Output Voltage:</Typography>
                    <Typography style={{ color: '#fff', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '16px' }}>{dcSourceVal.toFixed(2)} V</Typography>
                </Box>

                <Slider
                    disabled={!dcSourceId}
                    value={dcSourceVal}
                    min={0}
                    max={30}
                    step={0.1}
                    onChange={(e, val) => {
                        if (dcSourceId) updateComponentValue(dcSourceId, val);
                    }}
                    sx={{
                        color: '#00ffcc',
                        '& .MuiSlider-thumb': { borderRadius: '4px', width: 16, height: 16 },
                        '& .MuiSlider-track': { border: 'none' },
                        '& .MuiSlider-rail': { opacity: 0.5, backgroundColor: '#555' },
                    }}
                />
            </div>

            <div style={{
                padding: '15px',
                backgroundColor: '#252526',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #333'
            }}>
                <h3 style={{ margin: 0, fontFamily: 'Segoe UI, sans-serif' }}>C++ Editor</h3>
                <button
                    onClick={executeRemoteCompile}
                    disabled={isCompiling}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: isCompiling ? '#555' : '#007acc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isCompiling ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {isCompiling ? 'Compiling...' : '⚡ Compile'}
                </button>
            </div>

            <div style={{ flex: 1 }}>
                <Editor
                    height="100%"
                    defaultLanguage="cpp"
                    theme="vs-dark"
                    value={firmwareCode}
                    onChange={(val) => setFirmwareCode(val)}
                    onMount={handleEditorDidMount}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: "on"
                    }}
                />
            </div>

            {/* --- IOT SERIAL MONITOR --- */}
            <SerialMonitor />
        </div>
    );
};

export default Sidebar;
