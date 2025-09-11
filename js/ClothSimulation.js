/**
* Point used by the cloth solver.
*/
class Point {
    /**
     * @param {number} x - Initial x-position.
     * @param {number} y - Initial y-position.
     * @param {number} index - Index in the simulation's points array (maintained by `ClothSimulation`).
     * @param {boolean} [isPinned=false] - If true, the point is immovable. 
     */
    constructor(x, y, index, isPinned = false) {
        this.x = x;
        this.y = y;
        this.previousX = x;
        this.previousY = y;
        this.isPinned = isPinned;

        this.attachedConstraints = 0;
        this.index = index;
    }

    /**
     * Update position using Verlet integration, no update occurs if the point is pinned.
     * 
     * @param {Vector2} gravity - Acceleration vector containing a `gravity.x` and `gravity.y` component.
     * @param {number} dt - Time step in seconds.
     * @param {number} velocityRetention - Velocity damping factor between [0, 1].
     */
    updatePosition(gravity, dt, velocityRetention) {
        if (this.isPinned) return;

        let xVelocity = (this.x - this.previousX) * velocityRetention;
        let yVelocity = (this.y - this.previousY) * velocityRetention;
        this.previousX = this.x;
        this.previousY = this.y;
        this.x += xVelocity + gravity.x * dt * dt;
        this.y += yVelocity + gravity.y * dt * dt;
    }

    handleBoundaryCollision(minX, maxX, minY, maxY, restitution) {
        if (this.isPinned) return;

        let xVelocity = this.x - this.previousX;
        let yVelocity = this.y - this.previousY;

        if (this.x < minX) {
            this.x = minX;
            this.previousX = this.x + xVelocity * restitution;
        }
        if (this.x > maxX) {
            this.x = maxX;
            this.previousX = this.x + xVelocity * restitution;
        }
        if (this.y < minY) {
            this.y = minY;
            this.previousY = this.y + yVelocity * restitution;
        }
        if (this.y > maxY) {
            this.y = maxY;
            this.previousY = this.y + yVelocity * restitution;
        }
    }
}





const ConstraintType = Object.freeze({
    STRUCTURAL: "structural",
    BEND: "bend",
    SHEAR: "shear"
});

class Constraint {
    constructor(pointA, pointB, restLength, type = ConstraintType.STRUCTURAL, hidden = false) {
        this.pointA = pointA;
        this.pointB = pointB;
        this.restLength = restLength;
        this.type = type;
        this.hidden = hidden;
        this.isBroken = false;
    }

    enforce(snapRatio, stiffness, correctCompression) {
        let dx = this.pointB.x - this.pointA.x;
        let dy = this.pointB.y - this.pointA.y;

        let currentLength = Math.hypot(dx, dy);
        if (currentLength <= this.restLength && !correctCompression) return;
        if (currentLength / this.restLength >= snapRatio) { this.isBroken = true; return; }
        if (currentLength === 0.0) return;

        let relativeDifference = (this.restLength - currentLength) / currentLength;

        let weightA = this.pointA.isPinned ? 0 : 1;
        let weightB = this.pointB.isPinned ? 0 : 1;
        let weightSum = weightA + weightB;
        if (weightSum === 0) return;

        let correctionShareForPointA = relativeDifference * (weightA / weightSum) * stiffness;
        let correctionShareForPointB = relativeDifference * (weightB / weightSum) * stiffness;

        this.pointA.x -= dx * correctionShareForPointA;
        this.pointA.y -= dy * correctionShareForPointA;
        this.pointB.x += dx * correctionShareForPointB;
        this.pointB.y += dy * correctionShareForPointB;
    }
}





export default class ClothSimulation {
    constructor(width, height, parameters) {
        this.points = [];
        this.constraints = [];

        this.width = width;
        this.height = height;

        this.parameters = parameters;
    }

    initialiseCloth(clothRows, clothColumns, spacing, startX = 0, startY = 0, pinTopRow = true) {
        let rowColumnToIndex = (r, c) => r * clothColumns + c;
        let sqrt2 = Math.sqrt(2);

        // Initialise points in a rectangular grid of size clothRows * clothColumns.
        for (let row = 0; row < clothRows; row++) {
            for (let column = 0; column < clothColumns; column++) {
                let i = rowColumnToIndex(row, column);
                let x = column * spacing + startX;
                let y = row * spacing + startY;
                let isPinned = pinTopRow && row === 0;
                let point = new Point(x, y, i, isPinned);
                this.points.push(point);

                // Structural constraints.
                if (column > 0) {
                    this.constraints.push(new Constraint(point, this.points[rowColumnToIndex(row, column - 1)], spacing, ConstraintType.STRUCTURAL));
                }
                if (row > 0) {
                    this.constraints.push(new Constraint(point, this.points[rowColumnToIndex(row - 1, column)], spacing, ConstraintType.STRUCTURAL));
                }

                // Bend constraints.
                if (row >= 2) {
                    this.constraints.push(new Constraint(point, this.points[rowColumnToIndex(row - 2, column)], spacing * 2, ConstraintType.BEND, true));
                }
                if (column >= 2) {
                    this.constraints.push(new Constraint(point, this.points[rowColumnToIndex(row, column - 2)], spacing * 2, ConstraintType.BEND, true));
                }

                // Shear constraints.
                if (column > 0 && row > 0) {
                    this.constraints.push(new Constraint(point, this.points[rowColumnToIndex(row - 1, column - 1)], sqrt2 * spacing, ConstraintType.SHEAR));
                }
                if (column < clothColumns - 1 && row > 0) {
                    this.constraints.push(new Constraint(point, this.points[rowColumnToIndex(row - 1, column + 1)], sqrt2 * spacing, ConstraintType.SHEAR));
                }
            }
        }

        for (let constraint of this.constraints) { 
            constraint.pointA.attachedConstraints++; 
            constraint.pointB.attachedConstraints++; 
        }
    }

    updatePointPositions() {
        let { gravity, dt, velocityRetention } = this.parameters;
        for (let point of this.points) {
            point.updatePosition(gravity, dt, velocityRetention);
        }
    }

    enforceConstraints() {
        let { snapRatio, structuralStiffness, bendStiffness, shearStiffness } = this.parameters;
        for (let i = this.constraints.length - 1; i >= 0; i--) {
            let constraint = this.constraints[i];
            
            let stiffness;
            let correctCompression = false;
            switch (constraint.type) {
                case ConstraintType.BEND:
                    stiffness = bendStiffness;
                    correctCompression = true;
                    break;
                case ConstraintType.SHEAR:
                    stiffness = shearStiffness;
                    break;
                default:  // ConstraintType.STRUCTURAL.
                    stiffness = structuralStiffness;
            }

            constraint.enforce(snapRatio, stiffness, correctCompression);

            if (constraint.isBroken) {
                // Remove any points that no longer have constraints attached to them.
                if (--constraint.pointA.attachedConstraints === 0) this.removePoint(constraint.pointA);
                if (--constraint.pointB.attachedConstraints === 0) this.removePoint(constraint.pointB);

                // Swap-pop: remove the broken constraint.
                this.constraints[i] = this.constraints[this.constraints.length - 1];
                this.constraints.pop();
            }
        }
    }

    handleBoundaryCollisions() {
        let { restitution } = this.parameters;
        for (let point of this.points) {
            point.handleBoundaryCollision(0, this.width, 0, this.height, restitution);
        } 
    }

    step() {
        let { solverIterations } = this.parameters;
        this.updatePointPositions();
        for (let i = 0; i < solverIterations; i++) {
            this.enforceConstraints();
            this.handleBoundaryCollisions();
        }
    }

    // -----------------------------------------------------------------------------
    // Helper Functions.
    // -----------------------------------------------------------------------------

    removePoint(point) {
        let i = point.index;
        let iLast = this.points.length - 1;

        if (i !== iLast) {
            let q = this.points[iLast];
            this.points[i] = q;
            q.index = i;
        }
        this.points.pop();
    }
}