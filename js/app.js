/**
 * FADED TIMES BARBERSHOP (@fadedtimeslv)
 * 3868 W Sahara Ave, Las Vegas, NV 89102
 * Interactive Website JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  initShopStatus();
  initBookingSystem();
  initLookbook();
  initFAQ();
  initVipClub();
  initMobileMenu();
  initReviewFilters();
  initSmoothScroll();
});

/* ==========================================================================
   1. REAL-TIME SHOP STATUS (LAS VEGAS TIMEZONE: PST / PDT)
   ========================================================================== */
function initShopStatus() {
  const statusBadge = document.getElementById('shop-status-badge');
  const statusText = document.getElementById('shop-status-text');
  const statusDot = document.getElementById('shop-status-dot');
  const heroStatusText = document.getElementById('hero-status-text');
  const walkinWaitText = document.getElementById('walkin-wait-text');
  const todayHoursRow = document.getElementById('today-hours-highlight');

  function updateStatus() {
    // Get current time in America/Los_Angeles (Las Vegas)
    const now = new Date();
    const lvString = now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
    const lvDate = new Date(lvString);
    const day = lvDate.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, ..., 6 = Sat
    const hour = lvDate.getHours();
    const minute = lvDate.getMinutes();
    const timeDecimal = hour + minute / 60;

    let isOpen = false;
    let closingTime = '';
    let nextOpening = '';

    // Schedule:
    // Tue-Fri (2-5): 9:00 AM - 6:00 PM (9.0 - 18.0)
    // Sat (6): 9:00 AM - 4:00 PM (9.0 - 16.0)
    // Sun (0) & Mon (1): Closed

    if (day >= 2 && day <= 5) {
      if (timeDecimal >= 9.0 && timeDecimal < 18.0) {
        isOpen = true;
        closingTime = '6:00 PM';
      } else if (timeDecimal < 9.0) {
        nextOpening = 'today at 9:00 AM';
      } else {
        nextOpening = day === 5 ? 'tomorrow (Sat) at 9:00 AM' : 'tomorrow at 9:00 AM';
      }
    } else if (day === 6) {
      if (timeDecimal >= 9.0 && timeDecimal < 16.0) {
        isOpen = true;
        closingTime = '4:00 PM';
      } else if (timeDecimal < 9.0) {
        nextOpening = 'today at 9:00 AM';
      } else {
        nextOpening = 'Tuesday at 9:00 AM';
      }
    } else {
      // Sunday or Monday
      nextOpening = 'Tuesday at 9:00 AM';
    }

    // Update Banner & Status Badges
    if (isOpen) {
      if (statusDot) {
        statusDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 pulse-green mr-2';
      }
      if (statusText) {
        statusText.innerHTML = `<span class="font-semibold text-emerald-400">OPEN NOW</span> • Closes at ${closingTime} • Walk-ins & Bookings Welcome`;
      }
      if (heroStatusText) {
        heroStatusText.innerHTML = `<span class="text-emerald-400 font-semibold">● Open Today Until ${closingTime}</span> — Walk-ins Welcome`;
      }
      if (walkinWaitText) {
        walkinWaitText.innerHTML = `Est. Walk-in Wait: <span class="text-amber-300 font-bold">~15–20 Mins</span> (3 Barbers on Chair)`;
      }
    } else {
      if (statusDot) {
        statusDot.className = 'w-2.5 h-2.5 rounded-full bg-amber-500 mr-2';
      }
      if (statusText) {
        statusText.innerHTML = `<span class="font-semibold text-amber-400">CLOSED NOW</span> • Opens ${nextOpening} • Online Booking Open 24/7`;
      }
      if (heroStatusText) {
        heroStatusText.innerHTML = `<span class="text-amber-400 font-semibold">● Closed Now</span> — Re-opens ${nextOpening} (Book Online 24/7)`;
      }
      if (walkinWaitText) {
        walkinWaitText.innerHTML = `Shop is closed. <span class="text-amber-300 font-semibold">Book ahead online for priority chair!</span>`;
      }
    }

    // Highlight current day in Hours table if present
    const dayRows = document.querySelectorAll('[data-day-index]');
    dayRows.forEach(row => {
      const rowDay = parseInt(row.getAttribute('data-day-index'), 10);
      if (rowDay === day) {
        row.classList.add('bg-amber-500/10', 'text-amber-300', 'font-semibold', 'border-l-4', 'border-amber-400');
        const badge = row.querySelector('.today-badge');
        if (badge) badge.classList.remove('hidden');
      } else {
        row.classList.remove('bg-amber-500/10', 'text-amber-300', 'font-semibold', 'border-l-4', 'border-amber-400');
        const badge = row.querySelector('.today-badge');
        if (badge) badge.classList.add('hidden');
      }
    });
  }

  updateStatus();
  setInterval(updateStatus, 60000); // Check every minute
}

/* ==========================================================================
   2. INTERACTIVE BOOKING SYSTEM & MODAL
   ========================================================================== */
const bookingState = {
  currentStep: 1,
  selectedServices: [],
  selectedBarber: 'Any Master Barber',
  selectedDate: '',
  selectedTime: '',
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  notes: '',
  totalPrice: 0,
  totalDuration: 0
};

const serviceCatalogue = {
  'haircut': { name: 'Signature Haircut (Skin Fade / Taper)', price: 40, duration: 40, icon: 'fa-scissors' },
  'haircut-beard': { name: 'Haircut & Beard Sculpting Combo', price: 50, duration: 55, icon: 'fa-user-tie' },
  'beard-trim': { name: 'Beard Trim, Shape & Hot Towel', price: 20, duration: 25, icon: 'fa-feather-pointed' },
  'kids-cut': { name: "Kid's Precision Cut (12 & under)", price: 40, duration: 35, icon: 'fa-child' },
  'lineup': { name: 'Razor Edge Lineup & Neck Taper', price: 20, duration: 20, icon: 'fa-wand-magic-sparkles' },
  'royal-shave': { name: 'Royal Hot Towel Straight Razor Shave', price: 45, duration: 40, icon: 'fa-crown' },
  'hair-design': { name: 'Custom Hair Art / Part Design', price: 15, duration: 15, icon: 'fa-signature' },
  'vip-treatment': { name: 'VIP Total Experience (Cut, Beard, Facial, Shave)', price: 65, duration: 75, icon: 'fa-gem' }
};

function initBookingSystem() {
  const modalBackdrop = document.getElementById('booking-modal');
  const closeBtn = document.getElementById('close-booking-modal');
  const step1 = document.getElementById('booking-step-1');
  const step2 = document.getElementById('booking-step-2');
  const step3 = document.getElementById('booking-step-3');
  const step4 = document.getElementById('booking-step-4');
  const confirmationScreen = document.getElementById('booking-confirmation');

  // Trigger Open Booking Buttons
  const openButtons = document.querySelectorAll('.open-booking-trigger');
  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const preselectedService = btn.getAttribute('data-service-key');
      const preselectedBarber = btn.getAttribute('data-barber-name');
      openBookingModal(preselectedService, preselectedBarber);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeBookingModal);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeBookingModal();
      }
    });
  }

  // Setup Service Checkboxes
  const serviceCheckboxes = document.querySelectorAll('.service-checkbox');
  serviceCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      updateSelectedServices();
    });
  });

  // Setup Barber Cards Selection
  const barberOptions = document.querySelectorAll('.barber-select-option');
  barberOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      barberOptions.forEach(b => b.classList.remove('border-amber-400', 'bg-amber-500/15', 'shadow-md'));
      opt.classList.add('border-amber-400', 'bg-amber-500/15', 'shadow-md');
      bookingState.selectedBarber = opt.getAttribute('data-barber') || 'Any Master Barber';
    });
  });

  // Step Navigation Buttons
  const nextToStep2 = document.getElementById('btn-next-step-2');
  const backToStep1 = document.getElementById('btn-back-step-1');
  const nextToStep3 = document.getElementById('btn-next-step-3');
  const backToStep2 = document.getElementById('btn-back-step-2');
  const nextToStep4 = document.getElementById('btn-next-step-4');
  const backToStep3 = document.getElementById('btn-back-step-3');
  const confirmBookingBtn = document.getElementById('btn-confirm-booking');

  if (nextToStep2) {
    nextToStep2.addEventListener('click', () => {
      if (bookingState.selectedServices.length === 0) {
        showToast('Please select at least one service to proceed.', 'warning');
        return;
      }
      goToStep(2);
    });
  }

  if (backToStep1) backToStep1.addEventListener('click', () => goToStep(1));

  if (nextToStep3) {
    nextToStep3.addEventListener('click', () => {
      generateDateOptions();
      goToStep(3);
    });
  }

  if (backToStep2) backToStep2.addEventListener('click', () => goToStep(2));

  if (nextToStep4) {
    nextToStep4.addEventListener('click', () => {
      if (!bookingState.selectedDate || !bookingState.selectedTime) {
        showToast('Please select an appointment date and time slot.', 'warning');
        return;
      }
      updateSummaryStep4();
      goToStep(4);
    });
  }

  if (backToStep3) backToStep3.addEventListener('click', () => goToStep(3));

  if (confirmBookingBtn) {
    confirmBookingBtn.addEventListener('click', (e) => {
      e.preventDefault();
      submitBooking();
    });
  }
}

function openBookingModal(preselectedServiceKey = null, preselectedBarber = null) {
  const modal = document.getElementById('booking-modal');
  if (!modal) return;

  // Reset or pre-select
  if (preselectedServiceKey && serviceCatalogue[preselectedServiceKey]) {
    bookingState.selectedServices = [preselectedServiceKey];
    const checkboxes = document.querySelectorAll('.service-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = (cb.value === preselectedServiceKey);
    });
  } else if (bookingState.selectedServices.length === 0) {
    bookingState.selectedServices = ['haircut'];
    const defaultCb = document.querySelector('.service-checkbox[value="haircut"]');
    if (defaultCb) defaultCb.checked = true;
  }

  if (preselectedBarber) {
    bookingState.selectedBarber = preselectedBarber;
    const barberOptions = document.querySelectorAll('.barber-select-option');
    barberOptions.forEach(opt => {
      if (opt.getAttribute('data-barber') === preselectedBarber) {
        opt.classList.add('border-amber-400', 'bg-amber-500/15');
      } else {
        opt.classList.remove('border-amber-400', 'bg-amber-500/15');
      }
    });
  }

  updateSelectedServices();
  goToStep(1);
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
  const modal = document.getElementById('booking-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

function goToStep(stepNumber) {
  bookingState.currentStep = stepNumber;
  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById(`booking-step-${i}`);
    if (stepEl) {
      stepEl.classList.toggle('hidden', i !== stepNumber);
    }
  }
  const confirmationScreen = document.getElementById('booking-confirmation');
  if (confirmationScreen) confirmationScreen.classList.add('hidden');

  // Update progress indicators
  const stepIndicators = document.querySelectorAll('.step-indicator');
  stepIndicators.forEach((ind, idx) => {
    if (idx + 1 < stepNumber) {
      ind.className = 'step-indicator flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-sm';
      ind.innerHTML = '<i class="fa-solid fa-check"></i>';
    } else if (idx + 1 === stepNumber) {
      ind.className = 'step-indicator flex items-center justify-center w-8 h-8 rounded-full bg-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-400/30';
      ind.innerHTML = `${idx + 1}`;
    } else {
      ind.className = 'step-indicator flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-gray-400 font-semibold text-sm';
      ind.innerHTML = `${idx + 1}`;
    }
  });
}

function updateSelectedServices() {
  const checkboxes = document.querySelectorAll('.service-checkbox:checked');
  bookingState.selectedServices = Array.from(checkboxes).map(cb => cb.value);

  let price = 0;
  let duration = 0;
  bookingState.selectedServices.forEach(key => {
    if (serviceCatalogue[key]) {
      price += serviceCatalogue[key].price;
      duration += serviceCatalogue[key].duration;
    }
  });

  bookingState.totalPrice = price;
  bookingState.totalDuration = duration;

  const totalDisplay = document.getElementById('booking-total-summary');
  if (totalDisplay) {
    totalDisplay.innerHTML = `
      <div class="flex items-center justify-between text-sm py-2 px-3 bg-gray-900/80 rounded-lg border border-gray-800">
        <span class="text-gray-300"><i class="fa-regular fa-clock text-amber-400 mr-1.5"></i> Est. Time: <strong class="text-white">${duration} mins</strong></span>
        <span class="text-gray-300">Total: <strong class="text-xl text-amber-400 font-serif-luxury ml-1">$${price}</strong></span>
      </div>
    `;
  }
}

function generateDateOptions() {
  const dateContainer = document.getElementById('booking-date-container');
  const timeContainer = document.getElementById('booking-time-slots');
  if (!dateContainer || !timeContainer) return;

  dateContainer.innerHTML = '';
  timeContainer.innerHTML = '<p class="text-sm text-gray-400 col-span-full text-center py-4">Please select a date first to view available time slots.</p>';

  // Generate next 10 days (excluding closed days Sunday & Monday)
  const today = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let validDaysCount = 0;
  let dayOffset = 0;

  while (validDaysCount < 6 && dayOffset < 14) {
    const d = new Date();
    d.setDate(today.getDate() + dayOffset);
    const dayOfWeek = d.getDay();

    // Only Tue-Sat are open (2-6)
    const isClosed = (dayOfWeek === 0 || dayOfWeek === 1);

    const dateCard = document.createElement('button');
    dateCard.type = 'button';
    const dateFormatted = `${days[dayOfWeek]}, ${months[d.getMonth()]} ${d.getDate()}`;
    const isoDate = d.toISOString().split('T')[0];

    if (isClosed) {
      dateCard.className = 'p-3 rounded-xl border border-gray-800 bg-gray-900/40 text-gray-600 opacity-60 cursor-not-allowed flex flex-col items-center justify-center text-center';
      dateCard.disabled = true;
      dateCard.innerHTML = `
        <span class="text-xs uppercase">${days[dayOfWeek]}</span>
        <span class="text-lg font-bold">${d.getDate()}</span>
        <span class="text-[10px] text-red-400/80">Closed</span>
      `;
    } else {
      validDaysCount++;
      const isSelected = bookingState.selectedDate === isoDate || (validDaysCount === 1 && !bookingState.selectedDate);
      if (isSelected) {
        bookingState.selectedDate = isoDate;
        bookingState.selectedDateFormatted = dateFormatted;
      }

      dateCard.className = `p-3 rounded-xl border transition-all flex flex-col items-center justify-center text-center date-pill ${
        isSelected
          ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-md ring-1 ring-amber-400'
          : 'border-gray-800 bg-gray-900/90 text-gray-300 hover:border-gray-600 hover:bg-gray-800'
      }`;
      dateCard.innerHTML = `
        <span class="text-xs font-semibold uppercase text-gray-400">${days[dayOfWeek]}</span>
        <span class="text-lg font-bold">${d.getDate()}</span>
        <span class="text-[10px] text-emerald-400">Available</span>
      `;

      dateCard.addEventListener('click', () => {
        document.querySelectorAll('.date-pill').forEach(btn => {
          btn.classList.remove('border-amber-400', 'bg-amber-500/20', 'text-amber-300', 'ring-1', 'ring-amber-400');
          btn.classList.add('border-gray-800', 'bg-gray-900/90', 'text-gray-300');
        });
        dateCard.classList.add('border-amber-400', 'bg-amber-500/20', 'text-amber-300', 'ring-1', 'ring-amber-400');
        dateCard.classList.remove('border-gray-800', 'bg-gray-900/90', 'text-gray-300');
        bookingState.selectedDate = isoDate;
        bookingState.selectedDateFormatted = dateFormatted;
        populateTimeSlots(dayOfWeek);
      });
    }

    dateContainer.appendChild(dateCard);
    dayOffset++;
  }

  // Populate times for initial selected date
  const firstSelectedDate = new Date(bookingState.selectedDate + 'T00:00:00');
  populateTimeSlots(firstSelectedDate.getDay());
}

function populateTimeSlots(dayOfWeek) {
  const timeContainer = document.getElementById('booking-time-slots');
  if (!timeContainer) return;
  timeContainer.innerHTML = '';

  // Hours: Tue-Fri 9am-6pm (last slot 5:15pm), Sat 9am-4pm (last slot 3:15pm)
  const isSaturday = (dayOfWeek === 6);
  const slots = isSaturday
    ? ['9:00 AM', '9:45 AM', '10:30 AM', '11:15 AM', '12:00 PM', '1:00 PM', '1:45 PM', '2:30 PM', '3:15 PM']
    : ['9:00 AM', '9:45 AM', '10:30 AM', '11:15 AM', '12:00 PM', '12:45 PM', '1:30 PM', '2:15 PM', '3:00 PM', '3:45 PM', '4:30 PM', '5:15 PM'];

  slots.forEach((time, index) => {
    const isBooked = (index === 2 || index === 5); // realistic booked simulation
    const timeBtn = document.createElement('button');
    timeBtn.type = 'button';

    if (isBooked) {
      timeBtn.className = 'py-2 px-3 rounded-lg border border-gray-800/60 bg-gray-900/30 text-gray-600 text-xs line-through cursor-not-allowed';
      timeBtn.disabled = true;
      timeBtn.innerText = time;
    } else {
      const isSelected = bookingState.selectedTime === time;
      timeBtn.className = `py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all time-slot-btn ${
        isSelected
          ? 'border-amber-400 bg-amber-500/25 text-amber-300 ring-1 ring-amber-400'
          : 'border-gray-800 bg-gray-900 text-gray-300 hover:border-amber-400/50 hover:bg-gray-800'
      }`;
      timeBtn.innerText = time;

      timeBtn.addEventListener('click', () => {
        document.querySelectorAll('.time-slot-btn').forEach(b => {
          b.classList.remove('border-amber-400', 'bg-amber-500/25', 'text-amber-300', 'ring-1', 'ring-amber-400');
          b.classList.add('border-gray-800', 'bg-gray-900', 'text-gray-300');
        });
        timeBtn.classList.add('border-amber-400', 'bg-amber-500/25', 'text-amber-300', 'ring-1', 'ring-amber-400');
        timeBtn.classList.remove('border-gray-800', 'bg-gray-900', 'text-gray-300');
        bookingState.selectedTime = time;
      });
    }

    timeContainer.appendChild(timeBtn);
  });
}

function updateSummaryStep4() {
  const summaryBox = document.getElementById('step-4-summary');
  if (!summaryBox) return;

  const serviceNames = bookingState.selectedServices.map(k => serviceCatalogue[k]?.name || k).join(', ');

  summaryBox.innerHTML = `
    <div class="bg-gray-900/90 border border-amber-500/30 rounded-xl p-4 space-y-2 text-sm">
      <div class="flex justify-between items-center pb-2 border-b border-gray-800">
        <span class="text-gray-400 font-medium">Selected Services:</span>
        <span class="text-white font-semibold text-right max-w-[220px] truncate">${serviceNames}</span>
      </div>
      <div class="flex justify-between items-center pb-2 border-b border-gray-800">
        <span class="text-gray-400 font-medium">Master Barber:</span>
        <span class="text-amber-300 font-semibold">${bookingState.selectedBarber}</span>
      </div>
      <div class="flex justify-between items-center pb-2 border-b border-gray-800">
        <span class="text-gray-400 font-medium">Appointment:</span>
        <span class="text-white font-semibold">${bookingState.selectedDateFormatted || bookingState.selectedDate} @ ${bookingState.selectedTime}</span>
      </div>
      <div class="flex justify-between items-center pt-1 text-base">
        <span class="text-gray-300 font-bold">Estimated Total:</span>
        <span class="text-amber-400 font-serif-luxury font-bold text-lg">$${bookingState.totalPrice} <span class="text-xs text-gray-400 font-normal">(${bookingState.totalDuration} min)</span></span>
      </div>
    </div>
  `;
}

function submitBooking() {
  const nameInput = document.getElementById('client-name');
  const phoneInput = document.getElementById('client-phone');
  const emailInput = document.getElementById('client-email');
  const notesInput = document.getElementById('client-notes');

  if (!nameInput.value.trim() || !phoneInput.value.trim()) {
    showToast('Please fill in your name and phone number.', 'error');
    return;
  }

  bookingState.clientName = nameInput.value.trim();
  bookingState.clientPhone = phoneInput.value.trim();
  bookingState.clientEmail = emailInput ? emailInput.value.trim() : '';
  bookingState.notes = notesInput ? notesInput.value.trim() : '';

  // Hide steps and display confirmation
  for (let i = 1; i <= 4; i++) {
    const s = document.getElementById(`booking-step-${i}`);
    if (s) s.classList.add('hidden');
  }

  const confirmationScreen = document.getElementById('booking-confirmation');
  const confDetails = document.getElementById('confirmation-details');

  if (confirmationScreen && confDetails) {
    confirmationScreen.classList.remove('hidden');

    const serviceNames = bookingState.selectedServices.map(k => serviceCatalogue[k]?.name || k).join(' + ');

    confDetails.innerHTML = `
      <div class="bg-gray-900 border border-emerald-500/40 rounded-xl p-5 text-left space-y-3">
        <div class="flex justify-between items-center pb-2 border-b border-gray-800">
          <span class="text-gray-400 text-xs uppercase tracking-wider">Client</span>
          <span class="text-white font-semibold">${bookingState.clientName} (${bookingState.clientPhone})</span>
        </div>
        <div class="flex justify-between items-center pb-2 border-b border-gray-800">
          <span class="text-gray-400 text-xs uppercase tracking-wider">Services</span>
          <span class="text-amber-300 font-semibold text-right">${serviceNames}</span>
        </div>
        <div class="flex justify-between items-center pb-2 border-b border-gray-800">
          <span class="text-gray-400 text-xs uppercase tracking-wider">Barber</span>
          <span class="text-white font-semibold">${bookingState.selectedBarber}</span>
        </div>
        <div class="flex justify-between items-center pb-2 border-b border-gray-800">
          <span class="text-gray-400 text-xs uppercase tracking-wider">Date & Time</span>
          <span class="text-emerald-400 font-bold">${bookingState.selectedDateFormatted || bookingState.selectedDate} at ${bookingState.selectedTime}</span>
        </div>
        <div class="flex justify-between items-center pt-1">
          <span class="text-gray-400 text-xs uppercase tracking-wider">Location</span>
          <span class="text-gray-300 text-xs text-right">3868 W Sahara Ave, Las Vegas, NV 89102</span>
        </div>
      </div>
    `;

    // Setup Calendar Links
    setupCalendarDownloads();

    showToast(`Appointment confirmed for ${bookingState.clientName}! See you in the chair.`, 'success');
  }
}

function setupCalendarDownloads() {
  const gcalBtn = document.getElementById('add-to-gcal-btn');
  const icsBtn = document.getElementById('download-ics-btn');

  const title = encodeURIComponent("Haircut Appointment @ Faded Times Barbershop");
  const details = encodeURIComponent(`Appointment with ${bookingState.selectedBarber} for ${bookingState.selectedServices.join(', ')}.\nLocation: 3868 W Sahara Ave, Las Vegas, NV 89102.\nPhone: (702) 272-2457`);
  const location = encodeURIComponent("3868 W Sahara Ave, Las Vegas, NV 89102");

  if (gcalBtn) {
    gcalBtn.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
    gcalBtn.target = "_blank";
  }

  if (icsBtn) {
    icsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Faded Times Barbershop//EN',
        'BEGIN:VEVENT',
        `SUMMARY:Faded Times Barbershop Cut`,
        `DESCRIPTION:Appointment with ${bookingState.selectedBarber} at 3868 W Sahara Ave, Las Vegas, NV`,
        `LOCATION:3868 W Sahara Ave, Las Vegas, NV 89102`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', 'faded-times-appointment.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Calendar invite downloaded!', 'info');
    });
  }
}

/* ==========================================================================
   3. INSTAGRAM LOOKBOOK GALLERY & LIGHTBOX
   ========================================================================== */
function initLookbook() {
  const filterButtons = document.querySelectorAll('.lookbook-filter-btn');
  const galleryItems = document.querySelectorAll('.lookbook-item');
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-image');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxBarber = document.getElementById('lightbox-barber');
  const closeLightbox = document.getElementById('close-lightbox-btn');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => {
        b.classList.remove('bg-amber-400', 'text-black', 'shadow-lg', 'shadow-amber-400/20');
        b.classList.add('bg-gray-800/80', 'text-gray-300');
      });
      btn.classList.add('bg-amber-400', 'text-black', 'shadow-lg', 'shadow-amber-400/20');
      btn.classList.remove('bg-gray-800/80', 'text-gray-300');

      const category = btn.getAttribute('data-filter');
      galleryItems.forEach(item => {
        const itemCat = item.getAttribute('data-category');
        if (category === 'all' || itemCat.includes(category)) {
          item.style.display = 'block';
          item.classList.add('animate-fadeIn');
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // Lightbox click triggers
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const caption = item.getAttribute('data-caption') || 'Clean cut at Faded Times Vegas #FadedTimesLV';
      const barber = item.getAttribute('data-barber') || 'Faded Times Master Barber';

      if (lightboxImg && img) {
        lightboxImg.src = img.src;
        lightboxCaption.innerText = caption;
        lightboxBarber.innerText = `@fadedtimeslv • Barber: ${barber}`;
        lightboxModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  if (closeLightbox) {
    closeLightbox.addEventListener('click', () => {
      lightboxModal.classList.remove('active');
      document.body.style.overflow = 'auto';
    });
  }

  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        lightboxModal.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    });
  }
}

/* ==========================================================================
   4. FAQ ACCORDION
   ========================================================================== */
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   5. VIP CLUB & PROMO SIGNUP
   ========================================================================== */
function initVipClub() {
  const vipForm = document.getElementById('vip-club-form');
  const promoBox = document.getElementById('promo-code-result');

  if (vipForm) {
    vipForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailOrPhone = vipForm.querySelector('input[type="text"]').value.trim();
      if (!emailOrPhone) {
        showToast('Please enter your phone number or email.', 'warning');
        return;
      }

      vipForm.classList.add('hidden');
      if (promoBox) {
        promoBox.classList.remove('hidden');
        showToast('Welcome to the VIP Club! 10% code unlocked.', 'success');
      }
    });
  }
}

/* ==========================================================================
   6. MOBILE NAVIGATION DRAWER
   ========================================================================== */
function initMobileMenu() {
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const closeDrawer = document.getElementById('close-mobile-drawer');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  if (menuToggle && mobileDrawer) {
    menuToggle.addEventListener('click', () => {
      mobileDrawer.classList.toggle('hidden');
    });
  }

  if (closeDrawer && mobileDrawer) {
    closeDrawer.addEventListener('click', () => {
      mobileDrawer.classList.add('hidden');
    });
  }

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (mobileDrawer) mobileDrawer.classList.add('hidden');
    });
  });
}

/* ==========================================================================
   7. REVIEWS FILTER
   ========================================================================== */
function initReviewFilters() {
  const reviewPills = document.querySelectorAll('.review-filter-pill');
  const reviewCards = document.querySelectorAll('.review-card');

  reviewPills.forEach(pill => {
    pill.addEventListener('click', () => {
      reviewPills.forEach(p => {
        p.classList.remove('bg-amber-400', 'text-black', 'font-bold');
        p.classList.add('bg-gray-800', 'text-gray-300');
      });
      pill.classList.add('bg-amber-400', 'text-black', 'font-bold');
      pill.classList.remove('bg-gray-800', 'text-gray-300');

      const filter = pill.getAttribute('data-review-filter');
      reviewCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat.includes(filter)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   8. SMOOTH SCROLLING & UTILITIES
   ========================================================================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '#!') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    });
  });
}

/* ==========================================================================
   TOAST NOTIFICATION HELPER
   ========================================================================== */
function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-20 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-950 border-emerald-500/60 text-emerald-200',
    error: 'bg-red-950 border-red-500/60 text-red-200',
    warning: 'bg-amber-950 border-amber-500/60 text-amber-200',
    info: 'bg-gray-900 border-amber-400/40 text-gray-200'
  };

  const icons = {
    success: '<i class="fa-solid fa-circle-check text-emerald-400 text-lg mr-3"></i>',
    error: '<i class="fa-solid fa-circle-exclamation text-red-400 text-lg mr-3"></i>',
    warning: '<i class="fa-solid fa-triangle-exclamation text-amber-400 text-lg mr-3"></i>',
    info: '<i class="fa-solid fa-circle-info text-amber-400 text-lg mr-3"></i>'
  };

  toast.className = `p-4 rounded-xl border shadow-2xl flex items-center transition-all duration-300 pointer-events-auto transform translate-y-4 opacity-0 ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `
    ${icons[type] || icons.info}
    <div class="text-sm font-medium flex-1">${message}</div>
  `;

  toastContainer.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  }, 10);

  // Remove after 4s
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-x-4');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// Global helper for promo copy
window.copyPromoCode = function() {
  navigator.clipboard.writeText('FADED10');
  showToast('Promo Code "FADED10" copied to clipboard!', 'success');
};
