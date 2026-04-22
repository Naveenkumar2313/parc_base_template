import React, { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Box, Button, Typography } from '@mui/material';
import useCircuitStore, { simWorker } from '../store/circuitStore';

const CodeEditor = () => {
    const editorRef = useRef(null);
    const [isCompiling, setIsCompiling] = useState(false);
    const firmwareCode = useCircuitStore(s => s.firmwareCode);
    const setFirmwareCode = useCircuitStore(s => s.setFirmwareCode);

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
    };

    const executeCompileAndRun = async () => {
        if (!editorRef.current) return;
        const rawCppCode = editorRef.current.getValue();
        setIsCompiling(true);

        try {
            const response = await fetch('http://localhost:8000/api/compile/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: rawCppCode })
            });
            const payload = await response.json();

            if (payload.hex) {
                console.log(`Compilation Successful! Hex size: ${payload.hex.length} bytes`);
                // Send LOAD_FIRMWARE and START messages to the existing simWorker safely mapping natively
                simWorker.postMessage({ type: 'LOAD_FIRMWARE', payload: payload.hex });
                simWorker.postMessage({ type: 'START' });
            } else {
                console.error("Compile Error:", payload.error);
                alert(`Error: ${payload.error}`);
            }
        } catch (err) {
            console.error("Backend unreachable", err);
            alert("Failed to hit backend compiler. Check Django server.");
        } finally {
            setIsCompiling(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ px: 2, py: 1, bgcolor: '#252526', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
                <Typography variant="subtitle2" sx={{ color: '#fff', fontFamily: 'Segoe UI, sans-serif', fontWeight: 'bold' }}>
                    C++ IDE Engine
                </Typography>
                <Button
                    variant="contained"
                    size="small"
                    disabled={isCompiling}
                    onClick={executeCompileAndRun}
                    sx={{ textTransform: 'none', fontWeight: 'bold', bgcolor: isCompiling ? '#555' : '#007acc' }}
                >
                    {isCompiling ? 'Compiling...' : '⚡ Compile & Run'}
                </Button>
            </Box>
            <Box sx={{ flex: 1 }}>
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
            </Box>
        </Box>
    );
};

export default CodeEditor;
