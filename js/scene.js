export let scene = {
  width: window.innerWidth,
  height: window.innerHeight,

  // Pointer parameters.
  cuttingRadius: 10,

  // Cloth parameters.
  parameters: {
    // General.
    gravity: { x: 0, y: 400 },
    dt: 0.016,
    solverIterations: 8,
    // Constraints.
    snapRatio: 4.0,
    structuralStiffness: 1.0,
    bendStiffness: 0.0,
    shearStiffness: 1.0,
    // Points.
    restitution: 0.9,
    velocityRetention: 0.99,
  },

  // Cloth initialisation parameters.
  clothRows: 30,
  clothColumns: 60,
  spacing: 10,
  startX: 100,
  startY: 100,

  get clothWidth() {
    return (this.clothColumns - 1) * this.spacing;
  },
  get clothHeight() {
    return (this.clothRows - 1) * this.spacing;
  },
  get maxRows() {
    return Math.floor((this.height - this.startY) / this.spacing) + 1;
  },
  get maxColumns() {
    return Math.floor((this.width - this.startX) / this.spacing) + 1;
  },
  get maxSpacing() {
    let maxSpacingX = (this.width - this.startX) / (this.clothColumns - 1);
    let maxSpacingY = (this.height - this.startY) / (this.clothRows - 1);
    return Math.floor(Math.min(maxSpacingX, maxSpacingY));
  },

  clothSimulation: null,
};
