// UK Driving Instructor Finder with Filters and Sorting
(function() {
  let currentPage = 0;
  const itemsPerPage = 3;

  // Filter and sort state
  let filters = {
    transmission: 'All', // Manual, Automatic, All
    time: 'Anytime', // Anytime, AM, PM
    day: 'Anytime', // Weekday, Weekend, Custom, Anytime
    gender: 'All' // Male, Female, All
  };

  let sortBy = 'Featured'; // Featured, Price Low, Price High, Rating Low, Rating High
  let showFilters = false;
  let selectedInstructorForCalendar = null; // Track which instructor's calendar is shown

  // Get data from window.openai.toolOutput
  const getData = () => {
    const toolOutput = window.openai?.toolOutput;
    return toolOutput?.drivers || [];
  };

  const getTheme = () => {
    return window.openai?.theme || 'light';
  };

  // Filter drivers based on selected filters
  const filterDrivers = (drivers) => {
    return drivers.filter(driver => {
      // Transmission filter
      if (filters.transmission !== 'All' && driver.transmission !== filters.transmission) {
        return false;
      }

      // Time filter
      if (filters.time !== 'Anytime' && !driver.timePreference.includes(filters.time)) {
        return false;
      }

      // Day filter
      if (filters.day === 'Weekday') {
        const hasWeekday = driver.weeklyAvailability.monday || driver.weeklyAvailability.tuesday ||
                          driver.weeklyAvailability.wednesday || driver.weeklyAvailability.thursday ||
                          driver.weeklyAvailability.friday;
        if (!hasWeekday) return false;
      } else if (filters.day === 'Weekend') {
        const hasWeekend = driver.weeklyAvailability.saturday || driver.weeklyAvailability.sunday;
        if (!hasWeekend) return false;
      }

      // Gender filter
      if (filters.gender !== 'All' && driver.gender !== filters.gender) {
        return false;
      }

      return true;
    });
  };

  // Sort drivers
  const sortDrivers = (drivers) => {
    const sorted = [...drivers];
    switch(sortBy) {
      case 'Price Low':
        return sorted.sort((a, b) => a.pricePerHour - b.pricePerHour);
      case 'Price High':
        return sorted.sort((a, b) => b.pricePerHour - a.pricePerHour);
      case 'Rating Low':
        return sorted.sort((a, b) => a.rating - b.rating);
      case 'Rating High':
        return sorted.sort((a, b) => b.rating - a.rating);
      default:
        return sorted; // Featured (default order)
    }
  };

  // Get processed drivers
  const getProcessedDrivers = () => {
    let drivers = getData();
    drivers = filterDrivers(drivers);
    drivers = sortDrivers(drivers);
    return drivers;
  };

  // Pagination
  const nextPage = () => {
    const drivers = getProcessedDrivers();
    const maxPage = Math.ceil(drivers.length / itemsPerPage) - 1;
    if (currentPage < maxPage) {
      currentPage++;
      render();
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      currentPage--;
      render();
    }
  };

  // Filter handlers
  const setTransmissionFilter = (value) => {
    filters.transmission = value;
    currentPage = 0;
    render();
  };

  const toggleFilters = () => {
    showFilters = !showFilters;
    render();
  };

  const updateFilter = (filterType, value) => {
    filters[filterType] = value;
    currentPage = 0;
    render();
  };

  const updateSort = (value) => {
    sortBy = value;
    currentPage = 0;
    render();
  };

  // Action handlers
  const handleAction = (action, instructor) => {
    if (action === 'book') {
      if (window.openai?.sendFollowupMessage) {
        window.openai.sendFollowupMessage({ prompt: `I want to book lessons with ${instructor.name}` });
      }
    } else if (action === 'availability') {
      selectedInstructorForCalendar = instructor;
      render();
    }
  };

  const closeCalendar = () => {
    selectedInstructorForCalendar = null;
    render();
  };

  // Generate calendar for next 4 weeks
  const renderCalendar = (instructor) => {
    const today = new Date();
    const weeks = [];

    // Generate 4 weeks starting from today
    for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
      const week = [];
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date(today);
        date.setDate(today.getDate() + (weekOffset * 7) + dayOffset);
        week.push(date);
      }
      weeks.push(week);
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    const monthYear = `${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`;

    return `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
      " onclick="if(event.target === this) window.__closeCalendar()">
        <div style="
          background: white;
          border-radius: 12px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        " onclick="event.stopPropagation()">

          <!-- Header -->
          <div style="
            padding: 24px;
            border-bottom: 1px solid #E0E0E0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            background: white;
            z-index: 10;
          ">
            <div>
              <h2 style="margin: 0; font-size: 20px; color: #1a1a1a;">${instructor.name}'s Availability</h2>
              <div style="font-size: 14px; color: #666; margin-top: 4px;">
                ${instructor.transmission} • £${instructor.pricePerHour}/hour • ${instructor.area}
              </div>
            </div>
            <button onclick="window.__closeCalendar()" style="
              background: transparent;
              border: none;
              font-size: 28px;
              cursor: pointer;
              color: #666;
              line-height: 1;
              padding: 0;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">&times;</button>
          </div>

          <!-- Time Preference Notice -->
          <div style="padding: 16px 24px; background: #F0F8FF; border-left: 4px solid #1E90FF; margin: 16px 24px;">
            <div style="font-size: 14px; color: #1a1a1a;">
              <strong>Preferred Times:</strong> ${instructor.timePreference.join(', ')}
            </div>
          </div>

          <!-- Calendar -->
          <div style="padding: 24px;">
            <div style="font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #1a1a1a;">
              ${monthYear}
            </div>

            <!-- Day Headers -->
            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 8px;">
              ${dayNames.map(day => `
                <div style="text-align: center; font-size: 12px; font-weight: 600; color: #666; padding: 8px 0;">
                  ${day}
                </div>
              `).join('')}
            </div>

            <!-- Calendar Grid -->
            ${weeks.map((week, weekIndex) => `
              <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 8px;">
                ${week.map((date, dayIndex) => {
                  const dayOfWeek = date.getDay();
                  const dayKey = dayKeys[dayOfWeek];
                  const isAvailable = instructor.weeklyAvailability[dayKey];
                  const isPast = date < today && date.toDateString() !== today.toDateString();
                  const isToday = date.toDateString() === today.toDateString();

                  return `
                    <div style="
                      aspect-ratio: 1;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: center;
                      border-radius: 8px;
                      border: 2px solid ${isToday ? '#1E90FF' : (isAvailable && !isPast ? '#E0E0E0' : 'transparent')};
                      background: ${isPast ? '#F5F5F5' : (isAvailable ? '#F0F8FF' : 'white')};
                      cursor: ${isAvailable && !isPast ? 'pointer' : 'default'};
                      opacity: ${isPast ? '0.5' : '1'};
                      transition: all 0.2s;
                      position: relative;
                    "
                    ${isAvailable && !isPast ? `
                      onmouseover="this.style.background='#E3F2FD'; this.style.borderColor='#1E90FF'"
                      onmouseout="this.style.background='#F0F8FF'; this.style.borderColor='${isToday ? '#1E90FF' : '#E0E0E0'}'"
                      onclick="window.__bookDate('${instructor.name}', '${date.toDateString()}')"
                    ` : ''}>
                      <div style="font-size: 14px; font-weight: ${isToday ? '700' : '500'}; color: ${isPast ? '#999' : '#1a1a1a'};">
                        ${date.getDate()}
                      </div>
                      ${isAvailable && !isPast ? `
                        <div style="width: 6px; height: 6px; border-radius: 50%; background: #4CAF50; margin-top: 4px;"></div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            `).join('')}

            <!-- Legend -->
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E0E0E0;">
              <div style="display: flex; gap: 24px; flex-wrap: wrap; font-size: 13px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 12px; height: 12px; border-radius: 50%; background: #4CAF50;"></div>
                  <span style="color: #666;">Available</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 12px; height: 12px; border-radius: 50%; background: #E0E0E0;"></div>
                  <span style="color: #666;">Not Available</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 12px; height: 12px; border: 2px solid #1E90FF; border-radius: 50%;"></div>
                  <span style="color: #666;">Today</span>
                </div>
              </div>
            </div>

            <!-- Note -->
            <div style="margin-top: 16px; padding: 12px; background: #FFF9E6; border-radius: 6px; font-size: 13px; color: #666;">
              <strong>Note:</strong> This calendar shows typical weekly availability. Click on an available date to book a lesson.
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const bookDate = (instructorName, dateString) => {
    if (window.openai?.sendFollowupMessage) {
      window.openai.sendFollowupMessage({
        prompt: `I want to book a lesson with ${instructorName} on ${dateString}`
      });
    }
    closeCalendar();
  };

  // Render weekday circles
  const renderWeekdayCircles = (availability) => {
    const days = [
      { key: 'monday', label: 'M' },
      { key: 'tuesday', label: 'T' },
      { key: 'wednesday', label: 'W' },
      { key: 'thursday', label: 'T' },
      { key: 'friday', label: 'F' },
      { key: 'saturday', label: 'S' },
      { key: 'sunday', label: 'S' }
    ];

    return days.map(day => {
      const isAvailable = availability[day.key];
      return `
        <div style="
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: ${isAvailable ? '#1E90FF' : '#E0E0E0'};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
        ">${day.label}</div>
      `;
    }).join('');
  };

  // Render instructor card
  const renderInstructorCard = (instructor) => {
    return `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin-bottom: 16px;
      ">
        <div style="display: flex; gap: 16px;">
          <!-- Profile Photo with Badge -->
          <div style="position: relative; flex-shrink: 0;">
            ${instructor.verified ? `
            <div style="
              position: absolute;
              top: -8px;
              left: -8px;
              background: #FFD700;
              color: #000;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              z-index: 1;
            ">HIGH DEMAND</div>
            ` : ''}
            <img src="${instructor.photo}" alt="${instructor.name}" style="
              width: 100px;
              height: 100px;
              border-radius: 50%;
              object-fit: cover;
            ">
          </div>

          <!-- Instructor Info -->
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #000;">${instructor.name}</h3>
              ${instructor.verified ? `
              <span style="
                background: #FFD700;
                color: #000;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
              ">✓ Verified</span>
              ` : ''}
            </div>

            <!-- Price, Rating, Reviews -->
            <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="color: #1E90FF; font-size: 14px;">ℹ️</span>
                <span style="color: #666; font-size: 14px;">From £${instructor.pricePerHour} per hour</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="color: #1E90FF; font-size: 14px;">⭐</span>
                <span style="color: #666; font-size: 14px;">${instructor.rating.toFixed(2)} Rating</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="color: #1E90FF; font-size: 14px;">👥</span>
                <span style="color: #666; font-size: 14px;">${instructor.totalReviews} Reviews</span>
              </div>
            </div>

            <!-- Transmission Badge -->
            <div style="margin-bottom: 12px;">
              <span style="
                background: #E3F2FD;
                color: #1E90FF;
                padding: 4px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
              ">${instructor.transmission}</span>
            </div>
          </div>
        </div>

        <!-- Usual Availability -->
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #E0E0E0;">
          <div style="font-size: 12px; color: #666; margin-bottom: 8px;">Usual availability</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${renderWeekdayCircles(instructor.weeklyAvailability)}
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px;">
          <button onclick="window.__handleInstructorAction('book', ${JSON.stringify(instructor).replace(/"/g, '&quot;')})" style="
            background: #FFD700;
            color: #000;
            border: none;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          " onmouseover="this.style.background='#FFC700'" onmouseout="this.style.background='#FFD700'">
            Book Now
          </button>
          <button onclick="window.__handleInstructorAction('availability', ${JSON.stringify(instructor).replace(/"/g, '&quot;')})" style="
            background: #1E90FF;
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          " onmouseover="this.style.background='#1C7ED6'" onmouseout="this.style.background='#1E90FF'">
            View Availability
          </button>
        </div>
      </div>
    `;
  };

  // Main render
  const render = () => {
    const allDrivers = getData();
    const processedDrivers = getProcessedDrivers();
    const theme = getTheme();
    const isDark = theme === 'dark';

    if (!allDrivers || allDrivers.length === 0) {
      document.getElementById('root').innerHTML = '<p style="text-align: center; padding: 20px;">No instructors available</p>';
      return;
    }

    // Pagination
    const startIdx = currentPage * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const currentDrivers = processedDrivers.slice(startIdx, endIdx);
    const totalPages = Math.ceil(processedDrivers.length / itemsPerPage);

    document.getElementById('root').innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">

        <!-- Manual/Automatic Toggle -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <button onclick="window.__setTransmissionFilter('Manual')" style="
            background: ${filters.transmission === 'Manual' ? '#1E90FF' : 'white'};
            color: ${filters.transmission === 'Manual' ? 'white' : '#666'};
            border: 2px solid ${filters.transmission === 'Manual' ? '#1E90FF' : '#E0E0E0'};
            padding: 14px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          ">Manual</button>
          <button onclick="window.__setTransmissionFilter('Automatic')" style="
            background: ${filters.transmission === 'Automatic' ? '#1E90FF' : 'white'};
            color: ${filters.transmission === 'Automatic' ? 'white' : '#666'};
            border: 2px solid ${filters.transmission === 'Automatic' ? '#1E90FF' : '#E0E0E0'};
            padding: 14px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          ">Automatic</button>
        </div>

        <!-- Results Count -->
        <div style="margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: ${isDark ? '#FFF' : '#1E90FF'};">
            ${processedDrivers.length} local instructor${processedDrivers.length !== 1 ? 's' : ''} available
          </h2>
        </div>

        <!-- Sort and Filter Row -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: ${isDark ? '#FFF' : '#666'}; font-size: 14px;">Sort by</span>
            <select onchange="window.__updateSort(this.value)" style="
              padding: 8px 12px;
              border: 1px solid #E0E0E0;
              border-radius: 6px;
              font-size: 14px;
              cursor: pointer;
              background: white;
            ">
              <option value="Featured" ${sortBy === 'Featured' ? 'selected' : ''}>Featured</option>
              <option value="Price Low" ${sortBy === 'Price Low' ? 'selected' : ''}>Price: Low to High</option>
              <option value="Price High" ${sortBy === 'Price High' ? 'selected' : ''}>Price: High to Low</option>
              <option value="Rating High" ${sortBy === 'Rating High' ? 'selected' : ''}>Rating: High to Low</option>
              <option value="Rating Low" ${sortBy === 'Rating Low' ? 'selected' : ''}>Rating: Low to High</option>
            </select>
          </div>
          <button onclick="window.__toggleFilters()" style="
            background: white;
            color: #1E90FF;
            border: 1px solid #E0E0E0;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
          ">
            <span>≡</span> Filter
          </button>
        </div>

        <!-- Filter Panel -->
        ${showFilters ? `
        <div style="
          background: white;
          border: 1px solid #E0E0E0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 16px;
        ">
          <!-- Transmission Filter -->
          <div style="margin-bottom: 16px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #000;">Transmission</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${['All', 'Auto', 'Manual'].map(t => `
                <button onclick="window.__updateFilter('transmission', '${t === 'Auto' ? 'Automatic' : t}')" style="
                  background: ${filters.transmission === (t === 'Auto' ? 'Automatic' : t) ? '#1E90FF' : 'white'};
                  color: ${filters.transmission === (t === 'Auto' ? 'Automatic' : t) ? 'white' : '#666'};
                  border: 1px solid #E0E0E0;
                  padding: 6px 12px;
                  border-radius: 6px;
                  font-size: 13px;
                  cursor: pointer;
                ">${t}</button>
              `).join('')}
            </div>
          </div>

          <!-- Time Filter -->
          <div style="margin-bottom: 16px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #000;">Time</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${['Anytime', 'AM', 'PM'].map(t => `
                <button onclick="window.__updateFilter('time', '${t}')" style="
                  background: ${filters.time === t ? '#1E90FF' : 'white'};
                  color: ${filters.time === t ? 'white' : '#666'};
                  border: 1px solid #E0E0E0;
                  padding: 6px 12px;
                  border-radius: 6px;
                  font-size: 13px;
                  cursor: pointer;
                ">${t}</button>
              `).join('')}
            </div>
          </div>

          <!-- Day Filter -->
          <div style="margin-bottom: 16px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #000;">Day</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${['Anytime', 'Weekday', 'Weekend'].map(d => `
                <button onclick="window.__updateFilter('day', '${d}')" style="
                  background: ${filters.day === d ? '#1E90FF' : 'white'};
                  color: ${filters.day === d ? 'white' : '#666'};
                  border: 1px solid #E0E0E0;
                  padding: 6px 12px;
                  border-radius: 6px;
                  font-size: 13px;
                  cursor: pointer;
                ">${d}</button>
              `).join('')}
            </div>
          </div>

          <!-- Gender Filter -->
          <div>
            <div style="font-weight: 600; margin-bottom: 8px; color: #000;">Gender</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${['All', 'Male', 'Female'].map(g => `
                <button onclick="window.__updateFilter('gender', '${g}')" style="
                  background: ${filters.gender === g ? '#1E90FF' : 'white'};
                  color: ${filters.gender === g ? 'white' : '#666'};
                  border: 1px solid #E0E0E0;
                  padding: 6px 12px;
                  border-radius: 6px;
                  font-size: 13px;
                  cursor: pointer;
                ">${g}</button>
              `).join('')}
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Instructor Cards -->
        ${currentDrivers.length > 0 ? currentDrivers.map(instructor => renderInstructorCard(instructor)).join('') : '<p style="text-align: center; padding: 20px; color: #666;">No instructors match your filters</p>'}

        <!-- Pagination -->
        ${totalPages > 1 ? `
        <div style="display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 20px;">
          <button onclick="window.__prevPage()" ${currentPage === 0 ? 'disabled' : ''} style="
            background: ${currentPage === 0 ? '#E0E0E0' : '#1E90FF'};
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            font-size: 18px;
            cursor: ${currentPage === 0 ? 'not-allowed' : 'pointer'};
          ">‹</button>
          <span style="color: ${isDark ? '#FFF' : '#666'}; font-size: 14px;">Page ${currentPage + 1} of ${totalPages}</span>
          <button onclick="window.__nextPage()" ${currentPage === totalPages - 1 ? 'disabled' : ''} style="
            background: ${currentPage === totalPages - 1 ? '#E0E0E0' : '#1E90FF'};
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            font-size: 18px;
            cursor: ${currentPage === totalPages - 1 ? 'not-allowed' : 'pointer'};
          ">›</button>
        </div>
        ` : ''}
      </div>

      <!-- Calendar Modal -->
      ${selectedInstructorForCalendar ? renderCalendar(selectedInstructorForCalendar) : ''}
    `;
  };

  // Expose functions to global scope
  window.__setTransmissionFilter = setTransmissionFilter;
  window.__toggleFilters = toggleFilters;
  window.__updateFilter = updateFilter;
  window.__updateSort = updateSort;
  window.__handleInstructorAction = (action, instructor) => handleAction(action, instructor);
  window.__nextPage = nextPage;
  window.__prevPage = prevPage;
  window.__closeCalendar = closeCalendar;
  window.__bookDate = bookDate;

  // Initial render
  render();

  // Listen for theme changes
  window.addEventListener('openai:set_globals', () => {
    render();
  });
})();
