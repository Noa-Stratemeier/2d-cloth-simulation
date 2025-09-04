class Point {
    constructor(x, y, isPinned = false, restitution = 0.5, velocityRetention = 0.99) {
        this.x = x;
        this.y = y;
        this.previousX = x;
        this.previousY = y;
        this.isPinned = isPinned;

        this.restitution = restitution;
        this.velocityRetention = velocityRetention;
    }

    updatePosition(gravity, dt) {
        if (this.isPinned) return;

        let xVelocity = (this.x - this.previousX) * this.velocityRetention;
        let yVelocity = (this.y - this.previousY) * this.velocityRetention;
        this.previousX = this.x;
        this.previousY = this.y;
        this.x += xVelocity + gravity.x * dt * dt;
        this.y += yVelocity + gravity.y * dt * dt;
    }

    handleBoundaryCollision(minX, maxX, minY, maxY) {
        if (this.isPinned) return;

        let xVelocity = this.x - this.previousX;
        let yVelocity = this.y - this.previousY;

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
    constructor(pointA, pointB, restLength, snapRatio = 3.0) {
        this.pointA = pointA;
        this.pointB = pointB;
        this.restLength = restLength;
        this.snapRatio = snapRatio;
        this.isBroken = false;
    }

    enforce() {
        let dx = this.pointB.x - this.pointA.x;
        let dy = this.pointB.y - this.pointA.y;

        let currentLength = Math.hypot(dx, dy);
        if (currentLength <= this.restLength) return;  // Only correct stretching.
        if (currentLength / this.restLength >= this.snapRatio) { this.isBroken = true; return; }  // Handle constraint snapping.

        let relativeDifference = (this.restLength - currentLength) / currentLength;

        let weightA = this.pointA.isPinned ? 0 : 1;
        let weightB = this.pointB.isPinned ? 0 : 1;
        let weightSum = weightA + weightB;
        if (weightSum === 0) return;

        // The closer the current length gets to rest length the smaller the corrections get.
        let damping = (1 - this.restLength / currentLength);  

        let correctionShareForPointA = relativeDifference * (weightA / weightSum) * damping;
        let correctionShareForPointB = relativeDifference * (weightB / weightSum) * damping;

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

        // Initialise points in a rectangular grid of size rows * columns.
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
        for (let i = this.constraints.length - 1; i >= 0; i--) {
            let constraint = this.constraints[i];
            constraint.enforce();

            // Swap-pop: replace the broken constraint with the last one, then pop the last.
            if (constraint.isBroken) {
                this.constraints[i] = this.constraints[this.constraints.length - 1];
                this.constraints.pop();
            }
        }
    }

    handleBoundaryCollisions() {
        for (let point of this.points) {
            point.handleBoundaryCollision(0, this.width, 0, this.height);
        } 
    }

    step(gravity, dt, solverIterations) {
        this.updatePointPositions(gravity, dt);
        for (let i = 0; i < solverIterations; i++) {
            this.enforceConstraints();
            this.handleBoundaryCollisions();
        }
    }
}





let scene = {
    gravity: {x: 0, y: 500},
    dt: 0.016,
    solverIterations: 8,

    width: window.innerWidth,
    height: window.innerHeight,

    // Cloth.
    rows: 40,
    columns: 80,
    spacing: 8,
    xOffset: 100,
    yOffset: 100
}

let canvas = document.getElementById("cloth-simulation");
let context = canvas.getContext("2d");
canvas.width = scene.width;
canvas.height = scene.height;

let clothSimulation = new ClothSimulation(scene.width, scene.height);
clothSimulation.initialiseCloth(scene.rows, scene.columns, scene.spacing, scene.xOffset, scene.yOffset);





function renderPoints() {
    let pointSize = 0;
    for (let point of clothSimulation.points) {
        context.beginPath();
        context.arc(point.x, point.y, pointSize, 0, Math.PI * 2);
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
    context.clearRect(0, 0, scene.width, scene.height);

    clothSimulation.step(scene.gravity, scene.dt, scene.solverIterations);

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
