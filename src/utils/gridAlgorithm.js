/**
 * Uniform Gap Grid Layout Algorithm for Infinite Canvas
 * 
 * Supports exact 140px gap between covers while preserving 
 * the natural true image dimensions and aspect ratios of every cover.
 */

export const DEFAULT_CARD_WIDTH = 250;  // Base card display width in px
export const DEFAULT_CARD_HEIGHT = 354; // Base reference card height
export const DEFAULT_GAP = 140;         // Default gap set to 140px as requested

/**
 * Calculates absolute world coordinates for a tile at grid coordinate (col, row),
 * preserving true image aspect ratio if provided in item metadata.
 * 
 * @param {number} col - Grid column index
 * @param {number} row - Grid row index
 * @param {Object} item - Cover item containing aspectRatio (height / width)
 * @param {number} baseWidth - Target display width
 * @param {number} gap - Uniform gap size (default 140px)
 */
export function getTilePosition(
  col,
  row,
  item = null,
  baseWidth = DEFAULT_CARD_WIDTH,
  gap = DEFAULT_GAP
) {
  const pitchX = baseWidth + gap;
  
  // Max height box for vertical grid row pitch calculation
  // Base reference pitch for max ratio (~1.71 max ratio * 250 = 428px)
  const maxRowHeight = 420;
  const pitchY = maxRowHeight + gap;

  // Calculate actual card width and height based on intrinsic aspect ratio
  const cardWidth = baseWidth;
  const aspectRatio = item && item.aspectRatio ? item.aspectRatio : 1.414;
  const cardHeight = Math.round(cardWidth * aspectRatio);

  // Position X is col * pitchX
  const x = col * pitchX;

  // Position Y is row * pitchY, centered vertically inside the row pitch cell
  // to ensure vertical gap to neighboring rows is balanced and at least gap size
  const cellOffsetY = Math.round((maxRowHeight - cardHeight) / 2);
  const y = row * pitchY + cellOffsetY;

  return {
    col,
    row,
    x,
    y,
    width: cardWidth,
    height: cardHeight,
    gap
  };
}

/**
 * Calculates visible tile coordinate range given camera pan, zoom, and viewport dimensions.
 */
export function getVisibleTileRange(
  panX,
  panY,
  zoom,
  viewportWidth,
  viewportHeight,
  baseWidth = DEFAULT_CARD_WIDTH,
  gap = DEFAULT_GAP,
  buffer = 2
) {
  const pitchX = baseWidth + gap;
  const maxRowHeight = 420;
  const pitchY = maxRowHeight + gap;

  // Convert viewport screen bounds to world space coordinates
  const worldLeft = (0 - panX) / zoom;
  const worldRight = (viewportWidth - panX) / zoom;
  const worldTop = (0 - panY) / zoom;
  const worldBottom = (viewportHeight - panY) / zoom;

  // Compute grid index bounds
  const minCol = Math.floor(worldLeft / pitchX) - buffer;
  const maxCol = Math.ceil(worldRight / pitchX) + buffer;
  const minRow = Math.floor(worldTop / pitchY) - buffer;
  const maxRow = Math.ceil(worldBottom / pitchY) + buffer;

  return { minCol, maxCol, minRow, maxRow };
}

/**
 * Deterministically maps a (col, row) grid coordinate to an item in the covers array.
 */
export function getItemForGridCoordinate(col, row, items) {
  if (!items || items.length === 0) return null;
  const n = items.length;
  
  const modCol = ((col % n) + n) % n;
  const modRow = ((row % n) + n) % n;
  
  const hashIndex = (modCol + modRow * 5 + Math.abs(col * 3)) % n;
  const baseItem = items[hashIndex];

  return {
    ...baseItem,
    gridCol: col,
    gridRow: row,
    uniqueKey: `${col}_${row}_${baseItem.id}`
  };
}
