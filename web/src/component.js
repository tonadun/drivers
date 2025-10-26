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
  let bookingState = null; // Track booking: { instructor, selectedDate, packageHours, email }
  let showPaymentDialog = false;

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
      // Open payment dialog
      bookingState = {
        instructor,
        selectedDate: null,
        packageHours: 1,
        email: ''
      };
      showPaymentDialog = true;
      render();
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
                      onclick="window.__bookDate(${JSON.stringify(instructor).replace(/"/g, '&quot;')}, '${date.toDateString()}')"
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

  const bookDate = (instructor, dateString) => {
    // Remember selected date and open payment dialog
    bookingState = {
      instructor,
      selectedDate: dateString,
      packageHours: 1,
      email: ''
    };
    showPaymentDialog = true;
    closeCalendar();
  };

  // Render payment dialog
  const renderPaymentDialog = () => {
    if (!bookingState) return '';

    const { instructor, selectedDate, packageHours, email } = bookingState;
    const packages = [
      { hours: 1, discount: 0 },
      { hours: 2, discount: 0 },
      { hours: 4, discount: 5 },
      { hours: 10, discount: 10 },
      { hours: 20, discount: 15 }
    ];

    const selectedPackage = packages.find(p => p.hours === packageHours) || packages[0];
    const basePrice = instructor.pricePerHour * packageHours;
    const discount = (basePrice * selectedPackage.discount) / 100;
    const totalCost = basePrice - discount;

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
        z-index: 2000;
        padding: 20px;
      " onclick="if(event.target === this) window.__closePaymentDialog()">
        <div style="
          background: white;
          border-radius: 12px;
          max-width: 500px;
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
          ">
            <div>
              <h2 style="margin: 0; font-size: 20px; color: #1a1a1a;">Book Lessons</h2>
              <div style="font-size: 14px; color: #666; margin-top: 4px;">
                with ${instructor.name}
              </div>
            </div>
            <button onclick="window.__closePaymentDialog()" style="
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

          <!-- Content -->
          <div style="padding: 24px;">

            <!-- Selected Date (if any) -->
            ${selectedDate ? `
              <div style="
                padding: 12px 16px;
                background: #F0F8FF;
                border-left: 4px solid #1E90FF;
                border-radius: 4px;
                margin-bottom: 24px;
              ">
                <div style="font-size: 13px; color: #666; margin-bottom: 2px;">Selected Date</div>
                <div style="font-size: 15px; font-weight: 600; color: #1a1a1a;">${selectedDate}</div>
              </div>
            ` : ''}

            <!-- Package Selection -->
            <div style="margin-bottom: 24px;">
              <label style="display: block; font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px;">
                Select Package
              </label>
              <div style="display: grid; gap: 10px;">
                ${packages.map(pkg => {
                  const pkgBasePrice = instructor.pricePerHour * pkg.hours;
                  const pkgDiscount = (pkgBasePrice * pkg.discount) / 100;
                  const pkgTotal = pkgBasePrice - pkgDiscount;
                  const isSelected = packageHours === pkg.hours;

                  return `
                    <div onclick="window.__updateBookingField('packageHours', ${pkg.hours})" style="
                      padding: 16px;
                      border: 2px solid ${isSelected ? '#1E90FF' : '#E0E0E0'};
                      background: ${isSelected ? '#F0F8FF' : 'white'};
                      border-radius: 8px;
                      cursor: pointer;
                      transition: all 0.2s;
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                    "
                    onmouseover="if(!${isSelected}) { this.style.borderColor='#B0B0B0'; this.style.background='#F9F9F9'; }"
                    onmouseout="if(!${isSelected}) { this.style.borderColor='#E0E0E0'; this.style.background='white'; }">
                      <div>
                        <div style="font-size: 16px; font-weight: 600; color: #1a1a1a;">
                          ${pkg.hours} Hour${pkg.hours > 1 ? 's' : ''}
                        </div>
                        ${pkg.discount > 0 ? `
                          <div style="font-size: 12px; color: #4CAF50; margin-top: 2px;">
                            Save ${pkg.discount}%
                          </div>
                        ` : ''}
                      </div>
                      <div style="text-align: right;">
                        <div style="font-size: 18px; font-weight: 700; color: #1E90FF;">
                          £${pkgTotal.toFixed(2)}
                        </div>
                        ${pkg.discount > 0 ? `
                          <div style="font-size: 12px; color: #999; text-decoration: line-through;">
                            £${pkgBasePrice.toFixed(2)}
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Email Input -->
            <div style="margin-bottom: 24px;">
              <label style="display: block; font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px;">
                Email Address
              </label>
              <input
                type="email"
                value="${email}"
                oninput="window.__updateBookingField('email', this.value)"
                placeholder="your.email@example.com"
                style="
                  width: 100%;
                  padding: 12px 16px;
                  border: 2px solid #E0E0E0;
                  border-radius: 8px;
                  font-size: 15px;
                  box-sizing: border-box;
                  transition: border-color 0.2s;
                "
                onfocus="this.style.borderColor='#1E90FF'"
                onblur="this.style.borderColor='#E0E0E0'"
              />
            </div>

            <!-- Summary -->
            <div style="
              padding: 16px;
              background: #F9F9F9;
              border-radius: 8px;
              margin-bottom: 24px;
            ">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #666; font-size: 14px;">Package:</span>
                <span style="color: #1a1a1a; font-size: 14px; font-weight: 600;">${packageHours} Hour${packageHours > 1 ? 's' : ''}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #666; font-size: 14px;">Rate:</span>
                <span style="color: #1a1a1a; font-size: 14px;">£${instructor.pricePerHour}/hour</span>
              </div>
              ${selectedPackage.discount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #4CAF50; font-size: 14px;">Discount:</span>
                  <span style="color: #4CAF50; font-size: 14px; font-weight: 600;">-£${discount.toFixed(2)}</span>
                </div>
              ` : ''}
              <div style="
                display: flex;
                justify-content: space-between;
                padding-top: 12px;
                border-top: 1px solid #E0E0E0;
                margin-top: 12px;
              ">
                <span style="color: #1a1a1a; font-size: 16px; font-weight: 600;">Total:</span>
                <span style="color: #1E90FF; font-size: 20px; font-weight: 700;">£${totalCost.toFixed(2)}</span>
              </div>
            </div>

            <!-- Pay Button -->
            <button onclick="window.__processPayment()" id="payment-button" style="
              width: 100%;
              padding: 16px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            "
            onmouseover="if(!this.disabled) { this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)'; }"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
              <span id="button-text">Pay £${totalCost.toFixed(2)}</span>
            </button>

            <!-- Security Notice -->
            <div style="
              margin-top: 16px;
              padding: 12px;
              background: #FFF9E6;
              border-radius: 6px;
              text-align: center;
              font-size: 12px;
              color: #666;
            ">
              🔒 Secure payment powered by Stripe
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const closePaymentDialog = () => {
    showPaymentDialog = false;
    bookingState = null;
    render();
  };

  const updateBookingField = (field, value) => {
    if (bookingState) {
      bookingState[field] = value;
      render();
    }
  };

  const processPayment = async () => {
    if (!bookingState || !bookingState.email) {
      alert('Please enter your email address');
      return;
    }

    const { instructor, selectedDate, packageHours, email } = bookingState;
    const button = document.getElementById('payment-button');
    const buttonText = document.getElementById('button-text');

    try {
      // Disable button and show loading
      button.disabled = true;
      buttonText.textContent = 'Creating payment link...';

      // Create Stripe Checkout Session (for external link)
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructorId: instructor.id,
          packageHours,
          email,
          selectedDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Payment failed');
      }

      // Use window.openai.openExternal to open Stripe Checkout in new window
      if (data.url && window.openai?.openExternal) {
        window.openai.openExternal({ href: data.url });
        closePaymentDialog();
        if (window.openai?.sendFollowupMessage) {
          window.openai.sendFollowupMessage({
            prompt: `Opening payment page for ${packageHours} hour${packageHours > 1 ? 's' : ''} with ${instructor.name}. Please complete payment in the new window.`
          });
        }
      } else {
        throw new Error('Unable to open payment page');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(`Payment error: ${error.message}`);
      button.disabled = false;
      buttonText.textContent = `Pay £${(instructor.pricePerHour * packageHours).toFixed(2)}`;
    }
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

      <!-- Payment Modal -->
      ${showPaymentDialog ? renderPaymentDialog() : ''}
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
  window.__closePaymentDialog = closePaymentDialog;
  window.__updateBookingField = updateBookingField;
  window.__processPayment = processPayment;

  // Initial render
  render();

  // Listen for theme changes
  window.addEventListener('openai:set_globals', () => {
    render();
  });
})();
