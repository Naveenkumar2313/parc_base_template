import React, { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Box, Typography, Slider } from '@mui/material';
import useCircuitStore from '../store/circuitStore';
import SerialMonitor from './SerialMonitor';

const Sidebar = () => {
    // Native Bindings
    const components = useCircuitStore(s => s.components);
    const updateComponentValue = useCircuitStore(s => s.updateComponentValue);

    // Global DC Power supply (find the first one in the canvas)
    const dcSourceObj = Object.entries(components).find(([id, c]) => c.type === 'dcSource' || c.type === 'voltageSource');
    const dcSourceId = dcSourceObj ? dcSourceObj[0] : null;
    const dcSourceVal = dcSourceObj ? (dcSourceObj[1].value || 0) : 5;



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
                flexDirection: 'column',
                gap: '10px',
                borderBottom: '1px solid #333'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                <button
                    onClick={() => { window.location.href = '/gallery'; }}
                    style={{
                        padding: '8px',
                        backgroundColor: '#007acc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        width: '100%'
                    }}
                >
                    🔍 Explore Community Gallery
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

        </div>
    );
};

export default Sidebar;
