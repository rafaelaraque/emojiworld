  
    'use strict';
    // ── VARIABLES GLOBALES Y FUNCIÓN TOAST (AÑADIDA) ──
    let toastT;
    function toast(msg) {
      clearTimeout(toastT);
      const el = document.getElementById('toast');
      if (!el) return;
      el.textContent = msg;
      el.classList.add('show');
      toastT = setTimeout(() => el.classList.remove('show'), 2800);
    }

    // ── GAME CONSTANTS & STATE ──────────
    let vpW = 800, vpH = 600;
    const MW = 2800, MH = 2000, SPD = 7;
    let keys = {};
    let G = { xp: 0, coins: 0, ms: 0, cv: {}, att: {}, mx: 900, my: 600, mktLv: 0, mangoUnr: 0, inv: {shovel:1} };

    // ── DATA ──────────────────────────────
    const NPCS = {
      emma: { av: '🤗', nm: 'Emma', rl: 'Guía (solo en chat)', msgs: ['🤗 ¡Hola! Puedes contactarme por el chat para tus misiones.', '¡Espero que estés disfrutando de Emoji City! 🏙️'] },
      mango: { av: '👨‍🌾', nm: 'Don Mango', rl: 'Dueño del Mercado Feliz', msgs: ['¡Hola, aventurero! 👨‍🌾 Bienvenido a mi puesto.', 'Si me ayudas con la estantería, te daré información valiosa.', '¡Haz clic en el mercado para empezar el minijuego! 🏪'] },
      void: { av: '🫅', nm: 'Rey Roland', rl: 'Rey de la Zona Real', msgs: ['asi que eres el nuevo aventurero?', 'demuestra cuanto sabes de Emoji World', 'mi castillo real cuantas torres lo protegen?'] },
      guardia: { av: '💂', nm: 'Guardia del Castillo', rl: 'Vigilante Real', msgs: ['¡Alto! 💂 Este castillo esta protegido', 'los puntos cardinales te daran la pista.', 'estamos vigilando el Castillo Real sin descanso 🏰'] },
      robo: { av: '👨‍🔬', nm: 'Dr. Bits', rl: 'Científico Principal', msgs: ['¡Hola! 👨‍🔬 Soy el científico principal de Tecnozona.', 'Tengo información valiosa sobre el generador. ¡Habla conmigo! 💻', 'El secreto: el *color del núcleo* del generador central ⚡'] },
      tecnico: { av: '👨‍🔬', nm: 'Dr. Bits', rl: 'Científico Principal', msgs: ['¡Hola! 👨‍🔬 Trabajo en el laboratorio de RoboX.', 'Nuestro generador tiene un núcleo principal', 'Es la energía que alimenta toda Tecnozona.'] },
      blaze: { av: '🥷', nm: 'Blaze', rl: 'Guerrero del Fuego', msgs: ['¡FUEGO Y GLORIA! 🔥💪 ¡Soy Blaze!', '¡ACEPTA mi desafío en el chat, guerrero! ⚔️'] },
      guerrero: { av: '🙅', nm: 'Kiran', rl: 'Templo de Fuego', msgs: ['¡El honor del fuego me guía! ⚔️🔥', 'Nuestro símbolo es un *animal sagrado*.', 'Sin su poder el *Reino de Fuego* no existiría.'] },

      sage: { av: '🧙', nm: 'Sage', rl: 'El Sabio Ancestral', msgs: ['...te esperaba, joven... 🧙✨', 'Tengo una pregunta profunda en el chat... reflexiona 📜', 'La respuesta yace *bajo el Árbol Dorado* del bosque'] },
      anciano: { av: '👴', nm: 'Guardián del Árbol', rl: 'Bosque Ancestral', msgs: ['Cuido el *Árbol Dorado ✨*, el más antiguo de Emoji City. 👴', 'Bajo sus raíces está el *grimorio ancestral* 📜', 'El *Árbol Dorado* guarda todos los secretos del bosque 🌳✨'] },
      c1: { av: '🧒', nm: 'Luis', rl: 'Ciudadano', msgs: ['¡Buenos días! 😄 ¡Emoji City es increíble!', '¿Ya exploraste todas las zonas? ¡Hay mucho por descubrir! 🗺️'] },
      c2: { av: '👩', nm: 'Sara', rl: 'Vecina de la Plaza', msgs: ['¡Hola! 👋 ¡Me encanta la Plaza Central!', '¡No olvides revisar el tablón de misiones! 📋'] }
    };

    const CHARS = {
      emma: {
        id: 'emma', nm: 'Emma 🤗', em: '🤗', bg: 'bg0', mt: '¿Cuál es la fruta oficial de Emoji City?', xp: 80, co: 20, tm: '09:41', unr: 3, pv: '¡Hola! Tengo una misión para ti 🌟',
        init: ['¡Hola aventurero! 😊 ¡Bienvenido a Emoji City!', 'Soy Emma, tu guía oficial. Tengo una misión 🎯', '¿Sabes cuál es la **fruta oficial** de Emoji City? Explora el Mercado Feliz 🏪'],
        ans: ['sandía', 'sandia', '🍉'], hints: ['💡 Visita el *Mercado Feliz* al noroeste 🏪', '💡 Habla con *Don Mango* 🧑‍🍳', '💡 Es verde por fuera, roja por dentro y MUY grande 🍉'],
        wrong: ['¡Mmm no es esa! 🤔 Explora el Mercado Feliz 🗺️', '¡Casi! Habla con el dueño del mercado 🧑‍🍳', '¡Sigue buscando! La pista está en el mapa 🌍'],
        ok: '¡¡CORRECTO!! 🎉 ¡La **sandía 🍉** es la fruta oficial de Emoji City! ¡Eres increíble!', dn: '😊 ¡Ya completaste esta misión! ¡Eres el mejor aventurero!'
      },
      void: {
        id: 'void', nm: 'Rey Roland 🫅', em: '🫅', bg: 'bg1', mt: '¿Cuántas torres tiene el Castillo Real?', xp: 150, co: 50, tm: '09:38', unr: 1, pv: 'asi que eres el nuevo aventurero?',
        init: ['asi que eres el nuevo aventurero?', 'demuestra cuanto sabes de Emoji World', 'mi castillo real cuantas torres lo protegen?'],
        ans: ['4', 'cuatro'], hints: ['🏰 El Castillo Real está en el centro de la zona', '🏰 Hay 4 torres: Norte, Sur, Este y Oeste', '🏰 Habla con el Guardia del castillo 💂'],
        wrong: ['...error... ¿Tan difícil es contar?', '¡INCORRECTO! Cuenta las torres del castillo', '...sigue fallando... habla con el Guardia 💂'],
        ok: '...impresionante... **4 torres**. Correcto. Eres más listo de lo que pensaba.', dn: '...ya me conoces... No tengo más secretos.'
      },
      robo: {
        id: 'robo', nm: 'Dr. Bits 👨‍🔬', em: '👨‍🔬', bg: 'bg2', mt: '¿De qué color es el núcleo del generador?', xp: 120, co: 35, tm: '09:35', unr: 2, pv: '¡Tengo información sobre el generador! 👨‍🔬',
        init: ['¡Bienvenido a Tecnozona! 👨‍🔬', 'SOY EL DR. BITS, científico principal 💻', 'Mi laboratorio tiene un **generador especial**. ¿De qué color brilla? Explora Tecnozona ⚡'],
        ans: ['azul', 'blue', '💙', 'celeste'], hints: ['💻 Dirígete a *Tecnozona* al este ⚡', '💻 Busca el *Centro de Energía*, hay un cartel 🧿', '💻 El Dr. Bits del laboratorio sabe el color 👨‍🔬'],
        wrong: ['¡ERROR! 👨‍🔬 Respuesta incorrecta. Analiza la evidencia 🗺️', '¡INCORRECTO! El color está en Tecnozona 💻', '¡FALLO! Consulta al científico 👨‍🔬'],
        ok: '¡CORRECTO! 👨‍🔬💙 El núcleo brilla **azul**. ¡Protocolo completado! ✅', dn: '¡MISIÓN ARCHIVADA! ¡Bien hecho, investigador!'
      },
      blaze: {
        id: 'blaze', nm: 'Blaze 🥷', em: '🥷', bg: 'bg3', mt: '¿Cuál es el animal sagrado que cuida el Templo?', xp: 130, co: 40, tm: '09:30', unr: 2, pv: '¡Demuestra tu valor, guerrero! ⚔️',
        init: ['¡FUEGO Y GLORIA! 🔥💪 ¡Llegaste al Reino de Fuego!', '¡SOY BLAZE, el guerrero más poderoso!', '¿Cuál es el **animal sagrado** 🐉 que cuida mi Templo? ¡Busca en el mapa! ⚔️'],
        ans: ['dragón', 'dragon', '🐉'], hints: ['🔥 Ve al *Reino de Fuego* al southeast ⛩️', '🔥 Junto al Templo hay un guardián especial 🐉', '🔥 Habla con *Kiran* cerca del templo ⚔️'],
        wrong: ['¡NO! 😤🔥 ¡Investiga antes de responder!', '¡INCORRECTO! El guardián está en el mapa 💥', '¡SIGUE! Habla con Kiran ⚔️'],
        ok: '¡CORRECTO! 🔥🐉🏆 ¡El **dragón 🐉** es el animal sagrado! ¡ERES UN VERDADERO GUERRERO!', dn: '¡YA ERES PARTE DEL REINO DE FUEGO! 🔥💪'
      },
      mango: {
        id: 'mango', nm: 'Don Mango 👨‍🌾', em: '👨‍🌾', bg: 'bg5',
        mt: '🏪 Visita el Mercado Feliz', xp: 0, co: 0,
        tm: '09:15', unr: 2,
        pv: '¡Si me ayudas con la estantería te daré información valiosa! 🍉',
        init: [
          '¡Hola aventurero! 👨‍🌾 Soy Don Mango, dueño del Mercado Feliz.',
          '¡Llegó un camión con frutas y la estantería está vacía! 📦😰',
          'Si me ayudas a organizarla... ¡te daré información muy valiosa sobre Emoji City! 🤝',
          '¡Pasa al mercado y empieza el minijuego! 🏪👆',
        ],
        taskBased: true, done: false,
        dn: '¡Ya completaste mi tarea! 😊 Visita el mercado para más misiones.',
        ans: [], hints: [], wrong: [], ok: '',
      },
      sage: {
        id: 'sage', nm: 'Sage 🧙', em: '🧙', bg: 'bg4', mt: '¿Dónde está el grimorio ancestral?', xp: 200, co: 80, tm: '09:15', unr: 3, pv: '...Joven aventurero, te esperaba 🧙',
        init: ['...te esperaba, joven... 🧙 He visto muchas lunas pasar.', 'El grimorio ancestral ha desaparecido... 📜✨', '¿Dónde está el **grimorio**? La respuesta yace en el Bosque Ancestral 🌳'],
        ans: ['árbol dorado', 'arbol dorado', 'árbol', 'dorado', 'bosque', 'grimorio'], hints: ['✨ El secreto está en el *Bosque Ancestral* al suroeste', '✨ No cualquier árbol... el *Árbol Dorado* 🌟', '✨ El *Guardián del Árbol* sabe dónde está 👴'],
        wrong: ['...medita más... 🧙 El bosque guarda el secreto', '...no es ese lugar... Ve al Bosque Ancestral 🌿', '...paciencia... El sabio del bosque te puede ayudar 👴'],
        ok: '...lo encontraste... 🧙✨ El grimorio descansa **bajo el Árbol Dorado** del bosque.',
        dn: '...ya lo sabes... 🧙 Sigue tu camino de sabiduría, joven aventurero.',
      },
      miner: {
        id:'miner', nm:'Minero 👷', em:'👷', bg:'bg2',
        mt:'Entrada a la Cueva',
        init:[
          '¡Alto ahí! 👷 Esta cueva es zona restringida.',
          'Nadie entra sin el permiso oficial... 📃',
          'Si tienes el permiso, te dejo pasar.',
        ],
        ans:[], hints:[], wrong:[],
        ok:'', dn:'¡Pasa! La cueva es peligrosa. Ten cuidado. 🪨',
        taskBased: false, done: false,
        permissionBased: true,
      },
      elfa: {
        id:'elfa', nm:'Elfa Mágica 🧝‍♂️', em:'🧝‍♂️', bg:'bg5',
        mt:'La magia del bosque',
        init:[
          '🧝‍♂️ El viento susurra tu nombre, aventurero...',
          'La oscuridad avanza sobre Emoji City. 🌑',
          'Cuando la invasión llegue... vuelve a mí. ✨',
        ],
        ans:[], hints:[], wrong:[],
        ok:'', dn:'Ya tienes mis poderes. ¡Ve y salva Emoji City! 💚',
        taskBased: false, done: false,
        elfaBased: true,
      },
    };

    // ── PLAYER SYSTEM ──────────────────────────────
    let PX = 1350, PY = 930;
    let isJumping = false;
    let jumpTimeout = null;
    const PROX_DIST = 90;

    function setPlayerPos(x, y) {
      PX = clamp(x, 20, MW - 40);
      PY = clamp(y, 20, MH - 40);
      const pl = document.getElementById('player');
      if (pl) { pl.style.left = PX + 'px'; pl.style.top = PY + 'px'; }
    }

    function updatePlayerViewport() {
      G.mx = clamp(PX - vpW / 2 + 21, 0, MW - vpW);
      G.my = clamp(PY - vpH / 2 + 21, 0, MH - vpH);
      applyMap();
    }

    (async () => {
      try {
        const r = await window.storage.get('ec3');
        if (r) { const s = JSON.parse(r.value); Object.assign(G, s); if (s.done) Object.keys(s.done).forEach(k => { if (CHARS[k]) CHARS[k].done = s.done[k]; }); }
      } catch (e) { }
      init();
    })();

    // ══════════════════════════════════════════════════════════
    //  NOTIFICATION MANAGER — burbujas flotantes de mensajes
    // ══════════════════════════════════════════════════════════
    const MN = {
      queue:  [],
      active: false,
      timer:  null,
      DURATION: 5000,

      push(chId, rawText) {
        const ch = CHARS[chId];
        if (!ch) return;
        // No mostrar si el chat de ese contacto está abierto y visible
        const chPanel = document.getElementById('chPanel');
        if (G._c === chId && chPanel && chPanel.classList.contains('show')) return;
        this.queue.push({ chId, ch, rawText });
        if (!this.active) this._show();
      },

      _show() {
        if (!this.queue.length) { this.active = false; return; }
        this.active = true;
        const entry = this.queue.shift();
        const { chId, ch, rawText } = entry;
        // Skip if this chat is now open
        const _chP = document.getElementById('chPanel');
        if (G._c === chId && _chP && _chP.classList.contains('show')) {
          this._next(); return;
        }
        // Skip if ibPanel is open AND showing this contact's chat
        const _ibP = document.getElementById('ibPanel');
        if (_ibP && _ibP.classList.contains('open') && G._c === chId) {
          this._next(); return;
        }

        const wrap = document.getElementById('msgNotifWrap');
        if (!wrap) { this.active = false; return; }

        // Limpiar preview de markdown básico
        const preview = rawText
          .replace(/<[^>]+>/g, '')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1');
        const truncated = preview.length > 52 ? preview.substring(0, 52) + '…' : preview;

        const card = document.createElement('div');
        card.className = 'mn-card';
        card.innerHTML =
          `<div class="mn-av ${ch.bg}">${ch.em}</div>` +
          `<div class="mn-body">` +
            `<div class="mn-app">💬 EmojiChat</div>` +
            `<div class="mn-nm">${ch.nm}</div>` +
            `<div class="mn-txt">${truncated}</div>` +
          `</div>` +
          `<button class="mn-x" title="Cerrar">✕</button>` +
          `<div class="mn-bar" style="animation-duration:${this.DURATION}ms"></div>`;

        card.querySelector('.mn-x').addEventListener('click', e => {
          e.stopPropagation();
          this._dismiss(card);
        });
        card.addEventListener('click', () => {
          this._dismiss(card);
          // Abrir el chat del contacto
          if (document.getElementById('ibPanel').classList.contains('open')) {
            openChat(chId);
          } else {
            openIb();
            setTimeout(() => openChat(chId), 80);
          }
        });

        wrap.appendChild(card);
        // Trigger animation next frame
        requestAnimationFrame(() => {
          requestAnimationFrame(() => card.classList.add('mn-in'));
        });

        clearTimeout(this.timer);
        this.timer = setTimeout(() => this._dismiss(card), this.DURATION);
      },

      _dismiss(card) {
        clearTimeout(this.timer);
        if (!card.isConnected) { this._next(); return; }
        card.classList.remove('mn-in');
        card.classList.add('mn-out');
        setTimeout(() => {
          if (card.isConnected) card.remove();
          this._next();
        }, 360);
      },

      _next() {
        this.active = false;
        if (this.queue.length) setTimeout(() => this._show(), 280);
      }
    };

    // Función pública — llamar cada vez que llegue un mensaje entrante
    function showMsgNotif(chId, text) {
      MN.push(chId, text);
      if (!G._pendingUnr) G._pendingUnr = {};
      // Only count as unread if that chat isn't currently open
      const _chP2 = document.getElementById('chPanel');
      if (!(G._c === chId && _chP2 && _chP2.classList.contains('show'))) {
        G._pendingUnr[chId] = (G._pendingUnr[chId] || 0) + 1;
      }
      updateBadge();
    }

    function updateBadge() {
      let tot = 0;
      Object.values(CHARS).forEach(ch => {
        const c = G.cv[ch.id] || [];
        const unr = ch.id === 'mango'
          ? (G.mangoUnr || 0)
          : (ch.done ? 0 : (c.length === 0 ? ch.unr : 0));
        // Add 1 for each message received while chat was not open
        const pending = (G._pendingUnr && G._pendingUnr[ch.id]) || 0;
        tot += unr + pending;
      });
      const badge = document.getElementById('fbadge');
      if (badge) {
        badge.textContent = tot || '';
        badge.style.display = tot ? 'flex' : 'none';
      }
    }


    // ══════════════════════════════════════════════════════
    //  INVENTORY SYSTEM
    // ══════════════════════════════════════════════════════
    const ITEM_DEFS = {
      shovel:  { em:'🪏', nm:'Pala',    hint:'Cavar objetos enterrados' },
      permit:  { em:'📃', nm:'Permiso', hint:'Permiso de Emma para la cueva' },
      ring:    { em:'💍', nm:'Anillo',  hint:'El anillo perdido de Emma' },
    
      relic:  { em:'🏺', nm:'Reliquia', hint:'Objeto ancestral' },
      gem:    { em:'💎', nm:'Gema',    hint:'Gema preciosa rara' },
    };
    let activeItem = null;

    const BURIED_DEFS = [
      { id:'bspot-0', item:'coins', val:15,  txt:'💰 +15 🪙' },
      { id:'bspot-1', item:'relic', val:1,   txt:'🏺 ¡Reliquia encontrada!' },
      { id:'bspot-2', item:'coins', val:25,  txt:'💰 +25 🪙' },
      { id:'bspot-3', item:'gem',   val:1,   txt:'💎 ¡Gema rara!' },
      { id:'bspot-4', item:'coins', val:40,  txt:'💰 +40 🪙' },
    ];
    const foundBuried = new Set();

    function renderInv() {
      const grid = document.getElementById('invGrid');
      if (!grid) return;
      grid.innerHTML = '';
      const SLOTS = 8;
      const keys = Object.keys(G.inv || {}).filter(k => G.inv[k] > 0);
      keys.forEach(id => {
        const def = ITEM_DEFS[id]; if (!def) return;
        const d = document.createElement('div');
        d.className = 'inv-slot' + (activeItem === id ? ' active' : '');
        d.innerHTML = `<div class="inv-em">${def.em}</div><div class="inv-nm">${def.nm}</div>`
          + (G.inv[id] > 1 ? `<div class="inv-qty">×${G.inv[id]}</div>` : '');
        d.title = def.hint;
        d.onclick = () => {
          // Si es el anillo y tiene ringPending y está en chat con Emma
          if (id === 'ring' && G.inv.ringPending && G._c === 'emma') {
            // Enviar automáticamente al chat
            const inp = document.getElementById('minp');
            if (inp) {
              inp.value = '💍';
              send();
            }
            return;
          }
          // Si es el anillo y tiene ringPending pero NO está en chat con Emma
          if (id === 'ring' && G.inv.ringPending && G._c !== 'emma') {
            toast('💍 Habla con Emma en el chat para entregar el anillo');
            return;
          }
          // Normal selection
          activeItem = activeItem === id ? null : id;
          renderInv();
          const lbl = document.getElementById('invActiveLbl');
          if (lbl) {
            if (activeItem) { lbl.textContent = def.em + ' ' + def.nm + ' seleccionada'; lbl.classList.add('show'); }
            else            { lbl.classList.remove('show'); }
          }
        };
        grid.appendChild(d);
      });
      for (let i = keys.length; i < SLOTS; i++) {
        const d = document.createElement('div');
        d.className = 'inv-slot empty';
        d.innerHTML = '<div class="inv-em" style="opacity:.2">📦</div>';
        grid.appendChild(d);
      }
    }

    function openInv() {
      renderInv();
      document.getElementById('invPanel').classList.add('open');
      document.getElementById('bnbInv').classList.add('on');
    }
    function closeInv() {
      document.getElementById('invPanel').classList.remove('open');
      document.getElementById('bnbInv').classList.remove('on');
    }
    function toggleInv() {
      const open = document.getElementById('invPanel').classList.contains('open');
      if (open) closeInv(); else openInv();
    }

    // ── DIG ──────────────────────────────────────────────
    function nearBuriedSpot() {
      for (const def of BURIED_DEFS) {
        if (foundBuried.has(def.id)) continue;
        const el = document.getElementById(def.id);
        if (!el) continue;
        const bx = parseInt(el.style.left) + 17, by = parseInt(el.style.top) + 10;
        if (Math.hypot(PX + 21 - bx, PY + 40 - by) < 65) return { el, def };
      }
      return null;
    }

    function doDig() {
      if (activeItem !== 'shovel') { toast('🪏 Selecciona la Pala en tu Mochila'); return; }
      const near = nearBuriedSpot();
      if (!near) return;
      const { el, def } = near;
      // Animación pala
      const vp = document.getElementById('mapVP');
      const vpR = vp.getBoundingClientRect();
      const fx = document.createElement('div');
      fx.className = 'dig-fx';
      fx.textContent = '🪏';
      fx.style.left = (parseInt(el.style.left) - G.mx + vpR.left + 10) + 'px';
      fx.style.top  = (parseInt(el.style.top)  - G.my + vpR.top  - 10) + 'px';
      document.body.appendChild(fx);
      setTimeout(() => fx.remove(), 500);
      // Marcar encontrado
      el.classList.add('found');
      foundBuried.add(def.id);
      document.getElementById('digBtn').classList.remove('show');
      // Recompensa
      const fl = document.createElement('div');
      fl.className = 'collect-float';
      fl.textContent = def.txt;
      fl.style.left = fx.style.left;
      fl.style.top  = (parseInt(el.style.top) - G.my + vpR.top - 30) + 'px';
      document.body.appendChild(fl);
      setTimeout(() => fl.remove(), 1000);
      if (def.item === 'coins') { G.coins += def.val; hud(); }
      else { G.inv[def.item] = (G.inv[def.item] || 0) + 1; }
      sv();
    }



    // ══════════════════════════════════════════════════════
    //  STORY SYSTEM — Phase 1 & 2
    // ══════════════════════════════════════════════════════
    let caveHtmlContent = null;
    let emojiGameHtmlContent = null;
    let phase1Done = false;
    let phase2Started = false;
    let elfaPowersGiven = false;

    // ── Phase 1: Emma sends ring quest 1 min after completing fruit task ──
    function startEmmaRingQuest() {
      if (G.emmaRingStarted) return;
      G.emmaRingStarted = true; sv();
      setTimeout(() => {
        const msgs = [
          '¡Hola de nuevo! 😊 Tengo otra misión para ti...',
          '¿Recuerdas que fui de exploración por la Cueva Oscura? 🕳️',
          'Se me perdió mi anillo favorito ahí dentro... 💍',
          '¡Necesito que lo recuperes! Pero la cueva está restringida.',
          'Te envío un PERMISO OFICIAL 📃 — entrégaselo al Minero 👷',
          '¡Ten cuidado con la araña que vive en las profundidades! 🕷️',
        ];
        let delay = 0;
        msgs.forEach((m, idx) => {
          delay += 1200 + idx * 400;
          setTimeout(() => {
            const id = 'emma', ts = now();
            if (!G.cv[id]) G.cv[id] = [];
            G.cv[id].push({ t: m, s: 'c', ts });
            showMsgNotif(id, m);
            if (idx === msgs.length - 1) {
              // Give permit to inventory
              if (!G.inv.permit) G.inv.permit = 0;
              G.inv.permit++;
              G.ringQuestActive = true; // Marca que la misión del anillo está activa
              sv();
              toast('📃 ¡Emma te envió un Permiso para la Cueva!');
              updatePermitChip();
              // Update miner knowledge
              CHARS.miner.init = [
                '¡Alto ahí! 👷',
                'Déjame ver ese permiso...',
                '✅ ¡Todo en orden! Puedes entrar. ¡Cuídate! 🪨',
              ];
            }
          }, delay);
        });
      }, 30000); // 30 seconds after completion
    }

    // ── Cave system ────────────────────────────────────────
    function tryEnterCave() {
      // Allow entry if:
      // - has permit (first time)
      // - already unlocked by miner
      // - has ring pending (can re-enter to farm exp)
      const hasAccess = (G.inv.permit > 0) || G.caveUnlocked || G.inv.ringPending;
      if (!hasAccess) {
        const el = document.getElementById('caveBlockMsg');
        if (el) { el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2800); }
        return;
      }
      // Auto-unlock if still has permit but hasn't talked to miner
      if (G.inv.permit > 0 && !G.caveUnlocked) {
        G.inv.permit = 0; G.caveUnlocked = true; sv();
        const ce = document.getElementById('caveEntrance');
        if (ce) ce.classList.remove('cave-blocked');
      }
      openCave();
    }

    function openCave() {
      const ov = document.getElementById('caveOv');
      const frame = document.getElementById('caveFrame');
      const loader = document.getElementById('caveLoader');
      if (!ov || !frame) {
        console.error('Cave: Missing overlay elements');
        return;
      }

      ov.classList.add('show');
      if (loader) {
        loader.style.display = 'flex';
        const fill = loader.querySelector('.cave-load-fill');
        if (fill) { fill.style.animation = 'none'; void fill.offsetHeight; fill.style.animation = ''; }
      }
      frame.style.opacity = '0';
      
      // Clear previous state
      frame.removeAttribute('srcdoc');
      
      window.removeEventListener('message', onCaveMessage);
      window.addEventListener('message', onCaveMessage);

      // Handle load errors
      frame.onerror = function() {
        console.error('Failed to load cave level');
        if (loader) {
          loader.querySelector('.cave-load-txt').textContent = '⚠️ Error al cargar el nivel';
        }
      };

      // Handle successful load
      frame.onload = () => {
        console.log('Cave level loaded successfully');
        if (loader) loader.style.display = 'none';
        frame.style.opacity = '1';
      };
      
      // Fallback: hide loader after 3s regardless
      setTimeout(() => {
        if (loader) loader.style.display = 'none';
        frame.style.opacity = '1';
      }, 3000);

      // Load external level instead of embedded HTML
      console.log('Loading cave level from: levels/cave/cave.html');
      frame.src = 'levels/cave/cave.html';
    }

    function onCaveMessage(e) {
      // Legacy: Ring found via embedded HTML
      if (e.data === 'RING_FOUND' || (e.data && e.data.type === 'RING_FOUND')) {
        closeCave();
        onRingFound();
      }
      // Nueva funcionalidad: Player exited cave
      if (e.data && e.data.type === 'CAVE_EXIT') {
        closeCave();
        if (e.data.hasRing) {
          // El jugador tiene el anillo - guardar para entrega y agregar al inventario
          G.inv.ringPending = true;
          G.inv.ring = 1;  // Agregar al inventario para que pueda enviarlo
          sv();
          toast('💍 ¡Tienes el anillo de Emma! Ve a entregárselo en el chat.');
          renderInv();  // Actualizar inventario
        }
      }
    }

    function closeCave() {
      const ov = document.getElementById('caveOv');
      const fr = document.getElementById('caveFrame');
      if (ov) ov.classList.remove('show');
      if (fr) { fr.srcdoc = ''; fr.src = 'about:blank'; }
      window.removeEventListener('message', onCaveMessage);
    }

    function onRingFound() {
      // El anillo ya fue entregado, no agregar al inventario
      G.inv.permit = 0; sv();
      toast('💍 ¡Entregaste el anillo de Emma!');
      // Emma responds
      setTimeout(() => {
        const msgs = [
          '💍 ¡No lo puedo creer! ¡Encontraste mi anillo!',
          '¡Eres increíble, aventurero! 😊✨',
          '¡Has completado la primera fase de Emoji City! 🏆',
          '...pero algo se siente mal en el aire... 👀',
        ];
        let delay = 1500;
        msgs.forEach((m, i) => {
          setTimeout(() => {
            const ts = now();
            if (!G.cv.emma) G.cv.emma = [];
            G.cv.emma.push({ t: m, s: 'c', ts });
            showMsgNotif('emma', m);
            if (i === msgs.length - 1) {
              phase1Done = true; G.phase1 = true; sv();
              toast('🏆 ¡FASE 1 COMPLETADA!');
              setTimeout(triggerInvasion, 60000); // 1 min later
            }
          }, delay + i * 1400);
        });
      }, 2000);
    }

    // ── Miner chat responses ───────────────────────────────
    function handleMinerChatMessage(text) {
      const id = 'miner', ts = now();
      if (!G.cv[id]) G.cv[id] = [];
      // User message already added by send()
      const hasPermit = G.inv.permit > 0;
      setTimeout(() => {
        showTyp();
        setTimeout(() => {
          hideTyp();
          let reply;
          if (hasPermit) {
            // Prompt them to use the permit button
            reply = '📃 Veo que tienes algo... ¿Es el permiso de Emma? ¡Entrégamelo con el botón de abajo!';
          } else {
            const noPermitReplies = [
              '🚫 No puedes entrar sin el Permiso Oficial de Emma. 📃',
              '¿Qué haces por aquí? Esta zona es RESTRINGIDA. 👷',
              '¡Sin permiso no hay paso! Habla con Emma primero. 😤',
              'No es posible, amigo. Necesito ver un permiso oficial. 📃',
            ];
            reply = noPermitReplies[Math.floor(Math.random() * noPermitReplies.length)];
          }
          const rt = now();
          bub(reply, 'c', rt, true);
          G.cv[id].push({ t: reply, s: 'c', ts: rt });
          sv(); showMsgNotif(id, reply);
        }, 700 + Math.random() * 500);
      }, 400);
    }

    function sendPermitToMiner() {
      if (!G.inv.permit || G.inv.permit <= 0) return;
      const id = 'miner', ts = now();
      if (!G.cv[id]) G.cv[id] = [];
      // User sends permit
      bub('📃 Aquí tienes mi Permiso Oficial', 'u', ts, true);
      G.cv[id].push({ t: '📃 Aquí tienes mi Permiso Oficial', s: 'u', ts });
      // Consume permit
      G.inv.permit = 0; sv();
      // Update permit chip
      updatePermitChip();
      // Miner responds
      const msgs = [
        '✅ ¡Permiso válido! Todo en orden, puedes pasar.',
        '🕳️ La cueva es peligrosa. Hay una araña gigante en las profundidades. 🕷️',
        '...y si encuentras un anillo brillante ahí dentro, probablemente es el de la chica. 💍',
      ];
      let delay = 800;
      msgs.forEach((m, i) => {
        setTimeout(() => {
          showTyp();
          setTimeout(() => {
            hideTyp();
            const rt = now();
            bub(m, 'c', rt, true);
            G.cv[id].push({ t: m, s: 'c', ts: rt });
            sv(); showMsgNotif(id, m);
            if (i === msgs.length - 1) {
              // Unlock cave
              G.caveUnlocked = true; sv();
              const ce = document.getElementById('caveEntrance');
              if (ce) { ce.classList.remove('cave-blocked'); ce.classList.add('cave-unlocked'); }
              toast('🕳️ ¡Cueva desbloqueada! Ve a la entrada.');
              CHARS.miner.done = true;
            }
          }, 600);
        }, delay + i * 1400);
      });
    }

    function updatePermitChip() {
      const wrap = document.getElementById('permitChipWrap');
      if (!wrap) return;
      const showChip = G._c === 'miner' && G.inv.permit > 0;
      wrap.style.display = showChip ? 'block' : 'none';
    }

    // ── Miner NPC override ─────────────────────────────────
    function handleMinerDialog() {
      const hasPermit = G.inv.permit > 0;
      const alreadyUnlocked = G.caveUnlocked === true;
      
      // Show NPC dialog directly
      document.getElementById('ndAv').textContent = '👷';
      document.getElementById('ndNm').textContent = 'Minero 👷';
      document.getElementById('ndRl').textContent = 'Guardián de la Cueva';
      
      let msgs;
      if (hasPermit && !alreadyUnlocked) {
        // Use permit and unlock cave
        G.inv.permit = 0;
        G.caveUnlocked = true;
        sv();
        const ce = document.getElementById('caveEntrance');
        if (ce) { ce.classList.remove('cave-blocked'); ce.classList.add('cave-unlocked'); }
        
        msgs = [
          '¡Permiso válido! ✅ Puedes pasar.',
          'La araña está en las profundidades. 🕷️ ¡Cuidado!',
          '...y si encuentras un anillo brillante... probablemente es el de la chica. 💍',
        ];
      } else if (alreadyUnlocked) {
        msgs = [
          '¡Ya puedes entrar! 🕳️ La cueva está abierta.',
          'Ten cuidado con la araña gigante. 🕷️',
        ];
      } else {
        msgs = [
          '¡Alto ahí! 👷 Esta cueva es zona restringida.',
          'Necesitas un permiso oficial de Emma. 📃',
          'Sin permiso no puedes entrar. 🚫',
        ];
      }
      
      document.getElementById('ndMs').innerHTML = msgs.map(m => `<div class="ndm">${m}</div>`).join('');
      document.getElementById('npcOv').classList.add('show');
    }

    // ── Phase 2: Alien Invasion ────────────────────────────
    function triggerInvasion() {
      if (phase2Started) return;
      phase2Started = true; G.phase2 = true; sv();

      // Phase banner
      const banner = document.getElementById('phaseBanner');
      if (banner) { banner.classList.add('show'); setTimeout(() => banner.classList.remove('show'), 5000); }

      // Show alien ship
      const ship = document.getElementById('alienShip');
      if (ship) ship.style.display = 'block';

      // All characters send invasion messages
      const invasionMsgs = {
        emma:  ['😱 ¡Algo enorme apareció en el centro de la ciudad!', '¡Una nave alienígena! 🛸 ¡Corre!'],
        void:  ['...los sensores del castillo detectan... 👾 ...invasión...', '...nunca pensé que llegarían tan pronto...'],
        robo:  ['🤖 ALERTA MÁXIMA — Señal extraterrestre detectada.', '🛸 La nave está en la Plaza Central. Actúa YA.'],
        blaze: ['¡¡¡INVASIÓN!!! 🔥👾 ¡HAY QUE DEFENDERLOS!', '¡Necesitamos un héroe! ¡Tú eres nuestra única esperanza!'],
        sage:  ['...las estrellas lo predijeron... 🧙 ...la invasión ha comenzado...', '...busca a la Elfa del Bosque... ella tiene los poderes...'],
      };
      let baseDelay = 2000;
      Object.entries(invasionMsgs).forEach(([id, msgs]) => {
        msgs.forEach((m, i) => {
          setTimeout(() => {
            if (!G.cv[id]) G.cv[id] = [];
            G.cv[id].push({ t: m, s: 'c', ts: now() });
            showMsgNotif(id, m);
          }, baseDelay + i * 1500);
        });
        baseDelay += 4000;
      });
      toast('👾 ¡INVASIÓN ALIENÍGENA! ¡Habla con la Elfa del Bosque! 🧝🏻');
    }

    // ── Elfa Gate ──────────────────────────────────────────
    function openElfaGate() {
      const ov = document.getElementById('elfaGateOv');
      if (!ov) return;
      const msg = document.getElementById('elfaMsg');
      if (!phase2Started && !G.phase2) {
        // Before invasion - just intro
        if (msg) msg.innerHTML = `🧝‍♂️ El viento susurra tu nombre...<br>
          Siento que grandes pruebas se acercan.<br>
          Cuando llegue la oscuridad, <strong style="color:#FFD700">vuelve a mí</strong>. ✨`;
        const btn = document.getElementById('elfaAcceptBtn');
        if (btn) { btn.style.display = 'none'; }
      } else {
        if (msg) msg.innerHTML = `¡Ha llegado el momento! 🧝‍♂️✨<br>
          La nave alienígena amenaza Emoji City.<br>
          Recibe mis poderes mágicos: <strong style="color:#FFD700">😡🔥🫥🥶😎</strong><br>
          ¡Úsalos para destruir la nave invasora!`;
        const btn = document.getElementById('elfaAcceptBtn');
        if (btn) btn.style.display = '';
      }
      ov.classList.add('show');
    }
    function closeElfaGate() { document.getElementById('elfaGateOv').classList.remove('show'); }

    function acceptElfaPowers() {
      elfaPowersGiven = true; G.elfaPowers = true; sv();
      closeElfaGate();
      toast('✨ ¡Poderes élficos activados! 😡🔥🫥🥶😎');
      // Update inventory with powers hint
      if (!G.inv.elfaPower) G.inv.elfaPower = 1;
      if (!ITEM_DEFS.elfaPower) ITEM_DEFS.elfaPower = { em:'✨', nm:'Poderes Élficos', hint:'Poderes de la Elfa Mágica: 😡🔥🫥🥶😎' };
      sv();
      // Now alien ship is interactable
      const ship = document.getElementById('alienShip');
      if (ship) {
        const prox = ship.querySelector('.prox-bubble');
        if (prox) prox.textContent = '🛸 ¡Combatir! [E]';
      }
    }

    // ── Emoji Game (alien level) ───────────────────────────
    function openAlienGate() {
      if (!elfaPowersGiven && !G.elfaPowers) {
        toast('🧝‍♂️ Primero habla con la Elfa Mágica del Bosque!');
        return;
      }
      const ov = document.getElementById('emojiGameOv');
      const frame = document.getElementById('emojiGameFrame');
      const loader = document.getElementById('emojiGameLoader');
      if (!ov || !frame) return;

      ov.classList.add('show');
      if (loader) {
        loader.style.display = 'flex';
        const fill = loader.querySelector('.emoji-load-fill');
        if (fill) { fill.style.animation = 'none'; void fill.offsetHeight; fill.style.animation = ''; }
      }
      frame.style.opacity = '0';
      if (emojiGameReadyFallback) {
        clearTimeout(emojiGameReadyFallback);
        emojiGameReadyFallback = null;
      }
      window.removeEventListener('message', onEmojiGameMessage);
      window.addEventListener('message', onEmojiGameMessage);

      // Load from external file instead of embedded HTML
      frame.onload = () => {
        if (loader) loader.style.display = 'none';
        frame.style.opacity = '1';
        if (emojiGameReadyFallback) {
          clearTimeout(emojiGameReadyFallback);
          emojiGameReadyFallback = null;
        }
      };

      emojiGameReadyFallback = setTimeout(() => {
        if (loader) loader.style.display = 'none';
        frame.style.opacity = '1';
      }, 3000);

      // Load from external emoji-city level file
      frame.src = 'levels/emoji-city/emoji-city.html';
    }
    function onEmojiGameMessage(e) {
      const frame = document.getElementById('emojiGameFrame');
      if (frame && frame.contentWindow && e.source && e.source !== frame.contentWindow) return;

      if (e.data === 'EMOJIGAME_WIN') {
        closeEmojiGame();
        onAlienDefeated();
        return;
      }

      if (e.data && e.data.type === 'EMOJIGAME_READY') {
        if (emojiGameReadyFallback) {
          clearTimeout(emojiGameReadyFallback);
          emojiGameReadyFallback = null;
        }
        if (frame) frame.style.opacity = '1';
      }
    }
    function onAlienDefeated() {
      const ship = document.getElementById('alienShip');
      if (ship) ship.style.display = 'none';
      toast('🎉 ¡Invasión derrotada! ¡Emoji City está a salvo!');
      G.alienDefeated = true; sv();
      setTimeout(() => {
        const msgs = [
          '🎉 ¡Lo lograste! ¡Derrotaste la nave alienígena!',
          '😊 ¡Eres el héroe de Emoji City! ¡Gracias!',
          '🏆 ¡Has completado todas las misiones de Emoji City!',
        ];
        msgs.forEach((m, i) => {
          setTimeout(() => {
            if (!G.cv.emma) G.cv.emma = [];
            G.cv.emma.push({ t: m, s: 'c', ts: now() });
            showMsgNotif('emma', m);
          }, i * 1800);
        });
      }, 2000);
    }
    function closeEmojiGame() {
      const ov = document.getElementById('emojiGameOv');
      const fr = document.getElementById('emojiGameFrame');
      const loader = document.getElementById('emojiGameLoader');
      if (emojiGameReadyFallback) {
        clearTimeout(emojiGameReadyFallback);
        emojiGameReadyFallback = null;
      }
      if (ov) ov.classList.remove('show');
      if (loader) loader.style.display = 'flex';
      if (fr) {
        fr.onload = null;
        fr.style.opacity = '0';
        fr.srcdoc = '';
        fr.src = 'about:blank';
      }
      window.removeEventListener('message', onEmojiGameMessage);
    }

    // Check if emoji game was won (when opened in new tab)
    function checkEmojiGameWin() {
      try {
        const won = localStorage.getItem('emojiGameWon');
        const winTime = localStorage.getItem('emojiGameWinTime');
        
        // Only process if won and within last 30 seconds
        if (won === 'true' && winTime) {
          const timeDiff = Date.now() - parseInt(winTime);
          if (timeDiff < 30000) {
            localStorage.removeItem('emojiGameWon');
            localStorage.removeItem('emojiGameWinTime');
            onAlienDefeated();
          }
        }
      } catch(e) {}
    }

    // ── Alien Gate (Nave Espacial) ───────────────────────────
    function showAlienGate() {
      const ov = document.getElementById('alienGateOv');
      if (!ov) return;
      
      if (!elfaPowersGiven && !G.elfaPowers) {
        toast('🧝‍♂️ Primero habla con la Elfa Mágica del Bosque!');
        return;
      }
      
      const msg = document.getElementById('alienGateMsg');
      const btn = document.getElementById('alienCombatBtn');
      
      if (msg) {
        msg.innerHTML = `¡La nave alienígena amenaza Emoji City!<br>
          Usa tus poderes élficos para destruirla.<br>
          <strong style="color:#FFD700;">😡🔥🫥🥶😎</strong>`;
      }
      
      if (btn) {
        btn.innerHTML = '¡Combatir! ⚔️';
        btn.style.display = '';
      }
      
      ov.classList.add('show');
    }
    
    function closeAlienGate() {
      const ov = document.getElementById('alienGateOv');
      if (ov) ov.classList.remove('show');
    }
    
    function startAlienCombat() {
      closeAlienGate();
      // Open emoji-city level in a new tab
      window.open('levels/emoji-city/emoji-city.html', '_blank');
    }

    let emojiGameReadyFallback = null;
    // ── Load external game files ───────────────────────────
    // Ahora se usan archivos externos directamente, no HTML embebido
    async function loadGameFiles() {
      // Los niveles se cargan desde archivos externos en las carpetas levels/
    }

    async function sv() {
      const done = {}; Object.keys(CHARS).forEach(k => { done[k] = CHARS[k].done || false; });
      try { await window.storage.set('ec3', JSON.stringify({ ...G, done })); } catch (e) { }
    }

    // ── MAP ───────────────────────────────
    function getVP() { const v = document.getElementById('mapVP'); vpW = v.clientWidth; vpH = v.clientHeight; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    function applyMap() {
      G.mx = clamp(G.mx, 0, MW - vpW); G.my = clamp(G.my, 0, MH - vpH);
      document.getElementById('mapWorld').style.transform = `translate(${-G.mx}px,${-G.my}px)`;
      const dot = document.getElementById('mmd');
      dot.style.left = clamp((G.mx / (MW - vpW)) * 84, 2, 84) + '%';
      dot.style.top = clamp((G.my / (MH - vpH)) * 58, 2, 58) + '%';
      const cx = G.mx + vpW / 2, cy = G.my + vpH / 2;
      let z = '🏙️ Emoji City';
      if (cx > 130 && cx < 350 && cy > 200 && cy < 450) z = '🥬 El Huerto';
      else if (cx < 800 && cy < 700) z = '🥬 El Huerto';
      else if (cx > 2000 && cy < 700) z = '🏰 Zona Real';
      else if (cx > 2000 && cy > 700) z = '🔬 Tecnozona';
      else if (cx > 1600 && cy > 1400) z = '🔥 Reino de Fuego';
      else if (cx < 800 && cy > 1200) z = '🌳 Bosque Ancestral';
      else if (cx > 1050 && cx < 1750 && cy > 700 && cy < 1200) z = '🏛️ Plaza Central';
      document.getElementById('hudZone').textContent = z;
    }

    function doJump() {
      if (isJumping) return;
      isJumping = true;
      const pl = document.getElementById('player');
      if (pl) pl.classList.add('jumping');
      clearTimeout(jumpTimeout);
      jumpTimeout = setTimeout(() => {
        if (pl) pl.classList.remove('jumping');
        isJumping = false;
      }, 600);
    }

    function checkNpcProximity() {
      // Buried spots — mostrar prompt + dig button
      const hasShovel = activeItem === 'shovel';
      let nearSpot = false;
      BURIED_DEFS.forEach(def => {
        const el = document.getElementById(def.id);
        if (!el || foundBuried.has(def.id)) return;
        const bx = parseInt(el.style.left)+17, by = parseInt(el.style.top)+10;
        const close = hasShovel && Math.hypot(PX+21-bx, PY+40-by) < 65;
        el.classList.toggle('near', close);
        if (close) nearSpot = true;
      });
      const db = document.getElementById('digBtn');
      if (db) db.classList.toggle('show', nearSpot);
      // Cave entrance proximity
      const caveDist = Math.hypot(PX - 1220, PY - 1290);
      const cavePrx = document.getElementById('prox-cave');
      if (cavePrx) cavePrx.classList.toggle('visible', caveDist < 80);
      // Alien ship proximity
      if (G.phase2) {
        const shipDist = Math.hypot(PX - 1310, PY - 840);
        const shipPrx = document.getElementById('prox-alien');
        if (shipPrx) shipPrx.classList.toggle('visible', shipDist < 90);
      }
      document.querySelectorAll('.npc[data-npcid]').forEach(el => {
        const npcId = el.dataset.npcid;
        const nx = parseInt(el.style.left) || 0;
        const ny = parseInt(el.style.top) || 0;
        const dist = Math.hypot(PX - nx - 20, PY - ny - 30);
        const bubble = document.getElementById('prox-' + npcId);
        if (bubble) {
          if (dist < PROX_DIST) bubble.classList.add('visible');
          else bubble.classList.remove('visible');
          
          // Dynamic bubble text for miner
          if (npcId === 'miner' && bubble) {
            if (G.inv.permit > 0 && G.caveUnlocked !== true) {
              bubble.textContent = '📃 Entregar ';
            } else if (G.caveUnlocked === true) {
              bubble.textContent = '🕳️ Entrar ';
            } else {
              bubble.textContent = '👷 Hablar ';
            }
          }
        }
      });
    }

    // ── SPRITE 8-DIRECCIONES ────────────────────────────────────────────
    const DIR_CLASSES = ['dir-r','dir-l','dir-u','dir-d','dir-ur','dir-ul','dir-dr','dir-dl'];
    let lastDir = '';

    function setSpriteDir(dx, dy) {
      const pl = document.getElementById('player');
      if (!pl) return;
      pl.classList.remove(...DIR_CLASSES, 'walk');
      if (dx === 0 && dy === 0) { lastDir = ''; return; }
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      let dir = '';
      const a = ((angle % 360) + 360) % 360;
      if      (a <  22.5 || a >= 337.5) dir = 'dir-r';
      else if (a <  67.5)               dir = 'dir-dr';
      else if (a < 112.5)               dir = 'dir-d';
      else if (a < 157.5)               dir = 'dir-dl';
      else if (a < 202.5)               dir = 'dir-l';
      else if (a < 247.5)               dir = 'dir-ul';
      else if (a < 292.5)               dir = 'dir-u';
      else                              dir = 'dir-ur';
      pl.classList.add(dir, 'walk');
      lastDir = dir;
    }

    // ── JOYSTICK VIRTUAL ─────────────────────────────────────────────────
    let joyActive = false;
    let joyTouchId = null;
    let joyDx = 0, joyDy = 0;
    const JOY_RADIUS = 32;

    function setupJoystick() {
      const joy   = document.getElementById('joystick');
      const knob  = document.getElementById('joyKnob');
      if (!joy || !knob) return;

      function joyStart(cx, cy, id) {
        joyActive   = true;
        joyTouchId  = id;
        knob.classList.add('active');
        joyMove(cx, cy);
      }

      function joyMove(cx, cy) {
        if (!joyActive) return;
        const rect  = joy.getBoundingClientRect();
        const ox    = cx - (rect.left + rect.width / 2);
        const oy    = cy - (rect.top  + rect.height / 2);
        const dist  = Math.sqrt(ox*ox + oy*oy);
        const clamp = Math.min(dist, JOY_RADIUS);
        const nx    = dist > 0 ? (ox / dist) * clamp : 0;
        const ny    = dist > 0 ? (oy / dist) * clamp : 0;
        knob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
        joyDx = nx / JOY_RADIUS;
        joyDy = ny / JOY_RADIUS;
      }

      function joyEnd() {
        joyActive  = false;
        joyTouchId = null;
        joyDx = joyDy = 0;
        knob.classList.remove('active');
        knob.style.transform = 'translate(-50%, -50%)';
        setSpriteDir(0, 0);
      }

      joy.addEventListener('mousedown', e => {
        e.preventDefault(); joyStart(e.clientX, e.clientY, 'mouse');
      });
      window.addEventListener('mousemove', e => {
        if (joyActive && joyTouchId === 'mouse') joyMove(e.clientX, e.clientY);
      });
      window.addEventListener('mouseup', e => {
        if (joyActive && joyTouchId === 'mouse') joyEnd();
      });

      joy.addEventListener('touchstart', e => {
        e.preventDefault();
        const t = e.changedTouches[0];
        joyStart(t.clientX, t.clientY, t.identifier);
      }, { passive: false });
      window.addEventListener('touchmove', e => {
        if (!joyActive) return;
        const t = [...e.changedTouches].find(t => t.identifier === joyTouchId);
        if (t) { e.preventDefault(); joyMove(t.clientX, t.clientY); }
      }, { passive: false });
      window.addEventListener('touchend', e => {
        if (!joyActive) return;
        const t = [...e.changedTouches].find(t => t.identifier === joyTouchId);
        if (t) joyEnd();
      });
      window.addEventListener('touchcancel', () => { if (joyActive) joyEnd(); });

      const jb = document.getElementById('jumpBtn');
      if (jb) {
        const jOn  = e => { e.preventDefault(); jb.classList.add('pressed'); doJump(); };
        const jOff = e => { jb.classList.remove('pressed'); };
        jb.addEventListener('mousedown', jOn);
        jb.addEventListener('touchstart', jOn, { passive: false });
        jb.addEventListener('mouseup', jOff);
        jb.addEventListener('touchend', jOff);
      }

      document.body.addEventListener('click', e => {
        const b = e.target.closest('.prox-bubble');
        if (b && b.classList.contains('visible')) showNpc(b.id.replace('prox-', ''));
      });
    }

    let treeBlocks = null;

    let jumpableBlocks = null;   // bloques que se pasan saltando
    function buildTreeBlocks() {
      treeBlocks = []; jumpableBlocks = [];
      // Árboles
      document.querySelectorAll('.tree').forEach(t => {
        let tx = parseInt(t.style.left) || 0;
        let ty = parseInt(t.style.top) || 0;
        treeBlocks.push({ x: tx + 26, y: ty + 40, r: 24 });
      });
      // Edificios .lm — radio más grande
      document.querySelectorAll('.lm').forEach(b => {
        let bx = parseInt(b.style.left) || 0;
        let by = parseInt(b.style.top)  || 0;
        treeBlocks.push({ x: bx + 22, y: by + 32, r: 26 });
      });
      // Troncos jumpable — sólo bloquean sin salto
      document.querySelectorAll('.jumpable-obj').forEach(j => {
        let jx = parseInt(j.style.left) || 0;
        let jy = parseInt(j.style.top)  || 0;
        jumpableBlocks.push({ x: jx + 14, y: jy + 14, r: 14 });
      });
    }

    function loop() {
      let dx = 0, dy = 0;

      const U = keys['ArrowUp']    || keys['w'] || keys['W'];
      const D = keys['ArrowDown']  || keys['s'] || keys['S'];
      const L = keys['ArrowLeft']  || keys['a'] || keys['A'];
      const R = keys['ArrowRight'] || keys['d'] || keys['D'];

      if (U) dy -= SPD;
      if (D) dy += SPD;
      if (L) dx -= SPD;
      if (R) dx += SPD;

      if (joyActive) {
        const dead = 0.12;
        dx = Math.abs(joyDx) > dead ? joyDx * SPD : 0;
        dy = Math.abs(joyDy) > dead ? joyDy * SPD : 0;
      }

      if (dx !== 0 && dy !== 0) {
        const factor = 1 / Math.sqrt(2);
        dx *= factor;
        dy *= factor;
      }

      if (dx !== 0 || dy !== 0) {
        if (!treeBlocks) buildTreeBlocks();
        let nx = PX + dx, ny = PY + dy;
        let col = false;
        for (let i = 0; i < treeBlocks.length; i++) {
          const tb = treeBlocks[i];
          if (Math.hypot((nx + 21) - tb.x, (ny + 40) - tb.y) < (tb.r + 14)) {
            col = true; break;
          }
        }
        // Troncos — solo bloquean si no está saltando
        if (!col && jumpableBlocks && !isJumping) {
          for (let j = 0; j < jumpableBlocks.length; j++) {
            const jb = jumpableBlocks[j];
            if (Math.hypot((nx + 21) - jb.x, (ny + 40) - jb.y) < (jb.r + 12)) {
              col = true; break;
            }
          }
        }
        // Visual "encima del tronco" cuando está saltando sobre él
        document.querySelectorAll('.jumpable-obj').forEach(j => {
          const jx = parseInt(j.style.left) + 14, jy = parseInt(j.style.top) + 14;
          if (isJumping && Math.hypot((PX+21)-jx, (PY+40)-jy) < 28)
            j.classList.add('on-top');
          else j.classList.remove('on-top');
        });
        if (!col) {
          setPlayerPos(nx, ny);
          updatePlayerViewport();
          setSpriteDir(dx, dy);
        }
      } else {
        setSpriteDir(0, 0);
      }

      checkNpcProximity();
      requestAnimationFrame(loop);
    }

    document.addEventListener('keydown', e => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
      if (e.key === 'c' || e.key === 'C') { toggleIb(); return; }
      if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); doJump(); return; }
      if (e.key === 'e' || e.key === 'E') {
        let bestId = null, bestDist = 999;
        document.querySelectorAll('.npc[data-npcid]').forEach(el => {
          const nx = parseInt(el.style.left) || 0, ny = parseInt(el.style.top) || 0;
          const d = Math.hypot(PX - nx - 20, PY - ny - 30);
          if (d < PROX_DIST && d < bestDist) { bestDist = d; bestId = el.dataset.npcid; }
        });
        if (bestId === 'cave')  { e.preventDefault(); tryEnterCave(); return; }
        if (bestId === 'alien') { e.preventDefault(); showAlienGate(); return; }
        if (bestId) { e.preventDefault(); showNpc(bestId); }
        return;
      }
      keys[e.key] = true;
    });
    document.addEventListener('keyup', e => { delete keys[e.key]; });

    const MAP_DRAG_ENABLED = false;

    let drag = null, tdrag = null;
    const vp = document.getElementById('mapVP');
    if (MAP_DRAG_ENABLED) {
      vp.addEventListener('mousedown', e => {
        if (e.target.closest('.npc') || e.target.closest('#joystick') || e.target.closest('#fab') || e.target.closest('#bNav') || e.target.closest('#invPanel') || e.target.closest('#digBtn') || e.target.closest('#caveOv') || e.target.closest('#emojiGameOv') || e.target.closest('#elfaGateOv') || e.target.closest('#alienGateOv')) return;
        drag = { sx: e.clientX, sy: e.clientY, mx: G.mx, my: G.my };
        vp.classList.add('drag'); e.preventDefault();
      });
      window.addEventListener('mousemove', e => { if (!drag) return; G.mx = drag.mx - (e.clientX - drag.sx); G.my = drag.my - (e.clientY - drag.sy); applyMap(); });
      window.addEventListener('mouseup', () => { drag = null; vp.classList.remove('drag'); });
      vp.addEventListener('touchstart', e => {
        if (e.target.closest('.npc') || e.target.closest('#joystick') || e.target.closest('#bNav') || e.target.closest('#invPanel') || e.target.closest('#digBtn')) return;
        const t = e.touches[0]; tdrag = { sx: t.clientX, sy: t.clientY, mx: G.mx, my: G.my };
      }, { passive: true });
      vp.addEventListener('touchmove', e => {
        if (!tdrag) return; const t = e.touches[0];
        G.mx = tdrag.mx - (t.clientX - tdrag.sx); G.my = tdrag.my - (t.clientY - tdrag.sy); applyMap(); e.preventDefault();
      }, { passive: false });
      vp.addEventListener('touchend', () => tdrag = null);
    }

    function showNpc(id) {
      if (id === 'miner') { handleMinerDialog(); return; }
      if (id === 'elfa')  { openElfaGate(); return; }
      if (id === 'cave')  { tryEnterCave(); return; }

      const n = NPCS[id]; if (!n) return;
      document.getElementById('ndAv').textContent = n.av;
      document.getElementById('ndNm').textContent = n.nm;
      document.getElementById('ndRl').textContent = n.rl;
      document.getElementById('ndMs').innerHTML = n.msgs.map(m => `<div class="ndm">${m.replace(/\*(.*?)\*/g, '<em>$1</em>')}</div>`).join('');
      document.getElementById('npcOv').classList.add('show');
    }
    function closeNpc(e) { if (!e || e.target === document.getElementById('npcOv')) document.getElementById('npcOv').classList.remove('show'); }

    function openIb() { renderList(); document.getElementById('ibPanel').classList.add('open'); }
    function closeIb() {
      document.getElementById('ibPanel').classList.remove('open');
      document.getElementById('chPanel').classList.remove('show');
      G._c = null;
    }
    function toggleIb() { document.getElementById('ibPanel').classList.contains('open') ? closeIb() : openIb(); }

    function renderList() {
      const list = document.getElementById('clist'); list.innerHTML = '';
      let tot = 0;
      Object.values(CHARS).forEach(ch => {
        const c = G.cv[ch.id] || [], last = c[c.length - 1];
        const pv = last ? last.t.substring(0, 44) + (last.t.length > 44 ? '…' : '') : ch.pv;
        const isOut = last && last.s === 'u';
        const unr = ch.id === 'mango'
          ? (G.mangoUnr || 0)
          : (ch.done ? 0 : (c.length === 0 ? ch.unr : 0));
        tot += unr;
        const d = document.createElement('div'); d.className = 'ci'; d.onclick = () => openChat(ch.id);
        d.innerHTML = `<div class="ciav ${ch.bg}">${ch.em}${ch.done ? '' : '<div class="cidot"></div>'}</div>
      <div class="cimeta">
        <div class="citop"><span class="cinm">${ch.nm}</span><span class="citm ${unr ? 'u' : ''}">${ch.tm}</span></div>
        <div class="cibot">
          <span class="cipv">${isOut ? '<span style="color:var(--tx2)">Tú: </span>' : ''}${pv}</span>
          ${ch.done ? `<span class="cidn">✅ +${ch.xp}XP</span>` : (unr ? `<span class="cibg">${unr}</span>` : '')}
        </div>
      </div>`;
        list.appendChild(d);
      });
      document.getElementById('fbadge').textContent = tot || '';
      document.getElementById('fbadge').style.display = tot ? 'flex' : 'none';
      hud();
    }

    function openChat(id) {
      const ch = CHARS[id]; G._c = id; G.att[id] = G.att[id] || 0;
      if (id === 'mango') { G.mangoUnr = 0; sv(); }
      // Clear queued notifications for this contact
      MN.queue = MN.queue.filter(e => e.chId !== id);
      // Clear pending unread for this contact
      if (G._pendingUnr) G._pendingUnr[id] = 0;
      // Update badge immediately
      updateBadge();
      document.getElementById('chAv').textContent = ch.em;
      document.getElementById('chAv').className = 'chav ' + ch.bg;
      document.getElementById('chNm').textContent = ch.nm;
      document.getElementById('chSt').textContent = ch.done ? '✅ Misión completada' : 'en línea';
      document.getElementById('mctx').textContent = ch.mt;
      document.getElementById('mcxp').textContent = '+' + ch.xp + ' XP';
      document.getElementById('mchip').style.opacity = ch.done ? .55 : 1;
      const area = document.getElementById('msgs');
      area.innerHTML = '<div class="dchip">Hoy</div>';
      if (!G.cv[id] || G.cv[id].length === 0) { G.cv[id] = []; playInit(ch); }
      else { G.cv[id].forEach(m => bub(m.t, m.s, m.ts, false)); area.scrollTop = area.scrollHeight; }
      document.getElementById('chPanel').classList.add('show');
      setTimeout(() => document.getElementById('minp').focus(), 300);
      updatePermitChip();
    }
    function closeChat() { document.getElementById('chPanel').classList.remove('show'); G._c = null; renderList(); updatePermitChip(); }

    function playInit(ch) {
      ch.init.forEach((txt, i) => {
        setTimeout(() => {
          if (i < ch.init.length - 1) showTyp();
          setTimeout(() => { hideTyp(); const ts = now(); bub(txt, 'c', ts, true); G.cv[ch.id].push({ t: txt, s: 'c', ts }); sv(); }, 500);
        }, i * 1500);
      });
    }

    function bub(text, sender, ts, anim) {
      const area = document.getElementById('msgs');
      const row = document.createElement('div'); row.className = `mrow ${sender === 'u' ? 'out' : 'in'}`;
      if (!anim) row.style.animation = 'none';
      const h = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
      row.innerHTML = `<div class="mbub"><div class="mtxt">${h}</div>
    <div class="mmeta"><span class="mtime">${ts}</span>${sender === 'u' ? '<span class="mtick">✓✓</span>' : ''}</div>
  </div>`;
      area.appendChild(row); area.scrollTop = area.scrollHeight;
    }
    function showTyp() { document.getElementById('typ').classList.add('show'); document.getElementById('msgs').scrollTop = 9999; }
    function hideTyp() { document.getElementById('typ').classList.remove('show'); }
    function now() { const d = new Date(); return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0'); }

    function send() {
      const inp = document.getElementById('minp'); const text = inp.value.trim(); if (!text) return;
      const id = G._c, ch = CHARS[id], ts = now();
      bub(text, 'u', ts, true); G.cv[id].push({ t: text, s: 'u', ts });
      inp.value = ''; inp.style.height = 'auto';
      // Miner has custom chat logic
      if (id === 'miner') { handleMinerChatMessage(text); return; }
      
      // Entrega del anillo a Emma
      if (id === 'emma' && G.inv.ringPending) {
        if (text.includes('💍') || text.includes('anillo')) {
          G.inv.ringPending = false;
          G.inv.ring = 0;  // Eliminar del inventario
          G.inv.ringDelivered = true;
          delete G.inv.ring;  // Asegurar que se elimine
          sv();
          renderInv();  // Actualizar inventario
          onRingFound();  // Completar misión
          return;  // No continuar con el resto del chat
        }
      }
      
      if (ch.taskBased) {
        // Si escribe "anillo" 💍 sin haber completado la misión del anillo
        if (id === 'emma' && (text.includes('anillo') || text.includes('💍')) && !G.inv.ring && !G.ringQuestActive) {
          setTimeout(() => {
            showTyp();
            setTimeout(() => {
              hideTyp();
              const replies = [
                '¡Se parece pero ese no es mi anillo! 😅',
                'Cumplir una misión sin el más mínimo esfuerzo... eso no es de un héroe 💪',
                'Ese no es... sigue buscando en la Cueva Oscura 🕳️',
              ];
              const r = replies[Math.floor(Math.random() * replies.length)];
              const rt = now(); bub(r, 'c', rt, true); G.cv[id].push({ t: r, s: 'c', ts: rt });
              showMsgNotif(id, r);
            }, 800);
          }, 400);
          return;
        }
        setTimeout(() => {
          showTyp();
          setTimeout(() => {
            hideTyp();
            const replies = [
              '¡Visita el Mercado Feliz y ayúdame con la estantería! 🏪',
              'Las frutas no se organizan solas 😅 ¡Te espero en el mercado!',
              '¡Haz clic en mi tienda para empezar el minijuego! 👆',
            ];
            const r = replies[Math.floor(Math.random() * replies.length)];
            const rt = now(); bub(r, 'c', rt, true); G.cv[id].push({ t: r, s: 'c', ts: rt });
            showMsgNotif(id, r);
          }, 600 + Math.random() * 400);
        }, 400);
        return;
      }
      if (ch.done) {
        setTimeout(() => { showTyp(); setTimeout(() => { hideTyp(); bub(ch.dn, 'c', now(), true); G.cv[id].push({ t: ch.dn, s: 'c', ts: now() }); sv(); }, 900); }, 300); return;
      }
      G.att[id] = (G.att[id] || 0) + 1;
      const lo = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const ok = ch.ans.some(a => lo.includes(a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
      setTimeout(() => {
        showTyp(); setTimeout(() => {
          hideTyp(); let reply;
          if (ok) { reply = ch.ok; ch.done = true; G.xp += ch.xp; G.coins += ch.co; G.ms++; hud(); sv();
            if (id === 'emma') startEmmaRingQuest(); setTimeout(() => rw(ch), 1600); }
          else { const att = G.att[id]; const wr = ch.wrong[Math.floor(Math.random() * ch.wrong.length)]; const hint = att >= 2 ? '\n\n' + ch.hints[Math.min(att - 2, ch.hints.length - 1)] : ''; reply = wr + hint; }
          const rt = now(); bub(reply, 'c', rt, true); G.cv[id].push({ t: reply, s: 'c', ts: rt }); sv();
          showMsgNotif(id, reply);
          if (!ok && G.att[id] === 2) addHint(id);
        }, 800 + Math.random() * 600);
      }, 400);
    }

    function addHint(id) {
      const area = document.getElementById('msgs');
      const btn = document.createElement('button'); btn.className = 'hintbtn'; btn.textContent = '💡 Ver pista en el mapa';
      btn.onclick = () => { btn.remove(); const ch = CHARS[id], ts = now(), m = '🗺️ ' + ch.hints[0]; bub(m, 'c', ts, true); G.cv[id].push({ t: m, s: 'c', ts }); sv(); };
      area.appendChild(btn); area.scrollTop = area.scrollHeight;
    }

    document.getElementById('minp').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
    document.getElementById('minp').addEventListener('input', function () { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 104) + 'px'; });

    function rw(ch) {
      document.getElementById('rwEm').textContent = ch.em;
      document.getElementById('rwT').textContent = '¡Misión completada!';
      document.getElementById('rwD').textContent = `Descubriste el secreto de ${ch.nm}. ¡Emoji City te reconoce!`;
      document.getElementById('rwXP').textContent = `+${ch.xp} XP · +${ch.co} 🪙`;
      document.getElementById('rwPop').classList.add('show');
      const t = document.getElementById('toast'); t.textContent = `+${ch.xp} XP ⚡`; t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2500);
      const p = document.getElementById('pi-' + ch.id); if (p) p.style.display = 'none';
    }
    function closeRw() { document.getElementById('rwPop').classList.remove('show'); document.getElementById('chSt').textContent = '✅ Misión completada'; renderList(); }

    function hud() {
      document.getElementById('tbXP').textContent = G.xp;
      document.getElementById('tbC').textContent = G.coins;
      document.getElementById('pbXP').textContent = G.xp;
      document.getElementById('pbM').textContent = G.ms;
      document.getElementById('pbC2').textContent = G.coins;
      const lv = ['Novato', 'Explorador', 'Guerrero', 'Héroe', 'Leyenda'][Math.min(Math.floor(G.xp / 200), 4)];
      const ln = Math.min(Math.floor(G.xp / 200), 4) + 1;
      document.getElementById('tbLv').textContent = `Nv.${ln} ${lv}`;
      document.getElementById('pbLv').textContent = `Nivel ${ln} · ${lv}`;
    }

    function isMobile() { return window.innerWidth <= 899; }
    function updateResponsive() {
      const kbh = document.getElementById('kbh');
      const isPointerFine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
      kbh.style.display = isPointerFine ? 'flex' : 'none';
    }

    // ── MERCADO FELIZ MINIGAME ──────────────────
    const Market = {
      COLS: 8, ROWS: 3,
      P: {
        '🍉': { f: 3, l: 1, color: '#2E7D32', bg: '#E8F5E9', name: 'Sandía', star: true },
        '🍍': { f: 2, l: 2, color: '#6D4C41', bg: '#EFEBE9', name: 'Piña' },
        '🥭': { f: 2, l: 2, color: '#E65100', bg: '#FFF3E0', name: 'Mango' },
        '🍎': { f: 2, l: 1, color: '#B71C1C', bg: '#FFEBEE', name: 'Manzana' },
        '🍊': { f: 2, l: 1, color: '#E65100', bg: '#FFF3E0', name: 'Naranja' },
        '🍋': { f: 2, l: 1, color: '#F57F17', bg: '#FFFDE7', name: 'Limón' },
        '🍇': { f: 1, l: 2, color: '#6A1B9A', bg: '#F3E5F5', name: 'Uvas' },
        '🍐': { f: 1, l: 1, color: '#558B2F', bg: '#F1F8E9', name: 'Pera' },
        '🍒': { f: 1, l: 1, color: '#AD1457', bg: '#FCE4EC', name: 'Cerezas' },
        '🍓': { f: 1, l: 2, color: '#C62828', bg: '#FFEBEE', name: 'Fresa' },
        '🍑': { f: 1, l: 1, color: '#BF360C', bg: '#FBE9E7', name: 'Durazno' },
      },
      LAYOUTS_L1: [
        [
          ['🍉', '🍉', '🍉', '🍍', '🍍', '🥭', '🥭', '🍒'],
          ['🍎', '🍎', '🍍', '🍍', '🥭', '🥭', '🍇', '🍓'],
          ['🍊', '🍊', '🍋', '🍋', '🍐', '🍑', '🍇', '🍓'],
        ],
        [
          ['🍍', '🍍', '🍉', '🍉', '🍉', '🥭', '🥭', '🍒'],
          ['🍍', '🍍', '🍎', '🍎', '🍇', '🥭', '🥭', '🍓'],
          ['🍊', '🍊', '🍋', '🍋', '🍇', '🍐', '🍑', '🍓'],
        ],
        [
          ['🥭', '🥭', '🍍', '🍍', '🍒', '🍉', '🍉', '🍉'],
          ['🥭', '🥭', '🍍', '🍍', '🍓', '🍎', '🍎', '🍇'],
          ['🍊', '🍊', '🍋', '🍋', '🍑', '🍐', '🍓', '🍇'],
        ],
      ],
      DIALOGS_L1: [
        '¡Hola, aventurero! 👋 Bienvenido al <em>Mercado Feliz</em>, el mejor mercado de Emoji City.',
        'Oye… escuché que andas buscando <em>pistas</em> sobre Emoji City. Yo sé <strong>todo lo que pasa aquí</strong>. 🤫',
        '¡Pero estoy en apuros! Llegó el camión de entrega y mi estantería está <em>completamente vacía</em>. 📦😰',
        'Cada fruta tiene una <em>planimetría</em>: ocupa un número exacto de <strong>caras y niveles</strong> en la estantería.',
        'Si me ayudas a organizarla y colocas el <strong>producto estrella ⭐</strong>... <em>te cuento todo lo que sé</em>. ¡Trato hecho! 🤝',
      ],
      HINTS_L1: [
        [
          { t: 'El diagrama ■ en la lista te muestra cuánto espacio ocupa cada fruta. Por ejemplo <em>🍍 Piña = 2 caras × 2 niveles</em>.' },
          { t: 'Arrastra la fruta hacia la estantería. El juego coloca el bloque completo. Si hay algún conflicto, las celdas <em>parpadean en rojo</em>.' },
          { t: 'Para mover una fruta ya colocada, <strong>arrástrala de nuevo</strong> desde la estantería hacia otro lugar libre.' },
        ],
        [
          { t: 'Consejo: coloca primero los <em>productos grandes</em> (🍍 y 🥭, que son 2×2) para asegurar su espacio.' },
          { t: 'La <strong>Sandía 🍉 siempre va en la fila superior</strong> — ocupa 3 caras seguidas. ¡Búscale espacio ahí!' },
        ],
        [
          { t: '¡Último consejo! Una vez colocados 🍍 🥭 y 🍉, los espacios restantes se llenan solos con los productos pequeños.' },
          { t: '¿Ves las celdas que parpadean en dorado? Eso es donde <strong>debe ir la sandía ⭐</strong>.' },
        ],
      ],

      LAYOUTS_L2: [
        [
          ['🍇','🍇','🥭','🥭','🍉','🍉','🍉','🍑'],
          ['🍎','🍍','🍍','🥭','🥭','🍊','🍊','🍓'],
          ['🍋','🍍','🍍','🍒','🍐','🍐','🍓','🍋'],
        ],
        [
          ['🍍','🍍','🍉','🍉','🍉','🍍','🍍','🍒'],
          ['🥭','🥭','🍎','🍎','🍇','🥭','🥭','🍓'],
          ['🍊','🍊','🍋','🍋','🍇','🍐','🍑','🍓'],
        ],
        [
          ['🍒','🍉','🍉','🍉','🥭','🥭','🍍','🍍'],
          ['🍓','🥭','🥭','🍎','🍎','🍍','🍍','🍇'],
          ['🍓','🍑','🍐','🍋','🍋','🍊','🍊','🍇'],
        ],
      ],
      DIALOGS_L2: [
        '¡Bienvenido de nuevo! 👨‍🌾 ¡Sabía que volverías!',
        'Esta semana llegaron más pedidos y la estantería volvió a vaciarse. 😰 ¡Los clientes no paran!',
        'Ahora el trabajo es más complicado... más frutas mezcladas. <em>¡Nivel medio!</em> 📦🔶',
        'Ya no habrá pistas doradas — deberás recordar la <strong>planimetría de cada fruta</strong>.',
        'Si me ayudas de nuevo... <em>¡te daré el doble de experiencia y monedas!</em> ¡Trato hecho! 🤝💰',
      ],
      HINTS_L2: [
        [
          { t: 'En este nivel no hay celdas doradas. Revisa el diagrama ■ de cada fruta en la lista. 📋' },
          { t: 'Empieza por <em>🍉 Sandía (3×1)</em>, <em>🍍 Piña (2×2)</em> y <em>🥭 Mango (2×2)</em> — son las más grandes.' },
          { t: 'Recuerda: <strong>arrastra desde la lista</strong> hacia la estantería. ¡Puedes mover lo ya colocado!' },
        ],
        [
          { t: 'Consejo: coloca los 2×2 (<em>🍍 y 🥭</em>) en extremos opuestos para que no se estorben.' },
          { t: 'La <strong>Sandía 🍉</strong> sigue siendo 3×1 — necesita 3 huecos libres seguidos en la misma fila.' },
        ],
        [
          { t: '¡Casi! Fíjate en las frutas 1×2 como <em>🍇 Uvas</em> y <em>🍓 Fresa</em> — ocupan 2 niveles verticales.' },
          { t: 'Si estás atascado, <strong>levanta un bloque ya colocado</strong> y reubícalo para crear espacio.' },
        ],
      ],

      currentLv: 0,
      dlgIdx: 0,
      LAYOUT: null,
      grid: [],
      groups: {},
      gidSeq: 0,
      hintIdx: 0,
      drag: null,
      touchId: null,
      highlighted: [],
      mangoTimer: null,

      reset() {
        this.currentLv = G.mktLv >= 1 ? 1 : 0;
        const lvsLayouts = this.currentLv === 1 ? this.LAYOUTS_L2 : this.LAYOUTS_L1;
        const lvsDlgs    = this.currentLv === 1 ? this.DIALOGS_L2 : this.DIALOGS_L1;
        const lvsHints   = this.currentLv === 1 ? this.HINTS_L2   : this.HINTS_L1;
        this.DIALOGS = lvsDlgs;
        this.HINTS   = lvsHints;
        this._showStarHints = this.currentLv === 0;
        this.dlgIdx  = 0;
        this.LAYOUT  = lvsLayouts[Math.floor(Math.random() * 3)];
        this.grid = Array.from({ length: this.ROWS }, () => Array(this.COLS).fill(null));
        this.groups = {};
        this.gidSeq = 0;
        this.hintIdx = 0;
        this.drag = null;
        this.touchId = null;
        this.highlighted = [];
        clearTimeout(this.mangoTimer);
        this.renderDlg();
        document.querySelector('#sIntro').classList.remove('off');
        document.querySelector('#sGame').classList.add('off');
        this.buildCells();
        this.buildTray();
        this.updateHUD();
      },

      open() {
        document.getElementById('marketOv').classList.add('show');
        this.reset();
      },
      close() {
        document.getElementById('marketOv').classList.remove('show');
        if (this.drag) {
          document.getElementById('ghost').style.display = 'none';
          this.drag = null;
        }
      },

      renderDlg() {
        document.getElementById('dlgTxt').innerHTML = this.DIALOGS[this.dlgIdx];
        const btn = document.getElementById('btnDlg');
        btn.textContent = this.dlgIdx >= this.DIALOGS.length - 1 ? '¡Acepto el trato! 🤝' : 'Siguiente ›';
        if (this.dlgIdx >= this.DIALOGS.length - 1) {
          btn.style.background = 'linear-gradient(135deg,#FF6F00,#E65100)';
          btn.style.boxShadow = '0 4px 0 #BF360C,0 6px 18px rgba(255,111,0,.3)';
        } else {
          btn.style.background = '';
          btn.style.boxShadow = '';
        }
      },

      nextDlg() {
        if (this.dlgIdx >= this.DIALOGS.length - 1) {
          this.startGame();
          return;
        }
        this.dlgIdx++;
        this.renderDlg();
      },

      startGame() {
        document.querySelector('#sIntro').classList.add('off');
        document.querySelector('#sGame').classList.remove('off');
      },

      buildCells() {
        for (let r = 0; r < this.ROWS; r++) {
          const row = document.getElementById('row' + r);
          row.innerHTML = '';
          for (let c = 0; c < this.COLS; c++) {
            const el = document.createElement('div');
            el.className = 'cell';
            el.dataset.r = r; el.dataset.c = c;
            if (this._showStarHints && this.LAYOUT[r][c] === '🍉') el.classList.add('star-hint');
            el.addEventListener('mousedown', (e) => this.onCellMD(e));
            el.addEventListener('touchstart', (e) => this.onCellTS(e), { passive: false });
            row.appendChild(el);
          }
        }
      },

      cellEl(r, c) { return document.querySelector(`.market-game .cell[data-r="${r}"][data-c="${c}"]`); },

      buildTray() {
        const tray = document.getElementById('tray');
        tray.innerHTML = '';
        ['🍉', '🍍', '🥭', '🍎', '🍊', '🍋', '🍇', '🍐', '🍒', '🍓', '🍑'].forEach(em => {
          if (!this.P[em]) return;
          tray.appendChild(this.makeTI(em));
        });
      },

      makeTI(em) {
        const p = this.P[em];
        const d = document.createElement('div');
        d.className = 'ti'; d.id = 'ti-' + em; d.dataset.em = em;
        if (p.star) {
          const b = document.createElement('div');
          b.className = 'ti-star';
          b.textContent = '⭐ ESTRELLA';
          d.appendChild(b);
        }
        const eSpan = document.createElement('span');
        eSpan.className = 'ti-em';
        eSpan.textContent = em;
        const info = document.createElement('div');
        info.className = 'ti-info-row'; info.style.flex = '1'; info.style.minWidth = '0';
        const nm = document.createElement('div');
        nm.className = 'ti-nm';
        nm.textContent = p.name;
        const planRow = document.createElement('div');
        planRow.className = 'ti-plan';
        const shape = document.createElement('div');
        shape.className = 'ti-shape';
        shape.style.gridTemplateColumns = `repeat(${p.f},8px)`;
        shape.style.gridTemplateRows = `repeat(${p.l},8px)`;
        for (let i = 0; i < p.f * p.l; i++) {
          const sc = document.createElement('div');
          sc.className = 'ti-sc';
          sc.style.background = p.color;
          shape.appendChild(sc);
        }
        const txt = document.createElement('div');
        txt.className = 'ti-txt';
        txt.textContent = `${p.f} cara${p.f > 1 ? 's' : ''} × ${p.l} nivel${p.l > 1 ? 'es' : ''}`;
        planRow.appendChild(shape);
        planRow.appendChild(txt);
        info.appendChild(nm);
        info.appendChild(planRow);
        d.appendChild(eSpan);
        d.appendChild(info);
        d.addEventListener('mousedown', (e) => this.beginDragTray(em, e));
        d.addEventListener('touchstart', (e) => this.beginDragTrayT(em, e), { passive: false });
        return d;
      },

      tiState(em, state) {
        const d = document.getElementById('ti-' + em);
        if (!d) return;
        d.classList.remove('placed', 'dragging');
        const chk = d.querySelector('.ti-check');
        if (chk) chk.remove();
        if (state === 'placed') {
          d.classList.add('placed');
          const c = document.createElement('span');
          c.className = 'ti-check';
          c.textContent = '✅';
          d.appendChild(c);
        } else if (state === 'dragging') {
          d.classList.add('dragging');
        }
      },

      beginDrag(em, fromGid, x, y) {
        const p = this.P[em];
        if (!p) return;
        const ghost = document.getElementById('ghost');
        ghost.innerHTML = '';
        ghost.style.display = 'grid';
        ghost.style.gridTemplateColumns = `repeat(${p.f},var(--cs))`;
        ghost.style.gridTemplateRows = `repeat(${p.l},var(--cs))`;
        ghost.style.gap = 'var(--gap)';
        for (let i = 0; i < p.f * p.l; i++) {
          const gc = document.createElement('div');
          gc.className = 'gcell';
          gc.style.background = p.bg;
          gc.style.borderColor = p.color;
          gc.style.width = 'var(--cs)';
          gc.style.height = 'var(--cs)';
          gc.textContent = em;
          ghost.appendChild(gc);
        }
        this.drag = { em, fromGid };
        this.posGhost(x, y);
        this.tiState(em, 'dragging');
      },

      beginDragTray(em, e) {
        if (document.getElementById('ti-' + em).classList.contains('placed')) return;
        e.preventDefault();
        this.beginDrag(em, null, e.clientX, e.clientY);
      },

      beginDragTrayT(em, e) {
        if (document.getElementById('ti-' + em).classList.contains('placed')) return;
        e.preventDefault();
        const t = e.touches[0];
        this.touchId = t.identifier;
        this.beginDrag(em, null, t.clientX, t.clientY);
      },

      onCellMD(e) {
        const el = e.currentTarget;
        const gid = el.dataset.gid ? +el.dataset.gid : null;
        if (!gid || !this.groups[gid]) return;
        e.preventDefault(); e.stopPropagation();
        const em = this.groups[gid].emoji;
        this.liftGroup(gid);
        this.beginDrag(em, gid, e.clientX, e.clientY);
      },

      onCellTS(e) {
        const el = e.currentTarget;
        const gid = el.dataset.gid ? +el.dataset.gid : null;
        if (!gid || !this.groups[gid]) return;
        e.preventDefault(); e.stopPropagation();
        const em = this.groups[gid].emoji;
        const t = e.touches[0];
        this.touchId = t.identifier;
        this.liftGroup(gid);
        this.beginDrag(em, gid, t.clientX, t.clientY);
      },

      posGhost(x, y) {
        const g = document.getElementById('ghost');
        g.style.left = x + 'px';
        g.style.top = y + 'px';
      },

      moveDrag(x, y) {
        if (!this.drag) return;
        this.posGhost(x, y);
        const cell = this.cellAt(x, y);
        if (cell) this.hlPlan(this.drag.em, +cell.dataset.r, +cell.dataset.c);
        else this.clearHL();
      },

      endDrag(x, y) {
        this.clearHL();
        document.getElementById('ghost').style.display = 'none';
        if (!this.drag) return;
        const cell = this.cellAt(x, y);
        if (cell) {
          const r = +cell.dataset.r, c = +cell.dataset.c;
          const ok = this.tryPlace(this.drag.em, r, c);
          if (!ok) {
            this.flashArea(this.drag.em, r, c, 'fbad');
            this.tiState(this.drag.em, 'available');
            this.mangoSay(this.badMsg(this.drag.em));
          }
        } else {
          this.tiState(this.drag.em, 'available');
        }
        this.drag = null;
        this.touchId = null;
      },

      cellAt(x, y) {
        const g = document.getElementById('ghost');
        g.style.display = 'none';
        let el = document.elementFromPoint(x, y);
        g.style.display = 'grid';
        if (!el) return null;
        if (el.classList.contains('cell')) return el;
        el = el.closest('.cell');
        return el || null;
      },

      canPlace(em, r0, c0) {
        const p = this.P[em];
        if (!p) return false;
        if (c0 + p.f > this.COLS || r0 + p.l > this.ROWS) return false;
        for (let r = r0; r < r0 + p.l; r++)
          for (let c = c0; c < c0 + p.f; c++)
            if (this.grid[r][c]) return false;
        return true;
      },

      tryPlace(em, r0, c0) {
        if (!this.canPlace(em, r0, c0)) return false;
        const p = this.P[em];
        const gid = ++this.gidSeq;
        const cells = [];
        for (let r = r0; r < r0 + p.l; r++) {
          for (let c = c0; c < c0 + p.f; c++) {
            this.grid[r][c] = { emoji: em, gid };
            cells.push({ r, c });
          }
        }
        this.groups[gid] = { emoji: em, cells };
        this.renderCells(cells);
        this.flashCells(cells, 'fok');
        this.tiState(em, 'placed');
        this.updateHUD();
        this.checkWin();
        return true;
      },

      liftGroup(gid) {
        const g = this.groups[gid];
        if (!g) return;
        g.cells.forEach(({ r, c }) => this.grid[r][c] = null);
        delete this.groups[gid];
        this.tiState(g.emoji, 'dragging');
        this.renderCells(g.cells);
        this.updateHUD();
      },

      renderCells(cells) {
        cells.forEach(({ r, c }) => {
          const el = this.cellEl(r, c);
          if (!el) return;
          const s = this.grid[r][c];
          if (s) {
            const p = this.P[s.emoji];
            el.textContent = s.emoji;
            el.style.background = p.bg;
            el.style.borderColor = p.color;
            el.style.borderStyle = 'solid';
            el.dataset.gid = s.gid;
            el.classList.add('filled');
            el.classList.remove('star-hint');
          } else {
            el.textContent = '';
            el.style.background = '';
            el.style.borderColor = '';
            el.style.borderStyle = '';
            el.dataset.gid = '';
            el.classList.remove('filled');
            if (this._showStarHints && this.LAYOUT[r][c] === '🍉') el.classList.add('star-hint');
          }
        });
      },

      flashCells(cells, cls) {
        cells.forEach(({ r, c }) => {
          const el = this.cellEl(r, c);
          if (!el) return;
          el.classList.remove(cls);
          void el.offsetWidth;
          el.classList.add(cls);
          setTimeout(() => el.classList.remove(cls), 450);
        });
      },

      flashArea(em, r0, c0, cls) {
        const p = this.P[em];
        if (!p) return;
        const cells = [];
        for (let r = r0; r < Math.min(r0 + p.l, this.ROWS); r++)
          for (let c = c0; c < Math.min(c0 + p.f, this.COLS); c++)
            cells.push({ r, c });
        this.flashCells(cells, cls);
      },

      hlPlan(em, r0, c0) {
        this.clearHL();
        const p = this.P[em];
        if (!p) return;
        const valid = this.canPlace(em, r0, c0);
        for (let r = r0; r < r0 + p.l; r++) {
          for (let c = c0; c < c0 + p.f; c++) {
            if (r >= this.ROWS || c >= this.COLS) continue;
            const el = this.cellEl(r, c);
            if (!el) continue;
            el.classList.add(valid ? 'hl-ok' : 'hl-bad');
            this.highlighted.push(el);
          }
        }
      },

      clearHL() {
        this.highlighted.forEach(el => el.classList.remove('hl-ok', 'hl-bad'));
        this.highlighted = [];
      },

      updateHUD() {
        let n = 0;
        for (let r = 0; r < this.ROWS; r++)
          for (let c = 0; c < this.COLS; c++)
            if (this.grid[r][c]) n++;
        document.getElementById('placedC').textContent = n;
        document.getElementById('totalC').textContent = this.ROWS * this.COLS;
        document.getElementById('progBar').style.width = Math.round(n / (this.ROWS * this.COLS) * 100) + '%';
      },

      checkWin() {
        for (let r = 0; r < this.ROWS; r++)
          for (let c = 0; c < this.COLS; c++)
            if (!this.grid[r][c]) return;
        setTimeout(() => this.showWin(), 600);
      },

      showWin() {
        const CONF = ['🍉','⭐','🎉','✨','🏆','🍃','💚','🌟'];
        for (let i = 0; i < 22; i++) {
          setTimeout(() => {
            const c = document.createElement('div'); c.className = 'cf';
            c.textContent = CONF[Math.floor(Math.random() * CONF.length)];
            c.style.left = Math.random() * 100 + 'vw';
            c.style.animationDuration = (.65 + Math.random() * .75) + 's';
            c.style.animationDelay = (Math.random() * .35) + 's';
            document.body.appendChild(c);
            setTimeout(() => c.remove(), 1900);
          }, i * 55);
        }
        if (this.currentLv === 0) {
          document.getElementById('win-title').textContent = '¡¡Estantería Perfecta!!';
          document.getElementById('win-sub').textContent   = 'Don Mango cumple su promesa 🤝';
          document.getElementById('win-lv-badge').textContent = '⭐ Nivel 1 completado • Dificultad Fácil';
          document.getElementById('win-lv-badge').style.display = 'inline-block';
          document.getElementById('clueBody').innerHTML =
            'La <strong>🍉 Sandía</strong> es la fruta oficial de Emoji City y de todo Emoji World.' +
            '<br>¡Díselo a <strong>Emma</strong> para completar tu misión!';
          G.xp += 50; G.coins += 20; hud(); sv();
          document.getElementById('win-xp').textContent = '+50 XP · +20 🪙';
          document.getElementById('winOv').style.display = 'flex';
          G.mktLv = 1;
          setTimeout(() => this._sendMangoFollowUp(), 2500);
        } else {
          document.getElementById('win-title').textContent = '¡¡Maestro Organizador!!';
          document.getElementById('win-sub').textContent   = '¡Don Mango no puede creerlo! 🏆';
          document.getElementById('win-lv-badge').textContent = '🔶 Nivel 2 completado • Dificultad Media';
          document.getElementById('win-lv-badge').style.display = 'inline-block';
          document.getElementById('clueBody').innerHTML =
            '¡Ganaste <strong>+150 XP</strong> y <strong>+60 🪙</strong>!<br>' +
            'Don Mango: <em>"¡Eres el mejor organizador de Emoji City!" 🥭🍉</em>';
          G.xp += 150; G.coins += 60; hud(); sv();
          document.getElementById('win-xp').textContent = '+150 XP · +60 🪙';
          document.getElementById('winOv').style.display = 'flex';
          G.mktLv = 2;
          setTimeout(() => { rw({ em: '👨‍🌾', nm: 'Don Mango', xp: 150, co: 60 }); sv(); }, 1800);
        }
      },

      _sendMangoFollowUp() {
        if (!CHARS.mango) return;
        const ts = now();
        if (!G.cv['mango']) G.cv['mango'] = [];
        const msgs = [
          '¡Hola de nuevo! 👨‍🌾 ¡Hiciste un trabajo increíble hoy! 🍉',
          'Acabo de recibir un nuevo pedido enorme... 📦📦 ¡La estantería está vacía otra vez!',
          'Esta vez es más difícil — más variedad de frutas y *sin pistas doradas*. 🔶',
          '¡Pero sé que puedes! ¡Te daré el **doble de recompensa** si me ayudas! 💰🤝',
          '👉 Vuelve al *Mercado Feliz* cuando estés listo. 🏪',
        ];
        let delay = 0;
        msgs.forEach((m, i) => {
          delay += (i === 0 ? 600 : 1100 + Math.random() * 700);
          setTimeout(() => {
            G.cv['mango'].push({ t: m, s: 'c', ts });
            G.mangoUnr = msgs.length - i;
            renderList(); sv();
            showMsgNotif('mango', m);
          }, delay);
        });
      },

      closeWin() {
        document.getElementById('winOv').style.display = 'none';
        if (this.currentLv === 0) {
          toast('🗝️ ¡Habla con Emma en el mapa y dile: SANDÍA 🍉!');
        } else {
          toast('🏆 ¡Misión completada! Don Mango te enviará más encargos. 👨‍🌾');
        }
        this.close();
      },

      mangoSay(msg) {
        clearTimeout(this.mangoTimer);
        document.getElementById('mangoMsg').innerHTML = msg;
        this.mangoTimer = setTimeout(() => {
          document.getElementById('mangoMsg').innerHTML =
            'Arrastra las frutas a la estantería. <em>Cada una tiene su planimetría</em> — fíjate en el diagrama ■ de la lista.';
        }, 4000);
      },

      badMsg(em) {
        const p = this.P[em];
        const opts = [
          `¡No hay espacio para ${em}! Necesita ${p.f} cara${p.f > 1 ? 's' : ''} × ${p.l} nivel${p.l > 1 ? 'es' : ''} libres. 📦`,
          `${em} no cabe ahí — está ocupado. <em>Mueve algo</em> para hacer espacio.`,
          `¡Ese hueco es muy pequeño para ${em}! Necesita ${p.f * p.l} celdas juntas. 🤔`,
        ];
        return opts[Math.floor(Math.random() * opts.length)];
      },

      showHint() {
        const msgs = this.HINTS[Math.min(this.hintIdx, this.HINTS.length - 1)];
        document.getElementById('hintMsgs').innerHTML = msgs.map(m => `<div class="hint-msg">${m.t}</div>`).join('');
        document.getElementById('hintOv').style.display = 'flex';
        this.hintIdx++;
      },

      closeHint(e) {
        if (!e || e.target === document.getElementById('hintOv'))
          document.getElementById('hintOv').style.display = 'none';
      },

      addFromField() {
        const val = document.getElementById('eField').value.trim();
        document.getElementById('eField').value = '';
        document.querySelectorAll('.ti').forEach(i => i.style.outline = '');
        if (!val) { toast('Escribe un emoji del teclado 📱'); return; }
        const em = this.firstEmoji(val);
        if (!em) { toast('No reconocí un emoji. Prueba: 🍉 🍎 🍊 🍋 🍍'); return; }
        if (this.P[em]) {
          const item = document.getElementById('ti-' + em);
          if (item && item.classList.contains('placed')) {
            this.mangoSay(`¡Ya colocaste ${em}! Está en la estantería. ✅`);
          } else if (item) {
            this.mangoSay(`¡Perfecto! Ahora <em>arrastra ${em}</em> a la estantería. 🎯`);
            item.style.outline = '3px solid var(--gold)';
            setTimeout(() => item.style.outline = '', 2500);
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        } else {
          this.mangoSay(`${em} no está en el pedido de hoy 😅 Prueba: <strong>🍉 🍍 🥭 🍎 🍊 🍋 🍇 🍐 🍒 🍓 🍑</strong>`);
        }
      },

      firstEmoji(s) {
        const m = s.match(/\p{Emoji_Presentation}\uFE0F?(?:\u200D\p{Emoji_Presentation}\uFE0F?)*|\p{Emoji}\uFE0F/gu);
        return m ? m[0] : null;
      },
    };

    document.addEventListener('mousemove', e => {
      if (Market.drag) Market.moveDrag(e.clientX, e.clientY);
    });
    document.addEventListener('mouseup', e => {
      if (Market.drag) Market.endDrag(e.clientX, e.clientY);
    });
    document.addEventListener('touchmove', e => {
      if (!Market.drag) return;
      e.preventDefault();
      const t = [...e.touches].find(t => t.identifier === Market.touchId) || e.touches[0];
      Market.moveDrag(t.clientX, t.clientY);
    }, { passive: false });
    document.addEventListener('touchend', e => {
      if (!Market.drag) return;
      const t = [...e.changedTouches].find(t => t.identifier === Market.touchId) || e.changedTouches[0];
      Market.endDrag(t.clientX, t.clientY);
    }, { passive: false });

    function init() {
      loadGameFiles();
      // Restore alien ship if phase2 already started
      if (G.phase2) {
        phase2Started = true;
        const ship = document.getElementById('alienShip');
        if (ship) ship.style.display = 'block';
      }
      if (G.elfaPowers) elfaPowersGiven = true;
      if (G.caveUnlocked) {
        const ce = document.getElementById('caveEntrance');
        if (ce) { ce.classList.remove('cave-blocked'); }
      }

      // Check if emoji game was won
      checkEmojiGameWin();

      getVP(); setupJoystick(); setPlayerPos(PX, PY); updatePlayerViewport(); hud(); renderList();
      requestAnimationFrame(loop);
      Object.keys(CHARS).forEach(id => {
        if (CHARS[id].done) {
          const p = document.getElementById('pi-' + id);
          if (p) p.style.display = 'none';
        }
      });
      updateResponsive();
    }
    window.addEventListener('resize', () => {
      getVP(); applyMap(); updateResponsive();
      if (!isMobile()) {
        document.getElementById('ibPanel').style.transform = '';
      }
    });

    // Check for emoji game win when tab gains focus
    window.addEventListener('focus', () => {
      checkEmojiGameWin();
    });
  
