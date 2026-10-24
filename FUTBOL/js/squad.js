/**
 * Squad Builder (11 Ideal) Module
 * Permite armar un once titular interactivo y calcular el OVR global del equipo.
 */

const SquadManager = {
    currentFormation: '4-3-3',
    squad: {}, // { 'pos-st': playerObject, 'pos-lw': playerObject, ... }
    selectedSlot: null,

    init() {
        this.autoFillMeta();
    },

    setFormation(formationKey) {
        if (!FORMATIONS[formationKey]) return;
        this.currentFormation = formationKey;
        // Keep players if position exists or reset invalid slots
        const validPosIds = FORMATIONS[formationKey].positions.map(p => p.id);
        const newSquad = {};
        for (let key in this.squad) {
            if (validPosIds.includes(key)) {
                newSquad[key] = this.squad[key];
            }
        }
        this.squad = newSquad;
        this.render();
    },

    autoFillMeta() {
        const formation = FORMATIONS[this.currentFormation];
        this.squad = {};

        // Auto assign best player for each slot
        const usedIds = new Set();

        formation.positions.forEach(pos => {
            // Find best matching player for this slot group
            const candidates = PLAYERS_DATA.filter(p => {
                if (usedIds.has(p.id)) return false;
                if (pos.group === 'DEL') return p.position === 'DEL';
                if (pos.group === 'MED') return p.position === 'MED';
                if (pos.group === 'DEF') return p.position === 'DEF';
                if (pos.group === 'POR') return p.position === 'POR';
                return true;
            }).sort((a, b) => b.ovr - a.ovr);

            if (candidates.length > 0) {
                this.squad[pos.id] = candidates[0];
                usedIds.add(candidates[0].id);
            }
        });

        this.render();
    },

    clearSquad() {
        this.squad = {};
        this.render();
    },

    openSlotSelector(posId, posLabel, group) {
        SoundFX.playClick();
        this.selectedSlot = { posId, posLabel, group };
        
        const modal = document.getElementById('squad-player-modal');
        const list = document.getElementById('squad-player-list');
        const title = document.getElementById('squad-modal-title');

        if (!modal || !list || !title) return;

        title.textContent = `Seleccionar Jugador para ${posLabel}`;

        // Get available players sorted by OVR
        const players = PLAYERS_DATA.filter(p => {
            if (group === 'DEL') return p.position === 'DEL' || p.altPositions.includes(posLabel.split('/')[1]?.trim());
            if (group === 'MED') return p.position === 'MED';
            if (group === 'DEF') return p.position === 'DEF';
            if (group === 'POR') return p.position === 'POR';
            return true;
        }).sort((a, b) => b.ovr - a.ovr);

        list.innerHTML = players.map(p => `
            <div class="squad-select-item" onclick="SquadManager.assignPlayer('${p.id}')">
                <div class="squad-item-ovr" style="color: ${p.event.color}">${p.ovr}</div>
                <img src="${p.avatar}" alt="${p.name}" class="squad-picker-thumb" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'36\' height=\'36\' viewBox=\'0 0 36 36\'><circle cx=\'18\' cy=\'18\' r=\'16\' fill=\'%231e293b\' stroke=\'${encodeURIComponent(p.event.color)}\' stroke-width=\'2\'/><text x=\'18\' y=\'22\' font-family=\'sans-serif\' font-size=\'11\' font-weight=\'bold\' fill=\'white\' text-anchor=\'middle\'>${encodeURIComponent(p.shortName.substring(0,2).toUpperCase())}</text></svg>';" />
                <div class="squad-item-info">
                    <div class="squad-item-name">${p.name} ${p.nationFlag}</div>
                    <div class="squad-item-meta">${p.positionDetail} • ${p.club} • ${p.event.badge}</div>
                </div>
                <button class="btn btn-sm btn-primary">Elegir</button>
            </div>
        `).join('');

        modal.classList.add('active');
    },

    assignPlayer(playerId) {
        SoundFX.playRankUp();
        if (this.selectedSlot) {
            const player = PLAYERS_DATA.find(p => p.id === playerId);
            if (player) {
                this.squad[this.selectedSlot.posId] = player;
            }
        }
        this.closeModal();
        this.render();
    },

    removePlayer(posId, event) {
        if (event) event.stopPropagation();
        delete this.squad[posId];
        this.render();
    },

    closeModal() {
        const modal = document.getElementById('squad-player-modal');
        if (modal) modal.classList.remove('active');
        this.selectedSlot = null;
    },

    calculateStats() {
        const formation = FORMATIONS[this.currentFormation];
        const assignedPlayers = Object.values(this.squad);

        if (assignedPlayers.length === 0) {
            return { avgOvr: 0, count: 0, totalValue: 0, chemistry: 0 };
        }

        const sumOvr = assignedPlayers.reduce((acc, p) => acc + p.ovr, 0);
        const avgOvr = Math.round(sumOvr / formation.positions.length);

        // Calculate total market value
        const totalValue = assignedPlayers.reduce((acc, p) => {
            const valNum = parseInt(p.price.replace('M', '')) || 0;
            return acc + valNum;
        }, 0);

        // Calculate chemistry
        let chemPoints = 0;
        const nations = {};
        const clubs = {};

        assignedPlayers.forEach(p => {
            if (p.event.id === 'icon' || p.event.id === 'icon_mythic') chemPoints += 10; // Icons give wild chemistry
            nations[p.nation] = (nations[p.nation] || 0) + 1;
            clubs[p.club] = (clubs[p.club] || 0) + 1;
        });

        for (let n in nations) {
            if (nations[n] > 1) chemPoints += nations[n] * 6;
        }
        for (let c in clubs) {
            if (clubs[c] > 1) chemPoints += clubs[c] * 8;
        }

        const chemistry = Math.min(100, Math.round(chemPoints + (assignedPlayers.length * 5)));

        return {
            avgOvr: isNaN(avgOvr) ? 0 : avgOvr,
            count: assignedPlayers.length,
            totalValue: `${totalValue}M`,
            chemistry: chemistry
        };
    },

    render() {
        const pitchContainer = document.getElementById('pitch-players');
        const statsSummary = document.getElementById('squad-summary-bar');
        const formation = FORMATIONS[this.currentFormation];

        if (!pitchContainer) return;

        const stats = this.calculateStats();

        // Update squad summary bar
        if (statsSummary) {
            statsSummary.innerHTML = `
                <div class="squad-stat-chip">
                    <span class="chip-label">Media (OVR)</span>
                    <span class="chip-val chip-gold">${stats.avgOvr}</span>
                </div>
                <div class="squad-stat-chip">
                    <span class="chip-label">Química</span>
                    <span class="chip-val chip-cyan">${stats.chemistry}/100</span>
                </div>
                <div class="squad-stat-chip">
                    <span class="chip-label">Jugadores</span>
                    <span class="chip-val">${stats.count}/${formation.positions.length}</span>
                </div>
                <div class="squad-stat-chip">
                    <span class="chip-label">Valor Total</span>
                    <span class="chip-val chip-green">~${stats.totalValue}</span>
                </div>
            `;
        }

        // Render Pitch Slots
        pitchContainer.innerHTML = formation.positions.map(pos => {
            const player = this.squad[pos.id];
            if (player) {
                return `
                    <div class="pitch-card-slot occupied" style="top: ${pos.top}; left: ${pos.left};" onclick="SquadManager.openSlotSelector('${pos.id}', '${pos.label}', '${pos.group}')">
                        <button class="btn-remove-slot" title="Quitar jugador" onclick="SquadManager.removePlayer('${pos.id}', event)">×</button>
                        <div class="pitch-mini-card" style="border-color: ${player.event.color}">
                            <div class="pitch-card-top">
                                <span class="pitch-card-ovr" style="color: ${player.event.color}">${player.ovr}</span>
                                <span class="pitch-card-pos">${player.positionDetail}</span>
                            </div>
                            <img src="${player.avatar}" alt="${player.name}" class="pitch-card-img" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'><circle cx=\'16\' cy=\'16\' r=\'14\' fill=\'%231e293b\' stroke=\'${encodeURIComponent(player.event.color)}\' stroke-width=\'2\'/><text x=\'16\' y=\'20\' font-family=\'sans-serif\' font-size=\'10\' font-weight=\'bold\' fill=\'white\' text-anchor=\'middle\'>${encodeURIComponent(player.shortName.substring(0,2).toUpperCase())}</text></svg>';" />
                            <div class="pitch-card-name">${player.shortName}</div>
                            <div class="pitch-card-flag">${player.nationFlag}</div>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="pitch-card-slot empty" style="top: ${pos.top}; left: ${pos.left};" onclick="SquadManager.openSlotSelector('${pos.id}', '${pos.label}', '${pos.group}')">
                        <div class="pitch-empty-card">
                            <span class="plus-icon">+</span>
                            <span class="pos-badge">${pos.label.split('/')[0]}</span>
                        </div>
                    </div>
                `;
            }
        }).join('');
    }
};
