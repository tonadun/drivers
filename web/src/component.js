// Driver profile carousel component
(function() {
  let currentIndex = 0;

  // Get data from window.openai.toolOutput
  const getData = () => {
    const toolOutput = window.openai?.toolOutput;
    return toolOutput?.drivers || [];
  };

  const getTheme = () => {
    return window.openai?.theme || 'light';
  };

  // Navigate between drivers
  const navigate = (direction) => {
    const drivers = getData();
    if (direction === 'next') {
      currentIndex = (currentIndex + 1) % drivers.length;
    } else {
      currentIndex = (currentIndex - 1 + drivers.length) % drivers.length;
    }
    render();
  };

  // Action button handlers
  const handleAction = (action, driver) => {
    if (action === 'book') {
      if (window.openai?.sendFollowupMessage) {
        window.openai.sendFollowupMessage(`I want to book ${driver.name} for a ride`);
      }
    } else if (action === 'view-schedule') {
      if (window.openai?.sendFollowupMessage) {
        window.openai.sendFollowupMessage(`Show me ${driver.name}'s full availability schedule`);
      }
    } else if (action === 'contact') {
      alert(`Contact ${driver.name} - Phone: (555) 123-4567`);
    }
  };

  // Generate star rating
  const renderStars = (rating, isDark) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const starColor = isDark ? '#FFD700' : '#FF8C00';

    let stars = '';
    for (let i = 0; i < fullStars; i++) {
      stars += `<span style="color: ${starColor}; font-size: 16px;">★</span>`;
    }
    if (hasHalfStar) {
      stars += `<span style="color: ${starColor}; font-size: 16px;">⯨</span>`;
    }
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars += `<span style="color: ${isDark ? '#666' : '#ddd'}; font-size: 16px;">★</span>`;
    }
    return stars;
  };

  // Render driver card
  const renderDriver = (driver, theme) => {
    const isDark = theme === 'dark';

    const gradient = isDark
      ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)';

    const textColor = isDark ? '#FFFFFF' : '#FFFFFF';
    const subtextColor = isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.95)';
    const badgeBg = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.25)';
    const badgeText = isDark ? '#FFFFFF' : '#FFFFFF';
    const sectionBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.2)';
    const buttonBg = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.3)';
    const buttonHover = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.45)';

    // Format availability for today
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const todaySlots = driver.availability[today] || [];
    const availabilityText = todaySlots.length > 0
      ? `Available today: ${todaySlots.join(', ')}`
      : 'Not available today';

    return `
      <div style="
        background: ${gradient};
        border-radius: 16px;
        padding: 24px;
        color: ${textColor};
        box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 100%;
        margin: 0 auto;
      ">
        <!-- Driver Header -->
        <div style="display: flex; gap: 16px; margin-bottom: 20px; align-items: center;">
          <img src="${driver.photo}" alt="${driver.name}" style="
            width: 80px;
            height: 80px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid rgba(255, 255, 255, 0.3);
          ">
          <div style="flex: 1;">
            <h2 style="
              margin: 0 0 8px 0;
              font-size: 22px;
              font-weight: 700;
              line-height: 1.2;
            ">${driver.name}</h2>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              ${renderStars(driver.rating, isDark)}
              <span style="font-size: 14px; font-weight: 600;">${driver.rating}/5.0</span>
              <span style="font-size: 13px; opacity: 0.8;">(${driver.totalRides} rides)</span>
            </div>
            <div style="font-size: 13px; opacity: 0.9;">
              ${driver.yearsExperience} years experience
            </div>
          </div>
        </div>

        <!-- Quick Info Badges -->
        <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
          <span style="
            background: ${badgeBg};
            color: ${badgeText};
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
          ">🚗 ${driver.vehicle.type}</span>
          <span style="
            background: ${badgeBg};
            color: ${badgeText};
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
          ">📍 ${driver.serviceArea.city}, ${driver.serviceArea.state}</span>
          <span style="
            background: ${badgeBg};
            color: ${badgeText};
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
          ">💰 $${driver.hourlyRate}/hr</span>
        </div>

        <!-- Vehicle Info -->
        <div style="
          background: ${sectionBg};
          padding: 14px;
          border-radius: 10px;
          margin-bottom: 14px;
        ">
          <div style="font-size: 12px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
            🚙 Vehicle
          </div>
          <div style="font-size: 14px; line-height: 1.6;">
            <strong>${driver.vehicle.model}</strong><br>
            ${driver.vehicle.color} ${driver.vehicle.type} • ${driver.vehicle.licensePlate}
          </div>
        </div>

        <!-- Bio -->
        <div style="
          background: ${sectionBg};
          padding: 14px;
          border-radius: 10px;
          margin-bottom: 14px;
        ">
          <div style="font-size: 12px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
            👤 About
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: ${subtextColor};">
            ${driver.bio}
          </div>
        </div>

        <!-- Specialties -->
        <div style="
          background: ${sectionBg};
          padding: 14px;
          border-radius: 10px;
          margin-bottom: 14px;
        ">
          <div style="font-size: 12px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
            ⭐ Specialties
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${driver.specialties.map(specialty => `
              <span style="
                background: rgba(255, 255, 255, 0.15);
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 12px;
              ">${specialty}</span>
            `).join('')}
          </div>
        </div>

        <!-- Languages -->
        <div style="
          background: ${sectionBg};
          padding: 14px;
          border-radius: 10px;
          margin-bottom: 14px;
        ">
          <div style="font-size: 12px; font-weight: 700; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            🌐 Languages
          </div>
          <div style="font-size: 13px;">
            ${driver.languages.join(' • ')}
          </div>
        </div>

        <!-- Availability -->
        <div style="
          background: ${sectionBg};
          padding: 14px;
          border-radius: 10px;
          margin-bottom: 16px;
          border-left: 3px solid ${isDark ? '#4CAF50' : '#8BC34A'};
        ">
          <div style="font-size: 12px; font-weight: 700; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            📅 ${availabilityText}
          </div>
          <div style="font-size: 12px; opacity: 0.8;">
            Service area: ${driver.serviceArea.radius} mile radius
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 20px;
        ">
          <button onclick="window.handleDriverAction('book', ${JSON.stringify(driver).replace(/"/g, '&quot;')})" style="
            background: ${buttonBg};
            color: ${textColor};
            border: 2px solid rgba(255, 255, 255, 0.3);
            padding: 12px 16px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
          " onmouseover="this.style.background='${buttonHover}'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='${buttonBg}'; this.style.transform='translateY(0)'">
            📅 Book Now
          </button>
          <button onclick="window.handleDriverAction('view-schedule', ${JSON.stringify(driver).replace(/"/g, '&quot;')})" style="
            background: ${buttonBg};
            color: ${textColor};
            border: 2px solid rgba(255, 255, 255, 0.3);
            padding: 12px 16px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
          " onmouseover="this.style.background='${buttonHover}'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='${buttonBg}'; this.style.transform='translateY(0)'">
            🕐 Schedule
          </button>
          <button onclick="window.handleDriverAction('contact', ${JSON.stringify(driver).replace(/"/g, '&quot;')})" style="
            background: ${buttonBg};
            color: ${textColor};
            border: 2px solid rgba(255, 255, 255, 0.3);
            padding: 12px 16px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
          " onmouseover="this.style.background='${buttonHover}'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='${buttonBg}'; this.style.transform='translateY(0)'">
            📞 Contact
          </button>
        </div>
      </div>
    `;
  };

  // Render carousel
  const render = () => {
    const drivers = getData();
    const theme = getTheme();

    if (!drivers || drivers.length === 0) {
      document.getElementById('root').innerHTML = '<p style="text-align: center; padding: 20px;">No drivers available</p>';
      return;
    }

    const isDark = theme === 'dark';
    const navButtonBg = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(102, 126, 234, 0.3)';
    const navButtonColor = isDark ? '#FFFFFF' : '#FFFFFF';
    const dotColor = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(102, 126, 234, 0.3)';
    const dotActiveColor = isDark ? '#FFFFFF' : '#667eea';

    document.getElementById('root').innerHTML = `
      <div style="
        max-width: 700px;
        margin: 0 auto;
        position: relative;
        padding: 0 0 20px 0;
      ">
        <!-- Drivers Container -->
        <div style="
          overflow: hidden;
          position: relative;
        ">
          <div style="
            display: flex;
            transition: transform 0.3s ease-in-out;
            transform: translateX(-${currentIndex * 100}%);
          ">
            ${drivers.map(driver => `
              <div style="
                min-width: 100%;
                padding: 0 4px;
                box-sizing: border-box;
              ">
                ${renderDriver(driver, theme)}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Navigation -->
        ${drivers.length > 1 ? `
        <div style="
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 16px;
        ">
          <button onclick="window.navigateDrivers('prev')" style="
            background: ${navButtonBg};
            color: ${navButtonColor};
            border: 2px solid rgba(255, 255, 255, 0.3);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            ‹
          </button>

          <!-- Dots -->
          <div style="display: flex; gap: 8px;">
            ${drivers.map((_, i) => `
              <div onclick="window.goToDriver(${i})" style="
                width: ${i === currentIndex ? '28px' : '10px'};
                height: 10px;
                border-radius: 5px;
                background: ${i === currentIndex ? dotActiveColor : dotColor};
                cursor: pointer;
                transition: all 0.3s;
              "></div>
            `).join('')}
          </div>

          <button onclick="window.navigateDrivers('next')" style="
            background: ${navButtonBg};
            color: ${navButtonColor};
            border: 2px solid rgba(255, 255, 255, 0.3);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            ›
          </button>
        </div>

        <!-- Driver Counter -->
        <div style="
          text-align: center;
          margin-top: 12px;
          font-size: 13px;
          color: ${isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          Driver ${currentIndex + 1} of ${drivers.length}
        </div>
        ` : ''}
      </div>
    `;
  };

  // Expose functions to global scope for button handlers
  window.navigateDrivers = navigate;
  window.goToDriver = (index) => {
    currentIndex = index;
    render();
  };
  window.handleDriverAction = (action, driver) => {
    handleAction(action, driver);
  };

  // Initial render
  render();

  // Listen for theme changes
  window.addEventListener('openai:set_globals', () => {
    render();
  });
})();
