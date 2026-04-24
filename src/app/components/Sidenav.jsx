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

  const handleAddComponent = (type) => {
    const id = `comp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const baseProps = { type, x: 10, y: 10, rotation: 0, flip: 1 };
    if (type === 'resistor') baseProps.value = 1000;
    else if (type === 'potentiometer') {
      baseProps.value = 10000;
      baseProps.wiper = 0.5;
    }
    else if (type === 'dcSource') baseProps.value = 5;
    else if (type === 'capacitor') baseProps.value = 0.000001; // 1uF
    else if (type === 'inductor') baseProps.value = 0.001; // 1mH
    else if (type === 'spst_switch') baseProps.isOpen = true;
    else if (type === 'relay_spdt') {
      baseProps.activationVoltage = 5;
      baseProps.coilResistance = 100;
    }
    else if (type === 'functionGenerator') {
      baseProps.offset = 2.5;
      baseProps.amplitude = 2.5;
      baseProps.frequency = 10;
      baseProps.waveform = 'sine';
    }
    addComponent(id, baseProps);
  };

  const paletteCategories = [
    {
      title: 'Passives', list: [
        { type: 'resistor', label: 'Resistor' },
        { type: 'potentiometer', label: 'Potentiometer' },
        { type: 'capacitor', label: 'Capacitor' },
        { type: 'inductor', label: 'Inductor' },
      ]
    },
    {
      title: 'Active', list: [
        { type: 'diode', label: 'Diode' },
        { type: 'zener_diode', label: 'Zener Diode' },
        { type: 'schottky_diode', label: 'Schottky Diode' },
        { type: 'bjt_npn', label: 'NPN BJT' },
        { type: 'mosfet_n', label: 'N-MOSFET' },
        { type: 'opamp', label: 'Op-Amp' },
      ]
    },
    {
      title: 'Sources', list: [
        { type: 'dcSource', label: 'DC Source' },
        { type: 'functionGenerator', label: 'Func Gen' },
        { type: 'ground', label: 'Ground' },
      ]
    },
    {
      title: 'Logic & Control', list: [
        { type: 'and_gate', label: 'AND Gate' },
        { type: 'arduino_uno', label: 'Arduino UNO (MCU)' },
        { type: 'sensor_dht11', label: 'DHT11 Sensor' },
      ]
    },
    {
      title: 'Electromechanical', list: [
        { type: 'spst_switch', label: 'SPST Switch' },
        { type: 'push_button', label: 'Push Button' },
        { type: 'relay_spdt', label: 'SPDT Relay' },
      ]
    },
    {
      title: 'Output', list: [
        { type: 'led', label: 'Red LED' },
        { type: 'led_green', label: 'Green LED' },
        { type: 'led_blue', label: 'Blue LED' },
        { type: 'led_yellow', label: 'Yellow LED' },
      ]
    }
  ];

  return (
    <Fragment>
      <StyledScrollBar options={{ suppressScrollX: true }}>
        {children}
        <ParcVerticalNav items={navigations} />

        {/* --- COMPONENT CATEGORIES --- */}
        <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="subtitle2" sx={{ color: '#00af50', fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
            [ COMPONENTS ]
          </Typography>

          {paletteCategories.map(category => (
            <Box key={category.title} sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#aaa', display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                {category.title}
              </Typography>
              <Grid container spacing={1}>
                {category.list.map(item => (
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
          ))}
        </Box>
      </StyledScrollBar>

      <SideNavMobile onClick={() => updateSidebarMode({ mode: "close" })} />
    </Fragment>
  );
}
