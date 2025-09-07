import ClothSimulation from "./ClothSimulation.js";
import { scene } from "./scene.js"

let canvas = document.getElementById("cloth-simulation");
let context = canvas.getContext("2d");
canvas.width = scene.width;
canvas.height = scene.height;

scene.clothSimulation = new ClothSimulation(scene.width, scene.height, scene.parameters);
scene.clothSimulation.initialiseCloth(scene.clothRows, scene.clothColumns, scene.spacing, scene.startX, scene.startY);

function renderPoints() {
    let pointSize = 0;
    for (let point of scene.clothSimulation.points) {
        context.beginPath();
        context.arc(point.x, point.y, pointSize, 0, Math.PI * 2);
        context.fill();
    }
}

function renderConstraints() {
    context.beginPath();
    for (let constraint of scene.clothSimulation.constraints) {
        context.moveTo(constraint.pointA.x, constraint.pointA.y);
        context.lineTo(constraint.pointB.x, constraint.pointB.y)
    }
    context.stroke();
}

function animate() {
    context.clearRect(0, 0, scene.width, scene.height);

    scene.clothSimulation.step();

    renderConstraints();
    renderPoints();
    
    requestAnimationFrame(animate);
}

animate();








// Cut constraints with the mouse.
let cutting = false;
let cuttingRadius = 5;
const cut = e => {
  if (!cutting && e.type !== 'pointerdown') return;
  const x = e.offsetX, y = e.offsetY;
  scene.clothSimulation.constraints = scene.clothSimulation.constraints.filter(c => {
    let ax = c.pointA.x, ay = c.pointA.y, dx = c.pointB.x - ax, dy = c.pointB.y - ay;
    let t = ((x - ax) * dx + (y - ay) * dy) / (dx*dx + dy*dy); t = t < 0 ? 0 : t > 1 ? 1 : t || 0;
    let cx = ax + t * dx, cy = ay + t * dy;
    return Math.hypot(x - cx, y - cy) > cuttingRadius;
  });
};
canvas.addEventListener('pointerdown', e => { cutting = true; cut(e); });
canvas.addEventListener('pointermove', cut);
addEventListener('pointerup', () => cutting = false);
