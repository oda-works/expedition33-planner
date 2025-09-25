// Build Comparison module for Expedition 33 Planner
import { formatNumber, formatStat } from '../utils/formatters.js';

/**
 * Build Comparison class for analyzing and comparing character builds
 */
export class BuildComparison {
  constructor(dataManager, storage) {
    this.dataManager = dataManager;
    this.storage = storage;
    this.comparedBuilds = [];
    this.maxComparisons = 4;

    // Bind methods
    this.handleAddBuild = this.handleAddBuild.bind(this);
    this.handleRemoveBuild = this.handleRemoveBuild.bind(this);
    this.handleLoadBuild = this.handleLoadBuild.bind(this);
    this.handleExportComparison = this.handleExportComparison.bind(this);
    this.handleBuildOptimize = this.handleBuildOptimize.bind(this);
  }

  /**
   * Initialize the Build Comparison system
   */
  async init() {
    try {
      this.loadSavedComparisons();
      this.setupEventListeners();
      this.renderComparisonInterface();
    } catch (error) {
      console.error('Failed to initialize Build Comparison:', error);
    }
  }

  /**
   * Load saved build comparisons
   */
  loadSavedComparisons() {
    const savedData = this.storage.loadData();
    this.comparedBuilds = savedData.comparedBuilds || [];
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    const container = document.getElementById('build-comparison');
    if (!container) return;

    container.addEventListener('click', (e) => {
      if (e.target.matches('.add-build-btn')) {
        this.handleAddBuild();
      } else if (e.target.matches('.remove-build-btn')) {
        const index = parseInt(e.target.dataset.index);
        this.handleRemoveBuild(index);
      } else if (e.target.matches('.load-build-btn')) {
        const characterId = e.target.dataset.characterId;
        this.handleLoadBuild(characterId);
      } else if (e.target.matches('.optimize-build-btn')) {
        const index = parseInt(e.target.dataset.index);
        this.handleBuildOptimize(index);
      } else if (e.target.matches('.export-comparison-btn')) {
        this.handleExportComparison();
      }
    });

    container.addEventListener('change', (e) => {
      if (e.target.matches('.comparison-metric')) {
        this.updateComparison();
      }
    });
  }

  /**
   * Render the build comparison interface
   */
  renderComparisonInterface() {
    const container = document.getElementById('build-comparison');
    if (!container) return;

    container.innerHTML = `
      <div class="comparison-container">
        <div class="comparison-header">
          <h3>Build Comparison Tool</h3>
          <div class="comparison-actions">
            <button class="add-build-btn btn-primary">Add Build</button>
            <button class="export-comparison-btn btn-secondary">Export Comparison</button>
          </div>
        </div>

        <div class="comparison-controls">
          <div class="metric-selector">
            <label for="comparison-metric">Compare by:</label>
            <select id="comparison-metric" class="comparison-metric">
              <option value="stats">Base Stats</option>
              <option value="damage">Damage Output</option>
              <option value="survivability">Survivability</option>
              <option value="utility">Utility & Support</option>
              <option value="synergy">Party Synergy</option>
            </select>
          </div>
        </div>

        <div id="build-slots" class="build-slots">
          ${this.renderBuildSlots()}
        </div>

        <div id="comparison-results" class="comparison-results">
          ${this.renderComparisonResults()}
        </div>

        <div id="optimization-suggestions" class="optimization-panel">
          ${this.renderOptimizationSuggestions()}
        </div>
      </div>
    `;
  }

  /**
   * Render build slots for comparison
   */
  renderBuildSlots() {
    const slots = [];

    for (let i = 0; i < this.maxComparisons; i++) {
      const build = this.comparedBuilds[i];

      if (build) {
        slots.push(this.renderBuildCard(build, i));
      } else {
        slots.push(this.renderEmptySlot(i));
      }
    }

    return slots.join('');
  }

  /**
   * Render a build card
   */
  renderBuildCard(build, index) {
    const character = this.dataManager.getCharacter(build.characterId);
    if (!character) return this.renderEmptySlot(index);

    const calculatedStats = this.calculateBuildStats(build);
    const scoreData = this.calculateBuildScores(build, calculatedStats);

    return `
      <div class="build-card" data-index="${index}">
        <div class="build-header">
          <div class="character-info">
            <img src="${character.image}" alt="${character.name}" class="character-portrait-small">
            <div class="character-details">
              <h4>${character.name}</h4>
              <span class="build-name">${build.buildName || 'Unnamed Build'}</span>
              <span class="build-level">Level ${build.level || 1}</span>
            </div>
          </div>
          <button class="remove-build-btn" data-index="${index}" title="Remove build">×</button>
        </div>

        <div class="build-stats-summary">
          <div class="stat-row">
            <span class="stat-label">Attack:</span>
            <span class="stat-value">${formatNumber(calculatedStats.attack)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">HP:</span>
            <span class="stat-value">${formatNumber(calculatedStats.hp)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Defense:</span>
            <span class="stat-value">${formatNumber(calculatedStats.defense)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Speed:</span>
            <span class="stat-value">${formatNumber(calculatedStats.speed)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Crit Rate:</span>
            <span class="stat-value">${calculatedStats.critRate}%</span>
          </div>
        </div>

        <div class="build-scores">
          <div class="score-item">
            <span class="score-label">Damage:</span>
            <div class="score-bar">
              <div class="score-fill damage" style="width: ${scoreData.damage}%"></div>
            </div>
            <span class="score-value">${scoreData.damage}/100</span>
          </div>
          <div class="score-item">
            <span class="score-label">Defense:</span>
            <div class="score-bar">
              <div class="score-fill defense" style="width: ${scoreData.survivability}%"></div>
            </div>
            <span class="score-value">${scoreData.survivability}/100</span>
          </div>
          <div class="score-item">
            <span class="score-label">Utility:</span>
            <div class="score-bar">
              <div class="score-fill utility" style="width: ${scoreData.utility}%"></div>
            </div>
            <span class="score-value">${scoreData.utility}/100</span>
          </div>
        </div>

        <div class="build-actions">
          <button class="optimize-build-btn btn-secondary" data-index="${index}">Optimize</button>
          <button class="edit-build-btn btn-primary" data-index="${index}">Edit</button>
        </div>
      </div>
    `;
  }

  /**
   * Render empty build slot
   */
  renderEmptySlot(index) {
    const characters = this.dataManager.getAllCharacters();

    return `
      <div class="build-slot-empty" data-index="${index}">
        <div class="empty-content">
          <div class="empty-icon">+</div>
          <p>Add Build to Compare</p>

          <div class="quick-load-options">
            <h5>Load Existing Build:</h5>
            <div class="character-quick-load">
              ${Object.values(characters).map(char => `
                <button class="load-build-btn character-quick-btn"
                        data-character-id="${char.id}"
                        title="Load ${char.name}'s build">
                  <img src="${char.image}" alt="${char.name}">
                  <span>${char.name}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <button class="add-build-btn btn-primary">Create New Build</button>
        </div>
      </div>
    `;
  }

  /**
   * Calculate build statistics
   */
  calculateBuildStats(build) {
    const character = this.dataManager.getCharacter(build.characterId);
    if (!character) return {};

    const level = build.level || 1;
    const baseStats = character.baseStats.level1;

    // Level scaling (rough approximation)
    const levelMultiplier = 1 + ((level - 1) * 0.1);

    let stats = {
      attack: Math.floor(baseStats.attack * levelMultiplier),
      hp: Math.floor(baseStats.hp * levelMultiplier),
      defense: Math.floor(baseStats.defense * levelMultiplier),
      speed: Math.floor(baseStats.speed * levelMultiplier),
      critRate: baseStats.critRate || 5,
      critDamage: baseStats.critDamage || 150
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

    // Add weapon bonuses
    if (build.equippedWeapon) {
      const weapon = this.dataManager.getWeapon(build.equippedWeapon);
      if (weapon && weapon.baseStats) {
        const weaponLevel = build.weaponLevel || 1;
        const weaponStats = weapon.baseStats.level1;

        // Simple weapon scaling
        const weaponMultiplier = 1 + ((weaponLevel - 1) * 0.15);
        stats.attack += Math.floor(weaponStats.attack * weaponMultiplier);
      }
    }

    // Add Pictos bonuses
    if (build.equippedPictos) {
      const storage = this.storage.loadData();
      const masteredPictos = storage.masteredPictos || {};

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
   * Calculate build performance scores
   */
  calculateBuildScores(build, stats) {
    const character = this.dataManager.getCharacter(build.characterId);
    if (!character) return { damage: 0, survivability: 0, utility: 0 };

    // Damage score calculation
    const avgDamage = stats.attack * (1 + (stats.critRate / 100) * (stats.critDamage / 100 - 1));
    const damageScore = Math.min(100, Math.floor((avgDamage / 1000) * 100));

    // Survivability score
    const ehp = stats.hp * (1 + stats.defense / 100);
    const survivabilityScore = Math.min(100, Math.floor((ehp / 5000) * 100));

    // Utility score (based on character role and Pictos)
    let utilityScore = 30; // Base utility

    if (character.role.includes('Support')) utilityScore += 30;
    if (character.role.includes('Healer')) utilityScore += 20;
    if (build.equippedPictos?.length >= 3) utilityScore += 20;

    utilityScore = Math.min(100, utilityScore);

    return {
      damage: damageScore,
      survivability: survivabilityScore,
      utility: utilityScore
    };
  }

  /**
   * Render comparison results
   */
  renderComparisonResults() {
    if (this.comparedBuilds.length < 2) {
      return `
        <div class="no-comparison">
          <h4>No Comparison Available</h4>
          <p>Add at least 2 builds to see detailed comparisons.</p>
        </div>
      `;
    }

    return `
      <div class="comparison-table">
        <h4>Build Comparison Analysis</h4>
        ${this.renderStatsComparison()}
        ${this.renderPerformanceComparison()}
        ${this.renderRecommendations()}
      </div>
    `;
  }

  /**
   * Render stats comparison table
   */
  renderStatsComparison() {
    const statNames = ['attack', 'hp', 'defense', 'speed', 'critRate', 'critDamage'];

    return `
      <div class="stats-comparison-table">
        <div class="table-header">
          <div class="stat-name">Stat</div>
          ${this.comparedBuilds.map((_, i) => `
            <div class="build-column">Build ${i + 1}</div>
          `).join('')}
          <div class="best-column">Best</div>
        </div>

        ${statNames.map(statName => {
          const values = this.comparedBuilds.map(build => {
            const stats = this.calculateBuildStats(build);
            return stats[statName] || 0;
          });

          const bestValue = Math.max(...values);
          const bestIndex = values.indexOf(bestValue);

          return `
            <div class="table-row">
              <div class="stat-name">${this.getStatDisplayName(statName)}</div>
              ${values.map((value, i) => `
                <div class="stat-value ${i === bestIndex ? 'best-value' : ''}">
                  ${formatNumber(value)}${statName.includes('Rate') || statName.includes('Damage') ? '%' : ''}
                </div>
              `).join('')}
              <div class="best-indicator">
                Build ${bestIndex + 1}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Render performance comparison
   */
  renderPerformanceComparison() {
    return `
      <div class="performance-comparison">
        <h5>Performance Scores</h5>
        <div class="performance-chart">
          ${this.comparedBuilds.map((build, index) => {
            const stats = this.calculateBuildStats(build);
            const scores = this.calculateBuildScores(build, stats);
            const character = this.dataManager.getCharacter(build.characterId);

            return `
              <div class="build-performance">
                <div class="build-label">${character?.name || 'Unknown'}</div>
                <div class="performance-bars">
                  <div class="performance-item">
                    <span>Damage</span>
                    <div class="perf-bar">
                      <div class="perf-fill damage" style="width: ${scores.damage}%"></div>
                    </div>
                    <span>${scores.damage}</span>
                  </div>
                  <div class="performance-item">
                    <span>Defense</span>
                    <div class="perf-bar">
                      <div class="perf-fill defense" style="width: ${scores.survivability}%"></div>
                    </div>
                    <span>${scores.survivability}</span>
                  </div>
                  <div class="performance-item">
                    <span>Utility</span>
                    <div class="perf-bar">
                      <div class="perf-fill utility" style="width: ${scores.utility}%"></div>
                    </div>
                    <span>${scores.utility}</span>
                  </div>
                </div>
                <div class="overall-score">
                  Overall: ${Math.round((scores.damage + scores.survivability + scores.utility) / 3)}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render optimization suggestions
   */
  renderOptimizationSuggestions() {
    if (this.comparedBuilds.length === 0) {
      return '';
    }

    return `
      <div class="optimization-suggestions">
        <h4>Optimization Insights</h4>
        <div class="insights-grid">
          ${this.generateOptimizationInsights().map(insight => `
            <div class="insight-item ${insight.priority}">
              <div class="insight-header">
                <span class="insight-title">${insight.title}</span>
                <span class="insight-impact">+${insight.impact}% potential</span>
              </div>
              <p class="insight-description">${insight.description}</p>
              ${insight.buildIndex !== undefined ? `
                <button class="apply-suggestion-btn btn-primary" data-build="${insight.buildIndex}" data-suggestion="${insight.type}">
                  Apply to Build ${insight.buildIndex + 1}
                </button>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Generate optimization insights
   */
  generateOptimizationInsights() {
    const insights = [];

    // Analyze each build for optimization opportunities
    this.comparedBuilds.forEach((build, index) => {
      const stats = this.calculateBuildStats(build);
      const character = this.dataManager.getCharacter(build.characterId);

      // Check for low critical rate
      if (stats.critRate < 25) {
        insights.push({
          title: 'Increase Critical Rate',
          description: `Build ${index + 1} (${character?.name}) has low critical rate. Consider Pictos that boost critical chance.`,
          impact: 25,
          priority: 'high',
          buildIndex: index,
          type: 'crit_rate'
        });
      }

      // Check for unbalanced stats
      if (stats.attack > stats.hp * 2) {
        insights.push({
          title: 'Improve Survivability',
          description: `Build ${index + 1} is glass cannon. Consider investing in HP or Defense attributes.`,
          impact: 20,
          priority: 'medium',
          buildIndex: index,
          type: 'survivability'
        });
      }

      // Check for missing Pictos
      if (!build.equippedPictos || build.equippedPictos.length < 3) {
        insights.push({
          title: 'Equip More Pictos',
          description: `Build ${index + 1} has unused Pictos slots. Equip more Pictos for better performance.`,
          impact: 15,
          priority: 'medium',
          buildIndex: index,
          type: 'pictos'
        });
      }
    });

    // Cross-build comparisons
    if (this.comparedBuilds.length >= 2) {
      const allStats = this.comparedBuilds.map(build => this.calculateBuildStats(build));
      const avgAttack = allStats.reduce((sum, stats) => sum + stats.attack, 0) / allStats.length;

      allStats.forEach((stats, index) => {
        if (stats.attack < avgAttack * 0.8) {
          insights.push({
            title: 'Low Damage Output',
            description: `Build ${index + 1} has significantly lower damage than other builds. Consider weapon upgrades or attack-focused Pictos.`,
            impact: 30,
            priority: 'high',
            buildIndex: index,
            type: 'damage'
          });
        }
      });
    }

    return insights.slice(0, 6); // Limit to top 6 insights
  }

  /**
   * Handle adding new build
   */
  handleAddBuild() {
    if (this.comparedBuilds.length >= this.maxComparisons) {
      this.showToast('Maximum number of builds reached', 'warning');
      return;
    }

    // Show build creation modal
    this.showBuildSelectionModal();
  }

  /**
   * Show build selection modal
   */
  showBuildSelectionModal() {
    const characters = this.dataManager.getAllCharacters();
    const savedBuilds = this.storage.loadData().characterBuilds || {};

    const modalContent = document.createElement('div');
    modalContent.className = 'build-selection-modal';

    modalContent.innerHTML = `
      <div class="build-selection-content">
        <h4>Select Build to Add</h4>

        <div class="build-options">
          ${Object.values(characters).map(character => {
            const characterBuild = savedBuilds[character.id];
            return `
              <div class="build-option ${characterBuild ? 'has-build' : 'no-build'}"
                   data-character-id="${character.id}">
                <div class="character-preview">
                  <img src="${character.image}" alt="${character.name}" class="character-image-small">
                  <div class="character-info">
                    <h5>${character.name}</h5>
                    <span class="character-role">${character.role}</span>
                    ${characterBuild ? `
                      <span class="build-level">Level ${characterBuild.level || 1}</span>
                      <span class="build-status">Saved Build Available</span>
                    ` : `
                      <span class="build-status">No Saved Build</span>
                    `}
                  </div>
                </div>
                <div class="build-actions">
                  ${characterBuild ? `
                    <button class="add-existing-build-btn btn-primary" data-character-id="${character.id}">
                      Add Existing Build
                    </button>
                  ` : `
                    <button class="create-new-build-btn btn-secondary" data-character-id="${character.id}">
                      Create New Build
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Add event listeners
    modalContent.addEventListener('click', (e) => {
      if (e.target.matches('.add-existing-build-btn')) {
        const characterId = e.target.dataset.characterId;
        this.addExistingBuild(characterId);
        this.hideModal();
      } else if (e.target.matches('.create-new-build-btn')) {
        const characterId = e.target.dataset.characterId;
        this.createNewBuild(characterId);
        this.hideModal();
      }
    });

    this.showModal('Add Build for Comparison', modalContent);
  }

  /**
   * Add existing build to comparison
   */
  addExistingBuild(characterId) {
    const savedBuilds = this.storage.loadData().characterBuilds || {};
    const characterBuild = savedBuilds[characterId];

    if (characterBuild) {
      const buildData = {
        ...characterBuild,
        characterId,
        buildName: characterBuild.buildName || `${this.dataManager.getCharacter(characterId)?.name} Build`,
        comparisonId: Date.now() + Math.random()
      };

      this.comparedBuilds.push(buildData);
      this.saveComparisonData();
      this.renderComparisonInterface();
      this.showToast('Build added to comparison', 'success');
    }
  }

  /**
   * Create new build for comparison
   */
  createNewBuild(characterId) {
    const character = this.dataManager.getCharacter(characterId);
    if (!character) return;

    // Create a basic build template
    const newBuild = {
      characterId,
      buildName: `${character.name} Comparison Build`,
      level: 25,
      attributes: {
        vitality: 10,
        agility: 10,
        defense: 10,
        luck: 10
      },
      equippedWeapon: character.defaultWeapon,
      weaponLevel: 10,
      equippedPictos: [],
      comparisonId: Date.now() + Math.random()
    };

    this.comparedBuilds.push(newBuild);
    this.saveComparisonData();
    this.renderComparisonInterface();
    this.showToast('New build created and added to comparison', 'success');
  }

  /**
   * Handle removing build from comparison
   */
  handleRemoveBuild(index) {
    if (index >= 0 && index < this.comparedBuilds.length) {
      const character = this.dataManager.getCharacter(this.comparedBuilds[index].characterId);
      this.comparedBuilds.splice(index, 1);
      this.saveComparisonData();
      this.renderComparisonInterface();
      this.showToast(`${character?.name || 'Build'} removed from comparison`, 'success');
    }
  }

  /**
   * Handle loading build into comparison
   */
  handleLoadBuild(characterId) {
    this.addExistingBuild(characterId);
  }

  /**
   * Handle build optimization
   */
  handleBuildOptimize(index) {
    const build = this.comparedBuilds[index];
    if (!build) return;

    // Show optimization modal with suggestions
    this.showBuildOptimizationModal(build, index);
  }

  /**
   * Show build optimization modal
   */
  showBuildOptimizationModal(build, index) {
    const character = this.dataManager.getCharacter(build.characterId);
    const stats = this.calculateBuildStats(build);
    const insights = this.generateSpecificBuildInsights(build, stats);

    const modalContent = document.createElement('div');
    modalContent.className = 'build-optimization-modal';

    modalContent.innerHTML = `
      <div class="optimization-content">
        <div class="build-overview">
          <h4>Optimize ${character?.name} Build</h4>
          <div class="current-stats">
            <div class="stat-grid">
              <div class="stat-item">
                <label>Attack</label>
                <span>${formatNumber(stats.attack)}</span>
              </div>
              <div class="stat-item">
                <label>HP</label>
                <span>${formatNumber(stats.hp)}</span>
              </div>
              <div class="stat-item">
                <label>Defense</label>
                <span>${formatNumber(stats.defense)}</span>
              </div>
              <div class="stat-item">
                <label>Crit Rate</label>
                <span>${stats.critRate}%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="optimization-suggestions">
          <h5>Optimization Suggestions</h5>
          ${insights.map(insight => `
            <div class="suggestion-item ${insight.priority}">
              <div class="suggestion-header">
                <h6>${insight.title}</h6>
                <span class="impact-badge">+${insight.impact}%</span>
              </div>
              <p>${insight.description}</p>
              <div class="suggestion-actions">
                <button class="apply-optimization-btn btn-primary"
                        data-type="${insight.type}"
                        data-build-index="${index}">
                  Apply Optimization
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    modalContent.addEventListener('click', (e) => {
      if (e.target.matches('.apply-optimization-btn')) {
        const type = e.target.dataset.type;
        const buildIndex = parseInt(e.target.dataset.buildIndex);
        this.applyOptimization(buildIndex, type);
        this.hideModal();
      }
    });

    this.showModal('Build Optimization', modalContent);
  }

  /**
   * Generate specific build optimization insights
   */
  generateSpecificBuildInsights(build, stats) {
    const insights = [];
    const character = this.dataManager.getCharacter(build.characterId);

    // Role-specific optimizations
    if (character?.role.includes('Offensive')) {
      if (stats.critRate < 30) {
        insights.push({
          title: 'Boost Critical Rate',
          description: 'As an offensive character, higher critical rate will significantly improve damage output.',
          impact: 25,
          priority: 'high',
          type: 'crit_focus'
        });
      }
    }

    if (character?.role.includes('Tank') || character?.role.includes('Defensive')) {
      if (stats.hp < stats.attack) {
        insights.push({
          title: 'Increase HP Pool',
          description: 'Defensive characters benefit more from high HP to fulfill their tanking role.',
          impact: 20,
          priority: 'high',
          type: 'hp_focus'
        });
      }
    }

    // Attribute distribution optimization
    const totalAttributes = Object.values(build.attributes || {}).reduce((sum, val) => sum + val, 0);
    if (totalAttributes < 80) {
      insights.push({
        title: 'Distribute More Attribute Points',
        description: 'You have unused attribute points that could significantly improve performance.',
        impact: 15,
        priority: 'medium',
        type: 'attributes'
      });
    }

    return insights;
  }

  /**
   * Apply optimization to build
   */
  applyOptimization(buildIndex, type) {
    const build = this.comparedBuilds[buildIndex];
    if (!build) return;

    switch (type) {
      case 'crit_focus':
        // Redistribute attributes toward luck
        build.attributes.luck = (build.attributes.luck || 0) + 10;
        break;
      case 'hp_focus':
        // Redistribute attributes toward vitality
        build.attributes.vitality = (build.attributes.vitality || 0) + 10;
        break;
      case 'attributes':
        // Add balanced attribute distribution
        Object.keys(build.attributes).forEach(attr => {
          build.attributes[attr] = (build.attributes[attr] || 0) + 5;
        });
        break;
    }

    this.saveComparisonData();
    this.renderComparisonInterface();
    this.showToast('Optimization applied successfully', 'success');
  }

  /**
   * Handle exporting comparison
   */
  handleExportComparison() {
    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      comparedBuilds: this.comparedBuilds.map(build => ({
        ...build,
        calculatedStats: this.calculateBuildStats(build),
        performanceScores: this.calculateBuildScores(build, this.calculateBuildStats(build))
      })),
      insights: this.generateOptimizationInsights()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `expedition33_build_comparison_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast('Build comparison exported successfully', 'success');
  }

  /**
   * Update comparison display
   */
  updateComparison() {
    const resultsContainer = document.getElementById('comparison-results');
    const optimizationContainer = document.getElementById('optimization-suggestions');

    if (resultsContainer) {
      resultsContainer.innerHTML = this.renderComparisonResults();
    }

    if (optimizationContainer) {
      optimizationContainer.innerHTML = this.renderOptimizationSuggestions();
    }
  }

  /**
   * Get stat display name
   */
  getStatDisplayName(statName) {
    const displayNames = {
      attack: 'Attack',
      hp: 'HP',
      defense: 'Defense',
      speed: 'Speed',
      critRate: 'Crit Rate',
      critDamage: 'Crit Damage'
    };
    return displayNames[statName] || statName;
  }

  /**
   * Save comparison data
   */
  saveComparisonData() {
    const data = this.storage.loadData();
    data.comparedBuilds = this.comparedBuilds;
    this.storage.saveData(data);
  }

  /**
   * Show toast message
   */
  showToast(message, type = 'info') {
    if (window.app && window.app.showToast) {
      window.app.showToast(message, type);
    }
  }

  /**
   * Show modal
   */
  showModal(title, content) {
    if (window.app && window.app.showModal) {
      window.app.showModal(title, content);
    }
  }

  /**
   * Hide modal
   */
  hideModal() {
    if (window.app && window.app.hideModal) {
      window.app.hideModal();
    }
  }

  /**
   * Refresh the comparison
   */
  refresh() {
    this.loadSavedComparisons();
    this.renderComparisonInterface();
  }

  /**
   * Called when tab becomes active
   */
  onActivate() {
    this.refresh();
  }

  /**
   * Check for unsaved changes
   */
  hasUnsavedChanges() {
    return false; // Auto-save enabled
  }
}