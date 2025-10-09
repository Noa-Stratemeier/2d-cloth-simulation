import ClothSimulation from "./ClothSimulation.js";
import { scene } from "./scene.js";
import "./userInterface.js";
import "./userInteraction.js";
import Stats from "https://esm.sh/stats.js@0.17.0";

let stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

let canvas = document.getElementById("cloth-simulation");
let context = canvas.getContext("2d");
canvas.width = scene.width;
canvas.height = scene.height;

scene.clothSimulation = new ClothSimulation(scene.width, scene.height, scene.simulation);
scene.clothSimulation.initialiseCloth(scene.cloth.rows, scene.cloth.columns, scene.cloth.spacing, scene.cloth.startX, scene.cloth.startY);
scene.clothSimulation.addCircleObstacle(300, 600, 50, 1);

function renderPoints() {
  let pointSize = 2;
  for (let point of scene.clothSimulation.points) {
    context.beginPath();
    context.arc(point.x, point.y, pointSize, 0, Math.PI * 2);
    context.fill();
  }
}

function renderConstraints() {
  context.beginPath();
  for (let constraint of scene.clothSimulation.constraints) {
    if (!constraint.hidden) {
      context.moveTo(constraint.pointA.x, constraint.pointA.y);
      context.lineTo(constraint.pointB.x, constraint.pointB.y);
    }
  }
  context.stroke();
}

function renderObstacles() {
  for (let obstacle of scene.clothSimulation.obstacles) {
    context.beginPath();
    context.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
    context.stroke();
  }
}

// Set drawing styles.
context.fillStyle = "#228B22";
context.strokeStyle = "#228B22";

function animate() {
  stats.begin();
  context.clearRect(0, 0, scene.width, scene.height);

  scene.clothSimulation.step();

  renderConstraints();
  renderPoints();
  renderObstacles();

  stats.end();
  requestAnimationFrame(animate);
}

animate();
