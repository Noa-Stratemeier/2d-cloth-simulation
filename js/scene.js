export let scene = {
    width: window.innerWidth,
    height: window.innerHeight,

    // Pointer parameters.
    cuttingRadius: 10,

    // Cloth parameters.
    parameters: {
        // General.
        gravity: {x: 0, y: 400},
        dt: 0.016,
        solverIterations: 8,
        // Constraints.
        snapRatio: 4.0,
        structuralStiffness: 1.0,
        bendStiffness: 0.0,
        shearStiffness: 1.0,
        // Points.
        restitution: 0.9,
        velocityRetention: 0.99
    }, 

    // Cloth initialisation parameters.
    clothRows: 30,
    clothColumns: 60,
    spacing: 10,
    startX: 100,
    startY: 100,

    get clothWidth() { return (this.clothColumns - 1) * this.spacing; },
    get clothHeight() { return (this.clothRows - 1) * this.spacing; },

    clothSimulation: null 
}