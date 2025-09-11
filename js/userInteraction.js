import { scene } from "./scene.js";

// -----------------------------------------------------------------------------
// User Interface.
// -----------------------------------------------------------------------------

let userInterface = document.getElementById("user-interface");

// Label, range, a direct reference to the object + the property key, and whether a rebuild of the cloth should occur.
let controls = [
    { label: "Cutting Radius",        min: 0,       max: 500,                               step: 10,      target: scene,                     key: "cuttingRadius" },
    { label: "Gravity",               min: 0,       max: 2000,                              step: 100,     target: scene.parameters.gravity,  key: "y" },
    { label: "Time Step",             min: 0.0002,  max: 0.02,                              step: 0.0002,  target: scene.parameters,          key: "dt" },
    { label: "Iterations",            min: 1,       max: 50,                                step: 1,       target: scene.parameters,          key: "solverIterations" },
                 
    { label: "Snap Ratio",            min: 1.5,     max: 50.0,                              step: 0.5,     target: scene.parameters,          key: "snapRatio" },
    { label: "Structural Stiffness",  min: 0.001,   max: 1.0,                               step: 0.001,   target: scene.parameters,          key: "structuralStiffness" },  
    { label: "Bend Stiffness",        min: 0.0,     max: 1.0,                               step: 0.001,   target: scene.parameters,          key: "bendStiffness" },  
    { label: "Shear Stiffness",       min: 0.0,     max: 1.0,                               step: 0.001,   target: scene.parameters,          key: "shearStiffness" },  
                   
    { label: "Restitution",           min: 0.0,     max: 1.0,                               step: 0.05,    target: scene.parameters,          key: "restitution" },  
    { label: "Velocity Retention",    min: 0.0,     max: 1.0,                               step: 0.05,    target: scene.parameters,          key: "velocityRetention" },  
                   
    { label: "Cloth Rows",            min: 2,       max: 120,                               step: 1,       target: scene,                     key: "clothRows",              rebuild: true},
    { label: "Cloth Cols",            min: 2,       max: 160,                               step: 1,       target: scene,                     key: "clothColumns",           rebuild: true},
    { label: "Spacing",               min: 0,       max: 30,                                step: 1,       target: scene,                     key: "spacing",                rebuild: true},
    { label: "Start X",               min: 0,       max: scene.width - scene.clothWidth,    step: 1,       target: scene,                     key: "startX",                 rebuild: true},
    { label: "Start Y",               min: 0,       max: scene.height - scene.clothHeight,  step: 1,       target: scene,                     key: "startY",                 rebuild: true}  
];

controls.forEach((control, index) => {
    let id = `ui-${index}`;
    let value = control.target[control.key];

    // Add control to the user interface.
    userInterface.insertAdjacentHTML("beforeend", `
        <div class="ui-slider"> 
            <label for="${id}">${control.label}</label> 
            <input id="${id}" name="${control.label}" type="range" min="${control.min}" max="${control.max}" step="${control.step}" value="${value}" > 
            <output for="${id}">${value}</output> 
        </div>
    `);
    
    let inputElement = document.getElementById(id);
    let outputElement = inputElement.nextElementSibling;
    
    // Update the scene on user input. 
    inputElement.addEventListener("input", (event) => {
        let newValue = Number(event.target.value);
        control.target[control.key] = newValue;
        outputElement.textContent = newValue;

        if (control.rebuild === true) {
            // Clear points/constraints in place (preserves array references).
            scene.clothSimulation.points.length = 0;
            scene.clothSimulation.constraints.length = 0;

            scene.clothSimulation.initialiseCloth(scene.clothRows, scene.clothColumns, scene.spacing, scene.startX, scene.startY);
        }
    });
});

// -----------------------------------------------------------------------------
// Pointer Interaction.
// -----------------------------------------------------------------------------

// Cut constraints with the mouse.
let cutting = false;

window.addEventListener('pointerdown', e => { cutting = true; cut(e); });
window.addEventListener('pointermove', cut);
addEventListener('pointerup', () => cutting = false);

function cut(event) {
    if (!cutting) return;

    // Pointer position.
    let x = event.clientX;
    let y = event.clientY;

    for (let constraint of scene.clothSimulation.constraints) {
        if (intersectsCutCircle(constraint, x, y)) constraint.isBroken = true;
    }
}

function intersectsCutCircle(constraint, x, y) {
    let ax = constraint.pointA.x;
    let ay = constraint.pointA.y;

    let dx = constraint.pointB.x - constraint.pointA.x;
    let dy = constraint.pointB.y - constraint.pointA.y;

    let t = ((x - ax) * dx + (y - ay) * dy) / (dx*dx + dy*dy); 
    t = t < 0 ? 0 : t > 1 ? 1 : t || 0;
    let cx = ax + t * dx;
    let cy = ay + t * dy;
    return Math.hypot(x - cx, y - cy) < scene.cuttingRadius;
}

