class CircleObstacle {
  /**
   * @param {number} x - Circle center x-position.
   * @param {number} y - Circle center y-position.
   * @param {number} radius - Circle radius (pixels).
   * @param {number} restitution - Bounce damping factor in [0, 1].
   */
  constructor(x, y, radius, restitution) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.restitution = restitution;
  }

  /**
   * Resolve collision (push outside circle and reflect normal velocity component) of a point with this circle.
   * No update if the point is pinned or outside the circle.
   *
   * @param {Point} point - Point to test and correct.
   */
  collidePoint(point) {
    if (point.isPinned) return;

    let dx = point.x - this.x;
    let dy = point.y - this.y;
    let distance = Math.hypot(dx, dy);

    if (distance >= this.radius || distance === 0) return;

    // Outward normal vector.
    let nx = dx / distance;
    let ny = dy / distance;

    // Project point to the surface of the circle.
    point.x = this.x + nx * this.radius;
    point.y = this.y + ny * this.radius;

    // Reflect normal component of velocity.
    let vx = point.x - point.previousX;
    let vy = point.y - point.previousY;
    let vn = vx * nx + vy * ny;
    vx -= (1 + this.restitution) * vn * nx;
    vy -= (1 + this.restitution) * vn * ny;

    point.previousX = point.x - vx;
    point.previousY = point.y - vy;
  }
}

class Point {
  /**
   * @param {number} x - Initial x-position.
   * @param {number} y - Initial y-position.
   * @param {number} index - Index in the simulation's `points` array (maintained by `ClothSimulation`).
   * @param {boolean} isPinned - If true, the point is immovable.
   */
  constructor(x, y, index, isPinned) {
    this.x = x;
    this.y = y;
    this.previousX = x;
    this.previousY = y;
    this.isPinned = isPinned;
    this.attachedConstraints = 0;
    this.index = index;
  }

  /**
   * Update position using Verlet integration. No update if pinned.
   *
   * @param {Vector2} gravity - Acceleration vector containing a `gravity.x` and `gravity.y` component.
   * @param {number} dt - Time step in seconds.
   * @param {number} velocityRetention - Velocity damping factor in [0, 1].
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

  /**
   * Clamp position to the given bounds and reflect velocity. No update if pinned.
   *
   * @param {number} minX - Left bound.
   * @param {number} maxX - Right bound.
   * @param {number} minY - Top bound.
   * @param {number} maxY - Bottom bound.
   * @param {number} restitution - Bounce damping factor in [0, 1].
   */
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
  SHEAR: "shear",
});

class Constraint {
  /**
   * @param {Point} pointA - First endpoint.
   * @param {Point} pointB - Second endpoint.
   * @param {number} restLength - Target distance between the points (pixels).
   * @param {ConstraintType} type - Constraint type.
   * @param {boolean} hidden - If true, don't render this constraint.
   */
  constructor(pointA, pointB, restLength, type, hidden) {
    this.pointA = pointA;
    this.pointB = pointB;
    this.restLength = restLength;
    this.type = type;
    this.hidden = hidden;
    this.isBroken = false;
  }

  /**
   * Correct for expansion of the distance constraint, optionally correct compression.
   * Marks the constraint as broken if stretched beyond `snapRatio`.
   *
   * @param {number} snapRatio - Max allowed stretch ratio before breaking (> 1).
   * @param {number} stiffness - Constraint correction stiffness in [0, 1].
   * @param {boolean} correctCompression - If true, also correct compression.
   */
  enforce(snapRatio, stiffness, correctCompression) {
    let dx = this.pointB.x - this.pointA.x;
    let dy = this.pointB.y - this.pointA.y;

    let currentLength = Math.hypot(dx, dy);
    if (currentLength <= this.restLength && !correctCompression) return;
    if (currentLength / this.restLength >= snapRatio) {
      this.isBroken = true;
      return;
    }
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
  /**
   * @param {number} width - Simulation domain width (pixels).
   * @param {number} height - Simulation domain height (pixels).
   * @param {object} parameters - Global simulation parameters.
   */
  constructor(width, height, parameters) {
    this.points = [];
    this.constraints = [];
    this.obstacle = null;
    this.width = width;
    this.height = height;
    this.parameters = parameters;
  }

  /**
   * Build a rectangular cloth, optionally pin the top row.
   *
   * @param {number} clothRows - Number of rows.
   * @param {number} clothColumns - Number of columns.
   * @param {number} spacing - Spacing between adjacent points (pixels).
   * @param {number} startX - Top-left x-origin of the cloth.
   * @param {number} startY - Top-left y-origin of the cloth.
   * @param {boolean} pinTopRow - If true, pin all points in the first row.
   */
  initialiseCloth(clothRows, clothColumns, spacing, startX = 0, startY = 0, pinTopRow = true) {
    // Reset cloth.
    this.points.length = 0;
    this.constraints.length = 0;

    let sqrt2 = Math.sqrt(2);
    let index = (r, c) => r * clothColumns + c;

    // Create points.
    for (let row = 0; row < clothRows; row++) {
      for (let column = 0; column < clothColumns; column++) {
        let x = column * spacing + startX;
        let y = row * spacing + startY;
        let isPinned = pinTopRow && row === 0;
        this.addPoint(x, y, index(row, column), isPinned);
      }
    }

    // Create constraints.
    for (let row = 0; row < clothRows; row++) {
      for (let column = 0; column < clothColumns; column++) {
        let point = this.points[index(row, column)];

        // Structural.
        if (column > 0) {
          this.addConstraint(point, this.points[index(row, column - 1)], spacing, ConstraintType.STRUCTURAL);
        }
        if (row > 0) {
          this.addConstraint(point, this.points[index(row - 1, column)], spacing, ConstraintType.STRUCTURAL);
        }

        // Bend.
        if (row >= 2) {
          this.addConstraint(point, this.points[index(row - 2, column)], spacing * 2, ConstraintType.BEND, true);
        }
        if (column >= 2) {
          this.addConstraint(point, this.points[index(row, column - 2)], spacing * 2, ConstraintType.BEND, true);
        }

        // Shear.
        if (column > 0 && row > 0) {
          this.addConstraint(point, this.points[index(row - 1, column - 1)], sqrt2 * spacing, ConstraintType.SHEAR);
        }
        if (column < clothColumns - 1 && row > 0) {
          this.addConstraint(point, this.points[index(row - 1, column + 1)], sqrt2 * spacing, ConstraintType.SHEAR);
        }
      }
    }

    // Initialise the number of constraints attached to each point.
    for (let constraint of this.constraints) {
      constraint.pointA.attachedConstraints++;
      constraint.pointB.attachedConstraints++;
    }
  }

  addPoint(x, y, index, isPinned = false) {
    this.points.push(new Point(x, y, index, isPinned));
  }

  addConstraint(pointA, pointB, restLength, type, hidden = false) {
    this.constraints.push(new Constraint(pointA, pointB, restLength, type, hidden));
  }

  addCircleObstacle(x, y, radius, restitution) {
    this.obstacle = new CircleObstacle(x, y, radius, restitution);
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
        default: // ConstraintType.STRUCTURAL.
          stiffness = structuralStiffness;
      }

      constraint.enforce(snapRatio, stiffness, correctCompression);

      if (constraint.isBroken) {
        // Remove any points that no longer have constraints attached to them.
        if (--constraint.pointA.attachedConstraints === 0) this.removePoint(constraint.pointA);
        if (--constraint.pointB.attachedConstraints === 0) this.removePoint(constraint.pointB);

        // Remove the broken constraint.
        this.constraints[i] = this.constraints[this.constraints.length - 1];
        this.constraints.pop();
      }
    }
  }

  handleCollisions() {
    let { restitution } = this.parameters;
    for (let point of this.points) {
      point.handleBoundaryCollision(0, this.width, 0, this.height, restitution);

      if (this.obstacle) this.obstacle.collidePoint(point);
    }
  }

  step() {
    let { solverIterations } = this.parameters;
    this.updatePointPositions();
    for (let i = 0; i < solverIterations; i++) {
      this.enforceConstraints();
      this.handleCollisions();
    }
  }

  // -----------------------------------------------------------------------------
  // Helper Functions.
  // -----------------------------------------------------------------------------

  /**
   * Removes a point from `points` using swap-and-pop (as order of `points` doesn't matter).
   *
   * @param {Point} point - The point to be removed.
   */
  removePoint(point) {
    let i = point.index;

    this.points[i] = this.points[this.points.length - 1];
    this.points[i].index = i;
    this.points.pop();
  }
}
