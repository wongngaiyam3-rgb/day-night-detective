// December-solstice orientation. Sunlight travels along +X; the terminator
// is the fixed plane X=0. The northern axis leans away from the Sun.
// World = Rz(-tilt) Ry(spin), shared by both renderers and the UI.
export const DEG = Math.PI / 180;
export const AXIAL_TILT = 23.5 * DEG;
export const OBSERVER_LATITUDE = 22.3;
export const HK_LONGITUDE = 114.2;
export const AXIS = [Math.sin(AXIAL_TILT), Math.cos(AXIAL_TILT), 0];
export const OFFSETS = [0, 180, -90, 90];
export function tiltVector(v) {
  return [v[0]*AXIS[1]+v[1]*AXIS[0], -v[0]*AXIS[0]+v[1]*AXIS[1], v[2]];
}
export function worldNormal(longitude, latitude, angle) {
  const lat=latitude*DEG, lon=(180+longitude-HK_LONGITUDE+angle)*DEG;
  return tiltVector([Math.cos(lat)*Math.cos(lon), Math.sin(lat), -Math.cos(lat)*Math.sin(lon)]);
}
export function observerSky(angle, offset=0) {
  const h=(angle+offset)*DEG,lat=OBSERVER_LATITUDE*DEG;
  const normal=worldNormal(HK_LONGITUDE+offset,OBSERVER_LATITUDE,angle);
  const light=-normal[0];
  const altitude=Math.asin(Math.max(-1,Math.min(1,light)))/DEG;
  const declination=-AXIAL_TILT;
  const azimuth=(Math.atan2(-Math.cos(declination)*Math.sin(h),Math.cos(lat)*Math.sin(declination)-Math.sin(lat)*Math.cos(declination)*Math.cos(h))/DEG+360)%360;
  return {light,altitude,azimuth};
}