import { scene } from "./scene.js";

let obstacleIndex = 0;
let tool = null;

window.addEventListener("pointerdown", (event) => {
  tool = event.ctrlKey ? "move" : "cut";
  handlePointerInteraction(event);
});
addEventListener("pointerup", () => {
  tool = null;
});
window.addEventListener("pointermove", handlePointerInteraction);

function handlePointerInteraction(event) {
  if (tool === "cut") cut(event);
  if (tool === "move") moveObstacle(event);
}

function cut(event) {
  let x = event.clientX;
  let y = event.clientY;

  for (let constraint of scene.clothSimulation.constraints) {
    if (intersectsCutCircle(constraint, x, y)) constraint.isBroken = true;
  }
}

function intersectsCutCircle(constraint, x, y) {
  let dx = constraint.pointB.x - constraint.pointA.x;
  let dy = constraint.pointB.y - constraint.pointA.y;

  // Parametric coordinate of the nearest point on the constraint to the pointer coordinates (x, y).
  // Specifically, how far along the line segment from pointA to pointB the nearest point lies.
  let t = ((x - constraint.pointA.x) * dx + (y - constraint.pointA.y) * dy) / (dx * dx + dy * dy);
  t = t < 0 ? 0 : t > 1 ? 1 : t || 0;

  let cx = constraint.pointA.x + t * dx;
  let cy = constraint.pointA.y + t * dy;
  return Math.hypot(x - cx, y - cy) < scene.cuttingRadius;
}

function moveObstacle(event) {
  let x = event.clientX;
  let y = event.clientY;

  scene.clothSimulation.obstacles[obstacleIndex].x = x;
  scene.clothSimulation.obstacles[obstacleIndex].y = y;
}
