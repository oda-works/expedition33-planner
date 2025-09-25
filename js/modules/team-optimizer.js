// Team Formation Optimizer module for Expedition 33 Planner
import { formatNumber } from '../utils/formatters.js';

/**
 * Team Optimizer class for AI-powered party formation recommendations
 */
export class TeamOptimizer {
  constructor(dataManager, storage) {
    this.dataManager = dataManager;
    this.storage = storage;
    this.optimizationCriteria = {
      boss_fight: 'Boss Fight',
      exploration: 'Exploration',
      balanced: 'Balanced',
      speed_run: 'Speed Run',
      survival: 'Survival',
      elemental: 'Elemental Focus'
    };
    this.currentRecommendations = [];
    this.selectedCriteria = 'balanced';
    this.constraints = {
      requiredCharacters: [],
      forbiddenCharacters: [],
      maxLevel: null,
      minLevel: null,
      elementalRequirements: []
    };

    // Bind methods
    this.handleOptimize = this.handleOptimize.bind(this);
    this.handleCriteriaChange = this.handleCriteriaChange.bind(this);
    this.handleConstraintChange = this.handleConstraintChange.bind(this);
  }

  /**
   * Initialize the Team Optimizer
   */
  async init() {
    try {
      this.setupEventListeners();
      this.renderOptimizerInterface();
    } catch (error) {
      console.error('Failed to initialize Team Optimizer:', error);
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    const container = document.getElementById('team-optimizer');
    if (!container) return;

    container.addEventListener('click', (e) => {
      if (e.target.matches('#optimize-team')) {
        this.handleOptimize();
      } else if (e.target.matches('.recommendation-select')) {
        this.selectRecommendation(e.target.dataset.recommendationId);
      } else if (e.target.matches('.constraint-remove')) {
        this.removeConstraint(e.target.dataset.constraintType, e.target.dataset.constraintValue);
      }
    });

    container.addEventListener('change', (e) => {
      if (e.target.matches('#optimization-criteria')) {
        this.handleCriteriaChange(e.target.value);
      } else if (e.target.matches('.constraint-select')) {
        this.handleConstraintChange(e.target);
      }
    });
  }

  /**
   * Handle optimization criteria change
   */
  handleCriteriaChange(newCriteria) {
    this.selectedCriteria = newCriteria;
    this.updateCriteriaDescription();
  }

  /**
   * Handle constraint changes
   */
  handleConstraintChange(element) {
    const constraintType = element.dataset.constraintType;
    const value = element.value;

    if (!value) return;

    switch (constraintType) {
      case 'required':
        if (!this.constraints.requiredCharacters.includes(value)) {
          this.constraints.requiredCharacters.push(value);
        }
        break;
      case 'forbidden':
        if (!this.constraints.forbiddenCharacters.includes(value)) {
          this.constraints.forbiddenCharacters.push(value);
        }
        break;
      case 'elemental':
        if (!this.constraints.elementalRequirements.includes(value)) {
          this.constraints.elementalRequirements.push(value);
        }
        break;
      case 'minLevel':
        this.constraints.minLevel = parseInt(value) || null;
        break;
      case 'maxLevel':
        this.constraints.maxLevel = parseInt(value) || null;
        break;
    }

    element.value = ''; // Reset select
    this.renderConstraints();
  }

  /**
   * Remove constraint
   */
  removeConstraint(type, value) {
    switch (type) {
      case 'required':
        this.constraints.requiredCharacters = this.constraints.requiredCharacters.filter(c => c !== value);
        break;
      case 'forbidden':
        this.constraints.forbiddenCharacters = this.constraints.forbiddenCharacters.filter(c => c !== value);
        break;
      case 'elemental':
        this.constraints.elementalRequirements = this.constraints.elementalRequirements.filter(e => e !== value);
        break;
      case 'minLevel':
      case 'maxLevel':
        this.constraints[type] = null;
        break;
    }
    this.renderConstraints();
  }

  /**
   * Render the optimizer interface
   */
  renderOptimizerInterface() {
    const container = document.getElementById('team-optimizer');
    if (!container) return;

    container.innerHTML = `
      <div class="optimizer-container">
        <div class="optimizer-header">
          <h3>Team Formation Optimizer</h3>
          <div class="optimizer-description">
            <p>AI-powered team composition recommendations based on your goals and constraints.</p>
          </div>
        </div>

        <div class="optimizer-controls">
          <div class="control-section">
            <h4>Optimization Goal</h4>
            <div class="criteria-selection">
              <select id="optimization-criteria" class="optimizer-select">
                ${Object.entries(this.optimizationCriteria).map(([key, name]) => `
                  <option value="${key}" ${key === this.selectedCriteria ? 'selected' : ''}>${name}</option>
                `).join('')}
              </select>
              <div id="criteria-description" class="criteria-description">
                <!-- Criteria description will be rendered here -->
              </div>
            </div>
          </div>

          <div class="control-section">
            <h4>Constraints</h4>
            <div class="constraints-setup">
              <div class="constraint-group">
                <label>Required Characters:</label>
                <select class="constraint-select" data-constraint-type="required">
                  <option value="">Select character...</option>
                  ${this.renderCharacterOptions()}
                </select>
              </div>

              <div class="constraint-group">
                <label>Forbidden Characters:</label>
                <select class="constraint-select" data-constraint-type="forbidden">
                  <option value="">Select character...</option>
                  ${this.renderCharacterOptions()}
                </select>
              </div>

              <div class="constraint-group">
                <label>Required Elements:</label>
                <select class="constraint-select" data-constraint-type="elemental">
                  <option value="">Select element...</option>
                  <option value="fire">Fire</option>
                  <option value="water">Water</option>
                  <option value="ice">Ice</option>
                  <option value="lightning">Lightning</option>
                  <option value="earth">Earth</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="void">Void</option>
                  <option value="physical">Physical</option>
                </select>
              </div>

              <div class="constraint-group">
                <label>Level Range:</label>
                <div class="level-range">
                  <input type="number" class="constraint-select" data-constraint-type="minLevel"
                         placeholder="Min Level" min="1" max="99">
                  <span>to</span>
                  <input type="number" class="constraint-select" data-constraint-type="maxLevel"
                         placeholder="Max Level" min="1" max="99">
                </div>
              </div>
            </div>

            <div id="active-constraints" class="active-constraints">
              <!-- Active constraints will be rendered here -->
            </div>
          </div>

          <div class="control-section">
            <button id="optimize-team" class="btn-primary optimize-btn">
              <span class="btn-icon">🎯</span>
              Generate Optimal Teams
            </button>
          </div>
        </div>

        <div id="optimization-results" class="optimization-results">
          <!-- Optimization results will be rendered here -->
        </div>
      </div>
    `;

    this.updateCriteriaDescription();
    this.renderConstraints();
  }

  /**
   * Render character options for selects
   */
  renderCharacterOptions() {
    const characters = this.dataManager.getAllCharacters();
    if (!characters) return '';

    return Object.values(characters).map(character => `
      <option value="${character.id}">${character.name}</option>
    `).join('');
  }

  /**
   * Update criteria description
   */
  updateCriteriaDescription() {
    const descriptionContainer = document.getElementById('criteria-description');
    if (!descriptionContainer) return;

    const descriptions = {
      boss_fight: 'Optimizes for high damage output, survivability, and boss-specific mechanics. Prioritizes characters with strong single-target abilities.',
      exploration: 'Balances movement speed, utility abilities, and resource efficiency for long expeditions. Includes characters with traversal and support skills.',
      balanced: 'Creates well-rounded teams with good coverage across all aspects of gameplay. Ensures elemental diversity and role distribution.',
      speed_run: 'Maximizes clear speed and efficiency. Prioritizes high-damage characters and minimal setup time.',
      survival: 'Focuses on defensive capabilities, healing, and sustain. Perfect for challenging content where staying alive is paramount.',
      elemental: 'Optimizes elemental coverage and synergies. Ensures access to multiple elements for tactical advantage.'
    };

    descriptionContainer.innerHTML = `
      <div class="description-text">
        <span class="description-icon">💡</span>
        ${descriptions[this.selectedCriteria] || 'Select a criteria to see description.'}
      </div>
    `;
  }

  /**
   * Render active constraints
   */
  renderConstraints() {
    const container = document.getElementById('active-constraints');
    if (!container) return;

    const constraints = [];

    // Required characters
    this.constraints.requiredCharacters.forEach(charId => {
      const character = this.dataManager.getCharacter(charId);
      constraints.push({
        type: 'required',
        value: charId,
        display: `Required: ${character?.name || charId}`,
        class: 'constraint-required'
      });
    });

    // Forbidden characters
    this.constraints.forbiddenCharacters.forEach(charId => {
      const character = this.dataManager.getCharacter(charId);
      constraints.push({
        type: 'forbidden',
        value: charId,
        display: `Forbidden: ${character?.name || charId}`,
        class: 'constraint-forbidden'
      });
    });

    // Elemental requirements
    this.constraints.elementalRequirements.forEach(element => {
      constraints.push({
        type: 'elemental',
        value: element,
        display: `Requires: ${element} element`,
        class: 'constraint-elemental'
      });
    });

    // Level constraints
    if (this.constraints.minLevel) {
      constraints.push({
        type: 'minLevel',
        value: this.constraints.minLevel,
        display: `Min Level: ${this.constraints.minLevel}`,
        class: 'constraint-level'
      });
    }

    if (this.constraints.maxLevel) {
      constraints.push({
        type: 'maxLevel',
        value: this.constraints.maxLevel,
        display: `Max Level: ${this.constraints.maxLevel}`,
        class: 'constraint-level'
      });
    }

    if (constraints.length === 0) {
      container.innerHTML = `
        <div class="no-constraints">
          <span class="no-constraints-text">No constraints set</span>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="constraints-list">
          ${constraints.map(constraint => `
            <div class="constraint-tag ${constraint.class}">
              <span class="constraint-text">${constraint.display}</span>
              <button class="constraint-remove"
                      data-constraint-type="${constraint.type}"
                      data-constraint-value="${constraint.value}"
                      title="Remove constraint">×</button>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  /**
   * Handle team optimization
   */
  async handleOptimize() {
    const optimizeButton = document.getElementById('optimize-team');
    if (!optimizeButton) return;

    // Show loading state
    optimizeButton.disabled = true;
    optimizeButton.innerHTML = `
      <span class="spinner"></span>
      Optimizing Teams...
    `;

    try {
      this.currentRecommendations = await this.generateOptimizedTeams();
      this.renderOptimizationResults();
    } catch (error) {
      console.error('Optimization failed:', error);
      this.showError('Failed to optimize teams. Please try again.');
    } finally {
      // Restore button
      optimizeButton.disabled = false;
      optimizeButton.innerHTML = `
        <span class="btn-icon">🎯</span>
        Generate Optimal Teams
      `;
    }
  }

  /**
   * Generate optimized team recommendations
   */
  async generateOptimizedTeams() {
    const characters = this.dataManager.getAllCharacters();
    if (!characters) return [];

    const availableCharacters = this.getAvailableCharacters(characters);
    const recommendations = [];

    // Generate multiple team compositions using different algorithms
    const algorithms = [
      'greedy_optimization',
      'genetic_algorithm',
      'weighted_scoring',
      'role_balanced'
    ];

    for (const algorithm of algorithms) {
      const team = await this.generateTeamWithAlgorithm(availableCharacters, algorithm);
      if (team && this.isValidTeam(team)) {
        const analysis = this.analyzeTeamComposition(team);
        recommendations.push({
          id: `${algorithm}_${Date.now()}`,
          algorithm: algorithm,
          team: team,
          analysis: analysis,
          score: analysis.overallScore
        });
      }
    }

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }

  /**
   * Get available characters based on constraints
   */
  getAvailableCharacters(allCharacters) {
    let available = Object.values(allCharacters);

    // Apply forbidden characters constraint
    if (this.constraints.forbiddenCharacters.length > 0) {
      available = available.filter(char =>
        !this.constraints.forbiddenCharacters.includes(char.id)
      );
    }

    // Apply level constraints
    available = available.filter(char => {
      const build = this.storage.loadCharacterBuild(char.id);
      const level = build?.level || 1;

      if (this.constraints.minLevel && level < this.constraints.minLevel) return false;
      if (this.constraints.maxLevel && level > this.constraints.maxLevel) return false;

      return true;
    });

    return available;
  }

  /**
   * Generate team using specific algorithm
   */
  async generateTeamWithAlgorithm(availableCharacters, algorithm) {
    switch (algorithm) {
      case 'greedy_optimization':
        return this.greedyOptimization(availableCharacters);
      case 'genetic_algorithm':
        return this.geneticAlgorithm(availableCharacters);
      case 'weighted_scoring':
        return this.weightedScoring(availableCharacters);
      case 'role_balanced':
        return this.roleBalancedSelection(availableCharacters);
      default:
        return this.greedyOptimization(availableCharacters);
    }
  }

  /**
   * Greedy optimization algorithm
   */
  greedyOptimization(characters) {
    const team = [];
    const criteria = this.getCriteriaWeights();
    let remainingCharacters = [...characters];

    // Add required characters first
    for (const requiredId of this.constraints.requiredCharacters) {
      const character = characters.find(c => c.id === requiredId);
      if (character) {
        team.push(character);
        remainingCharacters = remainingCharacters.filter(c => c.id !== requiredId);
      }
    }

    // Fill remaining slots with best scoring characters
    while (team.length < 4 && remainingCharacters.length > 0) {
      let bestCharacter = null;
      let bestScore = -1;

      for (const character of remainingCharacters) {
        const testTeam = [...team, character];
        const score = this.calculateTeamScore(testTeam, criteria);

        if (score > bestScore) {
          bestScore = score;
          bestCharacter = character;
        }
      }

      if (bestCharacter) {
        team.push(bestCharacter);
        remainingCharacters = remainingCharacters.filter(c => c.id !== bestCharacter.id);
      } else {
        break;
      }
    }

    return team;
  }

  /**
   * Genetic algorithm for team optimization
   */
  geneticAlgorithm(characters) {
    const populationSize = 20;
    const generations = 10;
    const mutationRate = 0.1;

    // Initialize population
    let population = [];
    for (let i = 0; i < populationSize; i++) {
      population.push(this.generateRandomTeam(characters));
    }

    // Evolve over generations
    for (let gen = 0; gen < generations; gen++) {
      // Evaluate fitness
      const fitness = population.map(team => this.calculateTeamFitness(team));

      // Selection and crossover
      const newPopulation = [];
      for (let i = 0; i < populationSize / 2; i++) {
        const parent1 = this.tournamentSelection(population, fitness);
        const parent2 = this.tournamentSelection(population, fitness);
        const [child1, child2] = this.crossover(parent1, parent2);

        newPopulation.push(
          this.mutate(child1, characters, mutationRate),
          this.mutate(child2, characters, mutationRate)
        );
      }

      population = newPopulation;
    }

    // Return best individual
    const fitness = population.map(team => this.calculateTeamFitness(team));
    const bestIndex = fitness.indexOf(Math.max(...fitness));
    return population[bestIndex];
  }

  /**
   * Weighted scoring algorithm
   */
  weightedScoring(characters) {
    const weights = this.getCriteriaWeights();

    // Score all characters individually
    const scoredCharacters = characters.map(character => ({
      character,
      score: this.calculateCharacterScore(character, weights)
    }));

    // Sort by score
    scoredCharacters.sort((a, b) => b.score - a.score);

    // Select top 4, ensuring constraints are met
    const team = [];

    // Add required characters first
    for (const requiredId of this.constraints.requiredCharacters) {
      const scored = scoredCharacters.find(sc => sc.character.id === requiredId);
      if (scored) {
        team.push(scored.character);
      }
    }

    // Add remaining characters
    for (const scored of scoredCharacters) {
      if (team.length >= 4) break;
      if (!team.find(member => member.id === scored.character.id)) {
        team.push(scored.character);
      }
    }

    return team;
  }

  /**
   * Role-balanced selection algorithm
   */
  roleBalancedSelection(characters) {
    const roleTargets = {
      attacker: 2,
      support: 1,
      tank: 1,
      hybrid: 0
    };

    const charactersByRole = {
      attacker: [],
      support: [],
      tank: [],
      hybrid: []
    };

    // Categorize characters by role
    characters.forEach(character => {
      const role = this.getCharacterRole(character);
      charactersByRole[role].push(character);
    });

    const team = [];

    // Add required characters first
    for (const requiredId of this.constraints.requiredCharacters) {
      const character = characters.find(c => c.id === requiredId);
      if (character) {
        team.push(character);
        const role = this.getCharacterRole(character);
        roleTargets[role]--;
      }
    }

    // Fill remaining slots based on role requirements
    for (const [role, count] of Object.entries(roleTargets)) {
      const available = charactersByRole[role].filter(char =>
        !team.find(member => member.id === char.id)
      );

      for (let i = 0; i < count && available.length > 0 && team.length < 4; i++) {
        // Select best character of this role
        const best = available.reduce((prev, current) => {
          const prevScore = this.calculateCharacterScore(prev, this.getCriteriaWeights());
          const currentScore = this.calculateCharacterScore(current, this.getCriteriaWeights());
          return currentScore > prevScore ? current : prev;
        });

        team.push(best);
        available.splice(available.indexOf(best), 1);
      }
    }

    return team;
  }

  /**
   * Calculate team composition analysis
   */
  analyzeTeamComposition(team) {
    const analysis = {
      overallScore: 0,
      strengths: [],
      weaknesses: [],
      roleDistribution: {},
      elementalCoverage: [],
      synergies: [],
      recommendations: []
    };

    if (!team || team.length === 0) return analysis;

    // Calculate overall score
    analysis.overallScore = this.calculateTeamScore(team, this.getCriteriaWeights());

    // Analyze role distribution
    team.forEach(character => {
      const role = this.getCharacterRole(character);
      analysis.roleDistribution[role] = (analysis.roleDistribution[role] || 0) + 1;
    });

    // Analyze elemental coverage
    const elements = new Set();
    team.forEach(character => {
      if (character.element) {
        elements.add(character.element);
      }
    });
    analysis.elementalCoverage = Array.from(elements);

    // Identify strengths and weaknesses
    this.identifyTeamStrengthsWeaknesses(team, analysis);

    // Calculate synergies
    analysis.synergies = this.calculateTeamSynergies(team);

    return analysis;
  }

  /**
   * Identify team strengths and weaknesses
   */
  identifyTeamStrengthsWeaknesses(team, analysis) {
    const criteria = this.selectedCriteria;

    // Role balance analysis
    const roles = Object.keys(analysis.roleDistribution);
    if (roles.length >= 3) {
      analysis.strengths.push('Good role diversity');
    } else if (roles.length <= 1) {
      analysis.weaknesses.push('Limited role diversity');
    }

    // Elemental coverage analysis
    if (analysis.elementalCoverage.length >= 3) {
      analysis.strengths.push('Excellent elemental coverage');
    } else if (analysis.elementalCoverage.length <= 1) {
      analysis.weaknesses.push('Limited elemental options');
    }

    // Criteria-specific analysis
    switch (criteria) {
      case 'boss_fight':
        if (analysis.roleDistribution.attacker >= 2) {
          analysis.strengths.push('High damage potential');
        }
        if (!analysis.roleDistribution.support) {
          analysis.weaknesses.push('Lacks healing support');
        }
        break;

      case 'survival':
        if (analysis.roleDistribution.tank && analysis.roleDistribution.support) {
          analysis.strengths.push('Strong defensive core');
        }
        if (analysis.roleDistribution.attacker >= 3) {
          analysis.weaknesses.push('May lack survivability');
        }
        break;

      case 'speed_run':
        if (analysis.roleDistribution.attacker >= 3) {
          analysis.strengths.push('Maximum damage output');
        }
        if (analysis.roleDistribution.tank >= 2) {
          analysis.weaknesses.push('May be slow due to defensive focus');
        }
        break;
    }
  }

  /**
   * Calculate team synergies
   */
  calculateTeamSynergies(team) {
    const synergies = [];

    // Check for elemental synergies
    const elements = team.map(c => c.element).filter(e => e);
    const elementCombos = [
      { elements: ['fire', 'lightning'], name: 'Explosive Combo', bonus: 'Increased critical damage' },
      { elements: ['water', 'ice'], name: 'Freeze Lock', bonus: 'Enhanced crowd control' },
      { elements: ['light', 'dark'], name: 'Duality', bonus: 'Balanced offensive/defensive' }
    ];

    elementCombos.forEach(combo => {
      if (combo.elements.every(element => elements.includes(element))) {
        synergies.push({
          type: 'elemental',
          name: combo.name,
          bonus: combo.bonus
        });
      }
    });

    return synergies;
  }

  /**
   * Render optimization results
   */
  renderOptimizationResults() {
    const container = document.getElementById('optimization-results');
    if (!container) return;

    if (this.currentRecommendations.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">🤔</div>
          <h4>No Optimal Teams Found</h4>
          <p>Try adjusting your constraints or criteria.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="results-header">
        <h4>Recommended Team Compositions</h4>
        <p>Based on "${this.optimizationCriteria[this.selectedCriteria]}" criteria</p>
      </div>

      <div class="recommendations-grid">
        ${this.currentRecommendations.map((rec, index) => this.renderRecommendation(rec, index)).join('')}
      </div>
    `;
  }

  /**
   * Render individual recommendation
   */
  renderRecommendation(recommendation, index) {
    const { team, analysis, algorithm } = recommendation;
    const scoreClass = this.getScoreClass(analysis.overallScore);
    const rankLabels = ['🥇 Best', '🥈 Great', '🥉 Good', '👍 Solid'];

    return `
      <div class="recommendation-card ${scoreClass}" data-recommendation-id="${recommendation.id}">
        <div class="recommendation-header">
          <div class="recommendation-rank">
            <span class="rank-label">${rankLabels[index] || '✨ Option'}</span>
            <span class="algorithm-label">${this.formatAlgorithmName(algorithm)}</span>
          </div>
          <div class="recommendation-score">
            <span class="score-value">${Math.round(analysis.overallScore)}</span>
            <span class="score-label">Score</span>
          </div>
        </div>

        <div class="recommendation-team">
          <div class="team-members">
            ${team.map(character => `
              <div class="member-card">
                <div class="member-info">
                  <span class="member-name">${character.name}</span>
                  <span class="member-element ${character.element}">${character.element || 'neutral'}</span>
                </div>
                <div class="member-role">${this.getCharacterRole(character)}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="recommendation-analysis">
          <div class="analysis-section">
            <h5>Strengths</h5>
            <ul class="strengths-list">
              ${analysis.strengths.slice(0, 3).map(strength => `<li>${strength}</li>`).join('')}
              ${analysis.strengths.length === 0 ? '<li>No major strengths identified</li>' : ''}
            </ul>
          </div>

          ${analysis.weaknesses.length > 0 ? `
            <div class="analysis-section">
              <h5>Considerations</h5>
              <ul class="weaknesses-list">
                ${analysis.weaknesses.slice(0, 2).map(weakness => `<li>${weakness}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${analysis.synergies.length > 0 ? `
            <div class="analysis-section">
              <h5>Synergies</h5>
              <div class="synergies-list">
                ${analysis.synergies.map(synergy => `
                  <div class="synergy-item">
                    <span class="synergy-name">${synergy.name}</span>
                    <span class="synergy-bonus">${synergy.bonus}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <div class="recommendation-actions">
          <button class="recommendation-select btn-primary" data-recommendation-id="${recommendation.id}">
            Apply Team Composition
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Select and apply recommendation
   */
  selectRecommendation(recommendationId) {
    const recommendation = this.currentRecommendations.find(r => r.id === recommendationId);
    if (!recommendation) return;

    // Apply the team to the party composer
    this.applyTeamToParty(recommendation.team);
    this.showToast('Team composition applied successfully!', 'success');
  }

  /**
   * Apply team to party composer
   */
  applyTeamToParty(team) {
    const partyData = {
      active: team.slice(0, 3).map(character => character.id),
      reserve: team.slice(3, 4).map(character => character.id)
    };

    // Pad with nulls to maintain structure
    while (partyData.active.length < 3) {
      partyData.active.push(null);
    }
    while (partyData.reserve.length < 3) {
      partyData.reserve.push(null);
    }

    // Save to storage
    this.storage.saveParty(partyData);

    // Trigger party update
    window.dispatchEvent(new CustomEvent('teamOptimizerUpdate', {
      detail: { party: partyData }
    }));
  }

  /**
   * Utility methods
   */
  getCriteriaWeights() {
    const baseWeights = {
      damage: 0.3,
      survivability: 0.25,
      utility: 0.2,
      synergy: 0.15,
      versatility: 0.1
    };

    // Adjust weights based on selected criteria
    switch (this.selectedCriteria) {
      case 'boss_fight':
        return { ...baseWeights, damage: 0.5, survivability: 0.3, utility: 0.1, synergy: 0.1 };
      case 'survival':
        return { ...baseWeights, survivability: 0.5, utility: 0.25, damage: 0.15, synergy: 0.1 };
      case 'speed_run':
        return { ...baseWeights, damage: 0.6, versatility: 0.25, synergy: 0.1, utility: 0.05 };
      case 'elemental':
        return { ...baseWeights, synergy: 0.4, versatility: 0.3, damage: 0.2, utility: 0.1 };
      default:
        return baseWeights;
    }
  }

  calculateTeamScore(team, weights) {
    if (!team || team.length === 0) return 0;

    let totalScore = 0;
    const teamSize = team.length;

    // Individual character scores
    team.forEach(character => {
      totalScore += this.calculateCharacterScore(character, weights);
    });

    // Team composition bonuses
    const roles = team.map(c => this.getCharacterRole(c));
    const uniqueRoles = new Set(roles).size;
    totalScore += (uniqueRoles / 4) * 20; // Role diversity bonus

    const elements = team.map(c => c.element).filter(e => e);
    const uniqueElements = new Set(elements).size;
    totalScore += (uniqueElements / 4) * 15; // Element diversity bonus

    return totalScore / teamSize;
  }

  calculateCharacterScore(character, weights) {
    const build = this.storage.loadCharacterBuild(character.id);
    const stats = this.dataManager.calculateCharacterStats(
      character.id,
      build?.level || 1,
      build?.attributes || {}
    );

    if (!stats) return 0;

    const damageScore = (stats.attack + stats.critRate + stats.critDamage) / 3;
    const survivalScore = (stats.hp + stats.defense) / 2;
    const utilityScore = stats.speed + (stats.magic || 0);
    const synergyScore = this.calculateCharacterSynergyPotential(character);
    const versatilityScore = this.calculateCharacterVersatility(character);

    return (
      damageScore * weights.damage +
      survivalScore * weights.survivability +
      utilityScore * weights.utility +
      synergyScore * weights.synergy +
      versatilityScore * weights.versatility
    ) / 5;
  }

  calculateCharacterSynergyPotential(character) {
    // Base synergy score on element and abilities
    let score = 50;

    if (character.element && character.element !== 'physical') {
      score += 15; // Elemental characters have synergy potential
    }

    // Add points for support abilities
    if (character.abilities) {
      const supportAbilities = character.abilities.filter(ability =>
        ability.type === 'heal' || ability.type === 'buff' || ability.type === 'debuff'
      );
      score += supportAbilities.length * 5;
    }

    return Math.min(score, 100);
  }

  calculateCharacterVersatility(character) {
    // Based on stat distribution and abilities
    const build = this.storage.loadCharacterBuild(character.id);
    const stats = this.dataManager.calculateCharacterStats(
      character.id,
      build?.level || 1,
      build?.attributes || {}
    );

    if (!stats) return 50;

    // More balanced stats = higher versatility
    const statValues = [stats.attack, stats.defense, stats.speed, stats.magic || 0];
    const average = statValues.reduce((a, b) => a + b, 0) / statValues.length;
    const variance = statValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / statValues.length;

    // Lower variance = more balanced = higher versatility
    return Math.max(20, 100 - Math.sqrt(variance));
  }

  getCharacterRole(character) {
    const build = this.storage.loadCharacterBuild(character.id);
    const stats = this.dataManager.calculateCharacterStats(
      character.id,
      build?.level || 1,
      build?.attributes || {}
    );

    if (!stats) return 'hybrid';

    const attack = stats.attack || 0;
    const defense = stats.defense || 0;
    const magic = stats.magic || 0;

    if (defense > attack && defense > magic) return 'tank';
    if (magic > attack && magic > defense) return 'support';
    if (attack > defense && attack > magic) return 'attacker';
    return 'hybrid';
  }

  getScoreClass(score) {
    if (score >= 85) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'average';
    if (score >= 40) return 'poor';
    return 'terrible';
  }

  formatAlgorithmName(algorithm) {
    const names = {
      greedy_optimization: 'Greedy',
      genetic_algorithm: 'Genetic',
      weighted_scoring: 'Weighted',
      role_balanced: 'Balanced'
    };
    return names[algorithm] || algorithm;
  }

  // Genetic algorithm helper methods
  generateRandomTeam(characters) {
    const shuffled = [...characters].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(4, shuffled.length));
  }

  calculateTeamFitness(team) {
    return this.calculateTeamScore(team, this.getCriteriaWeights());
  }

  tournamentSelection(population, fitness) {
    const tournamentSize = 3;
    let best = Math.floor(Math.random() * population.length);

    for (let i = 1; i < tournamentSize; i++) {
      const candidate = Math.floor(Math.random() * population.length);
      if (fitness[candidate] > fitness[best]) {
        best = candidate;
      }
    }

    return population[best];
  }

  crossover(parent1, parent2) {
    const crossoverPoint = Math.floor(Math.random() * parent1.length);
    const child1 = [...parent1.slice(0, crossoverPoint), ...parent2.slice(crossoverPoint)];
    const child2 = [...parent2.slice(0, crossoverPoint), ...parent1.slice(crossoverPoint)];

    return [
      child1.filter((char, index, arr) => arr.findIndex(c => c.id === char.id) === index),
      child2.filter((char, index, arr) => arr.findIndex(c => c.id === char.id) === index)
    ];
  }

  mutate(team, characters, mutationRate) {
    if (Math.random() < mutationRate && team.length > 0) {
      const mutateIndex = Math.floor(Math.random() * team.length);
      const availableCharacters = characters.filter(c => !team.find(member => member.id === c.id));
      if (availableCharacters.length > 0) {
        team[mutateIndex] = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
      }
    }
    return team;
  }

  isValidTeam(team) {
    if (!team || team.length === 0) return false;

    // Check constraints
    for (const requiredId of this.constraints.requiredCharacters) {
      if (!team.find(member => member.id === requiredId)) {
        return false;
      }
    }

    // Check elemental requirements
    if (this.constraints.elementalRequirements.length > 0) {
      const teamElements = team.map(member => member.element).filter(e => e);
      for (const requiredElement of this.constraints.elementalRequirements) {
        if (!teamElements.includes(requiredElement)) {
          return false;
        }
      }
    }

    return true;
  }

  showError(message) {
    console.error(message);
    if (window.app && window.app.showToast) {
      window.app.showToast(message, 'error');
    }
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
    // Refresh available characters and constraints
    this.renderOptimizerInterface();
  }

  onActivate() {
    this.refresh();
  }

  hasUnsavedChanges() {
    return false; // No persistent state
  }
}