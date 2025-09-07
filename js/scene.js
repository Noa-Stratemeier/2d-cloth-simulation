export let scene = {
    width: window.innerWidth,
    height: window.innerHeight,

    // Cloth parameters.
    parameters: {
        // General.
        gravity: {x: 0, y: 400},
        dt: 0.016,
        solverIterations: 8,
        // Constraints.
        snapRatio: 4.0,
        correctionFactor: 0.8,
        // Points.
        restitution: 0.9,
        velocityRetention: 0.99
    }, 

    // Cloth initialisation.
    clothRows: 30,
    clothColumns: 80,
    spacing: 8,
    startX: 100,
    startY: 100,
    
    clothSimulation: null 
}