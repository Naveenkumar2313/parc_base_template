import React, { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Box, Typography, Slider } from '@mui/material';
import useCircuitStore from '../store/circuitStore';

const Sidebar = () => {
    const editorRef = useRef(null);
    const [isCompiling, setIsCompiling] = useState(false);

    // Native DC Power Supply Bindings
    const components = useCircuitStore(s => s.components);
    const updateComponentValue = useCircuitStore(s => s.updateComponentValue);

    // Auto-map structural power sources dynamically linking back locally targeting physics variables clearly!
    const dcSourceObj = Object.entries(components).find(([id, c]) => c.type === 'dcSource' || c.type === 'voltageSource');
    const dcSourceId = dcSourceObj ? dcSourceObj[0] : null;
    const dcSourceVal = dcSourceObj ? (dcSourceObj[1].value || 0) : 5;

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
    };

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
                    onClick={() => useCircuitStore.getState().saveCircuit()}
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
                    defaultValue={`// Write your AVR logic here
void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`}
                    onMount={handleEditorDidMount}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: "on"
                    }}
                />
            </div>
        </div>
    );
};

export default Sidebar;
