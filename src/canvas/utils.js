export const GRID_SIZE = 20;

/**
 * Converts a grid unit coordinate to pixels for rendering.
 * @param {number} gridUnit 
 * @returns {number} The coordinate in pixels.
 */
export const gridToPixel = (gridUnit) => gridUnit * GRID_SIZE;

/**
 * Converts a pixel coordinate to grid units.
 * @param {number} pixel 
 * @returns {number} The coordinate in grid units.
 */
export const pixelToGrid = (pixel) => Math.round(pixel / GRID_SIZE);

/**
 * Snaps a given pixel coordinate to the nearest grid line.
 * @param {number} pixel 
 * @returns {number} The snapped coordinate in pixels.
 */
export const snapToGrid = (pixel) => Math.round(pixel / GRID_SIZE) * GRID_SIZE;

/**
 * Utility to convert an object with {x, y} in grid units to pixels.
 */
export const pointToPixel = (point) => ({
    x: gridToPixel(point.x),
    y: gridToPixel(point.y)
});

/**
 * Utility to convert an object with {x, y} in pixels to nearest grid units.
 */
export const pointToGrid = (point) => ({
    x: pixelToGrid(point.x),
    y: pixelToGrid(point.y)
});
