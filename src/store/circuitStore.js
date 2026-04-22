import { create } from 'zustand';

const useCircuitStore = create((set) => ({
  components: {}, // map of component ID to component data
  wires: [],      // array of wire data
  nodes: {},      // map of node ID to node data

  // Example actions
  addComponent: (id, component) => set((state) => ({
    components: { ...state.components, [id]: component }
  })),
  
  addWire: (wire) => set((state) => ({
    wires: [...state.wires, wire]
  })),
  
  addNode: (id, node) => set((state) => ({
    nodes: { ...state.nodes, [id]: node }
  }))
}));

export default useCircuitStore;
