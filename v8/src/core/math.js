// core math helpers.
// Extracted from the v8 runtime without behavior changes.

export function dist(a,b){const dx=a.x-b.x,dy=a.y-b.y;return Math.sqrt(dx*dx+dy*dy)}

export function clamp(v,lo,hi){return v<lo?lo:v>hi?hi:v}

export function rnd(a,b){return a+Math.random()*(b-a)}
