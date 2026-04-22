import { create } from 'zustand';
import { extractNetlist } from '../core/solver/netlistExtractor';
import { solveCircuit } from '../core/solver/solver';

const useCircuitStore = create((set, get) => ({
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

  setOscilloscopeProbe: (pos) => set({ oscilloscopeProbe: pos }),
  setProbeNodeId: (id) => set({ probeNodeId: id }),
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

    // Evaluate physics immediately hitting engine triggers natively over identical mapping algorithms
    const currentState = get();
    const activeNetlist = extractNetlist(currentState.components, currentState.wires);
    set({ activeNetlist });
    solveCircuit(activeNetlist);
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

  updateSimulationState: (simulationState) => set({ simulationState })
}));

export default useCircuitStore;
