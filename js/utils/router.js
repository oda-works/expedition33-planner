// Modern SPA Router for Expedition 33 Planner
export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.defaultRoute = 'characters';

    // Bind methods
    this.handleHashChange = this.handleHashChange.bind(this);
    this.handlePopState = this.handlePopState.bind(this);
  }

  /**
   * Initialize the router
   */
  init() {
    console.log('🗺️ Router: Starting initialization...');

    // Listen for hash changes and popstate events
    window.addEventListener('hashchange', this.handleHashChange);
    window.addEventListener('popstate', this.handlePopState);
    console.log('🗺️ Router: Event listeners registered');

    // Handle initial route
    this.handleInitialRoute();
    console.log('✅ Router: Initialization complete');
  }

  /**
   * Register a route with its handler
   * @param {string} path - Route path (without #)
   * @param {Function} handler - Route handler function
   * @param {Object} options - Route options
   */
  addRoute(path, handler, options = {}) {
    this.routes.set(path, {
      handler,
      title: options.title || path,
      requiresAuth: options.requiresAuth || false,
      category: options.category || 'general'
    });
  }

  /**
   * Navigate to a specific route
   * @param {string} path - Route path
   * @param {boolean} replace - Whether to replace current history entry
   */
  navigate(path, replace = false) {
    const hash = `#/${path}`;

    if (replace) {
      window.location.replace(hash);
    } else {
      window.location.hash = hash;
    }
  }

  /**
   * Handle hash change events
   */
  handleHashChange() {
    const path = this.getCurrentPath();
    this.route(path);
  }

  /**
   * Handle popstate events (back/forward buttons)
   */
  handlePopState() {
    const path = this.getCurrentPath();
    this.route(path);
  }

  /**
   * Handle initial route when app loads
   */
  handleInitialRoute() {
    const path = this.getCurrentPath();
    if (!path) {
      this.navigate(this.defaultRoute, true);
    } else {
      this.route(path);
    }
  }

  /**
   * Get current path from hash
   * @returns {string} Current path
   */
  getCurrentPath() {
    const hash = window.location.hash;
    if (hash.startsWith('#/')) {
      return hash.slice(2);
    }
    return '';
  }

  /**
   * Route to a specific path
   * @param {string} path - Route path
   */
  route(path) {
    console.log(`🗺️ Router: Routing to "${path}"`);

    // Fallback to default route if path is empty
    if (!path) {
      path = this.defaultRoute;
      console.log(`🗺️ Router: Using default route "${path}"`);
    }

    const route = this.routes.get(path);
    console.log(`🗺️ Router: Route found:`, !!route);

    if (route) {
      // Check authentication if required
      if (route.requiresAuth && !this.isAuthenticated()) {
        this.navigate('auth');
        return;
      }

      // Update current route
      this.currentRoute = path;

      // Update document title
      document.title = `${route.title} - Expedition 33 Planner`;

      // Call route handler
      try {
        route.handler(path);

        // Emit route change event
        this.emitRouteChange(path, route);
      } catch (error) {
        console.error(`Error handling route ${path}:`, error);
        this.handleRouteError(path, error);
      }
    } else {
      console.warn(`Route not found: ${path}`);
      this.handle404(path);
    }
  }

  /**
   * Check if user is authenticated (placeholder)
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    // This would typically check for valid auth tokens, etc.
    return true;
  }

  /**
   * Handle 404 errors
   * @param {string} path - Invalid path
   */
  handle404(path) {
    console.log(`404: Route "${path}" not found, redirecting to default`);
    this.navigate(this.defaultRoute, true);
  }

  /**
   * Handle route errors
   * @param {string} path - Route path that errored
   * @param {Error} error - Error object
   */
  handleRouteError(path, error) {
    console.error(`Route error for ${path}:`, error);
    // Could show an error page or toast notification
  }

  /**
   * Emit route change event
   * @param {string} path - New route path
   * @param {Object} route - Route object
   */
  emitRouteChange(path, route) {
    const event = new CustomEvent('routechange', {
      detail: { path, route, previousRoute: this.currentRoute }
    });
    window.dispatchEvent(event);
  }

  /**
   * Get all routes grouped by category
   * @returns {Object} Routes grouped by category
   */
  getRoutesByCategory() {
    const grouped = {};

    for (const [path, route] of this.routes) {
      const category = route.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push({ path, ...route });
    }

    return grouped;
  }

  /**
   * Get route info for current path
   * @returns {Object|null} Current route info
   */
  getCurrentRoute() {
    if (!this.currentRoute) return null;

    const route = this.routes.get(this.currentRoute);
    return route ? { path: this.currentRoute, ...route } : null;
  }

  /**
   * Check if a route exists
   * @param {string} path - Route path
   * @returns {boolean} Whether route exists
   */
  hasRoute(path) {
    return this.routes.has(path);
  }

  /**
   * Remove a route
   * @param {string} path - Route path to remove
   */
  removeRoute(path) {
    return this.routes.delete(path);
  }

  /**
   * Get all registered routes
   * @returns {Map} All routes
   */
  getAllRoutes() {
    return new Map(this.routes);
  }
}

// Create and export singleton instance
export const router = new Router();