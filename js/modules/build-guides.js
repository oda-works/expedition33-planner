// Comprehensive Build Guides System for Expedition 33 Planner
import { formatNumber, formatStat } from '../utils/formatters.js';

/**
 * Build Guides class for intelligent build recommendations and progression guidance
 */
export class BuildGuides {
  constructor(dataManager, storage) {
    this.dataManager = dataManager;
    this.storage = storage;
    this.currentCharacter = null;
    this.selectedBuildType = 'optimal';
    this.selectedProgression = 'balanced';
    this.selectedSituation = 'general';

    // Build archetypes and their characteristics
    this.buildArchetypes = {
      glass_cannon: {
        name: 'Glass Cannon',
        description: 'Maximum damage output at the cost of survivability',
        focus: ['attack', 'critRate', 'critDamage'],
        avoid: ['defense', 'hp'],
        difficulty: 'Advanced',
        icon: '⚡'
      },
      balanced_dps: {
        name: 'Balanced DPS',
        description: 'Strong damage with reasonable survivability',
        focus: ['attack', 'speed', 'critRate'],
        maintain: ['defense', 'hp'],
        difficulty: 'Intermediate',
        icon: '⚔️'
      },
      tank_support: {
        name: 'Tank Support',
        description: 'High survivability with team utility',
        focus: ['defense', 'hp', 'magic'],
        secondary: ['speed'],
        difficulty: 'Beginner',
        icon: '🛡️'
      },
      speed_demon: {
        name: 'Speed Demon',
        description: 'Ultra-fast actions and turn manipulation',
        focus: ['speed', 'attack'],
        secondary: ['critRate'],
        difficulty: 'Advanced',
        icon: '💨'
      },
      elemental_master: {
        name: 'Elemental Master',
        description: 'Specialized elemental damage and effects',
        focus: ['magic', 'wisdom', 'critRate'],
        secondary: ['attack'],
        difficulty: 'Expert',
        icon: '🔥'
      },
      hybrid_versatile: {
        name: 'Hybrid Versatile',
        description: 'Adaptable to multiple situations and roles',
        focus: ['attack', 'magic', 'defense'],
        maintain: ['speed', 'hp'],
        difficulty: 'Intermediate',
        icon: '🌟'
      }
    };

    // Situational build adjustments
    this.situationalAdjustments = {
      boss_fights: {
        name: 'Boss Battles',
        adjustments: {
          increase: ['attack', 'critDamage', 'defense'],
          decrease: ['speed'],
          reasoning: 'Boss fights reward sustained damage and survivability over speed'
        }
      },
      exploration: {
        name: 'Exploration',
        adjustments: {
          increase: ['speed', 'magic'],
          maintain: ['attack', 'defense'],
          reasoning: 'Exploration benefits from mobility and utility abilities'
        }
      },
      pvp_combat: {
        name: 'PvP Combat',
        adjustments: {
          increase: ['speed', 'critRate'],
          decrease: ['hp', 'defense'],
          reasoning: 'PvP rewards first-strike capability and burst damage'
        }
      },
      survival_mode: {
        name: 'Survival Challenges',
        adjustments: {
          increase: ['defense', 'hp', 'magic'],
          decrease: ['attack'],
          reasoning: 'Survival modes prioritize staying alive over damage output'
        }
      },
      speed_runs: {
        name: 'Speed Runs',
        adjustments: {
          increase: ['attack', 'speed', 'critRate'],
          minimize: ['defense', 'hp'],
          reasoning: 'Speed runs require maximum clear speed and damage'
        }
      }
    };

    // Progression stages
    this.progressionStages = {
      early_game: { level: [1, 25], focus: 'Basic stat building and core abilities' },
      mid_game: { level: [26, 50], focus: 'Specialization and synergy development' },
      late_game: { level: [51, 75], focus: 'Advanced optimization and perfect gear' },
      end_game: { level: [76, 99], focus: 'Min-maxing and situational variants' }
    };

    // Bind methods
    this.handleCharacterSelect = this.handleCharacterSelect.bind(this);
    this.handleBuildTypeChange = this.handleBuildTypeChange.bind(this);
    this.handleProgressionChange = this.handleProgressionChange.bind(this);
    this.handleSituationChange = this.handleSituationChange.bind(this);
  }

  /**
   * Initialize the Build Guides system
   */
  async init() {
    try {
      this.setupEventListeners();
      this.renderGuidesInterface();
    } catch (error) {
      console.error('Failed to initialize Build Guides:', error);
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    const container = document.getElementById('build-guides');
    if (!container) return;

    container.addEventListener('change', (e) => {
      if (e.target.matches('#guide-character-select')) {
        this.handleCharacterSelect(e.target.value);
      } else if (e.target.matches('#build-type-select')) {
        this.handleBuildTypeChange(e.target.value);
      } else if (e.target.matches('#progression-select')) {
        this.handleProgressionChange(e.target.value);
      } else if (e.target.matches('#situation-select')) {
        this.handleSituationChange(e.target.value);
      }
    });

    container.addEventListener('click', (e) => {
      if (e.target.matches('.apply-build-btn')) {
        this.applyRecommendedBuild(e.target.dataset.buildData);
      } else if (e.target.matches('.export-guide-btn')) {
        this.exportBuildGuide();
      } else if (e.target.matches('.progression-step')) {
        this.showProgressionDetail(e.target.dataset.stage);
      } else if (e.target.matches('.variant-tab')) {
        this.switchVariant(e.target.dataset.variant);
      }
    });
  }

  /**
   * Handle character selection
   */
  handleCharacterSelect(characterId) {
    if (!characterId) {
      this.currentCharacter = null;
      this.renderEmptyState();
      return;
    }

    this.currentCharacter = this.dataManager.getCharacter(characterId);
    if (this.currentCharacter) {
      this.generateBuildGuides();
      this.renderBuildGuides();
    }
  }

  /**
   * Handle build type change
   */
  handleBuildTypeChange(buildType) {
    this.selectedBuildType = buildType;
    if (this.currentCharacter) {
      this.generateBuildGuides();
      this.renderBuildGuides();
    }
  }

  /**
   * Handle progression change
   */
  handleProgressionChange(progression) {
    this.selectedProgression = progression;
    if (this.currentCharacter) {
      this.updateProgressionView();
    }
  }

  /**
   * Handle situation change
   */
  handleSituationChange(situation) {
    this.selectedSituation = situation;
    if (this.currentCharacter) {
      this.updateSituationalBuild();
    }
  }

  /**
   * Render the guides interface
   */
  renderGuidesInterface() {
    const container = document.getElementById('build-guides');
    if (!container) return;

    container.innerHTML = `
      <div class="guides-container">
        <div class="guides-header">
          <h3>Comprehensive Build Guides</h3>
          <p>AI-powered build recommendations with detailed progression paths and situational variants</p>
        </div>

        <div class="guides-controls">
          <div class="control-row">
            <div class="control-group">
              <label for="guide-character-select">Character:</label>
              <select id="guide-character-select" class="guide-select">
                <option value="">Select a character...</option>
                ${this.renderCharacterOptions()}
              </select>
            </div>

            <div class="control-group">
              <label for="build-type-select">Build Focus:</label>
              <select id="build-type-select" class="guide-select">
                <option value="optimal">Optimal Build</option>
                <option value="beginner">Beginner Friendly</option>
                <option value="advanced">Advanced/Expert</option>
                <option value="all_archetypes">All Archetypes</option>
              </select>
            </div>

            <div class="control-group">
              <label for="progression-select">Progression View:</label>
              <select id="progression-select" class="guide-select">
                <option value="balanced">Balanced Progress</option>
                <option value="early_game">Early Game (1-25)</option>
                <option value="mid_game">Mid Game (26-50)</option>
                <option value="late_game">Late Game (51-75)</option>
                <option value="end_game">End Game (76-99)</option>
              </select>
            </div>

            <div class="control-group">
              <label for="situation-select">Situation:</label>
              <select id="situation-select" class="guide-select">
                <option value="general">General Use</option>
                <option value="boss_fights">Boss Fights</option>
                <option value="exploration">Exploration</option>
                <option value="pvp_combat">PvP Combat</option>
                <option value="survival_mode">Survival Mode</option>
                <option value="speed_runs">Speed Runs</option>
              </select>
            </div>
          </div>
        </div>

        <div id="guides-content" class="guides-content">
          ${this.renderEmptyState()}
        </div>
      </div>
    `;
  }

  /**
   * Render character options
   */
  renderCharacterOptions() {
    const characters = this.dataManager.getAllCharacters();
    if (!characters) return '';

    return Object.values(characters).map(character => `
      <option value="${character.id}">${character.name}</option>
    `).join('');
  }

  /**
   * Render empty state
   */
  renderEmptyState() {
    return `
      <div class="guides-empty">
        <div class="empty-icon">📖</div>
        <h4>Select a Character</h4>
        <p>Choose a character to see comprehensive build guides, progression paths, and situational recommendations.</p>
      </div>
    `;
  }

  /**
   * Generate build guides for current character
   */
  generateBuildGuides() {
    if (!this.currentCharacter) return;

    this.buildGuides = {
      character: this.currentCharacter,
      archetypes: this.generateArchetypeBuilds(),
      progression: this.generateProgressionPath(),
      situational: this.generateSituationalBuilds(),
      optimization: this.generateOptimizationTips(),
      synergies: this.generateSynergyRecommendations(),
      gearRecommendations: this.generateGearRecommendations()
    };
  }

  /**
   * Generate archetype builds for character
   */
  generateArchetypeBuilds() {
    const archetypes = {};
    const character = this.currentCharacter;
    const baseStats = character.baseStats;

    Object.entries(this.buildArchetypes).forEach(([key, archetype]) => {
      const build = this.generateArchetypeBuild(character, archetype);
      archetypes[key] = {
        ...archetype,
        build: build,
        effectiveness: this.calculateArchetypeEffectiveness(character, archetype),
        recommendedLevel: this.getRecommendedLevelForArchetype(character, archetype)
      };
    });

    return archetypes;
  }

  /**
   * Generate specific archetype build
   */
  generateArchetypeBuild(character, archetype) {
    const totalPoints = 100; // Example attribute points to distribute
    const build = {
      attributes: {
        attack: 0,
        defense: 0,
        magic: 0,
        speed: 0,
        hp: 0,
        critRate: 0,
        critDamage: 0,
        wisdom: 0
      },
      level: 50, // Target level for build
      weapon: null,
      pictos: []
    };

    // Distribute points based on archetype focus
    const focusStats = archetype.focus || [];
    const secondaryStats = archetype.secondary || [];
    const maintainStats = archetype.maintain || [];

    let remainingPoints = totalPoints;

    // Allocate 60% to focus stats
    const focusAllocation = Math.floor(remainingPoints * 0.6);
    const pointsPerFocus = Math.floor(focusAllocation / focusStats.length);
    focusStats.forEach(stat => {
      if (build.attributes.hasOwnProperty(stat)) {
        build.attributes[stat] = pointsPerFocus;
        remainingPoints -= pointsPerFocus;
      }
    });

    // Allocate 25% to secondary stats
    if (secondaryStats.length > 0) {
      const secondaryAllocation = Math.floor(remainingPoints * 0.4);
      const pointsPerSecondary = Math.floor(secondaryAllocation / secondaryStats.length);
      secondaryStats.forEach(stat => {
        if (build.attributes.hasOwnProperty(stat)) {
          build.attributes[stat] = pointsPerSecondary;
          remainingPoints -= pointsPerSecondary;
        }
      });
    }

    // Distribute remaining points to maintain stats
    if (maintainStats.length > 0 && remainingPoints > 0) {
      const pointsPerMaintain = Math.floor(remainingPoints / maintainStats.length);
      maintainStats.forEach(stat => {
        if (build.attributes.hasOwnProperty(stat)) {
          build.attributes[stat] += pointsPerMaintain;
        }
      });
    }

    // Recommend weapon and pictos
    build.weapon = this.recommendWeaponForArchetype(character, archetype);
    build.pictos = this.recommendPictosForArchetype(character, archetype);

    return build;
  }

  /**
   * Calculate archetype effectiveness for character
   */
  calculateArchetypeEffectiveness(character, archetype) {
    let effectiveness = 50; // Base effectiveness

    // Check character's natural affinity for archetype
    const baseStats = character.baseStats;
    const focusStats = archetype.focus || [];

    // Bonus for stats that character naturally excels in
    focusStats.forEach(stat => {
      const statValue = baseStats[stat] || 0;
      if (statValue > 30) effectiveness += 15;
      else if (statValue > 20) effectiveness += 10;
      else if (statValue > 15) effectiveness += 5;
    });

    // Character-specific bonuses
    if (character.element) {
      if (archetype.name.includes('Elemental') && character.element !== 'physical') {
        effectiveness += 20;
      }
    }

    // Role-based effectiveness
    const characterRole = this.getCharacterNaturalRole(character);
    if (
      (characterRole === 'attacker' && archetype.name.includes('DPS')) ||
      (characterRole === 'tank' && archetype.name.includes('Tank')) ||
      (characterRole === 'support' && archetype.name.includes('Support'))
    ) {
      effectiveness += 15;
    }

    return Math.min(effectiveness, 100);
  }

  /**
   * Generate progression path
   */
  generateProgressionPath() {
    const character = this.currentCharacter;
    const progression = {};

    Object.entries(this.progressionStages).forEach(([stage, data]) => {
      progression[stage] = {
        ...data,
        priorities: this.getProgressionPriorities(character, stage),
        milestones: this.getProgressionMilestones(character, stage),
        tips: this.getProgressionTips(character, stage),
        recommendedGear: this.getStageGearRecommendations(character, stage)
      };
    });

    return progression;
  }

  /**
   * Get progression priorities for stage
   */
  getProgressionPriorities(character, stage) {
    const basePriorities = {
      early_game: ['Level up core abilities', 'Focus on main damage stat', 'Acquire basic gear'],
      mid_game: ['Develop secondary stats', 'Unlock advanced abilities', 'Optimize gear synergies'],
      late_game: ['Perfect stat distribution', 'Master ability rotations', 'Acquire legendary gear'],
      end_game: ['Min-max optimization', 'Situational builds', 'Perfect synergy setups']
    };

    const characterSpecific = this.getCharacterSpecificPriorities(character, stage);
    return [...basePriorities[stage], ...characterSpecific];
  }

  /**
   * Get character-specific priorities
   */
  getCharacterSpecificPriorities(character, stage) {
    const priorities = [];

    // Element-based priorities
    if (character.element && character.element !== 'physical') {
      priorities.push(`Master ${character.element} elemental abilities`);
    }

    // Character-specific abilities
    if (character.uniqueAbilities) {
      priorities.push(`Maximize ${character.name}'s unique abilities`);
    }

    return priorities;
  }

  /**
   * Generate situational builds
   */
  generateSituationalBuilds() {
    const situational = {};

    Object.entries(this.situationalAdjustments).forEach(([key, situation]) => {
      const baseBuild = this.generateOptimalBuild();
      const adjustedBuild = this.applySituationalAdjustments(baseBuild, situation);

      situational[key] = {
        ...situation,
        build: adjustedBuild,
        differences: this.calculateBuildDifferences(baseBuild, adjustedBuild),
        effectiveness: this.calculateSituationalEffectiveness(adjustedBuild, key)
      };
    });

    return situational;
  }

  /**
   * Generate optimal build for character
   */
  generateOptimalBuild() {
    const character = this.currentCharacter;
    const optimalArchetype = this.findOptimalArchetype(character);
    return this.generateArchetypeBuild(character, optimalArchetype);
  }

  /**
   * Find optimal archetype for character
   */
  findOptimalArchetype(character) {
    let bestArchetype = null;
    let bestEffectiveness = 0;

    Object.entries(this.buildArchetypes).forEach(([key, archetype]) => {
      const effectiveness = this.calculateArchetypeEffectiveness(character, archetype);
      if (effectiveness > bestEffectiveness) {
        bestEffectiveness = effectiveness;
        bestArchetype = archetype;
      }
    });

    return bestArchetype || this.buildArchetypes.balanced_dps;
  }

  /**
   * Apply situational adjustments to build
   */
  applySituationalAdjustments(baseBuild, situation) {
    const adjustedBuild = JSON.parse(JSON.stringify(baseBuild)); // Deep clone
    const adjustments = situation.adjustments;

    // Increase specified stats
    if (adjustments.increase) {
      adjustments.increase.forEach(stat => {
        if (adjustedBuild.attributes[stat] !== undefined) {
          adjustedBuild.attributes[stat] = Math.min(99, adjustedBuild.attributes[stat] + 10);
        }
      });
    }

    // Decrease specified stats
    if (adjustments.decrease) {
      adjustments.decrease.forEach(stat => {
        if (adjustedBuild.attributes[stat] !== undefined) {
          adjustedBuild.attributes[stat] = Math.max(0, adjustedBuild.attributes[stat] - 10);
        }
      });
    }

    return adjustedBuild;
  }

  /**
   * Render build guides
   */
  renderBuildGuides() {
    const container = document.getElementById('guides-content');
    if (!container || !this.buildGuides) return;

    container.innerHTML = `
      <div class="build-guides-content">
        ${this.renderCharacterOverview()}
        ${this.renderBuildArchetypes()}
        ${this.renderProgressionPath()}
        ${this.renderSituationalBuilds()}
        ${this.renderOptimizationTips()}
        ${this.renderSynergyRecommendations()}
      </div>
    `;
  }

  /**
   * Render character overview
   */
  renderCharacterOverview() {
    const character = this.currentCharacter;
    const naturalRole = this.getCharacterNaturalRole(character);
    const recommendedArchetype = this.findOptimalArchetype(character);

    return `
      <div class="character-overview">
        <div class="overview-header">
          <div class="character-info">
            <h4>${character.name}</h4>
            <div class="character-meta">
              <span class="character-element ${character.element}">${character.element || 'Neutral'}</span>
              <span class="character-role">${naturalRole}</span>
            </div>
          </div>
          <div class="overview-actions">
            <button class="export-guide-btn btn-secondary">Export Guide</button>
          </div>
        </div>

        <div class="overview-content">
          <div class="overview-section">
            <h5>Character Analysis</h5>
            <div class="analysis-grid">
              <div class="analysis-item">
                <span class="analysis-label">Natural Role:</span>
                <span class="analysis-value">${naturalRole}</span>
              </div>
              <div class="analysis-item">
                <span class="analysis-label">Recommended Archetype:</span>
                <span class="analysis-value">${recommendedArchetype.name}</span>
              </div>
              <div class="analysis-item">
                <span class="analysis-label">Difficulty Level:</span>
                <span class="analysis-value">${recommendedArchetype.difficulty}</span>
              </div>
            </div>
          </div>

          <div class="overview-section">
            <h5>Stat Affinities</h5>
            <div class="stat-affinities">
              ${this.renderStatAffinities(character)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render stat affinities
   */
  renderStatAffinities(character) {
    const baseStats = character.baseStats;
    const statNames = {
      attack: 'Attack',
      defense: 'Defense',
      magic: 'Magic',
      speed: 'Speed',
      hp: 'HP'
    };

    return Object.entries(statNames).map(([stat, name]) => {
      const value = baseStats[stat] || 0;
      const percentage = Math.min(100, (value / 50) * 100);
      const affinityClass = percentage > 70 ? 'high' : percentage > 40 ? 'medium' : 'low';

      return `
        <div class="affinity-item">
          <div class="affinity-header">
            <span class="affinity-name">${name}</span>
            <span class="affinity-value">${value}</span>
          </div>
          <div class="affinity-bar">
            <div class="affinity-fill ${affinityClass}" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render build archetypes
   */
  renderBuildArchetypes() {
    const archetypes = this.buildGuides.archetypes;
    const showAll = this.selectedBuildType === 'all_archetypes';
    const targetDifficulty = this.selectedBuildType === 'beginner' ? ['Beginner', 'Intermediate'] :
                           this.selectedBuildType === 'advanced' ? ['Advanced', 'Expert'] :
                           null;

    let filteredArchetypes = Object.entries(archetypes);

    if (!showAll) {
      if (targetDifficulty) {
        filteredArchetypes = filteredArchetypes.filter(([key, archetype]) =>
          targetDifficulty.includes(archetype.difficulty)
        );
      } else {
        // Show only top 3 most effective
        filteredArchetypes = filteredArchetypes
          .sort(([, a], [, b]) => b.effectiveness - a.effectiveness)
          .slice(0, 3);
      }
    }

    return `
      <div class="build-archetypes">
        <div class="section-header">
          <h4>Build Archetypes</h4>
          <p>Different build styles optimized for various playstyles</p>
        </div>

        <div class="archetypes-grid">
          ${filteredArchetypes.map(([key, archetype]) => this.renderArchetypeCard(key, archetype)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render archetype card
   */
  renderArchetypeCard(key, archetype) {
    const effectivenessClass = archetype.effectiveness >= 80 ? 'excellent' :
                              archetype.effectiveness >= 65 ? 'good' :
                              archetype.effectiveness >= 50 ? 'average' : 'poor';

    return `
      <div class="archetype-card ${effectivenessClass}">
        <div class="archetype-header">
          <div class="archetype-title">
            <span class="archetype-icon">${archetype.icon}</span>
            <span class="archetype-name">${archetype.name}</span>
          </div>
          <div class="archetype-effectiveness">
            <span class="effectiveness-value">${Math.round(archetype.effectiveness)}%</span>
            <span class="effectiveness-label">Match</span>
          </div>
        </div>

        <div class="archetype-content">
          <p class="archetype-description">${archetype.description}</p>

          <div class="archetype-details">
            <div class="detail-section">
              <h6>Focus Stats</h6>
              <div class="stat-tags">
                ${(archetype.focus || []).map(stat => `
                  <span class="stat-tag focus">${this.formatStatName(stat)}</span>
                `).join('')}
              </div>
            </div>

            ${archetype.secondary ? `
              <div class="detail-section">
                <h6>Secondary Stats</h6>
                <div class="stat-tags">
                  ${archetype.secondary.map(stat => `
                    <span class="stat-tag secondary">${this.formatStatName(stat)}</span>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <div class="detail-section">
              <h6>Recommended Level</h6>
              <span class="recommended-level">${archetype.recommendedLevel}+</span>
            </div>

            <div class="detail-section">
              <h6>Difficulty</h6>
              <span class="difficulty-badge ${archetype.difficulty.toLowerCase()}">${archetype.difficulty}</span>
            </div>
          </div>

          <div class="archetype-build-preview">
            <h6>Stat Distribution</h6>
            ${this.renderBuildStatDistribution(archetype.build)}
          </div>
        </div>

        <div class="archetype-actions">
          <button class="apply-build-btn btn-primary" data-build-data="${encodeURIComponent(JSON.stringify(archetype.build))}">
            Apply Build
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render build stat distribution
   */
  renderBuildStatDistribution(build) {
    const attributes = build.attributes;
    const maxValue = Math.max(...Object.values(attributes));

    return `
      <div class="stat-distribution">
        ${Object.entries(attributes).map(([stat, value]) => {
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          return `
            <div class="stat-bar">
              <div class="stat-bar-header">
                <span class="stat-name">${this.formatStatName(stat)}</span>
                <span class="stat-value">${value}</span>
              </div>
              <div class="stat-bar-fill">
                <div class="stat-fill" style="width: ${percentage}%"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Render progression path
   */
  renderProgressionPath() {
    const progression = this.buildGuides.progression;
    const selectedStage = this.selectedProgression;

    if (selectedStage !== 'balanced') {
      return this.renderSingleProgressionStage(selectedStage, progression[selectedStage]);
    }

    return `
      <div class="progression-path">
        <div class="section-header">
          <h4>Progression Path</h4>
          <p>Level-by-level build development guide</p>
        </div>

        <div class="progression-timeline">
          ${Object.entries(progression).map(([stage, data]) => this.renderProgressionStage(stage, data)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render progression stage
   */
  renderProgressionStage(stage, data) {
    const stageNames = {
      early_game: 'Early Game',
      mid_game: 'Mid Game',
      late_game: 'Late Game',
      end_game: 'End Game'
    };

    return `
      <div class="progression-stage" data-stage="${stage}">
        <div class="stage-header">
          <h5>${stageNames[stage]}</h5>
          <span class="stage-levels">Levels ${data.level[0]}-${data.level[1]}</span>
        </div>

        <div class="stage-content">
          <p class="stage-focus">${data.focus}</p>

          <div class="stage-priorities">
            <h6>Priorities</h6>
            <ul>
              ${data.priorities.slice(0, 3).map(priority => `<li>${priority}</li>`).join('')}
            </ul>
          </div>

          ${data.tips && data.tips.length > 0 ? `
            <div class="stage-tips">
              <h6>Tips</h6>
              <ul>
                ${data.tips.slice(0, 2).map(tip => `<li>${tip}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>

        <button class="progression-step btn-secondary" data-stage="${stage}">
          View Details
        </button>
      </div>
    `;
  }

  /**
   * Render situational builds
   */
  renderSituationalBuilds() {
    const situational = this.buildGuides.situational;
    const selectedSituation = this.selectedSituation;

    if (selectedSituation !== 'general') {
      const situation = situational[selectedSituation];
      if (situation) {
        return this.renderDetailedSituationalBuild(selectedSituation, situation);
      }
    }

    return `
      <div class="situational-builds">
        <div class="section-header">
          <h4>Situational Builds</h4>
          <p>Specialized builds for different game scenarios</p>
        </div>

        <div class="situations-grid">
          ${Object.entries(situational).map(([key, situation]) => this.renderSituationalCard(key, situation)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render situational card
   */
  renderSituationalCard(key, situation) {
    const icons = {
      boss_fights: '🐉',
      exploration: '🗺️',
      pvp_combat: '⚔️',
      survival_mode: '🛡️',
      speed_runs: '💨'
    };

    return `
      <div class="situation-card">
        <div class="situation-header">
          <span class="situation-icon">${icons[key] || '⚡'}</span>
          <h5>${situation.name}</h5>
        </div>

        <div class="situation-content">
          <div class="situation-adjustments">
            <h6>Key Changes</h6>
            ${situation.adjustments.increase ? `
              <div class="adjustment-item">
                <span class="adjustment-label increase">↑ Increase:</span>
                <span class="adjustment-values">${situation.adjustments.increase.map(stat => this.formatStatName(stat)).join(', ')}</span>
              </div>
            ` : ''}

            ${situation.adjustments.decrease ? `
              <div class="adjustment-item">
                <span class="adjustment-label decrease">↓ Decrease:</span>
                <span class="adjustment-values">${situation.adjustments.decrease.map(stat => this.formatStatName(stat)).join(', ')}</span>
              </div>
            ` : ''}
          </div>

          <div class="situation-reasoning">
            <p>${situation.reasoning}</p>
          </div>

          <div class="situation-effectiveness">
            <span class="effectiveness-value">${Math.round(situation.effectiveness)}%</span>
            <span class="effectiveness-label">Effective</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render optimization tips
   */
  renderOptimizationTips() {
    const tips = this.buildGuides.optimization || this.generateOptimizationTips();

    return `
      <div class="optimization-tips">
        <div class="section-header">
          <h4>Optimization Tips</h4>
          <p>Advanced strategies to maximize your build's potential</p>
        </div>

        <div class="tips-grid">
          ${tips.map(tip => this.renderOptimizationTip(tip)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Generate optimization tips
   */
  generateOptimizationTips() {
    const character = this.currentCharacter;
    const tips = [];

    // General optimization tips
    tips.push({
      category: 'Stat Scaling',
      title: 'Diminishing Returns Awareness',
      description: 'Stats over 80 provide diminishing returns. Balance your investment across multiple stats.',
      priority: 'high',
      icon: '📊'
    });

    tips.push({
      category: 'Synergy',
      title: 'Weapon-Stat Alignment',
      description: 'Ensure your weapon choice complements your stat distribution for maximum effectiveness.',
      priority: 'high',
      icon: '⚔️'
    });

    // Character-specific tips
    if (character.element && character.element !== 'physical') {
      tips.push({
        category: 'Elemental',
        title: `${character.element} Specialization`,
        description: `Maximize ${character.element} damage through elemental stat bonuses and matching Pictos.`,
        priority: 'medium',
        icon: '🔥'
      });
    }

    tips.push({
      category: 'Progression',
      title: 'Level Timing',
      description: 'Focus on core stats early, then branch into specialized stats at higher levels.',
      priority: 'medium',
      icon: '📈'
    });

    tips.push({
      category: 'Equipment',
      title: 'Picto Synergy',
      description: 'Choose Pictos that enhance your build archetype rather than just highest rarity.',
      priority: 'medium',
      icon: '🎴'
    });

    return tips;
  }

  /**
   * Render optimization tip
   */
  renderOptimizationTip(tip) {
    return `
      <div class="optimization-tip ${tip.priority}">
        <div class="tip-header">
          <span class="tip-icon">${tip.icon}</span>
          <div class="tip-title">
            <h6>${tip.title}</h6>
            <span class="tip-category">${tip.category}</span>
          </div>
          <span class="tip-priority ${tip.priority}">${tip.priority}</span>
        </div>
        <div class="tip-content">
          <p>${tip.description}</p>
        </div>
      </div>
    `;
  }

  /**
   * Render synergy recommendations
   */
  renderSynergyRecommendations() {
    const synergies = this.buildGuides.synergies || this.generateSynergyRecommendations();

    return `
      <div class="synergy-recommendations">
        <div class="section-header">
          <h4>Team Synergy Recommendations</h4>
          <p>Characters and strategies that work well with this build</p>
        </div>

        <div class="synergy-content">
          ${synergies.teammates ? `
            <div class="synergy-section">
              <h5>Recommended Teammates</h5>
              <div class="teammates-grid">
                ${synergies.teammates.map(teammate => this.renderTeammateRecommendation(teammate)).join('')}
              </div>
            </div>
          ` : ''}

          ${synergies.strategies ? `
            <div class="synergy-section">
              <h5>Synergy Strategies</h5>
              <div class="strategies-list">
                ${synergies.strategies.map(strategy => this.renderSynergyStrategy(strategy)).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Generate synergy recommendations
   */
  generateSynergyRecommendations() {
    const character = this.currentCharacter;
    const allCharacters = this.dataManager.getAllCharacters();

    const recommendations = {
      teammates: [],
      strategies: []
    };

    // Find complementary characters
    if (allCharacters) {
      Object.values(allCharacters).forEach(otherChar => {
        if (otherChar.id !== character.id) {
          const synergy = this.calculateCharacterSynergy(character, otherChar);
          if (synergy.score > 70) {
            recommendations.teammates.push({
              character: otherChar,
              synergy: synergy,
              reasoning: synergy.reasoning
            });
          }
        }
      });
    }

    // Sort by synergy score and take top 3
    recommendations.teammates = recommendations.teammates
      .sort((a, b) => b.synergy.score - a.synergy.score)
      .slice(0, 3);

    // Generate strategy recommendations
    recommendations.strategies = [
      {
        name: 'Elemental Chain',
        description: `Combine ${character.name}'s abilities with complementary elements for bonus damage`,
        effectiveness: 85
      },
      {
        name: 'Role Support',
        description: `Use support characters to enhance ${character.name}'s strengths`,
        effectiveness: 75
      }
    ];

    return recommendations;
  }

  /**
   * Calculate character synergy
   */
  calculateCharacterSynergy(charA, charB) {
    let score = 50; // Base synergy
    let reasoning = [];

    // Elemental synergy
    if (charA.element && charB.element && charA.element !== charB.element) {
      const elementalSynergies = {
        fire: ['lightning', 'earth'],
        water: ['ice', 'earth'],
        ice: ['water', 'void'],
        lightning: ['fire', 'light'],
        earth: ['fire', 'water'],
        light: ['lightning', 'void'],
        dark: ['void', 'ice'],
        void: ['dark', 'light']
      };

      if (elementalSynergies[charA.element]?.includes(charB.element)) {
        score += 20;
        reasoning.push(`${charA.element} and ${charB.element} elements synergize well`);
      }
    }

    // Role complementarity
    const roleA = this.getCharacterNaturalRole(charA);
    const roleB = this.getCharacterNaturalRole(charB);

    if (
      (roleA === 'attacker' && roleB === 'support') ||
      (roleA === 'support' && roleB === 'attacker') ||
      (roleA === 'tank' && (roleB === 'attacker' || roleB === 'support'))
    ) {
      score += 15;
      reasoning.push(`${roleA} and ${roleB} roles complement each other`);
    }

    return { score, reasoning: reasoning.join('; ') };
  }

  /**
   * Render teammate recommendation
   */
  renderTeammateRecommendation(teammate) {
    return `
      <div class="teammate-card">
        <div class="teammate-info">
          <span class="teammate-name">${teammate.character.name}</span>
          <span class="teammate-element ${teammate.character.element}">${teammate.character.element || 'Neutral'}</span>
        </div>
        <div class="synergy-score">
          <span class="score-value">${Math.round(teammate.synergy.score)}</span>
          <span class="score-label">Synergy</span>
        </div>
        <div class="synergy-reasoning">
          <p>${teammate.reasoning}</p>
        </div>
      </div>
    `;
  }

  /**
   * Render synergy strategy
   */
  renderSynergyStrategy(strategy) {
    const effectivenessClass = strategy.effectiveness >= 80 ? 'excellent' :
                              strategy.effectiveness >= 65 ? 'good' : 'average';

    return `
      <div class="strategy-item ${effectivenessClass}">
        <div class="strategy-header">
          <h6>${strategy.name}</h6>
          <span class="strategy-effectiveness">${strategy.effectiveness}% effective</span>
        </div>
        <div class="strategy-description">
          <p>${strategy.description}</p>
        </div>
      </div>
    `;
  }

  /**
   * Utility methods
   */
  getCharacterNaturalRole(character) {
    const baseStats = character.baseStats;
    const attack = baseStats.attack || 0;
    const defense = baseStats.defense || 0;
    const magic = baseStats.magic || 0;

    if (defense > attack && defense > magic) return 'tank';
    if (magic > attack && magic > defense) return 'support';
    if (attack > defense && attack > magic) return 'attacker';
    return 'hybrid';
  }

  formatStatName(stat) {
    const statNames = {
      attack: 'Attack',
      defense: 'Defense',
      magic: 'Magic',
      speed: 'Speed',
      hp: 'HP',
      critRate: 'Crit Rate',
      critDamage: 'Crit Damage',
      wisdom: 'Wisdom'
    };
    return statNames[stat] || stat;
  }

  getRecommendedLevelForArchetype(character, archetype) {
    if (archetype.difficulty === 'Beginner') return 1;
    if (archetype.difficulty === 'Intermediate') return 20;
    if (archetype.difficulty === 'Advanced') return 40;
    if (archetype.difficulty === 'Expert') return 60;
    return 1;
  }

  recommendWeaponForArchetype(character, archetype) {
    // This would integrate with weapon data to recommend optimal weapons
    return { name: 'Recommended based on archetype', type: 'placeholder' };
  }

  recommendPictosForArchetype(character, archetype) {
    // This would integrate with Pictos data to recommend optimal Pictos
    return [
      { name: 'Archetype-optimized Picto 1', rarity: 'legendary' },
      { name: 'Archetype-optimized Picto 2', rarity: 'epic' }
    ];
  }

  getProgressionMilestones(character, stage) {
    return [
      `Reach level ${this.progressionStages[stage].level[0]}`,
      'Unlock key abilities',
      'Acquire appropriate gear'
    ];
  }

  getProgressionTips(character, stage) {
    const tips = {
      early_game: ['Focus on leveling', 'Don\'t worry about perfect stats yet'],
      mid_game: ['Start specializing', 'Invest in better equipment'],
      late_game: ['Fine-tune your build', 'Plan for end-game content'],
      end_game: ['Perfect your optimization', 'Experiment with variants']
    };
    return tips[stage] || [];
  }

  getStageGearRecommendations(character, stage) {
    return {
      weapon: 'Stage-appropriate weapon',
      armor: 'Balanced gear set',
      accessories: 'Stat-boosting accessories'
    };
  }

  calculateBuildDifferences(baseBuild, adjustedBuild) {
    const differences = {};
    Object.keys(baseBuild.attributes).forEach(stat => {
      const diff = adjustedBuild.attributes[stat] - baseBuild.attributes[stat];
      if (diff !== 0) {
        differences[stat] = diff;
      }
    });
    return differences;
  }

  calculateSituationalEffectiveness(build, situation) {
    // Calculate how effective the build would be in the given situation
    return Math.random() * 40 + 60; // Placeholder: 60-100% effectiveness
  }

  /**
   * Apply recommended build
   */
  applyRecommendedBuild(buildDataString) {
    try {
      const buildData = JSON.parse(decodeURIComponent(buildDataString));

      // Save the build for the current character
      this.storage.saveCharacterBuild(this.currentCharacter.id, buildData);

      // Notify other systems about the build change
      window.dispatchEvent(new CustomEvent('buildApplied', {
        detail: {
          characterId: this.currentCharacter.id,
          build: buildData
        }
      }));

      this.showToast(`${buildData.name || 'Build'} applied to ${this.currentCharacter.name}!`, 'success');
    } catch (error) {
      console.error('Failed to apply build:', error);
      this.showToast('Failed to apply build', 'error');
    }
  }

  /**
   * Export build guide
   */
  exportBuildGuide() {
    if (!this.buildGuides) return;

    const guideData = {
      character: this.currentCharacter.name,
      timestamp: new Date().toISOString(),
      archetypes: this.buildGuides.archetypes,
      progression: this.buildGuides.progression,
      situational: this.buildGuides.situational,
      optimization: this.buildGuides.optimization
    };

    const dataStr = JSON.stringify(guideData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${this.currentCharacter.name}_build_guide.json`;
    link.click();

    this.showToast('Build guide exported successfully!', 'success');
  }

  showToast(message, type = 'info') {
    if (window.app && window.app.showToast) {
      window.app.showToast(message, type);
    }
  }

  /**
   * Public methods for integration
   */
  refresh() {
    this.renderGuidesInterface();
  }

  onActivate() {
    this.refresh();
  }

  hasUnsavedChanges() {
    return false; // No persistent state that needs saving
  }
}