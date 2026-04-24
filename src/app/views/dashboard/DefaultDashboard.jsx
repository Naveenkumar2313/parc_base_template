import React, { useEffect, useState } from "react";
import SimulatorCanvas from "../../../canvas/SimulatorCanvas";
import PropertiesPanel from "../../../ui/PropertiesPanel";
import OscilloscopeManager from "../../../ui/OscilloscopeManager";
import CodeEditor from "../../../ui/CodeEditor";
import SerialMonitor from "../../../ui/SerialMonitor";
import useCircuitStore from "../../../store/circuitStore";
import { v4 as uuidv4 } from 'uuid';
import { useSearchParams, useParams } from 'react-router-dom';
import { Box, IconButton, Collapse } from '@mui/material';
import Draggable from 'react-draggable';

const DefaultDashboard = () => {
  const addComponent = useCircuitStore(s => s.addComponent);
  const loadCircuit = useCircuitStore(s => s.loadCircuit);
  const connectCollaboration = useCircuitStore(s => s.connectCollaboration);
  const [init, setInit] = useState(false);
  const [isIotOpen, setIsIotOpen] = useState(true);
  const isOscilloscopeOpen = useCircuitStore(s => s.isOscilloscopeOpen);
  const toggleOscilloscope = useCircuitStore(s => s.toggleOscilloscope);
  const [searchParams] = useSearchParams();
  const { id: routeId } = useParams();

  // Parse implicit queries natively explicitly extracting layouts actively cleanly effortlessly securely!
  useEffect(() => {
    if (!init) {
      const circuitId = routeId || searchParams.get('circuit_id');
      if (circuitId) {
        connectCollaboration(circuitId);
        loadCircuit(circuitId);
      } else {
        addComponent('res_A12', { type: 'resistor', value: 330, x: 8, y: 5 });
        addComponent('src_B04', { type: 'dcSource', value: 5, x: 4, y: 5 });
      }
      setInit(true);
    }
  }, [init, addComponent, loadCircuit, connectCollaboration, searchParams, routeId]);

  return (
    <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden', backgroundColor: '#fafafa', position: 'relative' }}>

      {/* Draggable Oscilloscope Modal (Full Page Bounds) */}
      {isOscilloscopeOpen && (
        <Draggable handle=".osc-handle" bounds="parent">
          <Box sx={{
            position: 'absolute',
            top: 20,
            right: 370, /* Offset from the Properties layout */
            width: 860,
            height: 450,
            zIndex: 1000,
            bgcolor: '#1e1e1e',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            borderRadius: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #444'
          }}>
            <Box className="osc-handle" sx={{ bgcolor: '#2d2d2d', color: '#00ffcc', p: 1, cursor: 'move', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #111' }}>
              <span style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '13px' }}>[ OSCILLOSCOPE ]</span>
              <IconButton size="small" onClick={toggleOscilloscope} sx={{ color: '#aaa', padding: 0, '&:hover': { color: '#fff' } }}>
                <span style={{ fontSize: '16px' }}>&times;</span>
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, p: 2, overflow: 'hidden' }}>
              <OscilloscopeManager />
            </Box>
          </Box>
        </Draggable>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          {/* Core Rendering Logic Surface */}
          <SimulatorCanvas />
        </div>

        {/* New Collapsible Bottom Panel for Code & IoT */}
        <Box sx={{ borderTop: '2px solid #333', backgroundColor: '#1e1e1e' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 0.5, bgcolor: '#252526', cursor: 'pointer' }} onClick={() => setIsIotOpen(!isIotOpen)}>
            <span style={{ color: '#ff9900', fontSize: '14px', marginLeft: 10, fontWeight: 'bold', fontFamily: 'Segoe UI, sans-serif' }}>
              [ IoT DEVELOPMENT ENGINE ]
            </span>
            <IconButton size="small" sx={{ color: '#aaa', borderRadius: '4px' }}>
              <span style={{ fontSize: '12px' }}>{isIotOpen ? '▲ Hide' : '▼ Expand'}</span>
            </IconButton>
          </Box>
          <Collapse in={isIotOpen}>
            <Box sx={{ display: 'flex', height: '280px' }}>
              <Box sx={{ flex: 1 }}>
                <CodeEditor />
              </Box>
              <Box sx={{ width: '400px', borderLeft: '1px solid #333' }}>
                <SerialMonitor />
              </Box>
            </Box>
          </Collapse>
        </Box>
      </div>

      {/* Right Bound Controls Map */}
      <div style={{ width: '350px', flexShrink: 0, borderLeft: '1px solid #333' }}>
        <PropertiesPanel />
      </div>
    </div>
  );
};

export default DefaultDashboard;