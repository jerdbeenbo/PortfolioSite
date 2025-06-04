// Import the wasm module
import init, {
  wasm_bridge_init,
  wasm_bridge_update,
  add_sand,
} from "/rust-sand/pkg/rust_sand.js";

let homeCanvasAnimation = null;

let canvas, ctx;
const cellSize = 4;

let lastSimulationTime = 0;
const simulationInterval = 1000 / 45; // Run simulation 30 times per second (main priority boids)
function animate(currentTime) {
  // Only run simulation if enough time has passed
  if (currentTime - lastSimulationTime >= simulationInterval) {
    const data = wasm_bridge_update();

    // Store the latest simulation data
    window.currentSimulationData = data;
    lastSimulationTime = currentTime;
  }

  // Draw at 15fps using the latest simulation data
  if (window.currentSimulationData) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (
      let i = 0;
      i < window.currentSimulationData.active_particles.length;
      i++
    ) {
      const [row, col] = window.currentSimulationData.active_particles[i];
      const x = col * cellSize;
      const y = row * cellSize;

      ctx.fillStyle = "yellow";
      ctx.fillRect(x, y, cellSize, cellSize);
    }
  }

  requestAnimationFrame(animate);
}

window.initSand = async (canvasElement) => {

  try {
    await init();

    wasm_bridge_init();

    canvas = canvasElement;

    if (canvas) {
      console.log("Canvas found:", canvas);
      ctx = canvas.getContext("2d");

      canvas.width = 300;
      canvas.height = 500;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      setupMouseInput();

      animate();
    } else {
      console.error("Canvas not found!");
    }
  } catch (error) {
    console.error("Error initializing sand simulation:", error);
  }
};

function setupMouseInput() {
  canvas.addEventListener("mousedown", (event) => {
    console.log("Mouse down detected!");
    handleMouse(event);
  });

  canvas.addEventListener("mousemove", (event) => {
    if (isMouseDown) {
      console.log("Mouse drag detected!");
      handleMouseMove(event);
    }
  });
}

let isMouseDown = false;

function handleMouse(event) {
  isMouseDown = true;
  addSandAtMouse(event);
}

function handleMouseMove(event) {
  if (isMouseDown) {
    addSandAtMouse(event);
  }
}

// Stop drawing when mouse is released
document.addEventListener("mouseup", () => {
  isMouseDown = false;
});

function addSandAtMouse(event) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const col = Math.floor(mouseX / cellSize);
  const row = Math.floor(mouseY / cellSize);

  console.log(
    `Mouse click at: (${mouseX}, ${mouseY}) -> Grid: (${row}, ${col})`
  );

  try {
    const result = add_sand(row, col);
    console.log("Sand added successfully:", result);
  } catch (error) {
    console.error("Error adding sand:", error);
  }
}
