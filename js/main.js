import ClothSimulation from "./ClothSimulation.js";
import { scene } from "./scene.js";
import "./userInterface.js";
import "./userInteraction.js";
import Stats from "https://esm.sh/stats.js@0.17.0";

const EMERALD = "#228B22";
const RED = "#ffffffff";

let stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

let canvas = document.getElementById("cloth-simulation");
let context = canvas.getContext("2d");
canvas.width = scene.width;
canvas.height = scene.height;

scene.clothSimulation = new ClothSimulation(scene.width, scene.height, scene.simulation);
scene.clothSimulation.initialiseCloth(scene.cloth.rows, scene.cloth.columns, scene.cloth.spacing, scene.cloth.startX, scene.cloth.startY);
scene.clothSimulation.addCircleObstacle(scene.obstacle.x, scene.obstacle.y, scene.obstacle.radius, scene.obstacle.restitution);

function renderPoints(colour, size) {
  context.fillStyle = colour;
  for (let point of scene.clothSimulation.points) {
    context.beginPath();
    context.arc(point.x, point.y, size, 0, Math.PI * 2);
    context.fill();
  }
}

function renderConstraints(colour) {
  context.strokeStyle = colour;
  context.beginPath();
  for (let constraint of scene.clothSimulation.constraints) {
    if (!constraint.hidden) {
      context.moveTo(constraint.pointA.x, constraint.pointA.y);
      context.lineTo(constraint.pointB.x, constraint.pointB.y);
    }
  }
  context.stroke();
}

function renderObstacle(colour) {
  let obstacle = scene.clothSimulation.obstacle;
  context.strokeStyle = colour;
  context.beginPath();
  context.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
  context.stroke();
}

function animate() {
  stats.begin();
  context.clearRect(0, 0, scene.width, scene.height);

  scene.clothSimulation.step();

  renderConstraints(EMERALD);
  renderPoints(EMERALD, 0.2 * scene.cloth.spacing);
  renderObstacle(RED);

  stats.end();
  requestAnimationFrame(animate);
}

animate();
