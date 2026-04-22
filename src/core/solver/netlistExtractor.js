import { ComponentRegistry } from '../components/ComponentRegistry';

/**
 * Extracts a mathematical Netlist mapping out of the physical Zustand architecture.
 * Safely groups interconnected geometry into distinctly tracked electrical nodes.
 * @param {Object} components - Raw Zustand component configurations 
 * @param {Array} wires - Raw Zustand wire array linking pins
 * @returns {Object} A JSON-structured Netlist for consumption by mathjs equations
 */
export const extractNetlist = (components, wires) => {
    const pinNodes = {};

    // Standard disjoint set logic structure for mapping nodal connections efficiently
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
        if (rootA !== rootB) pinNodes[rootA] = rootB;
    };

    // 1. Walk through all components natively validating pin endpoints
    Object.keys(components).forEach(compId => {
        const comp = components[compId];
        const schema = ComponentRegistry[comp.type];
        if (schema && schema.pins) {
            schema.pins.forEach(pin => {
                pinNodes[`${compId}:${pin.id}`] = `${compId}:${pin.id}`;
            });
        }
    });

    // 2. Use physical geometry arrays to trace spatial pin interactions into single generic sets
    wires.forEach(wire => {
        const pinA = `${wire.start.compId}:${wire.start.pinId}`;
        const pinB = `${wire.end.compId}:${wire.end.pinId}`;
        union(pinA, pinB);
    });

    // Batch group isolated string pins uniquely assigned to specific root roots
    const nodeSets = {};
    Object.keys(pinNodes).forEach(pinStr => {
        const root = getRoot(pinStr);
        if (!nodeSets[root]) nodeSets[root] = [];
        const [compId, pinId] = pinStr.split(':');
        nodeSets[root].push({ compId, pinId });
    });

    // 3. Systematically trace roots dynamically to isolate and Anchor 'Node 0' against structural Grounds
    let groundRoot = null;
    for (const root in nodeSets) {
        const hasGround = nodeSets[root].some(p => components[p.compId]?.type === 'ground');
        if (hasGround) {
            groundRoot = root;
            break;
        }
    }

    let numNodes = 0; // Number of non-ground calculated physics nodes
    const rootToNodeId = {};

    if (groundRoot) {
        rootToNodeId[groundRoot] = 0;
    } else {
        // If no absolute physical ground exists on the canvas, define an arbitrary one preventing math logic failures.
        const roots = Object.keys(nodeSets);
        if (roots.length > 0) {
            rootToNodeId[roots[0]] = 0;
            console.warn("Netlist Warning: Isolated Circuit! No native GND tied. Creating arbitrary Node 0 Anchor.");
        }
    }

    Object.keys(nodeSets).forEach(root => {
        if (rootToNodeId[root] === undefined) {
            numNodes++;
            rootToNodeId[root] = numNodes;
        }
    });

    // 4. Extrude processed matrices securely out into a JSON payload formatted natively for physics handlers
    const netlist = {
        totalNodes: numNodes,
        components: [],
        pinToNodeMap: {}
    };

    Object.keys(components).forEach(compId => {
        const comp = components[compId];
        const schema = ComponentRegistry[comp.type];
        if (!schema) return;

        const mappedNodes = {};
        schema.pins.forEach(pin => {
            const pinStr = `${compId}:${pin.id}`;
            const nodeId = rootToNodeId[getRoot(pinStr)];

            mappedNodes[pin.id] = nodeId;
            netlist.pinToNodeMap[pinStr] = nodeId; // Maintain reverse lookup for voltage probing targets
        });

        // MNA matrices inherently construct physics relative only towards functional nodes. 
        // The visual GND components are strictly references and omit equation tracking footprints.
        if (comp.type !== 'ground') {
            netlist.components.push({
                id: compId,
                type: comp.type,
                value: comp.value,
                nodes: mappedNodes,
                gpioPin: comp.gpioPin // Safely maps logic constraints if component touches AVR bindings!
            });
        }
    });

    return netlist;
};
