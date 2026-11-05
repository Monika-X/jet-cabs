/* ============================================================
   CAR RENTAL SYSTEM — ANIMATION.JS
   Scroll Reveal (IntersectionObserver), Stagger, Counter
   ============================================================ */

'use strict';

const Anim = (() => {

  /* ============================================================
     1. SCROLL REVEAL
     ============================================================ */
  function initScrollReveal() {
    const elements = document.querySelectorAll(
      '.scroll-reveal, .scroll-reveal--left, .scroll-reveal--right, .scroll-reveal--scale'
    );

    if (!elements.length) return;

    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach(el => {
        el.classList.add('revealed');
      });
      return;
    }

    // Fallback if IntersectionObserver is not supported
    if (!window.IntersectionObserver) {
      elements.forEach(el => {
        el.classList.add('revealed');
      });
      return;
    }

    // Check if we are on the FAQ page
    const isFaqPage = window.location.pathname.includes('faq.html') || !!document.getElementById('faq-search-input');
    const thresholdVal = isFaqPage ? 0.05 : 0.15;
    const rootMarginVal = isFaqPage ? '0px 0px 15% 0px' : '0px 0px -40px 0px';

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target); // Only animate once
        }
      });
    }, {
      threshold: thresholdVal,
      rootMargin: rootMarginVal
    });

    elements.forEach(el => {
      observer.observe(el);
      // Fast scroll / initial load check: reveal immediately if already near viewport
      if (isFaqPage) {
        const rect = el.getBoundingClientRect();
        const clientHeight = window.innerHeight || document.documentElement.clientHeight;
        const isInViewport = (
          rect.top < clientHeight * 1.15 &&
          rect.bottom > 0
        );
        if (isInViewport) {
          el.classList.add('revealed');
          observer.unobserve(el);
        }
      }
    });
  }

  /* ============================================================
     2. STAGGER ANIMATION
     ============================================================ */

  /**
   * Apply stagger animation delays to children of a container
   * @param {string} selector - Parent container selector
   * @param {number} baseDelay - Starting delay in ms (default: 0)
   * @param {number} increment - Delay increment per child in ms (default: 100)
   */
  function staggerChildren(selector, baseDelay = 0, increment = 100) {
    const containers = document.querySelectorAll(selector);

    containers.forEach(container => {
      const children = container.children;
      Array.from(children).forEach((child, index) => {
        child.style.transitionDelay = `${baseDelay + (index * increment)}ms`;
        child.style.animationDelay = `${baseDelay + (index * increment)}ms`;
      });
    });
  }

  /**
   * Stagger reveal — observe a container and stagger-reveal its children
   * @param {string} containerSelector
   * @param {number} increment - Delay between each child (ms)
   */
  function initStaggerReveal(containerSelector, increment = 100) {
    const containers = document.querySelectorAll(containerSelector);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      containers.forEach(container => {
        Array.from(container.children).forEach(child => {
          child.classList.add('revealed');
        });
      });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const children = entry.target.children;
          Array.from(children).forEach((child, index) => {
            setTimeout(() => {
              child.classList.add('revealed');
            }, index * increment);
          });
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -20px 0px'
    });

    containers.forEach(container => observer.observe(container));
  }

  /* ============================================================
     3. COUNTER ANIMATION
     ============================================================ */

  /**
   * Animate a number counting up
   * @param {HTMLElement} element - Element to display the count
   * @param {number} target - Target number
   * @param {number} duration - Animation duration in ms (default: 2000)
   * @param {string} suffix - Text to append after number (e.g., '+', '%')
   */
  function animateCounter(element, target, duration = 2000, suffix = '') {
    if (!element) return;

    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quad
      const easeOut = 1 - (1 - progress) * (1 - progress);
      const current = Math.floor(easeOut * (target - start) + start);

      element.textContent = current.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = target.toLocaleString() + suffix;
      }
    }

    requestAnimationFrame(update);
  }

  /**
   * Auto-init counter animations on elements with data-count attribute
   * Usage: <span data-count="1500" data-count-suffix="+">0</span>
   */
  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-count'), 10);
          const suffix = el.getAttribute('data-count-suffix') || '';
          const duration = parseInt(el.getAttribute('data-count-duration') || '2000', 10);

          animateCounter(el, target, duration, suffix);
          observer.unobserve(el);
        }
      });
    }, {
      threshold: 0.5
    });

    counters.forEach(el => observer.observe(el));
  }

  /* ============================================================
     4. PARALLAX (lightweight)
     ============================================================ */
  function initParallax() {
    const elements = document.querySelectorAll('[data-parallax]');
    if (!elements.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    function onScroll() {
      const scrollY = window.scrollY;

      elements.forEach(el => {
        const speed = parseFloat(el.getAttribute('data-parallax')) || 0.3;
        const rect = el.getBoundingClientRect();
        const offsetTop = rect.top + scrollY;
        const offset = (scrollY - offsetTop) * speed;

        el.style.transform = `translateY(${offset}px)`;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ============================================================
     5. ADVANCED LUXURY EFFECTS
     ============================================================ */

  // Immersive cursor backlight trailer
  function initAmbientCursorGlow() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const glow = document.createElement('div');
    glow.className = 'ambient-cursor-glow';
    document.body.appendChild(glow);

    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!glow.classList.contains('active')) {
        glow.classList.add('active');
      }
    });

    document.addEventListener('mouseleave', () => {
      glow.classList.remove('active');
    });

    // Smooth lerp animation for the mouse spotlight trailer
    function tick() {
      const speed = 0.08; // smooth trailing speed
      glowX += (mouseX - glowX) * speed;
      glowY += (mouseY - glowY) * speed;
      
      glow.style.left = `${glowX}px`;
      glow.style.top = `${glowY}px`;
      
      requestAnimationFrame(tick);
    }
    tick();
  }

  // Radial highlight spotlight shine following cursor on cards
  function initSpotlightCards() {
    const cards = document.querySelectorAll(
      '.car-card, .feature-card, .category-card, .dashboard-stat-card, .dashboard-card, .about-team-card, .about-values-card'
    );

    cards.forEach(card => {
      card.classList.add('spotlight-card');
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });
  }

  // Magnetic hover pull effect on primary links and controls
  function initMagneticButtons() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const magneticElements = document.querySelectorAll(
      '.btn, .navbar__logo, .navbar__search-btn, .testimonials-btn, .back-to-top'
    );

    magneticElements.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        // pull offset 20% max
        el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px) scale(1.03)`;
        if (el.classList.contains('btn--primary')) {
          el.style.boxShadow = `0 10px 25px rgba(245, 158, 11, 0.4)`;
        }
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        el.style.boxShadow = '';
      });
    });
  }

  // Immersive 3D Tilt perspective parallax on Hero car image
  function initHero3DTilt() {
    const visual = document.querySelector('.home-hero__visual');
    const carImg = document.querySelector('.home-hero__car-img');
    if (!visual || !carImg) return;

    visual.addEventListener('mousemove', (e) => {
      const rect = visual.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const px = (x / rect.width) * 2 - 1; // -1 to 1
      const py = (y / rect.height) * 2 - 1; // -1 to 1
      
      // tilt scale
      const tiltX = -py * 12; // max 12 deg tilt
      const tiltY = px * 12;
      
      carImg.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.05)`;
    });

    visual.addEventListener('mouseleave', () => {
      carImg.style.transform = 'rotateX(0) rotateY(0) scale(1)';
    });
  }

  /* ============================================================
     INITIALIZATION
     ============================================================ */
  function init() {
    initScrollReveal();
    initCounters();
    initParallax();
    initAmbientCursorGlow();
    initSpotlightCards();
    initMagneticButtons();
    initHero3DTilt();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  return {
    init,
    initScrollReveal,
    staggerChildren,
    initStaggerReveal,
    animateCounter,
    initCounters,
    initParallax,
    initAmbientCursorGlow,
    initSpotlightCards,
    initMagneticButtons,
    initHero3DTilt,
  };

})();
