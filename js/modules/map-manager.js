// Interactive Map Manager for Expedition 33 Planner
export class MapManager {
  constructor(dataManager, storage) {
    this.dataManager = dataManager;
    this.storage = storage;
    this.mapData = null;
    this.currentFilter = 'all';
    this.showFoundItems = true;
    this.selectedLocation = null;
    this.tooltip = null;

    // Bind methods
    this.handleMarkerClick = this.handleMarkerClick.bind(this);
    this.handleMarkerHover = this.handleMarkerHover.bind(this);
    this.handleMarkerLeave = this.handleMarkerLeave.bind(this);
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.handleToggleFound = this.handleToggleFound.bind(this);
  }

  /**
   * Initialize the map manager
   */
  async init() {
    try {
      await this.loadMapData();
      console.log('✓ Map manager initialized');
    } catch (error) {
      console.error('Failed to initialize map manager:', error);
    }
  }

  /**
   * Load map data
   */
  async loadMapData() {
    try {
      const response = await fetch('./data/map-data.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      this.mapData = await response.json();
      console.log('✓ Map data loaded');
    } catch (error) {
      console.error('Failed to load map data:', error);
      throw error;
    }
  }

  /**
   * Render the interactive map
   */
  renderMap(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !this.mapData) return;

    container.innerHTML = this.createMapHTML();
    this.setupMapEventListeners(container);
    this.renderMarkers(container);
    this.renderLegend(container);
  }

  /**
   * Create map HTML structure
   */
  createMapHTML() {
    return `
      <div class="map-container">
        <div class="map-header">
          <h3 class="map-title">The Continent - Interactive Map</h3>
          <div class="map-controls">
            <select class="map-filter" id="map-filter">
              <option value="all">Show All</option>
              <option value="journals">Expedition Journals</option>
              <option value="music">Music Records</option>
              <option value="special">Special Items</option>
              <option value="gestrals">Lost Gestrals</option>
            </select>
            <button class="map-toggle" id="toggle-found">
              ${this.showFoundItems ? 'Hide Found' : 'Show Found'}
            </button>
          </div>
        </div>

        <div class="interactive-map" id="game-map">
          <div class="map-background"></div>
          <div class="location-info" id="location-info"></div>
        </div>

        <div class="map-legend" id="map-legend"></div>
      </div>
    `;
  }

  /**
   * Set up map event listeners
   */
  setupMapEventListeners(container) {
    const filterSelect = container.querySelector('#map-filter');
    const toggleButton = container.querySelector('#toggle-found');

    if (filterSelect) {
      filterSelect.addEventListener('change', this.handleFilterChange);
    }

    if (toggleButton) {
      toggleButton.addEventListener('click', this.handleToggleFound);
    }
  }

  /**
   * Render location and collectible markers
   */
  renderMarkers(container) {
    const mapElement = container.querySelector('#game-map');
    if (!mapElement) return;

    // Clear existing markers (except background and info)
    const existingMarkers = mapElement.querySelectorAll('.location-marker, .collectible-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Render location markers
    Object.values(this.mapData.locations).forEach(location => {
      const marker = this.createLocationMarker(location);
      mapElement.appendChild(marker);
    });

    // Render collectible markers based on current filter
    this.renderCollectibleMarkers(mapElement);
  }

  /**
   * Create location marker element
   */
  createLocationMarker(location) {
    const marker = document.createElement('div');
    marker.className = `location-marker ${location.type}`;
    marker.style.left = `${location.coordinates.x}px`;
    marker.style.top = `${location.coordinates.y}px`;
    marker.dataset.locationId = location.id;
    marker.dataset.tooltip = `${location.name} (${location.type})`;

    marker.addEventListener('click', () => this.handleMarkerClick(location));
    marker.addEventListener('mouseenter', this.handleMarkerHover);
    marker.addEventListener('mouseleave', this.handleMarkerLeave);

    return marker;
  }

  /**
   * Render collectible markers
   */
  renderCollectibleMarkers(mapElement) {
    const collectibleTypes = this.getFilteredCollectibleTypes();
    const foundItems = this.storage.loadCollectiblesProgress();

    collectibleTypes.forEach(type => {
      const collectibles = this.mapData.collectible_mapping[type];
      if (!collectibles) return;

      Object.entries(collectibles).forEach(([id, collectible]) => {
        const isFound = foundItems[type]?.includes(id);

        // Skip found items if we're hiding them
        if (!this.showFoundItems && isFound) return;

        const marker = this.createCollectibleMarker(collectible, type, isFound);
        mapElement.appendChild(marker);
      });
    });
  }

  /**
   * Create collectible marker element
   */
  createCollectibleMarker(collectible, type, isFound) {
    const marker = document.createElement('div');
    marker.className = `collectible-marker ${type}${isFound ? ' found' : ''}`;
    marker.style.left = `${collectible.coordinates.x}px`;
    marker.style.top = `${collectible.coordinates.y}px`;
    marker.dataset.collectibleId = collectible.name;
    marker.dataset.tooltip = `${collectible.name} (${type})${isFound ? ' ✓' : ''}`;

    marker.addEventListener('mouseenter', this.handleMarkerHover);
    marker.addEventListener('mouseleave', this.handleMarkerLeave);

    return marker;
  }

  /**
   * Get filtered collectible types
   */
  getFilteredCollectibleTypes() {
    if (this.currentFilter === 'all') {
      return ['journals', 'music', 'special', 'gestrals'];
    }
    return [this.currentFilter];
  }

  /**
   * Render map legend
   */
  renderLegend(container) {
    const legendElement = container.querySelector('#map-legend');
    if (!legendElement) return;

    const legendItems = [
      { type: 'story', label: 'Story Location' },
      { type: 'optional', label: 'Optional Location' },
      { type: 'hub', label: 'Hub Location' },
      { type: 'journal', label: 'Expedition Journal' },
      { type: 'music', label: 'Music Record' },
      { type: 'special', label: 'Special Item' },
      { type: 'gestral', label: 'Lost Gestral' }
    ];

    legendElement.innerHTML = legendItems.map(item => `
      <div class="legend-item">
        <div class="legend-marker ${item.type}"></div>
        <span>${item.label}</span>
      </div>
    `).join('');
  }

  /**
   * Handle location marker click
   */
  handleMarkerClick(location) {
    this.selectedLocation = location;
    this.showLocationInfo(location);
  }

  /**
   * Show location information
   */
  showLocationInfo(location) {
    const infoElement = document.getElementById('location-info');
    if (!infoElement) return;

    const collectibles = this.getLocationCollectibles(location.id);
    const foundItems = this.storage.loadCollectiblesProgress();

    infoElement.innerHTML = `
      <h4>${location.name}</h4>
      <p>${location.description}</p>
      ${collectibles.length > 0 ? `
        <div class="location-collectibles">
          ${collectibles.map(item => {
            const isFound = this.isCollectibleFound(item, foundItems);
            return `<span class="collectible-chip ${isFound ? 'found' : ''}">${item.name}</span>`;
          }).join('')}
        </div>
      ` : '<p>No collectibles in this location.</p>'}
    `;

    infoElement.classList.add('visible');

    // Hide after 5 seconds
    setTimeout(() => {
      infoElement.classList.remove('visible');
    }, 5000);
  }

  /**
   * Get collectibles for a location
   */
  getLocationCollectibles(locationId) {
    const collectibles = [];

    Object.entries(this.mapData.collectible_mapping).forEach(([type, items]) => {
      Object.entries(items).forEach(([id, item]) => {
        if (item.location === locationId) {
          collectibles.push({ ...item, type, id });
        }
      });
    });

    return collectibles;
  }

  /**
   * Check if collectible is found
   */
  isCollectibleFound(item, foundItems) {
    return foundItems[item.type]?.includes(item.id) || false;
  }

  /**
   * Handle marker hover
   */
  handleMarkerHover(event) {
    const tooltip = event.target.dataset.tooltip;
    if (!tooltip) return;

    this.showTooltip(event.target, tooltip);
  }

  /**
   * Handle marker leave
   */
  handleMarkerLeave() {
    this.hideTooltip();
  }

  /**
   * Show tooltip
   */
  showTooltip(element, text) {
    this.hideTooltip(); // Remove existing tooltip

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'map-tooltip';
    this.tooltip.textContent = text;

    const rect = element.getBoundingClientRect();
    const mapRect = element.closest('.interactive-map').getBoundingClientRect();

    this.tooltip.style.left = `${rect.left - mapRect.left + rect.width / 2}px`;
    this.tooltip.style.top = `${rect.top - mapRect.top}px`;

    element.closest('.interactive-map').appendChild(this.tooltip);
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }

  /**
   * Handle filter change
   */
  handleFilterChange(event) {
    this.currentFilter = event.target.value;
    this.refreshMap();
  }

  /**
   * Handle toggle found items
   */
  handleToggleFound() {
    this.showFoundItems = !this.showFoundItems;
    const button = document.getElementById('toggle-found');
    if (button) {
      button.textContent = this.showFoundItems ? 'Hide Found' : 'Show Found';
    }
    this.refreshMap();
  }

  /**
   * Refresh map display
   */
  refreshMap() {
    const container = document.querySelector('.map-container');
    if (container) {
      this.renderMarkers(container);
    }
  }

  /**
   * Update map with collectibles progress
   */
  updateProgress() {
    this.refreshMap();
  }
}