/* ============================================================
   CAR RENTAL SYSTEM — UI.JS
   Modals, Tabs, Accordions, Skeletons, Empty States, Toasts,
   Dropdowns
   ============================================================ */

'use strict';

const UI = (() => {

  /* ============================================================
     1. MODAL
     ============================================================ */
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const backdrop = document.querySelector('.modal-backdrop');
    if (!modal) return;

    if (backdrop) backdrop.classList.add('open');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Close on backdrop click
    if (backdrop) {
      backdrop.onclick = () => closeModal(modalId);
    }

    // Close on Escape
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal(modalId);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const backdrop = document.querySelector('.modal-backdrop');

    if (modal) modal.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  function initModals() {
    // Open triggers
    document.querySelectorAll('[data-modal-open]').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const modalId = trigger.getAttribute('data-modal-open');
        openModal(modalId);
      });
    });

    // Close triggers
    document.querySelectorAll('[data-modal-close]').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const modal = trigger.closest('.modal');
        if (modal) closeModal(modal.id);
      });
    });
  }

  /* ============================================================
     2. TABS
     ============================================================ */
  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(tabGroup => {
      const tabs = tabGroup.querySelectorAll('.tab');
      const groupId = tabGroup.getAttribute('data-tabs');

      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const targetId = tab.getAttribute('data-tab-target');
          if (!targetId) return;

          // Deactivate all tabs in group
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          // Hide all tab content in group
          document.querySelectorAll(`[data-tab-group="${groupId}"]`).forEach(content => {
            content.classList.remove('active');
          });

          // Show target content
          const targetContent = document.getElementById(targetId);
          if (targetContent) {
            targetContent.classList.add('active');
          }
        });
      });
    });
  }

  /* ============================================================
     3. ACCORDION
     ============================================================ */
  function initAccordions() {
    document.querySelectorAll('.accordion__header').forEach(header => {
      header.addEventListener('click', () => {
        const item = header.closest('.accordion__item');
        if (!item) return;

        const accordion = item.closest('.accordion');
        const body = item.querySelector('.accordion__body');
        const content = item.querySelector('.accordion__content');
        const isOpen = item.classList.contains('open');

        // Close all siblings (single-open mode)
        if (accordion && accordion.hasAttribute('data-single-open')) {
          accordion.querySelectorAll('.accordion__item').forEach(sibling => {
            if (sibling !== item) {
              sibling.classList.remove('open');
              const siblingBody = sibling.querySelector('.accordion__body');
              if (siblingBody) siblingBody.style.maxHeight = '0';
            }
          });
        }

        // Toggle current
        if (isOpen) {
          item.classList.remove('open');
          if (body) body.style.maxHeight = '0';
        } else {
          item.classList.add('open');
          if (body && content) {
            body.style.maxHeight = content.scrollHeight + 'px';
          }
        }
      });
    });
  }

  /* ============================================================
     4. LOADING SKELETON
     ============================================================ */
  function showSkeleton(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.style.display = 'block';
    }
  }

  function hideSkeleton(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.style.display = 'none';
    }
  }

  /* ============================================================
     5. EMPTY STATE
     ============================================================ */
  function showEmptyState(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.style.display = 'block';
    }
  }

  function hideEmptyState(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.style.display = 'none';
    }
  }

  /* ============================================================
     6. TOAST NOTIFICATIONS
     ============================================================ */
  let toastContainer = null;

  function getToastContainer() {
    if (!toastContainer) {
      toastContainer = document.querySelector('.toast-container');
      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
      }
    }
    return toastContainer;
  }

  /**
   * Show a toast notification
   * @param {Object} options
   * @param {string} options.title - Toast title
   * @param {string} options.message - Toast message
   * @param {string} options.type - 'success' | 'error' | 'warning' | 'info'
   * @param {number} options.duration - Duration in ms (default: 4000)
   */
  function showToast({ title = '', message = '', type = 'info', duration = 4000 } = {}) {
    const container = getToastContainer();

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast__icon">${icons[type] || icons.info}</span>
      <div class="toast__content">
        <div class="toast__title">${title}</div>
        <div class="toast__message">${message}</div>
      </div>
      <button class="toast__close" aria-label="Close notification">&times;</button>
    `;

    container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Close button
    const closeBtn = toast.querySelector('.toast__close');
    closeBtn.addEventListener('click', () => removeToast(toast));

    // Auto remove
    if (duration > 0) {
      setTimeout(() => removeToast(toast), duration);
    }

    return toast;
  }

  function removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 500);
  }

  /* ============================================================
     7. DROPDOWN
     ============================================================ */
  function initDropdowns() {
    document.querySelectorAll('[data-dropdown-toggle]').forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = trigger.getAttribute('data-dropdown-toggle');
        const dropdown = document.getElementById(targetId);
        if (!dropdown) return;

        // Close all other dropdowns
        document.querySelectorAll('.dropdown-menu.open').forEach(menu => {
          if (menu.id !== targetId) menu.classList.remove('open');
        });

        dropdown.classList.toggle('open');
      });
    });

    // Close on outside click
    document.addEventListener('click', () => {
      document.querySelectorAll('.dropdown-menu.open').forEach(menu => {
        menu.classList.remove('open');
      });
    });
  }

  /* ============================================================
     8. TOOLTIP (CSS-driven, JS enhances positioning)
     ============================================================ */
  function initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(el => {
      el.setAttribute('role', 'tooltip');
      el.style.position = 'relative';
    });
  }

  /* ============================================================
     INITIALIZATION
     ============================================================ */
  function init() {
    initModals();
    initTabs();
    initAccordions();
    initDropdowns();
    initTooltips();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  return {
    init,
    openModal,
    closeModal,
    initTabs,
    initAccordions,
    showSkeleton,
    hideSkeleton,
    showEmptyState,
    hideEmptyState,
    showToast,
    removeToast,
    initDropdowns,
  };

})();
