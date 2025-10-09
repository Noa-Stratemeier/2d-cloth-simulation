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
    spacing: 10,
    startX: 100,
    startY: 100,

    get width() {
      return (this.columns - 1) * this.spacing;
    },
    get height() {
      return (this.rows - 1) * this.spacing;
    },
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
      return scene.width - this.width;
    },
    get maxStartY() {
      return scene.height - this.height;
    },
  },

  clothSimulation: null,
};
