import { create } from 'zustand';
import { extractNetlist } from '../core/solver/netlistExtractor';

// Initialize Global Simulation Physics Worker natively matching logical bounds safely
export const simWorker = new Worker(new URL('../core/solver/avr.worker.js', import.meta.url), { type: 'module' });

const useCircuitStore = create((set, get) => {

  // Connect worker messages strictly directly isolating variables safely mapping cleanly backwards
  simWorker.onmessage = (e) => {
    const { type, payload } = e.data;
    if (type === 'SIMULATION_STATE') {
      get().updateSimulationState(payload);
    } else if (type === 'UART_TX') {
      set(s => ({ serialBuffer: s.serialBuffer + payload }));
    }
  };

  return {
    components: {}, // map of component ID to component data
    wires: [],      // array of wire data. Format: { start: {x,y,compId,pinId}, end: {x,y,compId,pinId} }
    nodes: {},      // map of node ID to node data

    // Interactive Drawing State
    temporaryWire: null,

    // Real-time Engine Processing Payload
    simulationState: { voltages: {}, currents: {} },
    activeNetlist: null,

    // Serial Data Stream
    serialBuffer: "",
    clearSerialBuffer: () => set({ serialBuffer: "" }),

    // Tool Interfaces
    oscilloscopeProbe: { x: -2, y: -2 },
    probeNodeId: null,

    multimeterProbe: { x: 3, y: 8 },
    multimeterNodeId: null,

    setOscilloscopeProbe: (pos) => set({ oscilloscopeProbe: pos }),
    setProbeNodeId: (id) => set({ probeNodeId: id }),
    setMultimeterProbe: (pos) => set({ multimeterProbe: pos }),
    setMultimeterNodeId: (id) => set({ multimeterNodeId: id }),

    setActiveNetlist: (netlist) => set({ activeNetlist: netlist }),

    // Live Context Interaction Selection
    selectedComponentId: null,
    setSelectedComponentId: (id) => set({ selectedComponentId: id, selectedWireIndex: null }),

    selectedWireIndex: null,
    setSelectedWireIndex: (index) => set({ selectedWireIndex: index, selectedComponentId: null }),

    // Node registration bindings
    addComponent: (id, component) => {
      set((state) => ({
        components: { ...state.components, [id]: component }
      }));
      const s = get();
      const netlist = extractNetlist(s.components, s.wires);
      set({ activeNetlist: netlist });
      simWorker.postMessage({ type: 'UPDATE_NETLIST', payload: netlist });
    },

    updateComponentValue: (id, newValue) => {
      set((state) => ({
        components: {
          ...state.components,
          [id]: { ...state.components[id], value: newValue }
        }
      }));

      const currentState = get();
      const activeNetlist = extractNetlist(currentState.components, currentState.wires);
      set({ activeNetlist });
      simWorker.postMessage({ type: 'UPDATE_NETLIST', payload: activeNetlist });
      get().broadcastChange();
    },

    updateComponentProp: (id, key, val) => {
      set((state) => ({
        components: {
          ...state.components,
          [id]: { ...state.components[id], [key]: val }
        }
      }));

      const currentState = get();
      const activeNetlist = extractNetlist(currentState.components, currentState.wires);
      set({ activeNetlist });
      simWorker.postMessage({ type: 'UPDATE_NETLIST', payload: activeNetlist });
      get().broadcastChange();
    },

    updateComponentPosition: (id, x, y) => {
      set((state) => {
        const oldComp = state.components[id];
        if (!oldComp) return state;

        const dx = x - oldComp.x;
        const dy = y - oldComp.y;

        const newWires = state.wires.map(w => {
          let newStart = { ...w.start };
          let newEnd = { ...w.end };
          if (newStart.compId === id) {
            newStart.x += dx;
            newStart.y += dy;
          }
          if (newEnd.compId === id) {
            newEnd.x += dx;
            newEnd.y += dy;
          }
          return { ...w, start: newStart, end: newEnd };
        });

        return {
          components: {
            ...state.components,
            [id]: { ...oldComp, x, y }
          },
          wires: newWires
        };
      });

      const currentState = get();
      const activeNetlist = extractNetlist(currentState.components, currentState.wires);
      set({ activeNetlist });
      simWorker.postMessage({ type: 'UPDATE_NETLIST', payload: activeNetlist });
      get().broadcastChange();
    },

    // Wire Interaction Lifecycle mapping
    setTemporaryWire: (wire) => set({ temporaryWire: wire }),

    commitWire: (completedWire) => {
      set((state) => ({
        wires: [...state.wires, completedWire],
        temporaryWire: null
      }));
      const s = get();
      const netlist = extractNetlist(s.components, s.wires);
      set({ activeNetlist: netlist });
      simWorker.postMessage({ type: 'UPDATE_NETLIST', payload: netlist });
      setTimeout(() => get().broadcastChange(), 0);
    },

    deleteComponent: (id) => {
      set((state) => {
        const { [id]: _, ...newComponents } = state.components;
        const newWires = state.wires.filter(w => w.start.compId !== id && w.end.compId !== id);
        return { components: newComponents, wires: newWires, selectedComponentId: null };
      });
      const s = get();
      const netlist = extractNetlist(s.components, s.wires);
      set({ activeNetlist: netlist });
      simWorker.postMessage({ type: 'UPDATE_NETLIST', payload: netlist });
      setTimeout(() => get().broadcastChange(), 0);
    },

    deleteWire: (index) => {
      set((state) => {
        const newWires = state.wires.filter((_, i) => i !== index);
        return { wires: newWires };
      });
      const s = get();
      const netlist = extractNetlist(s.components, s.wires);
      set({ activeNetlist: netlist });
      simWorker.postMessage({ type: 'UPDATE_NETLIST', payload: netlist });
      setTimeout(() => get().broadcastChange(), 0);
    },

    clearTemporaryWire: () => set({ temporaryWire: null }),

    // Electrical nodes
    addNode: (id, node) => set((state) => ({
      nodes: { ...state.nodes, [id]: node }
    })),

    simulationStateBuffer: [],
    updateSimulationState: (simulationState) => set((state) => ({
      simulationState,
      simulationStateBuffer: [...state.simulationStateBuffer, simulationState]
    })),
    clearSimulationBuffer: () => set({ simulationStateBuffer: [] }),

    wsConn: null,
    connectCollaboration: (circuitId) => {
      const state = get();
      if (state.wsConn) state.wsConn.close();
      const ws = new WebSocket(`ws://localhost:8000/ws/circuits/${circuitId}/`);
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data && data.components && data.wires) {
          set({ components: data.components, wires: data.wires });
          const activeNetlist = extractNetlist(data.components, data.wires);
          set({ activeNetlist });
          simWorker.postMessage({ type: 'UPDATE_NETLIST', payload: activeNetlist });
        }
      };
      set({ wsConn: ws });
    },
    broadcastChange: () => {
      const state = get();
      if (state.wsConn && state.wsConn.readyState === WebSocket.OPEN) {
        state.wsConn.send(JSON.stringify({
          components: state.components,
          wires: state.wires
        }));
      }
    },

    firmwareCode: `// Write your AVR logic here
void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`,
    setFirmwareCode: (code) => set({ firmwareCode: code }),

    saveCurrentProject: async () => {
      const currentState = get();
      const payload = {
        name: `Circuit-${new Date().toISOString().split('T')[0]}`,
        description: "Cloud saved simulation session.",
        is_public: true,
        state: {
          components: currentState.components,
          wires: currentState.wires,
          nodes: currentState.nodes,
          firmwareCode: currentState.firmwareCode,
          timestamp: new Date().toISOString()
        }
      };
      try {
        const response = await fetch('http://localhost:8000/api/circuits/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        alert(`Successfully saved to database! Sharable Circuit ID: ${data.id}`);

        // Push standardized cleanly formatted React Router endpoints flawlessly
        window.history.pushState(null, '', `/project/${data.id}`);
      } catch (e) {
        console.error("Save Circuit Failed:", e);
        alert("Save failed! Please check Django connectivity.");
      }
    },

    loadCircuit: async (id) => {
      try {
        const response = await fetch(`http://localhost:8000/api/circuits/${id}/`);
        if (!response.ok) throw new Error("Circuit ID not found");
        const data = await response.json();
        if (data && data.state) {
          set({
            components: data.state.components || {},
            wires: data.state.wires || [],
            nodes: data.state.nodes || {},
            firmwareCode: data.state.firmwareCode || get().firmwareCode
          });
          // Fire initialization hook locally binding variables securely
          const activeNetlist = extractNetlist(data.state.components || {}, data.state.wires || []);
          set({ activeNetlist });
          simWorker.postMessage({ type: 'UPDATE_NETLIST', payload: activeNetlist });

          get().connectCollaboration(id);
        }
      } catch (e) {
        console.error("Load Circuit Failed:", e);
      }
    }
  };
});

export default useCircuitStore;
