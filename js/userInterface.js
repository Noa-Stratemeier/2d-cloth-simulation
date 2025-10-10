import { scene } from "./scene.js";
import GUI from "https://cdn.jsdelivr.net/npm/lil-gui@0.20/+esm";

let gui = new GUI();
let simulationFolder = gui.addFolder("Simulation");
let clothFolder = gui.addFolder("Cloth");

// Object reference, property key, min, max, step.
gui.add(scene, "cuttingRadius", 1, 100, 1).name("Cutting Radius");
gui
  .add(scene.obstacle, "radius", 10, 500, 1)
  .name("Obstacle Radius")
  .onChange(() => {
    let obstacle = scene.clothSimulation.obstacle;
    if (obstacle) obstacle.radius = scene.obstacle.radius;
  });

gui.add({ rebuild }, "rebuild").name("Reset");

simulationFolder.add(scene.simulation.gravity, "y", 0, 5000, 100).name("Gravity");
simulationFolder.add(scene.simulation, "solverIterations", 1, 50, 1).name("Solver Iterations");
simulationFolder.add(scene.simulation, "snapRatio", 2, 50, 1).name("Snap Ratio");
simulationFolder.add(scene.simulation, "structuralStiffness", 0.001, 1.0, 0.001).name("Structural Stiffness");
simulationFolder.add(scene.simulation, "bendStiffness", 0.0, 1.0, 0.001).name("Bend Stiffness");
simulationFolder.add(scene.simulation, "shearStiffness", 0.0, 1.0, 0.001).name("Shear Stiffness");
simulationFolder.add(scene.simulation, "restitution", 0.0, 1.0, 0.01).name("Restitution");
simulationFolder.add(scene.simulation, "velocityRetention", 0.0, 1.0, 0.01).name("Velocity Retention");

let clothRows = clothFolder.add(scene.cloth, "rows", 2, scene.cloth.maxRows, 1).name("Rows").onChange(rebuild);
let clothColumns = clothFolder.add(scene.cloth, "columns", 2, scene.cloth.maxColumns, 1).name("Columns").onChange(rebuild);
let clothSpacing = clothFolder.add(scene.cloth, "spacing", 5, scene.cloth.maxSpacing, 1).name("Spacing").onChange(rebuild);
let clothStartX = clothFolder.add(scene.cloth, "startX", 0, scene.cloth.maxStartX, 1).name("Start X").onChange(rebuild);
let clothStartY = clothFolder.add(scene.cloth, "startY", 0, scene.cloth.maxStartY, 1).name("Start Y").onChange(rebuild);

function rebuild() {
  scene.clothSimulation.initialiseCloth(scene.cloth.rows, scene.cloth.columns, scene.cloth.spacing, scene.cloth.startX, scene.cloth.startY);
  updateControlLimits();
}

function updateControlLimits() {
  clothRows.max(scene.cloth.maxRows);
  clothColumns.max(scene.cloth.maxColumns);
  clothSpacing.max(scene.cloth.maxSpacing);
  clothStartX.max(scene.cloth.maxStartX);
  clothStartY.max(scene.cloth.maxStartY);
}
