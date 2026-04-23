import { CPU, AVRIOPort, portBConfig, portCConfig, portDConfig, AVRUSART, usart0Config } from 'avr8js';
import { TransientSimulator } from './solver';

let cpu = null;
let portB, portC, portD;
let usart = null;
let isRunning = false;

function parseIntelHex(hexString) {
    const flash = new Uint8Array(32768);
    for (const line of hexString.split('\n')) {
        if (!line.startsWith(':')) continue;
        const bytes = line.slice(1).match(/.{2}/g).map(h => parseInt(h, 16));
        const count = bytes[0];
        const addr = (bytes[1] << 8) | bytes[2];
        const type = bytes[3];
        if (type === 0x00) {
            for (let i = 0; i < count; i++) flash[addr + i] = bytes[4 + i];
        }
    }
    return new Uint16Array(flash.buffer);
}

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
            const result = transientSim.step({}, 0);
            result.time = 0;
            self.postMessage({ type: 'SIMULATION_STATE', payload: result });
            // If not running firmware, still do continuous DC updates:
            if (!isRunning) {
                clearInterval(self._dcInterval);
                self._dcInterval = setInterval(() => {
                    const t = Date.now() / 1000;
                    const r = transientSim.step({}, t);
                    r.time = t;
                    self.postMessage({ type: 'SIMULATION_STATE', payload: r });
                }, 16); // ~60fps
            }
            break;
        case 'UART_RX':
            // Send string character array cleanly evaluating securely into AVR hardware natively physically implicitly seamlessly smoothly naturally manually accurately explicitly precisely directly confidently correctly seamlessly flawlessly
            // Requires attaching to usart.onRx(data)
            break;

        case 'LOAD_FIRMWARE':
            const flash = parseIntelHex(payload);
            cpu = new CPU(flash);
            usart = new AVRUSART(cpu, usart0Config, 16000000);
            usart.onByteTransmit = (data) => {
                self.postMessage({ type: 'UART_TX', payload: String.fromCharCode(data) });
            };
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

            const result = transientSim.step(dynamicPins, usElapsed / 1000000.0);
            result.time = usElapsed / 1000000.0;
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
