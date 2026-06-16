// @ts-ignore
import * as mgrs from 'mgrs';

export function convertMGRSToBBox(mgrsInput: string): { west: number; south: number; east: number; north: number } {
  let base = mgrsInput.trim().toUpperCase().replace(/\s/g, '');
  if (base.length <= 5) {
    // Tile 100kmx100km (e.g. 32TNR)
    // Pad to 10 digits for SW and NE corners
    let sw = mgrs.toPoint(base + '0000000000');
    let ne = mgrs.toPoint(base + '9999999999');
    return {
      west: sw[0],
      south: sw[1],
      east: ne[0],
      north: ne[1]
    };
  } else {
    // Exact point
    let pt = mgrs.toPoint(base);
    return {
      west: pt[0],
      south: pt[1],
      east: pt[0],
      north: pt[1]
    };
  }
}
