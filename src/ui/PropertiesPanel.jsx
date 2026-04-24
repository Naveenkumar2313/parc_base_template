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

            {component.type === 'jfet_n' && (
                <Box sx={{ mt: 2 }}>
                    <TextField
                        label="Pinch-off Voltage Vp (V)"
                        type="number"
                        value={component.pinchOffVoltage !== undefined ? component.pinchOffVoltage : -2.0}
                        onChange={(e) => updateComponentProp(selectedComponentId, 'pinchOffVoltage', Number(e.target.value))}
                        variant="filled"
                        fullWidth
                        sx={{ mb: 2, bgcolor: '#111' }}
                        InputLabelProps={{ style: { color: '#aaa' } }}
                        inputProps={{
                            style: { color: '#90caf9', fontSize: '1.1rem' },
                            step: '0.1', max: '0'
                        }}
                    />
                    <TextField
                        label="Idss Saturation Current (A)"
                        type="number"
                        value={component.Idss !== undefined ? component.Idss : 0.01}
                        onChange={(e) => updateComponentProp(selectedComponentId, 'Idss', Number(e.target.value))}
                        variant="filled"
                        fullWidth
                        sx={{ bgcolor: '#111' }}
                        InputLabelProps={{ style: { color: '#aaa' } }}
                        inputProps={{
                            style: { color: '#90caf9', fontSize: '1.1rem' },
                            step: '0.001', min: '0'
                        }}
                    />
                </Box>
            )}

            {(component.type === 'mosfet_n' || component.type === 'mosfet_p' || component.type === 'bjt_npn' || component.type === 'bjt_pnp' || component.type === 'darlington_npn') && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#1a1a1c', borderRadius: 1, border: '1px dashed #333' }}>
                    <Typography variant="body2" color="#777">
                        {component.type.includes('mosfet') ? "Transistor physics are calculated natively via analytical Companion Model (Level 1). Vth and kp are fixed." : "Component evaluated via Ebers-Moll Newton-Raphson approximation. Alpha and Saturation bounds are statically modeled."}
                    </Typography>
                </Box>
            )}

            {component.type === '555_timer' && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#111', p: 2, borderRadius: 1, borderBottom: '1px solid #555' }}>
                    <Typography sx={{ color: '#aaa', fontWeight: 600 }}>OUT Pin State:</Typography>
                    <Typography
                        sx={{
                            color: (() => {
                                if (!activeNetlist || !simulationState?.voltages) return '#888';
                                const outNode = activeNetlist.pinToNodeMap[`${selectedComponentId}:output`];
                                if (!outNode) return '#888';
                                return simulationState.voltages[outNode] > 2.5 ? '#44ff44' : '#ff4444';
                            })(),
                            fontWeight: 'bold',
                            px: 2, py: 0.5, borderRadius: 1, border: '1px solid #333'
                        }}
                    >
                        {(() => {
                            if (!activeNetlist || !simulationState?.voltages) return '---';
                            const outNode = activeNetlist.pinToNodeMap[`${selectedComponentId}:output`];
                            if (!outNode) return 'UNCONNECTED';
                            return simulationState.voltages[outNode] > 2.5 ? 'HIGH' : 'LOW';
                        })()}
                    </Typography>
                </Box>
            )}

            {component.type === 'lm317_regulator' && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#111', borderRadius: 1, borderBottom: '1px solid #555' }}>
                    <TextField
                        label="Target Regulated Voltage (V)"
                        type="number"
                        value={(1.25 * (1 + (component.r2r1ratio !== undefined ? component.r2r1ratio : 4.0))).toFixed(2)}
                        onChange={(e) => {
                            const targetV = Math.max(1.25, Number(e.target.value));
                            const r2r1ratio = (targetV / 1.25) - 1;
                            updateComponentProp(selectedComponentId, 'r2r1ratio', r2r1ratio);
                        }}
                        variant="filled"
                        fullWidth
                        InputLabelProps={{ style: { color: '#aaa' } }}
                        inputProps={{
                            style: { color: '#ff9900', fontSize: '1.1rem' },
                            step: '0.1', min: '1.25'
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
                    <Typography sx={{ mt: 1, color: '#777', fontSize: '0.85rem' }}>
                        Calculated Resistor Ratio (R2/R1): {(component.r2r1ratio !== undefined ? component.r2r1ratio : 4.0).toFixed(2)}
                    </Typography>
                </Box>
            )}

            {component.type === 'lcd1602' && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#111', borderRadius: 1, borderBottom: '1px solid #555' }}>
                    <Typography gutterBottom sx={{ color: '#aaa', fontWeight: 600 }}>LCD Display Content</Typography>
                    <TextField
                        label="Line 1"
                        value={component.lcdText ? component.lcdText[0] : 'Hello, World!'}
                        onChange={(e) => {
                            const val = e.target.value.substring(0, 16);
                            const current = component.lcdText || ['Hello, World!', 'Sim v1'];
                            updateComponentProp(selectedComponentId, 'lcdText', [val, current[1]]);
                        }}
                        variant="filled" fullWidth sx={{ mb: 1, bgcolor: '#1a1a1c' }}
                        InputLabelProps={{ style: { color: '#888' } }}
                        inputProps={{ style: { color: '#44ff44', fontFamily: 'monospace' } }}
                    />
                    <TextField
                        label="Line 2"
                        value={component.lcdText ? component.lcdText[1] : 'Sim v1'}
                        onChange={(e) => {
                            const val = e.target.value.substring(0, 16);
                            const current = component.lcdText || ['Hello, World!', 'Sim v1'];
                            updateComponentProp(selectedComponentId, 'lcdText', [current[0], val]);
                        }}
                        variant="filled" fullWidth sx={{ bgcolor: '#1a1a1c' }}
                        InputLabelProps={{ style: { color: '#888' } }}
                        inputProps={{ style: { color: '#44ff44', fontFamily: 'monospace' } }}
                    />
                </Box>
            )}

            {component.type === 'neopixel' && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#111', borderRadius: 1, borderBottom: '1px solid #555' }}>
                    <Typography gutterBottom sx={{ color: '#aaa', fontWeight: 600 }}>NeoPixel (WS2812B) Color</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                        <input
                            type="color"
                            value={component.color || '#ff0000'}
                            onChange={(e) => updateComponentProp(selectedComponentId, 'color', e.target.value)}
                            style={{
                                width: '48px', height: '40px', padding: '0',
                                border: '1px solid #333', borderRadius: '4px', cursor: 'pointer',
                                background: 'transparent'
                            }}
                        />
                        <TextField
                            value={component.color || '#ff0000'}
                            onChange={(e) => updateComponentProp(selectedComponentId, 'color', e.target.value)}
                            variant="filled"
                            size="small"
                            fullWidth
                            InputLabelProps={{ style: { color: '#888' } }}
                            inputProps={{ style: { color: '#fff', fontFamily: 'monospace' } }}
                        />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#666', mt: 1.5, lineHeight: 1.2 }}>
                        *Color state is decoupled from DIN logical protocols while pending firmware hooks.*
                    </Typography>
                </Box>
            )}

            {component.type === 'hc_sr04' && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#111', borderRadius: 1, borderBottom: '1px solid #555' }}>
                    <Typography gutterBottom sx={{ color: '#aaa', fontWeight: 600 }}>Ultrasonic Distance (cm)</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Slider
                            value={component.distance !== undefined ? component.distance : 100}
                            onChange={(e, val) => updateComponentProp(selectedComponentId, 'distance', val)}
                            min={0} max={400} step={1}
                            sx={{ color: '#44ff44' }}
                        />
                        <Typography sx={{ color: '#fff', minWidth: '45px', textAlign: 'right' }}>
                            {component.distance !== undefined ? component.distance : 100} cm
                        </Typography>
                    </Box>
                </Box>
            )}

            {component.type === 'dht22' && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#111', borderRadius: 1, borderBottom: '1px solid #555' }}>
                    <Typography gutterBottom sx={{ color: '#aaa', fontWeight: 600 }}>DHT22 Sensor Environment</Typography>
                    <Box sx={{ p: 1.5, mb: 2, bgcolor: '#1a1a1c', borderRadius: 1, border: '1px solid #333' }}>
                        <Typography sx={{ color: '#4fc3f7', fontWeight: 'bold' }}>
                            Temp: {(component.temperature !== undefined ? component.temperature : 25).toFixed(1)}°C | Humidity: {(component.humidity !== undefined ? component.humidity : 60).toFixed(1)}%
                        </Typography>
                    </Box>

                    <Typography gutterBottom sx={{ color: '#aaa', fontSize: '0.9rem' }}>Temperature (°C)</Typography>
                    <Slider
                        value={component.temperature !== undefined ? component.temperature : 25}
                        onChange={(e, val) => updateComponentProp(selectedComponentId, 'temperature', val)}
                        min={-40} max={80} step={0.5}
                        sx={{ color: '#ff4444', mb: 2 }}
                    />

                    <Typography gutterBottom sx={{ color: '#aaa', fontSize: '0.9rem' }}>Relative Humidity (%)</Typography>
                    <Slider
                        value={component.humidity !== undefined ? component.humidity : 60}
                        onChange={(e, val) => updateComponentProp(selectedComponentId, 'humidity', val)}
                        min={0} max={100} step={1}
                        sx={{ color: '#4fc3f7' }}
                    />
                </Box>
            )}

            {(component.type === 'power_vcc' || component.type === 'power_vcc_33') && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#111', borderRadius: 1, borderBottom: '1px solid #555' }}>
                    <Typography gutterBottom sx={{ color: '#aaa', fontWeight: 600 }}>Rail Voltage</Typography>
                    <Select
                        value={component.railVoltage || (component.type === 'power_vcc_33' ? 3.3 : 5.0)}
                        onChange={(e) => updateComponentProp(selectedComponentId, 'railVoltage', Number(e.target.value))}
                        fullWidth size="small" sx={{ color: 'white', bgcolor: '#1a1a1c', border: '1px solid #333' }}
                    >
                        <MenuItem value={3.3}>3.3V</MenuItem>
                        <MenuItem value={5.0}>5.0V</MenuItem>
                        <MenuItem value={9.0}>9.0V</MenuItem>
                        <MenuItem value={12.0}>12.0V</MenuItem>
                    </Select>
                </Box>
            )}

            {component.type === 'dc_motor' && (() => {
                const posPin = `${selectedComponentId}:pos`;
                const negPin = `${selectedComponentId}:neg`;
                const activeNetlist = useCircuitStore.getState().activeNetlist;
                const simState = useCircuitStore.getState().simulationState;
                const posNode = activeNetlist?.pinToNodeMap?.[posPin];
                const negNode = activeNetlist?.pinToNodeMap?.[negPin];
                const vPos = posNode !== undefined ? (simState?.voltages?.[posNode] || 0) : 0;
                const vNeg = negNode !== undefined ? (simState?.voltages?.[negNode] || 0) : 0;
                const vApplied = Math.abs(vPos - vNeg);
                const rpm = Math.round(vApplied * (component.kv || 100));
                return (
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#111', borderRadius: 1, borderBottom: '1px solid #555' }}>
                        <Typography gutterBottom sx={{ color: '#aaa', fontWeight: 600 }}>DC Motor Parameters</Typography>
                        <Box sx={{ p: 1.5, mb: 2, bgcolor: '#1a1a1c', borderRadius: 1, border: '1px solid #333' }}>
                            <Typography sx={{ color: '#00ffcc', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                ⚡ {rpm} RPM
                            </Typography>
                        </Box>
                        <TextField
                            label="Armature Resistance (Ω)"
                            type="number"
                            value={component.armatureResistance || 5}
                            onChange={(e) => updateComponentProp(selectedComponentId, 'armatureResistance', parseFloat(e.target.value) || 5)}
                            variant="filled" fullWidth size="small" sx={{ mb: 1.5, bgcolor: '#1a1a1c' }}
                            InputLabelProps={{ style: { color: '#888' } }}
                            inputProps={{ style: { color: '#fff' } }}
                        />
                        <TextField
                            label="Kv — Velocity Constant (RPM/V)"
                            type="number"
                            value={component.kv || 100}
                            onChange={(e) => updateComponentProp(selectedComponentId, 'kv', parseFloat(e.target.value) || 100)}
                            variant="filled" fullWidth size="small" sx={{ bgcolor: '#1a1a1c' }}
                            InputLabelProps={{ style: { color: '#888' } }}
                            inputProps={{ style: { color: '#fff' } }}
                        />
                    </Box>
                );
            })()}

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
