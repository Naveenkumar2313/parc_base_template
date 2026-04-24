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
        this.vSources = components.filter(c => c.type === 'dcSource' || c.type === 'voltageSource' || c.type === 'functionGenerator');

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
            else if (comp.type === 'potentiometer') {
                const n_1 = comp.nodes['pin1'];
                const nw = comp.nodes['wiper'];
                const n_2 = comp.nodes['pin2'];

                const w = comp.wiper !== undefined ? comp.wiper : 0.5;
                const r1 = Math.max(1e-6, comp.value * w);
                const r2 = Math.max(1e-6, comp.value * (1 - w));

                const g1 = 1.0 / r1;
                const g2 = 1.0 / r2;

                if (n_1 !== undefined && nw !== undefined) {
                    addG(n_1 - 1, n_1 - 1, g1);
                    addG(nw - 1, nw - 1, g1);
                    addG(n_1 - 1, nw - 1, -g1);
                    addG(nw - 1, n_1 - 1, -g1);
                }

                if (nw !== undefined && n_2 !== undefined) {
                    addG(nw - 1, nw - 1, g2);
                    addG(n_2 - 1, n_2 - 1, g2);
                    addG(nw - 1, n_2 - 1, -g2);
                    addG(n_2 - 1, nw - 1, -g2);
                }
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
    step(dynamicPinVoltages = {}, t_seconds = 0) {
        if (this.size === 0) return { voltages: { 0: 0 }, currents: {} };

        let hasNonLinear = this.components.some(c => c.type === 'diode' || c.type === 'bjt_npn' || c.type === 'bjt_pnp' || c.type === 'mosfet_n');
        let iterations = hasNonLinear ? 10 : 1;

        let finalVoltages = { 0: 0 };
        let finalCurrents = {};

        for (let iter = 0; iter < iterations; iter++) {
            let G_iter = math.clone(this.G_base);
            let I_vec = math.zeros([this.size]);

            const addG_iter = (row, col, value) => {
                if (row >= 0 && col >= 0) G_iter.set([row, col], G_iter.get([row, col]) + value);
            };

            const addCurrent = (row, value) => {
                if (row >= 0) I_vec.set([row], I_vec.get([row]) + value);
            };

            // Calculate transient bounds natively generating RHS matrix numerical inputs 
            this.components.forEach(comp => {
                if (comp.type === 'diode') {
                    // Newton-Raphson Shockley model iteration equivalents bounds exactly dynamically cleanly!
                    const n1 = comp.nodes['anode'];
                    const n2 = comp.nodes['cathode'];

                    const v1 = (iter === 0 ? this.prevVoltages[n1] : finalVoltages[n1]) || 0;
                    const v2 = (iter === 0 ? this.prevVoltages[n2] : finalVoltages[n2]) || 0;
                    let Vd = v1 - v2;

                    // Bound Vd mechanically suppressing divergence
                    if (Vd > 0.8) Vd = 0.8 + (Vd - 0.8) * 0.1;
                    if (Vd < -20) Vd = -20;

                    const Is = 1e-12; // Saturation 
                    const Vt = 0.02585; // Thermal voltage ~26mV
                    const n = 1.0;

                    const Id = Is * (Math.exp(Vd / (n * Vt)) - 1);
                    const Gd = (Is / (n * Vt)) * Math.exp(Vd / (n * Vt));
                    const Ieq = Id - Gd * Vd;

                    // Inject equivalent dynamic NR variables seamlessly
                    addG_iter(n1 - 1, n1 - 1, Gd);
                    addG_iter(n2 - 1, n2 - 1, Gd);
                    addG_iter(n1 - 1, n2 - 1, -Gd);
                    addG_iter(n2 - 1, n1 - 1, -Gd);

                    addCurrent(n1 - 1, -Ieq);
                    addCurrent(n2 - 1, Ieq);
                }
                else if (comp.type === 'bjt_npn' || comp.type === 'bjt_pnp') {
                    const isNPN = comp.type === 'bjt_npn';
                    const sign = isNPN ? 1 : -1;
                    const nb = comp.nodes['base'];
                    const nc = comp.nodes['collector'];
                    const ne = comp.nodes['emitter'];

                    const vb = (iter === 0 ? this.prevVoltages[nb] : finalVoltages[nb]) || 0;
                    const vc = (iter === 0 ? this.prevVoltages[nc] : finalVoltages[nc]) || 0;
                    const ve = (iter === 0 ? this.prevVoltages[ne] : finalVoltages[ne]) || 0;

                    let vbe = sign * (vb - ve);
                    let vbc = sign * (vb - vc);

                    // Bound mechanically suppressing divergence correctly structurally mapping properly
                    if (vbe > 0.8) vbe = 0.8 + (vbe - 0.8) * 0.1;
                    if (vbe < -20) vbe = -20;
                    if (vbc > 0.8) vbc = 0.8 + (vbc - 0.8) * 0.1;
                    if (vbc < -20) vbc = -20;

                    const Is = 1e-14;
                    const Vt = 0.02585;
                    const alphaF = 0.99;
                    const alphaR = 0.5;

                    const Ibe = (Is / alphaF) * (Math.exp(vbe / Vt) - 1);
                    const Ibc = (Is / alphaR) * (Math.exp(vbc / Vt) - 1);
                    const Ict = Is * (Math.exp(vbe / Vt) - Math.exp(vbc / Vt));

                    const gBE = (Is / (alphaF * Vt)) * Math.exp(vbe / Vt);
                    const gBC = (Is / (alphaR * Vt)) * Math.exp(vbc / Vt);
                    const gmF = (Is / Vt) * Math.exp(vbe / Vt);
                    const gmR = (Is / Vt) * Math.exp(vbc / Vt);

                    const IeqBE = Ibe - gBE * vbe;
                    const IeqBC = Ibc - gBC * vbc;
                    const IeqCT = Ict - gmF * vbe + gmR * vbc;

                    // Base-Emitter Diode Equivalent
                    addG_iter(nb - 1, nb - 1, gBE);
                    addG_iter(ne - 1, ne - 1, gBE);
                    addG_iter(nb - 1, ne - 1, -gBE);
                    addG_iter(ne - 1, nb - 1, -gBE);
                    addCurrent(nb - 1, sign * -IeqBE);
                    addCurrent(ne - 1, sign * IeqBE);

                    // Base-Collector Diode Equivalent
                    addG_iter(nb - 1, nb - 1, gBC);
                    addG_iter(nc - 1, nc - 1, gBC);
                    addG_iter(nb - 1, nc - 1, -gBC);
                    addG_iter(nc - 1, nb - 1, -gBC);
                    addCurrent(nb - 1, sign * -IeqBC);
                    addCurrent(nc - 1, sign * IeqBC);

                    // Controlled Current Source Component
                    addG_iter(nc - 1, nb - 1, sign * gmF);
                    addG_iter(nc - 1, ne - 1, sign * -gmF);
                    addG_iter(ne - 1, nb - 1, sign * -gmF);
                    addG_iter(ne - 1, ne - 1, sign * gmF);

                    addG_iter(nc - 1, nb - 1, sign * -gmR);
                    addG_iter(nc - 1, nc - 1, sign * gmR);
                    addG_iter(ne - 1, nb - 1, sign * gmR);
                    addG_iter(ne - 1, nc - 1, sign * -gmR);

                    addCurrent(nc - 1, sign * -IeqCT);
                    addCurrent(ne - 1, sign * IeqCT);
                }
                else if (comp.type === 'mosfet_n') {
                    const ng = comp.nodes['gate'];
                    const nd = comp.nodes['drain'];
                    const ns = comp.nodes['source'];

                    const vg = (iter === 0 ? this.prevVoltages[ng] : finalVoltages[ng]) || 0;
                    const vd = (iter === 0 ? this.prevVoltages[nd] : finalVoltages[nd]) || 0;
                    const vs = (iter === 0 ? this.prevVoltages[ns] : finalVoltages[ns]) || 0;

                    const vgs = vg - vs;
                    const vds = vd - vs;

                    const Vth = 1.5;
                    const kn = 0.05; // 50mA/V^2
                    const lambda = 0.01;
                    let id = 0, gm = 0, gds = 0;

                    if (vgs > Vth) {
                        if (vds <= vgs - Vth) {
                            // Linear (Triode) Region
                            id = kn * ((vgs - Vth) * vds - 0.5 * vds * vds);
                            gm = kn * vds;
                            gds = kn * (vgs - Vth - vds);
                        } else {
                            // Saturation (Active) Region
                            id = 0.5 * kn * (vgs - Vth) * (vgs - Vth) * (1 + lambda * vds);
                            gm = kn * (vgs - Vth) * (1 + lambda * vds);
                            gds = 0.5 * kn * (vgs - Vth) * (vgs - Vth) * lambda;
                        }
                    }

                    const ieq = id - gm * vgs - gds * vds;

                    addG_iter(nd - 1, ng - 1, gm);
                    addG_iter(nd - 1, ns - 1, -gm - gds);
                    addG_iter(nd - 1, nd - 1, gds);

                    addG_iter(ns - 1, ng - 1, -gm);
                    addG_iter(ns - 1, ns - 1, gm + gds);
                    addG_iter(ns - 1, nd - 1, -gds);

                    addCurrent(nd - 1, -ieq);
                    addCurrent(ns - 1, ieq);
                }
                else {
                    const n1 = comp.nodes['pin1'] || comp.nodes['pos'];
                    const n2 = comp.nodes['pin2'] || comp.nodes['neg'];

                    const v1_prev = this.prevVoltages[n1] || 0;
                    const v2_prev = this.prevVoltages[n2] || 0;

                    if (comp.type === 'capacitor') {
                        const C = comp.value || 0.000001;
                        const ieq = C * (v1_prev - v2_prev) / this.dt;
                        addCurrent(n1 - 1, ieq);
                        addCurrent(n2 - 1, -ieq);
                    }
                    else if (comp.type === 'inductor') {
                        const ieq = this.prevCurrents[comp.id] || 0;
                        addCurrent(n1 - 1, -ieq);
                        addCurrent(n2 - 1, ieq);
                    }
                    else if (comp.type === 'dcSource' || comp.type === 'voltageSource') {
                        const vIdx = this.vSources.findIndex(v => v.id === comp.id);
                        const rowNum = this.N + vIdx;
                        let V = comp.value || 5;
                        if (comp.gpioPin && dynamicPinVoltages[comp.gpioPin] !== undefined) {
                            V = dynamicPinVoltages[comp.gpioPin];
                        }
                        addCurrent(rowNum, V);
                    }
                    else if (comp.type === 'functionGenerator') {
                        const vIdx = this.vSources.findIndex(v => v.id === comp.id);
                        const rowNum = this.N + vIdx;
                        const freq = comp.frequency || 1000;
                        const amp = comp.amplitude || 5;
                        const offset = comp.offset || 0;
                        const waveType = comp.waveform || 'sine';
                        let V = offset;

                        // Math cleanly isolates dynamic waveforms mapped internally over bounds natively evaluating smoothly safely flawlessly smoothly!
                        if (waveType === 'sine') {
                            V += amp * Math.sin(2 * Math.PI * freq * t_seconds);
                        } else if (waveType === 'square') {
                            V += Math.sin(2 * Math.PI * freq * t_seconds) >= 0 ? amp : -amp;
                        } else if (waveType === 'triangle') {
                            V += (2 * amp / Math.PI) * Math.asin(Math.sin(2 * Math.PI * freq * t_seconds));
                        }

                        addCurrent(rowNum, V);
                    }
                }
            });

            try {
                // Numerical LU solver sequence tracking algebra accurately matching structures natively!
                const solution = math.lusolve(G_iter, I_vec);
                const res = solution.valueOf();

                for (let i = 1; i <= this.N; i++) {
                    finalVoltages[i] = Array.isArray(res[i - 1]) ? res[i - 1][0] : res[i - 1];
                }

                this.vSources.forEach((comp, idx) => {
                    finalCurrents[comp.id] = Array.isArray(res[this.N + idx]) ? res[this.N + idx][0] : res[this.N + idx];
                });
            } catch (e) {
                // Ignore singular matrices midway cleanly escaping loop limits automatically mathematically!
            }
        }

        // Maintain sequences cleanly caching dynamic bounds isolating arrays effectively natively explicitly cleanly 
        this.prevVoltages = finalVoltages;

        this.components.forEach(comp => {
            if (comp.type === 'inductor') {
                const L = comp.value || 0.001;
                const v1 = finalVoltages[comp.nodes['pin1'] || comp.nodes['pos']] || 0;
                const v2 = finalVoltages[comp.nodes['pin2'] || comp.nodes['neg']] || 0;
                // Inductor Current Law Backward Euler: I(t) = I(t-dt) + V(t)*dt / L
                this.prevCurrents[comp.id] = (this.prevCurrents[comp.id] || 0) + (v1 - v2) * this.dt / L;
            }
        });

        return { voltages: finalVoltages, currents: finalCurrents };
    }
}
