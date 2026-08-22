/**
 * BARBERSHOP ENGINE
 * Interactive Website JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeSystem();
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
   1. REAL-TIME SHOP STATUS (LOCAL TIMEZONE: PST / PDT)
   ========================================================================== */
function initShopStatus() {
  const statusBadge = document.getElementById('shop-status-badge');
  const statusText = document.getElementById('shop-status-text');
  const statusDot = document.getElementById('shop-status-dot');
  const heroStatusText = document.getElementById('hero-status-text');
  const walkinWaitText = document.getElementById('walkin-wait-text');
  const todayHoursRow = document.getElementById('today-hours-highlight');

  function updateStatus() {
    // Get current time in shop timezone (America/Los_Angeles)
    const timezone = window.SHOP_CONFIG?.hours?.timezone || 'America/Los_Angeles';
    const now = new Date();
    const localString = now.toLocaleString("en-US", { timeZone: timezone });
    const localDate = new Date(localString);
    const day = localDate.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, ..., 6 = Sat
    const hour = localDate.getHours();
    const minute = localDate.getMinutes();
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
  const getBooksyUrl = () => window.SHOP_CONFIG?.shop?.booksyUrl || 'https://booksy.com';

  // Make ALL booking buttons directly navigate to Booksy
  const openButtons = document.querySelectorAll('.open-booking-trigger');
  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const url = getBooksyUrl();
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  });

  // Bind all direct Booksy profile links across the page to the config URL
  document.querySelectorAll('.direct-booksy-link').forEach(link => {
    link.href = getBooksyUrl();
  });

  // Dynamically set shop monogram across all monogram badges
  if (window.SHOP_CONFIG?.shop?.monogram) {
    document.querySelectorAll('.shop-monogram').forEach(el => {
      el.textContent = window.SHOP_CONFIG.shop.monogram;
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
  document.body.classList.add('overflow-hidden');
}

function closeBookingModal() {
  const modal = document.getElementById('booking-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.classList.remove('overflow-hidden');
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

  // Scroll modal body to top smoothly on mobile
  const modalScrollBody = document.querySelector('.modal-content-box .overflow-y-auto');
  if (modalScrollBody) {
    modalScrollBody.scrollTop = 0;
  }

  // Update progress indicators
  const stepIndicators = document.querySelectorAll('.step-indicator');
  stepIndicators.forEach((ind, idx) => {
    if (idx + 1 < stepNumber) {
      ind.className = 'step-indicator flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500 text-white font-bold text-xs sm:text-sm';
      ind.innerHTML = '<i class="fa-solid fa-check"></i>';
    } else if (idx + 1 === stepNumber) {
      ind.className = 'step-indicator flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-400 text-black font-bold text-xs sm:text-sm shadow-lg shadow-amber-400/30';
      ind.innerHTML = `${idx + 1}`;
    } else {
      ind.className = 'step-indicator flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-800 text-gray-400 font-semibold text-xs sm:text-sm';
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

  const serviceItems = bookingState.selectedServices.map(k => {
    const s = serviceCatalogue[k];
    if (!s) return `<div class="flex justify-between text-xs py-1 text-gray-200"><span>${k}</span></div>`;
    return `
      <div class="flex justify-between items-center text-xs py-1 border-b border-gray-800/60 last:border-0">
        <span class="text-gray-200 font-medium">${s.name} <span class="text-gray-500 font-normal">(${s.duration} min)</span></span>
        <span class="text-amber-400 font-bold">$${s.price}</span>
      </div>
    `;
  }).join('');

  summaryBox.innerHTML = `
    <div class="bg-gray-900/95 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-3 text-sm shadow-inner">
      <div class="pb-2 border-b border-gray-800">
        <span class="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1">Selected Grooming:</span>
        <div class="space-y-0.5">
          ${serviceItems}
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 pb-2 border-b border-gray-800 text-xs">
        <div>
          <span class="text-gray-400 font-medium block">Barber:</span>
          <span class="text-amber-300 font-bold text-xs sm:text-sm flex items-center mt-0.5 truncate">
            <i class="fa-solid fa-scissors text-amber-400 mr-1.5 text-xs shrink-0"></i>
            ${bookingState.selectedBarber}
          </span>
        </div>
        <div>
          <span class="text-gray-400 font-medium block">Date & Time:</span>
          <span class="text-emerald-400 font-bold text-xs sm:text-sm flex items-center mt-0.5">
            <i class="fa-regular fa-calendar-check mr-1.5 text-xs shrink-0"></i>
            ${bookingState.selectedDateFormatted || bookingState.selectedDate} @ ${bookingState.selectedTime}
          </span>
        </div>
      </div>
      <div class="flex justify-between items-center pt-1 text-sm sm:text-base">
        <div>
          <span class="text-gray-300 font-bold block">Estimated Chair Total:</span>
          <span class="text-[11px] text-gray-400"><i class="fa-regular fa-clock text-amber-400 mr-1"></i> ${bookingState.totalDuration} Minutes</span>
        </div>
        <div class="text-right">
          <span class="text-amber-400 font-serif font-black text-2xl">$${bookingState.totalPrice}</span>
        </div>
      </div>
    </div>
  `;

  // Update dynamic Booksy button link
  const booksyBtn = document.getElementById('btn-booksy-handoff');
  if (booksyBtn) {
    booksyBtn.href = window.SHOP_CONFIG?.shop?.booksyUrl || 'https://booksy.com';
  }
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
          <span class="text-gray-300 text-xs text-right">${window.SHOP_CONFIG?.location ? `${window.SHOP_CONFIG.location.address}, ${window.SHOP_CONFIG.location.city}, ${window.SHOP_CONFIG.location.state} ${window.SHOP_CONFIG.location.zip}` : '740 S 4th St, Las Vegas, NV 89101'}</span>
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

  const shopName = window.SHOP_CONFIG?.shop?.name || 'Barbershop';
  const shopAddr = window.SHOP_CONFIG?.location ? `${window.SHOP_CONFIG.location.address}, ${window.SHOP_CONFIG.location.city}, ${window.SHOP_CONFIG.location.state} ${window.SHOP_CONFIG.location.zip}` : '';
  const shopPhone = window.SHOP_CONFIG?.shop?.phone || '';

  const title = encodeURIComponent(`Haircut Appointment @ ${shopName}`);
  const details = encodeURIComponent(`Appointment with ${bookingState.selectedBarber} for ${bookingState.selectedServices.join(', ')}.\nLocation: ${shopAddr}.\nPhone: ${shopPhone}`);
  const location = encodeURIComponent(shopAddr);

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
        `PRODID:-//${shopName}//EN`,
        'BEGIN:VEVENT',
        `SUMMARY:${shopName} Cut`,
        `DESCRIPTION:Appointment with ${bookingState.selectedBarber} at ${shopAddr}`,
        `LOCATION:${shopAddr}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', 'appointment.ics');
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
      const shopName = window.SHOP_CONFIG?.shop?.name || 'Barbershop';
      const shopIg = window.SHOP_CONFIG?.shop?.instagram || 'barbershop';
      const caption = item.getAttribute('data-caption') || `Clean cut at ${shopName} #${shopIg}LV`;
      const barber = item.getAttribute('data-barber') || `${shopName} Master Barber`;

      if (lightboxImg && img) {
        lightboxImg.src = img.src;
        lightboxCaption.innerText = caption;
        lightboxBarber.innerText = `@${shopIg} • Barber: ${barber}`;
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
    const header = item.querySelector('.faq-header') || item.querySelector('.faq-toggle');
    const content = item.querySelector('.faq-content');
    if (!header) return;
    header.addEventListener('click', () => {
      const isCurrentlyOpen = item.classList.contains('active') || (content && !content.classList.contains('hidden'));
      faqItems.forEach(i => {
        i.classList.remove('active');
        const c = i.querySelector('.faq-content');
        if (c) c.classList.add('hidden');
      });
      if (!isCurrentlyOpen) {
        item.classList.add('active');
        if (content) content.classList.remove('hidden');
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
  const mobileBookingTriggers = mobileDrawer ? mobileDrawer.querySelectorAll('.open-booking-trigger') : [];

  function openMobileNav() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.remove('hidden');
    // Force reflow for smooth transition
    void mobileDrawer.offsetWidth;
    mobileDrawer.classList.add('open');
    document.body.classList.add('overflow-hidden');
  }

  function closeMobileNav() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.remove('open');
    document.body.classList.remove('overflow-hidden');
    setTimeout(() => {
      if (!mobileDrawer.classList.contains('open')) {
        mobileDrawer.classList.add('hidden');
      }
    }, 300);
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (mobileDrawer.classList.contains('open')) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });
  }

  if (closeDrawer) {
    closeDrawer.addEventListener('click', closeMobileNav);
  }

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', closeMobileNav);
  });

  mobileBookingTriggers.forEach(btn => {
    btn.addEventListener('click', closeMobileNav);
  });

  // Close on backdrop tap or Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileNav();
      closeBookingModal();
      const lightbox = document.getElementById('lightbox-modal');
      if (lightbox) {
        lightbox.classList.remove('active');
        document.body.classList.remove('overflow-hidden');
      }
    }
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
        const headerOffset = window.innerWidth < 768 ? 65 : 85;
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
    toastContainer.className = 'fixed bottom-24 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-50 flex flex-col space-y-2 pointer-events-none sm:max-w-sm';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-950/95 border-emerald-500/60 text-emerald-200 backdrop-blur-md',
    error: 'bg-red-950/95 border-red-500/60 text-red-200 backdrop-blur-md',
    warning: 'bg-amber-950/95 border-amber-500/60 text-amber-200 backdrop-blur-md',
    info: 'bg-gray-900/95 border-amber-400/40 text-gray-200 backdrop-blur-md'
  };

  const icons = {
    success: '<i class="fa-solid fa-circle-check text-emerald-400 text-lg mr-3"></i>',
    error: '<i class="fa-solid fa-circle-exclamation text-red-400 text-lg mr-3"></i>',
    warning: '<i class="fa-solid fa-triangle-exclamation text-amber-400 text-lg mr-3"></i>',
    info: '<i class="fa-solid fa-circle-info text-amber-400 text-lg mr-3"></i>'
  };

  toast.className = `p-4 rounded-2xl border shadow-2xl flex items-center transition-all duration-300 pointer-events-auto transform translate-y-4 opacity-0 ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `
    ${icons[type] || icons.info}
    <div class="text-xs sm:text-sm font-medium flex-1">${message}</div>
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
  const promo = window.SHOP_CONFIG?.business?.promoCode || window.SHOP_CONFIG?.shop?.promoCode || 'APEX10';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(promo).catch(() => {});
  }
  showToast(`Promo Code "${promo}" copied to clipboard!`, 'success');
};

/* ==========================================================================
   8. DUAL-AXIS THEME & LAYOUT ENGINE (PALETTES & STYLES)
   ========================================================================== */
function initThemeSystem() {
  const design = window.SHOP_CONFIG?.design || {};
  const currentPalette = design.palette || 'gold-noir';
  const currentStyle = design.style || 'urban-street';

  document.documentElement.setAttribute('data-palette', currentPalette);
  document.documentElement.setAttribute('data-style', currentStyle);

  if (design.enableDemoToolbar !== false) {
    initThemeToolbar(currentPalette, currentStyle);
  }
}

function initThemeToolbar(initialPalette, initialStyle) {
  if (document.getElementById('theme-demo-toolbar')) return;

  const palettes = [
    { id: 'gold-noir', name: 'Gold Noir (Dark / Gold)' },
    { id: 'emerald-botanical', name: 'Emerald Botanical (Charcoal / Green)' },
    { id: 'burgundy-copper', name: 'Burgundy Copper (Mahogany / Copper)' },
    { id: 'midnight-cyan', name: 'Midnight Cyan (Jet Black / Cyan)' },
    { id: 'saddle-leather', name: 'Saddle Leather (Espresso / Amber)' },
    { id: 'platinum-slate', name: 'Platinum Slate (Deep Slate / Silver)' }
  ];

  const styles = [
    { id: 'urban-street', name: 'Urban Street (Bold / High-Contrast)' },
    { id: 'classic-speakeasy', name: 'Classic Speakeasy (Serif / Vintage)' },
    { id: 'minimal-editorial', name: 'Minimal Editorial (Clean / Subtle)' },
    { id: 'compact-modern', name: 'Compact Modern (Pills / Rounded 16-24px)' }
  ];

  const toolbar = document.createElement('div');
  toolbar.id = 'theme-demo-toolbar';
  toolbar.className = 'fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end font-sans';
  toolbar.innerHTML = `
    <!-- Floating Collapsible Trigger -->
    <button id="theme-demo-toggle-btn" class="px-4 py-2.5 rounded-full bg-dark-950/95 border border-amber-400/40 text-amber-300 text-xs font-bold shadow-2xl backdrop-blur-xl hover:scale-105 transition-all flex items-center space-x-2">
      <i class="fa-solid fa-palette text-amber-400 text-sm"></i>
      <span>Theme & Style Toolbar</span>
      <i id="theme-demo-chevron" class="fa-solid fa-chevron-up text-[10px] ml-1 transition-transform"></i>
    </button>

    <!-- Floating Customization Panel -->
    <div id="theme-demo-panel" class="hidden mt-2 p-5 rounded-2xl bg-dark-950/95 border border-amber-400/30 shadow-2xl backdrop-blur-2xl w-80 text-left text-xs space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-gray-800">
        <div>
          <h4 class="font-bold text-white text-sm">Live Theme Customizer</h4>
          <p class="text-[10px] text-gray-400 mt-0.5">Dual-Axis Preview Engine</p>
        </div>
        <button id="theme-demo-close-btn" class="w-6 h-6 rounded-lg bg-dark-800 text-gray-400 hover:text-white flex items-center justify-center text-xs">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Dropdown 1: Color Palette -->
      <div>
        <label class="block text-gray-300 font-bold uppercase tracking-wider text-[10px] mb-1.5 flex items-center">
          <i class="fa-solid fa-droplet text-amber-400 mr-1.5"></i> Color Palette (6)
        </label>
        <select id="theme-palette-select" class="w-full px-3 py-2 rounded-xl bg-dark-850 border border-gray-700 text-white text-xs font-semibold focus:border-amber-400 focus:outline-none transition-colors">
          ${palettes.map(p => `<option value="${p.id}" ${p.id === initialPalette ? 'selected' : ''}>${p.name}</option>`).join('')}
        </select>
      </div>

      <!-- Dropdown 2: Vibe & Style -->
      <div>
        <label class="block text-gray-300 font-bold uppercase tracking-wider text-[10px] mb-1.5 flex items-center">
          <i class="fa-solid fa-wand-magic-sparkles text-amber-400 mr-1.5"></i> Vibe & Style (4)
        </label>
        <select id="theme-style-select" class="w-full px-3 py-2 rounded-xl bg-dark-850 border border-gray-700 text-white text-xs font-semibold focus:border-amber-400 focus:outline-none transition-colors">
          ${styles.map(s => `<option value="${s.id}" ${s.id === initialStyle ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
      </div>

      <!-- Copy Config Action -->
      <div class="pt-2 border-t border-gray-800 flex items-center justify-between">
        <button id="theme-copy-config-btn" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-dark-950 font-black uppercase tracking-wider text-[11px] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center">
          <i class="fa-regular fa-copy mr-1.5"></i> Copy Config JSON
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(toolbar);

  const toggleBtn = document.getElementById('theme-demo-toggle-btn');
  const panel = document.getElementById('theme-demo-panel');
  const closeBtn = document.getElementById('theme-demo-close-btn');
  const chevron = document.getElementById('theme-demo-chevron');
  const paletteSelect = document.getElementById('theme-palette-select');
  const styleSelect = document.getElementById('theme-style-select');
  const copyBtn = document.getElementById('theme-copy-config-btn');

  function togglePanel(open) {
    const isHidden = panel.classList.contains('hidden');
    const shouldOpen = open !== undefined ? open : isHidden;
    if (shouldOpen) {
      panel.classList.remove('hidden');
      if (chevron) chevron.className = 'fa-solid fa-chevron-down text-[10px] ml-1 transition-transform';
    } else {
      panel.classList.add('hidden');
      if (chevron) chevron.className = 'fa-solid fa-chevron-up text-[10px] ml-1 transition-transform';
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel(false);
    });
  }

  if (paletteSelect) {
    paletteSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      document.documentElement.setAttribute('data-palette', selected);
      showToast(`Applied Palette: ${selected}`, 'info');
    });
  }

  if (styleSelect) {
    styleSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      document.documentElement.setAttribute('data-style', selected);
      showToast(`Applied Style: ${selected}`, 'info');
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const currentPal = paletteSelect ? paletteSelect.value : (document.documentElement.getAttribute('data-palette') || 'gold-noir');
      const currentSty = styleSelect ? styleSelect.value : (document.documentElement.getAttribute('data-style') || 'urban-street');
      const snippet = JSON.stringify({ design: { palette: currentPal, style: currentSty } }, null, 2);

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(snippet).catch(() => {});
      }
      showToast('Copied design config to clipboard!', 'success');
    });
  }
}

