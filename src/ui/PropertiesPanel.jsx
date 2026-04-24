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

            {['resistor', 'potentiometer', 'capacitor', 'inductor'].includes(component.type) && (
                <Box sx={{ mt: 2 }}>
                    <TextField
                        label={
                            component.type === 'capacitor' ? "Capacitance (F)" :
                                component.type === 'inductor' ? "Inductance (H)" :
                                    "Resistance (Ω)"
                        }
                        type="number"
                        value={component.value || (component.type === 'capacitor' ? 0.000001 : component.type === 'inductor' ? 0.001 : 1000)}
                        onChange={(e) => updateComponentValue(selectedComponentId, Number(e.target.value))}
                        variant="filled"
                        fullWidth
                        InputLabelProps={{ style: { color: '#aaa' } }}
                        inputProps={{
                            style: { color: '#fff', fontSize: '1.1rem' },
                            step: component.type === 'capacitor' ? '0.000001' : component.type === 'inductor' ? '0.001' : '100'
                        }}
                        sx={{
                            backgroundColor: '#111',
                            borderRadius: 1,
                            '& .MuiFilledInput-root': {
                                '&:before': { borderBottomColor: '#555' },
                                '&:hover:not(.Mui-disabled):before': { borderBottomColor: '#90caf9' },
                            }
                        }}
                    />

                    {component.type === 'potentiometer' && (
                        <Box sx={{ mt: 4, px: 1 }}>
                            <Typography gutterBottom sx={{ color: '#aaa' }}>
                                Wiper Position ({(component.wiper ?? 0.5).toFixed(2)})
                            </Typography>
                            <Slider
                                value={component.wiper ?? 0.5}
                                min={0.0}
                                max={1.0}
                                step={0.01}
                                onChange={(e, val) => updateComponentProp(selectedComponentId, 'wiper', val)}
                                sx={{ color: '#00af50' }}
                            />
                            <Typography variant="caption" sx={{ color: '#777', display: 'flex', justifyContent: 'space-between' }}>
                                <span>R1 = {((component.value || 10000) * (component.wiper ?? 0.5)).toFixed(0)}Ω</span>
                                <span>R2 = {((component.value || 10000) * (1 - (component.wiper ?? 0.5))).toFixed(0)}Ω</span>
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}

            {component.type === 'zener_diode' && (
                <Box sx={{ mt: 2 }}>
                    <TextField
                        label="Breakdown Voltage (V)"
                        type="number"
                        value={component.breakdownVoltage !== undefined ? component.breakdownVoltage : 5.1}
                        onChange={(e) => updateComponentProp(selectedComponentId, 'breakdownVoltage', Number(e.target.value))}
                        variant="filled"
                        fullWidth
                        InputLabelProps={{ style: { color: '#aaa' } }}
                        inputProps={{
                            style: { color: '#ff4444', fontSize: '1.1rem' },
                            step: '0.1'
                        }}
                        sx={{
                            backgroundColor: '#111',
                            borderRadius: 1,
                            '& .MuiFilledInput-root': {
                                '&:before': { borderBottomColor: '#555' },
                                '&:hover:not(.Mui-disabled):before': { borderBottomColor: '#90caf9' },
                            }
                        }}
                    />
                </Box>
            )}

            {component.type === 'spst_switch' && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#111', p: 2, borderRadius: 1, borderBottom: '1px solid #555' }}>
                    <Typography sx={{ color: '#aaa', fontWeight: 600 }}>Switch State:</Typography>
                    <Typography
                        sx={{
                            color: component.isOpen !== false ? '#ff4444' : '#44ff44',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            px: 2, py: 0.5, borderRadius: 1, border: '1px solid #333'
                        }}
                        onClick={() => updateComponentProp(selectedComponentId, 'isOpen', component.isOpen === false)}
                    >
                        {component.isOpen !== false ? 'OPEN' : 'CLOSED'}
                    </Typography>
                </Box>
            )}

            {component.type === 'relay_spdt' && (
                <Box sx={{ mt: 2 }}>
                    <TextField
                        label="Activation Voltage (V)"
                        type="number"
                        value={component.activationVoltage !== undefined ? component.activationVoltage : 5.0}
                        onChange={(e) => updateComponentProp(selectedComponentId, 'activationVoltage', Number(e.target.value))}
                        variant="filled"
                        fullWidth
                        InputLabelProps={{ style: { color: '#aaa' } }}
                        inputProps={{
                            style: { color: '#ff9900', fontSize: '1.1rem' },
                            step: '0.1'
                        }}
                        sx={{
                            backgroundColor: '#111',
                            borderRadius: 1,
                            '& .MuiFilledInput-root': {
                                '&:before': { borderBottomColor: '#555' },
                                '&:hover:not(.Mui-disabled):before': { borderBottomColor: '#90caf9' },
                            }
                        }}
                    />
                </Box>
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
