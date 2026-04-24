import React, { useEffect, useRef } from 'react';
import { Box, Typography, Button } from '@mui/material';
import useCircuitStore from '../store/circuitStore';

const SerialMonitor = () => {
    const serialBuffer = useCircuitStore(s => s.serialBuffer);
    const clearSerialBuffer = useCircuitStore(s => s.clearSerialBuffer);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [serialBuffer]);

    return (
        <div style={{
            width: '100%',
            height: '200px',
            backgroundColor: '#1e1e1e',
            borderTop: '1px solid #333',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{
                padding: '8px 15px',
                backgroundColor: '#252526',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #333'
            }}>
                <Typography variant="subtitle2" style={{ fontFamily: 'Segoe UI, sans-serif', color: '#ff9900', fontWeight: 'bold' }}>
                    Serial Monitor (9600 Baud)
                </Typography>
                <Button
                    size="small"
                    variant="outlined"
                    onClick={clearSerialBuffer}
                    style={{ color: '#aaa', borderColor: '#444' }}
                >
                    Clear Output
                </Button>
            </div>

            <Box
                ref={scrollRef}
                style={{
                    flex: 1,
                    padding: '10px',
                    overflowY: 'auto',
                    color: '#00ffcc',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap'
                }}
            >
                {serialBuffer || <span style={{ color: '#555' }}> Waiting for UART Data...</span>}
            </Box>
        </div>
    );
};

export default SerialMonitor;
