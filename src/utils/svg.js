/** normalize
 * This lets us translate a value from one scale to another.
 *
 * @param {Number} value - Our initial value to translate
 * @param {Number} min - the current minimum value possible
 * @param {Number} max - the current maximum value possible
 * @param {Number} scaleMin - the min value of the scale we're translating to
 * @param {Number} scaleMax - the max value of the scale we're translating to
 *
 * @returns {Number} the value on its new scale
 */
export const normalize = ({ value, min, max, scaleMin = 0, scaleMax = 1 }) => {
  // If the `min` and `max` are the same value, it means our dataset is flat.
  // For now, let's assume that flat data should be aligned to the bottom.
  if (min === max) {
    return scaleMin;
  }

  return scaleMin + (value - min) * (scaleMax - scaleMin) / (max - min);
};

/** moveTo
 * the coordinate that lies at a midpoint between 2 lines, based on the radius
 *
 * @param {Object} to - Our initial point
 * @param {Number} to.x - The x value of our initial point
 * @param {Number} to.y - The y value of our initial point
 * @param {Object} from - Our final point
 * @param {Number} from.x - The x value of our final point
 * @param {Number} from.y - The y value of our final point
 * @param {Number} radius - The distance away from the final point
 *
 * @returns {Object} an object holding the x/y coordinates of the midpoint.
 */
export const moveTo = (to, from, radius) => {
  const vector = { x: to.x - from.x, y: to.y - from.y };
  const length = Math.sqrt((vector.x * vector.x) + (vector.y * vector.y));
  const unitVector = { x: vector.x / length, y: vector.y / length };

  return {
    x: from.x + unitVector.x * radius,
    y: from.y + unitVector.y * radius,
  };
};

/** getDistanceBetween
 * Simple formula derived from pythagoras to calculate the distance between
 * 2 points on a plane.
 *
 * @param {Object} p1 - Our initial point
 * @param {Number} p1.x - The x value of our initial point
 * @param {Number} p1.y - The y value of our initial point
 * @param {Object} p2 - Our final point
 * @param {Number} p2.x - The x value of our final point
 * @param {Number} p2.y - The y value of our final point
 *
 * @returns {Number} the distance between the points.
 */
export const getDistanceBetween = (p1, p2) => (
  Math.sqrt(
    Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
  )
);

/** checkForCollinearPoints
 * Figure out if the midpoint fits perfectly on a line between the two others.
 *
 * @param {Object} p1 - Our initial point
 * @param {Number} p1.x - The x value of our initial point
 * @param {Number} p1.y - The y value of our initial point
 * @param {Object} p2 - Our mid-point
 * @param {Number} p2.x - The x value of our mid-point
 * @param {Number} p2.y - The y value of our mid-point
 * @param {Object} p3 - Our final point
 * @param {Number} p3.x - The x value of our final point
 * @param {Number} p3.y - The y value of our final point
 * @returns {Boolean} whether or not p2 sits on the line between p1 and p3.
 */
export const checkForCollinearPoints = (p1, p2, p3) => (
  (p1.y - p2.y) * (p1.x - p3.x) ===
  (p1.y - p3.y) * (p1.x - p2.x)
);

export const buildSmoothPath = (data, { radius }) => {
  const [firstPoint, ...otherPoints] = data;

  return otherPoints.reduce((path, point, index) => {
    const next = otherPoints[index + 1];
    const prev = otherPoints[index - 1] || firstPoint;

    const isCollinear = next && checkForCollinearPoints(prev, point, next);

    if (!next || isCollinear) {
      // The very last line in the sequence can just be a regular line.
      return `${path}\nL ${point.x},${point.y}`;
    }

    const distanceFromPrev = getDistanceBetween(prev, point);
    const distanceFromNext = getDistanceBetween(next, point);
    const threshold = Math.min(distanceFromPrev, distanceFromNext);

    const isTooCloseForRadius = (threshold / 2) < radius;

    const radiusForPoint = isTooCloseForRadius ? threshold / 2 : radius;

    const before = moveTo(prev, point, radiusForPoint);
    const after = moveTo(next, point, radiusForPoint);

    return [
      path,
      `L ${before.x},${before.y}`,
      `S ${point.x},${point.y} ${after.x},${after.y}`,
    ].join('\n');
  }, `M ${firstPoint.x},${firstPoint.y}`);
}

window.buildSmoothPath = buildSmoothPath