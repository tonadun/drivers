// Multi-card carousel component with compact design and action buttons
(function() {
  let currentIndex = 0;

  // Get data from window.openai.toolOutput
  const getData = () => {
    const toolOutput = window.openai?.toolOutput;
    return toolOutput?.cards || [];
  };

  const getTheme = () => {
    return window.openai?.theme || 'light';
  };

  // Navigate between cards
  const navigate = (direction) => {
    const cards = getData();
    if (direction === 'next') {
      currentIndex = (currentIndex + 1) % cards.length;
    } else {
      currentIndex = (currentIndex - 1 + cards.length) % cards.length;
    }
    render();
  };

  // Action button handlers
  const handleAction = (action, card) => {
    if (action === 'learn-more') {
      // Send follow-up message to ChatGPT
      if (window.openai?.sendFollowupMessage) {
        window.openai.sendFollowupMessage(`Tell me more about ${card.occupation} techniques`);
      }
    } else if (action === 'related') {
      // Request related cards
      if (window.openai?.sendFollowupMessage) {
        window.openai.sendFollowupMessage(`Show me more cards about ${card.category}`);
      }
    } else if (action === 'share') {
      // Copy card title to clipboard
      const text = `${card.title} - Learn how ${card.occupation}s work!`;
      navigator.clipboard?.writeText(text);
      alert('Card title copied to clipboard!');
    }
  };

  // Render compact card
  const renderCard = (card, theme) => {
    const isDark = theme === 'dark';

    const gradient = isDark
      ? 'linear-gradient(135deg, #D84315 0%, #E64A19 50%, #FF6F00 100%)'
      : 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FFA559 100%)';

    const textColor = isDark ? '#FFFFFF' : '#2C2C2C';
    const subtextColor = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(44, 44, 44, 0.8)';
    const badgeBg = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.95)';
    const badgeText = isDark ? '#FFFFFF' : '#D84315';
    const stepBg = isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)';
    const buttonBg = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.9)';
    const buttonHover = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 1)';

    // Compact steps - show only first 5
    const visibleSteps = card.steps.slice(0, 5);
    const moreSteps = card.steps.length - visibleSteps.length;

    return `
      <div style="
        background: ${gradient};
        border-radius: 12px;
        padding: 20px;
        color: ${textColor};
        box-shadow: 0 4px 16px rgba(255, 107, 53, 0.25);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 100%;
        margin: 0 auto;
      ">
        <!-- Header with badges -->
        <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
          <span style="
            background: ${badgeBg};
            color: ${badgeText};
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">${card.occupation}</span>
          <span style="
            background: ${badgeBg};
            color: ${badgeText};
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
          ">${card.category}</span>
        </div>

        <!-- Title -->
        <h2 style="
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 700;
          line-height: 1.3;
        ">${card.title}</h2>

        <!-- Description -->
        <p style="
          margin: 0 0 16px 0;
          font-size: 13px;
          line-height: 1.5;
          color: ${subtextColor};
        ">${card.description}</p>

        <!-- Compact Steps -->
        <div style="margin-bottom: 16px;">
          <div style="
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">Key Steps</div>
          ${visibleSteps.map((step, i) => `
            <div style="
              background: ${stepBg};
              padding: 8px 10px;
              border-radius: 6px;
              margin-bottom: 6px;
              font-size: 12px;
              line-height: 1.4;
              display: flex;
              gap: 8px;
            ">
              <span style="
                font-weight: 700;
                min-width: 18px;
                color: ${isDark ? '#FFB74D' : '#D84315'};
              ">${i + 1}.</span>
              <span>${step}</span>
            </div>
          `).join('')}
          ${moreSteps > 0 ? `
            <div style="
              text-align: center;
              font-size: 11px;
              color: ${subtextColor};
              margin-top: 6px;
              font-style: italic;
            ">+ ${moreSteps} more step${moreSteps > 1 ? 's' : ''}</div>
          ` : ''}
        </div>

        <!-- Fun Fact & Key Takeaway in compact boxes -->
        <div style="
          background: ${stepBg};
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 8px;
          border-left: 3px solid ${isDark ? '#FFB74D' : '#D84315'};
        ">
          <div style="
            font-size: 11px;
            font-weight: 700;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">💡 Fun Fact</div>
          <div style="font-size: 12px; line-height: 1.4;">${card.funFact}</div>
        </div>

        <div style="
          background: ${stepBg};
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 16px;
          border-left: 3px solid ${isDark ? '#FFB74D' : '#D84315'};
        ">
          <div style="
            font-size: 11px;
            font-weight: 700;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">🎯 Key Takeaway</div>
          <div style="font-size: 12px; line-height: 1.4;">${card.keyTakeaway}</div>
        </div>

        <!-- Action Buttons -->
        <div style="
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 16px;
        ">
          <button onclick="window.handleCardAction('learn-more', ${JSON.stringify(card).replace(/"/g, '&quot;')})" style="
            background: ${buttonBg};
            color: ${badgeText};
            border: none;
            padding: 10px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
          " onmouseover="this.style.background='${buttonHover}'; this.style.transform='translateY(-1px)'" onmouseout="this.style.background='${buttonBg}'; this.style.transform='translateY(0)'">
            📚 Learn More
          </button>
          <button onclick="window.handleCardAction('related', ${JSON.stringify(card).replace(/"/g, '&quot;')})" style="
            background: ${buttonBg};
            color: ${badgeText};
            border: none;
            padding: 10px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
          " onmouseover="this.style.background='${buttonHover}'; this.style.transform='translateY(-1px)'" onmouseout="this.style.background='${buttonBg}'; this.style.transform='translateY(0)'">
            🔗 Related
          </button>
          <button onclick="window.handleCardAction('share', ${JSON.stringify(card).replace(/"/g, '&quot;')})" style="
            background: ${buttonBg};
            color: ${badgeText};
            border: none;
            padding: 10px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
          " onmouseover="this.style.background='${buttonHover}'; this.style.transform='translateY(-1px)'" onmouseout="this.style.background='${buttonBg}'; this.style.transform='translateY(0)'">
            📤 Share
          </button>
        </div>
      </div>
    `;
  };

  // Render carousel
  const render = () => {
    const cards = getData();
    const theme = getTheme();

    if (!cards || cards.length === 0) {
      document.getElementById('root').innerHTML = '<p>No cards available</p>';
      return;
    }

    const isDark = theme === 'dark';
    const navButtonBg = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.9)';
    const navButtonColor = isDark ? '#FFFFFF' : '#D84315';
    const dotColor = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)';
    const dotActiveColor = isDark ? '#FFFFFF' : '#D84315';

    document.getElementById('root').innerHTML = `
      <div style="
        max-width: 700px;
        margin: 0 auto;
        position: relative;
        padding: 0 0 20px 0;
      ">
        <!-- Cards Container -->
        <div style="
          overflow: hidden;
          position: relative;
        ">
          <div style="
            display: flex;
            transition: transform 0.3s ease-in-out;
            transform: translateX(-${currentIndex * 100}%);
          ">
            ${cards.map(card => `
              <div style="
                min-width: 100%;
                padding: 0 4px;
                box-sizing: border-box;
              ">
                ${renderCard(card, theme)}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Navigation -->
        <div style="
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 16px;
        ">
          <button onclick="window.navigateCarousel('prev')" style="
            background: ${navButtonBg};
            color: ${navButtonColor};
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            ‹
          </button>

          <!-- Dots -->
          <div style="display: flex; gap: 8px;">
            ${cards.map((_, i) => `
              <div onclick="window.goToCard(${i})" style="
                width: ${i === currentIndex ? '24px' : '8px'};
                height: 8px;
                border-radius: 4px;
                background: ${i === currentIndex ? dotActiveColor : dotColor};
                cursor: pointer;
                transition: all 0.3s;
              "></div>
            `).join('')}
          </div>

          <button onclick="window.navigateCarousel('next')" style="
            background: ${navButtonBg};
            color: ${navButtonColor};
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            ›
          </button>
        </div>

        <!-- Card Counter -->
        <div style="
          text-align: center;
          margin-top: 12px;
          font-size: 12px;
          color: ${isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)'};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          Card ${currentIndex + 1} of ${cards.length}
        </div>
      </div>
    `;
  };

  // Expose functions to global scope for button handlers
  window.navigateCarousel = navigate;
  window.goToCard = (index) => {
    currentIndex = index;
    render();
  };
  window.handleCardAction = (action, card) => {
    handleAction(action, card);
  };

  // Initial render
  render();

  // Listen for theme changes
  window.addEventListener('openai:set_globals', () => {
    render();
  });
})();
