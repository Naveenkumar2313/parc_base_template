import { create, all } from 'mathjs';

const math = create(all);

/**
 * Executes a Transient Analysis (Backward Euler) using Companion Models natively.
 * Evaluates internal state safely calculating non-linear physical interactions across sequences dynamically inside isolated Physics Workers!
 */
export class TransientSimulator {
    constructor(timeStep = 0.0001) { // 100µs integration step explicitly default
        this.dt = timeStep;
        this.G_base = null;
        this.size = 0;
        this.N = 0;
        this.vSources = [];
        this.components = [];

        // State Memory Blocks securely isolating iterative physical potentials numerically
        this.prevVoltages = {};
        this.prevCurrents = {};
    }

    compileNetlist(netlist) {
        if (!netlist) return;

        const { totalNodes, components } = netlist;
        this.components = components;
        // Map dynamically both independent logic matrices and interactive dynamic MCU targets identically
        this.vSources = components.filter(c => c.type === 'dcSource' || c.type === 'voltageSource');

        this.N = totalNodes;
        const M = this.vSources.length;
        this.size = this.N + M;

        // Reset Memory sequences logically securely evaluating ground states exactly matching matrix mapping bounds directly
        this.prevVoltages = { 0: 0 };
        for (let i = 1; i <= this.N; i++) this.prevVoltages[i] = 0;
        this.components.forEach(c => {
            if (c.type === 'inductor') this.prevCurrents[c.id] = 0;
        });

        if (this.size === 0) return;

        // Pre-calculate physical components resolving cleanly into absolute numerical parameters matching native values
        this.G_base = math.zeros([this.size, this.size]);

        const addG = (row, col, value) => {
            if (row >= 0 && col >= 0) {
                this.G_base.set([row, col], this.G_base.get([row, col]) + value);
            }
        };

        // Statically compile all components physically mapping properties identically directly targeting base Conductance loops
        this.components.forEach(comp => {
            const n1 = comp.nodes['pin1'] || comp.nodes['pos'];
            const n2 = comp.nodes['pin2'] || comp.nodes['neg'];

            if (comp.type === 'resistor') {
                const g = 1.0 / (comp.value || 1000);
                addG(n1 - 1, n1 - 1, g);
                addG(n2 - 1, n2 - 1, g);
                addG(n1 - 1, n2 - 1, -g);
                addG(n2 - 1, n1 - 1, -g);
            }
            else if (comp.type === 'capacitor') {
                // MNA Transient "Companion Model": Capacitor resolves cleanly natively matching parallel Resistors dynamically (Backward Euler)
                // Req = dt / C -> Geq = C / dt
                const C = comp.value || 0.000001; // 1µF
                const g = C / this.dt;
                addG(n1 - 1, n1 - 1, g);
                addG(n2 - 1, n2 - 1, g);
                addG(n1 - 1, n2 - 1, -g);
                addG(n2 - 1, n1 - 1, -g);
            }
            else if (comp.type === 'inductor') {
                // MNA Transient "Companion Model": Inductor evaluates identically matching specific native parameters generating equivalent geometries explicitly cleanly mapping correctly
                // Req = L / dt -> Geq = dt / L
                const L = comp.value || 0.001; // 1mH
                const g = this.dt / L;
                addG(n1 - 1, n1 - 1, g);
                addG(n2 - 1, n2 - 1, g);
                addG(n1 - 1, n2 - 1, -g);
                addG(n2 - 1, n1 - 1, -g);
            }
            else if (comp.type === 'dcSource' || comp.type === 'voltageSource') {
                const vIdx = this.vSources.findIndex(v => v.id === comp.id);
                const rowNum = this.N + vIdx;

                addG(n1 - 1, rowNum, 1);
                addG(n2 - 1, rowNum, -1);
                addG(rowNum, n1 - 1, 1);
                addG(rowNum, n2 - 1, -1);
            }
        });
    }

    // Real-time Simulation Iteration Loop
    step(dynamicPinVoltages = {}) {
        if (this.size === 0) return { voltages: { 0: 0 }, currents: {} };

        // Initialize physical properties locally tracking real-time sequential sequences dynamically safely over sequences securely
        let I_vec = math.zeros([this.size]);

        const addCurrent = (row, value) => {
            if (row >= 0) {
                I_vec.set([row], I_vec.get([row]) + value);
            }
        };

        // Calculate transient bounds natively generating RHS matrix numerical inputs 
        this.components.forEach(comp => {
            const n1 = comp.nodes['pin1'] || comp.nodes['pos'];
            const n2 = comp.nodes['pin2'] || comp.nodes['neg'];

            const v1_prev = this.prevVoltages[n1] || 0;
            const v2_prev = this.prevVoltages[n2] || 0;

            if (comp.type === 'capacitor') {
                // Current Injection Equivalent: Ieq = C * Vprev / dt
                const C = comp.value || 0.000001;
                const ieq = C * (v1_prev - v2_prev) / this.dt;
                addCurrent(n1 - 1, ieq);
                addCurrent(n2 - 1, -ieq); // Negative offset resolves cleanly matching backward direction mapping correctly cleanly!
            }
            else if (comp.type === 'inductor') {
                // Current Injection Equivalent: Ieq = Iprev
                const ieq = this.prevCurrents[comp.id] || 0;
                addCurrent(n1 - 1, -ieq);
                addCurrent(n2 - 1, ieq);
            }
            else if (comp.type === 'dcSource' || comp.type === 'voltageSource') {
                const vIdx = this.vSources.findIndex(v => v.id === comp.id);
                const rowNum = this.N + vIdx;

                let V = comp.value || 5;
                // Dynamically override values cleanly matching native backend GPIO states mapping explicitly safely cleanly seamlessly!
                if (comp.gpioPin && dynamicPinVoltages[comp.gpioPin] !== undefined) {
                    V = dynamicPinVoltages[comp.gpioPin];
                }

                addCurrent(rowNum, V);
            }
        });

        let voltages = { 0: 0 };
        let currents = {};

        try {
            // Numerical LU solver sequence tracking algebra accurately matching structures natively!
            const solution = math.lusolve(this.G_base, I_vec);
            const res = solution.valueOf();

            for (let i = 1; i <= this.N; i++) {
                voltages[i] = Array.isArray(res[i - 1]) ? res[i - 1][0] : res[i - 1];
            }

            this.vSources.forEach((comp, idx) => {
                currents[comp.id] = Array.isArray(res[this.N + idx]) ? res[this.N + idx][0] : res[this.N + idx];
            });

            // Maintain sequences cleanly caching dynamic bounds isolating arrays effectively natively explicitly cleanly 
            this.prevVoltages = voltages;

            this.components.forEach(comp => {
                if (comp.type === 'inductor') {
                    const L = comp.value || 0.001;
                    const v1 = voltages[comp.nodes['pin1'] || comp.nodes['pos']] || 0;
                    const v2 = voltages[comp.nodes['pin2'] || comp.nodes['neg']] || 0;
                    // Inductor Current Law Backward Euler: I(t) = I(t-dt) + V(t)*dt / L
                    this.prevCurrents[comp.id] = (this.prevCurrents[comp.id] || 0) + (v1 - v2) * this.dt / L;
                }
            });

        } catch (e) {
            console.warn("Transient convergence physically halted gracefully blocking null arrays naturally cleanly!");
        }

        return { voltages, currents };
    }
}
