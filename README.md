# 🎮 Emoji World – Emoji City Adventure

¡Bienvenido a **Emoji World**, un vasto mundo abierto de aventuras construido completamente con emojis! Explora diversas zonas, completa misiones, chatea con personajes, juega minijuegos y descubre la historia de Emoji City.

## 🌟 Características

- **Mundo abierto expansivo** – Recorre un mapa de 2800×2000 píxeles con seis zonas únicas:
  - 🏪 Mercado Feliz
  - 🏛️ Plaza Central
  - 🏰 Zona Oscura
  - 🔬 Tecnozona
  - 🔥 Reino de Fuego
  - 🌳 Bosque Ancestral
- **NPCs interactivos** – Habla con ciudadanos, resuelve acertijos y obtén recompensas.
- **Sistema de misiones** – Misiones con varias fases
- **Minijuegos** – Organiza estanterías en *Mercado Feliz*, explora la *Cueva Oscura*, defende la ciudad en *Emoji Game*
- **Niveles independientes** – Cada nivel es un archivo HTML independiente que puede editarse sin modificar el motor del juego

---

## 📁 Estructura del Proyecto

```
emoji-world/
│
├── website/              # Sitio web principal
│   ├── index.html       # Página de inicio
│   ├── stories.html     # Historias
│   ├── videos.html      # Videos
│   ├── games.html       # Juegos
│   └── mini-games.html # Minijuegos
│
├── game/                # Directorio del juego
│   ├── index.html       # Punto de entrada del juego
│   │
│   ├── css/
│   │   └── game.css    # Estilos del juego
│   │
│   ├── js/
│   │   ├── game.js     # Motor principal del juego
│   │   └── levelLoader.js  # Sistema de carga de niveles
│   │
│   ├── levels/         # Niveles del juego (HTML independientes)
│   │   ├── cave.html           # Cave Escape
│   │   ├── mercado-don-mango.html  # Mercado Feliz
│   │   └── emoji-city.html     # Nivel principal
│   │
│   └── assets/
│       ├── images/
│       ├── audio/
│       └── effects/
│
├── docs/                # Documentación
├── README.md
└── .gitignore
```

---

## 🎯 Cómo jugar

1. Abre `website/index.html` en un navegador
2. Haz clic en **"JUGAR"** para iniciar el juego principal
3. O navega directamente a `game/index.html`

### Controles

| Acción          | Teclado          | Táctil               |
|-----------------|------------------|----------------------|
| Moverse         | Flechas          | Joystick virtual     |
| Saltar          | Espacio          | Botón ▲              |
| Interactuar     | E                | Burbuja de proximidad|

---

## ➕ Cómo agregar nuevos niveles

1. Crea un nuevo archivo HTML en `game/levels/`
2. Usa la plantilla de nivel:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Nombre del Nivel - Emoji World</title>
  <style>
    /* Tus estilos */
  </style>
</head>
<body>
  <div id="game-container">
    <!-- Contenido del nivel -->
  </div>
  <script>
    // Lógica del nivel
  </script>
</body>
</html>
```

3. Registra el nivel en `game/js/levelLoader.js`

### Cargando niveles

```javascript
// Cargar por ruta de archivo
loadLevel('levels/cave.html');

// O por nombre
LevelLoader.loadLevelByName('cave');
```

---

## 🛠️ Tecnologías

- HTML5
- CSS3
- JavaScript (ES6)
- Web Audio API
- LocalStorage API

---

## 👤 Créditos

- **Rafael Araque** – Creador y desarrollador

---

¡Disfruta de la aventura en **Emoji World**! 😊✨
