// Import the wasm modules
import initSand, {
  wasm_bridge_init as sand_init,
  wasm_bridge_update as sand_update,
  add_sand,
} from "/rust-sand/pkg/rust_sand.js";

import init, {
  wasm_bridge_init as gol_init,
  wasm_bridge_update as gol_update,
  add_cell,
  get_current_state,
} from "/rust-gol/pkg/wasm_gameoflife.js";

// Seperate variables to avoid requestframeupdate() artifacting
let sandCanvas, sandCtx, sandAnimationId = null;
let golCanvas, golCtx, golAnimationId = null;

const cellSize = 4;

// Sand simulation variables
let sandLastTime = 0, sandInterval = 1000 / 45, sandMouseDown = false;

// Game of Life variables  
let golLastTime = 0, golInterval = 1000 / 30, golMouseDown = false, isPaused = false;

// SAND ANIMATION
function animateSand(currentTime) {
  if (currentTime - sandLastTime >= sandInterval) {
    const data = sand_update();
    window.currentSandData = data;
    sandLastTime = currentTime;
  }

  if (window.currentSandData) {
    sandCtx.clearRect(0, 0, sandCanvas.width, sandCanvas.height);
    for (let i = 0; i < window.currentSandData.active_particles.length; i++) {
      const [row, col] = window.currentSandData.active_particles[i];
      const x = col * cellSize;
      const y = row * cellSize;
      sandCtx.fillStyle = "yellow";
      sandCtx.fillRect(x, y, cellSize, cellSize);
    }
  }

  sandAnimationId = requestAnimationFrame(animateSand); //store the ID for cancelling later
}

// GAME OF LIFE ANIMATION
function animateGol(currentTime) {
  if (!isPaused && currentTime - golLastTime >= golInterval) {
    const data = gol_update();
    window.currentGolData = data;
    golLastTime = currentTime;
  }

  if (window.currentGolData) {
    golCtx.clearRect(0, 0, golCanvas.width, golCanvas.height);
    for (let i = 0; i < window.currentGolData.active_particles.length; i++) {
      const [row, col] = window.currentGolData.active_particles[i];
      const x = col * cellSize;
      const y = row * cellSize;
      golCtx.fillStyle = "red";
      golCtx.fillRect(x, y, cellSize, cellSize);
    }
  }

  golAnimationId = requestAnimationFrame(animateGol); //store the ID for cancelling later
}

// SAND INITIALISATION
window.initSand = async (canvasElement) => {
  try {
    // CANCEL ANY EXISTING SAND ANIMATION
    if (sandAnimationId) {
      cancelAnimationFrame(sandAnimationId);
      sandAnimationId = null;
    }

    await initSand();
    sand_init();

    sandCanvas = canvasElement;
    if (sandCanvas) {
      sandCtx = sandCanvas.getContext("2d");
      sandCanvas.width = 300;
      sandCanvas.height = 500;
      sandCtx.clearRect(0, 0, sandCanvas.width, sandCanvas.height);

      setupSandMouseInput();
      animateSand(); // Start animation
    }
  } catch (error) {
    console.error("Error initializing sand simulation:", error);
  }
};

// GAME OF LIFE INITIALISATION
window.initgol = async (canvasElement) => {
  try {
    // CANCEL ANY EXISTING GOL ANIMATION
    if (golAnimationId) {
      cancelAnimationFrame(golAnimationId);
      golAnimationId = null;
    }

    await init();
    gol_init();

    golCanvas = canvasElement;
    if (golCanvas) {
      golCtx = golCanvas.getContext("2d");
      golCanvas.width = 300;
      golCanvas.height = 500;
      golCtx.clearRect(0, 0, golCanvas.width, golCanvas.height);

      setupGolMouseInput();
      animateGol(); // Start animation
    }
  } catch (error) {
    console.error("Error initializing game of life:", error);
  }
};

// SAND MOUSE HANDLING
function setupSandMouseInput() {
  sandCanvas.addEventListener("mousedown", (event) => {
    sandMouseDown = true;
    addSandAtMouse(event);
  });
  
  sandCanvas.addEventListener("mousemove", (event) => {
    if (sandMouseDown) {
      addSandAtMouse(event);
    }
  });
}

function addSandAtMouse(event) {
  const rect = sandCanvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  const col = Math.floor(mouseX / cellSize);
  const row = Math.floor(mouseY / cellSize);

  try {
    add_sand(row, col);
  } catch (error) {
    console.error("Error adding sand:", error);
  }
}

// GAME OF LIFE MOUSE HANDLING
function setupGolMouseInput() {
  golCanvas.addEventListener("mousedown", (event) => {
    golMouseDown = true;
    isPaused = true;
    addCellAtMouse(event);
  });
  
  golCanvas.addEventListener("mousemove", (event) => {
    if (golMouseDown) {
      addCellAtMouse(event);
    }
  });
}

function addCellAtMouse(event) {
  const rect = golCanvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  const col = Math.floor(mouseX / cellSize);
  const row = Math.floor(mouseY / cellSize);

  add_cell(row, col);

  if (isPaused) {
    const data = get_current_state();
    window.currentGolData = data;
  }
}

// GLOBAL MOUSE UP
document.addEventListener("mouseup", () => {
  sandMouseDown = false;
  golMouseDown = false;
  isPaused = false;
});

// CLEANUP FUNCTIONS (optional, for manual cleanup)
window.cleanupSand = () => {
  if (sandAnimationId) {
    cancelAnimationFrame(sandAnimationId);
    sandAnimationId = null;
  }
};

window.cleanupGol = () => {
  if (golAnimationId) {
    cancelAnimationFrame(golAnimationId);
    golAnimationId = null;
  }
};