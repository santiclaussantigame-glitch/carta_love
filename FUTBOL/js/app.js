/**
 * Main Application Controller for FC Mobile Meta Hub
 */

/**
 * Fallback de imagen: cuando una imagen de jugador no carga,
 * muestra un círculo con las iniciales del jugador y el color del evento.
 */
function handleAvatarError(img, color, initials) {
    img.onerror = null;
    const container = img.parentElement;
    const safeColor = color || '#00d2ff';
    const safeInitials = initials || '??';
    container.innerHTML = `
        <div class="avatar-fallback" style="--fb-color:${safeColor}">
            <span>${safeInitials}</span>
        </div>
    `;
}

const App = {
    filters: {
        search: '',
        position: 'ALL',
        event: 'ALL',
        minOvr: 118,
        sortBy: 'ovr-desc'
    },
    activePlayerModal: null,
    activeRank: 0,

    init() {
        this.renderEventFilters();
        this.applyFilters();
        this.setupEventListeners();
        CompareManager.init();
        SquadManager.init();
        this.setupCardTilt();
    },

    setupEventListeners() {
        // Buscador en tiempo real
        const searchInput = document.getElementById('player-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value.toLowerCase().trim();
                this.applyFilters();
            });
        }

        // Ordenamiento
        const sortSelect = document.getElementById('sort-by');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.filters.sortBy = e.target.value;
                this.applyFilters();
            });
        }

        // Filtro de OVR Slider
        const ovrSlider = document.getElementById('ovr-slider');
        const ovrDisplay = document.getElementById('ovr-display');
        if (ovrSlider && ovrDisplay) {
            ovrSlider.addEventListener('input', (e) => {
                this.filters.minOvr = parseInt(e.target.value);
                ovrDisplay.textContent = `${this.filters.minOvr}+`;
                this.applyFilters();
            });
        }

        // Delegación de eventos para sonidos de botones
        document.addEventListener('click', (e) => {
            if (e.target.closest('button') || e.target.closest('.filter-pill') || e.target.closest('.nav-link')) {
                SoundFX.playClick();
            }
        });

        // Scroll Spy para menú superior
        window.addEventListener('scroll', () => {
            const sections = ['players-section', 'compare-section', 'squad-section'];
            const scrollPos = window.scrollY + 200;

            sections.forEach(secId => {
                const el = document.getElementById(secId);
                const link = document.querySelector(`a[href="#${secId}"]`);
                if (el && link) {
                    const top = el.offsetTop;
                    const height = el.offsetHeight;
                    if (scrollPos >= top && scrollPos < top + height) {
                        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                        link.classList.add('active');
                    }
                }
            });
        });
    },

    renderEventFilters() {
        const container = document.getElementById('event-filters');
        if (!container) return;

        let html = `<button class="filter-pill active" onclick="App.setEventFilter('ALL', this)">Todos los Eventos</button>`;
        for (let key in FC_EVENTS) {
            const ev = FC_EVENTS[key];
            html += `<button class="filter-pill" onclick="App.setEventFilter('${ev.id}', this)">${ev.badge}</button>`;
        }
        container.innerHTML = html;
    },

    setPositionFilter(pos, btn) {
        this.filters.position = pos;
        document.querySelectorAll('.pos-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        this.applyFilters();
    },

    setEventFilter(eventId, btn) {
        this.filters.event = eventId;
        document.querySelectorAll('#event-filters .filter-pill').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        this.applyFilters();
    },

    applyFilters() {
        let list = [...PLAYERS_DATA];

        // Filtro texto
        if (this.filters.search) {
            const q = this.filters.search;
            list = list.filter(p => 
                p.name.toLowerCase().includes(q) || 
                (p.fullName && p.fullName.toLowerCase().includes(q)) ||
                p.shortName.toLowerCase().includes(q) ||
                p.nation.toLowerCase().includes(q) || 
                p.club.toLowerCase().includes(q) ||
                p.positionDetail.toLowerCase().includes(q)
            );
        }

        // Filtro posición
        if (this.filters.position !== 'ALL') {
            list = list.filter(p => p.position === this.filters.position);
        }

        // Filtro evento
        if (this.filters.event !== 'ALL') {
            list = list.filter(p => p.event.id === this.filters.event);
        }

        // Filtro OVR
        list = list.filter(p => p.ovr >= this.filters.minOvr);

        // Ordenamiento
        list.sort((a, b) => {
            switch (this.filters.sortBy) {
                case 'ovr-desc': return b.ovr - a.ovr;
                case 'ovr-asc': return a.ovr - b.ovr;
                case 'pac-desc': return b.stats.pac - a.stats.pac;
                case 'sho-desc': return b.stats.sho - a.stats.sho;
                case 'pas-desc': return b.stats.pas - a.stats.pas;
                case 'dri-desc': return b.stats.dri - a.stats.dri;
                case 'def-desc': return b.stats.def - a.stats.def;
                case 'phy-desc': return b.stats.phy - a.stats.phy;
                case 'price-desc': {
                    const pa = parseInt(a.price.replace('M', '')) || 0;
                    const pb = parseInt(b.price.replace('M', '')) || 0;
                    return pb - pa;
                }
                default: return b.ovr - a.ovr;
            }
        });

        this.renderCards(list);
        this.updateHeroStats(list);
    },

    updateHeroStats(currentList) {
        const totalEl = document.getElementById('stat-total-players');
        const maxOvrEl = document.getElementById('stat-max-ovr');
        const avgOvrEl = document.getElementById('stat-avg-ovr');

        if (totalEl) totalEl.textContent = currentList.length;
        if (maxOvrEl) {
            const max = Math.max(...PLAYERS_DATA.map(p => p.ovr), 0);
            maxOvrEl.textContent = max;
        }
        if (avgOvrEl) {
            const avg = currentList.length > 0 ? Math.round(currentList.reduce((a, b) => a + b.ovr, 0) / currentList.length) : 0;
            avgOvrEl.textContent = avg;
        }
    },

    renderCards(players) {
        const grid = document.getElementById('players-grid');
        if (!grid) return;

        if (players.length === 0) {
            grid.innerHTML = `
                <div class="empty-results">
                    <div class="empty-icon">🔍</div>
                    <h3>No se encontraron jugadores</h3>
                    <p>Prueba ajustando los filtros de búsqueda o el rango de media.</p>
                    <button class="btn btn-outline" onclick="App.resetFilters()">Restablecer Filtros</button>
                </div>
            `;
            return;
        }

        grid.innerHTML = players.map(p => {
            const statLabels = p.isGoalkeeper ? 
                ['DIV', 'HAN', 'KIC', 'REF', 'SPD', 'POS'] : 
                ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];

            return `
                <div class="fc-card-wrapper" data-player-id="${p.id}" onmouseenter="SoundFX.playHover()">
                    <div class="fc-card ${p.event.cardStyle}" style="--theme-color: ${p.event.color}; --theme-glow: ${p.event.borderGlow}">
                        <div class="card-shimmer"></div>
                        
                        <!-- Top Meta Header -->
                        <div class="card-header-meta">
                            <div class="card-rating-box">
                                <span class="card-ovr">${p.ovr}</span>
                                <span class="card-pos">${p.positionDetail}</span>
                            </div>
                            <div class="card-badges-box">
                                <span class="card-flag" title="${p.nation}">${p.nationFlag}</span>
                                <span class="card-club-logo" title="${p.club}">${p.clubLogo}</span>
                            </div>
                        </div>

                        <div class="card-player-render">
                             <img src="${p.avatar}" alt="${p.shortName}" class="player-photo" loading="lazy" 
                                  onerror="handleAvatarError(this, '${p.event.color.replace(/'/g, '')}', '${p.shortName.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()}')" />
                             <div class="player-glow-radial"></div>
                         </div>

                        <!-- Card Name & Event Info -->
                        <div class="card-info">
                            <div class="card-event-badge">${p.event.badge}</div>
                            <h3 class="card-player-name">${p.shortName}</h3>
                            <div class="card-stars-row">
                                <span class="stars-sm">Filigranas: ${'★'.repeat(p.skillMoves)}</span>
                                <span class="stars-sm">Pie: ${'★'.repeat(p.weakFoot)}</span>
                            </div>
                        </div>

                        <!-- Card 6 Main Stats Matrix -->
                        <div class="card-stats-matrix">
                            <div class="stat-col"><span class="s-val">${p.stats.pac}</span><span class="s-lbl">${statLabels[0]}</span></div>
                            <div class="stat-col"><span class="s-val">${p.stats.sho}</span><span class="s-lbl">${statLabels[1]}</span></div>
                            <div class="stat-col"><span class="s-val">${p.stats.pas}</span><span class="s-lbl">${statLabels[2]}</span></div>
                            <div class="stat-col"><span class="s-val">${p.stats.dri}</span><span class="s-lbl">${statLabels[3]}</span></div>
                            <div class="stat-col"><span class="s-val">${p.stats.def}</span><span class="s-lbl">${statLabels[4]}</span></div>
                            <div class="stat-col"><span class="s-val">${p.stats.phy}</span><span class="s-lbl">${statLabels[5]}</span></div>
                        </div>

                        <!-- Hover Card Action Footer -->
                        <div class="card-actions">
                            <button class="btn-card-action btn-view" onclick="App.openPlayerModal('${p.id}')">
                                <span>Ver Atributos</span>
                            </button>
                            <button class="btn-card-action btn-compare-quick" title="Comparar" onclick="App.quickCompare('${p.id}')">
                                <span>VS</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.setupCardTilt();
    },

    resetFilters() {
        this.filters = {
            search: '',
            position: 'ALL',
            event: 'ALL',
            minOvr: 118,
            sortBy: 'ovr-desc'
        };
        const searchInput = document.getElementById('player-search');
        if (searchInput) searchInput.value = '';
        const ovrSlider = document.getElementById('ovr-slider');
        if (ovrSlider) ovrSlider.value = 118;
        const ovrDisplay = document.getElementById('ovr-display');
        if (ovrDisplay) ovrDisplay.textContent = '118+';

        document.querySelectorAll('.pos-btn').forEach(b => b.classList.toggle('active', b.dataset.pos === 'ALL'));
        this.renderEventFilters();
        this.applyFilters();
    },

    setupCardTilt() {
        const cards = document.querySelectorAll('.fc-card');
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = ((y - centerY) / centerY) * -10;
                const rotateY = ((x - centerX) / centerX) * 10;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            });
        });
    },

    openPlayerModal(playerId) {
        SoundFX.playClick();
        const player = PLAYERS_DATA.find(p => p.id === playerId);
        if (!player) return;

        this.activePlayerModal = player;
        this.activeRank = 0;
        this.renderModalContent();

        const modal = document.getElementById('player-detail-modal');
        if (modal) modal.classList.add('active');
    },

    setRank(rankIndex) {
        SoundFX.playRankUp();
        this.activeRank = rankIndex;
        this.renderModalContent();
    },

    renderModalContent() {
        const p = this.activePlayerModal;
        if (!p) return;

        const rankObj = RANKS[this.activeRank] || RANKS[0];
        const ovrBoosted = p.ovr + rankObj.bonus;
        const statBoost = rankObj.bonus * 4; // Each rank gives ~+4 to all attributes in FC Mobile

        const statLabels = p.isGoalkeeper ? 
            ['DIV', 'HAN', 'KIC', 'REF', 'SPD', 'POS'] : 
            ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];

        const modalContainer = document.getElementById('modal-dynamic-body');
        if (!modalContainer) return;

        const renderStatBar = (label, value) => {
            const boostedVal = value + statBoost;
            const percentage = Math.min(100, (boostedVal / 180) * 100);
            return `
                <div class="attr-row">
                    <span class="attr-name">${label}</span>
                    <div class="attr-bar-bg">
                        <div class="attr-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="attr-val ${this.activeRank > 0 ? 'boosted' : ''}">${boostedVal}</span>
                </div>
            `;
        };

        modalContainer.innerHTML = `
            <div class="modal-player-hero" style="background: ${p.event.bgGradient}">
                <div class="modal-hero-left">
                    <div class="modal-card-compact" style="border-color: ${p.event.color}">
                        <div class="compact-ovr" style="color: ${p.event.color}">${ovrBoosted}</div>
                        <div class="compact-pos">${p.positionDetail}</div>
                        <img src="${p.avatar}" alt="${p.shortName}" class="modal-compact-photo" 
                             onerror="handleAvatarError(this, '${p.event.color.replace(/'/g,'').replace(/#/g,'%23')}', '${p.shortName.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()}')" />
                        <div class="compact-flag">${p.nationFlag}</div>
                    </div>
                    <div class="modal-player-titles">
                        <span class="modal-event-pill" style="background: ${p.event.color}33; color: ${p.event.color}; border: 1px solid ${p.event.color}">
                            ${p.event.badge}
                        </span>
                        <h2>${p.name}</h2>
                        ${p.fullName ? `<p class="modal-full-name">Nombre completo: <em>${p.fullName}</em></p>` : ''}
                        <p class="modal-meta-line">${p.nation} • ${p.club} • ${p.league} • ${p.price}</p>
                    </div>
                </div>
                <div class="modal-hero-right">
                    <button class="btn btn-outline" onclick="App.quickCompare('${p.id}'); App.closeModal()">⚔️ Comparar Jugador</button>
                </div>
            </div>

            <!-- Rank Up Selector Simulator -->
            <div class="rank-simulator-bar">
                <div class="rank-label-block">
                    <span class="rank-title">⚡ Simulador de Rangos & Entrenamiento:</span>
                    <span class="rank-current-status" style="color: ${rankObj.color}">${rankObj.name} (${rankObj.badge})</span>
                </div>
                <div class="rank-buttons-group">
                    ${RANKS.map((r, i) => `
                        <button class="btn-rank ${this.activeRank === i ? 'active' : ''}" 
                                style="--rank-color: ${r.color}" 
                                onclick="App.setRank(${i})">
                            ${r.badge}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Main Stats Overview -->
            <div class="modal-main-stats-grid">
                <div class="m-stat-box"><span class="m-val">${p.stats.pac + statBoost}</span><span class="m-lbl">${statLabels[0]}</span></div>
                <div class="m-stat-box"><span class="m-val">${p.stats.sho + statBoost}</span><span class="m-lbl">${statLabels[1]}</span></div>
                <div class="m-stat-box"><span class="m-val">${p.stats.pas + statBoost}</span><span class="m-lbl">${statLabels[2]}</span></div>
                <div class="m-stat-box"><span class="m-val">${p.stats.dri + statBoost}</span><span class="m-lbl">${statLabels[3]}</span></div>
                <div class="m-stat-box"><span class="m-val">${p.stats.def + statBoost}</span><span class="m-lbl">${statLabels[4]}</span></div>
                <div class="m-stat-box"><span class="m-val">${p.stats.phy + statBoost}</span><span class="m-lbl">${statLabels[5]}</span></div>
            </div>

            <!-- Detailed In-Game Attributes -->
            <div class="modal-sections-grid">
                <div class="modal-section-col">
                    <h4 class="col-title">📊 Atributos Detallados en Juego</h4>
                    <div class="attributes-list">
                        ${renderStatBar('Aceleración', p.detailStats.aceleracion)}
                        ${renderStatBar('Velocidad Sprint', p.detailStats.sprint)}
                        ${renderStatBar('Posicionamiento', p.detailStats.posicionamiento)}
                        ${renderStatBar('Finalización', p.detailStats.finalizacion)}
                        ${renderStatBar('Potencia de Tiro', p.detailStats.potenciaTiro)}
                        ${renderStatBar('Tiros Lejanos', p.detailStats.tirosLejanos)}
                        ${renderStatBar('Visión', p.detailStats.vision)}
                        ${renderStatBar('Pase Corto', p.detailStats.paseCorto)}
                        ${renderStatBar('Pase Largo', p.detailStats.paseLargo)}
                        ${renderStatBar('Agilidad', p.detailStats.agilidad)}
                        ${renderStatBar('Control de Balón', p.detailStats.controlBalon)}
                        ${renderStatBar('Regates', p.detailStats.regates)}
                        ${renderStatBar('Fuerza', p.detailStats.fuerza)}
                        ${renderStatBar('Resistencia', p.detailStats.resistencia)}
                    </div>
                </div>

                <div class="modal-section-col">
                    <h4 class="col-title">🌟 Rasgos Especiales & Ficha</h4>
                    <div class="traits-container">
                        ${p.traits.map(t => `<div class="trait-card-badge"><span class="icon">✨</span><span>${t}</span></div>`).join('')}
                    </div>

                    <h4 class="col-title mt-4">📋 Datos Físicos & Filigranas</h4>
                    <div class="bio-info-grid">
                        <div class="bio-item"><span class="b-lbl">Pie Hábil:</span><span class="b-val">${p.foot}</span></div>
                        <div class="bio-item"><span class="b-lbl">Filigranas:</span><span class="b-val">${'★'.repeat(p.skillMoves)}</span></div>
                        <div class="bio-item"><span class="b-lbl">Pierna Mala:</span><span class="b-val">${'★'.repeat(p.weakFoot)}</span></div>
                        <div class="bio-item"><span class="b-lbl">Índice de Trabajo:</span><span class="b-val">${p.workRate}</span></div>
                        <div class="bio-item"><span class="b-lbl">Altura / Peso:</span><span class="b-val">${p.height} / ${p.weight}</span></div>
                        <div class="bio-item"><span class="b-lbl">Posiciones Sec.:</span><span class="b-val">${p.altPositions.join(', ') || 'Ninguna'}</span></div>
                    </div>

                    <div class="player-analysis-quote">
                        <div class="quote-title">💡 Análisis Táctico Meta:</div>
                        <p>${p.description}</p>
                    </div>
                </div>
            </div>
        `;
    },

    closeModal() {
        const modal = document.getElementById('player-detail-modal');
        if (modal) modal.classList.remove('active');
        this.activePlayerModal = null;
    },

    quickCompare(playerId) {
        CompareManager.setPlayer(2, playerId);
        const compareTab = document.querySelector('a[href="#compare-section"]');
        if (compareTab) {
            compareTab.click();
            document.getElementById('compare-section').scrollIntoView({ behavior: 'smooth' });
        }
    },

    // Mini-Juego: Simulador de Sobre Meta Gratis
    openPackSimulator() {
        SoundFX.playPackOpen();
        const packModal = document.getElementById('pack-opening-modal');
        const packResult = document.getElementById('pack-card-result');
        if (!packModal || !packResult) return;

        packModal.classList.add('active');
        packResult.innerHTML = `
            <div class="pack-opening-anim">
                <div class="pack-glow-orb"></div>
                <div class="pack-loading-text">¡ABRIENDO SOBRE META FC 26 / FC 27...!</div>
            </div>
        `;

        // Pick random top player after 1.2s suspense
        setTimeout(() => {
            const randomPlayer = PLAYERS_DATA[Math.floor(Math.random() * PLAYERS_DATA.length)];
            SoundFX.playRankUp();

            packResult.innerHTML = `
                <div class="pack-reveal-card" style="border-color: ${randomPlayer.event.color}; box-shadow: 0 0 50px ${randomPlayer.event.color}">
                    <div class="pack-celebration-title">🎉 ¡CAMINANTE / WALKOUT FC 26 & 27! 🎉</div>
                    <div class="pack-player-header">
                        <span class="pack-ovr" style="color: ${randomPlayer.event.color}">${randomPlayer.ovr}</span>
                        <span class="pack-pos">${randomPlayer.positionDetail}</span>
                        <span class="pack-flag">${randomPlayer.nationFlag}</span>
                    </div>
                    <div style="margin: 1rem auto; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center;">
                        <img src="${randomPlayer.avatar}" alt="${randomPlayer.name}" style="width: 110px; height: 110px; object-fit: contain; filter: drop-shadow(0 8px 15px rgba(0,0,0,0.85));" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'><circle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%231e293b\' stroke=\'${encodeURIComponent(randomPlayer.event.color)}\' stroke-width=\'3\'/><text x=\'50\' y=\'58\' font-family=\'sans-serif\' font-size=\'20\' font-weight=\'bold\' fill=\'white\' text-anchor=\'middle\'>${encodeURIComponent(randomPlayer.shortName.substring(0,2).toUpperCase())}</text></svg>';" />
                    </div>
                    <h2 class="pack-player-name">${randomPlayer.name}</h2>
                    <div style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.5rem;">${randomPlayer.club} • ${randomPlayer.league}</div>
                    <div class="pack-event-tag" style="background: ${randomPlayer.event.color}33; color: ${randomPlayer.event.color}">${randomPlayer.event.badge}</div>
                    <p class="pack-desc">${randomPlayer.description}</p>
                    <div class="pack-actions-btn">
                        <button class="btn btn-primary" onclick="App.openPlayerModal('${randomPlayer.id}'); App.closePackModal()">Ver Ficha Completa</button>
                        <button class="btn btn-outline" onclick="App.openPackSimulator()">Abrir Otro Sobre 🎁</button>
                    </div>
                </div>
            `;
        }, 1200);
    },

    closePackModal() {
        const packModal = document.getElementById('pack-opening-modal');
        if (packModal) packModal.classList.remove('active');
    },

    toggleSound() {
        const enabled = SoundFX.toggle();
        const btn = document.getElementById('btn-sound-toggle');
        if (btn) {
            btn.innerHTML = enabled ? '🔊 Sonido ON' : '🔇 Sonido OFF';
            btn.classList.toggle('btn-muted', !enabled);
        }
    }
};

// Iniciar aplicación cuando cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
