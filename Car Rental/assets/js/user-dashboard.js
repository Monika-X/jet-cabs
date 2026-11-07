/* ============================================================
   JET CABS — USER DASHBOARD JS
   Phase 3: Completed User Dashboard Modules
   Overview, Rentals, Pre-Bookings, History, Extensions,
   Verification, Payments, Profile, Notifications, Support, Settings
   ============================================================ */

'use strict';

const UserDashboard = (() => {

  /* ============================================================
     1. STATE MANAGEMENT (CENTRALIZED DUMMY DATA)
     ============================================================ */
  const DashboardState = {
    userData: {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      avatar: null,
      initials: '',
      membership: '',
      memberSince: '',
      verified: false,
      kycStatus: 'NOT_SUBMITTED',
      dob: '',
      gender: '',
      // License info (hydrated from the latest real booking)
      licenseNumber: '',
      licenseExpiry: '',
      licenseAuthority: '',
      licenseCountry: '',
      licenseStatus: 'missing',
      // Address info (hydrated from the latest real booking)
      country: '',
      state: '',
      city: '',
      postalCode: '',
      streetAddress: '',
      // Emergency contact (not stored by the backend yet)
      emergencyName: '',
      emergencyRelationship: '',
      emergencyPhone: '',
      // Preferences (stored on this device)
      language: 'en',
      emailAlerts: true,
      pushNotifications: false,
    },

    rentalsData: [],
    preBookingsData: [],
    notificationData: [],
    extensionsData: [],
    extensionHistory: [],
    verificationData: null,
    kycData: null,
    paymentsData: {
      methods: [],
      transactions: []
    },
    supportTicketsData: [],
    statsData: {
      activeRentals: 0,
      pendingPreBookings: 0,
      upcomingReturns: 0,
      completedRentals: 0,
      extensionRequests: 0,
      unreadNotifications: 0,
      totalRentals: 0,
    },
    dataError: '',

    // UI State
    uiState: {
      currentModule: 'overview',
      rentalsSearch: '',
      rentalsStatusFilter: 'all',
      rentalsTypeFilter: 'all',
      rentalsSort: 'newest',
      preBookingsSearch: '',
      preBookingsStatusFilter: 'all',
      preBookingsVehicleFilter: 'all',
      preBookingsDateFilter: 'all',
      
      // Phase 3 states
      historySearch: '',
      historyStatusFilter: 'all',
      historySort: 'newest',
      notifSearch: '',
      notifCategory: 'all',
      notifStatusFilter: 'all',
      profileActiveTab: 'personal',
      supportSearch: '',
    }
  };


  /* ============================================================
     2. UTILITY FUNCTIONS
     ============================================================ */
  const Utils = {
    formatCurrency(amount) {
      const value = Number(amount);
      return '$' + (Number.isFinite(value) ? value : 0).toLocaleString('en-US');
    },
    _toDate(dateStr) {
      if (!dateStr) return null;
      const d = String(dateStr).includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00');
      return Number.isNaN(d.getTime()) ? null : d;
    },
    formatDate(dateStr) {
      const d = this._toDate(dateStr);
      if (!d) return '—';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },
    formatDateShort(dateStr) {
      const d = this._toDate(dateStr);
      if (!d) return '—';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },
    debounce(fn, delay = 300) {
      let timer;
      return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn.apply(null, args), delay); };
    },
    escapeHtml(str) {
      const div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    },
    getRemainingDays(returnDate) {
      const now = new Date();
      const ret = new Date(returnDate + 'T00:00:00');
      const diff = Math.ceil((ret - now) / (1000 * 60 * 60 * 24));
      if (diff < 0) return 'Overdue';
      if (diff === 0) return 'Due today';
      if (diff === 1) return '1 day left';
      return `${diff} days left`;
    },
    getTimeGreeting() {
      const h = new Date().getHours();
      if (h < 12) return 'Good morning';
      if (h < 17) return 'Good afternoon';
      return 'Good evening';
    },
    statusLabel(s) {
      return s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ');
    },
    icon(name, cls = '') {
      // Render directly from the inline SVG sprite in the page. This removes
      // the Lucide CDN/timing dependency: dynamically rendered content used
      // to leave empty <i data-lucide> placeholders when createIcons() ran
      // before the dashboard data finished loading.
      const aliases = {
        'icon-sparkles': 'icon-star',
        'icon-warning': 'icon-alert-triangle',
        'icon-tool': 'icon-wrench',
        'icon-refresh-cw': 'icon-rotate-ccw'
      };
      const symbol = document.getElementById(name) || document.getElementById(aliases[name] || '');
      if (symbol) {
        const viewBox = symbol.getAttribute('viewBox') || '0 0 24 24';
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" class="${cls}" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${symbol.innerHTML}</svg>`;
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="${cls}" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/></svg>`;
    }
  };


  /* ============================================================
     3. STORAGE HELPER
     ============================================================ */
  const StorageHelper = {
    prefix: 'jetcabs_user_',
    get(key) { try { const r = localStorage.getItem(this.prefix + key); return r ? JSON.parse(r) : null; } catch { return null; } },
    set(key, value) { try { localStorage.setItem(this.prefix + key, JSON.stringify(value)); } catch {} },
    remove(key) { try { localStorage.removeItem(this.prefix + key); } catch {} }
  };

  function restoreUiState() {
    StorageHelper.remove('ui_state');
    StorageHelper.remove('sidebar_collapsed');
  }
  function saveUiState() {
    // UI state persistence disabled - reset to default on fresh loads
  }


  /* ============================================================
     4. SIDEBAR CONTROLLER
     ============================================================ */
  const SidebarController = {
    sidebar: null, overlay: null, collapseBtn: null, menuBtn: null,
    isCollapsed: false, isMobileOpen: false,

    init() {
      this.sidebar = document.getElementById('db-sidebar');
      this.overlay = document.getElementById('db-sidebar-overlay');
      this.collapseBtn = document.getElementById('db-sidebar-collapse');
      this.menuBtn = document.getElementById('db-header-menu');
      if (!this.sidebar) return;

      // Sidebar collapse state persistence disabled - starts expanded on load

      if (this.collapseBtn) this.collapseBtn.addEventListener('click', () => this.toggle());
      if (this.menuBtn) this.menuBtn.addEventListener('click', () => this.toggleMobile());
      if (this.overlay) this.overlay.addEventListener('click', () => this.closeMobile());

      // All sidebar modules are functional
      this.sidebar.querySelectorAll('.db-sidebar__link').forEach(link => {
        link.addEventListener('click', (e) => {
          this.handleNavClick(e, link);
        });
      });

      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.isMobileOpen) this.closeMobile(); });
      window.addEventListener('resize', Utils.debounce(() => {
        if (window.innerWidth > 992 && this.isMobileOpen) this.closeMobile();
        HeaderController.syncHeader();
      }, 100));
    },

    toggle() {
      if (window.innerWidth <= 992) { this.closeMobile(); return; }
      this.isCollapsed = !this.isCollapsed;
      this.sidebar.classList.toggle('collapsed', this.isCollapsed);
    },
    toggleMobile() { this.isMobileOpen ? this.closeMobile() : this.openMobile(); },
    openMobile() { this.isMobileOpen = true; this.sidebar.classList.add('mobile-open'); if (this.overlay) this.overlay.classList.add('open'); document.body.style.overflow = 'hidden'; HeaderController.syncHeader(); },
    closeMobile() { this.isMobileOpen = false; this.sidebar.classList.remove('mobile-open'); if (this.overlay) this.overlay.classList.remove('open'); document.body.style.overflow = ''; HeaderController.syncHeader(); },

    handleNavClick(e, link) {
      this.sidebar.querySelectorAll('.db-sidebar__link').forEach(l => { l.classList.remove('active'); l.removeAttribute('aria-current'); });
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
      const mod = link.getAttribute('data-module');
      if (mod) DashboardRenderer.navigate(mod);
      if (window.innerWidth <= 992) this.closeMobile();
    },

    setActive(moduleName) {
      this.sidebar.querySelectorAll('.db-sidebar__link').forEach(link => {
        const isActive = link.getAttribute('data-module') === moduleName;
        link.classList.toggle('active', isActive);
        if (isActive) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
      });
    }
  };


  /* ============================================================
     5. HEADER CONTROLLER
     ============================================================ */
  const HeaderController = {
    titleEl: null, greetingEl: null,
    init() {
      this.titleEl = document.getElementById('db-header-title');
      this.greetingEl = document.getElementById('db-header-greeting');
      if (this.greetingEl) this.greetingEl.textContent = `${Utils.getTimeGreeting()}, ${DashboardState.userData.firstName}`;
      this.initSearch();

      // Viewport change resize listener to force complete header repaints
      window.addEventListener('resize', Utils.debounce(() => {
        this.syncHeader();
      }, 100));
    },
    updateTitle(title) { if (this.titleEl) this.titleEl.textContent = title; },
    syncHeader() {
      const header = document.querySelector('.db-header');
      if (!header) return;

      // Force chrome/browser repaint & layout reflow to cure intermittent blank header display bugs
      const originalDisplay = header.style.display;
      header.style.display = 'none';
      header.offsetHeight; // Force reflow
      header.style.display = originalDisplay || '';

      // Reset style bindings to default responsive states
      header.style.position = '';
      header.style.top = '';
      header.style.visibility = 'visible';
      header.style.opacity = '1';
      header.style.transform = 'none';

      if (this.greetingEl) {
        this.greetingEl.textContent = `${Utils.getTimeGreeting()}, ${DashboardState.userData.firstName}`;
      }
    },
    initSearch() {
      const searchInput = document.getElementById('db-header-search');
      const searchResults = document.getElementById('db-header-search-results');
      if (!searchInput || !searchResults) return;

      const navigationItems = [
        { icon: 'icon-grid', text: 'Dashboard', type: 'page', module: 'overview' },
        { icon: 'icon-car', text: 'My Rentals', type: 'page', module: 'rentals' },
        { icon: 'icon-clipboard', text: 'Pre-Bookings', type: 'page', module: 'prebookings' },
        { icon: 'icon-file-text', text: 'Rental History', type: 'page', module: 'history' },
        { icon: 'icon-rotate-ccw', text: 'Rental Extensions', type: 'page', module: 'extensions' },
        { icon: 'icon-user', text: 'Profile Info', type: 'page', module: 'profile' },
        { icon: 'icon-bell', text: 'Notifications Center', type: 'page', module: 'notifications' },
        { icon: 'icon-send', text: 'Support & Help', type: 'page', module: 'support' },
      ];

      searchInput.addEventListener('input', Utils.debounce(() => {
        const q = searchInput.value.toLowerCase().trim();
        if (!q) { searchResults.classList.remove('open'); return; }

        let results = [];

        // 1. Search navigation
        navigationItems.forEach(item => {
          if (item.text.toLowerCase().includes(q)) {
            results.push({ ...item, subtitle: 'Navigation Module' });
          }
        });

        // 2. Search Rentals
        DashboardState.rentalsData.forEach(r => {
          if (`${r.brand} ${r.model}`.toLowerCase().includes(q) || r.bookingId.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)) {
            results.push({
              icon: 'icon-car',
              text: `${r.brand} ${r.model}`,
              subtitle: `Rental ${r.bookingId} (${r.status})`,
              type: 'rental',
              module: r.status === 'active' || r.status === 'upcoming' ? 'rentals' : 'history',
              itemId: r.id
            });
          }
        });

        // 3. Search Pre-bookings
        DashboardState.preBookingsData.forEach(p => {
          if (p.vehicleName.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)) {
            results.push({
              icon: 'icon-clipboard',
              text: p.vehicleName,
              subtitle: `Pre-Booking ${p.reference} (${p.status})`,
              type: 'prebooking',
              module: 'prebookings',
              itemId: p.id
            });
          }
        });

        // 4. Search Support Tickets
        DashboardState.supportTicketsData.forEach(t => {
          if (t.subject.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)) {
            results.push({
              icon: 'icon-message-square',
              text: t.subject,
              subtitle: `Support Ticket ${t.id} (${t.status})`,
              type: 'support',
              module: 'support',
              itemId: t.id
            });
          }
        });

        if (results.length === 0) {
          searchResults.innerHTML = '<div class="db-header__search-empty">No results found</div>';
        } else {
          searchResults.innerHTML = results.map(r => `
            <div class="db-header__search-result" data-module="${r.module}" data-type="${r.type}" data-id="${r.itemId || ''}" role="option" style="padding: 10px 14px; border-bottom: 1px solid var(--color-border-light); cursor: pointer; display: flex; align-items: center; gap: 10px;">
              <span class="icon" style="color: var(--color-primary); display: flex; align-items: center;">${Utils.icon(r.icon)}</span>
              <div>
                <div style="font-weight: 500; font-size: var(--fs-xs); color: var(--color-dark-text);">${Utils.escapeHtml(r.text)}</div>
                <div style="font-size: 10px; color: var(--color-light-text);">${Utils.escapeHtml(r.subtitle)}</div>
              </div>
            </div>
          `).join('');

          searchResults.querySelectorAll('.db-header__search-result').forEach(r => {
            r.addEventListener('click', () => {
              const mod = r.getAttribute('data-module');
              const type = r.getAttribute('data-type');
              const itemId = r.getAttribute('data-id');

              searchResults.classList.remove('open');
              searchInput.value = '';

              DashboardRenderer.navigate(mod);

              if (type === 'rental' && itemId) {
                setTimeout(() => showRentalDetails(itemId), 100);
              } else if (type === 'prebooking' && itemId) {
                DashboardState.uiState.preBookingsSearch = itemId;
                const pbSearch = document.getElementById('pb-search');
                if (pbSearch) pbSearch.value = itemId;
                _renderPBList();
              }
            });
          });
        }
        searchResults.classList.add('open');
      }, 200));

      document.addEventListener('click', (e) => { if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) searchResults.classList.remove('open'); });
      searchInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') { searchResults.classList.remove('open'); searchInput.blur(); } });
    }
  };


  /* ============================================================
     6. DROPDOWN CONTROLLER
     ============================================================ */
  const DropdownController = {
    init() {
      this.initProfileDropdown();
      this.initNotificationPanel();
      document.addEventListener('click', (e) => this.closeAllExcept(e.target));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.closeAll(); });
    },
    initProfileDropdown() {
      const btn = document.getElementById('db-profile-btn');
      const dd = document.getElementById('db-profile-dropdown');
      if (!btn || !dd) return;
      btn.addEventListener('click', (e) => { e.stopPropagation(); const open = dd.classList.contains('open'); this.closeAll(); if (!open) { dd.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); } });
      dd.addEventListener('keydown', (e) => { const links = dd.querySelectorAll('.db-header__dropdown-link'); const idx = Array.from(links).indexOf(document.activeElement); if (e.key === 'ArrowDown') { e.preventDefault(); links[(idx + 1) % links.length].focus(); } else if (e.key === 'ArrowUp') { e.preventDefault(); links[(idx - 1 + links.length) % links.length].focus(); } });
      const logoutBtn = dd.querySelector('[data-action="logout"]');
      if (logoutBtn) logoutBtn.addEventListener('click', (e) => { 
        e.preventDefault(); 
        this.closeAll(); 
        
        fetch('http://localhost:5000/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        .finally(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          ToastController.show({ title: 'Logged Out', message: 'You have been successfully logged out.', type: 'success' }); 
          setTimeout(() => { window.location.href = 'login.html'; }, 1500); 
        });
      });
    },
    initNotificationPanel() {
      const btn = document.getElementById('db-notification-btn');
      const panel = document.getElementById('db-notification-panel');
      if (!btn || !panel) return;
      this.renderNotifications(panel);
      btn.addEventListener('click', (e) => { e.stopPropagation(); const open = panel.classList.contains('open'); this.closeAll(); if (!open) panel.classList.add('open'); });
      panel.addEventListener('click', (e) => e.stopPropagation());
      const markAllBtn = panel.querySelector('[data-action="mark-all-read"]');
      if (markAllBtn) markAllBtn.addEventListener('click', () => { markAllNotificationsRead(); });
    },
    renderNotifications(panel) {
      const body = panel.querySelector('.db-notification-panel__body');
      if (!body) return;
      const icons = { success: 'icon-check-circle', info: 'icon-info', warning: 'icon-alert-triangle', danger: 'icon-x-circle' };
      const unreadItems = DashboardState.notificationData.slice(0, 5);
      body.innerHTML = unreadItems.map(n => `
        <div class="db-notification-panel__item ${n.read ? '' : 'unread'}" onclick="UserDashboard.markNotificationRead('${n.id}')">
          <div class="db-notification-panel__item-icon db-notification-panel__item-icon--${n.type}">${Utils.icon(icons[n.type] || 'icon-info', 'icon--sm')}</div>
          <div class="db-notification-panel__item-content">
            <div class="db-notification-panel__item-title">${Utils.escapeHtml(n.title)}</div>
            <div class="db-notification-panel__item-text">${Utils.escapeHtml(n.text)}</div>
          </div>
          <span class="db-notification-panel__item-time">${n.time}</span>
        </div>`).join('');
      if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch(e) {}
      }
    },
    updateNotificationBadge() {
      const badge = document.getElementById('db-notification-badge');
      if (!badge) return;
      const count = DashboardState.notificationData.filter(n => !n.read).length;
      badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none';
      DashboardState.statsData.unreadNotifications = count;
    },
    closeAll() { document.querySelectorAll('.db-header__dropdown.open, .db-notification-panel.open').forEach(el => el.classList.remove('open')); const b = document.getElementById('db-profile-btn'); if (b) b.setAttribute('aria-expanded', 'false'); },
    closeAllExcept(target) {
      const pw = document.getElementById('db-profile-wrapper'); const nb = document.getElementById('db-notification-btn'); const np = document.getElementById('db-notification-panel');
      if (pw && !pw.contains(target)) { const d = document.getElementById('db-profile-dropdown'); if (d) d.classList.remove('open'); const b = document.getElementById('db-profile-btn'); if (b) b.setAttribute('aria-expanded','false'); }
      if (nb && np && !nb.contains(target) && !np.contains(target)) np.classList.remove('open');
    }
  };


  /* ============================================================
     7. MODAL CONTROLLER
     ============================================================ */
  const ModalController = {
    activeModal: null, backdrop: null,
    init() {
      this.backdrop = document.getElementById('db-modal-backdrop');
      if (this.backdrop) this.backdrop.addEventListener('click', () => this.close());
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.activeModal) this.close(); });
    },
    open(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;
      this.activeModal = modal; modal.classList.add('open');
      if (this.backdrop) this.backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
      const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length) focusable[0].focus();
    },
    close() {
      if (this.activeModal) this.activeModal.classList.remove('open');
      this.activeModal = null;
      if (this.backdrop) this.backdrop.classList.remove('open');
      document.body.style.overflow = '';
    },
    confirm(opts) {
      const m = document.getElementById('db-confirm-modal'); if (!m) return;
      const iconEl = m.querySelector('.db-modal__icon');
      const titleEl = m.querySelector('.db-modal__title');
      const msgEl = m.querySelector('.db-modal__message');
      const confirmBtn = m.querySelector('[data-action="confirm"]');
      const cancelBtn = m.querySelector('[data-action="cancel"]');
      const icons = { success:'icon-check-circle', danger:'icon-trash', warning:'icon-alert-triangle', info:'icon-info' };
      if (iconEl) { iconEl.className = `db-modal__icon db-modal__icon--${opts.type||'warning'}`; iconEl.innerHTML = Utils.icon(icons[opts.type]||icons.warning); }
      if (titleEl) titleEl.textContent = opts.title||'Confirm';
      if (msgEl) msgEl.innerHTML = opts.message||'';
      if (confirmBtn) { confirmBtn.textContent = opts.confirmText||'Confirm'; confirmBtn.className = `btn btn--sm ${opts.type==='danger'?'btn--danger':'btn--primary'}`; confirmBtn.onclick = () => { this.close(); if (opts.onConfirm) opts.onConfirm(); }; }
      if (cancelBtn) { cancelBtn.textContent = opts.cancelText||'Cancel'; cancelBtn.onclick = () => this.close(); }
      this.open('db-confirm-modal');
    },
    openDynamic(content, maxWidth) {
      let modal = document.getElementById('db-dynamic-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'db-dynamic-modal';
        modal.className = 'db-modal db-modal--lg';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        document.body.appendChild(modal);
      }
      modal.innerHTML = content;
      if (maxWidth) modal.style.maxWidth = maxWidth;
      else modal.style.maxWidth = '';
      this.open('db-dynamic-modal');
      modal.querySelectorAll('[data-action="close-modal"]').forEach(btn => btn.addEventListener('click', () => this.close()));
      // Initialize Lucide icons in modal
      if (typeof lucide !== 'undefined') { try { lucide.createIcons(); } catch(e) {} }
    }
  };


  /* ============================================================
     8. TOAST CONTROLLER
     ============================================================ */
  let activeToastTimeout = null;
  const ToastController = {
    show({ title = '', message = '', type = 'info', duration = 4000 } = {}) {
      if (typeof UI !== 'undefined' && UI.showToast) { UI.showToast({ title, message, type, duration }); return; }
      let container = document.querySelector('.toast-container');
      if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); }
      
      // Remove any existing active toast
      const existing = container.querySelectorAll('.toast');
      existing.forEach(t => {
        t.classList.remove('show');
        if (t.parentNode) t.parentNode.removeChild(t);
      });
      if (activeToastTimeout) {
        clearTimeout(activeToastTimeout);
        activeToastTimeout = null;
      }

      const icons = { success:'✓', error:'✕', warning:'⚠', info:'ℹ' };
      const toast = document.createElement('div'); toast.className = `toast toast--${type}`;
      toast.innerHTML = `<span class="toast__icon">${icons[type]||icons.info}</span><div class="toast__content"><div class="toast__title">${Utils.escapeHtml(title)}</div><div class="toast__message">${Utils.escapeHtml(message)}</div></div><button class="toast__close" aria-label="Close">&times;</button>`;
      container.appendChild(toast);
      
      requestAnimationFrame(() => toast.classList.add('show'));
      const rm = () => { toast.classList.remove('show'); setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300); };
      toast.querySelector('.toast__close').addEventListener('click', rm);
      if (duration > 0) activeToastTimeout = setTimeout(rm, duration);
    }
  };


  /* ============================================================
     9. TAB CONTROLLER
     ============================================================ */
  const TabController = {
    init() {
      document.querySelectorAll('[data-db-tabs]').forEach(tg => {
        const tabs = tg.querySelectorAll('.db-tab'); const gid = tg.getAttribute('data-db-tabs');
        tabs.forEach(tab => { tab.addEventListener('click', () => {
          const tid = tab.getAttribute('data-tab-target'); if (!tid) return;
          tabs.forEach(t => t.classList.remove('active')); tab.classList.add('active');
          document.querySelectorAll(`[data-tab-group="${gid}"]`).forEach(c => c.classList.remove('active'));
          const target = document.getElementById(tid); if (target) target.classList.add('active');
        }); });
      });
    }
  };


  /* ============================================================
     10. DASHBOARD RENDERER — Module Navigation
     ============================================================ */
  const DashboardRenderer = {
    contentArea: null,
    modules: {
      overview: 'Dashboard',
      rentals: 'My Rentals',
      prebookings: 'Pre-Bookings',
      history: 'Rental History',
      extensions: 'Extensions',
      verification: 'Verification',
      payments: 'Payments',
      profile: 'Profile',
      notifications: 'Notifications',
      settings: 'Settings',
      support: 'Support',
    },

    init() { this.contentArea = document.getElementById('dashboard-content'); },

    navigate(moduleName) {
      if (!this.contentArea) return;
      DashboardState.uiState.currentModule = moduleName;
      saveUiState();
      SidebarController.setActive(moduleName);
      
      let title = this.modules[moduleName] || moduleName;
      HeaderController.updateTitle(title);
      this.contentArea.scrollTop = 0;
      const main = document.getElementById('main-content');
      if (main) main.scrollTop = 0;

      switch (moduleName) {
        case 'overview': RenderOverview(); break;
        case 'rentals': RenderRentals(); break;
        case 'prebookings': RenderPreBookings(); break;
        case 'history': RenderHistory(); break;
        case 'extensions': RenderExtensions(); break;
        case 'verification': RenderVerification(); break;
        case 'payments': RenderPayments(); break;
        case 'profile': RenderProfile('personal'); break;
        case 'notifications': RenderNotifications(); break;
        case 'settings': RenderProfile('settings'); break;
        case 'support': RenderSupport(); break;
        default: RenderOverview(); break;
      }

      // Initialize Lucide icons after render
      if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch(e) { /* Lucide not loaded yet */ }
      }
    }
  };


  /* ============================================================
     11. RENDER: DASHBOARD OVERVIEW
     ============================================================ */
  function RenderOverview() {
    const s = DashboardState.statsData;
    const u = DashboardState.userData;
    const activeRental = DashboardState.rentalsData.find(r => r.status === 'active');
    const upcomingRental = DashboardState.rentalsData.find(r => r.status === 'upcoming');
    const displayRental = activeRental || upcomingRental;

    DashboardRenderer.contentArea.innerHTML = `
      ${_renderErrorBanner()}
      <!-- HERO SECTION -->
      <div class="db-hero db-animate-in">
        <div class="db-hero__content">
          <div class="db-hero__greeting">
            <span class="db-hero__greeting-icon" style="display: inline-flex; align-items: center; color: var(--color-secondary); margin-right: var(--space-2);">${Utils.icon('icon-sparkles', 'icon--xs')}</span>
            <span class="db-hero__welcome">Welcome back,</span>
          </div>
          <h2 class="db-hero__name">${u.firstName} ${u.lastName}</h2>
          <p class="db-hero__text">Manage your elite vehicles, active reservations, and membership status.</p>
          <div class="db-hero__actions">
            <a href="cars.html" class="btn btn--primary btn--sm">${Utils.icon('icon-car','icon--sm')} Browse Cars</a>
            <button class="btn btn--outline btn--sm" onclick="UserDashboard.navigateTo('prebookings')">${Utils.icon('icon-clipboard','icon--sm')} New Pre-Booking</button>
            <button class="btn btn--ghost btn--sm" onclick="UserDashboard.navigateTo('rentals')">${Utils.icon('icon-file-text','icon--sm')} View Rentals</button>
          </div>
        </div>
        <div class="db-hero__badge">
          <div class="db-hero__badge-icon">${Utils.icon('icon-star')}</div>
          <div class="db-hero__badge-label">${u.membership ? Utils.escapeHtml(u.membership) + ' Member' : 'Customer Account'}</div>
        </div>
      </div>

      <!-- STATISTICS -->
      <div class="db-stats-grid db-animate-stagger">
        ${_statCard('icon-car', 'primary', 'Active Rentals', s.activeRentals, 'Currently on the road', 'rentals')}
        ${_statCard('icon-clipboard', 'gold', 'Pending Pre-Bookings', s.pendingPreBookings, 'Awaiting review', 'prebookings')}
        ${_statCard('icon-clock', 'warning', 'Upcoming Returns', s.upcomingReturns, activeRental ? Utils.getRemainingDays(activeRental.returnDate) : 'No active return', 'rentals')}
        ${_statCard('icon-check-circle', 'success', 'Completed Rentals', s.completedRentals, 'Lifetime', 'history')}
        ${_statCard('icon-bell', 'danger', 'Notifications', s.unreadNotifications, 'Unread messages', 'notifications')}
      </div>

      <!-- MAIN GRID -->
      <div class="db-section-grid">
        <!-- CURRENT RENTAL -->
        <div class="db-section-card db-animate-in">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">${activeRental ? 'Current Rental' : (upcomingRental ? 'Upcoming Rental' : 'Current Rental')}</h3>
              <p class="db-section-card__subtitle">${activeRental ? 'Your active vehicle' : (upcomingRental ? 'Your next confirmed pickup' : 'Your active vehicle')}</p>
            </div>
          </div>
          <div class="db-section-card__body">
            ${displayRental ? _renderCurrentRental(displayRental) : _renderEmptyState('icon-car', 'No Active Rental', 'You don\'t have any active rentals right now. Browse our fleet to book your next luxury ride.', 'Browse Cars', 'cars.html')}
          </div>
        </div>

        <!-- RECENT ACTIVITY -->
        <div class="db-section-card db-animate-in">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Recent Activity</h3>
              <p class="db-section-card__subtitle">Timeline of your actions</p>
            </div>
          </div>
          <div class="db-section-card__body">
            <div class="db-timeline">
              ${(() => {
                const activities = [];
                DashboardState.rentalsData.forEach(r => {
                  let title, text, dot, timeLabel;
                  if (r.status === 'completed') {
                    title = 'Rental Completed';
                    text = `${r.brand} ${r.model} returned.`;
                    dot = 'db-timeline__dot--success';
                    timeLabel = `${Utils.formatDateShort(r.returnDate)}, ${r.returnTime}`;
                  } else if (r.status === 'upcoming') {
                    title = 'Booking Created';
                    text = `Scheduled for ${r.brand} ${r.model} at ${r.pickupLocation}.`;
                    dot = 'db-timeline__dot--info';
                    timeLabel = r.createdAt ? Utils.formatDateShort(r.createdAt) : `${Utils.formatDateShort(r.pickupDate)}, ${r.pickupTime}`;
                  } else if (r.status === 'active') {
                    title = 'Rental Active';
                    text = `Currently renting ${r.brand} ${r.model}.`;
                    dot = 'db-timeline__dot--success';
                    timeLabel = `${Utils.formatDateShort(r.pickupDate)}, ${r.pickupTime}`;
                  } else if (r.status === 'cancelled') {
                    title = 'Booking Cancelled';
                    text = `${r.brand} ${r.model} rental was cancelled.`;
                    dot = 'db-timeline__dot--danger';
                    timeLabel = `${Utils.formatDateShort(r.pickupDate)}, ${r.pickupTime}`;
                  }
                  if(title) activities.push({ title, text, dot, timeLabel, dateObj: new Date(r.createdAt || r.pickupDate) });
                });
                
                DashboardState.preBookingsData.forEach(p => {
                  let title = 'Pre-Booking ' + Utils.statusLabel(p.status);
                  let text = `Requested ${p.vehicleName} for ${p.requestedDates}.`;
                  let dot = p.status === 'approved' ? 'db-timeline__dot--success' : (p.status === 'rejected' ? 'db-timeline__dot--danger' : 'db-timeline__dot--warning');
                  let timeLabel = p.requestedOn ? Utils.formatDateShort(p.requestedOn) : `${Utils.formatDateShort(p.pickupDate)}`;
                  activities.push({ title, text, dot, timeLabel, dateObj: new Date(p.requestedOn || p.pickupDate) });
                });

                if (activities.length === 0) {
                  return '<div class="db-timeline__item"><div class="db-timeline__text">No recent activity found.</div></div>';
                }

                return activities.sort((a,b) => b.dateObj - a.dateObj).slice(0, 5).map(act => 
                  `<div class="db-timeline__item">
                    <div class="db-timeline__dot ${act.dot || ''}"></div>
                    <div class="db-timeline__time">${act.timeLabel}</div>
                    <div class="db-timeline__title">${act.title}</div>
                    <div class="db-timeline__text">${act.text}</div>
                  </div>`
                ).join('');
              })()}
            </div>
          </div>
        </div>
      </div>

      <!-- NOTIFICATIONS PREVIEW -->
      <div class="db-section-card db-animate-in" style="margin-top: var(--space-6);">
        <div class="db-section-card__header">
          <div>
            <h3 class="db-section-card__title">Latest Notifications</h3>
            <p class="db-section-card__subtitle">Stay updated on your rentals</p>
          </div>
          <button class="btn btn--ghost btn--sm" onclick="UserDashboard.navigateTo('notifications')">View All</button>
        </div>
        <div class="db-section-card__body db-section-card__body--flush">
          ${DashboardState.notificationData.length === 0
            ? `<div style="padding: var(--space-6); text-align:center; color: var(--color-light-text); font-size: var(--fs-small);">No notifications yet. Booking updates will appear here.</div>`
            : DashboardState.notificationData.slice(0, 4).map(n => {
              const icons = { success:'icon-check-circle', info:'icon-info', warning:'icon-alert-triangle', danger:'icon-x-circle' };
              return `<div class="db-notification-preview ${n.read ? '' : 'db-notification-preview--unread'}" onclick="UserDashboard.markNotificationRead('${n.id}')">
                <div class="db-notification-preview__icon db-notification-preview__icon--${n.type}">${Utils.icon(icons[n.type]||'icon-info','icon--sm')}</div>
                <div class="db-notification-preview__content"><div class="db-notification-preview__title">${Utils.escapeHtml(n.title)}</div><div class="db-notification-preview__text">${Utils.escapeHtml(n.text)}</div></div>
                <span class="db-notification-preview__time">${n.time}</span>
              </div>`;
            }).join('')}
        </div>
      </div>
    `;
  }

  function _statCard(icon, color, label, value, trend, targetModule = '') {
    const clickAttr = targetModule ? `style="cursor: pointer;" onclick="UserDashboard.navigateTo('${targetModule}')"` : '';
    return `<div class="db-stat-card" ${clickAttr}>
      <div class="db-stat-card__icon db-stat-card__icon--${color}">${Utils.icon(icon)}</div>
      <div class="db-stat-card__content">
        <div class="db-stat-card__label">${label}</div>
        <div class="db-stat-card__value">${value}</div>
        <span class="db-stat-card__change db-stat-card__change--up">${trend}</span>
      </div>
    </div>`;
  }

  function _renderCurrentRental(r) {
    const remaining = Utils.getRemainingDays(r.returnDate);
    return `<div class="db-current-rental">
      <div class="db-current-rental__image-wrap">
        <img src="${r.image}" alt="${r.brand} ${r.model}" class="db-current-rental__image" loading="lazy">
        <span class="db-badge db-badge--active">${Utils.statusLabel(r.status)}</span>
      </div>
      <div class="db-current-rental__info">
        <h4 class="db-current-rental__name">${r.brand} ${r.model}</h4>
        <div class="db-current-rental__meta">
          <span class="db-current-rental__meta-item">${Utils.icon('icon-tag','icon--xs')} ${r.rentalType} Rental</span>
          <span class="db-current-rental__meta-item">${Utils.icon('icon-clock','icon--xs')} ${remaining}</span>
        </div>
        <div class="db-current-rental__dates">
          <div class="db-current-rental__date">
            <span class="db-current-rental__date-label">Pickup</span>
            <span class="db-current-rental__date-value">${Utils.formatDate(r.pickupDate)} · ${r.pickupTime}</span>
          </div>
          <div class="db-current-rental__date-arrow">${Utils.icon('icon-arrow-right','icon--sm')}</div>
          <div class="db-current-rental__date">
            <span class="db-current-rental__date-label">Return</span>
            <span class="db-current-rental__date-value">${Utils.formatDate(r.returnDate)} · ${r.returnTime}</span>
          </div>
        </div>
        <div class="db-current-rental__timeline">
          ${(r.timeline || []).map(t => `<div class="db-current-rental__tl-step ${t.type === 'pending' ? 'db-current-rental__tl-step--pending' : 'db-current-rental__tl-step--done'}">
            <div class="db-current-rental__tl-dot"></div>
            <span class="db-current-rental__tl-text">${Utils.escapeHtml(t.event)}</span>
          </div>`).join('')}
        </div>
        <div class="db-current-rental__actions">
          <button class="btn btn--primary btn--sm" onclick="UserDashboard.showRentalDetails('${r.id}')">${Utils.icon('icon-eye','icon--sm')} View Details</button>
          <button class="btn btn--outline btn--sm" onclick="UserDashboard.openExtensionModal('${r.id}')">${Utils.icon('icon-rotate-ccw','icon--sm')} Extend</button>
          <button class="btn btn--outline btn--sm" onclick="UserDashboard.openReturnModal('${r.id}')">${Utils.icon('icon-camera','icon--sm')} Return Car</button>
        </div>
      </div>
    </div>`;
  }

  function _renderEmptyState(icon, title, text, btnText, btnHref) {
    return `<div class="db-empty-state">
      <div class="db-empty-state__icon">${Utils.icon(icon)}</div>
      <h3 class="db-empty-state__title">${title}</h3>
      <p class="db-empty-state__text">${text}</p>
      ${btnText ? `<a href="${btnHref || '#'}" class="btn btn--primary btn--sm">${btnText}</a>` : ''}
    </div>`;
  }

  function _renderErrorBanner() {
    if (!DashboardState.dataError) return '';
    return `<div class="db-section-card db-animate-in" style="margin-bottom: var(--space-5); border-color: rgba(220,38,38,0.3);">
      <div class="db-section-card__body" style="display:flex; align-items:flex-start; gap:var(--space-3); padding:var(--space-4);">
        <span style="color:var(--color-danger); flex-shrink:0;">${Utils.icon('icon-alert-triangle')}</span>
        <div>
          <div style="font-weight:var(--fw-semibold); color:var(--color-dark-text);">Some dashboard data could not be loaded</div>
          <div style="font-size:var(--fs-small); color:var(--color-light-text);">${Utils.escapeHtml(DashboardState.dataError)}</div>
        </div>
        <button class="btn btn--outline btn--sm" style="margin-left:auto;" onclick="window.location.reload()">Retry</button>
      </div>
    </div>`;
  }


  /* ============================================================
     12. RENDER: MY RENTALS
     ============================================================ */
  function RenderRentals() {
    const state = DashboardState.uiState;
    DashboardRenderer.contentArea.innerHTML = `
      <div class="db-page-header db-animate-in">
        <div class="db-page-header__left">
          <h2 class="db-page-header__title">My Rentals</h2>
          <p class="db-page-header__subtitle">Manage and track your active and upcoming vehicle rentals</p>
        </div>
        <div class="db-page-header__actions">
          <a href="cars.html" class="btn btn--primary btn--sm">${Utils.icon('icon-plus','icon--sm')} New Rental</a>
        </div>
      </div>
      <!-- Filters -->
      <div class="db-section-card db-animate-in">
        <div class="db-filter-bar" id="rentals-filters">
          <div class="db-filter-bar__search">
            <input type="text" class="db-filter-bar__search-input" id="rentals-search" placeholder="Search rentals..." value="${Utils.escapeHtml(state.rentalsSearch)}" aria-label="Search rentals">
          </div>
          <select class="db-filter-bar__select" id="rentals-status-filter" aria-label="Filter by status">
            <option value="all" ${state.rentalsStatusFilter==='all'?'selected':''}>All active/upcoming</option>
            <option value="active" ${state.rentalsStatusFilter==='active'?'selected':''}>Active</option>
            <option value="upcoming" ${state.rentalsStatusFilter==='upcoming'?'selected':''}>Upcoming</option>
          </select>
          <select class="db-filter-bar__select" id="rentals-type-filter" aria-label="Filter by type">
            <option value="all" ${state.rentalsTypeFilter==='all'?'selected':''}>All Types</option>
            <option value="Daily" ${state.rentalsTypeFilter==='Daily'?'selected':''}>Daily</option>
            <option value="Hourly" ${state.rentalsTypeFilter==='Hourly'?'selected':''}>Hourly</option>
          </select>
          <select class="db-filter-bar__select" id="rentals-sort" aria-label="Sort by">
            <option value="newest" ${state.rentalsSort==='newest'?'selected':''}>Newest First</option>
            <option value="oldest" ${state.rentalsSort==='oldest'?'selected':''}>Oldest First</option>
            <option value="name" ${state.rentalsSort==='name'?'selected':''}>Vehicle Name</option>
          </select>
        </div>
        <div id="rentals-list" class="db-section-card__body db-section-card__body--flush">
          <!-- Rendered by JS -->
        </div>
      </div>
    `;
    _bindRentalFilters();
    _renderRentalsList();
  }

  function _bindRentalFilters() {
    const searchEl = document.getElementById('rentals-search');
    const statusEl = document.getElementById('rentals-status-filter');
    const typeEl = document.getElementById('rentals-type-filter');
    const sortEl = document.getElementById('rentals-sort');

    const update = () => {
      DashboardState.uiState.rentalsSearch = searchEl ? searchEl.value : '';
      DashboardState.uiState.rentalsStatusFilter = statusEl ? statusEl.value : 'all';
      DashboardState.uiState.rentalsTypeFilter = typeEl ? typeEl.value : 'all';
      DashboardState.uiState.rentalsSort = sortEl ? sortEl.value : 'newest';
      saveUiState();
      _renderRentalsList();
    };

    if (searchEl) searchEl.addEventListener('input', Utils.debounce(update, 250));
    if (statusEl) statusEl.addEventListener('change', update);
    if (typeEl) typeEl.addEventListener('change', update);
    if (sortEl) sortEl.addEventListener('change', update);
  }

  function _renderRentalsList() {
    const container = document.getElementById('rentals-list');
    if (!container) return;
    const st = DashboardState.uiState;
    let data = DashboardState.rentalsData.filter(r => r.status === 'active' || r.status === 'upcoming');

    // Filter
    if (st.rentalsSearch) {
      const q = st.rentalsSearch.toLowerCase();
      data = data.filter(r => `${r.brand} ${r.model} ${r.bookingId} ${r.id}`.toLowerCase().includes(q));
    }
    if (st.rentalsStatusFilter !== 'all') data = data.filter(r => r.status === st.rentalsStatusFilter);
    if (st.rentalsTypeFilter !== 'all') data = data.filter(r => r.rentalType === st.rentalsTypeFilter);

    // Sort
    if (st.rentalsSort === 'newest') data.sort((a, b) => new Date(b.pickupDate) - new Date(a.pickupDate));
    else if (st.rentalsSort === 'oldest') data.sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate));
    else if (st.rentalsSort === 'name') data.sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`));

    if (data.length === 0) {
      container.innerHTML = _renderEmptyState('icon-car', 'No Active Rentals Found', 'You don\'t have any active or upcoming rentals matching your criteria.');
      if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch(e) {}
      }
      return;
    }

    container.innerHTML = `<div class="db-rentals-grid db-animate-stagger">${data.map(r => _renderRentalCard(r)).join('')}</div>`;
    if (typeof lucide !== 'undefined') {
      try { lucide.createIcons(); } catch(e) {}
    }
  }

  function _renderRentalCard(r) {
    const remaining = (r.status === 'active' || r.status === 'upcoming') ? Utils.getRemainingDays(r.returnDate) : '';
    const statusMap = { active:'active', upcoming:'booked', completed:'completed', returned:'completed', cancelled:'cancelled' };

    return `<div class="db-rental-card">
      <div class="db-rental-card__image-wrap">
        <img src="${r.image}" alt="${r.brand} ${r.model}" class="db-rental-card__image" loading="lazy">
        <span class="db-badge db-badge--${statusMap[r.status]||r.status}">${Utils.statusLabel(r.status)}</span>
      </div>
      <div class="db-rental-card__body">
        <div class="db-rental-card__header">
          <h4 class="db-rental-card__name">${r.brand} ${r.model}</h4>
          <span class="db-rental-card__id">${r.bookingId}</span>
        </div>
        <div class="db-rental-card__meta">
          <span>${Utils.icon('icon-tag','icon--xs')} ${r.rentalType}</span>
          <span>${Utils.icon('icon-calendar','icon--xs')} ${Utils.formatDateShort(r.pickupDate)} – ${Utils.formatDateShort(r.returnDate)}</span>
          ${remaining ? `<span>${Utils.icon('icon-clock','icon--xs')} ${remaining}</span>` : ''}
        </div>
        <div class="db-rental-card__price">
          <span class="db-rental-card__price-total">${Utils.formatCurrency(r.totalCost)}</span>
          <span class="db-rental-card__price-rate">${Utils.formatCurrency(r.dailyRate)}/${r.rentalType === 'Hourly' ? 'hr' : 'day'}</span>
        </div>
        <div class="db-rental-card__actions">
          <button class="btn btn--primary btn--sm" onclick="UserDashboard.showRentalDetails('${r.id}')">${Utils.icon('icon-eye','icon--sm')} Details</button>
          ${r.status === 'upcoming' ? `<button class="btn btn--outline btn--sm" onclick="UserDashboard.openPickupModal('${r.id}')">${Utils.icon('icon-camera','icon--sm')} Pickup Photo</button>` : ''}
          ${r.status === 'active' ? `<button class="btn btn--outline btn--sm" onclick="UserDashboard.openExtensionModal('${r.id}')">${Utils.icon('icon-rotate-ccw','icon--sm')} Extend</button>
          <button class="btn btn--outline btn--sm" onclick="UserDashboard.openReturnModal('${r.id}')">${Utils.icon('icon-camera','icon--sm')} Return Car</button>` : ''}
        </div>
      </div>
    </div>`;
  }

  function showRentalDetails(rentalId) {
    const r = DashboardState.rentalsData.find(x => x.id === rentalId);
    if (!r) return;
    const statusMap = { active:'active', upcoming:'booked', completed:'completed', returned:'completed', cancelled:'cancelled' };
    const specs = [
      r.specifications.transmission,
      r.specifications.fuel,
      r.specifications.seats ? `${r.specifications.seats} Seats` : ''
    ].filter(Boolean).join(' · ') || 'Vehicle specifications unavailable';
    const durationLabel = `${r.totalDays} ${r.rentalType === 'Hourly' ? (r.totalDays === 1 ? 'hour' : 'hours') : (r.totalDays === 1 ? 'day' : 'days')}`;
    const pricing = r.pricing || {};
    const baseCharge = Number(pricing.baseCharge ?? r.totalCost) || 0;
    const taxes = Number(pricing.taxes) || 0;
    const timeline = r.timeline || [];

    const content = `
      <div class="db-modal__header">
        <h3 class="db-modal__title">Rental Booking Details</h3>
        <button class="db-modal__close" data-action="close-modal" aria-label="Close">${Utils.icon('icon-close')}</button>
      </div>
      <div class="db-modal__body db-rental-detail">
        <!-- Vehicle -->
        <div class="db-rental-detail__vehicle">
          <img src="${r.image}" alt="${Utils.escapeHtml(r.brand)} ${Utils.escapeHtml(r.model)}" class="db-rental-detail__image" loading="lazy">
          <div class="db-rental-detail__vehicle-info">
            <h4 class="db-rental-detail__vehicle-name">${Utils.escapeHtml(r.brand)} ${Utils.escapeHtml(r.model)}</h4>
            <span class="db-badge db-badge--${statusMap[r.status]||r.status}">${Utils.statusLabel(r.status)}</span>
            <p class="db-rental-detail__vehicle-specs">${Utils.escapeHtml(specs)}</p>
          </div>
        </div>
        <!-- Details Grid -->
        <div class="db-rental-detail__grid">
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Booking Reference</span><span class="db-rental-detail__value">${r.bookingId}</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Rental Type</span><span class="db-rental-detail__value">${r.rentalType}</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Pickup Date & Time</span><span class="db-rental-detail__value">${Utils.formatDate(r.pickupDate)} · ${r.pickupTime}</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Return Date & Time</span><span class="db-rental-detail__value">${Utils.formatDate(r.returnDate)} · ${r.returnTime}</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Pickup Location</span><span class="db-rental-detail__value">${Utils.escapeHtml(r.pickupLocation)}</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Rental Duration</span><span class="db-rental-detail__value">${durationLabel}</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Rate</span><span class="db-rental-detail__value">${Utils.formatCurrency(r.dailyRate)} / ${r.rentalType === 'Hourly' ? 'hr' : 'day'}</span></div>
          ${r.paymentStatus ? `<div class="db-rental-detail__item"><span class="db-rental-detail__label">Payment Status</span><span class="db-rental-detail__value">${Utils.escapeHtml(r.paymentStatus)}</span></div>` : ''}
        </div>
        <!-- Timeline -->
        <h4 class="db-rental-detail__section-title">Rental Timeline Status</h4>
        <div class="db-timeline">
          ${timeline.length === 0
            ? `<div class="db-timeline__item"><div class="db-timeline__text">No status events recorded for this booking yet.</div></div>`
            : timeline.map(t => {
              const dotCls = t.type === 'success' ? 'db-timeline__dot--success' : t.type === 'warning' ? 'db-timeline__dot--warning' : t.type === 'danger' ? 'db-timeline__dot--danger' : '';
              return `<div class="db-timeline__item"><div class="db-timeline__dot ${dotCls}"></div><div class="db-timeline__time">${Utils.formatDate(t.date)}, ${t.time}</div><div class="db-timeline__title">${Utils.escapeHtml(t.event)}</div></div>`;
            }).join('')}
        </div>
        <!-- Payment details -->
        <h4 class="db-rental-detail__section-title">Billing Summary</h4>
        <div class="db-rental-detail__payment">
          <div class="db-rental-detail__payment-row"><span>Base rental charge</span><span>${Utils.formatCurrency(baseCharge)}</span></div>
          <div class="db-rental-detail__payment-row"><span>Taxes & fees</span><span>${Utils.formatCurrency(taxes)}</span></div>
          <div class="db-rental-detail__payment-row db-rental-detail__payment-row--total"><span>Booking Total</span><span>${Utils.formatCurrency(r.totalCost)}</span></div>
        </div>
      </div>
      <div class="db-modal__footer">
        <button class="btn btn--outline btn--sm" data-action="close-modal">Close Window</button>
      </div>
    `;
    ModalController.openDynamic(content, '680px');
  }


  /* ============================================================
     13. RENDER: PRE-BOOKINGS
     ============================================================ */
  function RenderPreBookings() {
    const state = DashboardState.uiState;
    DashboardRenderer.contentArea.innerHTML = `
      <div class="db-page-header db-animate-in">
        <div class="db-page-header__left">
          <h2 class="db-page-header__title">Pre-Bookings</h2>
          <p class="db-page-header__subtitle">Submit and track vehicle reservation requests</p>
        </div>
        <div class="db-page-header__actions">
          <a href="cars.html" class="btn btn--primary btn--sm">${Utils.icon('icon-plus','icon--sm')} New Request</a>
        </div>
      </div>
      <!-- Filters -->
      <div class="db-section-card db-animate-in">
        <div class="db-filter-bar" id="pb-filters">
          <div class="db-filter-bar__search">
            <input type="text" class="db-filter-bar__search-input" id="pb-search" placeholder="Search requests..." value="${Utils.escapeHtml(state.preBookingsSearch)}" aria-label="Search pre-bookings">
          </div>
          <select class="db-filter-bar__select" id="pb-status-filter" aria-label="Filter by status">
            <option value="all" ${state.preBookingsStatusFilter==='all'?'selected':''}>All Status</option>
            <option value="pending" ${state.preBookingsStatusFilter==='pending'?'selected':''}>Pending Review</option>
            <option value="approved" ${state.preBookingsStatusFilter==='approved'?'selected':''}>Approved</option>
            <option value="rejected" ${state.preBookingsStatusFilter==='rejected'?'selected':''}>Rejected</option>
            <option value="alternative" ${state.preBookingsStatusFilter==='alternative'?'selected':''}>Alternative Suggested</option>
            <option value="expired" ${state.preBookingsStatusFilter==='expired'?'selected':''}>Expired</option>
          </select>
          <select class="db-filter-bar__select" id="pb-vehicle-filter" aria-label="Filter by vehicle">
            <option value="all">All Categories</option>
            ${[...new Set(DashboardState.preBookingsData.map(p=>p.vehicleCategory))].map(c => `<option value="${c}" ${state.preBookingsVehicleFilter===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div id="pb-list" class="db-section-card__body">
          <!-- Rendered by JS -->
        </div>
      </div>
    `;
    _bindPBFilters();
    _renderPBList();
  }

  function _bindPBFilters() {
    const searchEl = document.getElementById('pb-search');
    const statusEl = document.getElementById('pb-status-filter');
    const vehicleEl = document.getElementById('pb-vehicle-filter');

    const update = () => {
      DashboardState.uiState.preBookingsSearch = searchEl ? searchEl.value : '';
      DashboardState.uiState.preBookingsStatusFilter = statusEl ? statusEl.value : 'all';
      DashboardState.uiState.preBookingsVehicleFilter = vehicleEl ? vehicleEl.value : 'all';
      saveUiState();
      _renderPBList();
    };

    if (searchEl) searchEl.addEventListener('input', Utils.debounce(update, 250));
    if (statusEl) statusEl.addEventListener('change', update);
    if (vehicleEl) vehicleEl.addEventListener('change', update);
  }

  function _renderPBList() {
    const container = document.getElementById('pb-list');
    if (!container) return;
    const st = DashboardState.uiState;
    let data = [...DashboardState.preBookingsData];

    if (st.preBookingsSearch) {
      const q = st.preBookingsSearch.toLowerCase();
      data = data.filter(p => `${p.vehicleName} ${p.reference} ${p.id}`.toLowerCase().includes(q));
    }
    if (st.preBookingsStatusFilter !== 'all') data = data.filter(p => p.status === st.preBookingsStatusFilter);
    if (st.preBookingsVehicleFilter !== 'all') data = data.filter(p => p.vehicleCategory === st.preBookingsVehicleFilter);

    if (data.length === 0) {
      container.innerHTML = _renderEmptyState('icon-clipboard', 'No Pre-Bookings Found', 'You do not have any requests matching these criteria.');
      if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch(e) {}
      }
      return;
    }

    container.innerHTML = `<div class="db-pb-grid db-animate-in">${data.map(p => _renderPBCard(p)).join('')}</div>`;
    if (typeof lucide !== 'undefined') {
      try { lucide.createIcons(); } catch(e) {}
    }
  }

  function _renderPBCard(p) {
    const statusBadgeMap = { pending:'pending', approved:'approved', rejected:'rejected', alternative:'waiting', expired:'expired' };
    const statusLabelMap = { pending:'Pending Review', approved:'Approved', rejected:'Rejected', alternative:'Alternative Suggested', expired:'Expired' };

    let actionsHtml = '';
    switch (p.status) {
      case 'pending':
        actionsHtml = `
          <button class="btn btn--ghost btn--sm" onclick="UserDashboard.toast.show({title:'Pre-Booking',message:'Request ${Utils.escapeHtml(p.reference)} is under review.',type:'info'})">${Utils.icon('icon-eye','icon--sm')} View</button>
          <button class="btn btn--ghost btn--sm" onclick="UserDashboard.modal.confirm({title:'Cancel Request',message:'Cancel pre-booking request <strong>${Utils.escapeHtml(p.reference)}</strong>?',type:'danger',confirmText:'Yes, Cancel',onConfirm:()=>UserDashboard.cancelPreBooking('${p.reference}')})">${Utils.icon('icon-x-circle','icon--sm')} Cancel</button>`;
        break;
      case 'approved':
        actionsHtml = `<a href="booking.html" class="btn btn--primary btn--sm">${Utils.icon('icon-check-circle','icon--sm')} Continue Booking</a>`;
        break;
      case 'rejected':
        actionsHtml = `<button class="btn btn--ghost btn--sm" onclick="UserDashboard.showRejectionReason('${p.id}')">${Utils.icon('icon-info','icon--sm')} View Reason</button>`;
        break;
      case 'expired':
        actionsHtml = `<a href="cars.html" class="btn btn--ghost btn--sm">${Utils.icon('icon-rotate-ccw','icon--sm')} Book Again</a>`;
        break;
    }    let alternativeHtml = '';
    if (p.status === 'alternative' && p.alternatives) {
      // Find a suitable alternative suggestion to highlight
      const recommendedVeh = p.alternatives.suggestions[1]?.vehicles[0] || p.alternatives.suggestions[0]?.vehicles[0];
      const recName = recommendedVeh ? recommendedVeh.name : 'Range Rover Sport SVR';
      const recPrice = recommendedVeh ? recommendedVeh.price : 580;
      const recSpecs = recommendedVeh ? recommendedVeh.specs : '575 HP · 5 Seats · 4WD';
      const recImg = recommendedVeh ? recommendedVeh.image : 'assets/images/cars/suv.png';

      alternativeHtml = `
        <div class="db-pb-card__alternative-rebuilt">
          
          <!-- 1. Unavailable Alert -->
          <div class="db-pb-card__alert">
            <span class="db-pb-card__alert-icon">${Utils.icon('icon-alert-triangle', 'icon--sm')}</span>
            <div class="db-pb-card__alert-content">
              <h5 class="db-pb-card__alert-title">Selected Vehicle Unavailable</h5>
              <p class="db-pb-card__alert-text">${Utils.escapeHtml(p.alternatives.reason)}</p>
            </div>
          </div>

          <!-- 2. Recommended Vehicle Card (image left, details right) -->
          <div class="db-pb-card__rec-veh">
            <div class="db-pb-card__rec-img-wrap">
              <img src="${recImg}" alt="${recName}" class="db-pb-card__rec-img">
            </div>
            <div class="db-pb-card__rec-details">
              <h6 class="db-pb-card__rec-title">${recName}</h6>
              <div class="db-pb-card__rec-meta">
                <span>Specs: <strong>${recSpecs}</strong></span>
                <span>Availability: <strong style="color: var(--color-success);">Guaranteed immediate booking</strong></span>
              </div>
            </div>
          </div>

          <!-- 3. Price Comparison -->
          <div class="db-pb-card__comp-section">
            <div class="db-pb-card__comp-header">
              ${Utils.icon('icon-dollar', 'icon--xs')} Price Comparison
            </div>
            <div class="db-pb-card__comp-grid">
              <div class="db-pb-card__comp-col">
                <div style="font-size: 10px; color: var(--color-light-text); text-transform: uppercase; margin-bottom: 4px; font-weight: 500;">Original Request</div>
                <div class="db-pb-card__comp-row">
                  <span class="db-pb-card__comp-label">${Utils.escapeHtml(p.vehicleName)}:</span>
                  <span class="db-pb-card__comp-value" style="font-family: var(--font-mono);">${Utils.formatCurrency(420)}/day</span>
                </div>
              </div>
              <div class="db-pb-card__comp-col">
                <div style="font-size: 10px; color: var(--color-light-text); text-transform: uppercase; margin-bottom: 4px; font-weight: 500;">Recommended Alternative</div>
                <div class="db-pb-card__comp-row">
                  <span class="db-pb-card__comp-label">${recName}:</span>
                  <span class="db-pb-card__comp-value--accent" style="font-family: var(--font-mono);">${Utils.formatCurrency(recPrice)}/day</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Specification Comparison -->
          <div class="db-pb-card__comp-section">
            <div class="db-pb-card__comp-header">
              ${Utils.icon('icon-settings', 'icon--xs')} Specification Comparison
            </div>
            <div class="db-pb-card__comp-grid">
              <div class="db-pb-card__comp-col">
                <div style="font-size: 10px; color: var(--color-light-text); text-transform: uppercase; margin-bottom: 4px; font-weight: 500;">Original Request</div>
                <div class="db-pb-card__comp-row">
                  <span class="db-pb-card__comp-label">${Utils.escapeHtml(p.vehicleName)}:</span>
                  <span class="db-pb-card__comp-value">7 Seats · 335 HP · AWD</span>
                </div>
              </div>
              <div class="db-pb-card__comp-col">
                <div style="font-size: 10px; color: var(--color-light-text); text-transform: uppercase; margin-bottom: 4px; font-weight: 500;">Recommended Alternative</div>
                <div class="db-pb-card__comp-row">
                  <span class="db-pb-card__comp-label">${recName}:</span>
                  <span class="db-pb-card__comp-value">${recSpecs}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 5. Recommendation Note -->
          <div class="db-pb-card__note">
            <strong>Recommendation note:</strong> While the requested ${Utils.escapeHtml(p.vehicleName)} is unavailable, the ${recName} provides equivalent premium luxury and all-road capability. It is fully pre-approved for your dates.
          </div>

          <!-- 6. Action Buttons -->
          <div class="db-pb-card__actions-row">
            <button class="btn btn--primary btn--sm" onclick="UserDashboard.acceptAlternative('${p.reference}')">
              ${Utils.icon('icon-check-circle', 'icon--xs')} Accept Alternative
            </button>
            <a href="cars.html" class="btn btn--outline btn--sm" style="text-decoration: none;">
              ${Utils.icon('icon-car', 'icon--xs')} Choose Another Vehicle
            </a>
            <button class="btn btn--ghost btn--sm" style="color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.2); background: transparent;" onclick="UserDashboard.modal.confirm({title:'Cancel Request',message:'Cancel this pre-booking request?',type:'danger',confirmText:'Yes, Cancel',onConfirm:()=>UserDashboard.cancelPreBooking('${p.reference}')})">
              ${Utils.icon('icon-x-circle', 'icon--xs')} Cancel Request
            </button>
          </div>

        </div>
      `;
    }

    return `<div class="db-pb-card ${p.status === 'alternative' ? 'db-pb-card--expanded' : ''}">
      <div class="db-pb-card__main">
        <div class="db-pb-card__image-wrap">
          <img src="${p.vehicleImage}" alt="${p.vehicleName}" class="db-pb-card__image" loading="lazy">
          <span class="db-badge db-badge--${statusBadgeMap[p.status]}">${statusLabelMap[p.status]}</span>
        </div>
        <div class="db-pb-card__body">
          <div class="db-pb-card__header">
            <h4 class="db-pb-card__name">${Utils.escapeHtml(p.vehicleName)}</h4>
            <span class="db-pb-card__ref">${p.reference}</span>
          </div>
          <div class="db-pb-card__meta">
            <span>${Utils.icon('icon-calendar','icon--xs')} ${p.requestedDates}</span>
            <span>${Utils.icon('icon-map-pin','icon--xs')} ${Utils.escapeHtml(p.pickupLocation)}</span>
            <span>${Utils.icon('icon-dollar','icon--xs')} Est: ${Utils.formatCurrency(p.estimatedCost)}</span>
          </div>
          <div class="db-pb-card__footer">
            <span class="db-pb-card__submitted">${Utils.icon('icon-clock','icon--xs')} Requested ${Utils.formatDate(p.requestedOn)}</span>
            ${actionsHtml ? `<div class="db-pb-card__actions">${actionsHtml}</div>` : ''}
          </div>
        </div>
      </div>
      ${alternativeHtml}
    </div>`;
  }

  function showRejectionReason(pbId) {
    const p = DashboardState.preBookingsData.find(x => x.id === pbId);
    if (!p) return;
    ModalController.confirm({
      title: 'Pre-Booking Request Rejected',
      message: `<p style="margin-bottom: 12px;">We regret to inform you that your request for <strong>${Utils.escapeHtml(p.vehicleName)}</strong> has been declined.</p><blockquote style="border-left: 3px solid var(--color-danger); padding-left: 12px; font-style: italic; color: var(--color-light-text);">${Utils.escapeHtml(p.rejectionReason)}</blockquote>`,
      type: 'danger',
      confirmText: 'Browse Available Cars',
      cancelText: 'Close Window',
      onConfirm: () => { window.location.href = 'cars.html'; }
    });
  }


  /* ============================================================
     14. RENDER: RENTAL HISTORY
     ============================================================ */
  function RenderHistory() {
    const state = DashboardState.uiState;
    DashboardRenderer.contentArea.innerHTML = `
      <div class="db-page-header db-animate-in">
        <div class="db-page-header__left">
          <h2 class="db-page-header__title">Rental History</h2>
          <p class="db-page-header__subtitle">Review your past rentals, download invoices, and leave vehicle feedback</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="db-section-card db-animate-in">
        <div class="db-filter-bar">
          <div class="db-filter-bar__search">
            <input type="text" class="db-filter-bar__search-input" id="history-search" placeholder="Search by brand, booking ID..." value="${Utils.escapeHtml(state.historySearch || '')}">
          </div>
          <select class="db-filter-bar__select" id="history-status-filter">
            <option value="all" ${state.historyStatusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
            <option value="completed" ${state.historyStatusFilter === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${state.historyStatusFilter === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            <option value="returned" ${state.historyStatusFilter === 'returned' ? 'selected' : ''}>Returned</option>
          </select>
          <select class="db-filter-bar__select" id="history-sort">
            <option value="newest" ${state.historySort === 'newest' ? 'selected' : ''}>Newest First</option>
            <option value="oldest" ${state.historySort === 'oldest' ? 'selected' : ''}>Oldest First</option>
            <option value="amount" ${state.historySort === 'amount' ? 'selected' : ''}>Highest Price</option>
          </select>
        </div>
        <div id="history-list" class="db-section-card__body db-section-card__body--flush">
          <!-- Populated dynamically -->
        </div>
      </div>
    `;
    _bindHistoryFilters();
    _renderHistoryList();
  }

  function _bindHistoryFilters() {
    const search = document.getElementById('history-search');
    const status = document.getElementById('history-status-filter');
    const sort = document.getElementById('history-sort');

    const update = () => {
      DashboardState.uiState.historySearch = search ? search.value : '';
      DashboardState.uiState.historyStatusFilter = status ? status.value : 'all';
      DashboardState.uiState.historySort = sort ? sort.value : 'newest';
      saveUiState();
      _renderHistoryList();
    };

    if (search) search.addEventListener('input', Utils.debounce(update, 250));
    if (status) status.addEventListener('change', update);
    if (sort) sort.addEventListener('change', update);
  }

  function _renderHistoryList() {
    const list = document.getElementById('history-list');
    if (!list) return;

    const st = DashboardState.uiState;
    let data = DashboardState.rentalsData.filter(r => r.status === 'completed' || r.status === 'returned' || r.status === 'cancelled');

    // Filter
    if (st.historySearch) {
      const q = st.historySearch.toLowerCase();
      data = data.filter(r => `${r.brand} ${r.model} ${r.bookingId}`.toLowerCase().includes(q));
    }
    if (st.historyStatusFilter !== 'all') {
      data = data.filter(r => r.status === st.historyStatusFilter);
    }

    // Sort
    if (st.historySort === 'newest') data.sort((a,b) => new Date(b.pickupDate) - new Date(a.pickupDate));
    else if (st.historySort === 'oldest') data.sort((a,b) => new Date(a.pickupDate) - new Date(b.pickupDate));
    else if (st.historySort === 'amount') data.sort((a,b) => b.totalCost - a.totalCost);

    if (data.length === 0) {
      list.innerHTML = _renderEmptyState('icon-file-text', 'No Rental History Found', 'You do not have any past rentals matching your criteria.');
      if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch(e) {}
      }
      return;
    }

    // Desktop view as a luxury table, responsive stack layout for mobile
    list.innerHTML = `
      <div class="db-table-wrapper hide-tablet" style="margin: 0;">
        <table class="db-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Booking ID</th>
              <th>Type</th>
              <th>Dates</th>
              <th>Duration</th>
              <th>Total Cost</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(r => `
              <tr>
                <td>
                  <div style="display: flex; align-items: center; gap: var(--space-3);">
                    <img src="${r.image}" alt="${r.brand}" style="width: 60px; height: 40px; object-fit: cover; border-radius: var(--radius-md); background: var(--color-surface);">
                    <div>
                      <div style="font-weight: var(--fw-semibold); color: var(--color-dark-text);">${r.brand} ${r.model}</div>
                      <div style="font-size: var(--fs-xs); color: var(--color-light-text);">${r.category}</div>
                    </div>
                  </div>
                </td>
                <td><code style="font-size: var(--fs-xs); font-family: var(--font-mono);">${r.bookingId}</code></td>
                <td>${r.rentalType}</td>
                <td style="font-size: var(--fs-xs);">${Utils.formatDateShort(r.pickupDate)} - ${Utils.formatDateShort(r.returnDate)}</td>
                <td>${r.totalDays} days</td>
                <td><strong>${Utils.formatCurrency(r.totalCost)}</strong></td>
                <td><span class="db-badge db-badge--${r.status==='cancelled'?'cancelled':'completed'}">${Utils.statusLabel(r.status)}</span></td>
                <td>
                  <div style="display:flex; gap: var(--space-2);">
                    <button class="btn btn--outline btn--sm" style="padding: 4px 8px; font-size: var(--fs-xs);" onclick="UserDashboard.showRentalDetails('${r.id}')">View Details</button>
                    ${r.status !== 'cancelled' ? `
                      <button class="btn btn--ghost btn--sm" style="padding: 4px 8px; font-size: var(--fs-xs);" onclick="UserDashboard.openFeedbackModal('${r.id}')">Feedback</button>
                      <button class="btn btn--ghost btn--sm" style="padding: 4px 8px; font-size: var(--fs-xs);" onclick="UserDashboard.toast.show({title:'Invoice Downloaded',message:'Your invoice BK-${r.bookingId}.pdf was saved.',type:'success'})">${Utils.icon('icon-download','icon--xs')}</button>
                    ` : `
                      <a href="cars.html" class="btn btn--ghost btn--sm" style="padding: 4px 8px; font-size: var(--fs-xs);">Book Again</a>
                    `}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="db-rentals-grid hide-desktop" style="padding: var(--space-4);">
        ${data.map(r => `
          <div class="db-rental-card">
            <div class="db-rental-card__image-wrap">
              <img src="${r.image}" class="db-rental-card__image" alt="${r.brand}">
              <span class="db-badge db-badge--${r.status==='cancelled'?'cancelled':'completed'}">${Utils.statusLabel(r.status)}</span>
            </div>
            <div class="db-rental-card__body">
              <div class="db-rental-card__header">
                <h4 class="db-rental-card__name">${r.brand} ${r.model}</h4>
                <span class="db-rental-card__id">${r.bookingId}</span>
              </div>
              <div class="db-rental-card__meta">
                <span>${Utils.icon('icon-tag','icon--xs')} ${r.rentalType}</span>
                <span>${Utils.icon('icon-calendar','icon--xs')} ${Utils.formatDateShort(r.pickupDate)} – ${Utils.formatDateShort(r.returnDate)}</span>
              </div>
              <div class="db-rental-card__price">
                <span class="db-rental-card__price-total">${Utils.formatCurrency(r.totalCost)}</span>
              </div>
              <div class="db-rental-card__actions">
                <button class="btn btn--primary btn--sm" onclick="UserDashboard.showRentalDetails('${r.id}')">Details</button>
                <button class="btn btn--ghost btn--sm" onclick="UserDashboard.toast.show({title:'Invoice Downloaded',message:'Your invoice was saved.',type:'success'})">Download Invoice</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    if (typeof lucide !== 'undefined') {
      try { lucide.createIcons(); } catch(e) {}
    }
  }


  /* ============================================================
     15. RENDER: RENTAL EXTENSIONS
     ============================================================ */
  function RenderExtensions() {
    DashboardRenderer.contentArea.innerHTML = `
      <div class="db-page-header db-animate-in">
        <div class="db-page-header__left">
          <h2 class="db-page-header__title">Rental Extensions</h2>
          <p class="db-page-header__subtitle">Extend your active rentals or review the history of extension approvals</p>
        </div>
      </div>

      <!-- ACTIVE RENTALS FOR EXTENSION -->
      <h3 class="db-section-title db-animate-in" style="margin-bottom: var(--space-4); font-size: var(--fs-body); font-family: var(--font-heading); color: var(--color-dark-text);">Eligible Active Rentals</h3>
      <div id="eligible-extensions" class="db-pb-grid db-animate-in" style="margin-bottom: var(--space-8);">
        <!-- Eligible extensions render here -->
      </div>

      <!-- PREVIOUS EXTENSIONS -->
      <div class="db-section-card db-animate-in">
        <div class="db-section-card__header">
          <div>
            <h3 class="db-section-card__title">Extension Request History</h3>
            <p class="db-section-card__subtitle">Past requests and approval logs</p>
          </div>
        </div>
        <div class="db-section-card__body db-section-card__body--flush">
          <div class="db-table-wrapper" style="margin: 0;">
            <table class="db-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Request Details</th>
                  <th>Original Return</th>
                  <th>New Return</th>
                  <th>Estimated Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${DashboardState.extensionHistory.map(h => `
                  <tr>
                    <td>
                      <div style="display:flex; align-items:center; gap: var(--space-3);">
                        <img src="${h.image}" alt="${h.brand}" style="width: 50px; height: 35px; object-fit: cover; border-radius: var(--radius-md); background: var(--color-surface);">
                        <span style="font-weight: var(--fw-semibold);">${h.brand} ${h.model}</span>
                      </div>
                    </td>
                    <td>Extended by ${h.duration} (${h.type})</td>
                    <td style="font-size: var(--fs-xs);">${h.originalReturn}</td>
                    <td style="font-size: var(--fs-xs); font-weight: var(--fw-medium); color: var(--color-dark-text);">${h.newReturn}</td>
                    <td><strong>${Utils.formatCurrency(h.estimatedCost)}</strong></td>
                    <td>
                      <span class="db-badge db-badge--${h.status==='approved'?'approved':h.status==='rejected'?'rejected':'pending'}">${Utils.statusLabel(h.status)}</span>
                      ${h.status==='rejected'?`<div style="font-size: 10px; color: var(--color-danger); margin-top:2px;">${h.reason}</div>`:''}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    _renderEligibleExtensions();
  }

  function _renderEligibleExtensions() {
    const el = document.getElementById('eligible-extensions');
    if (!el) return;

    const data = DashboardState.extensionsData;
    if (data.length === 0) {
      el.innerHTML = _renderEmptyState('icon-rotate-ccw', 'No Active Eligible Rentals', 'You do not have any active rentals eligible for extension at this time.');
      if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch(e) {}
      }
      return;
    }

    el.innerHTML = data.map(ext => {
      const isPending = ext.status === 'pending';
      const badgeCls = isPending ? 'db-badge--pending' : 'db-badge--approved';
      const badgeLabel = isPending ? 'Pending Review' : 'Eligible for Extension';

      return `
        <div class="db-pb-card">
          <div class="db-pb-card__main">
            <div class="db-pb-card__image-wrap">
              <img src="${ext.image}" alt="${ext.brand}" class="db-pb-card__image">
              <span class="db-badge ${badgeCls}">${badgeLabel}</span>
            </div>
            <div class="db-pb-card__body">
              <div class="db-pb-card__header">
                <h4 class="db-pb-card__name">${ext.brand} ${ext.model}</h4>
                <span class="db-pb-card__ref">${ext.id}</span>
              </div>
              <div class="db-pb-card__meta">
                <span>${Utils.icon('icon-calendar','icon--xs')} Return Date: <strong>${Utils.formatDate(ext.currentReturnDate)}</strong></span>
                <span>${Utils.icon('icon-clock','icon--xs')} ${ext.remainingDays} days remaining</span>
                <span>${Utils.icon('icon-dollar','icon--xs')} Cost: ${Utils.formatCurrency(ext.dailyRate)}/day</span>
              </div>
              ${isPending ? `
                <div style="margin-top: var(--space-3); padding: var(--space-3); background: var(--color-surface); border-radius: var(--radius-md); font-size: var(--fs-xs);">
                  <div style="font-weight:var(--fw-semibold); color: var(--color-dark-text);">Pending Request Details:</div>
                  <div style="margin-top:2px;">Requested: <strong>+${ext.additionalTime}</strong> for reason: "${ext.reason}"</div>
                  <div style="margin-top:2px;">Estimated Additional Cost: <strong>${Utils.formatCurrency(ext.estimatedCost)}</strong> (New return: ${Utils.formatDate(ext.updatedReturnDate)})</div>
                </div>
              ` : ''}
              <div class="db-pb-card__footer" style="margin-top: var(--space-4);">
                <span></span>
                <div class="db-pb-card__actions">
                  ${isPending ? `
                    <button class="btn btn--outline btn--sm" onclick="UserDashboard.toast.show({title:'Request Under Review',message:'Our admins are currently reviewing this extension request.',type:'info'})">Pending Approval</button>
                  ` : `
                    <button class="btn btn--primary btn--sm" onclick="UserDashboard.openExtensionModal('${ext.rentalId}')">${Utils.icon('icon-rotate-ccw','icon--sm')} Request Extension</button>
                  `}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    if (typeof lucide !== 'undefined') {
      try { lucide.createIcons(); } catch(e) {}
    }
  }

  function openExtensionModal(rentalId) {
    const ext = DashboardState.extensionsData.find(e => e.rentalId === rentalId);
    if (!ext) return;

    const content = `
      <div class="db-modal__header">
        <h3 class="db-modal__title">Request Rental Extension</h3>
        <button class="db-modal__close" data-action="close-modal" aria-label="Close">${Utils.icon('icon-close')}</button>
      </div>
      <form id="extension-request-form" onsubmit="UserDashboard.submitExtensionRequest(event, '${rentalId}')">
        <div class="db-modal__body db-rental-detail">
          <div style="display:flex; gap:var(--space-4); margin-bottom:var(--space-5); align-items:center;">
            <img src="${ext.image}" alt="${ext.brand}" style="width: 100px; height: 65px; object-fit:cover; border-radius:var(--radius-md); background:var(--color-surface);">
            <div>
              <h4 style="font-weight:var(--fw-semibold); color:var(--color-dark-text); font-family:var(--font-heading);">${ext.brand} ${ext.model}</h4>
              <p style="font-size:var(--fs-xs); color:var(--color-light-text);">Current Scheduled Return: ${Utils.formatDate(ext.currentReturnDate)}</p>
            </div>
          </div>
          
          <div class="db-rental-detail__grid" style="grid-template-columns:1fr; gap:var(--space-4);">
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom: 4px;">Extension Type</label>
              <select class="db-filter-bar__select" id="ext-time-type" style="width:100%;" onchange="UserDashboard.updateExtensionCost('${rentalId}')">
                <option value="days">Extend by Days</option>
                <option value="hours">Extend by Hours</option>
              </select>
            </div>
            
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom: 4px;" id="ext-duration-label">Additional Days</label>
              <select class="db-filter-bar__select" id="ext-duration-select" style="width:100%;" onchange="UserDashboard.updateExtensionCost('${rentalId}')">
                <option value="1">1 Day</option>
                <option value="2">2 Days</option>
                <option value="3">3 Days</option>
                <option value="5">5 Days</option>
                <option value="7">7 Days</option>
              </select>
            </div>

            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom: 4px;">Reason for Extension</label>
              <textarea class="db-filter-bar__search-input" id="ext-reason" style="width:100%; height:80px; padding:var(--space-3); resize:none;" placeholder="Please describe why you need to extend this rental..." required></textarea>
            </div>
          </div>

          <h4 class="db-rental-detail__section-title">New Billing Forecast</h4>
          <div class="db-rental-detail__payment">
            <div class="db-rental-detail__payment-row"><span>Original Return Date</span><span>${Utils.formatDate(ext.currentReturnDate)}</span></div>
            <div class="db-rental-detail__payment-row"><span>New Return Date</span><span id="ext-new-return-date" style="font-weight:var(--fw-medium); color:var(--color-dark-text);">${Utils.formatDate(ext.currentReturnDate)}</span></div>
            <div class="db-rental-detail__payment-row"><span>Extension rate</span><span id="ext-calculation-rate">${Utils.formatCurrency(ext.dailyRate)}/day</span></div>
            <div class="db-rental-detail__payment-row db-rental-detail__payment-row--total"><span>Estimated Additional Charge</span><span id="ext-total-cost" style="color:var(--color-secondary);">${Utils.formatCurrency(ext.dailyRate)}</span></div>
          </div>
        </div>
        <div class="db-modal__footer">
          <button type="button" class="btn btn--outline btn--sm" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn btn--primary btn--sm">${Utils.icon('icon-check','icon--sm')} Submit Extension Request</button>
        </div>
      </form>
    `;
    ModalController.openDynamic(content, '520px');
    updateExtensionCost(rentalId);
  }

  function updateExtensionCost(rentalId) {
    const ext = DashboardState.extensionsData.find(e => e.rentalId === rentalId);
    if (!ext) return;

    const timeType = document.getElementById('ext-time-type');
    const select = document.getElementById('ext-duration-select');
    const durationLabel = document.getElementById('ext-duration-label');
    const returnEl = document.getElementById('ext-new-return-date');
    const rateEl = document.getElementById('ext-calculation-rate');
    const costEl = document.getElementById('ext-total-cost');

    if (!timeType || !select || !returnEl || !rateEl || !costEl) return;

    const isDays = timeType.value === 'days';
    
    // Update dropdown options depending on timeType selection
    if (isDays && durationLabel.textContent !== 'Additional Days') {
      durationLabel.textContent = 'Additional Days';
      select.innerHTML = `
        <option value="1">1 Day</option>
        <option value="2">2 Days</option>
        <option value="3">3 Days</option>
        <option value="5">5 Days</option>
        <option value="7">7 Days</option>
      `;
    } else if (!isDays && durationLabel.textContent !== 'Additional Hours') {
      durationLabel.textContent = 'Additional Hours';
      select.innerHTML = `
        <option value="2">2 Hours</option>
        <option value="4">4 Hours</option>
        <option value="6">6 Hours</option>
        <option value="12">12 Hours</option>
        <option value="18">18 Hours</option>
      `;
    }

    const value = parseInt(select.value, 10);
    let extraCost = 0;
    let newDate = new Date(ext.currentReturnDate + 'T10:00:00');

    if (isDays) {
      extraCost = ext.dailyRate * value;
      newDate.setDate(newDate.getDate() + value);
      rateEl.textContent = `${Utils.formatCurrency(ext.dailyRate)} / day`;
      returnEl.textContent = newDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' · 10:00 AM';
    } else {
      const hourlyRate = Math.round(ext.dailyRate / 6); // Hourly rate approximation
      extraCost = hourlyRate * value;
      newDate.setHours(newDate.getHours() + value);
      rateEl.textContent = `${Utils.formatCurrency(hourlyRate)} / hour`;
      returnEl.textContent = newDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ` · ${newDate.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}`;
    }

    costEl.textContent = Utils.formatCurrency(extraCost);
  }

  async function submitExtensionRequest(e, rentalId) {
    e.preventDefault();

    const timeType = document.getElementById('ext-time-type').value;
    const select = document.getElementById('ext-duration-select').value;
    const isDays = timeType === 'days';
    const value = parseInt(select, 10);
    const additionalHours = isDays ? value * 24 : value;

    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Processing...';
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/bookings/${rentalId}/extend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ additionalHours })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Extension failed');
      
      ToastController.show({
        title: 'Extension Requested',
        message: 'Your rental extension request has been submitted for review.',
        type: 'success'
      });
      
      ModalController.close();
      DashboardRenderer.navigate('overview');
      init(); // Reload dashboard state to get updated extension history

    } catch (err) {
      alert('Error extending rental: ' + err.message);
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Confirm Extension';
      }
    }
  }


  /* ============================================================
     16. RENDER: VEHICLE VERIFICATION
     ============================================================ */
  function RenderVerification() {
    const rental = DashboardState.rentalsData.find(r => r.status === 'active') ||
                   DashboardState.rentalsData.find(r => r.status === 'upcoming');
    const kyc = DashboardState.kycData || { status: 'NOT_SUBMITTED' };
    const kycMeta = {
      NOT_SUBMITTED: { label: 'Not Submitted', badge: 'waiting', step: 0 },
      PENDING: { label: 'Pending Review', badge: 'pending', step: 2 },
      VERIFIED: { label: 'Verified', badge: 'available', step: 3 },
      REJECTED: { label: 'Rejected', badge: 'rejected', step: 1 }
    }[kyc.status] || { label: 'Not Submitted', badge: 'waiting', step: 0 };
    const progressStep = kycMeta.step;
    const documentTypeLabels = {
      drivers_license: "Driver's License",
      national_id: 'National ID',
      passport: 'Passport'
    };
    const maskedDocument = kyc.documentNumber
      ? (kyc.documentNumber.length > 4 ? '••••' + kyc.documentNumber.slice(-4) : kyc.documentNumber)
      : '—';
    const conditionPhotos = [
      rental && rental.pickupPhotoUrl ? { label: 'Pickup Condition Photo', url: rental.pickupPhotoUrl } : null,
      rental && rental.returnPhotoUrl ? { label: 'Return Condition Photo', url: rental.returnPhotoUrl } : null
    ].filter(Boolean);

    if (!rental) {
      DashboardRenderer.contentArea.innerHTML = `
        <div class="db-page-header db-animate-in">
          <div class="db-page-header__left">
            <h2 class="db-page-header__title">Vehicle Verification</h2>
            <p class="db-page-header__subtitle">Review your KYC status and rental condition records</p>
          </div>
        </div>
        ${_renderErrorBanner()}
        <div class="db-section-card db-animate-in" style="margin-bottom: var(--space-6);">
          <div class="db-section-card__body" style="display:flex; justify-content:space-between; align-items:center; gap:var(--space-4); flex-wrap:wrap;">
            <div>
              <div style="font-size:var(--fs-xs); color:var(--color-light-text);">Account KYC Status</div>
              <div style="font-weight:var(--fw-semibold); color:var(--color-dark-text);">${kycMeta.label}</div>
            </div>
            <span class="db-badge db-badge--${kycMeta.badge}">${kycMeta.label}</span>
          </div>
        </div>
        <div class="db-section-card db-animate-in">
          ${_renderEmptyState('icon-shield-check', 'No Rental to Verify', 'Vehicle verification becomes available once you have an active or upcoming booking. Browse the fleet to get started.', 'Browse Cars', 'cars.html')}
        </div>
      `;
      return;
    }

    DashboardRenderer.contentArea.innerHTML = `
      <div class="db-page-header db-animate-in">
        <div class="db-page-header__left">
          <h2 class="db-page-header__title">Vehicle Verification</h2>
          <p class="db-page-header__subtitle">Review the real condition records and KYC status linked to your rental</p>
        </div>
      </div>

      ${_renderErrorBanner()}

      <!-- Booking context banner -->
      <div class="db-section-card db-animate-in" style="margin-bottom: var(--space-6);">
        <div class="db-section-card__body" style="display:flex; justify-content:space-between; flex-wrap:wrap; gap: var(--space-4); align-items:center; background: var(--color-surface); padding: var(--space-4) var(--space-6); border-radius: var(--radius-lg);">
          <div>
            <div style="font-size: var(--fs-xs); color: var(--color-light-text);">${rental.status === 'active' ? 'Active Rental Vehicle' : 'Upcoming Rental Vehicle'}</div>
            <div style="font-weight: var(--fw-semibold); color: var(--color-dark-text); font-size:var(--fs-body);">${Utils.escapeHtml(rental.brand)} ${Utils.escapeHtml(rental.model)}</div>
          </div>
          <div>
            <div style="font-size: var(--fs-xs); color: var(--color-light-text);">Booking Reference</div>
            <code style="font-family: var(--font-mono); font-weight:var(--fw-medium);">${rental.bookingId}</code>
          </div>
          <div>
            <div style="font-size: var(--fs-xs); color: var(--color-light-text);">Rental Period</div>
            <div style="font-size:var(--fs-small); color: var(--color-dark-text);">${Utils.formatDateShort(rental.pickupDate)} – ${Utils.formatDateShort(rental.returnDate)}</div>
          </div>
          <div>
            <span class="db-badge db-badge--${kycMeta.badge}">KYC ${kycMeta.label}</span>
          </div>
        </div>
      </div>

      <!-- Timeline steps indicator -->
      <div class="db-section-card db-animate-in" style="margin-bottom: var(--space-6);">
        <div class="db-section-card__body">
          <div style="display:flex; justify-content:space-between; align-items:center; position:relative; max-width:800px; margin: 0 auto; padding: var(--space-4) 0;">
            <div style="position:absolute; top:50%; left:5%; right:5%; height:3px; background:var(--color-border-light); z-index:0; transform:translateY(-50%);"></div>
            <div id="verif-progress-bar" style="position:absolute; top:50%; left:5%; width:${(progressStep / 3) * 90}%; height:3px; background:var(--color-secondary); z-index:0; transform:translateY(-50%); transition: width 0.4s ease;"></div>
            ${_renderTimelineStep(0, 'icon-clock', 'Waiting Approval', progressStep >= 0)}
            ${_renderTimelineStep(1, 'icon-upload', 'KYC Submitted', progressStep >= 1)}
            ${_renderTimelineStep(2, 'icon-user', 'Admin Review', progressStep >= 2)}
            ${_renderTimelineStep(3, 'icon-shield-check', 'Verified Complete', progressStep >= 3)}
          </div>
        </div>
      </div>

      <div class="db-section-grid" style="grid-template-columns: 1fr 1fr; gap: var(--space-6); align-items: start;">
        <!-- Real KYC details -->
        <div class="db-section-card db-animate-in">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">KYC Verification</h3>
              <p class="db-section-card__subtitle">Identity documents submitted to JET CABS</p>
            </div>
            <span class="db-badge db-badge--${kycMeta.badge}">${kycMeta.label}</span>
          </div>
          <div class="db-section-card__body">
            ${kyc.status === 'NOT_SUBMITTED' ? `
              <div class="db-empty-state" style="padding: var(--space-5) var(--space-3);">
                <div class="db-empty-state__icon">${Utils.icon('icon-shield-check')}</div>
                <h3 class="db-empty-state__title">KYC Not Submitted</h3>
                <p class="db-empty-state__text">Complete your identity verification during checkout to unlock all rental features.</p>
                <a href="cars.html" class="btn btn--primary btn--sm">Browse Cars & Book</a>
              </div>
            ` : `
              <div class="db-rental-detail__grid" style="grid-template-columns: 1fr 1fr; gap: var(--space-4);">
                <div class="db-rental-detail__item"><span class="db-rental-detail__label">Document Type</span><span class="db-rental-detail__value">${documentTypeLabels[kyc.documentType] || '—'}</span></div>
                <div class="db-rental-detail__item"><span class="db-rental-detail__label">Document Number</span><span class="db-rental-detail__value">${maskedDocument}</span></div>
                <div class="db-rental-detail__item"><span class="db-rental-detail__label">Submitted On</span><span class="db-rental-detail__value">${Utils.formatDate(kyc.submittedAt)}</span></div>
                <div class="db-rental-detail__item"><span class="db-rental-detail__label">Reviewed On</span><span class="db-rental-detail__value">${kyc.reviewedAt ? Utils.formatDate(kyc.reviewedAt) : 'Awaiting review'}</span></div>
              </div>
              ${kyc.status === 'REJECTED' && kyc.rejectionReason ? `
                <div style="margin-top: var(--space-4); padding: var(--space-3); border-radius: var(--radius-md); background: rgba(220,38,38,0.06); border:1px solid rgba(220,38,38,0.2); font-size: var(--fs-small); color: var(--color-danger);">
                  <strong>Rejection reason:</strong> ${Utils.escapeHtml(kyc.rejectionReason)}
                </div>
              ` : ''}
            `}
          </div>
        </div>

        <!-- Real condition photos -->
        <div class="db-section-card db-animate-in">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Vehicle Condition Photos</h3>
              <p class="db-section-card__subtitle">Pickup and return photos recorded with this booking</p>
            </div>
          </div>
          <div class="db-section-card__body">
            ${conditionPhotos.length === 0 ? `
              <div class="db-empty-state" style="padding: var(--space-5) var(--space-3);">
                <div class="db-empty-state__icon">${Utils.icon('icon-camera')}</div>
                <h3 class="db-empty-state__title">No Condition Photos Yet</h3>
                <p class="db-empty-state__text">Condition photos are captured during the pickup and return steps of your rental. They will appear here once uploaded.</p>
              </div>
            ` : `
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
                ${conditionPhotos.map(photo => `
                  <div style="border:1px solid var(--color-border-light); border-radius:var(--radius-md); overflow:hidden; background:var(--color-surface);">
                    <img src="${photo.url}" alt="${photo.label}" style="width:100%; height:150px; object-fit:cover; display:block;">
                    <div style="padding: var(--space-2) var(--space-3); font-size: var(--fs-xs); font-weight: var(--fw-semibold); color: var(--color-dark-text);">${photo.label}</div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  function _renderTimelineStep(index, icon, label, isActive) {
    const color = isActive ? 'var(--color-secondary)' : 'var(--color-border-light)';
    const bg = isActive ? 'var(--color-secondary)' : 'var(--color-card)';
    const text = isActive ? 'var(--color-dark-text)' : 'var(--color-light-text)';
    const iconColor = isActive ? '#111' : 'var(--color-light-text)';

    return `
      <div style="display:flex; flex-direction:column; align-items:center; gap:var(--space-2); z-index:1; position:relative;">
        <div style="width:36px; height:36px; border-radius:50%; background:${bg}; border: 3px solid ${color}; display:flex; align-items:center; justify-content:center; color:${iconColor}; transition: all 0.3s ease;">
          ${Utils.icon(icon, 'icon--sm')}
        </div>
        <span style="font-size: 10px; font-weight:var(--fw-semibold); color:${text}; white-space:nowrap;">${label}</span>
      </div>
    `;
  }

  function handleImageUpload() {
    ToastController.show({
      title: 'Use the Pickup / Return Flow',
      message: 'Condition photos are uploaded from your rental card during pickup or return.',
      type: 'info'
    });
  }


  /* ============================================================
     17. RENDER: NOTIFICATION CENTER
     ============================================================ */
  const NOTIF_TYPE_MAP = {
    booking_confirmed: 'success',
    rental_started: 'success',
    rental_extended: 'success',
    rental_completed: 'success',
    rental_expires_1h: 'warning',
    rental_expires_30m: 'warning',
    rental_expires_15m: 'warning',
    return_vehicle_reminder: 'warning'
  };

  const NOTIF_CATEGORY_MAP = {
    booking_confirmed: 'Booking',
    rental_started: 'Rental',
    rental_extended: 'Extension',
    rental_completed: 'Rental',
    rental_expires_1h: 'Reminder',
    rental_expires_30m: 'Reminder',
    rental_expires_15m: 'Reminder',
    return_vehicle_reminder: 'Reminder'
  };

  function notificationRelativeTime(isoDate) {
    if (!isoDate) return '';
    const diffMs = Date.now() - new Date(isoDate).getTime();
    if (diffMs < 60000) return 'Just now';
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  async function fetchNotifications(token) {
    try {
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (!json.success) return false;

      DashboardState.notificationData = json.data.map(n => ({
        id: n._id,
        type: NOTIF_TYPE_MAP[n.type] || 'info',
        category: NOTIF_CATEGORY_MAP[n.type] || 'Update',
        title: n.title,
        text: n.message,
        time: notificationRelativeTime(n.createdAt),
        read: !!n.isRead,
        priority: (n.type && n.type.indexOf('rental_expires') === 0) ? 'high' : 'normal'
      }));
      return true;
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      return false;
    }
  }

  function RenderNotifications() {
    DashboardRenderer.contentArea.innerHTML = `
      <div class="db-page-header db-animate-in">
        <div class="db-page-header__left">
          <h2 class="db-page-header__title">Latest Notifications</h2>
          <p class="db-page-header__subtitle">Stay updated on your rentals, extensions, and account status</p>
        </div>
        <div class="db-page-header__actions">
          <button class="btn btn--outline btn--sm" onclick="UserDashboard.markAllNotificationsRead()">Mark all as read</button>
        </div>
      </div>

      <div class="db-section-card db-animate-in">
        <div id="notifications-list" class="db-section-card__body db-section-card__body--flush">
          <!-- Rendered by JS -->
        </div>
      </div>
    `;

    _renderNotificationsList();
  }

  function _renderNotificationsList() {
    const container = document.getElementById('notifications-list');
    if (!container) return;

    // Show only the latest 10 notifications
    let data = DashboardState.notificationData.slice(0, 10);

    if (data.length === 0) {
      container.innerHTML = _renderEmptyState('icon-bell', 'No Notifications', 'You don\'t have any notifications at the moment.');
      if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch(e) {}
      }
      return;
    }

    const icons = { success:'icon-check-circle', info:'icon-info', warning:'icon-alert-triangle', danger:'icon-x-circle' };

    container.innerHTML = data.map(n => `
      <div class="db-notification-preview ${n.read ? '' : 'db-notification-preview--unread'}" style="padding: var(--space-5) var(--space-6); display:flex; align-items:center; justify-content:space-between; gap: var(--space-4);">
        <div style="display:flex; align-items:flex-start; gap: var(--space-4); flex:1; min-width:0;" onclick="UserDashboard.markNotificationRead('${n.id}')">
          <div class="db-notification-preview__icon db-notification-preview__icon--${n.type}">${Utils.icon(icons[n.type]||'icon-info', 'icon--sm')}</div>
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:var(--space-2); margin-bottom:2px;">
              <span style="font-size: var(--fs-small); font-weight:var(--fw-semibold); color:var(--color-dark-text);">${Utils.escapeHtml(n.title)}</span>
              ${n.priority === 'high' ? `<span class="db-badge db-badge--rejected" style="font-size: 8px; padding: 1px 4px;">High Priority</span>` : ''}
              <span class="db-badge" style="font-size: 8px; padding: 1px 4px; border:1px solid var(--color-border-light);">${n.category}</span>
            </div>
            <p style="font-size:var(--fs-xs); color:var(--color-light-text); line-height:1.4; margin:0;">${Utils.escapeHtml(n.text)}</p>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap: var(--space-4);">
          <span style="font-size:var(--fs-xs); color:var(--color-light-text); white-space:nowrap;">${n.time}</span>
          <button class="btn btn--ghost btn--sm btn--icon" style="color:var(--color-light-text);" onclick="UserDashboard.deleteNotification('${n.id}')" title="Delete alert">
            ${Utils.icon('icon-trash', 'icon--sm')}
          </button>
        </div>
      </div>
    `).join('');

    if (typeof lucide !== 'undefined') {
      try { lucide.createIcons(); } catch(e) {}
    }
  }

  function markNotificationRead(id) {
    const n = DashboardState.notificationData.find(x => x.id.toString() === id.toString());
    if (n && !n.read) {
      n.read = true;
      DropdownController.updateNotificationBadge();
      DropdownController.renderNotifications(document.getElementById('db-notification-panel'));
      _renderNotificationsList();

      // Persist read state to the backend
      const token = localStorage.getItem('token');
      if (token) {
        fetch(`http://localhost:5000/api/notifications/${id}/read`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => console.error('Failed to mark notification read:', err));
      }

      // Highlight unread count stat card if we are on Overview
      if (DashboardState.uiState.currentModule === 'overview') {
        RenderOverview();
      }
    }
  }

  function markAllNotificationsRead() {
    DashboardState.notificationData.forEach(n => n.read = true);
    DropdownController.updateNotificationBadge();
    DropdownController.renderNotifications(document.getElementById('db-notification-panel'));

    // Persist to the backend
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(err => console.error('Failed to mark all notifications read:', err));
    }

    ToastController.show({
      title: 'Notifications Cleared',
      message: 'All unread notifications marked as read.',
      type: 'info'
    });

    _renderNotificationsList();
    if (DashboardState.uiState.currentModule === 'overview') {
      RenderOverview();
    }
  }

  function deleteNotification(id) {
    const idx = DashboardState.notificationData.findIndex(x => x.id.toString() === id.toString());
    if (idx !== -1) {
      DashboardState.notificationData.splice(idx, 1);
      DropdownController.updateNotificationBadge();
      DropdownController.renderNotifications(document.getElementById('db-notification-panel'));
      _renderNotificationsList();

      // Persist deletion to the backend
      const token = localStorage.getItem('token');
      if (token) {
        fetch(`http://localhost:5000/api/notifications/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => console.error('Failed to delete notification:', err));
      }

      ToastController.show({
        title: 'Deleted Alert',
        message: 'Notification removed successfully.',
        type: 'success'
      });

      if (DashboardState.uiState.currentModule === 'overview') {
        RenderOverview();
      }

      if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch(e) {}
      }
    }
  }


  /* ============================================================
     18. RENDER: PROFILE & ACCOUNT
     ============================================================ */
  function RenderProfile(activeTab = 'personal') {
    DashboardState.uiState.profileActiveTab = activeTab;
    saveUiState();

    const u = DashboardState.userData;
    const kycMeta = {
      NOT_SUBMITTED: { label: 'Not Submitted', badge: 'waiting' },
      PENDING: { label: 'Pending Review', badge: 'pending' },
      VERIFIED: { label: 'Verified', badge: 'available' },
      REJECTED: { label: 'Rejected', badge: 'rejected' }
    }[u.kycStatus] || { label: 'Not Submitted', badge: 'waiting' };
    const referenceId = u.id ? String(u.id).slice(-8).toUpperCase() : '—';
    const memberSince = u.memberSince ? Utils.formatDate(u.memberSince) : '—';
    const membershipLabel = u.membership ? `${Utils.escapeHtml(u.membership)} Member` : 'Customer Account';
    const licenseBadge = u.licenseNumber ? 'available' : 'waiting';
    const licenseBadgeLabel = u.licenseNumber ? 'On File' : 'Not Provided';
    
    DashboardRenderer.contentArea.innerHTML = `
      <div class="db-page-header db-animate-in">
        <div class="db-page-header__left">
          <h2 class="db-page-header__title">My Profile & Account</h2>
          <p class="db-page-header__subtitle">Manage your personal credentials, address records, driving license, and dashboard preferences</p>
        </div>
      </div>

      <div class="db-section-grid" style="grid-template-columns: 1fr 3fr; gap:var(--space-6); align-items: start;">
        
        <!-- Profile summary card -->
        <div class="db-section-card db-animate-in" style="position: sticky; top: 100px;">
          <div class="db-section-card__body" style="text-align:center; padding:var(--space-6);">
            <div style="width: 90px; height: 90px; border-radius:50%; background:var(--color-primary); color:#FFF; display:flex; align-items:center; justify-content:center; font-size:2rem; font-weight:var(--fw-bold); margin: 0 auto var(--space-4) auto; border:3px solid var(--color-secondary);">
              ${u.initials}
            </div>
            <h3 style="font-family:var(--font-heading); font-size:var(--fs-h4); font-weight:var(--fw-semibold); color:var(--color-dark-text); margin-bottom:2px;">${Utils.escapeHtml(u.firstName)} ${Utils.escapeHtml(u.lastName)}</h3>
            <span class="db-badge db-badge--completed" style="margin-bottom:var(--space-5);">${membershipLabel}</span>
            
            <div style="text-align:left; border-top:1px solid var(--color-border-light); padding-top:var(--space-4); font-size:var(--fs-xs); color:var(--color-light-text);">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span>Member Since</span><strong style="color:var(--color-dark-text);">${memberSince}</strong></div>
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span>User Reference ID</span><code style="color:var(--color-dark-text);">${referenceId}</code></div>
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span>KYC Status</span><span class="db-badge db-badge--${kycMeta.badge}" style="padding:1px 6px;">${kycMeta.label}</span></div>
            </div>
          </div>
        </div>

        <!-- Dynamic form inputs -->
        <div class="db-section-card db-animate-in">
          
          <!-- tab tabs switcher -->
          <div class="db-tabs" data-db-tabs="profile-tabs" style="padding:0; background: var(--color-surface); border-bottom:1px solid var(--color-border-light);">
            <button class="db-tab ${activeTab==='personal'?'active':''}" data-tab-target="profile-personal">Personal Information</button>
            <button class="db-tab ${activeTab==='license'?'active':''}" data-tab-target="profile-license">Driving License</button>
            <button class="db-tab ${activeTab==='address'?'active':''}" data-tab-target="profile-address">Address</button>
            <button class="db-tab ${activeTab==='emergency'?'active':''}" data-tab-target="profile-emergency">Emergency Contact</button>
            <button class="db-tab ${activeTab==='settings'?'active':''}" data-tab-target="profile-settings">Account Settings</button>
          </div>

          <form id="profile-edit-form" onsubmit="UserDashboard.saveProfile(event)">
            <div class="db-section-card__body">
              <div style="margin-bottom: var(--space-5); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); background: var(--color-surface); border: 1px solid var(--color-border-light); font-size: var(--fs-xs); color: var(--color-light-text);">
                Only your name and phone number can be edited here. License, address, date of birth, and emergency details are sourced from your latest booking and are read-only.
              </div>
              
              <!-- TAB 1: PERSONAL -->
              <div class="db-tab-content ${activeTab==='personal'?'active':''}" id="profile-personal" data-tab-group="profile-tabs">
                <div class="db-rental-detail__grid" style="grid-template-columns: repeat(2, 1fr); gap:var(--space-4);">
                  <div class="db-rental-detail__item" style="background:none; padding:0;">
                    <label class="db-rental-detail__label" style="margin-bottom:4px;">First Name</label>
                    <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="p-firstname" value="${Utils.escapeHtml(u.firstName)}" required>
                  </div>
                  <div class="db-rental-detail__item" style="background:none; padding:0;">
                    <label class="db-rental-detail__label" style="margin-bottom:4px;">Last Name</label>
                    <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="p-lastname" value="${Utils.escapeHtml(u.lastName)}" required>
                  </div>
                  <div class="db-rental-detail__item" style="background:none; padding:0;">
                    <label class="db-rental-detail__label" style="margin-bottom:4px;">Email Address <span style="font-weight:normal; text-transform:none; color:var(--color-light-text);">(read-only)</span></label>
                    <input type="email" class="db-filter-bar__search-input" style="width:100%; height:40px; opacity:0.7;" id="p-email" value="${Utils.escapeHtml(u.email)}" disabled title="Email changes require support">
                  </div>
                  <div class="db-rental-detail__item" style="background:none; padding:0;">
                    <label class="db-rental-detail__label" style="margin-bottom:4px;">Phone Number</label>
                    <input type="tel" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="p-phone" value="${Utils.escapeHtml(u.phone)}" required>
                  </div>
                  <div class="db-rental-detail__item" style="background:none; padding:0;">
                    <label class="db-rental-detail__label" style="margin-bottom:4px;">Date of Birth <span style="font-weight:normal; text-transform:none; color:var(--color-light-text);">(from booking)</span></label>
                    <input type="date" class="db-filter-bar__search-input" style="width:100%; height:40px; opacity:0.7;" id="p-dob" value="${u.dob || ''}" disabled>
                  </div>
                  <div class="db-rental-detail__item" style="background:none; padding:0;">
                    <label class="db-rental-detail__label" style="margin-bottom:4px;">Gender</label>
                    <select class="db-filter-bar__select" style="width:100%; height:40px; opacity:0.7;" id="p-gender" disabled>
                      <option value="">Not provided</option>
                      <option value="Male" ${u.gender==='Male'?'selected':''}>Male</option>
                      <option value="Female" ${u.gender==='Female'?'selected':''}>Female</option>
                      <option value="Other" ${u.gender==='Other'?'selected':''}>Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- TAB 2: LICENSE -->
              <div class="db-tab-content ${activeTab==='license'?'active':''}" id="profile-license" data-tab-group="profile-tabs">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-4);">
                  <h4 style="font-weight:var(--fw-semibold); font-size:var(--fs-small); color:var(--color-dark-text);">Driver Verification License Details</h4>
                  <span class="db-badge db-badge--${licenseBadge}">${licenseBadgeLabel}</span>
                </div>
                <div class="db-rental-detail__grid" style="grid-template-columns: repeat(2, 1fr); gap:var(--space-4);">
                  <div class="db-rental-detail__item" style="background:none; padding:0;">
                    <label class="db-rental-detail__label" style="margin-bottom:4px;">License Number</label>
                    <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px; opacity:0.7;" id="p-lic-num" value="${Utils.escapeHtml(u.licenseNumber || 'Not provided')}" disabled>
                  </div>
                  <div class="db-rental-detail__item" style="background:none; padding:0;">
                    <label class="db-rental-detail__label" style="margin-bottom:4px;">Expiration Date</label>
                    <input type="date" class="db-filter-bar__search-input" style="width:100%; height:40px; opacity:0.7;" id="p-lic-exp" value="${u.licenseExpiry || ''}" disabled>
                  </div>
                  <div class="db-rental-detail__item" style="background:none; padding:0; grid-column: span 2;">
                    <label class="db-rental-detail__label" style="margin-bottom:4px;">Issuing Country / Authority</label>
                    <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px; opacity:0.7;" id="p-lic-auth" value="${Utils.escapeHtml(u.licenseAuthority || 'Not provided')}" disabled>
                  </div>
                </div>
                <p style="margin-top:var(--space-3); font-size:var(--fs-xs); color:var(--color-light-text);">License details are captured from your latest booking. Contact support to update them.</p>
              </div>

              <!-- TAB 3: ADDRESS -->
              <div class="db-tab-content ${activeTab==='address'?'active':''}" id="profile-address" data-tab-group="profile-tabs">
                <div class="db-rental-detail__grid" style="grid-template-columns: repeat(2, 1fr); gap:var(--space-4);">
                  <div class="db-rental-detail__item" style="background:none; padding:0; grid-column: span 2;">
                    <label class="db-rental-detail__label" style="margin-bottom:4px;">Street Address</label>
                    <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px; opacity:0.7;" id="p-address" value="${Utils.escapeHtml(u.streetAddress || 'Not provided')}" disabled>
                  </div>
                  <div class="db-rental-detail__item" style="background:none; padding:0;">
                    <label class="db-rental-detail__label" style="margin-bottom:4px;">City</label>
                    <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px; opacity:0.7;" id="p-city" value="${Utils.escapeHtml(u.city || 'Not provided')}" disabled>
                  </div>
                  <div class="db-rental-detail__item" style="background:none; padding:0;">
                    <label class="db-rental-detail__label" style="margin-bottom:4px;">State / Province</label>
                    <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px; opacity:0.7;" id="p-state" value="${Utils.escapeHtml(u.state || 'Not provided')}" disabled>
                  </div>
                  <div class="db-rental-detail__item" style="background:none; padding:0;">
                    <label class="db-rental-detail__label" style="margin-bottom:4px;">Postal Code</label>
                    <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px; opacity:0.7;" id="p-zip" value="${Utils.escapeHtml(u.postalCode || 'Not provided')}" disabled>
                  </div>
                  <div class="db-rental-detail__item" style="background:none; padding:0;">
                    <label class="db-rental-detail__label" style="margin-bottom:4px;">Country</label>
                    <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px; opacity:0.7;" id="p-country" value="${Utils.escapeHtml(u.country || 'Not provided')}" disabled>
                  </div>
                </div>
                <p style="margin-top:var(--space-3); font-size:var(--fs-xs); color:var(--color-light-text);">Address details are captured from your latest booking. Contact support to update them.</p>
              </div>

              <!-- TAB 4: EMERGENCY -->
              <div class="db-tab-content ${activeTab==='emergency'?'active':''}" id="profile-emergency" data-tab-group="profile-tabs">
                <div class="db-rental-detail__grid" style="grid-template-columns: repeat(2, 1fr); gap:var(--space-4);">
                  <div class="db-rental-detail__item" style="background:none; padding:0;">
                    <label class="db-rental-detail__label" style="margin-bottom:4px;">Contact Name</label>
                    <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px; opacity:0.7;" id="p-em-name" value="${Utils.escapeHtml(u.emergencyName || 'Not provided')}" disabled>
                  </div>
                  <div class="db-rental-detail__item" style="background:none; padding:0;">
                    <label class="db-rental-detail__label" style="margin-bottom:4px;">Relationship</label>
                    <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px; opacity:0.7;" id="p-em-rel" value="${Utils.escapeHtml(u.emergencyRelationship || 'Not provided')}" disabled>
                  </div>
                  <div class="db-rental-detail__item" style="background:none; padding:0; grid-column: span 2;">
                    <label class="db-rental-detail__label" style="margin-bottom:4px;">Phone Number</label>
                    <input type="tel" class="db-filter-bar__search-input" style="width:100%; height:40px; opacity:0.7;" id="p-em-phone" value="${Utils.escapeHtml(u.emergencyPhone || 'Not provided')}" disabled>
                  </div>
                </div>
                <p style="margin-top:var(--space-3); font-size:var(--fs-xs); color:var(--color-light-text);">Emergency contact storage is not available yet. Please keep this information in your booking notes.</p>
              </div>

              <!-- TAB 5: PREFERENCES / SETTINGS -->
              <div class="db-tab-content ${activeTab==='settings'?'active':''}" id="profile-settings" data-tab-group="profile-tabs">
                <div class="db-rental-detail__grid" style="grid-template-columns: 1fr; gap:var(--space-4);">
                  <div class="db-rental-detail__item" style="background:none; padding:0;">
                    <label class="db-rental-detail__label" style="margin-bottom:4px;">Preferred Language</label>
                    <select class="db-filter-bar__select" style="width:100%; height:40px;" id="p-lang">
                      <option value="en" ${u.language==='en'?'selected':''}>English (US)</option>
                      <option value="es" ${u.language==='es'?'selected':''}>Español</option>
                      <option value="fr" ${u.language==='fr'?'selected':''}>Français</option>
                    </select>
                  </div>

                  <div style="margin-top: var(--space-4);">
                    <h5 style="font-weight:var(--fw-semibold); font-size:var(--fs-xs); color:var(--color-dark-text); text-transform:uppercase; margin-bottom:var(--space-3); letter-spacing:0.04em;">Notification Settings</h5>
                    <div style="display:flex; flex-direction:column; gap: var(--space-3);">
                      <label style="display:flex; align-items:center; gap:var(--space-3); font-size:var(--fs-small); cursor:pointer;">
                        <input type="checkbox" id="p-email-alerts" ${u.emailAlerts ? 'checked' : ''} style="width:18px; height:18px; accent-color:var(--color-secondary);">
                        <span>Receive email booking alerts and reminders</span>
                      </label>
                      <label style="display:flex; align-items:center; gap:var(--space-3); font-size:var(--fs-small); cursor:pointer;">
                        <input type="checkbox" id="p-push-alerts" ${u.pushNotifications ? 'checked' : ''} style="width:18px; height:18px; accent-color:var(--color-secondary);">
                        <span>Enable push notification updates in browser</span>
                      </label>
                      <label style="display:flex; align-items:center; gap:var(--space-3); font-size:var(--fs-small); cursor:pointer; opacity:0.5;">
                        <input type="checkbox" disabled style="width:18px; height:18px;">
                        <span>Dark Mode (Placeholder — System Light theme default)</span>
                      </label>
                    </div>
                  </div>

                  <div style="margin-top: var(--space-4); padding-top: var(--space-4); border-top:1px solid var(--color-border-light);">
                    <button type="button" class="btn btn--outline btn--sm" onclick="UserDashboard.toast.show({title:'Password Reset',message:'Verification link has been sent to your email.',type:'success'})">Change Password</button>
                  </div>
                </div>
              </div>

            </div>
            
            <div class="db-section-card__footer" style="justify-content: flex-end; gap: var(--space-3);">
              <button type="button" class="btn btn--outline btn--sm" onclick="UserDashboard.navigateTo('overview')">Cancel</button>
              <button type="submit" class="btn btn--primary btn--sm">${Utils.icon('icon-check','icon--sm')} Save Changes</button>
            </div>
          </form>
        </div>

      </div>
    `;

    // Re-bind click event on tabs since we just generated the HTML
    TabController.init();
  }

  async function saveProfile(e) {
    e.preventDefault();

    const u = DashboardState.userData;
    const fn = document.getElementById('p-firstname');
    const ln = document.getElementById('p-lastname');
    const phone = document.getElementById('p-phone');
    const firstName = fn ? fn.value.trim() : u.firstName;
    const lastName = ln ? ln.value.trim() : u.lastName;
    const phoneValue = phone ? phone.value.trim() : u.phone;

    if (!firstName || !lastName) {
      ToastController.show({ title: 'Missing Name', message: 'First and last name are required.', type: 'error' });
      return;
    }
    if (!phoneValue) {
      ToastController.show({ title: 'Missing Phone', message: 'A phone number is required.', type: 'error' });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      ToastController.show({ title: 'Session Expired', message: 'Please sign in again to update your profile.', type: 'error' });
      return;
    }

    const fullName = `${firstName} ${lastName}`.trim();

    try {
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ fullName, phone: phoneValue })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Profile update failed.');
      }

      u.firstName = firstName;
      u.lastName = lastName;
      u.phone = phoneValue;
      u.initials = ((firstName[0] || '') + (lastName[0] || '')).toUpperCase();

      const lang = document.getElementById('p-lang');
      const emailAlerts = document.getElementById('p-email-alerts');
      const pushAlerts = document.getElementById('p-push-alerts');
      if (lang) u.language = lang.value;
      if (emailAlerts) u.emailAlerts = emailAlerts.checked;
      if (pushAlerts) u.pushNotifications = pushAlerts.checked;
      StorageHelper.set('preferences', {
        language: u.language,
        emailAlerts: u.emailAlerts,
        pushNotifications: u.pushNotifications
      });

      const gr = document.getElementById('db-header-greeting');
      if (gr) gr.textContent = `${Utils.getTimeGreeting()}, ${u.firstName}`;
      document.querySelectorAll('.db-header__profile-name').forEach(el => el.textContent = `${u.firstName}${u.lastName ? ' ' + u.lastName.charAt(0) + '.' : ''}`);
      document.querySelectorAll('.db-header__dropdown-name').forEach(el => el.textContent = `${u.firstName} ${u.lastName}`);
      document.querySelectorAll('.db-sidebar__profile-name').forEach(el => el.textContent = `${u.firstName} ${u.lastName}`);
      document.querySelectorAll('.db-sidebar__profile-avatar, .db-header__profile-avatar').forEach(el => el.textContent = u.initials);

      ToastController.show({
        title: 'Profile Saved',
        message: 'Your name and phone number have been updated.',
        type: 'success'
      });

      RenderProfile(DashboardState.uiState.profileActiveTab);
    } catch (err) {
      ToastController.show({
        title: 'Profile Update Failed',
        message: err.message || 'Could not update your profile. Please try again.',
        type: 'error'
      });
    }
  }


  /* ============================================================
     19. RENDER: PAYMENTS MODULE
     ============================================================ */
  function RenderPayments() {
    const p = DashboardState.paymentsData;
    const transactions = Array.isArray(p.transactions) ? p.transactions : [];
    const totalPaid = transactions
      .filter(t => t.status === 'processed')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const pendingAmount = transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const statusMeta = {
      processed: { label: 'Paid', badge: 'available' },
      pending: { label: 'Pending', badge: 'pending' },
      failed: { label: 'Failed', badge: 'cancelled' }
    };

    DashboardRenderer.contentArea.innerHTML = `
      <div class="db-page-header db-animate-in">
        <div class="db-page-header__left">
          <h2 class="db-page-header__title">Payments & Billings</h2>
          <p class="db-page-header__subtitle">View real payment orders created during checkout</p>
        </div>
      </div>

      ${_renderErrorBanner()}

      <!-- Overview Cards -->
      <div class="db-stats-grid db-animate-stagger" style="grid-template-columns: repeat(3, 1fr); margin-bottom: var(--space-6);">
        ${_statCard('icon-credit-card', 'primary', 'Total Paid', Utils.formatCurrency(totalPaid), 'Successful payment orders')}
        ${_statCard('icon-clock', 'warning', 'Pending Payments', Utils.formatCurrency(pendingAmount), 'Awaiting confirmation')}
        ${_statCard('icon-check-circle', 'success', 'Transactions', String(transactions.length), 'All payment orders')}
      </div>

      <!-- Payment Methods -->
      <div class="db-section-grid" style="grid-template-columns: 2fr 3fr; gap:var(--space-6); align-items: start;">
        
        <!-- Left: Payment Methods -->
        <div class="db-section-card db-animate-in">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Payment Methods</h3>
              <p class="db-section-card__subtitle">Saved cards are not stored by this account</p>
            </div>
          </div>
          <div class="db-section-card__body">
            <div class="db-empty-state" style="padding: var(--space-6) var(--space-3);">
              <div class="db-empty-state__icon">${Utils.icon('icon-credit-card')}</div>
              <h3 class="db-empty-state__title">No Saved Cards</h3>
              <p class="db-empty-state__text">Card details are entered securely at checkout for each booking. No card numbers are stored on your account.</p>
            </div>
          </div>
        </div>

        <!-- Right: Recent Transactions -->
        <div class="db-section-card db-animate-in">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Payment Orders</h3>
              <p class="db-section-card__subtitle">Real payment orders from your checkout sessions</p>
            </div>
          </div>
          <div class="db-section-card__body db-section-card__body--flush">
            <div class="db-table-wrapper" style="margin: 0;">
              <table class="db-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${transactions.length === 0 ? `
                    <tr><td colspan="5" style="text-align:center; padding:var(--space-6); color:var(--color-light-text); font-size:var(--fs-small);">No payment orders found. Complete a booking checkout to create one.</td></tr>
                  ` : transactions.map(t => {
                    const meta = statusMeta[t.status] || { label: Utils.statusLabel(t.status || 'Unknown'), badge: 'pending' };
                    return `<tr>
                      <td><code style="font-family:var(--font-mono); font-size:var(--fs-xs);">${Utils.escapeHtml(t.id)}</code></td>
                      <td style="font-size:var(--fs-xs);">${Utils.formatDateShort(t.date)}</td>
                      <td style="font-size:var(--fs-xs);">${Utils.escapeHtml(t.method || '—')}</td>
                      <td><strong>${Utils.formatCurrency(t.amount)}</strong></td>
                      <td><span class="db-badge db-badge--${meta.badge}">${meta.label}</span></td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }


  /* ============================================================
     20. RENDER: SUPPORT & FAQ Accordion
     ============================================================ */
  function RenderSupport() {
    DashboardRenderer.contentArea.innerHTML = `
      <div class="db-page-header db-animate-in">
        <div class="db-page-header__left">
          <h2 class="db-page-header__title">Help Center & Concierge</h2>
          <p class="db-page-header__subtitle">Search rental guidelines, contact roadside emergency, or submit tickets to client support</p>
        </div>
      </div>

      <!-- Search FAQ box -->
      <div class="db-section-card db-animate-in" style="margin-bottom: var(--space-6); padding: var(--space-4);">
        <div class="db-filter-bar__search" style="max-width: 100%; width: 100%;">
          <input type="text" id="faq-search-input" class="db-filter-bar__search-input" placeholder="Type to search FAQs, rental policies, deposits..." style="width: 100%; height: 48px; border-radius: var(--radius-lg);" oninput="UserDashboard.filterFAQs()">
        </div>
      </div>

      <!-- Quick contact cards grid -->
      <div class="db-support-grid-rebuilt db-animate-in">
        <!-- Emergency Contact -->
        <a href="tel:+15559110000" class="db-support-card-item" style="border-color: rgba(220,38,38,0.25); background: rgba(220,38,38,0.01);">
          <div style="color: var(--color-danger); font-size: 1.75rem; margin-bottom: var(--space-2);">${Utils.icon('icon-alert-triangle')}</div>
          <div style="font-weight: var(--fw-semibold); color: var(--color-danger); font-size: var(--fs-small); margin-bottom: 2px;">Emergency Dispatch</div>
          <div style="font-size: 11px; color: var(--color-light-text);">Call +1 (555) 911-0000</div>
        </a>

        <!-- Phone Support -->
        <a href="tel:+15559002000" class="db-support-card-item">
          <div style="color: var(--color-secondary); font-size: 1.75rem; margin-bottom: var(--space-2);">${Utils.icon('icon-phone')}</div>
          <div style="font-weight: var(--fw-semibold); color: var(--color-dark-text); font-size: var(--fs-small); margin-bottom: 2px;">Phone Concierge</div>
          <div style="font-size: 11px; color: var(--color-light-text);">Call +1 (555) 900-2000</div>
        </a>

        <!-- Email Support -->
        <a href="mailto:concierge@jetcabs.com" class="db-support-card-item">
          <div style="color: var(--color-secondary); font-size: 1.75rem; margin-bottom: var(--space-2);">${Utils.icon('icon-mail')}</div>
          <div style="font-weight: var(--fw-semibold); color: var(--color-dark-text); font-size: var(--fs-small); margin-bottom: 2px;">Email Support</div>
          <div style="font-size: 11px; color: var(--color-light-text);">concierge@jetcabs.com</div>
        </a>

        <!-- Live Chat (Coming Soon) -->
        <div class="db-support-card-item" style="opacity: 0.75; cursor: not-allowed; position: relative;">
          <div style="color: var(--color-light-text); font-size: 1.75rem; margin-bottom: var(--space-2);">${Utils.icon('icon-send')}</div>
          <div style="font-weight: var(--fw-semibold); color: var(--color-dark-text); font-size: var(--fs-small); margin-bottom: 2px;">Live Chat</div>
          <div style="font-size: 11px; color: var(--color-light-text);">Coming Soon</div>
        </div>
      </div>

      <!-- FAQ list -->
      <div class="db-section-card db-animate-in" style="margin-bottom: var(--space-6);">
        <div class="db-section-card__header">
          <div>
            <h3 class="db-section-card__title">Popular Questions & Rental Policies</h3>
            <p class="db-section-card__subtitle">Instant answers to guidelines and membership queries</p>
          </div>
        </div>
        <div class="db-section-card__body db-section-card__body--flush">
          <div class="db-accordion" id="faq-accordion-list">
            
            <div class="db-faq-item">
              <button class="db-faq-trigger" onclick="this.nextElementSibling.classList.toggle('active')">
                <span>What is the minimum age to rent?</span>
                <span>${Utils.icon('icon-chevron-down', 'icon--xs')}</span>
              </button>
              <div class="db-faq-content">
                The minimum age to rent a luxury vehicle is 25. Drivers aged 21-24 are subject to a young driver premium surcharge and limited vehicle options.
              </div>
            </div>

            <div class="db-faq-item">
              <button class="db-faq-trigger" onclick="this.nextElementSibling.classList.toggle('active')">
                <span>What is the fuel return policy?</span>
                <span>${Utils.icon('icon-chevron-down', 'icon--xs')}</span>
              </button>
              <div class="db-faq-content">
                All bookings follow a Full-to-Full fuel policy. The vehicle must be returned with the same fuel level as picked up, or refueling charges will apply.
              </div>
            </div>

            <div class="db-faq-item">
              <button class="db-faq-trigger" onclick="this.nextElementSibling.classList.toggle('active')">
                <span>How do security deposits work?</span>
                <span>${Utils.icon('icon-chevron-down', 'icon--xs')}</span>
              </button>
              <div class="db-faq-content">
                A temporary hold is placed on your credit card at rental pick-up. It is released immediately upon return verification, pending inspection of vehicle conditions.
              </div>
            </div>

            <div class="db-faq-item">
              <button class="db-faq-trigger" onclick="this.nextElementSibling.classList.toggle('active')">
                <span>Can I extend my active rental period?</span>
                <span>${Utils.icon('icon-chevron-down', 'icon--xs')}</span>
              </button>
              <div class="db-faq-content">
                Yes, you can request extensions directly from the Rental Extensions tab. Approvals depend on vehicle availability and slot schedules.
              </div>
            </div>

            <div class="db-faq-item">
              <button class="db-faq-trigger" onclick="this.nextElementSibling.classList.toggle('active')">
                <span>What is the cancellation policy?</span>
                <span>${Utils.icon('icon-chevron-down', 'icon--xs')}</span>
              </button>
              <div class="db-faq-content">
                Cancellations made more than 48 hours before pick-up are fully refunded. Cancellations within 48 hours are subject to a standard cancellation charge.
              </div>
            </div>

            <div class="db-faq-item">
              <button class="db-faq-trigger" onclick="this.nextElementSibling.classList.toggle('active')">
                <span>What insurance coverage is included?</span>
                <span>${Utils.icon('icon-chevron-down', 'icon--xs')}</span>
              </button>
              <div class="db-faq-content">
                All elite rentals include comprehensive collision damage waiver (CDW) and third-party liability coverage. Premium excess reduction is available at check-out.
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Tickets & Submissions -->
      <div class="db-section-grid" style="grid-template-columns: 3fr 2fr; gap: var(--space-6); align-items: start;">
        
        <!-- Report an Issue form -->
        <div class="db-section-card db-animate-in">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Report an Issue / Submit Ticket</h3>
              <p class="db-section-card__subtitle">Describe a vehicle breakdown or billing question</p>
            </div>
          </div>
          <form id="support-ticket-form" onsubmit="UserDashboard.submitSupportTicket(event)">
            <div class="db-section-card__body" style="display:flex; flex-direction:column; gap: var(--space-4);">
              <div>
                <label class="db-rental-detail__label" style="margin-bottom:4px;">Ticket Subject</label>
                <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="tkt-subj" placeholder="Brief summary of issue..." required>
              </div>
              
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-4);">
                <div>
                  <label class="db-rental-detail__label" style="margin-bottom:4px;">Category</label>
                  <select class="db-filter-bar__select" style="width:100%; height:40px;" id="tkt-cat">
                    <option value="billing">Billing & Refunds</option>
                    <option value="rentals">Active Rentals</option>
                    <option value="technical">App Support</option>
                    <option value="other">General Questions</option>
                  </select>
                </div>
                <div>
                  <label class="db-rental-detail__label" style="margin-bottom:4px;">Priority</label>
                  <select class="db-filter-bar__select" style="width:100%; height:40px;" id="tkt-priority">
                    <option value="low">Low</option>
                    <option value="medium" selected>Medium</option>
                    <option value="high">High / Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="db-rental-detail__label" style="margin-bottom:4px;">Detailed Message</label>
                <textarea class="db-filter-bar__search-input" style="width:100%; height:120px; padding:var(--space-3); resize:none;" id="tkt-msg" placeholder="Describe the issue in detail..." required></textarea>
              </div>
            </div>
            <div class="db-section-card__footer">
              <span></span>
              <button type="submit" class="btn btn--primary btn--sm">${Utils.icon('icon-send','icon--sm')} Submit Ticket</button>
            </div>
          </form>
        </div>

        <!-- Recent Support Tickets -->
        <div class="db-section-card db-animate-in">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Recent Support Tickets</h3>
              <p class="db-section-card__subtitle">Concierge logs & open queries</p>
            </div>
          </div>
          <div class="db-section-card__body db-section-card__body--flush" id="support-tickets-history-container">
            ${DashboardState.supportTicketsData.length === 0 ? `
              <div style="padding:var(--space-4); text-align:center; color:var(--color-light-text); font-size:var(--fs-xs);">No tickets submitted yet.</div>
            ` : DashboardState.supportTicketsData.map(t => `
              <div style="padding:var(--space-4); border-bottom:1px solid var(--color-border-light); display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-weight:var(--fw-semibold); color:var(--color-dark-text); font-size:var(--fs-xs);">${Utils.escapeHtml(t.subject)}</div>
                  <div style="font-size:10px; color:var(--color-light-text); margin-top:2px;">ID: ${t.id} · Created: ${Utils.formatDate(t.createdOn)}</div>
                </div>
                <div style="display:flex; align-items:center; gap:var(--space-2); flex-shrink:0;">
                  <span class="db-badge db-badge--${t.status === 'resolved' ? 'available' : 'pending'}">${t.status}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;
  }

  function submitSupportTicket(e) {
    e.preventDefault();

    const subject = document.getElementById('tkt-subj').value;
    const category = document.getElementById('tkt-cat').value;
    const priority = document.getElementById('tkt-priority').value;
    const msg = document.getElementById('tkt-msg').value;

    const token = localStorage.getItem('token');
    if (!token) {
      ToastController.show({ title: 'Login Required', message: 'Please log in to submit a ticket.', type: 'error' });
      return;
    }

    fetch('http://localhost:5000/api/support/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        category: 'Support',
        subject: subject,
        message: `[${category} / ${priority}] ${msg}`
      })
    })
      .then(res => res.json())
      .then(json => {
        if (!json.success) {
          ToastController.show({ title: 'Submission Failed', message: json.message || 'Could not submit the ticket.', type: 'error' });
          return;
        }
        const t = json.data;
        const newTicket = {
          id: String(t._id).slice(-8).toUpperCase(),
          subject: t.subject,
          category: t.category,
          priority: priority,
          status: 'open',
          createdOn: new Date(t.createdAt).toISOString().split('T')[0],
          message: t.message,
        };
        DashboardState.supportTicketsData.unshift(newTicket);
        ToastController.show({
          title: 'Ticket Submitted',
          message: `Support ticket ${newTicket.id} was created successfully.`,
          type: 'success'
        });
        RenderSupport();
      })
      .catch(err => {
        console.error('Failed to submit ticket:', err);
        ToastController.show({ title: 'Submission Failed', message: 'Network error while submitting the ticket.', type: 'error' });
      });
  }

  function filterFAQs() {
    const q = document.getElementById('faq-search-input').value.toLowerCase().trim();
    const items = document.querySelectorAll('.db-faq-item');
    items.forEach(item => {
      const trigger = item.querySelector('.db-faq-trigger').textContent.toLowerCase();
      const content = item.querySelector('.db-faq-content').textContent.toLowerCase();
      if (trigger.includes(q) || content.includes(q)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  }

  function cancelPreBooking(reference) {
    const pb = DashboardState.preBookingsData.find(x => x.reference === reference);
    if (!pb) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`http://localhost:5000/api/bookings/${pb.id}/cancel`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(json => {
        if (!json.success) {
          ToastController.show({ title: 'Cancellation Failed', message: json.message || 'Could not cancel the pre-booking.', type: 'error' });
          return;
        }
        pb.status = 'expired';
        ToastController.show({
          title: 'Request Cancelled',
          message: `Your pre-booking request for ${pb.vehicleName} has been cancelled.`,
          type: 'warning'
        });
        RenderPreBookings();
      })
      .catch(err => {
        console.error('Failed to cancel pre-booking:', err);
        ToastController.show({ title: 'Cancellation Failed', message: 'Network error while cancelling.', type: 'error' });
      });
  }

  async function acceptAlternative(reference) {
    const pb = DashboardState.preBookingsData.find(x => x.reference === reference);
    if (!pb) return;

    const altCarId = pb.alternatives && pb.alternatives.suggestions && pb.alternatives.suggestions[0]
      ? pb.alternatives.suggestions[0].vehicles[0] && pb.alternatives.suggestions[0].vehicles[0].id
      : null;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/bookings/${pb.id}/accept-alternative`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ carId: altCarId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not accept the alternative vehicle.');
      ToastController.show({
        title: 'Alternative Approved',
        message: `You have accepted the alternative vehicle suggestion.`,
        type: 'success'
      });
      DashboardState.notificationData.unshift({
        id: 'N-' + Date.now(),
        type: 'success',
        category: 'Bookings',
        title: 'Alternative Confirmed',
        text: `Alternative vehicle suggestion for request ${reference} has been accepted.`,
        time: 'Just now',
        read: false,
        priority: 'High'
      });
      pb.status = 'approved';
      delete pb.alternatives;
      RenderPreBookings();
      DropdownController.updateNotificationBadge();
    } catch (err) {
      ToastController.show({
        title: 'Offer Not Accepted',
        message: err.message,
        type: 'error'
      });
    }
  }

  function openFeedbackModal(rentalId) {
    const r = DashboardState.rentalsData.find(x => x.id === rentalId);
    if (!r) return;

    const content = `
      <div class="db-modal__header">
        <h3 class="db-modal__title">Rate Your Rental Experience</h3>
        <button class="db-modal__close" data-action="close-modal" aria-label="Close">${Utils.icon('icon-close')}</button>
      </div>
      <form onsubmit="UserDashboard.submitFeedback(event, '${rentalId}')">
        <div class="db-modal__body" style="padding-top:0;">
          <div style="display:flex; gap:var(--space-4); margin-bottom:var(--space-4); align-items:center;">
            <img src="${r.image}" alt="${r.brand}" style="width: 80px; height: 50px; object-fit:cover; border-radius:var(--radius-md); background:var(--color-surface);">
            <div>
              <h4 style="font-weight:var(--fw-semibold); color:var(--color-dark-text); font-family:var(--font-heading);">${r.brand} ${r.model}</h4>
              <p style="font-size:var(--fs-xs); color:var(--color-light-text);">Booking Reference: ${r.bookingId}</p>
            </div>
          </div>
          
          <div style="margin-bottom:var(--space-4);">
            <label class="db-rental-detail__label" style="margin-bottom: 6px;">Your Rating</label>
            <div style="display:flex; gap:var(--space-2); font-size:1.5rem; color:var(--color-secondary); cursor:pointer;" id="rating-stars-container">
              ${[1, 2, 3, 4, 5].map(i => `
                <span class="star-rating-item" data-val="${i}" onclick="document.getElementById('feedback-rating-val').value=${i}; UserDashboard.highlightStars(${i});">★</span>
              `).join('')}
            </div>
            <input type="hidden" id="feedback-rating-val" value="5">
          </div>

          <div>
            <label class="db-rental-detail__label" style="margin-bottom: 4px;">Share your experience</label>
            <textarea class="db-filter-bar__search-input" id="feedback-text" style="width:100%; height:90px; padding:var(--space-3); resize:none;" placeholder="Tell us about the vehicle performance, cleanliness, and pick-up process..." required></textarea>
          </div>
        </div>
        <div class="db-modal__footer">
          <button type="button" class="btn btn--outline btn--sm" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn btn--primary btn--sm">Submit Review</button>
        </div>
      </form>
    `;
    ModalController.openDynamic(content, '480px');
    highlightStars(5);
  }

  function highlightStars(val) {
    const stars = document.querySelectorAll('.star-rating-item');
    stars.forEach((s, idx) => {
      if (idx < val) {
        s.style.color = 'var(--color-secondary)';
      } else {
        s.style.color = 'var(--color-border-light)';
      }
    });
  }

  function submitFeedback(e, rentalId) {
    e.preventDefault();
    const rating = document.getElementById('feedback-rating-val').value;
    const text = document.getElementById('feedback-text').value;
    ModalController.close();

    const token = localStorage.getItem('token');
    if (!token) {
      ToastController.show({ title: 'Feedback Submitted', message: `Thank you for rating your rental! We received your ${rating}-star review.`, type: 'success' });
      return;
    }

    fetch('http://localhost:5000/api/support/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        category: 'Feedback',
        subject: `Rental Feedback (${rating}-star)`,
        message: text
      })
    })
      .then(res => res.json())
      .then(json => {
        ToastController.show({
          title: json.success ? 'Feedback Submitted' : 'Submission Failed',
          message: json.success
            ? `Thank you for rating your rental! We received your ${rating}-star review.`
            : (json.message || 'Could not submit feedback.'),
          type: json.success ? 'success' : 'error'
        });
      })
      .catch(err => {
        console.error('Failed to submit feedback:', err);
        ToastController.show({ title: 'Submission Failed', message: 'Network error while submitting feedback.', type: 'error' });
      });
  }


  /* ============================================================
     21. INITIALIZATION
     ============================================================ */
  async function init() {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }

    DashboardState.dataError = '';
    DashboardState.rentalsData = [];
    DashboardState.preBookingsData = [];
    DashboardState.notificationData = [];
    DashboardState.extensionsData = [];
    DashboardState.extensionHistory = [];
    DashboardState.verificationData = null;
    DashboardState.kycData = null;
    DashboardState.paymentsData = { methods: [], transactions: [] };
    DashboardState.statsData = {
      activeRentals: 0,
      pendingPreBookings: 0,
      upcomingReturns: 0,
      completedRentals: 0,
      extensionRequests: 0,
      unreadNotifications: 0,
      totalRentals: 0
    };

    const loadingTarget = document.getElementById('dashboard-content');
    if (loadingTarget) {
      loadingTarget.innerHTML = `<div class="db-empty-state" style="min-height: 55vh;">
        <div class="db-empty-state__icon">${Utils.icon('icon-car')}</div>
        <h3 class="db-empty-state__title">Loading your dashboard</h3>
        <p class="db-empty-state__text">Fetching your real profile, rentals, KYC, and payment records...</p>
      </div>`;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }

      const nameParts = String(data.data.fullName || '').trim().split(/\s+/);
      const u = DashboardState.userData;
      u.id = data.data._id || '';
      u.firstName = nameParts[0] || '';
      u.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      u.email = data.data.email || '';
      u.phone = data.data.phone || '';
      u.memberSince = data.data.createdAt || '';
      u.kycStatus = 'NOT_SUBMITTED';
      u.initials = ((u.firstName[0] || '') + (u.lastName[0] || '')).toUpperCase();

      const prefs = StorageHelper.get('preferences');
      if (prefs) {
        u.language = prefs.language || 'en';
        u.emailAlerts = prefs.emailAlerts !== false;
        u.pushNotifications = !!prefs.pushNotifications;
      }
      
      // Update the global UI with dynamic data
      document.querySelectorAll('.db-sidebar__profile-name').forEach(el => el.textContent = u.firstName + ' ' + u.lastName);
      document.querySelectorAll('.db-header__profile-name').forEach(el => el.textContent = u.firstName + ' ' + (u.lastName ? u.lastName.charAt(0) + '.' : ''));
      document.querySelectorAll('.db-sidebar__profile-role, .db-header__profile-role').forEach(el => {
        el.textContent = u.membership ? `${Utils.escapeHtml(u.membership)} Member` : 'Customer Account';
      });
      document.querySelectorAll('.db-header__dropdown-name').forEach(el => el.textContent = u.firstName + ' ' + u.lastName);
      document.querySelectorAll('.db-sidebar__profile-avatar, .db-header__profile-avatar').forEach(el => el.textContent = u.initials);
      
      const gr = document.getElementById('db-header-greeting');
      if (gr && typeof Utils !== 'undefined' && Utils.getTimeGreeting) {
        gr.textContent = `${Utils.getTimeGreeting()}, ${u.firstName}`;
      } else if (gr) {
        gr.textContent = `Welcome back, ${u.firstName}`;
      }
      
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      window.location.href = 'login.html';
      return;
    }

    // Fetch User Bookings
    try {
      const bookingsRes = await fetch('http://localhost:5000/api/bookings/my-bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const bookingsData = await bookingsRes.json();
      if (bookingsData.success) {
        DashboardState.rentalsData = [];
        DashboardState.preBookingsData = [];
        DashboardState.notificationData = [];
        DashboardState.extensionsData = [];
        DashboardState.extensionHistory = [];
        
        bookingsData.data.forEach(b => {
          const car = b.car || {};
          const details = b.rentalDetails || {};
          const carBrand = car.brand || 'Unknown';
          const carNameRaw = car.carName || 'Unknown';
          const carModel = (carNameRaw.startsWith(carBrand) ? carNameRaw.slice(carBrand.length) : carNameRaw).trim();
          const pickupRaw = details.pickupDateTime;
          const returnRaw = details.returnDateTime;
          const pickupDate = pickupRaw ? String(pickupRaw).split('T')[0] : '';
          const returnDate = returnRaw ? String(returnRaw).split('T')[0] : '';
          const pickupTime = pickupRaw ? new Date(pickupRaw).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
          const returnTime = returnRaw ? new Date(returnRaw).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
          const isHourly = details.rentalType === 'hourly';
          const pickupDt = pickupRaw ? new Date(pickupRaw) : null;
          const returnDt = returnRaw ? new Date(returnRaw) : null;
          const diffHours = pickupDt && returnDt ? Math.max(1, Math.ceil((returnDt - pickupDt) / 3600000)) : 1;
          const totalDays = isHourly ? diffHours : Math.max(1, Math.ceil(diffHours / 24));
          const createdDate = b.createdAt ? new Date(b.createdAt) : null;
          const pickedDate = b.rentalStartTime ? new Date(b.rentalStartTime) : pickupDt;
          const returnedDate = b.rentalEndTime ? new Date(b.rentalEndTime) : returnDt;
          const timeline = [];
          if (createdDate && !Number.isNaN(createdDate.getTime())) {
            timeline.push({ date: createdDate.toISOString().split('T')[0], time: createdDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), event: 'Booking Created', type: 'info' });
          }
          if (b.bookingStatus === 'Pending Pickup') {
            timeline.push({ date: pickupDate, time: pickupTime, event: 'Scheduled Pickup', type: 'pending' });
          } else if (b.bookingStatus === 'Active' || b.bookingStatus === 'Extended') {
            if (pickedDate && !Number.isNaN(pickedDate.getTime())) {
              timeline.push({ date: pickedDate.toISOString().split('T')[0], time: pickedDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), event: 'Vehicle Picked Up', type: 'success' });
            }
            timeline.push({ date: returnDate, time: returnTime, event: 'Scheduled Return', type: 'pending' });
          } else if (b.bookingStatus === 'Completed') {
            if (pickedDate && !Number.isNaN(pickedDate.getTime())) {
              timeline.push({ date: pickedDate.toISOString().split('T')[0], time: pickedDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), event: 'Vehicle Picked Up', type: 'success' });
            }
            if (returnedDate && !Number.isNaN(returnedDate.getTime())) {
              timeline.push({ date: returnedDate.toISOString().split('T')[0], time: returnedDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), event: 'Vehicle Returned', type: 'success' });
            }
            timeline.push({ date: returnDate, time: returnTime, event: 'Rental Completed', type: 'success' });
          } else if (b.bookingStatus === 'Cancelled') {
            const cancelledDate = b.updatedAt ? new Date(b.updatedAt) : createdDate;
            if (cancelledDate && !Number.isNaN(cancelledDate.getTime())) {
              timeline.push({ date: cancelledDate.toISOString().split('T')[0], time: cancelledDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), event: 'Booking Cancelled', type: 'danger' });
            }
          }

          const uiBooking = {
            id: b._id,
            bookingId: b._id.substring(b._id.length - 8).toUpperCase(),
            brand: carBrand,
            model: carModel,
            category: car.category || 'Luxury',
            image: car.images && car.images.length > 0 ? car.images[0].url : 'assets/images/cars/luxury.png',
            rentalType: isHourly ? 'Hourly' : 'Daily',
            pickupDate,
            pickupTime,
            pickupLocation: details.pickupLocation || '',
            returnDate,
            returnTime,
            returnLocation: details.returnLocation || '',
            status: b.bookingStatus === 'Pending Pickup' ? 'upcoming' :
                    b.bookingStatus === 'Active' ? 'active' :
                    b.bookingStatus === 'Extended' ? 'active' :
                    b.bookingStatus === 'Completed' ? 'completed' : 'cancelled',
            dailyRate: isHourly ? (car.hourlyPrice || 0) : (car.dailyPrice || 0),
            totalCost: Number(b.totalAmount) || 0,
            totalDays,
            pricing: b.estimatedPricing || null,
            paymentStatus: b.paymentStatus || '',
            pickupPhotoUrl: b.pickupPhoto && b.pickupPhoto.url ? b.pickupPhoto.url : '',
            returnPhotoUrl: b.returnPhoto && b.returnPhoto.url ? b.returnPhoto.url : '',
            customerDetails: b.customerDetails || null,
            createdAt: b.createdAt || '',
            specifications: {
              transmission: car.transmission || '',
              fuel: car.fuelType || '',
              seats: car.seatingCapacity || ''
            },
            timeline
          };

          if (b.bookingStatus === 'Pending Pickup' && b.bookingType === 'PRE_BOOKING') {
            const serverStatus = b.preBookingStatus || 'Pending';
            const statusKey = serverStatus === 'Pending' ? 'pending'
              : serverStatus === 'Approved' ? 'approved'
              : serverStatus === 'Alternative Accepted' ? 'approved'
              : serverStatus === 'Rejected' ? 'rejected'
              : serverStatus === 'Expired' ? 'expired'
              : 'alternative';

            const item = {
              id: b._id,
              reference: 'PRE-' + b._id.substring(b._id.length - 8).toUpperCase(),
              vehicleName: uiBooking.brand + ' ' + uiBooking.model,
              vehicleCategory: uiBooking.category,
              vehicleImage: uiBooking.image,
              requestedDates: `${uiBooking.pickupDate} – ${uiBooking.returnDate}`,
              pickupDate: uiBooking.pickupDate,
              returnDate: uiBooking.returnDate,
              pickupLocation: uiBooking.pickupLocation,
              status: statusKey,
              requestedOn: b.createdAt ? String(b.createdAt).split('T')[0] : '',
              estimatedCost: uiBooking.totalCost,
              notes: details.specialRequests || ''
            };

            if (statusKey === 'alternative' && b.suggestedAlternative) {
              const altCar = b.suggestedAlternative.car;
              const altName = altCar ? `${altCar.brand || ''} ${altCar.carName || 'Vehicle'}`.trim() : 'Recommended Vehicle';
              const altImage = altCar && altCar.images && altCar.images.length > 0 ? altCar.images[0].url : 'assets/images/cars/luxury.png';
              const dailyRate = altCar ? altCar.dailyPrice : 0;
              const specs = altCar
                ? `${altCar.seatingCapacity || '?'} Seats · ${altCar.fuelType || '?'} · ${altCar.transmission || '?'}`
                : 'Equivalent class vehicle';
              item.alternatives = {
                reason: b.suggestedAlternative.message || 'Your requested vehicle is currently unavailable.',
                suggestions: [{
                  vehicles: [{
                    id: altCar ? altCar._id : null,
                    name: altName,
                    price: dailyRate,
                    specs,
                    image: altImage
                  }]
                }]
              };
            }

            DashboardState.preBookingsData.push(item);
          } else {
            DashboardState.rentalsData.push(uiBooking);
          }
        });

        // Hydrate profile fields from the latest booking's real customer details.
        // The User model does not store DOB/address/license yet, so these stay
        // read-only in the profile UI instead of being fabricated.
        const latestWithDetails = bookingsData.data
          .filter(b => b.customerDetails)
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
        if (latestWithDetails) {
          const cd = latestWithDetails.customerDetails;
          const ud = DashboardState.userData;
          ud.dob = cd.dob || ud.dob;
          ud.streetAddress = cd.address || ud.streetAddress;
          ud.city = cd.city || ud.city;
          ud.state = cd.state || ud.state;
          ud.postalCode = cd.postal || ud.postalCode;
          ud.country = cd.country || ud.country;
          ud.licenseNumber = cd.license || ud.licenseNumber;
          ud.licenseExpiry = cd.licenseExpiry || ud.licenseExpiry;
          ud.licenseCountry = cd.licenseCountry || ud.licenseCountry;
          ud.licenseAuthority = cd.licenseCountry || ud.licenseAuthority;
          ud.licenseStatus = cd.license ? 'on file' : 'missing';
        }
        
        // Generate notifications based on actual bookings
        bookingsData.data.forEach((b, index) => {
          let type, category, title, text, read;
          if (b.bookingStatus === 'Pending Pickup') {
            type = 'info'; category = 'Booking'; title = 'Booking Confirmed'; 
            text = `Your booking for ${b.car ? b.car.brand + ' ' + b.car.carName : 'Vehicle'} is confirmed.`;
            read = false;
          } else if (b.bookingStatus === 'Active' || b.bookingStatus === 'Extended') {
            type = 'success'; category = 'Rental'; title = 'Rental Started'; 
            text = `You have picked up the ${b.car ? b.car.brand + ' ' + b.car.carName : 'Vehicle'}.`;
            read = true;
          } else if (b.bookingStatus === 'Completed') {
            type = 'success'; category = 'Rental'; title = 'Rental Completed'; 
            text = `Thank you for returning the ${b.car ? b.car.brand + ' ' + b.car.carName : 'Vehicle'}.`;
            read = true;
          } else {
            type = 'danger'; category = 'Booking'; title = 'Booking Cancelled'; 
            text = `Your booking for ${b.car ? b.car.brand + ' ' + b.car.carName : 'Vehicle'} was cancelled.`;
            read = true;
          }
          
          DashboardState.notificationData.push({
            id: 'N-' + b._id.substring(b._id.length - 4),
            type, category, title, text,
            time: Utils.formatDateShort(b.updatedAt || b.createdAt),
            read, priority: 'normal'
          });
          
          // Populate eligible extensions for active rentals
          if (b.bookingStatus === 'Active' || b.bookingStatus === 'Extended') {
            const today = new Date();
            const returnDate = new Date(b.rentalDetails.returnDateTime);
            const remainingDays = Math.ceil((returnDate - today) / (1000 * 60 * 60 * 24));
            const pendingExt = (b.extensionHistory || []).find(e => e.status === 'pending');

            const extEntry = {
              id: 'EXT-' + b._id.substring(b._id.length - 4),
              rentalId: b._id,
              brand: b.car ? b.car.brand : 'Unknown',
              model: b.car ? b.car.carName : 'Unknown',
              image: b.car && b.car.images && b.car.images.length > 0 ? b.car.images[0].url : 'assets/images/cars/luxury.png',
              currentReturnDate: returnDate.toISOString().split('T')[0],
              remainingDays: remainingDays > 0 ? remainingDays : 0,
              dailyRate: b.car ? (b.rentalDetails.rentalType === 'hourly' ? b.car.hourlyPrice : b.car.dailyPrice) : 0,
              status: pendingExt ? 'pending' : 'eligible',
            };
            if (pendingExt) {
              const isHourly = b.rentalDetails.rentalType === 'hourly';
              extEntry.additionalTime = (isHourly ? pendingExt.additionalHours : pendingExt.additionalHours / 24) + (isHourly ? ' Hours' : ' Days');
              extEntry.estimatedCost = pendingExt.additionalAmount;
              extEntry.updatedReturnDate = new Date(returnDate.getTime() + pendingExt.additionalHours * 3600000).toISOString().split('T')[0];
              extEntry.reason = 'Awaiting admin review';
            }
            DashboardState.extensionsData.push(extEntry);
          }
          
          // Populate extension history
          if (b.extensionHistory && b.extensionHistory.length > 0) {
            b.extensionHistory.forEach((ext, i) => {
              const extDuration = b.rentalDetails.rentalType === 'hourly'
                ? ext.additionalHours + ' Hours'
                : (ext.additionalHours / 24) + ' Days';
              DashboardState.extensionHistory.push({
                id: 'EXTH-' + b._id.substring(b._id.length - 4) + '-' + i,
                bookingId: b._id.substring(b._id.length - 8).toUpperCase(),
                brand: b.car ? b.car.brand : 'Unknown',
                model: b.car ? b.car.carName : 'Unknown',
                image: b.car && b.car.images && b.car.images.length > 0 ? b.car.images[0].url : 'assets/images/cars/luxury.png',
                type: b.rentalDetails.rentalType === 'hourly' ? 'Hourly' : 'Daily',
                duration: extDuration,
                originalReturn: Utils.formatDateShort(b.rentalDetails.returnDateTime), 
                newReturn: Utils.formatDateShort(b.rentalDetails.returnDateTime),
                estimatedCost: ext.additionalAmount,
                status: ext.status === 'approved' ? 'approved' : ext.status === 'rejected' ? 'rejected' : 'pending',
                reason: ext.rejectionReason || ''
              });
            });
          }
        });

        // Compute stats from real records only. Upcoming bookings are not
        // active rentals, and extension requests only count pending ones.
        DashboardState.statsData = {
          activeRentals: DashboardState.rentalsData.filter(r => r.status === 'active').length,
          pendingPreBookings: DashboardState.preBookingsData.filter(p => p.status === 'pending').length,
          upcomingReturns: DashboardState.rentalsData.filter(r => r.status === 'active').length,
          completedRentals: DashboardState.rentalsData.filter(r => r.status === 'completed').length,
          extensionRequests: DashboardState.extensionsData.filter(e => e.status === 'pending').length,
          unreadNotifications: DashboardState.notificationData.filter(n => !n.read).length,
          totalRentals: DashboardState.rentalsData.length + DashboardState.preBookingsData.length,
        };

      } else {
        DashboardState.dataError = bookingsData.message || 'Could not load your booking records.';
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      DashboardState.dataError = 'Could not load your booking records. Please retry.';
    }

    // Load support tickets from the backend
    try {
      const ticketsRes = await fetch('http://localhost:5000/api/support/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ticketsJson = await ticketsRes.json();
      if (ticketsJson.success) {
        DashboardState.supportTicketsData = ticketsJson.data.map(t => ({
          id: String(t._id).slice(-8).toUpperCase(),
          subject: t.subject,
          category: t.category,
          priority: 'medium',
          status: t.status === 'Resolved' ? 'resolved' : 'open',
          createdOn: new Date(t.createdAt).toISOString().split('T')[0],
          message: t.message
        }));
      }
    } catch (err) {
      console.error('Failed to fetch support tickets:', err);
    }

    // Load real KYC verification details from the backend
    try {
      const kycRes = await fetch('http://localhost:5000/api/kyc/mine', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const kycJson = await kycRes.json();
      if (kycJson.success) {
        DashboardState.kycData = kycJson.data;
        const kycStatus = kycJson.data.status || 'NOT_SUBMITTED';
        DashboardState.userData.kycStatus = kycStatus;
        DashboardState.userData.verified = kycStatus === 'VERIFIED';
      }
    } catch (err) {
      console.error('Failed to fetch KYC status:', err);
    }

    // Load real payment orders from the backend
    try {
      const payRes = await fetch('http://localhost:5000/api/payments/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const payJson = await payRes.json();
      if (payJson.success && Array.isArray(payJson.data)) {
        const p = DashboardState.paymentsData;
        p.transactions = payJson.data.map(order => ({
          id: order.orderId || String(order._id || ''),
          date: order.createdAt || '',
          method: order.method ? order.method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—',
          amount: Number(order.amount) || 0,
          status: order.status === 'SUCCESS' ? 'processed' : order.status === 'FAILED' ? 'failed' : 'pending'
        }));
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    }

    restoreUiState();
    SidebarController.init();
    HeaderController.init();
    DropdownController.init();
    ModalController.init();
    TabController.init();
    DashboardRenderer.init();
    DropdownController.updateNotificationBadge();

    // Load real notifications from the backend (booking-derived list acts as
    // fallback until the server responds)
    if (token) {
      fetchNotifications(token).then(ok => {
        DropdownController.updateNotificationBadge();
        DropdownController.renderNotifications(document.getElementById('db-notification-panel'));
        if (DashboardState.uiState.currentModule === 'overview') {
          RenderOverview();
        }
      });
    }

    const startModule = DashboardState.uiState.currentModule || 'overview';
    DashboardRenderer.navigate(startModule);
  }

  /* ============================================================
     NEW UI WORKFLOW MODALS (Pickup & Return)
     ============================================================ */
  function openPickupModal(rentalId) {
    const r = DashboardState.rentalsData.find(x => x.id === rentalId);
    if (!r) return;
    
    document.getElementById('db-photo-upload-car-details').innerHTML = `<h4 style="font-weight: 600;">${r.brand} ${r.model}</h4><p style="font-size: 14px; color: var(--color-light-text);">Pickup Photo Upload</p>`;
    document.getElementById('db-photo-upload-warning').textContent = "Rental will start only after uploading the pickup photo.";
    
    const submitBtn = document.getElementById('db-photo-upload-submit-btn');
    submitBtn.onclick = () => submitPickupPhoto(rentalId);
    submitBtn.disabled = true;
    
    _resetPhotoUploadArea();
    ModalController.open('db-photo-upload-modal');
  }

  async function submitPickupPhoto(rentalId) {
    const fileInput = document.getElementById('db-photo-upload-input');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      alert('Please select a file to upload.');
      return;
    }

    const submitBtn = document.getElementById('db-photo-upload-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';

    const formData = new FormData();
    formData.append('pickupPhoto', fileInput.files[0]);

    try {
      if (rentalId.startsWith('RNT-')) {
        await new Promise(r => setTimeout(r, 800));
        ToastController.show({title: 'Photo Uploaded', message: 'Pickup photo uploaded successfully. Rental timer started.', type: 'success'});
        ModalController.close();
        DashboardRenderer.navigate('overview');
        return;
      }

      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/bookings/${rentalId}/pickup-photo`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      
      ToastController.show({title: 'Photo Uploaded', message: 'Pickup photo uploaded successfully. Rental timer started.', type: 'success'});
      ModalController.close();
      DashboardRenderer.navigate('overview');
      if (typeof init === 'function') init(); // Reload data
    } catch (err) {
      alert('Upload Error: ' + err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Upload & Confirm Pickup';
    }
  }

  function openReturnModal(rentalId) {
    const r = DashboardState.rentalsData.find(x => x.id === rentalId);
    if (!r) return;

    document.getElementById('db-photo-upload-car-details').innerHTML = `<h4 style="font-weight: 600;">${r.brand} ${r.model}</h4><p style="font-size: 14px; color: var(--color-light-text);">Return Photo Upload</p>`;
    document.getElementById('db-photo-upload-warning').textContent = "Rental will end after uploading the return photo.";
    
    const submitBtn = document.getElementById('db-photo-upload-submit-btn');
    submitBtn.onclick = () => submitReturnPhoto(rentalId);
    submitBtn.disabled = true;
    
    _resetPhotoUploadArea();
    ModalController.open('db-photo-upload-modal');
  }

  async function submitReturnPhoto(rentalId) {
    const fileInput = document.getElementById('db-photo-upload-input');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      alert('Please select a file to upload.');
      return;
    }

    const submitBtn = document.getElementById('db-photo-upload-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';

    const formData = new FormData();
    formData.append('returnPhoto', fileInput.files[0]);

    try {
      if (rentalId.startsWith('RNT-')) {
        await new Promise(r => setTimeout(r, 800));
        ToastController.show({title: 'Photo Uploaded', message: 'Return photo uploaded successfully. Rental completed.', type: 'success'});
        ModalController.close();
        DashboardRenderer.navigate('overview');
        return;
      }

      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/bookings/${rentalId}/return-photo`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      
      ToastController.show({title: 'Photo Uploaded', message: 'Return photo uploaded successfully. Rental completed.', type: 'success'});
      ModalController.close();
      DashboardRenderer.navigate('overview');
      if (typeof init === 'function') init(); // Reload data
    } catch (err) {
      alert('Upload Error: ' + err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Upload & Confirm Return';
    }
  }

  function _resetPhotoUploadArea() {
    const preview = document.getElementById('db-photo-upload-preview');
    const placeholder = document.getElementById('db-photo-upload-placeholder');
    const removeBtnCtn = document.getElementById('db-photo-upload-remove-container');
    const fileInput = document.getElementById('db-photo-upload-input');
    const submitBtn = document.getElementById('db-photo-upload-submit-btn');
    
    preview.style.display = 'none';
    preview.src = '';
    placeholder.style.display = 'block';
    removeBtnCtn.style.display = 'none';
    fileInput.value = '';
    submitBtn.disabled = true;

    fileInput.onchange = function(e) {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          preview.src = evt.target.result;
          preview.style.display = 'block';
          placeholder.style.display = 'none';
          removeBtnCtn.style.display = 'block';
          submitBtn.disabled = false;
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    };

    document.getElementById('db-photo-upload-remove-btn').onclick = function() {
      _resetPhotoUploadArea();
    };
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
  /* ============================================================
     22. PUBLIC API
     ============================================================ */
  return {
    init,
    state: DashboardState,
    utils: Utils,
    storage: StorageHelper,
    sidebar: SidebarController,
    header: HeaderController,
    dropdown: DropdownController,
    modal: ModalController,
    toast: ToastController,
    tabs: TabController,
    renderer: DashboardRenderer,
    navigateTo(moduleName) { DashboardRenderer.navigate(moduleName); },
    showRentalDetails,
    showRejectionReason,
    openExtensionModal,
    updateExtensionCost,
    submitExtensionRequest,
    handleImageUpload,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    saveProfile,
    submitSupportTicket,
    filterFAQs,
    cancelPreBooking,
    acceptAlternative,
    openFeedbackModal,
    highlightStars,
    submitFeedback,
    openPickupModal,
    submitPickupPhoto,
    openReturnModal,
    submitReturnPhoto
  };

})();
