import init, { Flock } from '../rust-boids/pkg/rust_boids.js';

let flock;
let canvas;
let ctx;

window.initBoids = async (canvasElement) => {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    
    // Initialize WASM
    await init();
    
    // Create flock
    flock = new Flock(600, canvas.width, canvas.height); // Adjust number based on performance
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Start animation loop
    animate();
};

function resizeCanvas() {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Update flock dimensions
    if (flock) {
        flock.resize(newWidth, newHeight);
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update flock
    flock.update_with_delta(1/60);
    
    // Get positions
    const positions = flock.get_positions();
    
    // Draw boids
    ctx.fillStyle = 'rgba(245, 245, 220, 1.0)';
    for (let i = 0; i < positions.length; i += 2) {
        const x = positions[i];
        const y = positions[i + 1];
        
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 1.2);
        ctx.fill();
    }
    
    requestAnimationFrame(animate);
}