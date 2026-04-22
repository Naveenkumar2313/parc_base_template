import React, { useEffect, useState } from "react";
import SimulatorCanvas from "../../../canvas/SimulatorCanvas";
import PropertiesPanel from "../../../ui/PropertiesPanel";
import OscilloscopeManager from "../../../ui/OscilloscopeManager";
import Sidebar from "../../../ui/Sidebar";
import useCircuitStore from "../../../store/circuitStore";
import { v4 as uuidv4 } from 'uuid';
import { useSearchParams, useParams } from 'react-router-dom';

const DefaultDashboard = () => {
  const addComponent = useCircuitStore(s => s.addComponent);
  const loadCircuit = useCircuitStore(s => s.loadCircuit);
  const [init, setInit] = useState(false);
  const [searchParams] = useSearchParams();
  const { id: routeId } = useParams();

  // Parse implicit queries natively explicitly extracting layouts actively cleanly effortlessly securely!
  useEffect(() => {
    if (!init) {
      const circuitId = routeId || searchParams.get('circuit_id');
      if (circuitId) {
        loadCircuit(circuitId);
      } else {
        addComponent('res_A12', { type: 'resistor', value: 330, x: 8, y: 5 });
        addComponent('src_B04', { type: 'dcSource', value: 5, x: 4, y: 5 });
      }
      setInit(true);
    }
  }, [init, addComponent, loadCircuit, searchParams]);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden', backgroundColor: '#fafafa' }}>
      {/* Left Bound Controls Map integrating Hardware Configs smoothly dynamically routing natively accurately effectively accurately safely natively successfully parsing variables cleanly effectively exactly */}
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Core Rendering Logic Surface */}
          <SimulatorCanvas />
        </div>
        <div style={{ height: '320px', borderTop: '2px solid #333', backgroundColor: '#1e1e1e', padding: '15px', overflow: 'hidden' }}>
          <OscilloscopeManager />
        </div>
      </div>

      {/* Right Bound Controls Map */}
      <div style={{ width: '350px', flexShrink: 0, borderLeft: '1px solid #333' }}>
        <PropertiesPanel />
      </div>
    </div>
  );
};

export default DefaultDashboard;