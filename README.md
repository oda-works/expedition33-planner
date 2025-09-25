# Clair Obscur: Expedition 33 Build Planner & Tracker

A comprehensive, AI-powered build planning and tracking tool for **Clair Obscur: Expedition 33**. This advanced web application helps players optimize character builds, create synergistic party compositions, and track their progression through the game.

## 🌟 Features

### 🔨 Character Build System
- **Advanced Build Creator**: Comprehensive character customization with real-time stat calculations
- **Build Comparison Tool**: Side-by-side analysis of up to 4 builds with performance scoring
- **Comprehensive Build Guides**: AI-powered recommendations with multiple archetypes and progression paths
- **Damage Calculator**: Advanced damage simulation with elemental interactions and critical calculations

### 🎭 Party Management
- **Party Composer**: Drag-and-drop party formation with role optimization
- **Advanced Synergy Visualization**: Real-time analysis of elemental, role, and combat synergies
- **Team Formation Optimizer**: AI-powered team recommendations using multiple algorithms
- **Synergy Matrix**: Interactive visualization of character compatibility

### 📚 Collection & Progress Tracking
- **Collectibles Tracker**: Track all 185 collectibles (49 journals, 33 music records, special items)
- **Interactive Map**: Detailed game world map with collectible locations
- **Boss Encounter Tracker**: Strategy guides and progress tracking for all bosses
- **Achievement System**: 25+ achievements across multiple categories with progress tracking

### 🎴 Pictos & Lumina Management
- **Complete Pictos Database**: All 193 Pictos with accurate stats and descriptions
- **Smart Filtering & Search**: Advanced search by rarity, element, effect, and compatibility
- **Build Integration**: Seamless Pictos integration with character builds
- **Rarity System**: Common to Legendary with visual indicators

### 🎯 Advanced Analytics
- **Performance Metrics**: Detailed statistics and analytics across all game aspects
- **Progress Tracking**: Comprehensive progression monitoring
- **Export/Import System**: Share builds and configurations
- **Data Visualization**: Charts and graphs for build performance analysis

## Getting Started

1. Open `index.html` in a modern web browser
2. Or run a local HTTP server: `python3 -m http.server 3000`
3. Navigate to `http://localhost:3000`

## Technology

- Pure HTML5, CSS3, and ES6 JavaScript
- No external dependencies or build process required
- Progressive Web App with Service Worker for offline functionality
- LocalStorage for data persistence
- Modular architecture with ES6 modules

## Project Structure

```
expedition33-planner/
├── index.html              # Main application entry point
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker for offline functionality
├── css/
│   ├── main.css           # Core styles and design system
│   ├── themes.css         # Theme definitions
│   ├── responsive.css     # Responsive design
│   ├── pictos-manager.css # Pictos-specific styling
│   └── party-composer.css # Party composer styling
├── js/
│   ├── app.js            # Main application controller
│   ├── utils/
│   │   ├── constants.js  # Application constants
│   │   ├── validators.js # Validation utilities
│   │   └── formatters.js # Data formatting utilities
│   └── modules/
│       ├── data-manager.js        # Game data management
│       ├── storage.js             # LocalStorage management
│       ├── character-builder.js   # Character building logic
│       ├── pictos-manager.js      # Pictos collection management
│       ├── party-composer.js      # Party composition tools
│       └── collectibles-tracker.js # Collectibles tracking
├── data/
│   ├── characters.json    # Character data and progression
│   ├── pictos.json       # Pictos collection data
│   ├── weapons.json      # Weapon statistics
│   ├── collectibles.json # Collectibles and locations
│   └── synergies.json    # Party synergy definitions
└── assets/
    └── icons/
        ├── favicon.svg        # Application favicon
        └── icon-192x192.svg   # PWA icon
```

## Data Accuracy

All game data has been researched for accuracy based on available information about Clair Obscur: Expedition 33. The data includes:

- 6 playable characters with unique abilities and progression
- 193 Pictos with accurate costs and effects
- Lumina activation system
- Character synergies and party mechanics
- Collectible locations and descriptions

## Contributing

This is an unofficial fan project. Game data may need updates as more information becomes available about Clair Obscur: Expedition 33.

## Disclaimer

This is an unofficial fan tool and is not affiliated with Sandfall Interactive or Clair Obscur: Expedition 33. All game content and intellectual property belongs to their respective owners.