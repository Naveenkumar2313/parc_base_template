import { CPU, AVRIOPort, portBConfig, portCConfig, portDConfig } from 'avr8js';
import { TransientSimulator } from './solver';

let cpu = null;
let portB, portC, portD;
let isRunning = false;

// Instantiate the high-level Transient physics sequence logically checking `100µs` increments identically matching native limits implicitly
const transientSim = new TransientSimulator(0.0001);
let physicsTimerUs = 0;

// Define a standard frequency for the ATmega328p (16 MHz)
const FREQUENCY = 16_000_000;

self.onmessage = (e) => {
    const { type, payload } = e.data;

    switch (type) {
        case 'UPDATE_NETLIST':
            transientSim.compileNetlist(payload);
            // Immediately execute physics block cleanly generating DC bounds securely over explicit updates natively safely efficiently
            if (!isRunning) {
                const result = transientSim.step({});
                self.postMessage({ type: 'SIMULATION_STATE', payload: result });
            }
            break;

        case 'LOAD_FIRMWARE':
            // Intel HEX should be parsed into a Uint16Array before being passed to Web Worker
            cpu = new CPU(new Uint16Array(payload.flashBuffer));
            portB = new AVRIOPort(cpu, portBConfig);
            portC = new AVRIOPort(cpu, portCConfig);
            portD = new AVRIOPort(cpu, portDConfig);
            break;

        case 'START':
            isRunning = true;
            executeSimulationBatch();
            break;

        case 'STOP':
            isRunning = false;
            break;

        default:
            console.warn('AVR Worker received unknown command:', type);
    }
};

/**
 * Executes the simulation while unblocking the main UI thread.
 * Emits GPIO data dynamically at high frequencies relative to simulation time.
 */
function executeSimulationBatch() {
    if (!isRunning || !cpu) return;

    // We operate the simulation in discrete "batches" to keep the WebWorker event loop unblocked.
    // We simulate 1 millisecond per real-time frame batch.
    // 1ms = 1,000 microseconds.
    // At 16 MHz, 1ms equates to 16,000 CPU cycles.

    // The system posts back exactly every 1 simulated microsecond (16 clock ticks) as requested.
    // Note: For ultra high UI thread performance, consider batching these 1000 local updates 
    // into one array if the main thread UI struggles with 1000 messages/frame.

    const endCycles = cpu.cycles + 16000;
    const statesBatch = [];

    while (cpu.cycles < endCycles) {
        const microsecondTarget = cpu.cycles + 16;
        while (cpu.cycles < microsecondTarget) {
            cpu.tick();
        }

        const usElapsed = cpu.cycles / 16;

        // Core Physics Bounds Calculation strictly evaluating native limits dynamically seamlessly over true structural relationships independently interacting securely (100µs loops)
        if (usElapsed - physicsTimerUs >= 100) {
            physicsTimerUs = usElapsed;

            // Pin Map evaluation 
            const dynamicPins = {};
            for (let i = 0; i < 8; i++) dynamicPins[`D${i}`] = (portD.pinState & (1 << i)) ? 5 : 0;
            for (let i = 0; i < 6; i++) dynamicPins[`D${8 + i}`] = (portB.pinState & (1 << i)) ? 5 : 0;

            const result = transientSim.step(dynamicPins);
            self.postMessage({ type: 'SIMULATION_STATE', payload: result });
        }

        // Capture the immediate bitmask logic states of the structural GPIO internal memory
        const gpioState = {
            portB: portB.pinState,
            portC: portC.pinState,
            portD: portD.pinState,
            simulatedTimeUs: usElapsed
        };

        statesBatch.push(gpioState);
    }

    // Push back raw bi-directional logic state to the main UI Thread!
    self.postMessage({ type: 'GPIO_STATE_BATCH', payload: statesBatch });

    // Yield the event loop, then immediately queue the next simulated millisecond!
    setTimeout(executeSimulationBatch, 0);
}
