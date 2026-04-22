import React, { useEffect, useState } from "react";
import SimulatorCanvas from "../../../canvas/SimulatorCanvas";
import PropertiesPanel from "../../../ui/PropertiesPanel";
import useCircuitStore from "../../../store/circuitStore";
import { v4 as uuidv4 } from 'uuid';

const DefaultDashboard = () => {
  const addComponent = useCircuitStore(s => s.addComponent);
  const [init, setInit] = useState(false);

  // Initialize a baseline demo logic sequence representing physics properties securely 
  useEffect(() => {
    if (!init) {
      addComponent('res_A12', { type: 'resistor', value: 330, x: 8, y: 5 });
      addComponent('src_B04', { type: 'dcSource', value: 5, x: 4, y: 5 });
      setInit(true);
    }
  }, [init, addComponent]);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden', backgroundColor: '#fafafa' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Core Rendering Logic Surface */}
        <SimulatorCanvas />
      </div>

      {/* Right Bound Controls Map */}
      <div style={{ width: '350px', flexShrink: 0, borderLeft: '1px solid #333' }}>
        <PropertiesPanel />
      </div>
    </div>
  );
};

export default DefaultDashboard;