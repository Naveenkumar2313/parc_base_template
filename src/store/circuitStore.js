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
    setSelectedComponentId: (id) => set({ selectedComponentId: id }),

    // Node registration bindings
    addComponent: (id, component) => set((state) => ({
      components: { ...state.components, [id]: component }
    })),

    updateComponentValue: (id, newValue) => {
      set((state) => ({
        components: {
          ...state.components,
          [id]: { ...state.components[id], value: newValue }
        }
      }));

      // Evaluate physics sequentially securely routing logic limits explicitly generating safe structures out mapping natively dynamically cleanly directly natively securely!
      const currentState = get();
      const activeNetlist = extractNetlist(currentState.components, currentState.wires);
      set({ activeNetlist });
      simWorker.postMessage({ type: 'UPDATE_NETLIST', payload: activeNetlist });
    },

    // Wire Interaction Lifecycle mapping
    setTemporaryWire: (wire) => set({ temporaryWire: wire }),

    commitWire: (completedWire) => set((state) => {
      // When completedWire is successfully bound natively between two endpoints, clear cache and save 
      return {
        wires: [...state.wires, completedWire],
        temporaryWire: null
      };
    }),

    clearTemporaryWire: () => set({ temporaryWire: null }),

    // Electrical nodes
    addNode: (id, node) => set((state) => ({
      nodes: { ...state.nodes, [id]: node }
    })),

    updateSimulationState: (simulationState) => set({ simulationState }),

    saveCircuit: async () => {
      const currentState = get();
      const payload = {
        name: `Circuit-${new Date().toISOString().split('T')[0]}`,
        state: {
          components: currentState.components,
          wires: currentState.wires,
          nodes: currentState.nodes
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
        // Natively mutate the URL without reloading parsing structural states cleanly securely successfully!
        window.history.pushState(null, '', `?circuit_id=${data.id}`);
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
            nodes: data.state.nodes || {}
          });
          // Fire initialization hook locally binding variables securely
          const activeNetlist = extractNetlist(data.state.components || {}, data.state.wires || []);
          set({ activeNetlist });
          simWorker.postMessage({ type: 'UPDATE_NETLIST', payload: activeNetlist });
        }
      } catch (e) {
        console.error("Load Circuit Failed:", e);
      }
    }
  };
});

export default useCircuitStore;
