/* ==========================================================================
   UNIVERSO DE NOSOTROS - SCRIPT INTERACTIVO, AUDIO & EFECTOS CÓSMICOS
   ========================================================================== */

(function () {
  'use strict';

  // --- CONFIGURACIÓN Y ESTADO ---
  const CURRENT_LETTER_VERSION = 5;
  const DEFAULT_CONFIG = {
    letterVersion: CURRENT_LETTER_VERSION,
    partnerName: 'Arelita, mi amor, mi cielo, mi bby!!',
    yourName: 'Tu Amor;Tu Sami,Tu Niño Tiquito',
    letterGreeting: 'Para mi noviecita,feliz cumple my love,mi arelita, mi princesa, mi cielo, mi bby!!:',
    sigPrefix: 'Con todo mi amor y mis mejores deseos para este hermoso dia que es tu cumpleaños.',
    startDate: '2024-09-05',
    letterText: `Mi niña hermosa,

Hoy quiero recordarte lo inmensamente agradecido que estoy con la vida por ponerte en mi camino. Tienes el poder de iluminar mi dia con una sonrisa tuya,tu voz es mi calma favorita y si tus besos fueran un lugar serian el único lugar del mundo donde sentiria que todo está en paz,eres lo que mi corazon,cuerpo,mente y alma quiere por el resto de mi vida.

Gracias por ser mi compañera durante todo el trayecto que ambos estamos haciendo posible, eres mi confidente, mi mejor amiga y el amor más bonito y puro que jamás pude soñar.

Aqui mediante este escrito expreso mi emocion por tu cumple; a ti, a tu luz, a tu ternura y a todo lo hermoso que estamos construyendo juntos cada día.

Te amo más de lo que las palabras pueden explicar, hoy, mañana y por el resto de mi vida,te amare y te seguire amando hasta que Dios y tu me lo permitan. ❤️`
  };

  let config = { ...DEFAULT_CONFIG };
  let redeemedCoupons = [];
  let uploadedPhotos = {};
  let isLetterOpened = false;
  let typewriterInterval = null;

  // Cargar de LocalStorage
  function loadSavedData() {
    try {
      localStorage.removeItem('love_web_config');
      config = { ...DEFAULT_CONFIG };
      const savedCoupons = localStorage.getItem('love_web_coupons');
      if (savedCoupons) {
        redeemedCoupons = JSON.parse(savedCoupons);
      }
      const savedPhotos = localStorage.getItem('love_web_photos');
      if (savedPhotos) {
        uploadedPhotos = JSON.parse(savedPhotos);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  function saveConfig() {
    try {
      localStorage.setItem('love_web_config', JSON.stringify(config));
    } catch (e) {}
  }

  function saveCoupons() {
    try {
      localStorage.setItem('love_web_coupons', JSON.stringify(redeemedCoupons));
    } catch (e) {}
  }

  function savePhotos() {
    try {
      localStorage.setItem('love_web_photos', JSON.stringify(uploadedPhotos));
    } catch (e) {
      console.warn('LocalStorage photo save warning:', e);
    }
  }

  // Función para renderizar los párrafos de la carta de forma limpia y completa
  function renderLetterParagraphs(text) {
    const container = document.getElementById('letter-body-paragraphs');
    if (!container || !text) return;
    container.innerHTML = '';
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    paragraphs.forEach((pText, idx) => {
      const p = document.createElement('p');
      if (idx === 0 && (pText.toLowerCase().includes('mi niña') || pText.trim().endsWith(','))) {
        p.className = 'letter-salutation';
      }
      p.textContent = pText.trim();
      container.appendChild(p);
    });
  }

  // --- ACTUALIZAR TEXTOS EN LA PÁGINA ---
  function updateDOMFromConfig() {
    const partnerDisplay = document.getElementById('partner-name-display');
    const letterGreetingEl = document.getElementById('letter-greeting-text');
    const letterTo = document.getElementById('letter-to-name');
    const letterFrom = document.getElementById('letter-from-name');
    const sigPrefixEl = document.getElementById('sig-prefix-text');
    const footerPartner = document.getElementById('footer-partner-name');

    if (partnerDisplay) partnerDisplay.textContent = config.partnerName;
    if (letterGreetingEl && config.letterGreeting) {
      letterGreetingEl.textContent = config.letterGreeting;
    } else if (letterTo) {
      letterTo.textContent = config.partnerName;
    }
    if (sigPrefixEl && config.sigPrefix) sigPrefixEl.textContent = config.sigPrefix;
    if (letterFrom) letterFrom.textContent = config.yourName;
    if (footerPartner) footerPartner.textContent = config.partnerName;

    // Renderizar párrafos limpios de la carta completa
    if (config.letterText) {
      renderLetterParagraphs(config.letterText);
    }

    // Actualizar campos del modal de config
    const inPartner = document.getElementById('input-partner-name');
    const inYour = document.getElementById('input-your-name');
    const inDate = document.getElementById('input-start-date');
    const inLetter = document.getElementById('input-custom-letter');

    if (inPartner) inPartner.value = config.partnerName;
    if (inYour) inYour.value = config.yourName;
    if (inDate) inDate.value = config.startDate;
    if (inLetter) inLetter.value = config.letterText;
  }

  // ==========================================================================
  // SINTETIZADOR DE AUDIO ROMÁNTICO & EFECTOS (Web Audio API)
  // ==========================================================================
  class RomanticAudioSynth {
    constructor() {
      this.ctx = null;
      this.isPlaying = false;
      this.timer = null;
      this.gainNode = null;
      this.chordIndex = 0;

      // Progresión romántica inspirada en baladas y rondalla (C, Am, F, G)
      this.chords = [
        [261.63, 329.63, 392.00, 523.25], // C
        [220.00, 261.63, 329.63, 440.00], // Am
        [174.61, 220.00, 261.63, 349.23], // F
        [196.00, 246.94, 293.66, 392.00]  // G
      ];
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.setValueAtTime(0.18, this.ctx.currentTime);
        this.gainNode.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playNote(freq, startTime, duration = 2.5, type = 'sine', volume = 0.12) {
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, startTime);
        filter.frequency.exponentialRampToValueAtTime(300, startTime + duration);

        noteGain.gain.setValueAtTime(0.001, startTime);
        noteGain.gain.exponentialRampToValueAtTime(volume, startTime + 0.08);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.gainNode);

        osc.start(startTime);
        osc.stop(startTime + duration);
      } catch (e) {}
    }

    playNextBar() {
      if (!this.isPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const currentChord = this.chords[this.chordIndex % this.chords.length];
      this.chordIndex++;

      currentChord.forEach((freq, idx) => {
        const noteTime = now + (idx * 0.35);
        this.playNote(freq, noteTime, 2.8, 'triangle', 0.09);
      });

      this.timer = setTimeout(() => {
        this.playNextBar();
      }, 2400);
    }

    toggle() {
      this.init();
      if (this.isPlaying) {
        this.isPlaying = false;
        clearTimeout(this.timer);
      } else {
        this.isPlaying = true;
        this.playNextBar();
      }
    }

    playChime() {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        this.playNote(freq, now + (i * 0.08), 1.2, 'sine', 0.1);
      });
    }

    playWaxBreak() {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
      notes.forEach((freq, i) => {
        this.playNote(freq, now + (i * 0.06), 1.5, 'triangle', 0.12);
      });
    }

    playStarCatch() {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [659.25, 880, 1318.51];
      notes.forEach((freq, i) => {
        this.playNote(freq, now + (i * 0.05), 0.9, 'sine', 0.12);
      });
    }
  }

  // ==========================================================================
  // GESTOR MUSICAL: "¿HASTA DÓNDE TE QUIERO? - LA RONDALLA DE SALTILLO"
  // ==========================================================================
  class MusicManager {
    constructor() {
      this.isPlaying = false;
      this.ytPlayer = null;
      this.isYtReady = false;
      this.audioElement = document.getElementById('local-audio');
      this.synth = new RomanticAudioSynth();
      this.initYouTube();
    }

    initYouTube() {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
          document.head.appendChild(tag);
        }
      }

      window.onYouTubeIframeAPIReady = () => {
        try {
          this.ytPlayer = new YT.Player('yt-player', {
            height: '200',
            width: '200',
            videoId: 'rYwXfmgNSVI', // "¿Hasta Dónde Te Quiero?" - La Rondalla de Saltillo
            playerVars: {
              playsinline: 1,
              controls: 0,
              loop: 1,
              playlist: 'rYwXfmgNSVI',
              autoplay: 0
            },
            events: {
              onReady: (event) => {
                this.isYtReady = true;
                event.target.setVolume(100);
              },
              onStateChange: (event) => {
                if (event.data === YT.PlayerState.PLAYING) {
                  this.setPlayingState(true);
                } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
                  this.setPlayingState(false);
                }
              }
            }
          });
        } catch (e) {
          console.warn('YouTube API init fallback:', e);
        }
      };
    }

    play() {
      this.synth.init();

      // 1. YouTube Player
      if (this.ytPlayer && this.isYtReady && typeof this.ytPlayer.playVideo === 'function') {
        try {
          this.ytPlayer.playVideo();
          this.setPlayingState(true);
          return;
        } catch (e) {
          console.warn('YT play failed:', e);
        }
      }

      // 2. Audio Element local
      if (this.audioElement && this.audioElement.src && !this.audioElement.src.endsWith('.html')) {
        this.audioElement.play().then(() => {
          this.setPlayingState(true);
        }).catch(() => {
          this.fallbackToSynth();
        });
        return;
      }

      // 3. Fallback Sintetizador
      this.fallbackToSynth();
    }

    fallbackToSynth() {
      if (!this.synth.isPlaying) {
        this.synth.toggle();
      }
      this.setPlayingState(true);
    }

    pause() {
      if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
        try { this.ytPlayer.pauseVideo(); } catch (e) {}
      }
      if (this.audioElement) {
        this.audioElement.pause();
      }
      if (this.synth.isPlaying) {
        this.synth.toggle();
      }
      this.setPlayingState(false);
    }

    toggle() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    }

    setPlayingState(playing) {
      this.isPlaying = playing;
      const btn = document.getElementById('music-toggle-btn');
      const playIcon = document.getElementById('play-pause-icon');
      const vinyl = document.getElementById('vinyl-disc');
      const startBanner = document.getElementById('music-start-banner');

      if (playing) {
        if (btn) btn.classList.add('playing');
        if (playIcon) playIcon.textContent = '⏸';
        if (vinyl) vinyl.classList.add('spinning');
        if (startBanner) startBanner.classList.add('hidden-banner');
      } else {
        if (btn) btn.classList.remove('playing');
        if (playIcon) playIcon.textContent = '▶';
        if (vinyl) vinyl.classList.remove('spinning');
      }
    }

    playChime() { this.synth.playChime(); }
    playWaxBreak() { this.synth.playWaxBreak(); }
    playStarCatch() { this.synth.playStarCatch(); }
  }

  const audioSynth = new MusicManager();

  // ==========================================================================
  // CONTADOR DE TIEMPO DE AMOR
  // ==========================================================================
  function updateLoveCounter() {
    const daysEl = document.getElementById('days-count');
    const hoursEl = document.getElementById('hours-count');
    const minutesEl = document.getElementById('minutes-count');
    const secondsEl = document.getElementById('seconds-count');

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    const start = new Date(config.startDate + 'T00:00:00');
    const now = new Date();
    let diff = now.getTime() - start.getTime();

    if (diff < 0) diff = 0;

    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    daysEl.textContent = days;
    hoursEl.textContent = hours.toString().padStart(2, '0');
    minutesEl.textContent = minutes.toString().padStart(2, '0');
    secondsEl.textContent = seconds.toString().padStart(2, '0');
  }

  // ==========================================================================
  // CARTA INTERACTIVA CON SELLO DE CERA & TYPEWRITER
  // ==========================================================================
  function setupLetter() {
    const envelope = document.getElementById('envelope-box');
    const envelopeScene = document.getElementById('envelope-scene');
    const waxSeal = document.getElementById('wax-seal');
    const hintEl = document.getElementById('envelope-status-hint');
    const heroLetterBtn = document.getElementById('open-letter-hero-btn');
    const foldBtn = document.getElementById('btn-fold-letter');

    function openEnvelope() {
      if (envelope.classList.contains('open')) return;

      audioSynth.playWaxBreak();
      envelope.classList.add('open');
      if (envelopeScene) envelopeScene.classList.add('is-open');
      isLetterOpened = true;

      // Renderizar los párrafos completos de la carta
      renderLetterParagraphs(config.letterText);

      // Lanzar ráfaga de confeti y corazones
      spawnFloatingHeartBurst(window.innerWidth / 2, window.innerHeight * 0.65, 30);
      launchFireworkBurst(window.innerWidth / 2, window.innerHeight * 0.4);

      if (hintEl) {
        hintEl.innerHTML = '✨ ¡Carta abierta con todo mi amor! ✨';
      }
    }

    function closeEnvelope(e) {
      if (e) e.stopPropagation();
      envelope.classList.remove('open');
      if (envelopeScene) envelopeScene.classList.remove('is-open');
      isLetterOpened = false;
      audioSynth.playChime();
      if (hintEl) {
        hintEl.innerHTML = '✨ Toca el sello de cera para abrir tu carta de cumpleaños ✨';
      }
    }

    if (waxSeal) {
      waxSeal.addEventListener('click', openEnvelope);
    }

    if (heroLetterBtn) {
      heroLetterBtn.addEventListener('click', () => {
        const cartaSec = document.getElementById('carta-section');
        if (cartaSec) {
          cartaSec.scrollIntoView({ behavior: 'smooth' });
          setTimeout(() => {
            openEnvelope();
          }, 600);
        }
      });
    }

    if (foldBtn) {
      foldBtn.addEventListener('click', closeEnvelope);
    }
  }

  // ==========================================================================
  // PASTEL DE CUMPLEAÑOS INTERACTIVO (PEDIR UN DESEO)
  // ==========================================================================
  function setupCakeInteraction() {
    const cake = document.getElementById('interactive-cake');
    const wishStatus = document.getElementById('cake-wish-status');
    let wishBlown = false;

    if (!cake) return;

    cake.addEventListener('click', () => {
      const flames = cake.querySelectorAll('.candle-flame');
      const smokes = cake.querySelectorAll('.candle-smoke');

      if (!wishBlown) {
        // Apagar velitas de forma progresiva y natural
        flames.forEach(f => f.classList.add('blown-out'));
        smokes.forEach(s => s.classList.add('smoking'));
        wishBlown = true;
        audioSynth.playWaxBreak();

        // Lanzar fuegos artificiales y confeti
        const rect = cake.getBoundingClientRect();
        spawnFloatingHeartBurst(rect.left + rect.width / 2, rect.top, 30);
        launchGrandCelebration();

        if (wishStatus) {
          wishStatus.innerHTML = '✨ Aunque yo no sepa cuál haya sido tu deseo, de verdad anhelo que se cumpla con todo mi ser 💖🎂';
          wishStatus.classList.add('wish-granted');
        }
      } else {
        // Volver a encender si hace clic de nuevo
        flames.forEach(f => f.classList.remove('blown-out'));
        smokes.forEach(s => s.classList.remove('smoking'));
        wishBlown = false;
        audioSynth.playChime();
        if (wishStatus) {
          wishStatus.innerHTML = '✨ Aunque presiones mil y un veces y pienses que cada deseo queda en el olvido, mi único deseo, aunque no cumpla años yo, es que cada deseo que tú anheles con el corazón se pueda cumplir al pie de la letra, inclusive lo que te propongas como meta, corazón de melón; así que presiona tantas veces como tú quieras, mi cielo, con el corazón en la mano. 💖🎂';
          wishStatus.classList.add('wish-granted');
        }
      }
    });
  }

  // ==========================================================================
  // FRASCO DE DESEOS DE CUMPLEAÑOS (3D CARDS)
  // ==========================================================================
  const REASONS_LIST = [
    "Deseo que este nuevo año de vida esté lleno de momentos felices y carcajadas interminables.",
    "Amo cómo logras hacer del mundo un lugar más bonito con solo sonreír.",
    "Deseo que todos los proyectos y sueños que tienes en tu corazón se hagan realidad este año.",
    "Amo tu energía tan linda, tu ternura y la forma en que cuidas a los que amas.",
    "Deseo que nunca te falte salud, paz y la certeza de que siempre estaré a tu lado.",
    "Amo celebrar tu existencia hoy y cada uno de los días del año.",
    "Deseo que sigas brillando con esa luz única que te hace tan especial para todos.",
    "Amo cada aventura, charla y recuerdo que hemos construido juntos.",
    "Deseo que la vida te devuelva multiplicado todo el amor bonito que tú das.",
    "Amo la complicidad que tenemos y la alegría inmensa que me da verte triunfar.",
    "Deseo que este sea el mejor cumpleaños de tu vida hasta ahora.",
    "Amo cómo haces que cualquier día común se sienta como una fiesta mágica.",
    "Deseo que sigas alcanzando cada meta con esa inteligencia y pasión que te caracteriza.",
    "Amo tu risa contagiosa, tus abrazos que sanan todo y tu voz dulce.",
    "Deseo que nunca pierdas esa chispa tan hermosa que te hace inolvidable."
  ];

  let discoveredCount = 1;
  let currentReasonIndex = 0;

  function setupReasonsJar() {
    const jarTrigger = document.getElementById('jar-trigger');
    const drawBtn = document.getElementById('draw-reason-btn');
    const reasonCard = document.getElementById('current-reason-card');
    const reasonNumEl = document.getElementById('reason-number');
    const reasonTextEl = document.getElementById('reason-text');
    const countEl = document.getElementById('reasons-unlocked-count');

    function drawNextReason() {
      audioSynth.playChime();

      // Animación 3D de volteo de tarjeta
      if (reasonCard) {
        reasonCard.classList.remove('flipping');
        void reasonCard.offsetWidth; // trigger reflow
        reasonCard.classList.add('flipping');
      }

      // Elegir razón aleatoria distinta a la actual
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * REASONS_LIST.length);
      } while (nextIndex === currentReasonIndex && REASONS_LIST.length > 1);

      currentReasonIndex = nextIndex;
      discoveredCount = Math.min(23, discoveredCount + 1);

      setTimeout(() => {
        if (reasonNumEl) reasonNumEl.textContent = `Deseo #${discoveredCount}`;
        if (reasonTextEl) reasonTextEl.textContent = REASONS_LIST[currentReasonIndex];
        if (countEl) countEl.textContent = discoveredCount;
      }, 250);

      // Pequeña lluvia de chispas en el botón
      const rect = (drawBtn || jarTrigger).getBoundingClientRect();
      spawnFloatingHeartBurst(rect.left + rect.width / 2, rect.top, 12);
    }

    if (jarTrigger) jarTrigger.addEventListener('click', drawNextReason);
    if (drawBtn) drawBtn.addEventListener('click', drawNextReason);
  }

  // ==========================================================================
  // CUPONES DE REGALO DE CUMPLEAÑOS
  // ==========================================================================
  window.redeemCoupon = function (btnEl, couponId) {
    audioSynth.playChime();

    const ticket = btnEl.closest('.coupon-ticket');
    if (!ticket || ticket.classList.contains('redeemed')) return;

    ticket.classList.add('redeemed');
    if (!redeemedCoupons.includes(couponId)) {
      redeemedCoupons.push(couponId);
      saveCoupons();
    }

    const rect = ticket.getBoundingClientRect();
    spawnFloatingHeartBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 20);
    launchFireworkBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  function restoreRedeemedCoupons() {
    redeemedCoupons.forEach(id => {
      const ticket = document.querySelector(`.coupon-ticket[data-coupon-id="${id}"]`);
      if (ticket) {
        ticket.classList.add('redeemed');
      }
    });
  }

  // ==========================================================================
  // MINIJUEGO: REVIENTA LOS GLOBOS DE CUMPLEAÑOS
  // ==========================================================================
  function setupStarGame() {
    const startBtn = document.getElementById('start-game-btn');
    const gameField = document.getElementById('game-field');
    const fieldHint = document.getElementById('game-field-hint');
    const scoreDisplay = document.getElementById('star-score-display');
    const progressBar = document.getElementById('game-progress');
    const surpriseModal = document.getElementById('surprise-modal');

    let starsCaught = 0;
    const targetStars = 5;
    let gameInterval = null;
    let activeStarElements = [];
    const balloonEmojis = ['🎈', '🎁', '🎂', '🎉', '💖'];

    function updateGameScore() {
      if (scoreDisplay) {
        let starsStr = '';
        for (let i = 0; i < targetStars; i++) {
          starsStr += (i < starsCaught) ? '🎈' : '⚪';
        }
        scoreDisplay.textContent = starsStr;
      }
      if (progressBar) {
        const pct = (starsCaught / targetStars) * 100;
        progressBar.style.width = `${pct}%`;
      }
    }

    function spawnStar() {
      if (starsCaught >= targetStars || !gameField) return;

      const star = document.createElement('div');
      star.className = 'falling-star-target';
      star.textContent = balloonEmojis[Math.floor(Math.random() * balloonEmojis.length)];

      const fieldWidth = gameField.clientWidth - 50;
      const fieldHeight = gameField.clientHeight - 50;

      const startX = Math.random() * fieldWidth;
      const startY = Math.random() * fieldHeight;

      star.style.left = `${startX}px`;
      star.style.top = `${startY}px`;

      star.addEventListener('click', (e) => {
        e.stopPropagation();
        audioSynth.playStarCatch();
        starsCaught++;
        updateGameScore();

        // Partículas en el clic
        const rect = star.getBoundingClientRect();
        spawnFloatingHeartBurst(rect.left + 24, rect.top + 24, 15);

        star.remove();
        activeStarElements = activeStarElements.filter(s => s !== star);

        if (starsCaught >= targetStars) {
          endGameVictory();
        }
      });

      gameField.appendChild(star);
      activeStarElements.push(star);

      // Auto desaparecer tras 3.5 segundos si no se atrapa
      setTimeout(() => {
        if (star.parentNode) {
          star.remove();
          activeStarElements = activeStarElements.filter(s => s !== star);
        }
      }, 3500);
    }

    function startGame() {
      starsCaught = 0;
      updateGameScore();
      if (fieldHint) fieldHint.style.display = 'none';

      // Limpiar estrellas previas
      activeStarElements.forEach(s => s.remove());
      activeStarElements = [];

      if (gameInterval) clearInterval(gameInterval);

      spawnStar();
      gameInterval = setInterval(spawnStar, 900);
    }

    function endGameVictory() {
      if (gameInterval) clearInterval(gameInterval);
      activeStarElements.forEach(s => s.remove());

      if (fieldHint) {
        fieldHint.style.display = 'block';
        fieldHint.innerHTML = '🎉 ¡Completado! Desbloqueando sorpresa... 💖';
      }

      // Celebración apoteósica
      launchGrandCelebration();

      setTimeout(() => {
        if (surpriseModal) surpriseModal.classList.add('active');
      }, 1500);
    }

    if (startBtn) startBtn.addEventListener('click', startGame);
    if (gameField) {
      gameField.addEventListener('click', () => {
        if (starsCaught === 0 && !gameInterval) startGame();
      });
    }
  }

  // ==========================================================================
  // MODALES & PERSONALIZACIÓN EN VIVO
  // ==========================================================================
  function setupModals() {
    const configBtn = document.getElementById('config-open-btn');
    const configModal = document.getElementById('config-modal');
    const closeConfigBtn = document.getElementById('close-config-btn');
    const configForm = document.getElementById('config-form');
    const resetConfigBtn = document.getElementById('reset-config-btn');

    const surpriseModal = document.getElementById('surprise-modal');
    const closeSurpriseBtn = document.getElementById('close-surprise-btn');
    const modalCelebrateBtn = document.getElementById('modal-celebrate-btn');
    const footerCelebrateBtn = document.getElementById('celebrate-again-btn');

    // Abrir Config
    if (configBtn && configModal) {
      configBtn.addEventListener('click', () => {
        configModal.classList.add('active');
      });
    }

    // Cerrar Config
    if (closeConfigBtn && configModal) {
      closeConfigBtn.addEventListener('click', () => {
        configModal.classList.remove('active');
      });
    }

    // Guardar Config Form
    if (configForm) {
      configForm.addEventListener('submit', (e) => {
        e.preventDefault();
        config.partnerName = document.getElementById('input-partner-name').value.trim() || DEFAULT_CONFIG.partnerName;
        config.yourName = document.getElementById('input-your-name').value.trim() || DEFAULT_CONFIG.yourName;
        config.startDate = document.getElementById('input-start-date').value || DEFAULT_CONFIG.startDate;
        config.letterText = document.getElementById('input-custom-letter').value.trim() || DEFAULT_CONFIG.letterText;

        saveConfig();
        updateDOMFromConfig();
        updateLoveCounter();
        configModal.classList.remove('active');
        audioSynth.playChime();
      });
    }

    // Reset Config
    if (resetConfigBtn) {
      resetConfigBtn.addEventListener('click', () => {
        if (confirm('¿Deseas restaurar los valores románticos y fotos por defecto?')) {
          config = { ...DEFAULT_CONFIG };
          redeemedCoupons = [];
          uploadedPhotos = {};
          saveConfig();
          saveCoupons();
          try { localStorage.removeItem('love_web_photos'); } catch (e) {}
          updateDOMFromConfig();
          updateLoveCounter();
          document.querySelectorAll('.coupon-ticket').forEach(t => t.classList.remove('redeemed'));
          document.querySelectorAll('.photo-upload-slot').forEach(slot => {
            slot.classList.remove('has-image');
            const preview = slot.querySelector('.photo-preview');
            if (preview) {
              preview.src = '';
              preview.classList.add('hidden');
            }
          });
          configModal.classList.remove('active');
        }
      });
    }

    // Surprise Modal Controls
    if (closeSurpriseBtn && surpriseModal) {
      closeSurpriseBtn.addEventListener('click', () => {
        surpriseModal.classList.remove('active');
      });
    }

    if (modalCelebrateBtn) {
      modalCelebrateBtn.addEventListener('click', () => {
        launchGrandCelebration();
        audioSynth.playWaxBreak();
      });
    }

    if (footerCelebrateBtn) {
      footerCelebrateBtn.addEventListener('click', () => {
        launchGrandCelebration();
        audioSynth.playWaxBreak();
      });
    }
  }

  // ==========================================================================
  // MOTOR DEL CIELO ESTRELLADO & CONSTELACIONES INTERACTIVAS (CANVAS)
  // ==========================================================================
  function setupUniverseCanvas() {
    const canvas = document.getElementById('universe-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const numStars = Math.floor((width * height) / 8000);
    const stars = [];

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.6 + 0.4,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        color: ['#ffffff', '#ffd166', '#ff7597', '#c8b6ff'][Math.floor(Math.random() * 4)]
      });
    }

    // Estrellas fugaces
    let shootingStar = null;
    function maybeSpawnShootingStar() {
      if (!shootingStar && Math.random() < 0.015) {
        shootingStar = {
          x: Math.random() * width * 0.8,
          y: Math.random() * (height * 0.4),
          len: Math.random() * 90 + 70,
          speed: Math.random() * 12 + 10,
          angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1),
          alpha: 1
        };
      }
    }

    let mouseX = -1000;
    let mouseY = -1000;
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      const cursorGlow = document.getElementById('cursor-glow');
      if (cursorGlow) {
        cursorGlow.style.left = `${mouseX}px`;
        cursorGlow.style.top = `${mouseY}px`;
      }
    });

    function drawUniverse() {
      ctx.clearRect(0, 0, width, height);

      // Fondo degradado cósmico
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, width * 0.1, width / 2, height / 2, width * 0.9);
      bgGrad.addColorStop(0, '#130a26');
      bgGrad.addColorStop(0.5, '#0d071a');
      bgGrad.addColorStop(1, '#05030a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Dibujar y actualizar estrellas
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        star.x += star.vx;
        star.y += star.vy;
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        star.alpha += star.twinkleSpeed;
        if (star.alpha > 0.95 || star.alpha < 0.2) {
          star.twinkleSpeed = -star.twinkleSpeed;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, star.alpha));
        ctx.fill();

        // Conectar líneas de constelación cerca del cursor
        const dx = mouseX - star.x;
        const dy = mouseY - star.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(mouseX, mouseY);
          ctx.strokeStyle = `rgba(255, 117, 151, ${ (1 - dist / 130) * 0.35 })`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }

      // Dibujar estrella fugaz
      maybeSpawnShootingStar();
      if (shootingStar) {
        shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed;
        shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed;
        shootingStar.alpha -= 0.02;

        const tailX = shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.len;
        const tailY = shootingStar.y - Math.sin(shootingStar.angle) * shootingStar.len;

        const grad = ctx.createLinearGradient(tailX, tailY, shootingStar.x, shootingStar.y);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(1, `rgba(255, 209, 102, ${shootingStar.alpha})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(shootingStar.x, shootingStar.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        if (shootingStar.alpha <= 0 || shootingStar.x > width || shootingStar.y > height) {
          shootingStar = null;
        }
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(drawUniverse);
    }

    drawUniverse();
  }

  // ==========================================================================
  // MOTOR DE FUEGOS ARTIFICIALES & CORAZONES FLOTANTES
  // ==========================================================================
  const fireworkCanvas = document.getElementById('fireworks-canvas');
  let fwCtx = null;
  let fwWidth = 0, fwHeight = 0;
  let particles = [];

  if (fireworkCanvas) {
    fwCtx = fireworkCanvas.getContext('2d');
    fwWidth = fireworkCanvas.width = window.innerWidth;
    fwHeight = fireworkCanvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
      fwWidth = fireworkCanvas.width = window.innerWidth;
      fwHeight = fireworkCanvas.height = window.innerHeight;
    });
  }

  function createFireworkParticle(x, y, color, isHeart = false) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 2;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      decay: Math.random() * 0.015 + 0.01,
      color,
      radius: isHeart ? 14 : Math.random() * 3 + 1.5,
      isHeart,
      gravity: 0.08
    };
  }

  function launchFireworkBurst(x, y) {
    if (!fwCtx) return;
    const colors = ['#ff4081', '#ffd166', '#ff7597', '#ffffff', '#e63946', '#9d4edd'];
    const count = 45;
    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      particles.push(createFireworkParticle(x, y, color, Math.random() < 0.2));
    }
  }

  function spawnFloatingHeartBurst(x, y, count = 15) {
    if (!fwCtx) return;
    for (let i = 0; i < count; i++) {
      particles.push(createFireworkParticle(x, y, '#ff4081', true));
    }
  }

  function launchGrandCelebration() {
    const bursts = 8;
    for (let i = 0; i < bursts; i++) {
      setTimeout(() => {
        const randX = Math.random() * (fwWidth * 0.7) + fwWidth * 0.15;
        const randY = Math.random() * (fwHeight * 0.5) + fwHeight * 0.15;
        launchFireworkBurst(randX, randY);
      }, i * 350);
    }
    // Lanzar lluvia de marcos de fotos
    launchPhotoRain();
  }

  // ==========================================================================
  // LLUVIA DE MARCOS DE FOTOS (Corazón, Estrella, Pastel, Flor, Luna)
  // ==========================================================================

  // Mapa persistente: forma → URL de imagen elegida por el usuario
  const rainFramePhotos = {};

  const FRAME_TYPES = [
    { shape: 'heart',  deco: '❤️',  label: '📸 Tu foto aquí' },
    { shape: 'star',   deco: '⭐',  label: '📸 Tu foto aquí' },
    { shape: 'cake',   deco: '🎂',  label: '📸 Tu foto aquí' },
    { shape: 'flower', deco: '🌸',  label: '📸 Tu foto aquí' },
    { shape: 'moon',   deco: '🌙',  label: '📸 Tu foto aquí' },
    { shape: 'heart',  deco: '💖',  label: '📸 Tu foto aquí' },
    { shape: 'star',   deco: '✨',  label: '📸 Tu foto aquí' },
    { shape: 'cake',   deco: '🍰',  label: '📸 Tu foto aquí' },
    { shape: 'flower', deco: '🌺',  label: '📸 Tu foto aquí' },
    { shape: 'moon',   deco: '💫',  label: '📸 Tu foto aquí' },
    { shape: 'heart',  deco: '🎀',  label: '📸 Tu foto aquí' },
    { shape: 'star',   deco: '🌟',  label: '📸 Tu foto aquí' },
  ];


  function launchPhotoRain() {
    // Crear overlay si no existe
    let overlay = document.getElementById('photo-rain-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'photo-rain-overlay';
      document.body.appendChild(overlay);
    }

    // Lanzar cada marco con un delay escalonado
    FRAME_TYPES.forEach((type, i) => {
      setTimeout(() => {
        spawnRainFrame(overlay, type, i);
      }, i * 400);
    });
  }

  function spawnRainFrame(overlay, type, index) {
    const frameId = `rain-frame-${index}`;

    // Reutilizar si ya existe (para no duplicar en clics repetidos)
    let existing = document.getElementById(frameId);
    if (existing) existing.remove();

    const frame = document.createElement('div');
    frame.id = frameId;
    frame.className = `rain-frame shape-${type.shape}`;

    // Posición horizontal aleatoria
    const leftPct = 5 + Math.random() * 85;
    const rot = (Math.random() * 30 - 15).toFixed(1);
    const duration = (7 + Math.random() * 5).toFixed(1);
    const delay = (Math.random() * 1.5).toFixed(2);

    frame.style.left = `${leftPct}%`;
    frame.style.setProperty('--rot', `${rot}deg`);
    frame.style.transform = `rotate(${rot}deg)`;
    frame.style.animationDuration = `${duration}s`;
    frame.style.animationDelay = `${delay}s`;

    // Input de archivo oculto
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    // Decoración emoji
    const deco = document.createElement('span');
    deco.className = 'frame-deco';
    deco.textContent = type.deco;

    // Contenedor de foto con forma
    const wrap = document.createElement('div');
    wrap.className = 'frame-photo-wrap';

    // Imagen (oculta inicialmente)
    const img = document.createElement('img');
    img.className = 'frame-img';
    img.alt = 'Foto de amor';
    img.style.display = 'none';

    // Hint de "ponme tu foto"
    const hint = document.createElement('div');
    hint.className = 'frame-add-hint';
    hint.innerHTML = `<span class="add-icon">${type.deco}</span><span class="add-label">${type.label}</span>`;

    // Si ya tenemos foto guardada para esta forma, usarla
    if (rainFramePhotos[`${type.shape}-${index}`]) {
      img.src = rainFramePhotos[`${type.shape}-${index}`];
      img.style.display = 'block';
      hint.classList.add('has-photo');
    }

    // Al seleccionar archivo
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target.result;
        img.src = url;
        img.style.display = 'block';
        hint.classList.add('has-photo');
        rainFramePhotos[`${type.shape}-${index}`] = url;
        // Chispas al subir foto
        const rect = frame.getBoundingClientRect();
        spawnFloatingHeartBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 10);
      };
      reader.readAsDataURL(file);
    });

    // Clic en el marco abre el selector de archivo
    frame.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    wrap.appendChild(img);
    wrap.appendChild(hint);
    frame.appendChild(fileInput);
    frame.appendChild(deco);
    frame.appendChild(wrap);
    overlay.appendChild(frame);

    // Eliminar del DOM cuando termine la animación
    frame.addEventListener('animationend', () => {
      frame.remove();
    });
  }


  function animateFireworks() {
    if (fwCtx && particles.length > 0) {
      fwCtx.clearRect(0, 0, fwWidth, fwHeight);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        fwCtx.save();
        fwCtx.globalAlpha = p.alpha;
        if (p.isHeart) {
          fwCtx.font = `${p.radius}px serif`;
          fwCtx.textAlign = 'center';
          fwCtx.textBaseline = 'middle';
          fwCtx.fillText('💖', p.x, p.y);
        } else {
          fwCtx.beginPath();
          fwCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          fwCtx.fillStyle = p.color;
          fwCtx.shadowBlur = 8;
          fwCtx.shadowColor = p.color;
          fwCtx.fill();
        }
        fwCtx.restore();
      }
    } else if (fwCtx) {
      fwCtx.clearRect(0, 0, fwWidth, fwHeight);
    }
    requestAnimationFrame(animateFireworks);
  }
  animateFireworks();

  // ==========================================================================
  // GESTOR DE MARCOS DE FOTOS INTERACTIVOS & SUBIDA
  // ==========================================================================
  function setupPhotoUploads() {
    const slots = document.querySelectorAll('.photo-upload-slot');

    slots.forEach(slot => {
      const slotId = slot.getAttribute('data-slot-id');
      const fileInput = slot.querySelector('.hidden-file-input');
      const previewImg = slot.querySelector('.photo-preview');

      // Restaurar si ya existía una foto guardada
      if (uploadedPhotos[slotId] && previewImg) {
        previewImg.src = uploadedPhotos[slotId];
        previewImg.classList.remove('hidden');
        slot.classList.add('has-image');
      }

      // Al hacer clic en el marco, abrir selector de archivos
      slot.addEventListener('click', (e) => {
        if (fileInput) fileInput.click();
      });

      // Al seleccionar una foto
      if (fileInput) {
        fileInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target.result;
            uploadedPhotos[slotId] = dataUrl;
            savePhotos();

            if (previewImg) {
              previewImg.src = dataUrl;
              previewImg.classList.remove('hidden');
              slot.classList.add('has-image');
            }

            audioSynth.playChime();
            const rect = slot.getBoundingClientRect();
            spawnFloatingHeartBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 20);
            launchFireworkBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
          };
          reader.readAsDataURL(file);
        });
      }
    });
  }

  // ==========================================================================
  // INICIALIZACIÓN GENERAL
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    loadSavedData();
    updateDOMFromConfig();
    updateLoveCounter();
    setInterval(updateLoveCounter, 1000);

    setupUniverseCanvas();
    setupCakeInteraction();
    setupLetter();
    setupReasonsJar();
    setupStarGame();
    setupModals();
    setupPhotoUploads();
    restoreRedeemedCoupons();

    const musicBtn = document.getElementById('music-toggle-btn');
    if (musicBtn) {
      musicBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        audioSynth.toggle();
      });
    }

    // Botón del banner de bienvenida para iniciar música
    const startBannerBtn = document.getElementById('start-music-banner-btn');
    const startBanner = document.getElementById('music-start-banner');
    if (startBannerBtn) {
      startBannerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        audioSynth.play();
        if (startBanner) startBanner.classList.add('hidden-banner');
      });
    }

    if (startBanner) {
      startBanner.addEventListener('click', () => {
        audioSynth.play();
        startBanner.classList.add('hidden-banner');
      });
    }

    // Al primer clic en cualquier parte de la página, ocultar el banner e iniciar la música
    document.body.addEventListener('click', () => {
      if (!audioSynth.isPlaying) {
        audioSynth.play();
      }
      if (startBanner) startBanner.classList.add('hidden-banner');
    }, { once: true });
  });

})();
