// Modern Navigation Component for Expedition 33 Planner
import { router } from '../utils/router.js';

export class Navigation {
  constructor() {
    this.isCollapsed = false;
    this.currentPath = null;
    this.navigationData = this.getNavigationStructure();

    // Bind methods
    this.handleRouteChange = this.handleRouteChange.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.handleNavClick = this.handleNavClick.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  /**
   * Initialize the navigation component
   */
  init() {
    console.log('🚀 Navigation: Starting initialization...');
    this.createNavigationStructure();
    console.log('🚀 Navigation: Structure created');
    this.setupEventListeners();
    console.log('🚀 Navigation: Event listeners setup');

    // Restore group states and update active state after DOM is ready
    setTimeout(() => {
      this.restoreGroupStates();
      this.updateActiveState();
      console.log('🚀 Navigation: Groups and active state restored');
    }, 100);

    console.log('✅ Navigation: Initialization complete');
  }

  /**
   * Get the organized navigation structure
   */
  getNavigationStructure() {
    return {
      'build-tools': {
        title: 'Build Tools',
        icon: '⚒️',
        items: [
          { path: 'characters', title: 'Character Builder', icon: '👤' },
          { path: 'pictos', title: 'Pictos & Lumina', icon: '🔮' },
          { path: 'calculator', title: 'Damage Calculator', icon: '📊' }
        ]
      },
      'team-management': {
        title: 'Team Management',
        icon: '👥',
        items: [
          { path: 'party', title: 'Party Composer', icon: '⚔️' },
          { path: 'optimizer', title: 'Team Optimizer', icon: '🎯' },
          { path: 'comparison', title: 'Build Comparison', icon: '📋' }
        ]
      },
      'progress-tracking': {
        title: 'Progress Tracking',
        icon: '📈',
        items: [
          { path: 'collectibles', title: 'Collectibles', icon: '🗺️' },
          { path: 'bosses', title: 'Boss Tracker', icon: '👹' },
          { path: 'achievements', title: 'Achievements', icon: '🏆' }
        ]
      },
      'resources': {
        title: 'Resources',
        icon: '📚',
        items: [
          { path: 'guides', title: 'Build Guides', icon: '📖' },
          { path: 'builds', title: 'Saved Builds', icon: '💾' }
        ]
      }
    };
  }

  /**
   * Create the new navigation structure
   */
  createNavigationStructure() {
    console.log('📐 Navigation: Creating structure...');

    // Create new sidebar navigation
    const sidebar = document.createElement('aside');
    sidebar.className = 'app-sidebar';
    sidebar.innerHTML = this.generateNavigationHTML();
    console.log('📐 Navigation: Sidebar element created');

    // Create mobile nav toggle
    const header = document.querySelector('.app-header .header-content');
    console.log('📐 Navigation: Header found:', !!header);

    if (header) {
      const navToggle = document.createElement('button');
      navToggle.className = 'nav-toggle btn-icon';
      navToggle.innerHTML = '<span class="hamburger-icon"></span>';
      navToggle.setAttribute('aria-label', 'Toggle navigation');
      navToggle.addEventListener('click', this.handleToggle);

      // Insert before theme toggle
      const themeToggle = header.querySelector('#theme-toggle');
      if (themeToggle) {
        header.insertBefore(navToggle, themeToggle);
        console.log('📐 Navigation: Toggle inserted before theme toggle');
      } else {
        header.appendChild(navToggle);
        console.log('📐 Navigation: Toggle appended to header');
      }
    }

    // Insert sidebar into app container
    const appContainer = document.getElementById('app');
    const appContentWrapper = document.querySelector('.app-content-wrapper');

    console.log('📐 Navigation: App container found:', !!appContainer);
    console.log('📐 Navigation: Content wrapper found:', !!appContentWrapper);

    if (appContainer && appContentWrapper) {
      appContainer.insertBefore(sidebar, appContentWrapper);
      console.log('📐 Navigation: Sidebar inserted into DOM');

      // Update main content layout
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.classList.add('with-sidebar');
        console.log('📐 Navigation: Main content updated with sidebar class');
      }
    } else {
      console.error('❌ Navigation: Could not insert sidebar - missing containers');
    }
  }

  /**
   * Generate HTML for the navigation
   */
  generateNavigationHTML() {
    let html = `
      <div class="sidebar-header">
        <h3 class="sidebar-title">Navigation</h3>
        <button class="sidebar-close btn-icon" aria-label="Close navigation">
          <span class="close-icon">×</span>
        </button>
      </div>
      <nav class="sidebar-nav" role="navigation">
    `;

    // Generate navigation groups (expanded by default)
    Object.entries(this.navigationData).forEach(([categoryKey, category]) => {
      html += `
        <div class="nav-group expanded" data-category="${categoryKey}">
          <div class="nav-group-header">
            <span class="nav-group-icon">${category.icon}</span>
            <span class="nav-group-title">${category.title}</span>
            <button class="nav-group-toggle" aria-label="Toggle ${category.title}">
              <span class="chevron-icon">›</span>
            </button>
          </div>
          <ul class="nav-group-items">
      `;

      category.items.forEach(item => {
        html += `
          <li>
            <a href="#/${item.path}" class="nav-item" data-path="${item.path}">
              <span class="nav-item-icon">${item.icon}</span>
              <span class="nav-item-text">${item.title}</span>
            </a>
          </li>
        `;
      });

      html += `
          </ul>
        </div>
      `;
    });

    html += `
      </nav>
      <div class="sidebar-footer">
        <div class="app-version">v1.0.0</div>
      </div>
    `;

    return html;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Route change listener
    window.addEventListener('routechange', this.handleRouteChange);

    // Navigation clicks
    document.addEventListener('click', this.handleNavClick);

    // Window resize
    window.addEventListener('resize', this.handleResize);

    // Group toggle clicks
    document.addEventListener('click', (e) => {
      if (e.target.closest('.nav-group-toggle')) {
        const group = e.target.closest('.nav-group');
        this.toggleGroup(group);
      }
    });

    // Sidebar close
    document.addEventListener('click', (e) => {
      if (e.target.closest('.sidebar-close')) {
        this.closeSidebar();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.isCollapsed) {
        this.closeSidebar();
      }
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      const sidebar = document.querySelector('.app-sidebar');
      const navToggle = document.querySelector('.nav-toggle');

      if (
        sidebar &&
        !sidebar.contains(e.target) &&
        !navToggle?.contains(e.target) &&
        !this.isCollapsed &&
        window.innerWidth <= 768
      ) {
        this.closeSidebar();
      }
    });

    // Handle initial responsive state
    this.handleResize();
  }

  /**
   * Handle navigation clicks
   */
  handleNavClick(e) {
    const navItem = e.target.closest('.nav-item');
    if (!navItem) return;

    e.preventDefault();
    const path = navItem.dataset.path;

    if (path) {
      router.navigate(path);

      // Close sidebar on mobile after navigation
      if (window.innerWidth <= 768) {
        this.closeSidebar();
      }
    }
  }

  /**
   * Handle route change events
   */
  handleRouteChange(e) {
    this.currentPath = e.detail.path;
    this.updateActiveState();
  }

  /**
   * Update active navigation state
   */
  updateActiveState() {
    // Remove all active classes
    document.querySelectorAll('.nav-item.active').forEach(item => {
      item.classList.remove('active');
    });

    // Add active class to current item
    const currentItem = document.querySelector(`[data-path="${this.currentPath}"]`);
    if (currentItem) {
      currentItem.classList.add('active');

      // Expand parent group
      const group = currentItem.closest('.nav-group');
      if (group) {
        group.classList.add('expanded');
      }
    }
  }

  /**
   * Toggle navigation sidebar
   */
  handleToggle() {
    if (this.isCollapsed) {
      this.openSidebar();
    } else {
      this.closeSidebar();
    }
  }

  /**
   * Open sidebar
   */
  openSidebar() {
    const sidebar = document.querySelector('.app-sidebar');
    const overlay = this.getOrCreateOverlay();

    if (sidebar) {
      sidebar.classList.add('open');
      overlay.classList.add('active');
      this.isCollapsed = false;

      // Update toggle button
      const toggle = document.querySelector('.nav-toggle');
      if (toggle) {
        toggle.classList.add('active');
      }
    }
  }

  /**
   * Close sidebar
   */
  closeSidebar() {
    const sidebar = document.querySelector('.app-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (sidebar) {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
      this.isCollapsed = true;

      // Update toggle button
      const toggle = document.querySelector('.nav-toggle');
      if (toggle) {
        toggle.classList.remove('active');
      }
    }
  }

  /**
   * Toggle navigation group
   */
  toggleGroup(group) {
    if (!group) return;

    group.classList.toggle('expanded');

    // Store expanded state
    const category = group.dataset.category;
    const isExpanded = group.classList.contains('expanded');
    localStorage.setItem(`nav-group-${category}`, isExpanded.toString());
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const sidebar = document.querySelector('.app-sidebar');
    if (!sidebar) return;

    if (window.innerWidth > 768) {
      // Desktop: always show sidebar
      sidebar.classList.add('desktop');
      this.closeSidebar(); // Reset mobile state
    } else {
      // Mobile: collapsible sidebar
      sidebar.classList.remove('desktop');
    }
  }

  /**
   * Get or create sidebar overlay for mobile
   */
  getOrCreateOverlay() {
    let overlay = document.querySelector('.sidebar-overlay');

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      overlay.addEventListener('click', () => this.closeSidebar());
      document.body.appendChild(overlay);
    }

    return overlay;
  }

  /**
   * Restore expanded groups from localStorage
   */
  restoreGroupStates() {
    Object.keys(this.navigationData).forEach(category => {
      const isExpanded = localStorage.getItem(`nav-group-${category}`) === 'true';
      const group = document.querySelector(`[data-category="${category}"]`);

      if (group && isExpanded) {
        group.classList.add('expanded');
      }
    });
  }

  /**
   * Restore expanded groups from localStorage
   */
  restoreGroupStates() {
    Object.keys(this.navigationData).forEach(category => {
      const isExpanded = localStorage.getItem(`nav-group-${category}`) === 'true';
      const group = document.querySelector(`[data-category="${category}"]`);

      if (group && isExpanded) {
        group.classList.add('expanded');
      }
    });
  }

  /**
   * Update navigation badge counts
   */
  updateBadges(badges) {
    Object.entries(badges).forEach(([path, count]) => {
      const navItem = document.querySelector(`[data-path="${path}"]`);
      if (navItem && count > 0) {
        let badge = navItem.querySelector('.nav-badge');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'nav-badge';
          navItem.appendChild(badge);
        }
        badge.textContent = count;
      }
    });
  }

  /**
   * Destroy the navigation component
   */
  destroy() {
    window.removeEventListener('routechange', this.handleRouteChange);
    window.removeEventListener('resize', this.handleResize);

    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
}

// Export singleton instance
export const navigation = new Navigation();