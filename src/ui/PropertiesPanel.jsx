import React from 'react';
import useCircuitStore from '../store/circuitStore';
import { Box, Typography, TextField, Divider, Slider, MenuItem, Select } from '@mui/material';

const PropertiesPanel = () => {
    const { components, selectedComponentId, updateComponentValue, updateComponentProp } = useCircuitStore();

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
                <Box sx={{ mt: 2 }}>
                    <Typography gutterBottom sx={{ color: '#aaa' }}>Voltage ({component.value || 5}V)</Typography>
                    <Slider
                        value={component.value || 0}
                        min={0}
                        max={30}
                        step={0.1}
                        onChange={(e, val) => updateComponentValue(selectedComponentId, val)}
                        sx={{ color: '#90caf9' }}
                    />
                </Box>
            )}

            {component.type === 'functionGenerator' && (
                <Box sx={{ mt: 2 }}>
                    <Typography gutterBottom sx={{ color: '#aaa', mt: 2 }}>Waveform</Typography>
                    <Select
                        value={component.waveform || 'sine'}
                        onChange={(e) => updateComponentProp(selectedComponentId, 'waveform', e.target.value)}
                        fullWidth
                        size="small"
                        sx={{ bgcolor: '#111', color: '#fff', mb: 2 }}
                    >
                        <MenuItem value="sine">Sine</MenuItem>
                        <MenuItem value="square">Square</MenuItem>
                        <MenuItem value="triangle">Triangle</MenuItem>
                    </Select>

                    <Typography gutterBottom sx={{ color: '#aaa' }}>Frequency ({Math.round(component.frequency || 1000).toLocaleString()} Hz)</Typography>
                    <Slider
                        value={Math.log10(component.frequency || 1000)}
                        min={0}
                        max={6}
                        step={0.1}
                        onChange={(e, val) => updateComponentProp(selectedComponentId, 'frequency', Math.pow(10, val))}
                        sx={{ color: '#90caf9' }}
                    />

                    <Typography gutterBottom sx={{ color: '#aaa', mt: 2 }}>Amplitude ({(component.amplitude || 5).toFixed(1)} V)</Typography>
                    <Slider
                        value={component.amplitude || 5}
                        min={0}
                        max={30}
                        step={0.5}
                        onChange={(e, val) => updateComponentProp(selectedComponentId, 'amplitude', val)}
                        sx={{ color: '#ff9900' }}
                    />

                    <Typography gutterBottom sx={{ color: '#aaa', mt: 2 }}>Offset ({(component.offset || 0).toFixed(1)} V)</Typography>
                    <Slider
                        value={component.offset || 0}
                        min={-15}
                        max={15}
                        step={0.1}
                        onChange={(e, val) => updateComponentProp(selectedComponentId, 'offset', val)}
                        sx={{ color: '#00af50' }}
                    />
                </Box>
            )}
        </Box>
    );
};

export default PropertiesPanel;
