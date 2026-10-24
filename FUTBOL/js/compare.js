/**
 * Player Comparison Module (VS Mode)
 * Compara dos jugadores frente a frente con cálculo de estadísticas superiores.
 */

const CompareManager = {
    player1: null,
    player2: null,

    init() {
        // Establecer dos jugadores por defecto (R9 Mythic 122 vs Mbappé TOTY 122)
        this.player1 = PLAYERS_DATA.find(p => p.id === 'r9-mythic-27') || PLAYERS_DATA[0];
        this.player2 = PLAYERS_DATA.find(p => p.id === 'mbappe-toty-27') || PLAYERS_DATA[1];
        this.render();
    },

    setPlayer(slot, playerId) {
        const player = PLAYERS_DATA.find(p => p.id === playerId);
        if (!player) return;

        if (slot === 1) {
            this.player1 = player;
        } else {
            this.player2 = player;
        }
        this.render();
    },

    render() {
        const container = document.getElementById('compare-content');
        if (!container || !this.player1 || !this.player2) return;

        const p1 = this.player1;
        const p2 = this.player2;

        // Atributos principales
        const statLabels = p1.isGoalkeeper && p2.isGoalkeeper ? [
            { key: 'pac', label: 'Estirada (DIV)' },
            { key: 'sho', label: 'Paradas (HAN)' },
            { key: 'pas', label: 'Saque (KIC)' },
            { key: 'dri', label: 'Reflejos (REF)' },
            { key: 'def', label: 'Velocidad (SPD)' },
            { key: 'phy', label: 'Posición (POS)' }
        ] : [
            { key: 'pac', label: 'Ritmo (PAC)' },
            { key: 'sho', label: 'Tiro (SHO)' },
            { key: 'pas', label: 'Pase (PAS)' },
            { key: 'dri', label: 'Regate (DRI)' },
            { key: 'def', label: 'Defensa (DEF)' },
            { key: 'phy', label: 'Físico (PHY)' }
        ];

        let p1Wins = 0;
        let p2Wins = 0;

        statLabels.forEach(stat => {
            const v1 = p1.stats[stat.key];
            const v2 = p2.stats[stat.key];
            if (v1 > v2) p1Wins++;
            else if (v2 > v1) p2Wins++;
        });

        // Crear opciones para los selects
        const createOptions = (selectedId) => {
            return PLAYERS_DATA.map(p => 
                `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>[${p.ovr}] ${p.name} (${p.positionDetail})</option>`
            ).join('');
        };

        const renderStatRow = (label, v1, v2) => {
            const isP1Higher = v1 > v2;
            const isP2Higher = v2 > v1;
            const isEqual = v1 === v2;

            const maxVal = Math.max(v1, v2, 165);
            const p1Percent = (v1 / maxVal) * 100;
            const p2Percent = (v2 / maxVal) * 100;

            return `
                <div class="compare-stat-row">
                    <div class="stat-num ${isP1Higher ? 'winner-stat' : ''}">${v1}</div>
                    <div class="stat-bars-wrapper">
                        <div class="stat-bar-container bar-left">
                            <div class="stat-bar fill-p1 ${isP1Higher ? 'bar-glow' : ''}" style="width: ${p1Percent}%"></div>
                        </div>
                        <div class="stat-label-center">${label}</div>
                        <div class="stat-bar-container bar-right">
                            <div class="stat-bar fill-p2 ${isP2Higher ? 'bar-glow' : ''}" style="width: ${p2Percent}%"></div>
                        </div>
                    </div>
                    <div class="stat-num ${isP2Higher ? 'winner-stat' : ''}">${v2}</div>
                </div>
            `;
        };

        container.innerHTML = `
            <div class="compare-selectors-grid">
                <div class="compare-player-slot slot-p1">
                    <label for="select-p1">Jugador 1:</label>
                    <select id="select-p1" class="custom-select" onchange="CompareManager.setPlayer(1, this.value)">
                        ${createOptions(p1.id)}
                    </select>
                    <div class="compare-card-preview" style="border-color: ${p1.event.color}">
                        <div class="compare-card-header">
                            <span class="compare-ovr" style="color: ${p1.event.color}">${p1.ovr}</span>
                            <span class="compare-pos">${p1.positionDetail}</span>
                            <span class="compare-flag">${p1.nationFlag}</span>
                        </div>
                        <div class="compare-img-wrap">
                            <img src="${p1.avatar}" alt="${p1.name}" class="compare-player-img" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\' viewBox=\'0 0 80 80\'><rect width=\'80\' height=\'80\' fill=\'%230b1329\'/><circle cx=\'40\' cy=\'30\' r=\'16\' fill=\'%231e293b\' stroke=\'${encodeURIComponent(p1.event.color)}\' stroke-width=\'2\'/><text x=\'40\' y=\'36\' font-family=\'sans-serif\' font-size=\'14\' font-weight=\'bold\' fill=\'white\' text-anchor=\'middle\'>${encodeURIComponent(p1.shortName.substring(0,2).toUpperCase())}</text></svg>';" />
                        </div>
                        <h3 class="compare-pname">${p1.name}</h3>
                        <div class="compare-club-tag">${p1.club} • ${p1.league}</div>
                        <div class="compare-event-tag" style="background: ${p1.event.color}22; color: ${p1.event.color}">${p1.event.badge}</div>
                        <div class="compare-stars">
                            <span>Filigranas: ${'★'.repeat(p1.skillMoves)}</span> | 
                            <span>Pie Débil: ${'★'.repeat(p1.weakFoot)}</span>
                        </div>
                        <div class="compare-score-badge ${p1Wins >= p2Wins ? 'winner-badge' : ''}">
                            ${p1Wins} Atributos Ganados
                        </div>
                    </div>
                </div>

                <div class="compare-vs-badge">
                    <span class="vs-glow">VS</span>
                    <span class="vs-meta">DUELO META</span>
                </div>

                <div class="compare-player-slot slot-p2">
                    <label for="select-p2">Jugador 2:</label>
                    <select id="select-p2" class="custom-select" onchange="CompareManager.setPlayer(2, this.value)">
                        ${createOptions(p2.id)}
                    </select>
                    <div class="compare-card-preview" style="border-color: ${p2.event.color}">
                        <div class="compare-card-header">
                            <span class="compare-ovr" style="color: ${p2.event.color}">${p2.ovr}</span>
                            <span class="compare-pos">${p2.positionDetail}</span>
                            <span class="compare-flag">${p2.nationFlag}</span>
                        </div>
                        <div class="compare-img-wrap">
                            <img src="${p2.avatar}" alt="${p2.name}" class="compare-player-img" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\' viewBox=\'0 0 80 80\'><rect width=\'80\' height=\'80\' fill=\'%230b1329\'/><circle cx=\'40\' cy=\'30\' r=\'16\' fill=\'%231e293b\' stroke=\'${encodeURIComponent(p2.event.color)}\' stroke-width=\'2\'/><text x=\'40\' y=\'36\' font-family=\'sans-serif\' font-size=\'14\' font-weight=\'bold\' fill=\'white\' text-anchor=\'middle\'>${encodeURIComponent(p2.shortName.substring(0,2).toUpperCase())}</text></svg>';" />
                        </div>
                        <h3 class="compare-pname">${p2.name}</h3>
                        <div class="compare-club-tag">${p2.club} • ${p2.league}</div>
                        <div class="compare-event-tag" style="background: ${p2.event.color}22; color: ${p2.event.color}">${p2.event.badge}</div>
                        <div class="compare-stars">
                            <span>Filigranas: ${'★'.repeat(p2.skillMoves)}</span> | 
                            <span>Pie Débil: ${'★'.repeat(p2.weakFoot)}</span>
                        </div>
                        <div class="compare-score-badge ${p2Wins >= p1Wins ? 'winner-badge' : ''}">
                            ${p2Wins} Atributos Ganados
                        </div>
                    </div>
                </div>
            </div>

            <!-- Estadísticas Principales -->
            <div class="compare-stats-section">
                <h4 class="section-subtitle">⚡ Estadísticas Principales</h4>
                <div class="compare-stats-table">
                    ${statLabels.map(s => renderStatRow(s.label, p1.stats[s.key], p2.stats[s.key])).join('')}
                </div>
            </div>

            <!-- Rasgos y Detalles Especiales -->
            <div class="compare-traits-grid">
                <div class="player-traits-box">
                    <h5>Rasgos de ${p1.shortName}:</h5>
                    <div class="traits-tags">
                        ${p1.traits.map(t => `<span class="trait-pill">${t}</span>`).join('')}
                    </div>
                </div>
                <div class="player-traits-box">
                    <h5>Rasgos de ${p2.shortName}:</h5>
                    <div class="traits-tags">
                        ${p2.traits.map(t => `<span class="trait-pill">${t}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }
};
