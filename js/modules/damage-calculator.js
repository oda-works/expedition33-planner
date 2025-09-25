// Damage Calculator module for Expedition 33 Planner
import { formatNumber } from '../utils/formatters.js';

/**
 * Damage Calculator class for build optimization and damage analysis
 */
export class DamageCalculator {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.combatScenarios = {
      'single_target': { name: 'Single Target', multiplier: 1.0 },
      'multi_target_2': { name: '2 Targets', multiplier: 0.8 },
      'multi_target_3': { name: '3+ Targets', multiplier: 0.7 },
      'boss_fight': { name: 'Boss Fight', multiplier: 1.2 },
      'elite_enemy': { name: 'Elite Enemy', multiplier: 1.1 }
    };

    this.enemyTypes = {
      'normal': { name: 'Normal Enemy', defense: 100, resistance: 0 },
      'armored': { name: 'Armored Enemy', defense: 200, resistance: 25 },
      'elite': { name: 'Elite Enemy', defense: 150, resistance: 10 },
      'boss': { name: 'Boss Enemy', defense: 300, resistance: 35 },
      'magical': { name: 'Magical Enemy', defense: 80, resistance: 40 }
    };
  }

  /**
   * Initialize the damage calculator
   */
  init() {
    this.setupEventListeners();
    this.renderCalculator();
  }

  /**
   * Set up event listeners for calculator
   */
  setupEventListeners() {
    const calcContainer = document.getElementById('damage-calculator');
    if (!calcContainer) return;

    calcContainer.addEventListener('change', this.handleInputChange.bind(this));
    calcContainer.addEventListener('click', this.handleButtonClick.bind(this));
  }

  /**
   * Handle input changes in calculator
   */
  handleInputChange(event) {
    if (event.target.matches('.calc-input')) {
      this.updateCalculations();
    }
  }

  /**
   * Handle button clicks
   */
  handleButtonClick(event) {
    if (event.target.matches('.load-build-btn')) {
      this.loadCharacterBuild(event.target.dataset.characterId);
    } else if (event.target.matches('.reset-calc-btn')) {
      this.resetCalculator();
    } else if (event.target.matches('.export-calc-btn')) {
      this.exportCalculation();
    }
  }

  /**
   * Render the damage calculator interface
   */
  renderCalculator() {
    const container = document.getElementById('damage-calculator');
    if (!container) return;

    const characters = this.dataManager.getAllCharacters();

    container.innerHTML = `
      <div class="calculator-container">
        <div class="calc-header">
          <h3>Damage Calculator & Build Optimizer</h3>
          <div class="calc-actions">
            <button class="btn-secondary reset-calc-btn">Reset</button>
            <button class="btn-primary export-calc-btn">Export Results</button>
          </div>
        </div>

        <div class="calc-content">
          <div class="calc-inputs">
            <div class="character-selection">
              <h4>Character Build</h4>
              <div class="build-loader">
                <label>Load Existing Build:</label>
                <div class="character-buttons">
                  ${Object.values(characters).map(char => `
                    <button class="btn-secondary load-build-btn" data-character-id="${char.id}">
                      ${char.name}
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>

            <div class="stats-input">
              <h4>Character Stats</h4>
              <div class="stat-inputs">
                <div class="input-group">
                  <label for="char-level">Level:</label>
                  <input type="number" id="char-level" class="calc-input" min="1" max="50" value="25">
                </div>
                <div class="input-group">
                  <label for="base-attack">Base Attack:</label>
                  <input type="number" id="base-attack" class="calc-input" min="0" value="300">
                </div>
                <div class="input-group">
                  <label for="crit-rate">Crit Rate (%):</label>
                  <input type="number" id="crit-rate" class="calc-input" min="0" max="100" value="25">
                </div>
                <div class="input-group">
                  <label for="crit-damage">Crit Damage (%):</label>
                  <input type="number" id="crit-damage" class="calc-input" min="100" value="200">
                </div>
                <div class="input-group">
                  <label for="elemental-bonus">Elemental Bonus (%):</label>
                  <input type="number" id="elemental-bonus" class="calc-input" min="0" value="0">
                </div>
              </div>
            </div>

            <div class="enemy-selection">
              <h4>Enemy Type</h4>
              <select id="enemy-type" class="calc-input">
                ${Object.entries(this.enemyTypes).map(([key, enemy]) => `
                  <option value="${key}">${enemy.name} (${enemy.defense} DEF, ${enemy.resistance}% RES)</option>
                `).join('')}
              </select>
            </div>

            <div class="scenario-selection">
              <h4>Combat Scenario</h4>
              <select id="combat-scenario" class="calc-input">
                ${Object.entries(this.combatScenarios).map(([key, scenario]) => `
                  <option value="${key}">${scenario.name} (x${scenario.multiplier})</option>
                `).join('')}
              </select>
            </div>

            <div class="skill-modifiers">
              <h4>Skill Modifiers</h4>
              <div class="modifier-inputs">
                <div class="input-group">
                  <label for="skill-multiplier">Skill Damage (%):</label>
                  <input type="number" id="skill-multiplier" class="calc-input" min="100" value="150">
                </div>
                <div class="input-group">
                  <label for="buff-multiplier">Buffs/Debuffs (%):</label>
                  <input type="number" id="buff-multiplier" class="calc-input" min="0" value="100">
                </div>
              </div>
            </div>
          </div>

          <div class="calc-results">
            <h4>Damage Analysis</h4>
            <div id="damage-breakdown" class="damage-breakdown">
              <!-- Damage calculations will be rendered here -->
            </div>

            <div class="optimization-tips">
              <h4>Optimization Recommendations</h4>
              <div id="optimization-suggestions" class="suggestions-list">
                <!-- Optimization tips will be rendered here -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.updateCalculations();
  }

  /**
   * Load character build into calculator
   */
  loadCharacterBuild(characterId) {
    const character = this.dataManager.getCharacter(characterId);
    if (!character) return;

    // Load character's current build from storage
    const storage = window.app?.storage;
    if (!storage) return;

    const savedData = storage.loadData();
    const characterBuild = savedData.characterBuilds?.[characterId];

    if (!characterBuild) {
      this.showToast(`No saved build found for ${character.name}`, 'info');
      return;
    }

    // Calculate character stats with current build
    const calculatedStats = this.calculateCharacterStats(character, characterBuild);

    // Update calculator inputs
    document.getElementById('char-level').value = characterBuild.level || 25;
    document.getElementById('base-attack').value = calculatedStats.attack || 300;
    document.getElementById('crit-rate').value = calculatedStats.critRate || 25;
    document.getElementById('crit-damage').value = calculatedStats.critDamage || 200;
    document.getElementById('elemental-bonus').value = calculatedStats.elementalBonus || 0;

    this.updateCalculations();
    this.showToast(`Loaded ${character.name}'s build`, 'success');
  }

  /**
   * Calculate character stats including Pictos bonuses
   */
  calculateCharacterStats(character, build) {
    const baseStats = character.baseStats.level1;
    const level = build.level || 1;

    // Calculate level scaling
    const levelMultiplier = 1 + ((level - 1) * 0.1);

    let stats = {
      attack: Math.floor(baseStats.attack * levelMultiplier),
      critRate: baseStats.critRate || 5,
      critDamage: baseStats.critDamage || 150,
      elementalBonus: 0
    };

    // Add attribute bonuses
    if (build.attributes) {
      Object.entries(build.attributes).forEach(([attr, points]) => {
        const scaling = character.attributeScaling[attr];
        if (scaling) {
          Object.entries(scaling).forEach(([stat, bonus]) => {
            stats[stat] = (stats[stat] || 0) + (bonus * points);
          });
        }
      });
    }

    // Add Pictos bonuses
    if (build.equippedPictos) {
      const storage = window.app?.storage;
      const savedData = storage?.loadData();
      const masteredPictos = savedData?.masteredPictos || {};

      build.equippedPictos.forEach(pictosId => {
        const pictos = this.dataManager.getPictos(pictosId);
        if (pictos) {
          const masteryLevel = Math.min(4, Math.floor(masteredPictos[pictosId] || 0) + 1);
          const pictosStats = pictos.stats[`level${masteryLevel}`] || pictos.stats.level1;

          Object.entries(pictosStats).forEach(([stat, value]) => {
            stats[stat] = (stats[stat] || 0) + value;
          });
        }
      });
    }

    return stats;
  }

  /**
   * Update damage calculations
   */
  updateCalculations() {
    const level = parseInt(document.getElementById('char-level')?.value || 25);
    const baseAttack = parseInt(document.getElementById('base-attack')?.value || 300);
    const critRate = parseInt(document.getElementById('crit-rate')?.value || 25);
    const critDamage = parseInt(document.getElementById('crit-damage')?.value || 200);
    const elementalBonus = parseInt(document.getElementById('elemental-bonus')?.value || 0);

    const enemyType = document.getElementById('enemy-type')?.value || 'normal';
    const scenario = document.getElementById('combat-scenario')?.value || 'single_target';

    const skillMultiplier = parseInt(document.getElementById('skill-multiplier')?.value || 150);
    const buffMultiplier = parseInt(document.getElementById('buff-multiplier')?.value || 100);

    const enemy = this.enemyTypes[enemyType];
    const combatScenario = this.combatScenarios[scenario];

    // Calculate damage
    const results = this.calculateDamage({
      level,
      baseAttack,
      critRate: critRate / 100,
      critDamage: critDamage / 100,
      elementalBonus: elementalBonus / 100,
      skillMultiplier: skillMultiplier / 100,
      buffMultiplier: buffMultiplier / 100
    }, enemy, combatScenario);

    this.renderDamageBreakdown(results);
    this.renderOptimizationSuggestions(results);
  }

  /**
   * Calculate damage with given parameters
   */
  calculateDamage(stats, enemy, scenario) {
    // Base damage calculation
    const rawDamage = stats.baseAttack * stats.skillMultiplier * stats.buffMultiplier;

    // Apply elemental bonus
    const elementalDamage = rawDamage * (1 + stats.elementalBonus);

    // Apply scenario multiplier
    const scenarioDamage = elementalDamage * scenario.multiplier;

    // Calculate defense reduction
    const defenseMitigation = enemy.defense / (enemy.defense + 100 + stats.level * 5);
    const afterDefense = scenarioDamage * (1 - defenseMitigation);

    // Apply resistance
    const finalNonCrit = afterDefense * (1 - enemy.resistance / 100);

    // Calculate critical damage
    const finalCrit = finalNonCrit * stats.critDamage;

    // Calculate average damage (considering crit rate)
    const averageDamage = finalNonCrit * (1 - stats.critRate) + finalCrit * stats.critRate;

    // Calculate DPS estimates
    const baseAPPerTurn = 3;
    const turnsPerMinute = 10;
    const dpsEstimate = averageDamage * baseAPPerTurn * turnsPerMinute / 60;

    return {
      rawDamage,
      elementalDamage,
      scenarioDamage,
      finalNonCrit,
      finalCrit,
      averageDamage,
      dpsEstimate,
      stats,
      enemy,
      scenario
    };
  }

  /**
   * Render damage breakdown
   */
  renderDamageBreakdown(results) {
    const container = document.getElementById('damage-breakdown');
    if (!container) return;

    container.innerHTML = `
      <div class="damage-stats">
        <div class="damage-row main-damage">
          <span class="damage-label">Average Damage:</span>
          <span class="damage-value">${formatNumber(Math.round(results.averageDamage))}</span>
        </div>
        <div class="damage-row">
          <span class="damage-label">Non-Critical Hit:</span>
          <span class="damage-value">${formatNumber(Math.round(results.finalNonCrit))}</span>
        </div>
        <div class="damage-row">
          <span class="damage-label">Critical Hit:</span>
          <span class="damage-value crit">${formatNumber(Math.round(results.finalCrit))}</span>
        </div>
        <div class="damage-row">
          <span class="damage-label">Estimated DPS:</span>
          <span class="damage-value">${formatNumber(Math.round(results.dpsEstimate))}</span>
        </div>
      </div>

      <div class="damage-breakdown-details">
        <h5>Damage Breakdown</h5>
        <div class="breakdown-steps">
          <div class="step">Base Attack × Skill Multiplier × Buffs = ${formatNumber(Math.round(results.rawDamage))}</div>
          <div class="step">+ Elemental Bonus (${Math.round(results.stats.elementalBonus * 100)}%) = ${formatNumber(Math.round(results.elementalDamage))}</div>
          <div class="step">× Combat Scenario (${results.scenario.multiplier}) = ${formatNumber(Math.round(results.scenarioDamage))}</div>
          <div class="step">- Defense Mitigation = ${formatNumber(Math.round(results.finalNonCrit))}</div>
          <div class="step">- Resistance (${results.enemy.resistance}%) = Final Damage</div>
        </div>
      </div>
    `;
  }

  /**
   * Render optimization suggestions
   */
  renderOptimizationSuggestions(results) {
    const container = document.getElementById('optimization-suggestions');
    if (!container) return;

    const suggestions = this.generateOptimizationSuggestions(results);

    container.innerHTML = suggestions.map(suggestion => `
      <div class="suggestion ${suggestion.priority}">
        <div class="suggestion-header">
          <span class="suggestion-title">${suggestion.title}</span>
          <span class="suggestion-impact">+${suggestion.impact}% damage</span>
        </div>
        <p class="suggestion-description">${suggestion.description}</p>
      </div>
    `).join('');
  }

  /**
   * Generate optimization suggestions based on current build
   */
  generateOptimizationSuggestions(results) {
    const suggestions = [];

    // Critical rate optimization
    if (results.stats.critRate < 0.3) {
      suggestions.push({
        title: 'Increase Critical Rate',
        impact: Math.round((0.3 - results.stats.critRate) * 50),
        priority: 'high',
        description: 'Your critical rate is low. Consider equipping Pictos that boost critical rate or investing in Luck attributes.'
      });
    }

    // Critical damage optimization
    if (results.stats.critDamage < 2.5 && results.stats.critRate > 0.2) {
      suggestions.push({
        title: 'Boost Critical Damage',
        impact: Math.round((2.5 - results.stats.critDamage) * 30),
        priority: 'medium',
        description: 'With decent critical rate, increasing critical damage will provide significant damage gains.'
      });
    }

    // Elemental damage optimization
    if (results.stats.elementalBonus < 0.3) {
      suggestions.push({
        title: 'Add Elemental Damage',
        impact: 25,
        priority: 'medium',
        description: 'Elemental damage bonuses provide consistent damage increases and can exploit enemy weaknesses.'
      });
    }

    // Defense penetration suggestion
    if (results.enemy.defense > 150) {
      suggestions.push({
        title: 'Consider Defense Penetration',
        impact: 20,
        priority: 'high',
        description: 'Against heavily armored enemies, defense penetration or armor-breaking abilities are very effective.'
      });
    }

    // Multi-target optimization
    if (results.scenario.multiplier < 1.0) {
      suggestions.push({
        title: 'Optimize for Multi-Target',
        impact: 35,
        priority: 'low',
        description: 'Consider Pictos with area-of-effect bonuses or abilities that hit multiple enemies.'
      });
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }

  /**
   * Reset calculator to default values
   */
  resetCalculator() {
    const inputs = document.querySelectorAll('.calc-input');
    inputs.forEach(input => {
      if (input.type === 'number') {
        input.value = input.dataset.default || input.getAttribute('value') || '';
      } else if (input.type === 'select-one') {
        input.selectedIndex = 0;
      }
    });

    this.updateCalculations();
    this.showToast('Calculator reset to defaults', 'info');
  }

  /**
   * Export calculation results
   */
  exportCalculation() {
    const results = this.getCurrentResults();
    if (!results) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      characterStats: results.stats,
      enemy: results.enemy,
      scenario: results.scenario,
      damage: {
        average: Math.round(results.averageDamage),
        nonCrit: Math.round(results.finalNonCrit),
        crit: Math.round(results.finalCrit),
        dps: Math.round(results.dpsEstimate)
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expedition33-damage-calc-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.showToast('Calculation exported successfully', 'success');
  }

  /**
   * Get current calculation results
   */
  getCurrentResults() {
    // This would return the current calculation results
    // Implementation depends on how we store the current state
    return null;
  }

  /**
   * Show toast message
   */
  showToast(message, type = 'info') {
    if (window.app && window.app.showToast) {
      window.app.showToast(message, type);
    }
  }
}