class FPSCounter {
    constructor(elementId) {
        this.fpsElement = document.getElementById(elementId);
        this.timeBefore = 0;
        this.frameCount = 0;
    }

    tick() {
        this.frameCount++;
        let timeNow = performance.now();

        if (timeNow - this.timeBefore >= 1000) {
            this.fpsElement.textContent = this.frameCount;

            this.timeBefore = timeNow;
            this.frameCount = 0;
        }
    }
}





class Point {
    constructor(x, y, isPinned = false, restitution = 0.8, velocityRetention = 0.999) {
        this.x = x;
        this.y = y;
        this.previousX = x;
        this.previousY = y;
        this.isPinned = isPinned;

        this.restitution = restitution;
        this.airResistance = velocityRetention;
    }

    updatePosition(gravity, dt) {
        if (this.isPinned) return;

        let xVelocity = (this.x - this.previousX) * this.airResistance;
        let yVelocity = (this.y - this.previousY) * this.airResistance;
        this.previousX = this.x;
        this.previousY = this.y;
        this.x += xVelocity + gravity.x * dt * dt;
        this.y += yVelocity + gravity.y * dt * dt;
    }

    handleBoundaryCollision(minX, maxX, minY, maxY) {
        let xVelocity = (this.x - this.previousX) * this.airResistance;
        let yVelocity = (this.y - this.previousY) * this.airResistance;

        if (this.x < minX) {
            this.x = minX;
            this.previousX = this.x + xVelocity * this.restitution;
        }
        if (this.x > maxX) {
            this.x = maxX;
            this.previousX = this.x + xVelocity * this.restitution;
        }
        if (this.y < minY) {
            this.y = minY;
            this.previousY = this.y + yVelocity * this.restitution;
        }
        if (this.y > maxY) {
            this.y = maxY;
            this.previousY = this.y + yVelocity * this.restitution;
        }
    }
}





class Constraint {
    constructor(pointA, pointB, restLength, stiffness = 1.0) {
        this.pointA = pointA;
        this.pointB = pointB;
        this.restLength = restLength;

        this.stiffness = stiffness;
    }

    enforce() {
        let dx = this.pointB.x - this.pointA.x;
        let dy = this.pointB.y - this.pointA.y;

        let currentLength = Math.hypot(dx, dy);
        if (currentLength === 0) { dx = 1e-6; dy = 0; currentLength = 1e-6; }

        let lengthError = this.restLength - currentLength;
        let relativeCorrection = (lengthError / currentLength) * this.stiffness;

        let weightA = this.pointA.isPinned ? 0 : 1;
        let weightB = this.pointB.isPinned ? 0 : 1;
        let weightSum = weightA + weightB;
        if (weightSum === 0) return;

        let correctionShareForPointA = relativeCorrection * (weightA / weightSum);
        let correctionShareForPointB = relativeCorrection * (weightB / weightSum);

        this.pointA.x -= dx * correctionShareForPointA;
        this.pointA.y -= dy * correctionShareForPointA;
        this.pointB.x += dx * correctionShareForPointB;
        this.pointB.y += dy * correctionShareForPointB;
    }
}





class ClothSimulation {
    constructor(width, height) {
        this.points = [];
        this.constraints = [];

        this.width = width;
        this.height = height;
    }

    initialiseCloth(rows, columns, spacing, offsetX = 0, offsetY = 0, pinTopRow = true) {
        let rowColumnToIndex = (r, c) => r * columns + c;

        for (let row = 0; row < rows; row++) {
            for (let column = 0; column < columns; column++) {
                let x = column * spacing + offsetX;
                let y = row * spacing + offsetY;
                let isPinned = pinTopRow && row === 0;
                let point = new Point(x, y, isPinned);
                this.points.push(point);

                // Connect to left neighbour.
                if (column > 0) {
                    this.constraints.push(new Constraint(point, this.points[rowColumnToIndex(row, column - 1)], spacing));
                }
                // Connect to top neighbour.
                if (row > 0) {
                    this.constraints.push(new Constraint(point, this.points[rowColumnToIndex(row - 1, column)], spacing));
                }
            }
        }
    }

    updatePointPositions(gravity, dt) {
        for (let point of this.points) {
            point.updatePosition(gravity, dt);
        }
    }

    enforceConstraints() {
        for (let constraint of this.constraints) {
            constraint.enforce();
        }
    }

    handleBoundaryCollisions() {
        for (let point of this.points) {
            point.handleBoundaryCollision(0, this.width, 0, this.height);
        } 
    }

    step(gravity, dt) {
        this.updatePointPositions(gravity, dt);
        this.enforceConstraints();
        this.handleBoundaryCollisions();
    }
}





let fpsCounter = new FPSCounter("fps-counter");

let canvas = document.getElementById("cloth-simulation");
let context = canvas.getContext("2d");
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

let clothSimulation = new ClothSimulation(width, height);
clothSimulation.initialiseCloth(50, 50, 10, 100, 100);
const gravity = {x: 0, y: 100};
const dt = 0.0167;

function renderPoints() {
    for (let point of clothSimulation.points) {
        context.beginPath();
        context.arc(point.x, point.y, 3, 0, Math.PI * 2);
        context.fill();
    }
}

function renderConstraints() {
    context.beginPath();
    for (let constraint of clothSimulation.constraints) {
        context.moveTo(constraint.pointA.x, constraint.pointA.y);
        context.lineTo(constraint.pointB.x, constraint.pointB.y)
    }
    context.stroke();
}

function animate() {
    fpsCounter.tick();

    clothSimulation.step(gravity, dt);

    // Draw.
    context.clearRect(0, 0, width, height);
    renderPoints();
    renderConstraints();

    requestAnimationFrame(animate);
}

animate();








// --- cut constraints with the mouse ---
let cutting = false;
let cuttingRadius = 5;
const cut = e => {
  if (!cutting && e.type !== 'pointerdown') return;
  const x = e.offsetX, y = e.offsetY;
  clothSimulation.constraints = clothSimulation.constraints.filter(c => {
    let ax = c.pointA.x, ay = c.pointA.y, dx = c.pointB.x - ax, dy = c.pointB.y - ay;
    let t = ((x - ax) * dx + (y - ay) * dy) / (dx*dx + dy*dy); t = t < 0 ? 0 : t > 1 ? 1 : t || 0;
    let cx = ax + t * dx, cy = ay + t * dy;
    return Math.hypot(x - cx, y - cy) > cuttingRadius;
  });
};
canvas.addEventListener('pointerdown', e => { cutting = true; cut(e); });
canvas.addEventListener('pointermove', cut);
addEventListener('pointerup', () => cutting = false);
