/**
 * Dynamic Car Details Populator for JET CABS
 * Reads selected vehicle ID from query parameters and populates the UI.
 */

(function() {
  'use strict';

  // --- 1. Read Query Parameter ---
  const urlParams = new URLSearchParams(window.location.search);
  const rawId = parseInt(urlParams.get('id'));
  
  // Find selected vehicle (fallback to ID 1 if invalid or not found)
  let currentCar = window.vehiclesData.find(car => car.id === rawId);
  if (!currentCar) {
    currentCar = window.vehiclesData[0]; // fallback
  }

  // Update Rent Now buttons in details page to carry over the car ID and start pre-booking
  document.querySelectorAll('.showcase__actions a[href^="booking.html"], .booking-card a[href^="booking.html"]').forEach(btn => {
    btn.setAttribute('href', `booking.html?flow=prebooking&car=${currentCar.id}`);
  });

  // --- 2. Populate Page Metadata ---
  document.title = `${currentCar.brand} ${currentCar.name} — JET CABS`;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', `${currentCar.brand} ${currentCar.name} — ${currentCar.description}`);
  }

  // --- 3. Populate Hero Section ---
  const heroTitle = document.querySelector('.detail-hero__title');
  if (heroTitle) {
    heroTitle.innerHTML = `${currentCar.brand} <span class="highlight">${currentCar.name}</span>`;
  }
  const heroDesc = document.querySelector('.detail-hero__desc');
  if (heroDesc) {
    heroDesc.textContent = currentCar.description;
  }

  // --- 4. Populate Breadcrumbs ---
  const breadcrumbActive = document.querySelector('.breadcrumb__item.active');
  if (breadcrumbActive) {
    breadcrumbActive.textContent = currentCar.name;
  }

  // --- 5. Populate Showcase Info ---
  const showcaseBrand = document.querySelector('.showcase__brand');
  if (showcaseBrand) showcaseBrand.textContent = currentCar.brand;

  const showcaseName = document.querySelector('.showcase__name');
  if (showcaseName) showcaseName.textContent = currentCar.name;

  const showcaseYear = document.querySelector('.showcase__year');
  if (showcaseYear) {
    showcaseYear.textContent = `${currentCar.name.includes('S-Class') || currentCar.brand === 'Porsche' || currentCar.brand === 'Mercedes-Benz' ? '2025' : '2024'} Model`;
  }

  // Star Rating
  const showcaseStars = document.querySelector('.showcase__stars');
  if (showcaseStars) {
    showcaseStars.innerHTML = Array(Math.round(currentCar.rating))
      .fill(`<span class="icon icon--sm"><svg><use href="assets/icons/sprite.svg#icon-star"/></svg></span>`)
      .join('');
  }
  const showcaseRatingText = document.querySelector('.showcase__rating-text');
  if (showcaseRatingText) showcaseRatingText.textContent = currentCar.rating;

  const showcaseRatingCount = document.querySelector('.showcase__rating-count');
  if (showcaseRatingCount) showcaseRatingCount.textContent = `(${currentCar.reviewCount} reviews)`;

  // Availability badge
  const showcaseAvailability = document.querySelector('.showcase__rating-row .badge');
  if (showcaseAvailability) {
    showcaseAvailability.textContent = currentCar.availability;
    if (currentCar.availability.toLowerCase() === 'available') {
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
    metaValues[0].textContent = currentCar.vehicleId;
    metaValues[1].textContent = `${currentCar.category} Sedan / SUV / Sport`;
    metaValues[2].textContent = currentCar.bodyType;
    metaValues[3].textContent = currentCar.color;
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
  const VEHICLE_PLACEHOLDER_SVG = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHlsZT0iYmFja2dyb3VuZDojRjNGNEY2O3dpZHRoOjEwMCU7aGVpZ2h0OjEwMCU7cGFkZGluZzoyMHB4OyI+PHBhdGggZD0iTTE5IDE3aDJjLjYgMCAxLS40IDEtMXYtM2MwLS45LS43LTEuNy0xLjUtMS45QzE4LjcgMTAuNiAxNiAxMCAxNiAxMHMtMS4zLTEuNC0yLjItMi4zYy0uNS0uNC0xLjEtLjctMS44LS43SDVjLS42IDAtMS4xLjQtMS40LjlsLTEuNCAyLjlBMy43IDMuNyAwIDAgMCAxIDEzdjNjMCAuNi40IDEgMSAxaDIiLz48Y2lyY2xlIGN4PSI3IiBjeT0iMTciIHI9IjIiLz48cGF0aCBkPSJNOSAxN2g2Ii8+PGNpcmNsZSBjeD0iMTciIGN5PSIxNyIgcj0iMiIvPjwvc3ZnPg==`;

  const mainImageContainer = document.getElementById('main-image');
  if (mainImageContainer) {
    const mainImg = document.createElement('img');
    mainImg.src = currentCar.heroImage || VEHICLE_PLACEHOLDER_SVG;
    mainImg.alt = `${currentCar.brand} ${currentCar.name} Main View`;
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
    const thumbImgUrl = currentCar.galleryImages[index % currentCar.galleryImages.length];
    const placeholder = thumb.querySelector('.showcase__thumb-placeholder');
    if (placeholder) {
      placeholder.innerHTML = '';
      const thumbImg = document.createElement('img');
      thumbImg.src = thumbImgUrl;
      thumbImg.alt = `${currentCar.brand} ${currentCar.name} Thumb ${index + 1}`;
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

    // Set active class back to index 0
    if (index === 0) {
      thumb.classList.add('active');
    } else {
      thumb.classList.remove('active');
    }

    // Gallery click handler
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
    'Fuel': currentCar.specifications.fuel,
    'Transmission': currentCar.specifications.transmission,
    'Seats': currentCar.specifications.seats,
    'Mileage': currentCar.specifications.mileage,
    'Engine': currentCar.specifications.engine,
    'Horsepower': currentCar.specifications.horsepower,
    'Top Speed': currentCar.specifications.topSpeed,
    'Fuel Economy': currentCar.specifications.fuelEconomy,
    'Color': currentCar.color,
    'Body Type': currentCar.bodyType,
    'Drive Type': currentCar.specifications.driveType,
    'Doors': currentCar.specifications.doors,
    'Air Conditioning': currentCar.specifications.ac,
    'GPS': currentCar.specifications.gps,
    'Bluetooth': currentCar.specifications.bluetooth,
    'Parking': currentCar.specifications.parking,
    'Camera': currentCar.specifications.camera,
    'ABS': currentCar.specifications.abs,
    'Airbags': currentCar.specifications.airbags,
    'Audio': currentCar.specifications.audio
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
  if (bookingTitle) bookingTitle.textContent = `Book ${currentCar.name}`;

  const bookingAvailability = document.querySelector('.booking-card__availability');
  if (bookingAvailability) {
    bookingAvailability.textContent = currentCar.availability;
    if (currentCar.availability.toLowerCase() === 'available') {
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

  // Booking Card Pricing toggle calculations
  const durationRow = document.querySelectorAll('.booking-card__row')[0];
  const chargeRow = document.querySelectorAll('.booking-card__row')[1];
  const depositRow = document.querySelectorAll('.booking-card__row')[2];
  const serviceFeeRow = document.querySelectorAll('.booking-card__row')[3];
  const totalValueEl = document.querySelector('.booking-card__total-value');
  const typeButtons = document.querySelectorAll('.booking-card__type-btn');

  let activeType = 'hourly'; // default toggle state

  function updateBookingCalculation() {
    const serviceFee = 25;
    const deposit = 200;
    
    if (activeType === 'hourly') {
      const hours = 3; // standard base example
      const baseCharge = currentCar.hourlyPrice * hours;
      const total = baseCharge + deposit + serviceFee;
      
      if (durationRow) durationRow.querySelector('.booking-card__row-value').textContent = `${hours} Hours`;
      if (chargeRow) chargeRow.querySelector('.booking-card__row-value').textContent = `$${baseCharge.toFixed(2)}`;
      if (depositRow) depositRow.querySelector('.booking-card__row-value').textContent = `$${deposit.toFixed(2)}`;
      if (serviceFeeRow) serviceFeeRow.querySelector('.booking-card__row-value').textContent = `$${serviceFee.toFixed(2)}`;
      if (totalValueEl) totalValueEl.textContent = `$${total}`;
    } else {
      const days = 1; // standard base example
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

  // Run initial calculation
  updateBookingCalculation();

  // --- 9. Populate Features ---
  const featuresContainer = document.querySelector('.features-list');
  if (featuresContainer) {
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
    
    // Clear out/hide subsequent static paragraphs to prevent carrying over Mercedes info to other cars
    for (let i = 1; i < descParagraphs.length; i++) {
      descParagraphs[i].style.display = 'none';
    }
  }

  // --- 11. Populate Gallery Grid ---
  const galleryItems = document.querySelectorAll('.gallery-item');
  galleryItems.forEach((item, idx) => {
    const imgUrl = currentCar.galleryImages[idx % currentCar.galleryImages.length];
    item.innerHTML = `
      <img src="${imgUrl}" alt="${currentCar.name} Gallery View ${idx + 1}" style="width:100%; height:100%; object-fit:cover;">
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
  if (summaryScore) summaryScore.textContent = currentCar.rating;

  const summaryStars = document.querySelector('.review-summary__stars');
  if (summaryStars) {
    summaryStars.innerHTML = Array(Math.round(currentCar.rating))
      .fill(`<span class="icon icon--sm"><svg><use href="assets/icons/sprite.svg#icon-star"/></svg></span>`)
      .join('');
  }

  const summaryCount = document.querySelector('.review-summary__count');
  if (summaryCount) summaryCount.textContent = `Based on ${currentCar.reviewCount} reviews`;

  const reviewsContainer = document.querySelector('.review-cards');
  if (reviewsContainer) {
    reviewsContainer.innerHTML = '';
    currentCar.reviews.forEach(r => {
      const starsHtml = Array(r.stars)
        .fill(`<span class="icon icon--sm"><svg><use href="assets/icons/sprite.svg#icon-star"/></svg></span>`)
        .join('');
        
      const card = document.createElement('div');
      card.className = 'review-card';
      card.innerHTML = `
        <div class="review-card__header">
          <div class="review-card__avatar"><span class="icon icon--sm"><svg><use href="assets/icons/sprite.svg#icon-user"/></svg></span></div>
          <div>
            <div class="review-card__name">${r.name}</div>
            <div class="review-card__meta"><span>${r.date}</span><span>${r.duration}</span></div>
            <div class="review-card__stars">${starsHtml}</div>
          </div>
        </div>
        <p class="review-card__text">${r.text}</p>
      `;
      reviewsContainer.appendChild(card);
    });
  }

  // --- 14. Populate Related Vehicles ---
  const relatedGrid = document.querySelector('.related-grid');
  if (relatedGrid) {
    relatedGrid.innerHTML = '';
    
    // Get other vehicles in same category, sort/shuffle to pick 4
    const otherCars = window.vehiclesData.filter(car => car.id !== currentCar.id);
    const sortedRelated = otherCars.sort((a, b) => {
      if (a.category === currentCar.category && b.category !== currentCar.category) return -1;
      if (b.category === currentCar.category && a.category !== currentCar.category) return 1;
      return 0.5 - Math.random();
    });
    
    const relatedSubset = sortedRelated.slice(0, 4);
    relatedSubset.forEach(rc => {
      const card = document.createElement('div');
      card.className = 'related-card';

      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'related-card__image';

      const rcImg = document.createElement('img');
      rcImg.src = rc.heroImage || VEHICLE_PLACEHOLDER_SVG;
      rcImg.alt = `${rc.brand} ${rc.name}`;
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
        <h3 class="related-card__name">${rc.name}</h3>
        <div class="related-card__footer">
          <span class="related-card__price">$${rc.hourlyPrice}<span class="related-card__price-unit">/hr</span></span>
          <span class="related-card__rating">
            <span class="icon icon--sm"><svg><use href="assets/icons/sprite.svg#icon-star"/></svg></span> ${rc.rating}
          </span>
        </div>
        <a href="car-details.html?id=${rc.id}" class="btn btn--outline btn--sm">View Details</a>
      `;
      card.appendChild(body);
      relatedGrid.appendChild(card);
    });
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
