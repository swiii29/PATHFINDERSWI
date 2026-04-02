// ================= GLOBAL =================
let mode = "BUILD";

let grid = [];
let cols = 20;
let rows = 20;
let size = 30;

let startCell = null;
let endCell = null;

let path = [];
let cars = [];
let pathProgress = 0;
// ================= TOGGLE MODE =================
function toggleMode() {
  mode = (mode === "BUILD") ? "PATH" : "BUILD";

  document.getElementById("modeLabel").innerText = "Mode: " + mode;

  // reset selections
  startCell = null;
  endCell = null;
  path = [];
  cars = [];
}
// ================= TILES =================
const TILES = ["LAND", "WATER", "ROAD", "TREE"];

const RULES = {
  LAND: ["LAND", "TREE", "ROAD", "WATER"],
  WATER: ["WATER"],
  ROAD: ["ROAD", "LAND"],
  TREE: ["LAND", "TREE"]
};

// ================= SETUP =================
function setup() {
  let canvas = createCanvas(cols * size, rows * size);
  canvas.parent("canvasContainer"); // IMPORTANT

  noiseSeed(99);

  resetGrid();
}

// ================= RESET =================
function resetGrid() {
  grid = [];

  for (let i = 0; i < cols * rows; i++) {
    grid[i] = new Cell(TILES);
  }

  // collapse all cells
  for (let i = 0; i < cols * rows; i++) {
    let cell = findLowestEntropy();
    if (!cell) break;
    cell.collapse();
    propagate();
  }

  path = [];
  cars = [];
  startCell = null;
  endCell = null;
}

// ================= DRAW =================
function draw() {
  background(245, 240, 230); // FIXED LIGHT BG

  drawGrid();

  // moving packet
  if (path.length > 0) {
    pathProgress += 0.2;

    let index = floor(pathProgress % path.length);
    let cell = path[index];

    let x = (cell % cols) * size + size / 2;
    let y = floor(cell / cols) * size + size / 2;

    fill(255, 200, 0);
    noStroke();
    ellipse(x, y, 15);
  }

  // cars
  for (let car of cars) {
    car.update();
    car.draw();
  }

  updateStats();
}

// ================= ENTROPY =================
function findLowestEntropy() {
  let min = Infinity;
  let choices = [];

  for (let cell of grid) {
    if (!cell.collapsed) {
      if (cell.options.length < min) {
        min = cell.options.length;
        choices = [cell];
      } else if (cell.options.length === min) {
        choices.push(cell);
      }
    }
  }

  if (choices.length === 0) return null;
  return random(choices);
}

// ================= PROPAGATE =================
function propagate() {
  for (let i = 0; i < grid.length; i++) {
    let cell = grid[i];

    if (!cell.collapsed) continue;

    let neighbors = getNeighbors(i);

    for (let neighbor of neighbors) {
      if (!neighbor || neighbor.collapsed) continue;

      let current = cell.options[0];

      let valid = neighbor.options.filter(option => {
        return RULES[current].includes(option);
      });

      neighbor.options = valid;

      if (neighbor.options.length === 0) {
        return;
      }
    }
  }
}

// ================= NEIGHBORS =================
function getNeighbors(index) {
  let neighbors = [];

  let x = index % cols;
  let y = floor(index / cols);

  if (y > 0) neighbors.push(grid[index - cols]);
  if (y < rows - 1) neighbors.push(grid[index + cols]);
  if (x > 0) neighbors.push(grid[index - 1]);
  if (x < cols - 1) neighbors.push(grid[index + 1]);

  return neighbors;
}

// ================= ROAD CONNECTION =================
function getRoadConnections(i) {
  let c = { top: false, bottom: false, left: false, right: false };

  let x = i % cols;
  let y = floor(i / cols);

  if (y > 0 && grid[i - cols].options[0] === "ROAD") c.top = true;
  if (y < rows - 1 && grid[i + cols].options[0] === "ROAD") c.bottom = true;
  if (x > 0 && grid[i - 1].options[0] === "ROAD") c.left = true;
  if (x < cols - 1 && grid[i + 1].options[0] === "ROAD") c.right = true;

  return c;
}

// ================= DRAW GRID =================
function drawGrid() {
  for (let i = 0; i < grid.length; i++) {

    let x = (i % cols) * size;
    let y = floor(i / cols) * size;
    let cell = grid[i];

    noStroke();

    if (!cell.collapsed) {
      fill(220);
      rect(x, y, size, size);
      continue;
    }

    let type = cell.options[0];

    // LAND
    if (type === "LAND") {
      let n = noise(i * 0.1, frameCount * 0.01);
      fill(200 + n * 20, 220 + n * 10, 180);
      rect(x, y, size, size, 6);
    }

    // WATER
    else if (type === "WATER") {
      fill(120, 170, 210);
      rect(x, y, size, size, 6);

      stroke(100, 150, 220, 120); // transparency

for (let j = 0; j < size; j += 6) {
  let wave = sin(frameCount * 0.15 + i * 0.4 + j * 0.3) * 3;
  line(x, y + j + wave, x + size, y + j + wave);
}
      noStroke();
    }

    // ROAD
    else if (type === "ROAD") {
      fill(110, 100, 90);
      rect(x, y, size, size, 6);

      let c = getRoadConnections(i);

      stroke(240);
      strokeWeight(3);

      if (c.top) line(x + size/2, y, x + size/2, y + size/2);
      if (c.bottom) line(x + size/2, y + size/2, x + size/2, y + size);
      if (c.left) line(x, y + size/2, x + size/2, y + size/2);
      if (c.right) line(x + size/2, y + size/2, x + size, y + size/2);

      noStroke();
    }

    // TREE
    else if (type === "TREE") {
      fill(200, 220, 180);
      rect(x, y, size, size, 6);

      let sway = sin(frameCount * 0.1 + i) * 2;

      fill(70, 140, 80);
      ellipse(x + size/2 + sway, y + size/2, size * 0.6);

      fill(90, 60, 30);
      rect(x + size/2 - 2, y + size/2, 4, 8);
    }

    // PATH
    if (path.includes(i)) {
      fill(255, 0, 0, 120);
      rect(x, y, size, size, 6);
    }

    // START
    if (i === startCell) {
      fill(0, 200, 0);
      ellipse(x + size/2, y + size/2, 10);
    }

    // END
    if (i === endCell) {
      fill(200, 0, 0);
      ellipse(x + size/2, y + size/2, 10);
    }
  }
}

// ================= MOUSE =================
function mousePressed() {
  let x = floor(mouseX / size);
  let y = floor(mouseY / size);
  let index = x + y * cols;

  if (!grid[index]) return;

  // 🏗️ BUILD MODE
  if (mode === "BUILD") {
    let selected = document.getElementById("mode").value;

    grid[index].options = [selected];
    grid[index].collapsed = true;

    propagate();
  }

  // 🧭 PATH MODE
  else if (mode === "PATH") {
    if (startCell === null) {
      startCell = index;
    } 
    else if (endCell === null) {
      endCell = index;
    } 
    else {
      // reset selection
      startCell = index;
      endCell = null;
      path = [];
    }
  }
}

// ================= PATHFIND =================
function findPath() {
    let roadCost = parseInt(document.getElementById("roadCost").value);
  let landCost = parseInt(document.getElementById("landCost").value);
  let waterCost = parseInt(document.getElementById("waterCost").value);
  path = [];
  cars = [];

  if (startCell === null || endCell === null) {
    alert("Select start and end!");
    return;
  }

  let openSet = [startCell];
  let cameFrom = {};

  let gScore = {};
  let fScore = {};

  for (let i = 0; i < grid.length; i++) {
    gScore[i] = Infinity;
    fScore[i] = Infinity;
  }

  gScore[startCell] = 0;
  fScore[startCell] = heuristic(startCell, endCell);

  while (openSet.length > 0) {
    let current = openSet.reduce((a, b) =>
      fScore[a] < fScore[b] ? a : b
    );

    if (current === endCell) {
      reconstructPath(cameFrom, current);
      cars.push(new Car(path));
      return;
    }

    openSet = openSet.filter(x => x !== current);

    for (let neighbor of getNeighbors(current)) {
      let idx = grid.indexOf(neighbor);
      if (!neighbor.collapsed) continue;

      let terrain = neighbor.options[0];

      let cost;
      if (terrain === "ROAD") cost = roadCost;
else if (terrain === "LAND") cost = landCost;
else if (terrain === "WATER") cost = waterCost;
else continue;

      let temp = gScore[current] + cost;

      if (temp < gScore[idx]) {
        cameFrom[idx] = current;
        gScore[idx] = temp;
        fScore[idx] = temp + heuristic(idx, endCell);

        if (!openSet.includes(idx)) openSet.push(idx);
      }
    }
  }

  alert("No path!");
}

// ================= HEURISTIC =================
function heuristic(a, b) {
  let x1 = a % cols;
  let y1 = floor(a / cols);
  let x2 = b % cols;
  let y2 = floor(b / cols);

  return abs(x1 - x2) + abs(y1 - y2);
}

// ================= PATH =================
function reconstructPath(cameFrom, current) {
  path = [current];

  let totalCost = 0;

  while (cameFrom[current] !== undefined) {
    let prev = cameFrom[current];

    let terrain = grid[current].options[0];

    let roadCost = parseInt(document.getElementById("roadCost").value);
    let landCost = parseInt(document.getElementById("landCost").value);
    let waterCost = parseInt(document.getElementById("waterCost").value);

    if (terrain === "ROAD") totalCost += roadCost;
    else if (terrain === "LAND") totalCost += landCost;
    else if (terrain === "WATER") totalCost += waterCost;

    current = prev;
    path.push(current);
  }

  // ✅ DISPLAY COST
  document.getElementById("totalCost").innerText = totalCost;
}

// ================= CAR =================
class Car {
  constructor(path) {
    this.path = path;
    this.index = 0;
    this.speed = 0.05;
  }

  update() {
  let i = floor(this.index);
  let cell = this.path[i];

  let terrain = grid[cell].options[0];

  if (terrain === "WATER") {
    this.index += this.speed * 0.6; // 🚤 slower
  } else {
    this.index += this.speed; // 🚗 normal
  }

  if (this.index >= this.path.length) this.index = 0;
}

 draw() {
  let i = floor(this.index);
  let cell = this.path[i];

  let x = (cell % cols) * size + size / 2;
  let y = floor(cell / cols) * size + size / 2;

  let terrain = grid[cell].options[0];

  if (terrain === "WATER") {
    // 🚤 BOAT
    fill(80, 80, 200);
    rect(x - 6, y - 4, 12, 8, 3);

    fill(255);
    triangle(x, y - 6, x, y + 6, x + 6, y);
  } else {
    // 🚗 CAR
    fill(255, 200, 0);
    ellipse(x, y, 10);
  }
}
}

// ================= STATS =================
function updateStats() {
  let road = 0, tree = 0, water = 0;

  for (let cell of grid) {
    if (!cell.collapsed) continue;

    let t = cell.options[0];

    if (t === "ROAD") road++;
    if (t === "TREE") tree++;
    if (t === "WATER") water++;
  }

  document.getElementById("carCount").innerText = cars.length;
  document.getElementById("roadCount").innerText = road;
  document.getElementById("treeCount").innerText = tree;
  document.getElementById("waterCount").innerText = water;
}