/**
 * Dynamic Car Details Populator for JET CABS
 * Reads selected vehicle ID from query parameters and populates the UI via Backend API.
 */

(async function() {
  'use strict';

  // --- 1. Read Query Parameter ---
  const urlParams = new URLSearchParams(window.location.search);
  const rawId = urlParams.get('id');
  
  const VEHICLE_PLACEHOLDER_SVG = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHlsZT0iYmFja2dyb3VuZDojRjNGNEY2O3dpZHRoOjEwMCU7aGVpZ2h0OjEwMCU7cGFkZGluZzoyMHB4OyI+PHBhdGggZD0iTTE5IDE3aDJjLjYgMCAxLS40IDEtMXYtM2MwLS45LS43LTEuNy0xLjUtMS45QzE4LjcgMTAuNiAxNiAxMCAxNiAxMHMtMS4zLTEuNC0yLjItMi4zYy0uNS0uNC0xLjEtLjctMS44LS43SDVjLS42IDAtMS4xLjQtMS40LjlsLTEuNCAyLjlBMy43IDMuNyAwIDAgMCAxIDEzdjNjMCAuNi40IDEgMSAxaDIiLz48Y2lyY2xlIGN4PSI3IiBjeT0iMTciIHI9IjIiLz48cGF0aCBkPSJNOSAxN2g2Ii8+PGNpcmNsZSBjeD0iMTciIGN5PSIxNyIgcj0iMiIvPjwvc3ZnPg==`;

  let currentCar = null;
  
  if (!rawId) {
    showNotFound();
    return;
  }

  try {
    const res = await window.CarAPI.fetchCarById(rawId);
    if (!res.success || !res.data) {
      showNotFound();
      return;
    }
    currentCar = res.data;
  } catch (error) {
    console.error("Failed to fetch car details:", error);
    showNotFound();
    return;
  }

  function showNotFound() {
    const heroTitle = document.querySelector('.detail-hero__title');
    if (heroTitle) heroTitle.innerHTML = 'Car <span class="highlight">Not Found</span>';
    
    const heroDesc = document.querySelector('.detail-hero__desc');
    if (heroDesc) heroDesc.textContent = 'The requested vehicle could not be found or is no longer available.';
    
    const showcaseContainer = document.querySelector('.showcase');
    if (showcaseContainer) {
      showcaseContainer.innerHTML = '<div style="text-align:center; padding: 100px 20px;"><h2 style="font-size: 2rem; margin-bottom: 20px;">Vehicle Unavailable</h2><p style="color: var(--color-light-text); margin-bottom: 30px;">We could not locate the vehicle you are looking for.</p><a href="cars.html" class="btn btn--primary">Browse All Vehicles</a></div>';
    }
  }

  // Use currentCar.images array or fallback
  const galleryImages = (currentCar.images && currentCar.images.length > 0) 
    ? currentCar.images.map(img => img.url) 
    : [VEHICLE_PLACEHOLDER_SVG];
  
  const heroImage = galleryImages[0];

  // Update Rent Now buttons in details page to carry over the car ID and start pre-booking
  document.querySelectorAll('.showcase__actions a[href^="booking.html"], .booking-card a[href^="booking.html"]').forEach(btn => {
    btn.setAttribute('href', `booking.html?flow=prebooking&car=${currentCar._id}`);
  });

  // --- 2. Populate Page Metadata ---
  document.title = `${currentCar.brand} ${currentCar.carName} — JET CABS`;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', `${currentCar.brand} ${currentCar.carName} — ${currentCar.description || ''}`);
  }

  // --- 3. Populate Hero Section ---
  const heroTitle = document.querySelector('.detail-hero__title');
  if (heroTitle) {
    heroTitle.innerHTML = `${currentCar.brand} <span class="highlight">${currentCar.carName}</span>`;
  }
  const heroDesc = document.querySelector('.detail-hero__desc');
  if (heroDesc) {
    heroDesc.textContent = currentCar.description;
  }

  // --- 4. Populate Breadcrumbs ---
  const breadcrumbActive = document.querySelector('.breadcrumb__item.active');
  if (breadcrumbActive) {
    breadcrumbActive.textContent = currentCar.carName;
  }

  // --- 5. Populate Showcase Info ---
  const showcaseBrand = document.querySelector('.showcase__brand');
  if (showcaseBrand) showcaseBrand.textContent = currentCar.brand;

  const showcaseName = document.querySelector('.showcase__name');
  if (showcaseName) showcaseName.textContent = currentCar.carName;

  const showcaseYear = document.querySelector('.showcase__year');
  if (showcaseYear) {
    showcaseYear.textContent = `2025 Model`;
  }

  // Star Rating - hardcoded 4.9 since DB doesn't have rating yet
  const ratingVal = 4.9; 
  const showcaseStars = document.querySelector('.showcase__stars');
  if (showcaseStars) {
    showcaseStars.innerHTML = Array(Math.round(ratingVal))
      .fill(`<span class="icon icon--sm"><svg><use href="assets/icons/sprite.svg#icon-star"/></svg></span>`)
      .join('');
  }
  const showcaseRatingText = document.querySelector('.showcase__rating-text');
  if (showcaseRatingText) showcaseRatingText.textContent = ratingVal;

  const showcaseRatingCount = document.querySelector('.showcase__rating-count');
  if (showcaseRatingCount) showcaseRatingCount.textContent = `(12 reviews)`;

  // Availability badge
  const showcaseAvailability = document.querySelector('.showcase__rating-row .badge');
  if (showcaseAvailability) {
    showcaseAvailability.textContent = currentCar.status;
    if (currentCar.status === 'Available') {
      showcaseAvailability.className = 'badge badge--available';
    } else {
      showcaseAvailability.className = 'badge badge--popular';
    }
  }

  // Description Overview
  const showcaseDesc = document.querySelector('.showcase__desc');
  if (showcaseDesc) showcaseDesc.textContent = currentCar.description;

  // Metadata rows
  const metaValues = document.querySelectorAll('.showcase__meta-value');
  if (metaValues.length >= 4) {
    metaValues[0].textContent = currentCar._id.substring(0, 8).toUpperCase();
    metaValues[1].textContent = `${currentCar.category}`;
    metaValues[2].textContent = `Standard`;
    metaValues[3].textContent = `Default`;
  }

  // Showcase rates
  const hourlyRateAmount = document.querySelector('.showcase__pricing .showcase__price-card:first-child .showcase__price-amount');
  if (hourlyRateAmount) {
    hourlyRateAmount.innerHTML = `$${currentCar.hourlyPrice}<span class="showcase__price-unit">/hr</span>`;
  }
  const dailyRateAmount = document.querySelector('.showcase__pricing .showcase__price-card:last-child .showcase__price-amount');
  if (dailyRateAmount) {
    dailyRateAmount.innerHTML = `$${currentCar.dailyPrice}<span class="showcase__price-unit">/day</span>`;
  }

  // --- 6. Populate Gallery ---
  const mainImageContainer = document.getElementById('main-image');
  if (mainImageContainer) {
    const mainImg = document.createElement('img');
    mainImg.src = heroImage;
    mainImg.alt = `${currentCar.brand} ${currentCar.carName} Main View`;
    mainImg.style.width = '100%';
    mainImg.style.height = '100%';
    mainImg.style.objectFit = 'cover';
    mainImg.style.transition = 'transform var(--transition-smooth)';

    const handleMainErr = function() {
      mainImg.src = VEHICLE_PLACEHOLDER_SVG;
      mainImg.removeEventListener('error', handleMainErr);
    };
    mainImg.addEventListener('error', handleMainErr);

    mainImageContainer.innerHTML = '';
    mainImageContainer.appendChild(mainImg);
  }

  const thumbElements = document.querySelectorAll('.showcase__thumb');
  thumbElements.forEach((thumb, index) => {
    // If we have fewer images than thumb placeholders, reuse or hide them.
    // For now we loop through available images.
    const thumbImgUrl = galleryImages[index % galleryImages.length];
    const placeholder = thumb.querySelector('.showcase__thumb-placeholder');
    if (placeholder) {
      placeholder.innerHTML = '';
      const thumbImg = document.createElement('img');
      thumbImg.src = thumbImgUrl;
      thumbImg.alt = `${currentCar.brand} ${currentCar.carName} Thumb ${index + 1}`;
      thumbImg.style.width = '100%';
      thumbImg.style.height = '100%';
      thumbImg.style.objectFit = 'cover';

      const handleThumbErr = function() {
        thumbImg.src = VEHICLE_PLACEHOLDER_SVG;
        thumbImg.removeEventListener('error', handleThumbErr);
      };
      thumbImg.addEventListener('error', handleThumbErr);
      placeholder.appendChild(thumbImg);
    }

    if (index === 0) {
      thumb.classList.add('active');
    } else {
      thumb.classList.remove('active');
    }

    thumb.addEventListener('click', () => {
      thumbElements.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      const mainImg = mainImageContainer ? mainImageContainer.querySelector('img') : null;
      if (mainImg) {
        const handleErr = function() {
          mainImg.src = VEHICLE_PLACEHOLDER_SVG;
          mainImg.removeEventListener('error', handleErr);
        };
        mainImg.addEventListener('error', handleErr);
        mainImg.src = thumbImgUrl;
      }
    });
  });

  // --- 7. Populate Specifications ---
  const specMapping = {
    'Fuel': currentCar.fuelType,
    'Transmission': currentCar.transmission,
    'Seats': currentCar.seatingCapacity,
    'Mileage': '12,000 mi', // Dummy for now since DB doesn't have it
    'Engine': 'V6',
    'Horsepower': '300 HP',
    'Top Speed': '150 mph',
    'Fuel Economy': '20 mpg',
    'Color': 'Standard',
    'Body Type': currentCar.category,
    'Drive Type': 'AWD',
    'Doors': '4 Doors',
    'Air Conditioning': 'Dual Zone',
    'GPS': 'Built-in Nav',
    'Bluetooth': 'Standard',
    'Parking': 'Sensors',
    'Camera': 'Rear',
    'ABS': 'Standard',
    'Airbags': '6 Airbags',
    'Audio': 'Premium'
  };

  document.querySelectorAll('.spec-card').forEach(card => {
    const label = card.querySelector('.spec-card__label').textContent.trim();
    const valueEl = card.querySelector('.spec-card__value');
    if (valueEl && specMapping[label] !== undefined) {
      valueEl.textContent = specMapping[label];
    }
  });

  // --- 8. Populate Booking Card & Calculation ---
  const bookingTitle = document.querySelector('.booking-card__title');
  if (bookingTitle) bookingTitle.textContent = `Book ${currentCar.carName}`;

  const bookingAvailability = document.querySelector('.booking-card__availability');
  if (bookingAvailability) {
    bookingAvailability.textContent = currentCar.status;
    if (currentCar.status === 'Available') {
      bookingAvailability.style.background = 'rgba(16, 185, 129, 0.1)';
      bookingAvailability.style.color = '#10b981';
    } else {
      bookingAvailability.style.background = 'rgba(217, 119, 6, 0.1)';
      bookingAvailability.style.color = '#d97706';
    }
  }

  const bookingValHourly = document.querySelector('.booking-card__price-item:first-child .booking-card__price-val');
  if (bookingValHourly) bookingValHourly.textContent = `$${currentCar.hourlyPrice}`;

  const bookingValDaily = document.querySelector('.booking-card__price-item:last-child .booking-card__price-val');
  if (bookingValDaily) bookingValDaily.textContent = `$${currentCar.dailyPrice}`;

  const durationRow = document.querySelectorAll('.booking-card__row')[0];
  const chargeRow = document.querySelectorAll('.booking-card__row')[1];
  const depositRow = document.querySelectorAll('.booking-card__row')[2];
  const serviceFeeRow = document.querySelectorAll('.booking-card__row')[3];
  const totalValueEl = document.querySelector('.booking-card__total-value');
  const typeButtons = document.querySelectorAll('.booking-card__type-btn');

  let activeType = 'hourly'; 

  function updateBookingCalculation() {
    const serviceFee = 25;
    const deposit = 200;
    
    if (activeType === 'hourly') {
      const hours = 3;
      const baseCharge = currentCar.hourlyPrice * hours;
      const total = baseCharge + deposit + serviceFee;
      
      if (durationRow) durationRow.querySelector('.booking-card__row-value').textContent = `${hours} Hours`;
      if (chargeRow) chargeRow.querySelector('.booking-card__row-value').textContent = `$${baseCharge.toFixed(2)}`;
      if (depositRow) depositRow.querySelector('.booking-card__row-value').textContent = `$${deposit.toFixed(2)}`;
      if (serviceFeeRow) serviceFeeRow.querySelector('.booking-card__row-value').textContent = `$${serviceFee.toFixed(2)}`;
      if (totalValueEl) totalValueEl.textContent = `$${total}`;
    } else {
      const days = 1;
      const baseCharge = currentCar.dailyPrice * days;
      const total = baseCharge + deposit + serviceFee;
      
      if (durationRow) durationRow.querySelector('.booking-card__row-value').textContent = `${days} Day`;
      if (chargeRow) chargeRow.querySelector('.booking-card__row-value').textContent = `$${baseCharge.toFixed(2)}`;
      if (depositRow) depositRow.querySelector('.booking-card__row-value').textContent = `$${deposit.toFixed(2)}`;
      if (serviceFeeRow) serviceFeeRow.querySelector('.booking-card__row-value').textContent = `$${serviceFee.toFixed(2)}`;
      if (totalValueEl) totalValueEl.textContent = `$${total}`;
    }
  }

  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      typeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeType = btn.getAttribute('data-type');
      updateBookingCalculation();
    });
  });

  updateBookingCalculation();

  // --- 9. Populate Features ---
  const featuresContainer = document.querySelector('.features-list');
  if (featuresContainer && currentCar.features) {
    featuresContainer.innerHTML = '';
    currentCar.features.forEach(f => {
      const pill = document.createElement('div');
      pill.className = 'feature-pill';
      pill.innerHTML = `<div class="feature-pill__icon"><span class="icon icon--sm"><svg><use href="assets/icons/sprite.svg#icon-check"/></svg></span></div> ${f}`;
      featuresContainer.appendChild(pill);
    });
  }

  // --- 10. Populate Description Paragraphs ---
  const descParagraphs = document.querySelectorAll('.detail-desc__text');
  if (descParagraphs.length > 0) {
    descParagraphs[0].textContent = currentCar.description;
    for (let i = 1; i < descParagraphs.length; i++) {
      descParagraphs[i].style.display = 'none';
    }
  }

  // --- 11. Populate Gallery Grid ---
  const galleryItems = document.querySelectorAll('.gallery-item');
  galleryItems.forEach((item, idx) => {
    const imgUrl = galleryImages[idx % galleryImages.length];
    item.innerHTML = `
      <img src="${imgUrl}" alt="${currentCar.carName} Gallery View ${idx + 1}" style="width:100%; height:100%; object-fit:cover;">
      <div class="gallery-item__overlay">
        <span class="gallery-item__zoom">
          <span class="icon icon--sm"><svg><use href="assets/icons/sprite.svg#icon-search"/></svg></span>
        </span>
      </div>
    `;
  });

  // --- 12. Populate Rental Pricing Info Card ---
  const pricingList = document.querySelector('.rental-info-card__list');
  if (pricingList) {
    pricingList.innerHTML = `
      <li>Hourly Rental: $${currentCar.hourlyPrice}/hr</li>
      <li>Daily Rental: $${currentCar.dailyPrice}/day</li>
      <li>Weekly Rental: $${Math.round(currentCar.dailyPrice * 6)}/week</li>
      <li>Minimum rental: 2 hours</li>
      <li>Maximum rental: 30 days</li>
    `;
  }

  // --- 13. Populate Reviews Section ---
  const summaryScore = document.querySelector('.review-summary__score');
  if (summaryScore) summaryScore.textContent = ratingVal;

  const summaryStars = document.querySelector('.review-summary__stars');
  if (summaryStars) {
    summaryStars.innerHTML = Array(Math.round(ratingVal))
      .fill(`<span class="icon icon--sm"><svg><use href="assets/icons/sprite.svg#icon-star"/></svg></span>`)
      .join('');
  }

  const summaryCount = document.querySelector('.review-summary__count');
  if (summaryCount) summaryCount.textContent = `Based on 12 reviews`;

  const reviewsContainer = document.querySelector('.review-cards');
  if (reviewsContainer) {
    // Keep dummy reviews for display purposes since DB doesn't have reviews yet
  }

  // --- 14. Populate Related Vehicles ---
  const relatedGrid = document.querySelector('.related-grid');
  if (relatedGrid) {
    relatedGrid.innerHTML = '';
    
    // Fetch 4 related cars from the same category
    try {
      const relRes = await window.CarAPI.fetchCars({ category: currentCar.category, limit: 5 });
      const otherCars = relRes.data.filter(c => c._id !== currentCar._id).slice(0, 4);
      
      otherCars.forEach(rc => {
        const card = document.createElement('div');
        card.className = 'related-card';

        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'related-card__image';

        const rcImg = document.createElement('img');
        const rcHero = (rc.images && rc.images.length > 0) ? rc.images[0].url : VEHICLE_PLACEHOLDER_SVG;
        rcImg.src = rcHero;
        rcImg.alt = `${rc.brand} ${rc.carName}`;
        rcImg.style.width = '100%';
        rcImg.style.height = '100%';
        rcImg.style.objectFit = 'cover';

        const handleRcErr = function() {
          rcImg.src = VEHICLE_PLACEHOLDER_SVG;
          rcImg.removeEventListener('error', handleRcErr);
        };
        rcImg.addEventListener('error', handleRcErr);
        imgWrapper.appendChild(rcImg);
        card.appendChild(imgWrapper);

        const body = document.createElement('div');
        body.className = 'related-card__body';
        body.innerHTML = `
          <div class="related-card__brand">${rc.brand}</div>
          <h3 class="related-card__name">${rc.carName}</h3>
          <div class="related-card__footer">
            <span class="related-card__price">$${rc.hourlyPrice}<span class="related-card__price-unit">/hr</span></span>
            <span class="related-card__rating">
              <span class="icon icon--sm"><svg><use href="assets/icons/sprite.svg#icon-star"/></svg></span> 4.9
            </span>
          </div>
          <a href="car-details.html?id=${rc._id}" class="btn btn--outline btn--sm">View Details</a>
        `;
        card.appendChild(body);
        relatedGrid.appendChild(card);
      });
    } catch(err) {
      console.error('Failed to load related cars', err);
    }
  }

  // --- 15. Wire Accordions ---
  document.querySelectorAll('.terms-item__question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.terms-item');
      const parent = item.parentElement;
      const wasOpen = item.classList.contains('open');
      parent.querySelectorAll('.terms-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

})();
