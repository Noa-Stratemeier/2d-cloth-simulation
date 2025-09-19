import ClothSimulation from "./ClothSimulation.js";
import { scene } from "./scene.js"

let canvas = document.getElementById("cloth-simulation");
let context = canvas.getContext("2d");
canvas.width = scene.width;
canvas.height = scene.height;

scene.clothSimulation = new ClothSimulation(scene.width, scene.height, scene.parameters);
scene.clothSimulation.initialiseCloth(scene.clothRows, scene.clothColumns, scene.spacing, scene.startX, scene.startY);
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
            context.lineTo(constraint.pointB.x, constraint.pointB.y)
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

function animate() {
    context.clearRect(0, 0, scene.width, scene.height);

    scene.clothSimulation.step();

    renderConstraints();
    renderPoints();
    renderObstacles();
    
    requestAnimationFrame(animate);
}

animate();