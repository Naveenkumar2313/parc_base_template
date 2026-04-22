import { create, all } from 'mathjs';
import useCircuitStore from '../../store/circuitStore';

/**
 * Initializes generic numerical frameworks natively mapping array vectors properly without bounds limits
 */
const math = create(all);

/**
 * Executes a Modified Nodal Analysis (MNA) using mathematically distinct logic matrix mappings
 * @param {Object} netlist The structured algebraic target (output cleanly from netlistExtractor)
 */
export const solveCircuit = (netlist) => {
    const { totalNodes, components } = netlist;

    // We explicitly identify specific active components generating bounds limit interactions pushing bounds variables
    const vSources = components.filter(c => c.type === 'dcSource');

    const M = vSources.length;
    const N = totalNodes; // Strictly non-ground 0 bounds array target calculations
    const size = N + M;

    // Halt matrix deployment intelligently if physical connections natively prevent simulation traces
    if (size === 0) {
        useCircuitStore.getState().updateSimulationState({ voltages: { 0: 0 }, currents: {} });
        return;
    }

    let G = math.zeros([size, size]);
    let I_vec = math.zeros([size]);

    // Robustly add physics node properties targeting bounds offset structures bypassing explicit arrays tied safely back to pure logical target arrays mapped over Node 0 bounds without math errors internally
    const addG = (row, col, value) => {
        if (row >= 0 && col >= 0) { // Offsets logically map -1 into null space eliminating mathematically unstable equations safely targeting Node 0 mapping logically isolated natively.
            G.set([row, col], G.get([row, col]) + value);
        }
    };

    const addCurrent = (row, value) => {
        if (row >= 0) {
            I_vec.set([row], I_vec.get([row]) + value);
        }
    };

    // 1. Traverse structured components logically applying internal MNA bounds specific variable components natively mapped safely
    components.forEach(comp => {
        if (comp.type === 'resistor') {
            const n1 = comp.nodes['pin1'];
            const n2 = comp.nodes['pin2'];
            const R = comp.value || 1000;
            const g = 1.0 / R;

            // 2. Resistor "Stamp": Maps distinct bounds arrays generating positive algebraic logic diagonals directly mapping matrix physics targets symmetrically
            addG(n1 - 1, n1 - 1, g);
            addG(n2 - 1, n2 - 1, g);
            // Evaluates off-diagonals perfectly matching mapped nodes interactions preventing unlinked geometry bugs mathematically interacting 
            addG(n1 - 1, n2 - 1, -g);
            addG(n2 - 1, n1 - 1, -g);
        }
        else if (comp.type === 'dcSource') {
            const vIdx = vSources.findIndex(v => v.id === comp.id);
            const rowNum = N + vIdx;

            const npos = comp.nodes['pos'];
            const nneg = comp.nodes['neg'];
            const V = comp.value || 5;

            // 3. Voltage Source "Stamp": Employs specifically generated independent variables dynamically bound back natively matching distinct interactions across components correctly targeting specific unknown arrays internally extending logic
            addG(npos - 1, rowNum, 1);
            addG(nneg - 1, rowNum, -1);

            // Secondary component matrix targets evaluating distinct differential equations mathematically forcing distinct components interacting directly matching numerical arrays correctly dynamically mapped locally
            addG(rowNum, npos - 1, 1);
            addG(rowNum, nneg - 1, -1);

            // Force absolute constraints effectively
            addCurrent(rowNum, V);
        }
    });

    // 4. Algorithm Calculation and Output State Push
    let voltages = { 0: 0 };
    let currents = {};

    try {
        const solution = math.lusolve(G, I_vec);
        const res = solution.valueOf();

        // De-multiplex algebraic arrays mapping backward exactly toward native component variables explicitly
        for (let i = 1; i <= N; i++) {
            voltages[i] = Array.isArray(res[i - 1]) ? res[i - 1][0] : res[i - 1];
        }

        // Explicit array evaluations isolating native geometry targeting backwards matching variables cleanly bound structurally mapped dynamically correctly cleanly
        vSources.forEach((comp, idx) => {
            currents[comp.id] = Array.isArray(res[N + idx]) ? res[N + idx][0] : res[N + idx];
        });
    } catch (e) {
        console.warn("Solver Note: MNA Numerical convergence logically aborted targeting standard limits interacting distinctly matching geometry components explicitly natively cleanly.", e);
    }

    useCircuitStore.getState().updateSimulationState({ voltages, currents });
};
