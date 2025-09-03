class Point {
    constructor(x, y, previousX = x, previousY = y, isPinned = false) {
        this.x = x;
        this.y = y;
        this.previousX = previousX;
        this.previousY = previousY;
        this.isPinned = isPinned;
    }

    step(gravity, dt) {
        if (this.isPinned) return;

        // Update position.
        let xVelocity = this.x - this.previousX;
        let yVelocity = this.y - this.previousY;
        this.previousX = this.x;
        this.previousY = this.y;
        this.x += xVelocity + gravity.x * dt * dt;
        this.y += yVelocity + gravity.y * dt * dt;

        // Handle collisions with walls.
        if (this.x > width) {
            this.x = width;
            this.previousX = this.x + xVelocity;
        }
        if (this.x < 0) {
            this.x = 0;
            this.previousX = this.x + xVelocity;
        }
        if (this.y > height) {
            this.y = height;
            this.previousY = this.y + yVelocity;
        }
        if (this.y < 0) {
            this.y = 0;
            this.previousY = this.y + yVelocity;
        }
    }
}



class Constraint {
    constructor(pointA, pointB, restLength) {
        this.pointA = pointA;
        this.pointB = pointB;
        this.restLength = restLength;
    }

    step() {
        let dx = this.pointB.x - this.pointA.x;
        let dy = this.pointB.y - this.pointA.y;

        let distance = Math.hypot(dx, dy);
        if (distance === 0) { dx = 1e-6; dy = 0; distance = 1e-6; }

        let difference = this.restLength - distance;
        let correctionPercentage = (difference / distance) / 2;
        let correctionX = dx * correctionPercentage;
        let correctionY = dy * correctionPercentage;

        let weightA = this.pointA.isPinned ? 0 : 1;
        let weightB = this.pointB.isPinned ? 0 : 1;
        let weightSum = weightA + weightB;
        if (weightSum === 0) return;

        this.pointA.x -= correctionX * (weightA / weightSum);
        this.pointA.y -= correctionY * (weightA / weightSum);
        this.pointB.x += correctionX * (weightB / weightSum);
        this.pointB.y += correctionY * (weightB / weightSum);
    }
}



class ClothSimulation {
    constructor(points, constraints) {
        this.points = points;
        this.constraints = constraints;
    }

    step(gravity, dt) {
        for (let point of this.points) {
            point.step(gravity, dt);
        }

        for (let constraint of this.constraints) {
            constraint.step();
        }
    }

    initialise() {
        let points = [];
        let point1 = new Point(100, 100);
        let point2 = new Point(110, 100);
        points.push(point1);
        points.push(point2);
        let point3 = new Point(105, 110);
        points.push(point3);
        this.points = points;

        let constraints = [];
        let constraint1 = new Constraint(point1, point2, 100);
        constraints.push(constraint1);
        let constraint2 = new Constraint(point1, point3, 100);
        constraints.push(constraint2);
        let constraint3 = new Constraint(point2, point3, 100);
        constraints.push(constraint3);
        this.constraints = constraints;
    }
}



let clothSimulation = new ClothSimulation();
clothSimulation.initialise();
let gravity = {x: 0, y: 100};



let canvas = document.getElementById("cloth-simulation");
let context = canvas.getContext("2d");
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

function renderPoints() {
    for (let point of clothSimulation.points) {
        context.beginPath();
        context.arc(point.x, point.y, 5, 0, Math.PI * 2);
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
    clothSimulation.step(gravity, 0.0167);

    context.clearRect(0, 0, width, height);
    renderPoints();
    renderConstraints();

    requestAnimationFrame(animate);
}

animate();