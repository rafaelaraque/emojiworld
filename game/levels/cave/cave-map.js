/**
 * Cave Metroidvania Map Definition
 * =================================
 * Complete tilemap + entity placement for the cave level.
 * The map is loaded once at init — NO dynamic generation.
 *
 * Tile IDs:
 *   0 = AIR (empty, passable)
 *   1 = STONE (solid rock)
 *   2 = PLATFORM (one-way, solid from above)
 *   3 = BRICK (destructible wall)
 *   4 = ABYSS (deadly pit)
 *   5 = DECO_STALACTITE (cosmetic, no collision)
 *   6 = EXIT_TILE (level exit)
 */

const TILE = {
  AIR: 0,
  STONE: 1,
  PLATFORM: 2,
  BRICK: 3,
  ABYSS: 4,
  STALACTITE: 5,
  EXIT: 6
};

const TILE_SIZE = 32;
const MAP_COLS = 160;   // 5120 px wide
const MAP_ROWS = 100;   // 3200 px tall

// ─── Build map programmatically ────────────────────────────
function buildMap() {
  // Initialize everything as STONE (solid)
  const map = [];
  for (let r = 0; r < MAP_ROWS; r++) {
    map[r] = new Uint8Array(MAP_COLS);
    map[r].fill(TILE.STONE);
  }

  // Helper: carve a rectangle of AIR
  function carve(x1, y1, x2, y2) {
    for (let r = Math.max(0, y1); r <= Math.min(MAP_ROWS - 1, y2); r++)
      for (let c = Math.max(0, x1); c <= Math.min(MAP_COLS - 1, x2); c++)
        map[r][c] = TILE.AIR;
  }

  // Helper: place tiles in a rect
  function fill(x1, y1, x2, y2, tile) {
    for (let r = Math.max(0, y1); r <= Math.min(MAP_ROWS - 1, y2); r++)
      for (let c = Math.max(0, x1); c <= Math.min(MAP_COLS - 1, x2); c++)
        map[r][c] = tile;
  }

  // Helper: place a single-row platform
  function plat(x, y, len) {
    fill(x, y, x + len - 1, y, TILE.PLATFORM);
  }

  // Helper: place brick wall segment
  function brick(x, y, w, h) {
    fill(x, y, x + w - 1, y + h - 1, TILE.BRICK);
  }

  // ═══════════════════════════════════════════════
  //  ZONA 1 — INICIO (spawn, tutorial area)
  //  Rows 80–97, Cols 2–40
  // ═══════════════════════════════════════════════
  carve(2, 78, 42, 96);    // Main starting chamber
  fill(2, 97, 42, 98, TILE.STONE);  // Floor

  // Small platforms in the starting area
  plat(6, 90, 4);
  plat(14, 87, 4);
  plat(22, 84, 4);
  plat(30, 88, 5);

  // ═══════════════════════════════════════════════
  //  CORREDOR HORIZONTAL PRINCIPAL (izq → der)
  //  Rows 70–80, Cols 2–155
  // ═══════════════════════════════════════════════
  carve(2, 68, 155, 79);   // Main horizontal tunnel
  fill(2, 80, 155, 81, TILE.STONE);  // Floor of main tunnel

  // Connection from starting zone up to main tunnel
  carve(18, 68, 28, 82);  // vertical connector

  // ═══════════════════════════════════════════════
  //  ZONA 2 — TÚNEL IZQUIERDO (arañas, fuegos)
  //  Rows 50–70, Cols 2–50
  // ═══════════════════════════════════════════════
  carve(2, 48, 48, 68);   // Left cavern
  fill(2, 69, 48, 69, TILE.STONE);  // Floor

  // Connection down to main tunnel
  carve(10, 68, 18, 72);  // vertical connector left

  // Platforms in left zone
  plat(6, 62, 5);
  plat(16, 58, 4);
  plat(28, 55, 5);
  plat(38, 60, 4);
  plat(10, 52, 4);
  plat(22, 50, 5);
  plat(42, 53, 4);

  // Brick walls in left zone
  brick(32, 48, 1, 21);  // Breakable barrier (full height)
  brick(20, 48, 1, 21);  // Another barrier (full height)

  // ═══════════════════════════════════════════════
  //  ABISMO (deadly pit in main tunnel)
  //  Rows 76–98, Cols 52–65 (width 14)
  // ═══════════════════════════════════════════════
  fill(52, 76, 65, 98, TILE.ABYSS);
  // Clear the floor tiles above the abyss so it's a real gap
  carve(52, 68, 65, 79);
  fill(52, 76, 65, 98, TILE.ABYSS);

  // ═══════════════════════════════════════════════
  //  ZONA 3 — CUEVAS CENTRALES (post-abismo)
  //  Rows 50–80, Cols 64–110
  // ═══════════════════════════════════════════════
  carve(64, 50, 108, 79);  // Central cavern
  fill(64, 80, 108, 81, TILE.STONE);

  // Platforms in central zone
  plat(68, 74, 5);
  plat(80, 70, 4);
  plat(90, 66, 5);
  plat(72, 64, 4);
  plat(100, 60, 5);
  plat(84, 58, 4);
  plat(76, 54, 5);
  plat(96, 54, 4);

  // Connection up to right zone
  carve(100, 42, 108, 52);

  // Brick walls in central zone
  brick(88, 50, 1, 30);  // Full height barrier

  // ═══════════════════════════════════════════════
  //  ZONA 4 — ZONA DERECHA (murciélagos, cristales)
  //  Rows 32–52, Cols 100–150
  // ═══════════════════════════════════════════════
  carve(100, 30, 150, 50);
  fill(100, 51, 150, 52, TILE.STONE);

  // Platforms in right zone
  plat(104, 46, 4);
  plat(116, 42, 5);
  plat(128, 38, 4);
  plat(140, 44, 5);
  plat(110, 36, 4);
  plat(124, 34, 5);
  plat(136, 40, 4);
  plat(146, 34, 4);

  // Brick walls in right zone
  brick(120, 30, 1, 21);
  brick(142, 30, 1, 21);

  // ═══════════════════════════════════════════════
  //  ZONA 5 — ZONA SUPERIOR (plataformas altas, salida)
  //  Rows 8–32, Cols 50–130
  // ═══════════════════════════════════════════════
  carve(50, 6, 130, 30);
  fill(50, 31, 130, 32, TILE.STONE);

  // Connection from right zone up
  carve(118, 28, 126, 34);

  // Connection from left zone up
  carve(50, 28, 58, 50); // vertical shaft left side

  // Platforms in upper zone
  plat(56, 26, 5);
  plat(68, 22, 4);
  plat(80, 18, 5);
  plat(92, 14, 4);
  plat(104, 20, 5);
  plat(116, 24, 4);
  plat(64, 12, 5);
  plat(78, 10, 4);
  plat(90, 8, 5);   // near the exit!
  plat(100, 12, 4);
  plat(112, 16, 5);
  plat(124, 10, 4);

  // ═══════════════════════════════════════════════
  //  EXIT (top of upper zone)
  // ═══════════════════════════════════════════════
  fill(88, 6, 94, 6, TILE.EXIT);

  // ═══════════════════════════════════════════════
  //  BOSS ARENA (large open area in central zone)
  //  Rows 58–79, Cols 82–108
  //  (already carved as part of central zone, just decorate)
  // ═══════════════════════════════════════════════
  // Boss arena is the wide open space in the center zone

  // ═══════════════════════════════════════════════
  //  SECONDARY TUNNELS & SHORTCUTS
  // ═══════════════════════════════════════════════

  // Tunnel from left zone to upper zone (requires brick break)
  carve(44, 42, 52, 50);
  brick(44, 48, 3, 1);  // Breakable floor

  // Tunnel from starting zone to central (shortcut)
  carve(38, 82, 42, 88);
  carve(42, 74, 65, 80);  // extend main tunnel connection

  // Small secret room above starting zone
  carve(30, 72, 40, 78);
  brick(30, 78, 1, 2);  // Gotta break in

  // Hidden tunnel right side
  carve(148, 44, 155, 50);
  carve(148, 30, 155, 44);  // Goes up
  carve(130, 28, 155, 32);  // Connects to upper zone

  // ═══════════════════════════════════════════════
  //  DECORATIVE STALACTITES
  // ═══════════════════════════════════════════════
  // Place stalactites on ceilings (top edge of carved areas)
  const stalactitePositions = [
    // Main tunnel ceiling
    [8, 68], [15, 68], [25, 68], [35, 68], [45, 68],
    [70, 68], [80, 68], [90, 68], [100, 68], [110, 68],
    [120, 68], [130, 68], [140, 68], [150, 68],
    // Left zone ceiling
    [8, 48], [18, 48], [28, 48], [38, 48], [44, 48],
    // Central zone ceiling
    [70, 50], [80, 50], [92, 50], [102, 50],
    // Right zone ceiling
    [106, 30], [116, 30], [126, 30], [136, 30], [146, 30],
    // Upper zone ceiling
    [56, 6], [66, 6], [76, 6], [100, 6], [110, 6], [120, 6],
  ];
  stalactitePositions.forEach(([c, r]) => {
    if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS && map[r][c] === TILE.AIR) {
      map[r][c] = TILE.STALACTITE;
    }
  });

  return map;
}

// ─── Entity placement definitions ──────────────────────────
const ENTITY_DEFS = {
  // Player spawn
  spawn: { col: 12, row: 92 },

  // Exit position (in tile coords)
  exit: { col: 91, row: 5 },

  // Enemies — { col, row, type, hp, patrolRange }
  enemies: [
    // Starting zone — easy enemies for tutorial
    { col: 20, row: 93, type: 'spider', hp: 1, patrolRange: 3 },
    { col: 35, row: 93, type: 'bat', hp: 1, patrolRange: 4 },

    // Main tunnel
    { col: 30, row: 76, type: 'spider', hp: 2, patrolRange: 4 },
    { col: 45, row: 76, type: 'bat', hp: 1, patrolRange: 5 },
    { col: 75, row: 76, type: 'spider', hp: 2, patrolRange: 4 },
    { col: 95, row: 76, type: 'bat', hp: 1, patrolRange: 4 },
    { col: 115, row: 76, type: 'spider', hp: 2, patrolRange: 3 },
    { col: 135, row: 76, type: 'bat', hp: 1, patrolRange: 5 },

    // Left zone (spiders)
    { col: 10, row: 66, type: 'spider', hp: 2, patrolRange: 3 },
    { col: 25, row: 66, type: 'spider', hp: 2, patrolRange: 4 },
    { col: 40, row: 66, type: 'spider', hp: 3, patrolRange: 3 },
    { col: 15, row: 55, type: 'spider', hp: 2, patrolRange: 3 },
    { col: 35, row: 55, type: 'bat', hp: 1, patrolRange: 5 },

    // Central zone (mixed)
    { col: 70, row: 76, type: 'spider', hp: 2, patrolRange: 4 },
    { col: 82, row: 66, type: 'bat', hp: 2, patrolRange: 5 },
    { col: 95, row: 56, type: 'spider', hp: 3, patrolRange: 3 },
    { col: 105, row: 56, type: 'bat', hp: 2, patrolRange: 4 },

    // Right zone (bats, tough enemies)
    { col: 108, row: 48, type: 'bat', hp: 2, patrolRange: 5 },
    { col: 120, row: 48, type: 'bat', hp: 2, patrolRange: 4 },
    { col: 132, row: 48, type: 'spider', hp: 3, patrolRange: 3 },
    { col: 144, row: 48, type: 'bat', hp: 2, patrolRange: 5 },
    { col: 115, row: 38, type: 'bat', hp: 2, patrolRange: 5 },
    { col: 140, row: 38, type: 'spider', hp: 3, patrolRange: 3 },

    // Upper zone (challenging)
    { col: 60, row: 28, type: 'bat', hp: 2, patrolRange: 5 },
    { col: 75, row: 18, type: 'bat', hp: 2, patrolRange: 6 },
    { col: 88, row: 12, type: 'spider', hp: 3, patrolRange: 3 },
    { col: 105, row: 18, type: 'bat', hp: 2, patrolRange: 4 },
    { col: 120, row: 22, type: 'bat', hp: 2, patrolRange: 5 },
    { col: 70, row: 10, type: 'bat', hp: 3, patrolRange: 4 },

    // Secret areas
    { col: 150, row: 38, type: 'spider', hp: 3, patrolRange: 3 },
  ],

  // Fire obstacles (placed on floor)
  fires: [
    { col: 25, row: 80 },
    { col: 50, row: 80 },
    { col: 85, row: 80 },
    { col: 120, row: 80 },
    { col: 145, row: 80 },
    { col: 15, row: 69 },
    { col: 35, row: 69 },
    { col: 75, row: 80 },
    { col: 100, row: 80 },
    { col: 115, row: 51 },
    { col: 135, row: 51 },
  ],

  // Puddles (water refill, placed on floor)
  puddles: [
    { col: 15, row: 80, w: 3 },
    { col: 40, row: 80, w: 3 },
    { col: 80, row: 80, w: 3 },
    { col: 130, row: 80, w: 3 },
    { col: 25, row: 97, w: 3 },
    { col: 12, row: 69, w: 2 },
    { col: 110, row: 51, w: 2 },
    { col: 70, row: 31, w: 2 },
  ],

  // Boss definition
  boss: {
    col: 96, row: 72,
    hp: 20,
    maxHp: 20,
    patrolMin: 84,
    patrolMax: 106,
    hangFromRow: 50  // Where the web attaches (ceiling)
  },

  // Zone descriptions for HUD
  zones: [
    { name: '🕳️ Entrada', bounds: { r1: 78, r2: 98, c1: 2, c2: 42 } },
    { name: '🏚️ Túnel Principal', bounds: { r1: 68, r2: 81, c1: 2, c2: 155 } },
    { name: '🕷️ Cuevas de Arañas', bounds: { r1: 48, r2: 69, c1: 2, c2: 50 } },
    { name: '⚔️ Arena del Jefe', bounds: { r1: 50, r2: 81, c1: 64, c2: 110 } },
    { name: '🦇 Gruta de Cristal', bounds: { r1: 30, r2: 52, c1: 100, c2: 155 } },
    { name: '☀️ Camino a la Salida', bounds: { r1: 6, r2: 32, c1: 50, c2: 130 } },
  ]
};
