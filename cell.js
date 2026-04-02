class Cell {
  constructor(options) {
    this.collapsed = false;
    this.options = options.slice(); // copy of all possible tiles
  }

  collapse() {
    // Already collapsed → do nothing
    if (this.collapsed) return;

    // ⚠️ Safety check (very important)
    if (!this.options || this.options.length === 0) {
      console.error("Cell has no options!", this);
      return;
    }

    // 🎯 Weights (controls probability)
    let weights = {
      LAND: 50,
      ROAD: 30,
      TREE: 15,
      WATER: 5
    };

    let pool = [];

    // Build weighted pool
    for (let opt of this.options) {
      let weight = weights[opt] || 1; // fallback safety

      for (let i = 0; i < weight; i++) {
        pool.push(opt);
      }
    }

    // ⚠️ Extra safety check
    if (pool.length === 0) {
      console.error("Empty pool! Options were:", this.options);
      return;
    }

    // 🎲 Random selection
    let choice = random(pool);

    // Collapse to chosen tile
    this.options = [choice];
    this.collapsed = true;
  }
}