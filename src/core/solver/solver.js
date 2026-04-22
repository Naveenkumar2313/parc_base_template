import { create, all } from 'mathjs';
import { ComponentRegistry } from '../components/ComponentRegistry';

/**
 * Bootstraps standard MathJS operations including Matrix functions and LU solving
 */
const math = create(all);

/**
 * Modified Nodal Analysis (MNA) Circuit Solver
 * @param {Object} components - The map of component objects from Zustand
 * @param {Array} wires - The array of wire connections
 * @returns {Object} Object containing { voltages, currents, nodeMap }
 */
export const solveCircuit = (components, wires) => {
    // 1. Extract Netlist (Grouping connected pins into distinct electrical nodes)
    const pinNodes = {};

    // Disjoint Set Utility with Path Compression
    const getRoot = (pinStr) => {
        if (!pinNodes[pinStr]) pinNodes[pinStr] = pinStr;
        if (pinNodes[pinStr] !== pinStr) {
            pinNodes[pinStr] = getRoot(pinNodes[pinStr]);
        }
        return pinNodes[pinStr];
    };

    const union = (pinA, pinB) => {
        const rootA = getRoot(pinA);
        const rootB = getRoot(pinB);
        if (rootA !== rootB) pinNodes[rootA] = rootB; // Join the disjoint sets
    };

    // Seed every pin as its own disconnected electrical node
    Object.keys(components).forEach(compId => {
        const comp = components[compId];
        const schema = ComponentRegistry[comp.type];
        if (schema && schema.pins) {
            schema.pins.forEach(pin => {
                const pinStr = `${compId}:${pin.id}`;
                pinNodes[pinStr] = pinStr;
            });
        }
    });

    // Apply real-world structural wires to merge pins into electrical nodes
    wires.forEach(wire => {
        const pinA = `${wire.startComponent}:${wire.startPin}`;
        const pinB = `${wire.endComponent}:${wire.endPin}`;
        union(pinA, pinB);
    });

    // Gather isolated roots into grouped sets mapping all connected elements
    const nodeSets = {};
    Object.keys(pinNodes).forEach(pinStr => {
        const root = getRoot(pinStr);
        if (!nodeSets[root]) nodeSets[root] = [];
        const [compId, pinId] = pinStr.split(':');
        nodeSets[root].push({ compId, pinId });
    });

    // Assign Numeric Integer IDs to all electrical Nodes. 
    // Node 0 represents the logical 0V Reference (Ground).
    let groundRoot = null;
    for (const root in nodeSets) {
        const hasGround = nodeSets[root].some(p => components[p.compId]?.type === 'ground');
        if (hasGround) {
            groundRoot = root;
            break;
        }
    }

    let numNodes = 0;
    const rootToNodeId = {};

    if (groundRoot) {
        rootToNodeId[groundRoot] = 0;
    } else {
        // If no ground is detected, pick the first arbitrary root to force a 0V anchor to guarantee LU decomposition doesn't hit a singular matrix.
        const roots = Object.keys(nodeSets);
        if (roots.length > 0) {
            rootToNodeId[roots[0]] = 0;
            console.warn("MNA Info: No ground component explicitly detected. Creating an implicit 0V reference at Node 0 to allow convergence.");
        }
    }

    // Iterate over remaining active roots and assign them 1, 2, 3...
    Object.keys(nodeSets).forEach(root => {
        if (rootToNodeId[root] === undefined) {
            numNodes++;
            rootToNodeId[root] = numNodes;
        }
    });

    // Finally map each component's distinct pin back to its final algebraic Node index (for use in solver Matrix mapping)
    const compNodes = {};
    Object.keys(components).forEach(compId => {
        compNodes[compId] = {};
        const schema = ComponentRegistry[components[compId].type];
        if (schema) {
            schema.pins.forEach(pin => {
                const pinStr = `${compId}:${pin.id}`;
                compNodes[compId][pin.id] = rootToNodeId[getRoot(pinStr)];
            });
        }
    });


    // 2. Build the Conductance Array (G Matrix) and Output Vector (I Vector)
    const vSources = [];
    Object.keys(components).forEach(compId => {
        if (components[compId].type === 'dcSource') {
            vSources.push(compId);
        }
    });

    const M = vSources.length;
    const N = numNodes; // Non-ground nodes
    const size = N + M;

    // Immediate halt if there's no calculable circuit to trace.
    if (size === 0) return { voltages: { 0: 0 }, currents: {}, nodeMap: compNodes };

    // Generate standard zeros structure in mathjs memory limits for MNA operations
    let G = math.zeros([size, size]);
    let I_vec = math.zeros([size]);

    // Robustly add values across boundaries without bleeding into Node 0 computations.
    const addG = (row, col, conductanceBase) => {
        if (row >= 0 && col >= 0) { // MathJS is 0-indexed, but our equation rows correctly skip Ground values due to mapping `-1`.
            G.set([row, col], G.get([row, col]) + conductanceBase);
        }
    };

    const addCurrent = (row, currentBase) => {
        if (row >= 0) {
            I_vec.set([row], I_vec.get([row]) + currentBase);
        }
    };


    // 3. Apply Conductance Rules via Component "Stamps"
    Object.keys(components).forEach(compId => {
        const comp = components[compId];
        const nodes = compNodes[compId];

        if (comp.type === 'resistor') {
            const n1 = nodes['pin1'];
            const n2 = nodes['pin2'];
            const R = comp.value || 1000; // defaults safely to 1kΩ
            const g = 1.0 / R;

            // Resistor MNA Mapping:
            // Adds physical conductance 1/R symmetrically across its main target diagonals 
            addG(n1 - 1, n1 - 1, g);
            addG(n2 - 1, n2 - 1, g);
            // Simultaneously removes bounds out of phase with parallel diagonal targets for cross-interaction 
            addG(n1 - 1, n2 - 1, -g);
            addG(n2 - 1, n1 - 1, -g);
        }

        else if (comp.type === 'dcSource') {
            const vIdx = vSources.indexOf(compId);
            const rowNum = N + vIdx; // Index shifting out into extended unknown current equations

            const npos = nodes['pos'];
            const nneg = nodes['neg'];
            const V = comp.value || 5; // defaults safely to 5V

            // Component matrix extensions B (nodes vs current interaction)
            addG(npos - 1, rowNum, 1);
            addG(nneg - 1, rowNum, -1);

            // Component matrix extensions C (voltage constraint difference calculation)
            addG(rowNum, npos - 1, 1);
            addG(rowNum, nneg - 1, -1);

            // Final matrix bound condition constraints matching equation rows (setting the actual source voltage value)
            addCurrent(rowNum, V);
        }
    });


    // 4. Algorithm Calculation and Package Retrieval
    let voltages = { 0: 0 }; // Ground node defaults to perfect 0 volts
    let currents = {};

    try {
        // Utilize linear standard LU (Lower-Upper) solving functions directly out of mathjs matrices!
        const solution = math.lusolve(G, I_vec);
        const res = solution.valueOf();

        // Unbundle matrix results into mapped structural voltages
        for (let i = 1; i <= N; i++) {
            // Because `lusolve` natively produces a distinct mathematical column vector formatted [[1], [0]...]
            voltages[i] = Array.isArray(res[i - 1]) ? res[i - 1][0] : res[i - 1];
        }

        // Reverse map unknown current targets correctly mapped into `M` space variables
        vSources.forEach((compId, idx) => {
            currents[compId] = Array.isArray(res[N + idx]) ? res[N + idx][0] : res[N + idx];
        });

    } catch (e) {
        console.error("MNA Solving Critical Error: The logic system collapsed via matrix singularity. The most common cause is a completely untethered nodal block or perfectly shorted source parameters mapping to infinity.", e);
    }

    // Complete returned state bundle includes voltages mapping across nodes, exact DC currents inside each power component, and the final numeric mapping layout tying string pins to actual integer nodes!
    return { voltages, currents, nodeMap: compNodes };
};
