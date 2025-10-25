// Driver booking component - Apps SDK compliant
(function () {
  'use strict';

  let currentDriverIndex = 0;

  // Get driver data from window.openai.toolOutput
  function getDrivers() {
    try {
      const toolOutput = window?.openai?.toolOutput;
      if (!toolOutput) {
        console.error('No toolOutput available');
        return [];
      }
      return toolOutput.drivers || [];
    } catch (error) {
      console.error('Error reading drivers:', error);
      return [];
    }
  }

  // Get theme from window.openai
  function getTheme() {
    try {
      return window?.openai?.theme || 'light';
    } catch (error) {
      return 'light';
    }
  }

  // Navigate between drivers in carousel
  function navigateDrivers(direction) {
    const drivers = getDrivers();
    if (drivers.length === 0) return;

    if (direction === 'next') {
      currentDriverIndex = (currentDriverIndex + 1) % drivers.length;
    } else {
      currentDriverIndex = (currentDriverIndex - 1 + drivers.length) % drivers.length;
    }
    renderApp();
  }

  // Handle driver action buttons
  function handleDriverAction(action, driverName) {
    try {
      if (!window?.openai?.sendFollowupMessage) {
        console.error('sendFollowupMessage not available');
        return;
      }

      let message = '';
      switch (action) {
        case 'book':
          message = `I want to book ${driverName} for a ride`;
          break;
        case 'schedule':
          message = `Show me ${driverName}'s availability schedule`;
          break;
        case 'details':
          message = `Tell me more about ${driverName}`;
          break;
        default:
          return;
      }

      window.openai.sendFollowupMessage({ prompt: message });
    } catch (error) {
      console.error('Error sending follow-up:', error);
    }
  }

  // Render star rating
  function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let html = '';

    for (let i = 0; i < fullStars; i++) {
      html += '<span class="star">★</span>';
    }
    if (hasHalfStar) {
      html += '<span class="star">⯨</span>';
    }
    for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
      html += '<span class="star-empty">★</span>';
    }

    return html;
  }

  // Render single driver card
  function renderDriverCard(driver, theme) {
    const isDark = theme === 'dark';

    // Get today's availability
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const todaySlots = driver.availability?.[today] || [];
    const availabilityText = todaySlots.length > 0
      ? `Today: ${todaySlots[0]}`
      : 'Not available today';

    return `
      <div class="driver-card ${isDark ? 'dark' : 'light'}">
        <!-- Driver Header -->
        <div class="driver-header">
          <img src="${driver.photo}" alt="${driver.name}" class="driver-photo" />
          <div class="driver-info">
            <h2 class="driver-name">${driver.name}</h2>
            <div class="driver-rating">
              ${renderStars(driver.rating)}
              <span class="rating-text">${driver.rating} (${driver.totalRides} rides)</span>
            </div>
            <div class="driver-experience">${driver.yearsExperience} years experience</div>
          </div>
        </div>

        <!-- Quick Info -->
        <div class="quick-info">
          <span class="badge">🚗 ${driver.vehicle.type}</span>
          <span class="badge">📍 ${driver.serviceArea.city}</span>
          <span class="badge">💵 $${driver.hourlyRate}/hr</span>
        </div>

        <!-- Vehicle Info -->
        <div class="info-section">
          <div class="section-title">Vehicle</div>
          <div class="section-content">
            ${driver.vehicle.model} • ${driver.vehicle.color}
          </div>
        </div>

        <!-- Specialties -->
        <div class="info-section">
          <div class="section-title">Specialties</div>
          <div class="specialty-tags">
            ${driver.specialties.map(s => `<span class="specialty-tag">${s}</span>`).join('')}
          </div>
        </div>

        <!-- Availability -->
        <div class="info-section availability">
          <div class="section-title">📅 ${availabilityText}</div>
          <div class="section-content">Service radius: ${driver.serviceArea.radius} miles</div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="btn btn-primary" onclick="window.__handleDriverAction('book', '${driver.name}')">
            Book Now
          </button>
          <button class="btn btn-secondary" onclick="window.__handleDriverAction('schedule', '${driver.name}')">
            Schedule
          </button>
          <button class="btn btn-secondary" onclick="window.__handleDriverAction('details', '${driver.name}')">
            Details
          </button>
        </div>
      </div>
    `;
  }

  // Render carousel navigation
  function renderCarouselNav(drivers, isDark) {
    if (drivers.length <= 1) return '';

    return `
      <div class="carousel-nav">
        <button class="nav-btn" onclick="window.__navigateDrivers('prev')">‹</button>
        <div class="carousel-dots">
          ${drivers.map((_, i) => `
            <div class="dot ${i === currentDriverIndex ? 'active' : ''}"
                 onclick="window.__goToDriver(${i})"></div>
          `).join('')}
        </div>
        <button class="nav-btn" onclick="window.__navigateDrivers('next')">›</button>
      </div>
      <div class="carousel-counter">Driver ${currentDriverIndex + 1} of ${drivers.length}</div>
    `;
  }

  // Main render function
  function renderApp() {
    const drivers = getDrivers();
    const theme = getTheme();
    const isDark = theme === 'dark';
    const root = document.getElementById('root');

    if (!root) {
      console.error('Root element not found');
      return;
    }

    if (drivers.length === 0) {
      root.innerHTML = '<div class="empty-state">No drivers available</div>';
      return;
    }

    const currentDriver = drivers[currentDriverIndex] || drivers[0];

    root.innerHTML = `
      <div class="app-container ${isDark ? 'dark' : 'light'}">
        ${renderDriverCard(currentDriver, theme)}
        ${renderCarouselNav(drivers, isDark)}
      </div>
    `;
  }

  // Expose functions to global scope
  window.__navigateDrivers = navigateDrivers;
  window.__goToDriver = function(index) {
    currentDriverIndex = index;
    renderApp();
  };
  window.__handleDriverAction = handleDriverAction;

  // Initial render
  renderApp();

  // Listen for theme changes
  window.addEventListener('openai:set_globals', function() {
    renderApp();
  });
})();
