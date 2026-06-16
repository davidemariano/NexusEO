const mgrs = require('mgrs');

try {
  const tile = "32TNR";
  console.log("Testing:", tile);
  
  // toPoint() returns [lon, lat] of the lower left corner
  const point = mgrs.toPoint(tile);
  console.log("Point:", point);
  
  // Let's see if we can get a bbox. Usually, mgrs gives a box if we pass 'true' to some internal method or if we use the decode method.
  // Actually, mgrs.toPoint returns [lon, lat] of south-west corner.
  // mgrs tiles (like 32TNR) represent a 100km x 100km area.
  // We can get the top right by adding padding to the MGRS string, e.g. 32TNR9999999999.
  const pointTR = mgrs.toPoint(tile + "9999999999");
  console.log("PointTR:", pointTR);
  
} catch (e) {
  console.error("Error:", e);
}
