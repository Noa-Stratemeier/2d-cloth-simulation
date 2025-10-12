import { scene } from "./scene.js";

let tool = null;

window.addEventListener("pointerdown", (event) => {
  let obstacle = scene.clothSimulation.obstacle;
  let dx = obstacle.x - event.clientX;
  let dy = obstacle.y - event.clientY;
  let distance = Math.hypot(dx, dy);
  tool = distance <= obstacle.radius ? "move" : "cut";
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
  for (let constraint of scene.clothSimulation.constraints) {
    if (intersectsCutCircle(constraint, event.clientX, event.clientY)) constraint.isBroken = true;
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
  scene.clothSimulation.obstacle.x = event.clientX;
  scene.clothSimulation.obstacle.y = event.clientY;
}
