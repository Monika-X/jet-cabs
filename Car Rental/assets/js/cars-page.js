(function () {
  'use strict';

  // --- 1. State Management ---
  const state = {
    search: '',
    brand: [],
    category: [],
    priceMin: 0,
    priceMax: 500,
    seatingCapacity: [],
    fuelType: [],
    transmission: [],
    sortBy: 'createdAt', // Mapping UI sorts to backend sorts
    viewMode: localStorage.getItem('viewMode') || 'grid',
    currentPage: 1,
    itemsPerPage: 4
  };

  // --- 2. DOM Elements Cache ---
  const gridContainer = document.getElementById('vehicle-grid');
  const searchInput = document.getElementById('search-keyword');
  const brandSelect = document.getElementById('search-brand');
  const categorySelect = document.getElementById('search-category');
  const sortSelect = document.getElementById('sort-by');
  const filterSidebar = document.getElementById('filter-sidebar');
  const filterToggleBtn = document.getElementById('filter-toggle');
  const emptyState = document.getElementById('cars-empty');
  const resultCounter = document.querySelector('.cars-toolbar__count');
  const gridViewBtn = document.querySelector('.view-btn[aria-label="Grid view"]');
  const listViewBtn = document.querySelector('.view-btn[aria-label="List view"]');
  const paginationContainer = document.querySelector('.pagination');
  const skeletonGrid = document.getElementById('loading-skeleton');

  // We don't have these array-based multi-selects on backend simply,
  // we'll pick the first selected or map appropriately.
  let renderTimeout = null;

  function getCategoryBadgeClass(category) {
    const cat = String(category || '').toLowerCase();
    if (cat.includes('suv')) return 'badge--suvs';
    if (cat.includes('electric')) return 'badge--electric';
    if (cat.includes('sedan')) return 'badge--sedans';
    if (cat.includes('hatch')) return 'badge--hatchbacks';
    if (cat.includes('convert')) return 'badge--convertibles';
    if (cat.includes('sport')) return 'badge--sports';
    if (cat.includes('luxury') || cat.includes('premium')) return 'badge--luxury';
    return 'badge--type';
  }

  async function fetchAndUpdateFilterCounts() {
    try {
      const response = await fetch('/api/cars/filters');
      const res = await response.json();
      if (!res.success) return;

      const { categories, brands, fuelTypes, transmissions, seating } = res.data;

      document.querySelectorAll('.filter-group').forEach(group => {
        const titleEl = group.querySelector('.filter-group__title');
        if (!titleEl) return;
        const groupTitle = titleEl.textContent.trim();

        let aggArray = null;
        if (groupTitle.includes('Category')) aggArray = categories;
        else if (groupTitle.includes('Brand')) aggArray = brands;
        else if (groupTitle.includes('Fuel')) aggArray = fuelTypes;
        else if (groupTitle.includes('Transmission')) aggArray = transmissions;
        else if (groupTitle.includes('Seats')) aggArray = seating;

        if (!aggArray) return;

        group.querySelectorAll('.filter-checkbox').forEach(label => {
          const countSpan = label.querySelector('.filter-checkbox__count');
          if (!countSpan) return;

          const textNode = Array.from(label.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0);
          const filterValue = textNode ? textNode.textContent.trim() : '';
          if (!filterValue) return;

          let sum = 0;
          if (groupTitle.includes('Seats')) {
            const seatsVal = parseInt(filterValue);
            if (!isNaN(seatsVal)) {
              const match = aggArray.find(a => a._id === seatsVal);
              if (match) sum = match.count;
            }
          } else {
            const regex = new RegExp(filterValue, 'i');
            aggArray.forEach(item => {
              if (item._id && regex.test(item._id.toString())) {
                sum += item.count;
              }
            });
          }

          countSpan.textContent = sum;
        });
      });
    } catch (error) {
      console.error('Failed to fetch filter counts:', error);
    }
  }

  async function fetchAndRenderCars() {
    if (skeletonGrid && gridContainer) {
      skeletonGrid.style.display = 'grid';
      gridContainer.style.display = 'none';
      if (paginationContainer) paginationContainer.style.display = 'none';
    }

    try {
      // Build query parameters for fetch
      const queryParams = new URLSearchParams();
      queryParams.append('page', state.currentPage);
      queryParams.append('limit', state.itemsPerPage);

      if (state.search) queryParams.append('search', state.search);
      if (state.brand.length > 0) queryParams.append('brand', state.brand.join(','));
      if (state.category.length > 0) queryParams.append('category', state.category.join(','));
      if (state.fuelType.length > 0) queryParams.append('fuelType', state.fuelType.join(','));
      if (state.transmission.length > 0) queryParams.append('transmission', state.transmission.join(','));
      if (state.seatingCapacity.length > 0) queryParams.append('seatingCapacity', state.seatingCapacity.join(','));
      if (state.priceMin > 0) queryParams.append('minPrice', state.priceMin);
      if (state.priceMax < 500) queryParams.append('maxPrice', state.priceMax);

      // Map frontend sort to backend sort
      if (state.sortBy === 'Price Low → High') queryParams.append('sort', 'priceLowToHigh');
      else if (state.sortBy === 'Price High → Low') queryParams.append('sort', 'priceHighToLow');
      else if (state.sortBy === 'Alphabetical') queryParams.append('sort', 'alphabetical');

      const response = await fetch(`/api/cars?${queryParams.toString()}`);
      const res = await response.json();

      if (!res.success) throw new Error(res.message || 'Failed to fetch');

      const cars = res.data;
      const pagination = res.pagination || { totalRecords: cars.length, currentPage: 1, totalPages: 1 };

      if (skeletonGrid && gridContainer) {
        skeletonGrid.style.display = 'none';
        gridContainer.style.display = 'grid';
      }

      render(cars, pagination);

      // Update sidebar counts with latest DB aggregations
      fetchAndUpdateFilterCounts();

    } catch (error) {
      console.error('Failed to fetch cars:', error);
      if (skeletonGrid) skeletonGrid.style.display = 'none';
      if (emptyState) {
        emptyState.classList.add('visible');
        emptyState.innerHTML = '<div style="color:var(--color-danger); text-align:center;">Failed to load vehicles. Please try again.</div>';
      }
    }
  }

  function render(cars, pagination) {
    // Update Result Counter
    if (resultCounter) {
      resultCounter.innerHTML = `Showing <span>${cars.length}</span> of ${pagination.totalRecords} vehicles`;
    }

    // Handle Empty State
    if (!cars || cars.length === 0) {
      if (emptyState) emptyState.classList.add('visible');
      if (gridContainer) gridContainer.innerHTML = '';
      if (paginationContainer) paginationContainer.style.display = 'none';
      return;
    } else {
      if (emptyState) emptyState.classList.remove('visible');
      if (paginationContainer) paginationContainer.style.display = 'flex';
    }

    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    if (state.viewMode === 'list') {
      gridContainer.classList.add('vehicle-grid--list');
    } else {
      gridContainer.classList.remove('vehicle-grid--list');
    }

    cars.forEach((car, index) => {
      const delay = (index % 4) * 0.15;
      const heroImage = car.images && car.images.length > 0 ? car.images[0].url : 'assets/images/cars/luxury.png';

      const badgeHTML = car.status === 'Available' ? '<span class="badge badge--available">Available</span>' : '<span class="badge badge--popular">Rented</span>';

      const cardHTML = `
        <div class="v-card scroll-reveal" style="--delay:${delay}s">
          <div class="v-card__image">
            <img src="${heroImage}" alt="${car.brand} ${car.carName}" class="v-card__car-img" loading="lazy">
            <div class="v-card__badges">
              ${badgeHTML}
              <span class="badge ${getCategoryBadgeClass(car.category)}">${car.category}</span>
            </div>
            <button class="v-card__favorite" aria-label="Add to favorites">
              <span class="icon icon--sm"><svg><use href="assets/icons/sprite.svg#icon-heart"/></svg></span>
            </button>
          </div>
          <div class="v-card__body">
            <div class="v-card__brand">${car.brand}</div>
            <h3 class="v-card__name">${car.carName}</h3>
            <p class="v-card__desc">${car.description ? car.description.substring(0, 80) + '...' : ''}</p>
            <div class="v-card__specs">
              <span class="v-card__spec"><span class="v-card__spec-icon"><span class="icon icon--sm"><svg><use href="assets/icons/sprite.svg#icon-fuel"/></svg></span></span> ${car.fuelType}</span>
              <span class="v-card__spec"><span class="v-card__spec-icon"><span class="icon icon--sm"><svg><use href="assets/icons/sprite.svg#icon-settings"/></svg></span></span> ${car.transmission}</span>
              <span class="v-card__spec"><span class="v-card__spec-icon"><span class="icon icon--sm"><svg><use href="assets/icons/sprite.svg#icon-user"/></svg></span></span> ${car.seatingCapacity} Seats</span>
            </div>
            <div class="v-card__features">
              ${(car.features || []).slice(0, 3).map(f => `<span class="v-card__feature"><span class="icon icon--xs"><svg><use href="assets/icons/sprite.svg#icon-check"/></svg></span> ${f}</span>`).join('')}
            </div>
            <div class="v-card__footer">
              <div class="v-card__pricing">
                <span class="v-card__price">$${car.hourlyPrice}<span class="v-card__price-unit">/hr</span></span>
                <span class="v-card__price-daily">$${car.dailyPrice}/day</span>
              </div>
              <div class="v-card__rating"><span class="v-card__rating-star"><span class="icon icon--sm"><svg><use href="assets/icons/sprite.svg#icon-star"/></svg></span></span> 4.9 <span class="v-card__rating-count">(10)</span></div>
            </div>
            <div class="v-card__cta">
              <a href="car-details.html?id=${car._id}" class="btn btn--outline btn--sm">Details</a>
              <a href="booking.html?flow=direct&id=${car._id}" class="btn btn--primary btn--sm">Rent Now</a>
            </div>
          </div>
        </div>
      `;
      gridContainer.insertAdjacentHTML('beforeend', cardHTML);
    });

    renderPagination(pagination.totalPages);

    // Re-initialize animations for dynamically added elements
    if (typeof Anim !== 'undefined' && Anim.initScrollReveal) {
      setTimeout(() => Anim.initScrollReveal(), 50);
    }
  }

  function renderPagination(totalPages) {
    if (!paginationContainer) return;

    if (totalPages <= 1) {
      paginationContainer.style.display = 'none';
      return;
    }
    paginationContainer.style.display = 'flex';
    paginationContainer.innerHTML = '';

    const prevBtn = document.createElement('a');
    prevBtn.href = '#';
    prevBtn.className = `pagination__btn ${state.currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '‹';
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (state.currentPage > 1) {
        state.currentPage--;
        fetchAndRenderCars();
        window.scrollTo({ top: 400, behavior: 'smooth' });
      }
    });
    paginationContainer.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement('a');
      pageBtn.href = '#';
      pageBtn.className = `pagination__btn ${state.currentPage === i ? 'active' : ''}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        state.currentPage = i;
        fetchAndRenderCars();
        window.scrollTo({ top: 400, behavior: 'smooth' });
      });
      paginationContainer.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('a');
    nextBtn.href = '#';
    nextBtn.className = `pagination__btn ${state.currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = '›';
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (state.currentPage < totalPages) {
        state.currentPage++;
        fetchAndRenderCars();
        window.scrollTo({ top: 400, behavior: 'smooth' });
      }
    });
    paginationContainer.appendChild(nextBtn);
  }

  // --- 6. Event Listeners ---
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      state.search = e.target.value;
      state.currentPage = 1;
      fetchAndRenderCars();
    }, 300));
  }

  if (brandSelect) {
    brandSelect.addEventListener('change', (e) => {
      state.brand = e.target.value ? [e.target.value] : [];
      state.currentPage = 1;
      fetchAndRenderCars();
    });
  }

  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      state.category = e.target.value ? [e.target.value] : [];
      state.currentPage = 1;
      fetchAndRenderCars();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      fetchAndRenderCars();
    });
  }

  if (gridViewBtn && listViewBtn) {
    gridViewBtn.addEventListener('click', () => {
      gridViewBtn.classList.add('active');
      listViewBtn.classList.remove('active');
      state.viewMode = 'grid';
      localStorage.setItem('viewMode', 'grid');
      fetchAndRenderCars();
    });

    listViewBtn.addEventListener('click', () => {
      listViewBtn.classList.add('active');
      gridViewBtn.classList.remove('active');
      state.viewMode = 'list';
      localStorage.setItem('viewMode', 'list');
      fetchAndRenderCars();
    });

    if (state.viewMode === 'list') {
      listViewBtn.classList.add('active');
      gridViewBtn.classList.remove('active');
    } else {
      gridViewBtn.classList.add('active');
      listViewBtn.classList.remove('active');
    }
  }

  if (filterToggleBtn && filterSidebar) {
    filterToggleBtn.addEventListener('click', () => {
      const isShown = filterSidebar.classList.toggle('show');
      filterToggleBtn.innerHTML = isShown ?
        '<span class="icon icon--sm"><svg><use href="assets/icons/sprite.svg#icon-close"/></svg></span> Hide Filters' :
        '<span class="icon icon--sm"><svg><use href="assets/icons/sprite.svg#icon-wrench"/></svg></span> Show Filters';
    });
  }

  document.querySelectorAll('.filter-group__title').forEach(title => {
    title.addEventListener('click', () => {
      title.closest('.filter-group').classList.toggle('collapsed');
    });
  });

  const clearFiltersBtn = document.querySelector('.filter-sidebar__clear');
  const resetBtn = document.querySelector('.cars-search__actions .btn--ghost');
  const emptyResetBtn = document.querySelector('.cars-empty .btn');

  function resetAllFilters() {
    state.search = '';
    state.brand = [];
    state.category = [];
    state.fuelType = [];
    state.transmission = [];
    state.seatingCapacity = [];
    state.priceMin = 0;
    state.priceMax = 500;
    state.sortBy = 'Newest';
    state.currentPage = 1;

    if (searchInput) searchInput.value = '';
    if (brandSelect) brandSelect.value = '';
    if (categorySelect) categorySelect.value = '';
    if (sortSelect) sortSelect.value = 'Newest';

    document.querySelectorAll('.filter-sidebar input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
    });

    document.querySelectorAll('.filter-sidebar input[type="radio"]').forEach(rad => {
      rad.checked = false;
    });

    const slider = document.querySelector('.filter-range__slider');
    const minInput = document.querySelector('.filter-range__inputs div:nth-child(1) input');
    const maxInput = document.querySelector('.filter-range__inputs div:nth-child(2) input');
    if (slider) slider.value = 500;
    if (minInput) minInput.value = 0;
    if (maxInput) maxInput.value = 500;

    fetchAndRenderCars();
  }

  if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', (e) => { e.preventDefault(); resetAllFilters(); });
  if (resetBtn) resetBtn.addEventListener('click', (e) => { e.preventDefault(); resetAllFilters(); });
  if (emptyResetBtn) emptyResetBtn.addEventListener('click', (e) => { e.preventDefault(); resetAllFilters(); });

  // Sidebar Filter Changes
  if (filterSidebar) {
    filterSidebar.addEventListener('change', (e) => {
      const target = e.target;
      if (target.type === 'checkbox') {
        const label = target.closest('.filter-checkbox');
        if (!label) return;
        const textNode = Array.from(label.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0);
        const text = textNode ? textNode.textContent.trim() : '';
        const groupTitle = target.closest('.filter-group').querySelector('.filter-group__title').textContent.trim();

        const updateArray = (arr, val, isChecked) => {
          if (isChecked) {
            if (!arr.includes(val)) arr.push(val);
          } else {
            const idx = arr.indexOf(val);
            if (idx > -1) arr.splice(idx, 1);
          }
        };

        if (groupTitle.includes('Category')) {
          updateArray(state.category, text, target.checked);
        } else if (groupTitle.includes('Brand')) {
          updateArray(state.brand, text, target.checked);
        } else if (groupTitle.includes('Fuel')) {
          updateArray(state.fuelType, text, target.checked);
        } else if (groupTitle.includes('Transmission')) {
          updateArray(state.transmission, text, target.checked);
        } else if (groupTitle.includes('Seats')) {
          const seats = parseInt(text);
          if (!isNaN(seats)) updateArray(state.seatingCapacity, seats, target.checked);
        }

      }

      state.currentPage = 1;
      fetchAndRenderCars();
    });
  }

  const slider = document.querySelector('.filter-range__slider');
  const minInput = document.querySelector('.filter-range__inputs div:nth-child(1) input');
  const maxInput = document.querySelector('.filter-range__inputs div:nth-child(2) input');
  if (slider && minInput && maxInput) {
    slider.addEventListener('input', (e) => {
      maxInput.value = e.target.value;
      state.priceMax = parseFloat(e.target.value) || 500;
      state.currentPage = 1;
    });
    slider.addEventListener('change', () => fetchAndRenderCars());

    minInput.addEventListener('change', (e) => {
      state.priceMin = parseFloat(e.target.value) || 0;
      state.currentPage = 1;
      fetchAndRenderCars();
    });
    maxInput.addEventListener('change', (e) => {
      slider.value = e.target.value;
      state.priceMax = parseFloat(e.target.value) || 500;
      state.currentPage = 1;
      fetchAndRenderCars();
    });
  }

  // Initial Fetch
  document.addEventListener('DOMContentLoaded', fetchAndRenderCars);

})();
