import React from 'react';
import useCircuitStore from '../store/circuitStore';
import { Box, Typography, TextField, Divider } from '@mui/material';

const PropertiesPanel = () => {
    const { components, selectedComponentId, updateComponentValue } = useCircuitStore();

    if (!selectedComponentId || !components[selectedComponentId]) {
        return (
            <Box p={3} sx={{ backgroundColor: '#1e1e20', height: '100%', color: 'grey.500', fontFamily: 'Inter, sans-serif' }}>
                <Typography variant="body2" sx={{ textAlign: 'center', mt: 4 }}>Select a circuit component to edit its analytical properties.</Typography>
            </Box>
        );
    }

    const component = components[selectedComponentId];

    return (
        <Box p={3} sx={{ backgroundColor: '#1e1e20', height: '100%', color: '#fff', borderLeft: '1px solid #333' }}>
            <Typography variant="h6" sx={{ pb: 1, mb: 2, fontWeight: 600 }}>Properties Panel</Typography>

            <Box sx={{ backgroundColor: '#2a2a2d', p: 2, borderRadius: 2, mb: 3 }}>
                <Typography variant="body2" sx={{ color: 'grey.400', display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <span>Type:</span>
                    <span style={{ color: '#fff' }}>{component.type.toUpperCase()}</span>
                </Typography>
                <Typography variant="body2" sx={{ color: 'grey.400', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Identifier:</span>
                    <span style={{ color: '#fff', fontFamily: 'monospace' }}>{selectedComponentId}</span>
                </Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ color: '#90caf9', mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>Attributes</Typography>

            {component.type === 'resistor' && (
                <TextField
                    label="Resistance (Ω)"
                    type="number"
                    value={component.value || 1000}
                    onChange={(e) => updateComponentValue(selectedComponentId, Number(e.target.value))}
                    variant="filled"
                    fullWidth
                    InputLabelProps={{ style: { color: '#aaa' } }}
                    inputProps={{ style: { color: '#fff', fontSize: '1.1rem' } }}
                    sx={{
                        backgroundColor: '#111',
                        borderRadius: 1,
                        '& .MuiFilledInput-root': {
                            '&:before': { borderBottomColor: '#555' },
                            '&:hover:not(.Mui-disabled):before': { borderBottomColor: '#90caf9' },
                        }
                    }}
                />
            )}

            {component.type === 'dcSource' && (
                <TextField
                    label="Voltage Amplitude (V)"
                    type="number"
                    value={component.value || 5}
                    onChange={(e) => updateComponentValue(selectedComponentId, Number(e.target.value))}
                    variant="filled"
                    fullWidth
                    InputLabelProps={{ style: { color: '#aaa' } }}
                    inputProps={{ style: { color: '#fff', fontSize: '1.1rem' } }}
                    sx={{
                        backgroundColor: '#111',
                        borderRadius: 1,
                        '& .MuiFilledInput-root': {
                            '&:before': { borderBottomColor: '#555' },
                            '&:hover:not(.Mui-disabled):before': { borderBottomColor: '#90caf9' },
                        }
                    }}
                />
            )}
        </Box>
    );
};

export default PropertiesPanel;
