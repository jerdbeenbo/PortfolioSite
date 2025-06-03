import init, { Flock } from '/rust-boids/pkg/rust_boids.js';

let flock;
let canvas;
let ctx;

//lock display fps of boids to 60fps
let lastTime = 0;
const targetFPS = 60; // Adjust this value (lower = slower)
const frameInterval = 1000 / targetFPS;

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

function drawBoidTriangle(ctx, x, y, vx, vy) {
    const length = 4;
    const width = 2;
    
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed < 0.1) return;
    
    const dirX = vx / speed;
    const dirY = vy / speed;
    const perpX = -dirY;
    const perpY = dirX;
    
    // Create gradient based on speed
    const gradient = ctx.createLinearGradient(
        x - dirX * length, y - dirY * length,
        x + dirX * length, y + dirY * length
    );
    
    const alpha = Math.min(speed / 6, 1); // Fade based on speed
    gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.4})`);
    gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);
    
    ctx.fillStyle = gradient;
    
    // Draw triangle
    const tipX = x + dirX * length;
    const tipY = y + dirY * length;
    
    const baseLeftX = x - dirX * (length * 0.3) + perpX * width;
    const baseLeftY = y - dirY * (length * 0.3) + perpY * width;
    
    const baseRightX = x - dirX * (length * 0.3) - perpX * width;
    const baseRightY = y - dirY * (length * 0.3) - perpY * width;
    
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(baseLeftX, baseLeftY);
    ctx.lineTo(baseRightX, baseRightY);
    ctx.closePath();
    ctx.fill();
}

function animate(currentTime) {
    // Limit frame rate
    if (currentTime - lastTime < frameInterval) {
        requestAnimationFrame(animate);
        return;
    }
    lastTime = currentTime;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Use actual delta time for smoother animation
    const deltaTime = frameInterval / 1000; // Convert to seconds
    flock.update_with_delta(deltaTime);
    
    const positions = flock.get_positions();
    const velocities = flock.get_velocities();
    
    ctx.fillStyle = 'rgba(241, 241, 241, 0.93)';
    for (let i = 0; i < positions.length; i += 2) {
        const x = positions[i];
        const y = positions[i + 1];
        const vx = velocities[i];
        const vy = velocities[i + 1];
        
        drawBoidTriangle(ctx, x, y, vx, vy);
    }
    
    requestAnimationFrame(animate);
}

// Start with timestamp
requestAnimationFrame(animate);