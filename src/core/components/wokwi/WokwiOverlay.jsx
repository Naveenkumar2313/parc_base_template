import React, { useEffect, useRef } from 'react';
import useCircuitStore from '../../../store/circuitStore';

// This component renders Wokwi web components as HTML overlaid on the Konva canvas.
// It reads component positions from the store and translates grid coords to screen coords
// using the stage transform.

const WokwiOverlay = ({ stageRef }) => {
    const components = useCircuitStore(s => s.components);
    const simulationState = useCircuitStore(s => s.simulationState);
    const activeNetlist = useCircuitStore(s => s.activeNetlist);

    const wokwiComponents = Object.entries(components).filter(([id, c]) =>
        ['seven_segment', 'lcd1602', 'neopixel', 'push_button_wokwi', 'servo_wokwi'].includes(c.type)
    );

    if (wokwiComponents.length === 0) return null;

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', width: '100%', height: '100%', overflow: 'hidden' }}>
            {wokwiComponents.map(([id, comp]) => {
                const stage = stageRef?.current;
                if (!stage) return null;
                const scaleX = stage.scaleX();
                const scaleY = stage.scaleY();
                const stageX = stage.x();
                const stageY = stage.y();
                const GRID = 20;
                const screenX = comp.x * GRID * scaleX + stageX;
                const screenY = comp.y * GRID * scaleY + stageY;

                return (
                    <WokwiComponentRenderer
                        key={id}
                        id={id}
                        comp={comp}
                        screenX={screenX}
                        screenY={screenY}
                        scale={scaleX}
                        simulationState={simulationState}
                        activeNetlist={activeNetlist}
                    />
                );
            })}
        </div>
    );
};

const WokwiComponentRenderer = ({ id, comp, screenX, screenY, scale, simulationState, activeNetlist }) => {
    const ref = useRef(null);

    useEffect(() => {
        // Dynamically import and register wokwi elements
        import('@wokwi/elements').then(() => {
            // Elements auto-register as custom elements
        });
    }, []);

    // Compute the display value for 7-segment from simulation voltages
    let displayValue = '0';
    if (comp.type === 'seven_segment' && activeNetlist && simulationState?.voltages) {
        // Read segment pins a-g and dp, decode to digit
        const segPins = ['seg_a', 'seg_b', 'seg_c', 'seg_d', 'seg_e', 'seg_f', 'seg_g'];
        const segBits = segPins.map(pinId => {
            const pinStr = `${id}:${pinId}`;
            const nodeId = activeNetlist.pinToNodeMap[pinStr];
            const v = nodeId !== undefined ? (simulationState.voltages[nodeId] || 0) : 0;
            return v > 2.5 ? 1 : 0;
        });
        // Standard 7-segment decoding table [a,b,c,d,e,f,g]
        const table = {
            '1111110': '0', '0110000': '1', '1101101': '2', '1111001': '3',
            '0110011': '4', '1011011': '5', '1011111': '6', '1110000': '7',
            '1111111': '8', '1111011': '9'
        };
        displayValue = table[segBits.join('')] || '';
    }

    let servoAngle = 0;
    if (comp.type === 'servo_wokwi' && activeNetlist && simulationState?.voltages) {
        const sigPinStr = `${id}:signal`;
        const sigNode = activeNetlist.pinToNodeMap[sigPinStr];
        const sigV = sigNode !== undefined ? (simulationState.voltages[sigNode] || 0) : 0;
        servoAngle = Math.max(0, Math.min(180, Math.round((sigV / 5.0) * 180)));
    }

    useEffect(() => {
        if (comp.type === 'push_button_wokwi') {
            const el = ref.current?.querySelector('wokwi-pushbutton');
            if (!el) return;
            const onPress = () => useCircuitStore.getState().updateComponentProp(id, 'isPressed', true);
            const onRelease = () => useCircuitStore.getState().updateComponentProp(id, 'isPressed', false);

            el.addEventListener('button-press', onPress);
            el.addEventListener('button-release', onRelease);
            return () => {
                el.removeEventListener('button-press', onPress);
                el.removeEventListener('button-release', onRelease);
            };
        }
    }, [comp.type, id]);

    const baseStyle = {
        position: 'absolute',
        left: screenX,
        top: screenY,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        pointerEvents: 'none'
    };

    if (comp.type === 'seven_segment') {
        return (
            <div ref={ref} style={baseStyle}>
                <wokwi-7segment
                    value={displayValue}
                    color="red"
                    style={{ fontSize: '40px' }}
                />
            </div>
        );
    }

    if (comp.type === 'push_button_wokwi') {
        return (
            <div ref={ref} style={{ ...baseStyle, pointerEvents: 'auto' }}>
                <wokwi-pushbutton color="green" style={{ transform: `scale(${scale * 2})`, transformOrigin: 'top left' }} />
            </div>
        );
    }

    if (comp.type === 'servo_wokwi') {
        return (
            <div ref={ref} style={baseStyle}>
                <wokwi-servo angle={servoAngle} />
            </div>
        );
    }

    if (comp.type === 'lcd1602') {
        return (
            <div ref={ref} style={baseStyle}>
                <wokwi-lcd1602
                    characters={JSON.stringify(comp.lcdText || ['Hello!', 'Sim v1'])}
                    style={{ transform: `scale(${scale * 1.5})`, transformOrigin: 'top left' }}
                />
            </div>
        );
    }

    if (comp.type === 'neopixel') {
        return (
            <div ref={ref} style={baseStyle}>
                <wokwi-neopixel
                    color={comp.color || '#000000'}
                    style={{ transform: `scale(${scale * 3})`, transformOrigin: 'top left' }}
                />
            </div>
        );
    }

    return null;
};

export default WokwiOverlay;
