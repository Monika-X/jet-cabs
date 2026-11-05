/* ============================================================
   CAR RENTAL SYSTEM — MAIN.JS
   Navbar, Scroll, Page Init, Back-to-Top, Active Nav
   ============================================================ */

'use strict';

const App = (() => {

  /* ---- DOM Cache ---- */
  const DOM = {
    navbar:       () => document.querySelector('.navbar'),
    navToggle:    () => document.querySelector('.navbar__toggle'),
    mobileMenu:   () => document.querySelector('.navbar__mobile'),
    mobileOverlay:() => document.querySelector('.navbar__mobile-overlay'),
    backToTop:    () => document.querySelector('.back-to-top'),
    navLinks:     () => document.querySelectorAll('.navbar__link'),
    smoothLinks:  () => document.querySelectorAll('a[href^="#"]'),
  };

  /* ---- Sticky Navbar ---- */
  function initStickyNavbar() {
    const navbar = DOM.navbar();
    if (!navbar) return;

    const scrollThreshold = 80;

    function onScroll() {
      if (window.scrollY > scrollThreshold) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on load
  }

  /* ---- Mobile Menu Toggle ---- */
  function initMobileMenu() {
    const toggle = DOM.navToggle();
    const menu = DOM.mobileMenu();
    const overlay = DOM.mobileOverlay();

    if (!toggle || !menu) return;

    function openMenu() {
      toggle.classList.add('open');
      menu.classList.add('open');
      if (overlay) overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      toggle.classList.remove('open');
      menu.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', () => {
      if (menu.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (overlay) {
      overlay.addEventListener('click', closeMenu);
    }

    // Close menu on link click
    const mobileLinks = menu.querySelectorAll('.navbar__link');
    mobileLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        closeMenu();
      }
    });

    // Reset navigation state when crossing responsive breakpoints
    let lastBreakpoint = getBreakpoint();

    function getBreakpoint() {
      const width = window.innerWidth;
      if (width <= 767) return 'mobile';
      if (width <= 1024) return 'tablet';
      return 'desktop';
    }

    window.addEventListener('resize', () => {
      const currentBreakpoint = getBreakpoint();
      if (currentBreakpoint !== lastBreakpoint) {
        lastBreakpoint = currentBreakpoint;
        closeMenu();
      }
    });
  }

  /* ---- Active Nav Link ---- */
  function initActiveNavLink() {
    const links = DOM.navLinks();
    if (!links.length) return;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      const linkPage = href.split('/').pop();

      if (linkPage === currentPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /* ---- Smooth Scroll ---- */
  function initSmoothScroll() {
    const links = DOM.smoothLinks();

    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#' || href.length <= 1) return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        const navbarHeight = DOM.navbar()?.offsetHeight || 0;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      });
    });
  }

  /* ---- Back to Top ---- */
  function initBackToTop() {
    const btn = DOM.backToTop();
    if (!btn) return;

    const showThreshold = 400;

    function onScroll() {
      if (window.scrollY > showThreshold) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  /* ---- Profile Dropdown Menu ---- */
  function initProfileDropdown() {
    const wrapper = document.querySelector('.navbar__profile-menu-wrapper');
    const trigger = document.querySelector('.navbar__profile-btn');
    const dropdown = document.querySelector('.profile-dropdown');

    if (!trigger || !dropdown) return;

    function openDropdown() {
      trigger.setAttribute('aria-expanded', 'true');
      dropdown.classList.add('open');
    }

    function closeDropdown() {
      trigger.setAttribute('aria-expanded', 'false');
      dropdown.classList.remove('open');
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('open');
      if (isOpen) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (dropdown.classList.contains('open') && !wrapper.contains(e.target)) {
        closeDropdown();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dropdown.classList.contains('open')) {
        closeDropdown();
      }
    });

    // Handle dashboard link placeholders
    const placeholders = document.querySelectorAll('.dashboard-placeholder');
    placeholders.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        closeDropdown();

        const text = link.textContent.toLowerCase();
        if (text.includes('admin')) {
          window.location.href = 'admin-dashboard.html';
        } else if (text.includes('user')) {
          window.location.href = 'user-dashboard.html';
        } else {
          if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast({
              title: 'Coming Soon',
              message: 'Dashboard functionality is under construction.',
              type: 'info',
              duration: 3000
            });
          }
        }
      });
    });
  }

  /* ---- Page Transition ---- */
  function initPageTransition() {
    document.body.classList.add('page-transition');
  }

  /* ---- Handle Removed Pages Navigation ---- */
  function initRemovedPagesHandler() {
    const removedPages = [
      'dashboard.html',
      'extend-rental.html',
      'notifications.html',
      'profile.html',
      'rental-history.html',
      'reset-password.html',
      'upload-verification.html'
    ];

    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      const urlPath = href.split('#')[0].split('?')[0].trim();
      if (removedPages.some(page => urlPath.endsWith(page))) {
        e.preventDefault();
        
        // Close profile dropdown if open
        const trigger = document.querySelector('.navbar__profile-btn');
        const dropdown = document.querySelector('.profile-dropdown');
        if (trigger && dropdown && dropdown.classList.contains('open')) {
          trigger.setAttribute('aria-expanded', 'false');
          dropdown.classList.remove('open');
        }

        if (typeof UI !== 'undefined' && UI.showToast) {
          UI.showToast({
            title: 'Coming Soon',
            message: 'This feature will be available in a future update.',
            type: 'info',
            duration: 3000
          });
        }
      }
    });
  }

  /* ---- Inventory Simulation ---- */
  function initInventorySimulation() {
    // 1. Initialize default state if empty
    let inv = JSON.parse(localStorage.getItem('carInventory') || 'null');
    if (!inv && typeof window.vehiclesData !== 'undefined') {
      inv = {};
      window.vehiclesData.forEach(car => {
        inv[car.name] = { total: 5, available: 5 };
      });
      localStorage.setItem('carInventory', JSON.stringify(inv));
    }
    
    // Default fallback if vehiclesData is not defined on this page
    if (!inv) inv = {};

    function getInv(name) {
      if (!inv[name]) {
        inv[name] = { total: 5, available: 5 };
        localStorage.setItem('carInventory', JSON.stringify(inv));
      }
      return inv[name];
    }

    // 2. Render inventory info on cards with .badge--available
    const badges = document.querySelectorAll('.badge--available, .booking-card__availability');
    badges.forEach(badge => {
      // Find the closest card container (could be v-card, car-card, booking-card, or just body if details page)
      const card = badge.closest('.v-card, .car-card, .booking-card, .vehicle-details-card, .selected-vehicle-card') || document.body;
      let name = null;

      // Try to find car name within the same container
      const nameEl = card.querySelector('.v-card__name, .car-card__name, .booking-card__title, .car-details-header__title, .selected-vehicle-card__title');
      if (nameEl) {
        name = nameEl.textContent.trim();
      } else if (typeof window.vehiclesData !== 'undefined') {
        // Fallback for some pages like car-details.html where name might be different
        const urlParams = new URLSearchParams(window.location.search);
        const carId = urlParams.get('id');
        if (carId) {
          const car = window.vehiclesData.find(c => String(c.id) === String(carId));
          if (car) name = car.name;
        }
      }

      if (name) {
        const data = getInv(name);
        
        // Remove existing if any (for re-renders)
        let existing = badge.parentNode.querySelector('.inv-sim-display');
        if (existing) existing.remove();

        const invDiv = document.createElement('div');
        invDiv.className = 'inv-sim-display';
        invDiv.style.cssText = 'font-size: 11px; margin-top: 6px; color: var(--color-light-text); line-height: 1.4; display: block; text-align: left; font-weight: 500; letter-spacing: -0.2px;';
        invDiv.innerHTML = `<div>Total Cars: ${data.total}</div><div>Available Cars: ${data.available}</div>`;

        // Insert after badge if badge is inside a flex container or badges container
        if (badge.parentNode.classList.contains('v-card__badges') || badge.parentNode.classList.contains('car-card__badges')) {
           // We'll insert it into the card body instead to avoid absolute positioning overlaps
           const body = card.querySelector('.v-card__body, .car-card__body');
           if (body) {
             const specs = body.querySelector('.v-card__specs, .car-card__specs');
             if (specs) {
               // Add it before specs
               body.insertBefore(invDiv, specs);
               invDiv.style.marginBottom = '8px';
             } else {
               body.appendChild(invDiv);
             }
           } else {
             badge.parentNode.appendChild(invDiv);
           }
        } else {
           // For car-details and booking pages
           badge.parentNode.insertBefore(invDiv, badge.nextSibling);
        }
      }
    });
  }

  /* ---- Newsletter Form (footer, all pages) ---- */
  function initNewsletterForms() {
    document.querySelectorAll('#newsletter-form').forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');
        const email = input ? input.value.trim() : '';
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          if (typeof showToast === 'function') {
            showToast({ title: 'Invalid email', message: 'Please enter a valid email address.', type: 'error' });
          }
          if (input) input.focus();
          return;
        }
        form.reset();
        if (typeof showToast === 'function') {
          showToast({ title: 'Subscribed!', message: 'You are on the fast lane — watch your inbox for exclusive deals.', type: 'success' });
        }
      });
    });
  }

  /* ---- Initialize ---- */
  function init() {
    initStickyNavbar();
    initMobileMenu();
    initActiveNavLink();
    initSmoothScroll();
    initBackToTop();
    initProfileDropdown();
    initRemovedPagesHandler();
    initPageTransition();
    initInventorySimulation(); // Init inventory display
    initNewsletterForms();
  }

  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  return {
    init,
    initStickyNavbar,
    initMobileMenu,
    initActiveNavLink,
    initSmoothScroll,
    initBackToTop,
  };

})();
