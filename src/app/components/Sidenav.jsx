import { Fragment } from "react";
import Scrollbar from "react-perfect-scrollbar";
import styled from "@mui/material/styles/styled";

import { ParcVerticalNav } from "app/components";
import useSettings from "app/hooks/useSettings";
import navigations from "app/navigations";
import { Typography, Slider, Grid, Button, Box } from '@mui/material';
import useCircuitStore from '../../store/circuitStore';

// STYLED COMPONENTS
const StyledScrollBar = styled(Scrollbar)(() => ({
  paddingLeft: "1rem",
  paddingRight: "1rem",
  position: "relative"
}));

const SideNavMobile = styled("div")(({ theme }) => ({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: -1,
  width: "100vw",
  background: "rgba(0, 0, 0, 0.54)",
  [theme.breakpoints.up("lg")]: { display: "none" }
}));

export default function Sidenav({ children }) {
  const { settings, updateSettings } = useSettings();

  const updateSidebarMode = (sidebarSettings) => {
    let activeLayoutSettingsName = settings.activeLayout + "Settings";
    let activeLayoutSettings = settings[activeLayoutSettingsName];

    updateSettings({
      ...settings,
      [activeLayoutSettingsName]: {
        ...activeLayoutSettings,
        leftSidebar: { ...activeLayoutSettings.leftSidebar, ...sidebarSettings }
      }
    });
  };

  // --- Circuit State Integrations ---
  const components = useCircuitStore(s => s.components);
  const addComponent = useCircuitStore(s => s.addComponent);
  const updateComponentValue = useCircuitStore(s => s.updateComponentValue);

  const dcSourceObj = Object.entries(components).find(([id, c]) => c.type === 'dcSource' || c.type === 'voltageSource');
  const dcSourceId = dcSourceObj ? dcSourceObj[0] : null;
  const dcSourceVal = dcSourceObj ? (dcSourceObj[1].value || 0) : 5;

  const handleAddComponent = (type) => {
    const id = `comp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const baseProps = { type, x: 10, y: 10, rotation: 0, flip: 1 };
    if (type === 'resistor') baseProps.value = 1000;
    else if (type === 'dcSource') baseProps.value = 5;
    else if (type === 'capacitor') baseProps.value = 0.000001; // 1uF
    else if (type === 'inductor') baseProps.value = 0.001; // 1mH
    else if (type === 'functionGenerator') {
      baseProps.offset = 2.5;
      baseProps.amplitude = 2.5;
      baseProps.frequency = 10;
      baseProps.waveform = 'sine';
    }
    addComponent(id, baseProps);
  };

  const paletteList = [
    { type: 'resistor', label: 'Resistor' },
    { type: 'capacitor', label: 'Capacitor' },
    { type: 'inductor', label: 'Inductor' },
    { type: 'dcSource', label: 'DC Source' },
    { type: 'functionGenerator', label: 'Func Gen' },
    { type: 'diode', label: 'Diode' },
    { type: 'bjt_npn', label: 'NPN BJT' },
    { type: 'mosfet_n', label: 'N-MOSFET' },
    { type: 'opamp', label: 'Op-Amp' },
    { type: 'ground', label: 'Ground' },
    { type: 'led', label: 'LED' },
    { type: 'arduino_uno', label: 'Arduino UNO' },
    { type: 'and_gate', label: 'AND Gate' },
  ];

  return (
    <Fragment>
      <StyledScrollBar options={{ suppressScrollX: true }}>
        {children}
        <ParcVerticalNav items={navigations} />

        {/* --- CLOUD ENGINE WIDGET --- */}
        <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.1)', mt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Cloud Storage</Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={() => useCircuitStore.getState().saveCurrentProject()}
            sx={{ mb: 1, bgcolor: '#00af50', '&:hover': { bgcolor: '#008a3d' } }}
          >
            💾 Save State
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={() => { window.location.href = '/gallery'; }}
            sx={{ bgcolor: '#007acc', '&:hover': { bgcolor: '#005f9e' } }}
          >
            🔍 Explore Gallery
          </Button>
        </Box>

        {/* --- DC POWER SUPPLY WIDGET --- */}
        <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="subtitle2" sx={{ color: '#00ffcc', fontWeight: 'bold', mb: 1 }}>
            [ POWER SUPPLY ]
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Output:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{dcSourceVal.toFixed(2)} V</Typography>
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
              '& .MuiSlider-thumb': { borderRadius: '4px', width: 16, height: 16 }
            }}
          />
        </Box>

        {/* --- COMPONENT PALETTE --- */}
        <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="subtitle2" sx={{ color: '#00af50', fontWeight: 'bold', mb: 1 }}>
            [ COMPONENTS ]
          </Typography>
          <Grid container spacing={1}>
            {paletteList.map(item => (
              <Grid item xs={6} key={item.type}>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={() => handleAddComponent(item.type)}
                  sx={{ fontSize: '10px', p: 0.5, color: 'text.primary', borderColor: 'rgba(255,255,255,0.2)' }}
                >
                  {item.label}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
      </StyledScrollBar>

      <SideNavMobile onClick={() => updateSidebarMode({ mode: "close" })} />
    </Fragment>
  );
}
