export let scene = {
  width: window.innerWidth,
  height: window.innerHeight,

  cuttingRadius: 10,

  simulation: {
    gravity: { x: 0, y: 400 },
    dt: 0.016,
    solverIterations: 8,
    snapRatio: 4.0,
    structuralStiffness: 1.0,
    bendStiffness: 0.0,
    shearStiffness: 1.0,
    restitution: 0.9,
    velocityRetention: 0.99,
  },

  cloth: {
    rows: 30,
    columns: 60,
    spacing: 12,
    startX: 0,
    startY: 0,

    get maxRows() {
      return Math.floor((scene.height - this.startY) / this.spacing) + 1;
    },
    get maxColumns() {
      return Math.floor((scene.width - this.startX) / this.spacing) + 1;
    },
    get maxSpacing() {
      let maxSpacingX = (scene.width - this.startX) / (this.columns - 1);
      let maxSpacingY = (scene.height - this.startY) / (this.rows - 1);
      return Math.floor(Math.min(maxSpacingX, maxSpacingY));
    },
    get maxStartX() {
      let clothWidth = (this.columns - 1) * this.spacing;
      return scene.width - clothWidth;
    },
    get maxStartY() {
      let clothHeight = (this.rows - 1) * this.spacing;
      return scene.height - clothHeight;
    },
  },

  obstacle: {
    x: 0,
    y: 0,
    radius: 50,
    restitution: 1.0,
  },

  clothSimulation: null,
};

// Fit the cloth to the screen size.
scene.cloth.spacing = Math.min(scene.cloth.spacing, scene.cloth.maxSpacing);
scene.cloth.startX = Math.floor(scene.cloth.maxStartX * 0.5); // Centre cloth horizontally.
scene.cloth.startY = Math.floor(scene.cloth.maxStartY * 0.25); // Position cloth one-quarter down canvas from top.

// Position the obstacle.
scene.obstacle.x = Math.floor(scene.width * 0.5);
scene.obstacle.y = Math.floor(scene.height * 0.75);
