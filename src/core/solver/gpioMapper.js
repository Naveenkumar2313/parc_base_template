/**
 * Binds AVR8js bitmasks dynamically into the physics solver ecosystem.
 * Digital pins output 5V Logic High or 0V Logic Low.
 */
export const mapGpioToVoltageSources = (gpioStateBatch, circuitStoreComponents) => {
    // We process the final microsecond state of the batch for simplicity in frame rendering,
    // or we can iterate the entire batch if running sub-millisecond MNA integration.
    const latestState = gpioStateBatch[gpioStateBatch.length - 1];
    const { portB, portD } = latestState;

    // ATmega328p Arduino mapping logic:
    // Port D controls Digital Pins 0-7
    // Port B controls Digital Pins 8-13
    const activePins = new Array(14).fill(0);

    for (let i = 0; i < 8; i++) {
        activePins[i] = (portD & (1 << i)) ? 5 : 0; // 5 Volts for High, 0 Volts for Low
    }
    for (let i = 0; i < 6; i++) {
        activePins[8 + i] = (portB & (1 << i)) ? 5 : 0;
    }

    let hasChanged = false;
    // Creating a shallow clone so React/Zustand accurately triggers updates
    const updatedComponents = { ...circuitStoreComponents };

    // Traverse the user's physics workspace and locate components dynamically bound to Arduino Pins
    Object.keys(updatedComponents).forEach(compId => {
        const comp = updatedComponents[compId];

        if (comp.type === 'dcSource' && comp.gpioPin !== undefined) {
            // Expects something like { type: 'dcSource', gpioPin: 'D13' }
            const pinIndex = parseInt(comp.gpioPin.replace('D', ''), 10);

            if (!isNaN(pinIndex) && pinIndex >= 0 && pinIndex <= 13) {
                const physicalVoltage = activePins[pinIndex];

                if (comp.value !== physicalVoltage) {
                    updatedComponents[compId] = { ...comp, value: physicalVoltage };
                    hasChanged = true;
                }
            }
        }
    });

    return hasChanged ? updatedComponents : null;
};
