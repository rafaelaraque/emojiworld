/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EMOJI-CITY NG+ (NEW GAME PLUS) - MODO PODERES SIN COOLDOWN
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ARCHIVO FUENTE: Mecánica guardada del nivel emoji-city
 * ESTADO: Inactivo (para uso futuro)
 * 
 * DESCRIPCIÓN:
 * Este archivo contiene la mecánica original de New Game Plus que permitía
 * al jugador reiniciar el juego con los poderes élficos activos sin límite
 * de tiempo ni cooldown.
 * 
 * PARA ACTIVAR ESTA MECÁNICA EN EL FUTURO:
 * 1. Copiar las secciones marcadas con "=== COPIAR ===" a emoji-city-level.js
 * 2. Descomentar la variable ngPlusMode
 * 3. Activar el event listener de créditos
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 1. VARIABLE GLOBAL
 * Ubicación en emoji-city-level.js ~línea 5372
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * === COPIAR ===
 */
// let ngPlusMode = false; // New Game+ after beating game


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 2. FUNCIÓN activatePower() - Líneas 3583-3605
 * Modificación para NG+: poderes sin cooldown
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * === COPIAR ===
 */
/*
function activatePower(power) {
  // NG+ or elven: no cooldown, switch freely
  if (elvenPowersActive || ngPlusMode) {
    if (powerActive && currentPower === power) return; // already active
    if (powerActive) { deactivatePower(); }
    currentPower = power;
    powerActive = true;
    powerDuration = 999999; // effectively infinite
    player.emoji = getPowerEmoji(power);
    playPowerSound(power);
    createPowerTransformEffect(power);
    const _pc = POWER_COLORS[power];
    if (_pc) { powerFlash = 8; powerFlashColor = _pc.main; }
    if (power === 'ghost') player.ghostMode = true;
    if (power === 'fire') player.fireBounce = true;
    if (power === 'angry') player.angryAura = true;
    if (power === 'cool') { coolFreezeActive = true; coolFreezeTimer = 420; }
    powerSlots.forEach(slot => {
      slot.classList.remove('active','cooldown','disabled','selecting');
      if (slot.dataset.power === power) slot.classList.add('active');
    });
    return;
  }
  // ... resto del código original
}
*/


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 3. FUNCIÓN deactivateAvatar() - Líneas 3665-3668
 * Modificación para NG+: corazones y timer persistentes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * === COPIAR ===
 */
/*
// Desactivar avatar comprado → volver a poderes base
function deactivateAvatar() {
  if (!ngPlusMode) purchasedAvatar = null;
  avatarPowerTimer = ngPlusMode ? 1200 : 0;  // NG+: auto-refill timer
  reinforcedHearts = ngPlusMode ? 3 : 0;
  avatarAttackActive = false;

  // Restore default emoji
  player.baseEmoji = '😊';
  player.emoji = '😊';

  // Re-enable power slots
  powerSlots.forEach(slot => {
    slot.classList.remove('active', 'disabled', 'selecting', 'cooldown');
    slot.querySelector('.cooldown-overlay').style.height = '0';
    slot.querySelector('.cooldown-clock').style.display = 'none';
  });

  // Hide attack button
  attackBtnWrapper.classList.add('inactive'); attackBtnWrapper.classList.remove('active-avatar');

  // Visual/audio feedback
  screenShake = 6;
  try {
    const ac = getAC(); if (ac) {
      const t = ac.currentTime;
      sfxOsc('sawtooth', 400, 100, t, 0.18, 0.3);
      sfxOsc('sawtooth', 200, 50,  t+0.15, 0.14, 0.25);
    }
  } catch(e) {}

  createPowerTransformEffect('cool'); // brief sparkle
  updateHearts();
}
*/


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 4. FUNCIÓN initGame() - Líneas 720-721 y 779-780
 * Modificación para NG+: mantener poderes al reiniciar
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * === COPIAR ===
 */
/*
// En initGame() - Al inicializar el juego:
// Dentro del bloque de inicialización del jugador:

// Inicializar avatar y poderes
if (!ngPlusMode) { 
  purchasedAvatar = null; 
  avatarPowerTimer = 0; 
  reinforcedHearts = 0; 
} else { 
  avatarPowerTimer = 1200; 
  reinforcedHearts = ngPlusMode ? 3 : 0; 
}

// En la sección de reinicialización de jugador:
if (!ngPlusMode) { 
  purchasedAvatar = null; 
  avatarPowerTimer = 0; 
  reinforcedHearts = 0; 
} else { 
  avatarPowerTimer = 1200; 
  reinforcedHearts = ngPlusMode ? 3 : 0; 
}
*/


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 5. FUNCIÓN resetGame() - Línea ~4607
 * Modificación para NG+: no resetear monedas
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * === COPIAR ===
 */
/*
function resetGame() {
  currentLevel = 1;
  level2CheckpointSaved = false;
  gameOverScreen.style.display = "none";
  victoryScreen.style.display = "none";
  creditsScreen.classList.remove('show');
  if (!ngPlusMode) {
    coinsCollected = 0;
    prevCoins = 0;
  }
  startGame();
}
*/


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 6. CHECKPOINT EN drawHearts() - Línea ~1876
 * Modificación para NG+: mostrar corazones adicionales
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * === COPIAR ===
 */
/*
// En drawHearts() - Mostrar corazones adicionales en NG+:
// Cambiar la condición de check:
if (reinforcedHearts <= 0 && !elvenPowersActive && !ngPlusMode) {
  // ... código de corazones normales
}
*/


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 7. ATAQUE DE AVATAR EN draw() - Línea ~3282 y ~3443
 * Modificación para NG+: permitir ataque de avatar
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * === COPIAR ===
 */
/*
// En draw() - Dibujar ataque de avatar:
// Cambiar la condición:
if (purchasedAvatar && avatarPowerTimer > 0 && !elvenPowersActive && !ngPlusMode) {
  // ... código del ataque
}

// En el bloque de ataque:
// Cambiar la condición:
if (attackPressed && (purchasedAvatar || elvenPowersActive || ngPlusMode) && !avatarAttackActive) {
  // ... código del ataque
}
*/


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 8. COMPRA DE AVATAR - Línea ~3506
 * Modificación para NG+: permitir compra en NG+
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * === COPIAR ===
 */
/*
// En buyAvatar() - Permitir compra de avatar en NG+:
// Cambiar la condición:
if (!purchasedAvatar && !ngPlusMode) return;
// ... resto del código
*/


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 9. CONTINUAR PARTIDA (Level 2) - Línea ~4580
 * Modificación para NG+: cargar avatar guardado
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * === COPIAR ===
 */
/*
// En la función de continuar/cargar partida:
// Dentro del bloque de cargar estado:
if (ngPlusMode && purchasedAvatar) {
  // ... código para restaurar avatar
}
*/


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 10. EVENT LISTENERS DE BOTONES - Líneas ~5121-5123 y ~5540-5544
 * Event listeners para reiniciar juego
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * === COPIAR ===
 */
/*
// Botón restart en game over:
restartBtn.addEventListener('click', () => { ngPlusMode = false; resetGame(); });

// Botón play again en victoria:
playAgainBtn.addEventListener('click', () => { ngPlusMode = false; resetGame(); });

// Botón en créditos para NG+:
creditsPlayAgainBtn.addEventListener('click', () => {
  creditsScreen.classList.remove('show');
  ngPlusMode = true;
  resetGame();
});
*/


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 11. ELEMENTOS HTML NECESARIOS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * === COPIAR A emoji-city.html ===
 */
/*
<!-- En credits-screen (antes del cierre </div>): -->
<button class="credits-play-again" id="credits-play-again-btn">🔄 Jugar de nuevo</button>

<!-- En game-over-screen: -->
<button id="restart-btn">🔄 EMPEZAR DE NUEVO</button>

<!-- En victory-screen: -->
<button class="play-again-btn" id="play-again-btn">🔄 Jugar de nuevo</button>
*/


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 12. ESTILOS CSS NECESARIOS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * === COPIAR A emoji-city.css ===
 */
/*
.credits-play-again {
  background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
  border: 2px solid #4ade80;
  color: white;
  font-size: 1.2rem;
  font-weight: 700;
  padding: 14px 32px;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  box-shadow: 0 6px 24px rgba(22, 163, 74, 0.5);
  font-family: 'Nunito', sans-serif;
  letter-spacing: 0.5px;
}
.credits-play-again:hover {
  transform: scale(1.06);
  box-shadow: 0 10px 36px rgba(22, 163, 74, 0.7);
}
.credits-play-again:active {
  transform: scale(0.97);
}
*/


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RESUMEN DE LA MECÁNICA NG+
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * EFECTOS DE ACTIVAR ngPlusMode = true:
 * 
 * 1. Poderes sin cooldown:
 *    - activatePower() permite activar cualquier poder sin esperar
 *    - powerDuration = 999999 (infinito visual)
 *    - Se puede cambiar entre poderes libremente
 * 
 * 2. Corazones adicionales:
 *    - 3 corazones reforzados permanentes
 *    - Se muestran junto a los corazones normales
 * 
 * 3. Avatar mejorado:
 *    - Timer de avatar = 1200s (20 minutos)
 *    - Ataque de puño disponible
 *    - Se puede comprar avatar en tienda
 * 
 * 4. Sin reset de progreso:
 *    - Monedas no se resetean al reiniciar
 *    - prevCoins se mantiene
 * 
 * 5. Transición de escena:
 *    - Al hacer click en "Jugar de nuevo" en créditos
 *    - Se activa ngPlusMode = true
 *    - Se llama resetGame()
 *    - El juego inicia en nivel 1 con poderes activos
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */
