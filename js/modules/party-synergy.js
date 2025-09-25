// Party Synergy Visualization module for Expedition 33 Planner
import { formatNumber } from '../utils/formatters.js';

/**
 * Party Synergy class for analyzing and visualizing party synergies
 */
export class PartySynergy {
  constructor(dataManager, storage) {
    this.dataManager = dataManager;
    this.storage = storage;
    this.currentParty = [];
    this.synergyData = null;
    this.visualizationMode = 'overview'; // overview, detailed, matrix

    // Synergy calculation weights
    this.synergyWeights = {
      elemental: 0.35,
      role: 0.25,
      combat: 0.25,
      support: 0.15
    };

    // Bind methods
    this.updateVisualization = this.updateVisualization.bind(this);
    this.handleModeChange = this.handleModeChange.bind(this);
  }

  /**
   * Initialize the Party Synergy system
   */
  async init() {
    try {
      this.loadSynergyData();
      this.setupEventListeners();
      this.renderSynergyInterface();
    } catch (error) {
      console.error('Failed to initialize Party Synergy:', error);
    }
  }

  /**
   * Load synergy configuration data
   */
  loadSynergyData() {
    // Define elemental synergies
    this.elementalSynergies = {
      fire: {
        synergizes: ['lightning', 'earth'],
        opposes: ['water', 'ice'],
        neutral: ['physical', 'light', 'dark', 'void']
      },
      water: {
        synergizes: ['ice', 'earth'],
        opposes: ['fire', 'lightning'],
        neutral: ['physical', 'light', 'dark', 'void']
      },
      ice: {
        synergizes: ['water', 'void'],
        opposes: ['fire', 'earth'],
        neutral: ['physical', 'lightning', 'light', 'dark']
      },
      lightning: {
        synergizes: ['fire', 'light'],
        opposes: ['water', 'earth'],
        neutral: ['physical', 'ice', 'dark', 'void']
      },
      earth: {
        synergizes: ['fire', 'water'],
        opposes: ['lightning', 'ice'],
        neutral: ['physical', 'light', 'dark', 'void']
      },
      light: {
        synergizes: ['lightning', 'void'],
        opposes: ['dark'],
        neutral: ['physical', 'fire', 'water', 'ice', 'earth']
      },
      dark: {
        synergizes: ['void', 'ice'],
        opposes: ['light'],
        neutral: ['physical', 'fire', 'water', 'lightning', 'earth']
      },
      void: {
        synergizes: ['dark', 'light'],
        opposes: [],
        neutral: ['physical', 'fire', 'water', 'ice', 'lightning', 'earth']
      },
      physical: {
        synergizes: [],
        opposes: [],
        neutral: ['fire', 'water', 'ice', 'lightning', 'earth', 'light', 'dark', 'void']
      }
    };

    // Define role synergies
    this.roleSynergies = {
      attacker: {
        synergizes: ['support', 'tank'],
        competes: ['attacker'],
        neutral: ['hybrid']
      },
      support: {
        synergizes: ['attacker', 'tank', 'hybrid'],
        competes: [],
        neutral: ['support']
      },
      tank: {
        synergizes: ['attacker', 'support'],
        competes: ['tank'],
        neutral: ['hybrid']
      },
      hybrid: {
        synergizes: ['support'],
        competes: [],
        neutral: ['attacker', 'tank', 'hybrid']
      }
    };

    // Define combat style synergies
    this.combatSynergies = {
      burst: ['sustained', 'control'],
      sustained: ['burst', 'support'],
      control: ['burst', 'utility'],
      support: ['sustained', 'utility'],
      utility: ['control', 'support']
    };
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    const container = document.getElementById('party-synergy');
    if (!container) return;

    container.addEventListener('change', this.handleModeChange);
    container.addEventListener('click', (e) => {
      if (e.target.matches('.synergy-detail-btn')) {
        this.showDetailedAnalysis(e.target.dataset.characterId);
      }
    });

    // Listen for party updates
    if (window.app) {
      window.addEventListener('partyUpdated', this.updateVisualization);
    }
  }

  /**
   * Handle visualization mode changes
   */
  handleModeChange(event) {
    if (event.target.matches('#synergy-mode')) {
      this.visualizationMode = event.target.value;
      this.updateVisualization();
    }
  }

  /**
   * Render the synergy interface
   */
  renderSynergyInterface() {
    const container = document.getElementById('party-synergy');
    if (!container) return;

    container.innerHTML = `
      <div class="synergy-container">
        <div class="synergy-header">
          <h3>Party Synergy Analysis</h3>
          <div class="synergy-controls">
            <div class="control-group">
              <label for="synergy-mode">Visualization Mode:</label>
              <select id="synergy-mode" class="synergy-control">
                <option value="overview">Overview</option>
                <option value="detailed">Detailed Analysis</option>
                <option value="matrix">Synergy Matrix</option>
                <option value="recommendations">Recommendations</option>
              </select>
            </div>
            <button id="refresh-synergy" class="btn-secondary">Refresh</button>
          </div>
        </div>

        <div id="synergy-content" class="synergy-content">
          <!-- Synergy visualization will be rendered here -->
        </div>
      </div>
    `;

    this.updateVisualization();
  }

  /**
   * Update the synergy visualization
   */
  updateVisualization() {
    this.loadCurrentParty();
    this.calculateSynergies();
    this.renderVisualization();
  }

  /**
   * Load current party data
   */
  loadCurrentParty() {
    // Get party data from storage
    const savedParty = this.storage.loadParty();

    if (savedParty && savedParty.active) {
      // Convert party composer format to synergy format
      this.currentParty = [];

      // Add active party members
      savedParty.active.forEach((characterId, index) => {
        if (characterId) {
          const character = this.dataManager.getCharacter(characterId);
          const build = this.storage.loadCharacterBuild(characterId);
          if (character) {
            this.currentParty.push({
              character: characterId,
              slot: index,
              type: 'active',
              build: build || {},
              characterData: character
            });
          }
        }
      });

      // Add reserve party members
      savedParty.reserve.forEach((characterId, index) => {
        if (characterId) {
          const character = this.dataManager.getCharacter(characterId);
          const build = this.storage.loadCharacterBuild(characterId);
          if (character) {
            this.currentParty.push({
              character: characterId,
              slot: index,
              type: 'reserve',
              build: build || {},
              characterData: character
            });
          }
        }
      });
    } else {
      this.currentParty = [];
    }
  }

  /**
   * Calculate party synergies
   */
  calculateSynergies() {
    if (this.currentParty.length < 2) {
      this.synergyData = { totalScore: 0, synergies: [], recommendations: [] };
      return;
    }

    const synergies = [];
    let totalScore = 0;

    // Calculate pairwise synergies
    for (let i = 0; i < this.currentParty.length; i++) {
      for (let j = i + 1; j < this.currentParty.length; j++) {
        const memberA = this.currentParty[i];
        const memberB = this.currentParty[j];
        const synergy = this.calculatePairSynergy(memberA, memberB);
        synergies.push(synergy);
        totalScore += synergy.score;
      }
    }

    // Calculate team-wide synergies
    const teamSynergy = this.calculateTeamSynergy();
    totalScore += teamSynergy.score;

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    this.synergyData = {
      totalScore: totalScore / Math.max(synergies.length, 1),
      pairSynergies: synergies,
      teamSynergy: teamSynergy,
      recommendations: recommendations,
      partySize: this.currentParty.length
    };
  }

  /**
   * Calculate synergy between two party members
   */
  calculatePairSynergy(memberA, memberB) {
    const charA = memberA.characterData || this.dataManager.getCharacter(memberA.character);
    const charB = memberB.characterData || this.dataManager.getCharacter(memberB.character);

    if (!charA || !charB) {
      return { score: 0, details: [], memberA, memberB };
    }

    const synergy = {
      memberA: memberA,
      memberB: memberB,
      characterA: charA,
      characterB: charB,
      score: 0,
      details: []
    };

    // Elemental synergy
    const elementalScore = this.calculateElementalSynergy(charA, charB);
    synergy.score += elementalScore.score * this.synergyWeights.elemental;
    synergy.details.push(elementalScore);

    // Role synergy
    const roleScore = this.calculateRoleSynergy(charA, charB);
    synergy.score += roleScore.score * this.synergyWeights.role;
    synergy.details.push(roleScore);

    // Combat synergy
    const combatScore = this.calculateCombatSynergy(memberA, memberB);
    synergy.score += combatScore.score * this.synergyWeights.combat;
    synergy.details.push(combatScore);

    // Support synergy
    const supportScore = this.calculateSupportSynergy(charA, charB);
    synergy.score += supportScore.score * this.synergyWeights.support;
    synergy.details.push(supportScore);

    return synergy;
  }

  /**
   * Calculate elemental synergy between characters
   */
  calculateElementalSynergy(charA, charB) {
    const elementA = charA.element || 'physical';
    const elementB = charB.element || 'physical';

    const synergyA = this.elementalSynergies[elementA];
    const synergyB = this.elementalSynergies[elementB];

    let score = 50; // Base neutral score
    let description = 'Neutral elemental compatibility';
    let type = 'neutral';

    if (synergyA.synergizes.includes(elementB) || synergyB.synergizes.includes(elementA)) {
      score = 80;
      description = `${elementA} and ${elementB} elements synergize well`;
      type = 'synergy';
    } else if (synergyA.opposes.includes(elementB) || synergyB.opposes.includes(elementA)) {
      score = 20;
      description = `${elementA} and ${elementB} elements oppose each other`;
      type = 'opposition';
    }

    return {
      type: 'elemental',
      score: score,
      description: description,
      category: type,
      elements: [elementA, elementB]
    };
  }

  /**
   * Calculate role synergy between characters
   */
  calculateRoleSynergy(charA, charB) {
    const roleA = this.getCharacterRole(charA);
    const roleB = this.getCharacterRole(charB);

    const synergyA = this.roleSynergies[roleA];
    let score = 50;
    let description = 'Balanced role distribution';
    let type = 'neutral';

    if (synergyA.synergizes.includes(roleB)) {
      score = 75;
      description = `${roleA} and ${roleB} roles complement each other`;
      type = 'synergy';
    } else if (synergyA.competes.includes(roleB)) {
      score = 30;
      description = `${roleA} and ${roleB} roles may compete for resources`;
      type = 'competition';
    }

    return {
      type: 'role',
      score: score,
      description: description,
      category: type,
      roles: [roleA, roleB]
    };
  }

  /**
   * Calculate combat synergy based on builds
   */
  calculateCombatSynergy(memberA, memberB) {
    const styleA = this.getCombatStyle(memberA);
    const styleB = this.getCombatStyle(memberB);

    const compatibleStyles = this.combatSynergies[styleA] || [];
    let score = 50;
    let description = 'Standard combat compatibility';
    let type = 'neutral';

    if (compatibleStyles.includes(styleB)) {
      score = 70;
      description = `${styleA} and ${styleB} combat styles work well together`;
      type = 'synergy';
    } else if (styleA === styleB) {
      score = 40;
      description = `Similar ${styleA} combat styles may overlap`;
      type = 'overlap';
    }

    return {
      type: 'combat',
      score: score,
      description: description,
      category: type,
      styles: [styleA, styleB]
    };
  }

  /**
   * Calculate support synergy
   */
  calculateSupportSynergy(charA, charB) {
    // Check for support abilities that benefit the team
    const supportA = this.getSupportCapabilities(charA);
    const supportB = this.getSupportCapabilities(charB);

    let score = 50;
    let description = 'Basic team support';
    let type = 'neutral';

    const totalSupport = supportA.length + supportB.length;
    const uniqueSupport = new Set([...supportA, ...supportB]).size;

    if (totalSupport > 0) {
      score = Math.min(90, 50 + (uniqueSupport * 8));
      description = `${uniqueSupport} unique support abilities provide team benefits`;
      type = 'synergy';
    }

    return {
      type: 'support',
      score: score,
      description: description,
      category: type,
      abilities: [...supportA, ...supportB]
    };
  }

  /**
   * Calculate team-wide synergy effects
   */
  calculateTeamSynergy() {
    if (this.currentParty.length < 3) {
      return { score: 0, effects: [] };
    }

    const effects = [];
    let score = 0;

    // Element diversity bonus
    const elements = this.currentParty.map(member => {
      const char = member.characterData || this.dataManager.getCharacter(member.character);
      return char?.element || 'physical';
    });
    const uniqueElements = new Set(elements).size;

    if (uniqueElements >= 3) {
      effects.push({
        type: 'diversity',
        name: 'Elemental Diversity',
        bonus: 10,
        description: `${uniqueElements} different elements provide tactical flexibility`
      });
      score += 10;
    }

    // Role coverage bonus
    const roles = this.currentParty.map(member => {
      const char = member.characterData || this.dataManager.getCharacter(member.character);
      return this.getCharacterRole(char);
    });
    const uniqueRoles = new Set(roles).size;

    if (uniqueRoles >= 3) {
      effects.push({
        type: 'coverage',
        name: 'Role Coverage',
        bonus: 15,
        description: `${uniqueRoles} different roles provide balanced team composition`
      });
      score += 15;
    }

    // Party size optimization
    if (this.currentParty.length === 4) {
      effects.push({
        type: 'optimization',
        name: 'Full Party',
        bonus: 5,
        description: 'Full party of 4 members maximizes tactical options'
      });
      score += 5;
    }

    return { score, effects };
  }

  /**
   * Generate improvement recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.currentParty.length < 4) {
      recommendations.push({
        type: 'size',
        priority: 'high',
        title: 'Expand Party Size',
        description: `Add ${4 - this.currentParty.length} more member(s) to maximize synergy potential`,
        action: 'Add members to your party for better synergy coverage'
      });
    }

    // Check elemental balance
    const elements = this.currentParty.map(member => {
      const char = member.characterData || this.dataManager.getCharacter(member.character);
      return char?.element || 'physical';
    });
    const uniqueElements = new Set(elements).size;

    if (uniqueElements < 3) {
      recommendations.push({
        type: 'elemental',
        priority: 'medium',
        title: 'Improve Elemental Diversity',
        description: 'Consider adding characters with different elements',
        action: 'Add characters with fire, water, lightning, or other elements'
      });
    }

    // Check role balance
    const roles = this.currentParty.map(member => {
      const char = member.characterData || this.dataManager.getCharacter(member.character);
      return this.getCharacterRole(char);
    });

    const roleCount = {};
    roles.forEach(role => {
      roleCount[role] = (roleCount[role] || 0) + 1;
    });

    if (roleCount.support === 0) {
      recommendations.push({
        type: 'role',
        priority: 'high',
        title: 'Add Support Character',
        description: 'Your party lacks dedicated support capabilities',
        action: 'Consider adding Lune or another support-focused character'
      });
    }

    if (roleCount.tank === 0 && this.currentParty.length > 2) {
      recommendations.push({
        type: 'role',
        priority: 'medium',
        title: 'Consider Tank Role',
        description: 'A dedicated tank can improve party survivability',
        action: 'Add a high-defense character for better damage absorption'
      });
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  /**
   * Render the appropriate visualization
   */
  renderVisualization() {
    const container = document.getElementById('synergy-content');
    if (!container) return;

    switch (this.visualizationMode) {
      case 'overview':
        container.innerHTML = this.renderOverview();
        break;
      case 'detailed':
        container.innerHTML = this.renderDetailedAnalysis();
        break;
      case 'matrix':
        container.innerHTML = this.renderSynergyMatrix();
        break;
      case 'recommendations':
        container.innerHTML = this.renderRecommendations();
        break;
    }

    this.attachVisualizationEvents();
  }

  /**
   * Render synergy overview
   */
  renderOverview() {
    if (!this.synergyData || this.currentParty.length < 2) {
      return `
        <div class="synergy-empty">
          <div class="empty-icon">🎭</div>
          <h3>No Party Synergy</h3>
          <p>Add at least 2 characters to your party to see synergy analysis.</p>
        </div>
      `;
    }

    const { totalScore, pairSynergies, teamSynergy } = this.synergyData;
    const scoreClass = this.getScoreClass(totalScore);

    return `
      <div class="synergy-overview">
        <div class="synergy-summary">
          <div class="synergy-score ${scoreClass}">
            <div class="score-value">${Math.round(totalScore)}</div>
            <div class="score-label">Overall Synergy</div>
          </div>
          <div class="synergy-breakdown">
            <div class="breakdown-item">
              <span class="breakdown-label">Pair Synergies:</span>
              <span class="breakdown-value">${pairSynergies.length}</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">Team Effects:</span>
              <span class="breakdown-value">${teamSynergy.effects.length}</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">Party Size:</span>
              <span class="breakdown-value">${this.currentParty.length}/4</span>
            </div>
          </div>
        </div>

        <div class="synergy-pairs">
          <h4>Character Synergies</h4>
          <div class="pair-grid">
            ${pairSynergies.map(synergy => this.renderPairSummary(synergy)).join('')}
          </div>
        </div>

        ${teamSynergy.effects.length > 0 ? `
          <div class="team-effects">
            <h4>Team Effects</h4>
            <div class="effects-grid">
              ${teamSynergy.effects.map(effect => this.renderTeamEffect(effect)).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render detailed synergy analysis
   */
  renderDetailedAnalysis() {
    if (!this.synergyData || this.currentParty.length < 2) {
      return `<div class="synergy-empty">Add more characters for detailed analysis.</div>`;
    }

    const { pairSynergies } = this.synergyData;

    return `
      <div class="synergy-detailed">
        <h4>Detailed Synergy Analysis</h4>
        <div class="detailed-pairs">
          ${pairSynergies.map(synergy => this.renderDetailedPair(synergy)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render synergy matrix
   */
  renderSynergyMatrix() {
    if (this.currentParty.length < 2) {
      return `<div class="synergy-empty">Add more characters to see the synergy matrix.</div>`;
    }

    return `
      <div class="synergy-matrix">
        <h4>Synergy Matrix</h4>
        <div class="matrix-container">
          <table class="matrix-table">
            <thead>
              <tr>
                <th></th>
                ${this.currentParty.map(member => {
                  const char = member.characterData || this.dataManager.getCharacter(member.character);
                  return `<th class="matrix-header">${char?.name || 'Unknown'}</th>`;
                }).join('')}
              </tr>
            </thead>
            <tbody>
              ${this.currentParty.map((memberA, i) => {
                const charA = memberA.characterData || this.dataManager.getCharacter(memberA.character);
                return `
                  <tr>
                    <th class="matrix-header">${charA?.name || 'Unknown'}</th>
                    ${this.currentParty.map((memberB, j) => {
                      if (i === j) {
                        return `<td class="matrix-self">-</td>`;
                      }
                      const synergy = this.synergyData.pairSynergies.find(s =>
                        (s.memberA === memberA && s.memberB === memberB) ||
                        (s.memberA === memberB && s.memberB === memberA)
                      );
                      const score = synergy ? Math.round(synergy.score) : 0;
                      const scoreClass = this.getScoreClass(score);
                      return `<td class="matrix-cell ${scoreClass}" title="${score} synergy">${score}</td>`;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * Render recommendations
   */
  renderRecommendations() {
    if (!this.synergyData) return `<div class="synergy-empty">No recommendations available.</div>`;

    const { recommendations } = this.synergyData;

    if (recommendations.length === 0) {
      return `
        <div class="synergy-optimal">
          <div class="optimal-icon">✨</div>
          <h3>Excellent Synergy!</h3>
          <p>Your party composition is well optimized. No immediate improvements needed.</p>
        </div>
      `;
    }

    return `
      <div class="synergy-recommendations">
        <h4>Improvement Recommendations</h4>
        <div class="recommendations-list">
          ${recommendations.map(rec => this.renderRecommendation(rec)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Helper methods for rendering components
   */
  renderPairSummary(synergy) {
    const scoreClass = this.getScoreClass(synergy.score);
    const charA = synergy.characterA;
    const charB = synergy.characterB;

    return `
      <div class="pair-summary ${scoreClass}">
        <div class="pair-characters">
          <span class="char-name">${charA.name}</span>
          <span class="synergy-connector">⚡</span>
          <span class="char-name">${charB.name}</span>
        </div>
        <div class="pair-score">${Math.round(synergy.score)}</div>
        <div class="pair-highlights">
          ${synergy.details.slice(0, 2).map(detail => `
            <span class="highlight ${detail.category}">${detail.type}</span>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderDetailedPair(synergy) {
    const scoreClass = this.getScoreClass(synergy.score);
    const charA = synergy.characterA;
    const charB = synergy.characterB;

    return `
      <div class="detailed-pair">
        <div class="pair-header ${scoreClass}">
          <div class="pair-title">
            <span class="char-name">${charA.name}</span>
            <span class="synergy-connector">⚡</span>
            <span class="char-name">${charB.name}</span>
          </div>
          <div class="pair-score">${Math.round(synergy.score)}</div>
        </div>
        <div class="synergy-details">
          ${synergy.details.map(detail => `
            <div class="detail-item ${detail.category}">
              <div class="detail-header">
                <span class="detail-type">${detail.type}</span>
                <span class="detail-score">${Math.round(detail.score)}</span>
              </div>
              <div class="detail-description">${detail.description}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderTeamEffect(effect) {
    return `
      <div class="team-effect ${effect.type}">
        <div class="effect-header">
          <span class="effect-name">${effect.name}</span>
          <span class="effect-bonus">+${effect.bonus}</span>
        </div>
        <div class="effect-description">${effect.description}</div>
      </div>
    `;
  }

  renderRecommendation(rec) {
    return `
      <div class="recommendation ${rec.priority}">
        <div class="rec-header">
          <span class="rec-title">${rec.title}</span>
          <span class="rec-priority">${rec.priority}</span>
        </div>
        <div class="rec-description">${rec.description}</div>
        <div class="rec-action">${rec.action}</div>
      </div>
    `;
  }

  /**
   * Utility methods
   */
  getCharacterRole(character) {
    if (!character) return 'hybrid';

    const stats = character.baseStats;
    const attack = stats?.attack || 0;
    const defense = stats?.defense || 0;
    const magic = stats?.magic || 0;

    if (defense > attack && defense > magic) return 'tank';
    if (magic > attack && magic > defense) return 'support';
    if (attack > defense && attack > magic) return 'attacker';
    return 'hybrid';
  }

  getCombatStyle(member) {
    // Analyze member's build to determine combat style
    const build = member.build || {};
    const attributes = build.attributes || {};

    if (attributes.attack > attributes.magic) {
      return attributes.speed > attributes.defense ? 'burst' : 'sustained';
    } else if (attributes.magic > attributes.attack) {
      return attributes.wisdom > attributes.speed ? 'support' : 'utility';
    }
    return 'control';
  }

  getSupportCapabilities(character) {
    // Return array of support capabilities
    const capabilities = [];

    if (character.abilities?.some(ability => ability.type === 'heal')) {
      capabilities.push('healing');
    }
    if (character.abilities?.some(ability => ability.type === 'buff')) {
      capabilities.push('buffs');
    }
    if (character.abilities?.some(ability => ability.type === 'debuff')) {
      capabilities.push('debuffs');
    }
    if (character.element === 'light') {
      capabilities.push('purification');
    }

    return capabilities;
  }

  getScoreClass(score) {
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 50) return 'average';
    if (score >= 35) return 'poor';
    return 'terrible';
  }

  /**
   * Attach event listeners to visualization elements
   */
  attachVisualizationEvents() {
    const container = document.getElementById('synergy-content');
    if (!container) return;

    // Add hover effects and tooltips as needed
    const matrixCells = container.querySelectorAll('.matrix-cell');
    matrixCells.forEach(cell => {
      cell.addEventListener('mouseenter', (e) => {
        // Add hover highlighting for matrix
        const table = e.target.closest('table');
        if (table) {
          const cellIndex = Array.from(e.target.parentNode.children).indexOf(e.target);
          const rowIndex = Array.from(table.querySelectorAll('tbody tr')).indexOf(e.target.parentNode);

          table.querySelectorAll('th').forEach((th, i) => {
            if (i === cellIndex || i === 0) th.classList.add('highlight');
          });
          table.querySelectorAll('tbody tr').forEach((tr, i) => {
            if (i === rowIndex) tr.classList.add('highlight');
          });
        }
      });

      cell.addEventListener('mouseleave', (e) => {
        const table = e.target.closest('table');
        if (table) {
          table.querySelectorAll('.highlight').forEach(el => {
            el.classList.remove('highlight');
          });
        }
      });
    });
  }

  /**
   * Public methods for integration
   */
  refresh() {
    this.updateVisualization();
  }

  onActivate() {
    this.refresh();
  }

  hasUnsavedChanges() {
    return false; // No persistent state
  }
}