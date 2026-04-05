# 🌍 Emoji World - Sistema de Misiones y Progresión

## 📌 Descripción General

Emoji World es un juego tipo metroidvania con desplazamiento lateral y exploración libre, donde el jugador progresa desbloqueando áreas mediante misiones, habilidades y objetos.

El sistema central del juego se basa en:

- Misiones guiadas por NPCs
- Chat interactivo (Chat Emoji)
- Inventario persistente
- Desbloqueo progresivo del mapa
- Habilidades especiales basadas en emojis

---

## 🎮 Flujo Inicial del Juego

1. Pantalla de carga
2. Animación aérea del mundo → Zoom a Emoji City
3. Introducción del personaje Emma
4. Activación obligatoria del Chat Emoji
5. Primer mensaje (misión inicial)

⚠️ Restricción:
- El jugador NO puede moverse hasta leer el primer mensaje.

---

## 💬 Sistema Chat Emoji

El chat es el eje narrativo del juego.

### Reglas:

- Inicia vacío
- Mensajes llegan según progreso
- El jugador puede responder con:
  - Texto
  - Emojis

### Validaciones:

- Respuestas incorrectas → no avanzan la historia
- Respuestas correctas → desbloquean misiones

Ejemplo:
- "🍉 Sandía" solo funciona si completó misión de Don Mango

---

## 🎒 Sistema de Inventario

El jugador puede almacenar:

- Objetos clave (permiso, anillo)
- Poderes (fuego, hielo, invisibilidad)
- Herramientas (pala, bombas)

### Tipos:

- 🔑 Clave (progresión)
- ⚡ Poder (habilidades)
- 🧰 Herramienta (interacción mundo)

---

## 🧭 Sistema de Misiones

### 🥭 Misión 1: Don Mango

- Objetivo: completar misión inicial
- Recompensa: pista "Sandía"
- Acción clave: escribir a Emma

---

### ⛏️ Misión 2: Cueva

- Requiere: permiso
- NPC: Minero
- Objetivo: recuperar anillo
- Recompensa:
  - Objetos permanentes (lluvia, viento, etc.)

---

### 👑 Misión 3: Reino y Dragón

- Entrada alternativa (zona norte)
- Requiere: bombas
- NPC: Rey Roland

#### Sub-misión:

- Obtener poder de hielo (Elfa)
- Crear plataformas congelando lluvia
- Derrotar dragón

---

### ⚙️ Misión 4: Tecnozona

- Requiere: pala
- NPC: Doctor Bits
- Mecánica: puzzle
- Recompensa: invisibilidad

---

### 🔥 Misión 5: Blaze

- Desafío de esquivar proyectiles
- Recompensa: gafas COOL

---

### ⚔️ Misión Final: Invasión

- Se activa tras completar todas las anteriores

---

## 🗺️ Sistema de Mapa

El mapa está dividido en zonas:

- Ciudad
- Bosque
- Cueva (bloqueada)
- Reino (bloqueado)
- Tecnozona (bloqueada)
- Zona de fuego

### 🔒 Restricciones Iniciales:

- Cueva → requiere permiso
- Reino → requiere bomba
- Torre → requiere poder hielo
- Tecnozona → requiere pala

---

## 🧠 Sistema de Estado del Juego

El juego debe manejar un estado global:

```js
gameState = {
  missions: {},
  inventory: [],
  unlockedZones: [],
  chatProgress: {},
  abilities: []
}