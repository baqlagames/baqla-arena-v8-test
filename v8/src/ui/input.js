export function canvasEventPoint(canvas, width, height, event) {
  const rect = canvas.getBoundingClientRect();
  const sx = width / rect.width;
  const sy = height / rect.height;
  const source = event.touches ? event.touches[0] : event;
  return {
    x: (source.clientX - rect.left) * sx,
    y: (source.clientY - rect.top) * sy,
  };
}

export function pointInRect(point, x, y, width, height) {
  return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;
}

export function pointInRectObject(point, rect) {
  return !!rect && pointInRect(point, rect.x, rect.y, rect.w, rect.h);
}

export function clampScroll(value, maxScroll) {
  return Math.max(0, Math.min(maxScroll || 0, value || 0));
}
