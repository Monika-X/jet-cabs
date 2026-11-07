/* ============================================================
   JET CABS — ADMIN DASHBOARD JS
   Phase 6: Bookings & Alternative Vehicle Suggestions
   Standard Bookings tab, Pre-Bookings tab, smart SVG timelines,
   KYC status checks, and 4-step Alternative Suggestion wizard.
   ============================================================ */

'use strict';

const AdminDashboard = (() => {

  /* ============================================================
     1. ADMIN DUMMY DATA ARCHITECTURE
     ============================================================ */
    const AdminState = {
    adminData: {
      id: 'ADM-001',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@jetcabs.com',
      phone: '',
      avatar: null,
      initials: 'AD',
      role: 'Super Admin',
      department: 'Operations',
    },
    fleetData: [],
    bookingData: [],
    userData: [],
    preBookingsData: [],
    extensionsData: [],
    notificationData: [],
    statsData: { monthlyRevenue: 0, totalFleet: 0, availableVehicles: 0, reservedVehicles: 0, currentlyRented: 0, maintenanceVehicles: 0, activeBookings: 0, pendingBookings: 0, pendingPrebookings: 0, todayPickups: 0, todayReturns: 0, totalUsers: 0, newUsersToday: 0 },
    bookingAnalyticsData: null,
    fleetSummaryCategories: [],
    recentActivity: [],
    upcomingEvents: [],
    
    settingsData: {
      business: {
        name: 'JET CABS Luxury Car Rentals Ltd.',
        email: 'ops@jetcabs.com',
        phone: '+1 (555) 100-2000',
        address: '456 Prestige Boulevard, Suite 100, Beverly Hills, CA 90210',
        hours: '08:00 AM - 10:00 PM'
      },
      policies: {
        hourlyEnabled: true,
        dailyRateMin: 150,
        securityDepositDefault: 500,
        lateFeeHourly: 50,
        cancellationFee: 100,
        cancellationPolicy: 'flexible',
        maxExtensionDays: 7
      },
      email: {
        smtpHost: 'smtp.jetcabs-mail.com',
        smtpPort: '465',
        senderName: 'JET CABS Operations',
        senderEmail: 'no-reply@jetcabs.com',
        encryption: 'ssl'
      },
      notifications: {
        bookings: true,
        extensions: true,
        reminders: true,
        verifications: true,
        browser: false
      },
      system: {
        currency: 'USD',
        timezone: 'UTC-8',
        language: 'en',
        dateFormat: 'YYYY-MM-DD',
        maintenanceMode: false
      },
      security: {
        sessionLifetime: 60,
        passwordExpiryDays: 90,
        enforceMfa: false,
        roleAccess: 'superadmin'
      }
    },
    securitySessionsData: [],
    uiState: {
      currentModule: 'overview',
      searchQuery: '',
      fleetViewMode: 'table',
      fleetSearch: '',
      fleetCategoryFilter: 'all',
      fleetStatusFilter: 'all',
      fleetFuelFilter: 'all',
      fleetTransFilter: 'all',
      fleetSeatsFilter: 'all',
      fleetSort: 'newest',
      fleetCurrentPage: 1,
      fleetItemsPerPage: 6,
      // Bookings preferences
      bookingsActiveTab: 'standard', // standard, prebooking, extensions
      bookingsSearch: '',
      bookingsStatusFilter: 'all',
      bookingsTypeFilter: 'all',
      bookingsQuickFilter: 'all', // all, pending, pickups, returns
      bookingsCurrentPage: 1,
      bookingsItemsPerPage: 5,
      // Prebookings preferences
      pbSearch: '',
      pbStatusFilter: 'all',
      pbCurrentPage: 1,
      pbItemsPerPage: 5,
      // Customers preferences
      usersSearch: '',
      usersStatusFilter: 'all',
      usersMembershipFilter: 'all',
      usersVerificationFilter: 'all',
      usersCurrentPage: 1,
      usersItemsPerPage: 5,
      // Extensions preferences
      extensionsStatusFilter: 'all',
      extensionsCurrentPage: 1,
      extensionsItemsPerPage: 5,
      // System preferences
      systemActiveTab: 'notifications', // notifications, verification
      notificationsSearch: '',
      notificationsCategoryFilter: 'all',
      notificationsStatusFilter: 'all',
      notificationsCurrentPage: 1,
      notificationsItemsPerPage: 5,
      verificationStatusFilter: 'all',
      verificationCurrentPage: 1,
      verificationItemsPerPage: 5,
      // Reports preferences
      reportsPeriodFilter: 'month', // today, week, month, year, custom
      reportsStartDate: '',
      reportsEndDate: '',
      // Settings preferences
      settingsActiveTab: 'business', // business, policies, notifications, system
    }
  };


  /* ============================================================
     2. UTILITY FUNCTIONS
     ============================================================ */
  const Utils = {
    formatCurrency(amount) {
      return '$' + amount.toLocaleString('en-US');
    },
    formatDate(dateStr) {
      if (!dateStr) return 'N/A';
      if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
      const d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },
    formatDateShort(dateStr) {
      if (!dateStr) return 'N/A';
      if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
      const d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
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
    icon(name, cls = '') {
      const lucideMap = {
        'icon-grid': 'layout-grid', 'icon-gauge': 'gauge', 'icon-car': 'car',
        'icon-clipboard': 'clipboard-list', 'icon-users': 'users', 'icon-dollar': 'dollar-sign',
        'icon-file-text': 'file-text', 'icon-settings': 'settings', 'icon-shield-check': 'shield-check',
        'icon-plus': 'plus', 'icon-edit': 'pencil', 'icon-trash': 'trash-2',
        'icon-close': 'x', 'icon-search': 'search', 'icon-chevron-left': 'chevron-left',
        'icon-chevron-right': 'chevron-right', 'icon-chevron-down': 'chevron-down',
        'icon-check': 'check', 'icon-check-circle': 'check-circle', 'icon-alert-triangle': 'alert-triangle',
        'icon-bell': 'bell', 'icon-user': 'user', 'icon-log-out': 'log-out',
        'icon-info': 'info', 'icon-menu': 'menu', 'icon-send': 'send',
        'icon-upload': 'upload', 'icon-download': 'download', 'icon-eye': 'eye',
        'icon-rotate-ccw': 'rotate-ccw', 'icon-credit-card': 'credit-card',
        'icon-tag': 'tag', 'icon-steering': 'circle-dot', 'icon-list': 'list',
        'icon-camera': 'camera', 'icon-calendar': 'calendar', 'icon-clock': 'clock',
        'icon-map-pin': 'map-pin', 'icon-star': 'star', 'icon-trending-up': 'trending-up',
        'icon-trending-down': 'trending-down', 'icon-arrow-right': 'arrow-right',
        'icon-arrow-up': 'arrow-up', 'icon-arrow-down': 'arrow-down',
        'icon-bar-chart': 'bar-chart-3', 'icon-activity': 'activity',
        'icon-mail': 'mail', 'icon-phone': 'phone', 'icon-lock': 'lock',
        'icon-key': 'key', 'icon-external-link': 'external-link',
        'icon-refresh-cw': 'refresh-cw', 'icon-package': 'package',
        'icon-layers': 'layers', 'icon-copy': 'copy', 'icon-hash': 'hash',
        'icon-filter': 'filter', 'icon-printer': 'printer', 'icon-zap': 'zap',
        'icon-tool': 'wrench', 'icon-globe': 'globe', 'icon-database': 'database',
        'icon-hard-drive': 'hard-drive', 'icon-cpu': 'cpu', 'icon-server': 'server',
        'icon-wifi': 'wifi', 'icon-x-circle': 'x-circle', 'icon-minus': 'minus',
        'icon-maximize': 'maximize-2', 'icon-minimize': 'minimize-2',
        'icon-warning': 'alert-triangle'
      };
      const lucideName = lucideMap[name] || name.replace('icon-', '');
      return `<i data-lucide="${lucideName}" class="${cls}"></i>`;
    },
    getTimeGreeting() {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 17) return 'Good afternoon';
      return 'Good evening';
    },
    statusLabel(s) {
      return s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ');
    }
  };


  /* ============================================================
     3. STORAGE HELPER
     ============================================================ */
  const StorageHelper = {
    prefix: 'jetcabs_admin_',
    get(key) { try { const r = localStorage.getItem(this.prefix + key); return r ? JSON.parse(r) : null; } catch { return null; } },
    set(key, value) { try { localStorage.setItem(this.prefix + key, JSON.stringify(value)); } catch {} },
    remove(key) { try { localStorage.removeItem(this.prefix + key); } catch {} }
  };

  function restoreUiState() {
    StorageHelper.remove('ui_state');
    StorageHelper.remove('sidebar_collapsed');
    AdminState.uiState.fleetItemsPerPage = 6;
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

      const functional = ['overview', 'analytics', 'fleet', 'bookings', 'users', 'revenue', 'reports', 'settings', 'system', 'prebookings', 'extensions', 'notifications'];

      this.sidebar.querySelectorAll('.db-sidebar__link').forEach(link => {
        link.addEventListener('click', (e) => {
          const mod = link.getAttribute('data-module');
          if (!functional.includes(mod)) {
            e.preventDefault();
            ToastController.show({
              title: 'Coming Soon',
              message: `The ${link.querySelector('.db-sidebar__link-text').textContent.trim()} management module is coming soon.`,
              type: 'info'
            });
            return;
          }
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
      if (!this.sidebar) return;
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
      if (this.greetingEl) this.greetingEl.textContent = `${Utils.getTimeGreeting()}, ${AdminState.adminData.firstName}`;
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
        this.greetingEl.textContent = `${Utils.getTimeGreeting()}, ${AdminState.adminData.firstName}`;
      }
    },
    initSearch() {
      const searchInput = document.getElementById('db-header-search');
      const resultsContainer = document.getElementById('db-header-search-results');
      if (!searchInput || !resultsContainer) return;

      // Close results when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.db-header__search')) {
          resultsContainer.classList.remove('open');
        }
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          resultsContainer.classList.remove('open');
          searchInput.blur();
        }
      });

      searchInput.addEventListener('input', Utils.debounce(() => {
        const q = searchInput.value.toLowerCase().trim();
        if (!q) {
          resultsContainer.innerHTML = '';
          resultsContainer.classList.remove('open');
          return;
        }

        const matches = [];

        // 1. Search Fleet
        AdminState.fleetData.forEach(v => {
          const brand = v.brand || '';
          const model = v.model || '';
          const plate = v.plate || '';
          const vin = v.vin || '';
          const id = v.id || '';
          const category = v.category || '';
          const color = v.color || '';
          const status = v.status || '';
          const fuel = (v.specs && v.specs.fuel) || '';
          const searchString = `${brand} ${model} ${plate} ${vin} ${id} ${category} ${color} ${status} ${fuel}`;

          if (searchString.toLowerCase().includes(q)) {
            matches.push({
              type: 'vehicle',
              icon: 'icon-car',
              title: `${v.brand} ${v.model}`,
              subtitle: `Fleet ID: ${v.id} · Plate: ${v.plate} · Status: ${v.status}`,
              onClick: () => {
                AdminDashboard.navigateTo('fleet');
                setTimeout(() => {
                  const search = document.getElementById('fleet-search');
                  if (search) {
                    search.value = v.plate;
                    AdminState.uiState.fleetSearch = v.plate.toLowerCase();
                    AdminState.uiState.fleetCurrentPage = 1;
                    _renderFleetList();
                  }
                }, 100);
              }
            });
          }
        });

        // 2. Search Bookings
        AdminState.bookingData.forEach(b => {
          const bVehicle = AdminState.fleetData.find(v => v.id === b.vehicleId);
          const bPlate = bVehicle ? bVehicle.plate : '';
          const bSearchString = `${b.id} ${b.user} ${b.email} ${b.phone} ${b.vehicle} ${b.vehicleId} ${bPlate} ${b.status} ${b.paymentStatus} ${b.kycStatus}`;

          if (bSearchString.toLowerCase().includes(q)) {
            matches.push({
              type: 'booking',
              icon: 'icon-clipboard',
              title: `Booking ${b.id}`,
              subtitle: `${b.user} · ${b.vehicle} · Status: ${b.status}`,
              onClick: () => {
                AdminDashboard.navigateTo('bookings');
                setTimeout(() => {
                  AdminState.uiState.bookingsActiveTab = 'standard';
                  const search = document.getElementById('bookings-search');
                  if (search) {
                    search.value = b.id;
                    AdminState.uiState.bookingsSearch = b.id.toLowerCase();
                    AdminState.uiState.bookingsCurrentPage = 1;
                    RenderBookings();
                  }
                }, 100);
              }
            });
          }
        });

        // 3. Search Customers
        AdminState.userData.forEach(u => {
          const uSearchString = `${u.id} ${u.name} ${u.email} ${u.phone} ${u.license} ${u.status} ${u.membership} ${u.verificationStatus}`;

          if (uSearchString.toLowerCase().includes(q)) {
            matches.push({
              type: 'customer',
              icon: 'icon-users',
              title: u.name,
              subtitle: `ID: ${u.id} · ${u.email} · Status: ${u.status}`,
              onClick: () => {
                AdminDashboard.navigateTo('users');
                setTimeout(() => {
                  const search = document.getElementById('users-search');
                  if (search) {
                    search.value = u.name;
                    AdminState.uiState.usersSearch = u.name.toLowerCase();
                    AdminState.uiState.usersCurrentPage = 1;
                    _renderCustomersList();
                  }
                }, 100);
              }
            });
          }
        });

        // 4. Search Pre-bookings
        AdminState.preBookingsData.forEach(p => {
          const pSearchString = `${p.id} ${p.reference} ${p.user} ${p.email} ${p.phone} ${p.vehicleName} ${p.status} ${p.availability} ${p.notes || ''}`;

          if (pSearchString.toLowerCase().includes(q)) {
            matches.push({
              type: 'prebooking',
              icon: 'icon-clipboard',
              title: `Pre-Booking: ${p.vehicleName}`,
              subtitle: `Ref: ${p.reference} · Customer: ${p.user} · Status: ${p.status}`,
              onClick: () => {
                AdminDashboard.navigateTo('prebookings');
                setTimeout(() => {
                  const pbSearch = document.getElementById('pb-search');
                  if (pbSearch) {
                    pbSearch.value = p.id;
                    AdminState.uiState.pbSearch = p.id.toLowerCase();
                    AdminState.uiState.pbCurrentPage = 1;
                    _renderPreBookingsList();
                  }
                }, 100);
              }
            });
          }
        });

        // 5. Search Rental Extensions
        AdminState.extensionsData.forEach(ext => {
          const extSearchString = `${ext.id} ${ext.bookingId} ${ext.customerName} ${ext.customerEmail} ${ext.vehicleName} ${ext.status} ${ext.reason || ''}`;

          if (extSearchString.toLowerCase().includes(q)) {
            matches.push({
              type: 'extension',
              icon: 'icon-clock',
              title: `Extension: ${ext.vehicleName}`,
              subtitle: `Booking: ${ext.bookingId} · Customer: ${ext.customerName} · Status: ${ext.status}`,
              onClick: () => {
                AdminDashboard.navigateTo('extensions');
                setTimeout(() => {
                  AdminState.uiState.extensionsStatusFilter = 'all';
                  AdminState.uiState.extensionsCurrentPage = 1;
                  _renderExtensionsList();
                }, 100);
              }
            });
          }
        });

        // 6. Search Notifications
        AdminState.notificationData.forEach(n => {
          if (n.archived) return;
          const nSearchString = `${n.id} ${n.type} ${n.category} ${n.title} ${n.text} ${n.priority}`;

          if (nSearchString.toLowerCase().includes(q)) {
            matches.push({
              type: 'notification',
              icon: 'icon-bell',
              title: n.title,
              subtitle: `${n.text} (${n.category})`,
              onClick: () => {
                AdminDashboard.navigateTo('notifications');
                setTimeout(() => {
                  const notifSearch = document.getElementById('notif-search');
                  if (notifSearch) {
                    notifSearch.value = n.title;
                    AdminState.uiState.notificationsSearch = n.title.toLowerCase();
                    AdminState.uiState.notificationsCurrentPage = 1;
                    _renderNotificationsList();
                  }
                }, 100);
              }
            });
          }
        });

        // 7. Search Reports
        const reports = [
          { name: 'Revenue', query: 'revenue', sub: 'Fleet financial overview' },
          { name: 'Fleet Usage', query: 'usage', sub: 'Utilization & tracking indices' },
          { name: 'Rental Trends', query: 'trends', sub: 'Demand lifecycle logs' },
          { name: 'Popular Vehicles', query: 'popular', sub: 'High popularity list' }
        ];
        reports.forEach(r => {
          if (r.name.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q) || 'reports'.toLowerCase().includes(q)) {
            matches.push({
              type: 'report',
              icon: 'icon-file-text',
              title: `${r.name} Analysis`,
              subtitle: r.sub,
              onClick: () => {
                AdminDashboard.navigateTo('reports');
              }
            });
          }
        });

        // 8. Search Settings
        const settings = [
          { name: 'Business Information', key: 'business', sub: 'Trading details & physical address' },
          { name: 'Rental Pricing', key: 'pricing', sub: 'Daily hire rate minimum & default security deposit' },
          { name: 'Rental Policies', key: 'policies', sub: 'Cancellation structures & hourly models' },
          { name: 'Notification Settings', key: 'notifications', sub: 'System email dispatch parameters' },
          { name: 'Email Configuration', key: 'email', sub: 'SMTP PHPMailer gateway settings' }
        ];
        settings.forEach(s => {
          if (s.name.toLowerCase().includes(q) || s.sub.toLowerCase().includes(q) || 'settings'.toLowerCase().includes(q)) {
            matches.push({
              type: 'setting',
              icon: 'icon-settings',
              title: s.name,
              subtitle: s.sub,
              onClick: () => {
                AdminDashboard.navigateTo('settings');
                setTimeout(() => {
                  AdminDashboard.setSettingsTab(s.key);
                }, 100);
              }
            });
          }
        });

        // Remove duplicates
        const seen = new Set();
        const uniqueMatches = [];
        matches.forEach(m => {
          const key = `${m.type}-${m.title}-${m.subtitle}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueMatches.push(m);
          }
        });

        const slicedMatches = uniqueMatches.slice(0, 6);

        if (slicedMatches.length === 0) {
          resultsContainer.innerHTML = `<div class="db-header__search-empty">No results matched "${Utils.escapeHtml(q)}"</div>`;
        } else {
          resultsContainer.innerHTML = slicedMatches.map(m => `
            <button class="db-header__search-result" onclick="this.dispatchEvent(new CustomEvent('result-click'))">
              <span class="icon">${Utils.icon(m.icon)}</span>
              <div style="text-align: left;">
                <div class="db-header__search-result-title" style="font-weight:var(--fw-medium); font-size:var(--fs-xs); color:var(--color-dark-text);">${Utils.escapeHtml(m.title)}</div>
                <div style="font-size:10px; color:var(--color-light-text); margin-top:2px;">${Utils.escapeHtml(m.subtitle)}</div>
              </div>
            </button>
          `).join('');

          // Attach custom handlers
          const buttons = resultsContainer.querySelectorAll('.db-header__search-result');
          buttons.forEach((btn, idx) => {
            btn.addEventListener('result-click', () => {
              slicedMatches[idx].onClick();
              resultsContainer.classList.remove('open');
              searchInput.value = '';
            });
          });
        }

        resultsContainer.classList.add('open');
        if (typeof lucide !== 'undefined') {
          try { lucide.createIcons(); } catch(e) {}
        }
      }, 250));
    }
  };

  function _filterHomeData(query) {
    const bookingRows = document.querySelectorAll('#recent-bookings-table tbody tr');
    const customerCards = document.querySelectorAll('#recent-customers-list .db-rental-card');
    
    bookingRows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });

    customerCards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(query) ? '' : 'none';
    });
  }


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
          AdminDashboard.toast.show({ title: 'Logged Out', message: 'You have been successfully logged out.', type: 'success' }); 
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
    },
    renderNotifications(panel) {
      const body = panel.querySelector('.db-notification-panel__body');
      if (!body) return;
      const icons = { success: 'icon-check-circle', info: 'icon-info', warning: 'icon-alert-triangle', danger: 'icon-x-circle' };
      body.innerHTML = AdminState.notificationData.slice(0, 5).map(n => `
        <div class="db-notification-panel__item ${n.read ? '' : 'unread'}" onclick="AdminDashboard.toast.show({title:'Notification Details',message:'${Utils.escapeHtml(n.text)}',type:'info'})">
          <div class="db-notification-panel__item-icon db-notification-panel__item-icon--${n.type}">${Utils.icon(icons[n.type] || 'icon-info', 'icon--sm')}</div>
          <div class="db-notification-panel__item-content">
            <div class="db-notification-panel__item-title">${Utils.escapeHtml(n.title)}</div>
            <div class="db-notification-panel__item-text">${Utils.escapeHtml(n.text)}</div>
          </div>
          <span class="db-notification-panel__item-time">${n.time}</span>
        </div>`).join('');
    },
    updateNotificationBadge() {
      const badge = document.getElementById('db-notification-badge');
      if (!badge) return;
      const count = AdminState.notificationData.filter(n => !n.read).length;
      badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none';
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
    activeModal: null,
    backdrop: null,
    previouslyFocusedElement: null,

    init() {
      this.backdrop = document.getElementById('db-modal-backdrop');
      if (this.backdrop) this.backdrop.addEventListener('click', () => this.close());
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.activeModal) this.close();
        if (e.key === 'Tab' && this.activeModal) this.trapFocus(e);
      });
    },
    open(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;
      this.previouslyFocusedElement = document.activeElement;
      this.activeModal = modal;
      modal.classList.add('open');
      if (this.backdrop) this.backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';

      const focusable = this.getFocusableElements(modal);
      if (focusable.length > 0) {
        setTimeout(() => focusable[0].focus(), 50);
      }
    },
    close() {
      if (this.activeModal) this.activeModal.classList.remove('open');
      this.activeModal = null;
      if (this.backdrop) this.backdrop.classList.remove('open');
      document.body.style.overflow = '';
      if (this.previouslyFocusedElement) {
        this.previouslyFocusedElement.focus();
        this.previouslyFocusedElement = null;
      }
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
    },
    getFocusableElements(el) {
      return Array.from(el.querySelectorAll('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'));
    },
    trapFocus(e) {
      const focusable = this.getFocusableElements(this.activeModal);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
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
    init() {}
  };


  /* ============================================================
     10. DASHBOARD RENDERER
     ============================================================ */
  const DashboardRenderer = {
    contentArea: null,
    modules: {
      overview: 'Overview Dashboard',
      fleet: 'Fleet Management',
      bookings: 'Bookings Management',
      prebookings: 'Pre-bookings Review',
      users: 'Customers Management',
      extensions: 'Rental Extensions',
      notifications: 'Notifications Center',
      reports: 'Business Reports & Charts',
      settings: 'System & Rental Settings',
      system: 'System Health & Status'
    },

    init() { this.contentArea = document.getElementById('dashboard-content'); },

    navigate(moduleName) {
      if (!this.contentArea) return;
      AdminState.uiState.currentModule = moduleName;
      SidebarController.setActive(moduleName);
      HeaderController.updateTitle(this.modules[moduleName] || moduleName);
      
      this.contentArea.scrollTop = 0;
      const main = document.getElementById('main-content');
      if (main) main.scrollTop = 0;

      try {
        switch (moduleName) {
          case 'overview': RenderOverview(); break;
          case 'fleet': RenderFleet(); break;
          case 'bookings':
            AdminState.uiState.bookingsActiveTab = 'standard';
            RenderBookings();
            break;
          case 'prebookings':
            AdminState.uiState.bookingsActiveTab = 'prebooking';
            RenderBookings();
            break;
          case 'extensions':
            AdminState.uiState.bookingsActiveTab = 'extensions';
            RenderBookings();
            break;
          case 'users': RenderCustomers(); break;
          case 'notifications': RenderNotifications(); break;
          case 'reports': RenderReports(); break;
          case 'settings': RenderSettings(); break;
          default: RenderOverview(); break;
        }
      } catch (err) {
        console.error(`Error rendering module ${moduleName}:`, err);
        if (this.contentArea) {
          this.contentArea.innerHTML = `
            <div class="db-section-card db-animate-in" style="padding: var(--space-6); text-align: center;">
              <div style="font-size: 3rem; color: var(--color-danger); margin-bottom: var(--space-3); display: flex; align-items: center; justify-content: center;">
                <i data-lucide="alert-triangle" style="width: 48px; height: 48px;"></i>
              </div>
              <h3 style="color: var(--color-dark-text); font-weight: var(--fw-bold); margin-bottom: var(--space-2);">Module Loading Failed</h3>
              <p style="color: var(--color-light-text); font-size: var(--fs-small); max-width: 480px; margin: 0 auto var(--space-4) auto;">
                We encountered an error trying to load the <strong>${this.modules[moduleName] || moduleName}</strong> module. The other platform modules are still fully operational.
              </p>
              <button class="btn btn--outline btn--sm" onclick="AdminDashboard.navigateTo('overview')">Return to Overview</button>
            </div>
          `;
        }
      }

      // Initialize Lucide icons after render
      if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch(e) { /* Lucide not loaded yet */ }
      }
    }
  };


  /* ============================================================
     11. RENDER: ADMIN DASHBOARD OVERVIEW (HOME)
     ============================================================ */
  function RenderOverview() {
    const s = AdminState.statsData;
    const dateToday = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    const timeNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    DashboardRenderer.contentArea.innerHTML = `
      <!-- Hero Admin Section -->
      <div class="db-hero db-animate-in">
        <div class="db-hero__content">
          <div class="db-hero__greeting" style="display:flex; align-items:center; gap:var(--space-2);">
            <span class="db-hero__icon-wrap" style="color:var(--color-secondary); display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; background:rgba(198,169,98,0.1); flex-shrink:0;">
              ${Utils.icon('icon-zap', 'icon--xs')}
            </span>
            <span class="db-hero__welcome">Welcome back, Administrator</span>
          </div>
          <h2 class="db-hero__name">${AdminState.adminData.firstName} ${AdminState.adminData.lastName}</h2>
          <p class="db-hero__text">System Status: <strong style="color:var(--color-secondary);">Operational (Healthy)</strong> · Uptime: 99.8% · Last Database Sync: Just now. Monitor active rentals and approve pending queue requests below.</p>
          <div class="db-hero__actions">
            <button class="btn btn--primary btn--sm" onclick="AdminDashboard.navigateTo('fleet')">${Utils.icon('icon-plus','icon--sm')} Fleet Management</button>
            <button class="btn btn--outline btn--sm" onclick="AdminDashboard.navigateTo('bookings')">${Utils.icon('icon-clipboard','icon--sm')} Review Bookings</button>
            <button class="btn btn--ghost btn--sm" onclick="AdminDashboard.navigateTo('users')">${Utils.icon('icon-users','icon--sm')} View Customers</button>
          </div>
        </div>
        <div class="db-hero__badge">
          <div class="db-hero__badge-icon">${Utils.icon('icon-shield-check')}</div>
          <div class="db-hero__badge-label">System Active</div>
          <span style="font-size:10px; color:rgba(255,255,255,0.6);">${dateToday} · ${timeNow}</span>
        </div>
      </div>

      <!-- KPI statistics cards (8 metrics) -->
      <div class="db-stats-grid db-animate-stagger" style="grid-template-columns: repeat(4, 1fr); gap: var(--space-4);">
        ${_statCard('icon-car', 'primary', 'Total Cars', AdminState.fleetData.length, 'Total fleet units', 'fleet')}
        ${_statCard('icon-check-circle', 'success', 'Available Cars', AdminState.fleetData.filter(v => v.status === 'available').length, 'Ready for rental', 'fleet')}
        ${_statCard('icon-clock', 'warning', 'Reserved Cars', AdminState.fleetData.filter(v => v.status === 'rented').length, 'Booked units', 'bookings')}
        ${_statCard('icon-tool', 'danger', 'Maintenance', AdminState.fleetData.filter(v => v.status === 'maintenance').length, 'In workshop', 'fleet')}
        ${_statCard('icon-credit-card', 'success', 'Revenue', Utils.formatCurrency(s.monthlyRevenue), 'Billing ledger', 'reports')}
        ${_statCard('icon-clipboard', 'gold', 'Pending Requests', s.pendingPrebookings + s.pendingBookings, 'Action required', 'bookings')}
        ${_statCard('icon-arrow-up-right', 'primary', 'Today\'s Pickups', s.todayPickups, 'Dispatches today', 'bookings')}
        ${_statCard('icon-rotate-ccw', 'info', 'Today\'s Returns', s.todayReturns, 'Dropoffs today', 'bookings')}
      </div>

      <!-- Grid 1: Fleet summary & System health -->
      <div class="db-section-grid" style="grid-template-columns: 2fr 1fr; gap:var(--space-6); margin-bottom:var(--space-6);">
        <!-- Fleet category summary list -->
        <div class="db-section-card db-animate-in">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Fleet Classification Summary</h3>
              <p class="db-section-card__subtitle">Units categorization counts</p>
            </div>
          </div>
          <div class="db-section-card__body db-section-card__body--flush">
            <div class="db-table-wrapper" style="margin:0;">
              <table class="db-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Total</th>
                    <th>Available</th>
                    <th>Booked / Rented</th>
                    <th>Maintenance</th>
                  </tr>
                </thead>
                <tbody>
                  ${AdminState.fleetSummaryCategories.map(cat => `
                    <tr>
                      <td style="font-weight:var(--fw-semibold); color:var(--color-dark-text);">${cat.name}</td>
                      <td>${cat.total}</td>
                      <td><span class="db-badge db-badge--available">${cat.available}</span></td>
                      <td><span class="db-badge db-badge--booked">${cat.booked}</span></td>
                      <td><span class="db-badge db-badge--${cat.maintenance>0?'rejected':'inactive'}">${cat.maintenance}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- System Health logs -->
        <div class="db-section-card db-animate-in">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">System Health status</h3>
              <p class="db-section-card__subtitle">SaaS services uptime check</p>
            </div>
          </div>
          <div class="db-section-card__body" style="display:flex; flex-direction:column; gap: var(--space-4);">
            ${_renderHealthItem('Server API status', 'Online', 'var(--color-success)')}
            ${_renderHealthItem('Database Core cluster', 'Healthy', 'var(--color-success)')}
            ${_renderHealthItem('Mail Queue Service', 'Operational', 'var(--color-success)')}
            ${_renderHealthItem('Twilio SMS Dispatches', 'Operational', 'var(--color-success)')}
            ${_renderHealthItem('S3 Photo Storage', 'Operational', 'var(--color-success)')}
          </div>
        </div>
      </div>
      </div>

      <!-- Recent bookings & Recent customers -->
      <div class="db-section-grid" style="grid-template-columns: 2fr 1fr; gap:var(--space-6); margin-bottom:var(--space-6);">
        <!-- Bookings table -->
        <div class="db-section-card db-animate-in">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Recent Active Bookings</h3>
              <p class="db-section-card__subtitle">Dispatch reservation logs</p>
            </div>
            <button class="btn btn--ghost btn--sm" onclick="AdminDashboard.navigateTo('bookings')">View All</button>
          </div>
          <div class="db-section-card__body db-section-card__body--flush">
            <div class="db-table-wrapper" style="margin: 0;">
              <table class="db-table" id="recent-bookings-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Dates</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${AdminState.bookingData.map(b => `
                    <tr>
                      <td><code style="font-family:var(--font-mono); font-size:var(--fs-xs);">${b.id}</code></td>
                      <td>
                        <div style="font-weight:var(--fw-medium); color:var(--color-dark-text);">${Utils.escapeHtml(b.user)}</div>
                        <div style="font-size:10px; color:var(--color-light-text);">${Utils.escapeHtml(b.email)}</div>
                      </td>
                      <td style="font-size:var(--fs-xs);">${Utils.escapeHtml(b.vehicle)}</td>
                      <td style="font-size:var(--fs-xs);">${b.pickup} – ${b.returnDate}</td>
                      <td><strong>${Utils.formatCurrency(b.total)}</strong></td>
                      <td><span class="db-badge db-badge--${b.status==='active'?'approved':b.status==='confirmed'?'pending':b.status==='completed'?'completed':'cancelled'}">${Utils.statusLabel(b.status)}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Recent Customers list -->
        <div class="db-section-card db-animate-in">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Recent Registrations</h3>
              <p class="db-section-card__subtitle">Newly registered users list</p>
            </div>
          </div>
          <div class="db-section-card__body db-section-card__body--flush" style="padding:var(--space-4);" id="recent-customers-list">
            ${AdminState.userData.slice(0, 4).map(usr => `
              <div class="db-rental-card" style="display:flex; align-items:center; justify-content:space-between; padding:var(--space-3); border:1px solid var(--color-border-light); margin-bottom:var(--space-3); background:var(--color-surface); border-radius:var(--radius-lg);">
                <div style="display:flex; align-items:center; gap:var(--space-3);">
                  <div style="width:36px; height:36px; border-radius:50%; background:var(--color-primary); color:#FFF; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:var(--fw-bold);">
                    ${usr.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <div style="font-size:var(--fs-xs); font-weight:var(--fw-semibold); color:var(--color-dark-text);">${Utils.escapeHtml(usr.name)}</div>
                    <div style="font-size:9px; color:var(--color-light-text);">Joined ${Utils.formatDate(usr.joined)}</div>
                  </div>
                </div>
                <div>
                  <button class="btn btn--ghost btn--sm" style="font-size:9px; padding:2px 6px;" onclick="AdminDashboard.toast.show({title:'Customer Details',message:'Profile audits are coming in the next update.',type:'info'})">View Profile</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Recent Activity timeline & Upcoming dispatches -->
      <div class="db-section-grid" style="grid-template-columns: 2fr 1fr; gap:var(--space-6); margin-bottom:var(--space-6);">
        <!-- Timeline activity -->
        <div class="db-section-card db-animate-in">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Recent System Activity</h3>
              <p class="db-section-card__subtitle">Timeline logs for operation dispatches</p>
            </div>
          </div>
          <div class="db-section-card__body">
            <div class="db-timeline">
              ${AdminState.recentActivity.map(act => {
                let dot = 'db-timeline__dot';
                if (act.type === 'success') dot += ' db-timeline__dot--success';
                else if (act.type === 'warning') dot += ' db-timeline__dot--warning';
                else if (act.type === 'danger') dot += ' db-timeline__dot--danger';

                return `
                  <div class="db-timeline__item">
                    <div class="${dot}"></div>
                    <div class="db-timeline__time">${act.date}</div>
                    <div class="db-timeline__title">${act.event}</div>
                    <div class="db-timeline__text">${Utils.escapeHtml(act.desc)}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Upcoming Schedule Calendar -->
        <div class="db-section-card db-animate-in">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Concierge Dispatch Calendar</h3>
              <p class="db-section-card__subtitle">Scheduled pickups & returns</p>
            </div>
          </div>
          <div class="db-section-card__body" style="display:flex; flex-direction:column; gap: var(--space-4);">
            ${AdminState.upcomingEvents.map(evt => {
              const border = evt.type === 'pickup' ? 'rgba(34,197,94,0.3)' : evt.type === 'return' ? 'rgba(59,130,246,0.3)' : 'rgba(198,169,98,0.3)';
              const bg = evt.type === 'pickup' ? 'rgba(34,197,94,0.03)' : evt.type === 'return' ? 'rgba(59,130,246,0.03)' : 'rgba(198,169,98,0.03)';
              return `
                <div style="border-left: 3px solid ${border}; background:${bg}; padding: var(--space-3) var(--space-4); border-radius: var(--radius-md);">
                  <div style="font-weight:var(--fw-semibold); color:var(--color-dark-text); font-size:var(--fs-xs);">${Utils.escapeHtml(evt.title)}</div>
                  <div style="font-size:9px; color:var(--color-light-text); margin-top:2px;">${evt.time} · ${Utils.escapeHtml(evt.info)}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function _statCard(icon, color, label, value, trend, targetModule = '') {
    const clickAttr = targetModule ? `style="cursor: pointer;" onclick="AdminDashboard.navigateTo('${targetModule}')"` : '';
    return `<div class="db-stat-card" ${clickAttr}>
      <div class="db-stat-card__icon db-stat-card__icon--${color}">${Utils.icon(icon)}</div>
      <div class="db-stat-card__content">
        <div class="db-stat-card__label">${label}</div>
        <div class="db-stat-card__value">${value}</div>
        <span class="db-stat-card__change db-stat-card__change--up">${trend}</span>
      </div>
    </div>`;
  }

  function _renderHealthItem(serviceName, status, statusColor) {
    return `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:var(--space-3); border-bottom:1px solid var(--color-border-light);">
        <span style="font-size:var(--fs-xs); color:var(--color-dark-text);">${serviceName}</span>
        <div style="display:flex; align-items:center; gap:var(--space-2);">
          <span style="width:8px; height:8px; border-radius:50%; background:${statusColor}; display:inline-block;"></span>
          <span style="font-size:9px; color:var(--color-light-text);">${status}</span>
        </div>
      </div>
    `;
  }

  function _renderEmptyState(icon, title, text, btnText, btnHref) {
    return `<div class="db-empty-state">
      <div class="db-empty-state__icon">${Utils.icon(icon)}</div>
      <h3 class="db-empty-state__title">${title}</h3>
      <p class="db-empty-state__text">${text}</p>
      ${btnText ? `<a href="${btnHref || '#'}" class="btn btn--primary btn--sm">${btnText}</a>` : ''}
    </div>`;
  }


  /* ============================================================
     12. RENDER: ADMIN ANALYTICS PAGE
     ============================================================ */
  function RenderAnalytics() {
    DashboardRenderer.contentArea.innerHTML = `
      <div class="db-page-header db-animate-in">
        <div class="db-page-header__left">
          <h2 class="db-page-header__title">Analytics & Business Logs</h2>
          <p class="db-page-header__subtitle">Real-time revenue forecast, category metrics, dispatches occupancy and performance diagrams</p>
        </div>
      </div>

      <!-- Overview Cards -->
      <div class="db-stats-grid db-animate-stagger" style="grid-template-columns: repeat(4, 1fr); gap:var(--space-4); margin-bottom:var(--space-6);">
        ${_statCard('icon-dollar', 'gold', 'Gross Revenue Forecast', '$284,500', 'Annual performance billing')}
        ${_statCard('icon-car', 'primary', 'Active Fleet Occupancy', '82.4%', 'Rentals dispatches ratio')}
        ${_statCard('icon-user', 'info', 'Customer Retention', '94.2%', 'Gold/Gold+ status renewals')}
        ${_statCard('icon-check-circle', 'success', 'Average Lead Time', '28 hrs', 'Pre-booking to pickup dispatches')}
      </div>

      <!-- Charts grid -->
      <div class="db-section-grid" style="grid-template-columns: repeat(2, 1fr); gap:var(--space-6); margin-bottom:var(--space-6);">
        
        <!-- CHART 1: REVENUE OVERVIEW -->
        <div class="db-section-card db-animate-in">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Revenue Trend (Last 6 Months)</h3>
              <p class="db-section-card__subtitle">Monthly credit ledger dispatches</p>
            </div>
          </div>
          <div class="db-section-card__body" style="text-align:center;">
            <svg viewBox="0 0 500 200" style="width:100%; height:100%; max-height:220px;">
              <line x1="40" y1="20" x2="480" y2="20" stroke="var(--color-border-light)" stroke-width="0.5" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="var(--color-border-light)" stroke-width="0.5" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="var(--color-border-light)" stroke-width="0.5" stroke-dasharray="2" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="var(--color-border-light)" stroke-width="0.5" />
              <defs>
                <linearGradient id="area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="var(--color-secondary)" stop-opacity="0.2" />
                  <stop offset="100%" stop-color="var(--color-secondary)" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path d="M 40 170 L 40 130 L 128 115 L 216 140 L 304 90 L 392 75 L 480 30 L 480 170 Z" fill="url(#area-grad)"></path>
              <path d="M 40 130 L 128 115 L 216 140 L 304 90 L 392 75 L 480 30" fill="none" stroke="var(--color-secondary)" stroke-width="3" stroke-linecap="round"></path>
              <circle cx="40" cy="130" r="4" fill="var(--color-primary)" stroke="var(--color-secondary)" stroke-width="2"></circle>
              <circle cx="128" cy="115" r="4" fill="var(--color-primary)" stroke="var(--color-secondary)" stroke-width="2"></circle>
              <circle cx="216" cy="140" r="4" fill="var(--color-primary)" stroke="var(--color-secondary)" stroke-width="2"></circle>
              <circle cx="304" cy="90" r="4" fill="var(--color-primary)" stroke="var(--color-secondary)" stroke-width="2"></circle>
              <circle cx="392" cy="75" r="4" fill="var(--color-primary)" stroke="var(--color-secondary)" stroke-width="2"></circle>
              <circle cx="480" cy="30" r="4" fill="var(--color-primary)" stroke="var(--color-secondary)" stroke-width="2"></circle>
              <text x="40" y="115" font-size="8" fill="var(--color-light-text)" text-anchor="middle">$28K</text>
              <text x="128" y="100" font-size="8" fill="var(--color-light-text)" text-anchor="middle">$32K</text>
              <text x="216" y="125" font-size="8" fill="var(--color-light-text)" text-anchor="middle">$25K</text>
              <text x="304" y="75" font-size="8" fill="var(--color-light-text)" text-anchor="middle">$38K</text>
              <text x="392" y="60" font-size="8" fill="var(--color-light-text)" text-anchor="middle">$42K</text>
              <text x="480" y="18" font-size="8" fill="var(--color-secondary)" text-anchor="middle" font-weight="bold">$49K</text>
              <text x="40" y="188" font-size="9" fill="var(--color-light-text)" text-anchor="middle">Feb</text>
              <text x="128" y="188" font-size="9" fill="var(--color-light-text)" text-anchor="middle">Mar</text>
              <text x="216" y="188" font-size="9" fill="var(--color-light-text)" text-anchor="middle">Apr</text>
              <text x="304" y="188" font-size="9" fill="var(--color-light-text)" text-anchor="middle">May</text>
              <text x="392" y="188" font-size="9" fill="var(--color-light-text)" text-anchor="middle">Jun</text>
              <text x="480" y="188" font-size="9" fill="var(--color-light-text)" text-anchor="middle">Jul</text>
            </svg>
          </div>
        </div>

        <!-- CHART 2: FLEET USAGE -->
        <div class="db-section-card db-animate-in">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Fleet Utilization Ratio</h3>
              <p class="db-section-card__subtitle">Active dispatches ratio by category</p>
            </div>
          </div>
          <div class="db-section-card__body" style="text-align:center;">
            <svg viewBox="0 0 500 200" style="width:100%; height:100%; max-height:220px;">
              <line x1="50" y1="170" x2="480" y2="170" stroke="var(--color-border-light)" stroke-width="1" />
              <rect x="70" y="30" width="30" height="140" fill="var(--color-border-light)" rx="4"></rect>
              <rect x="70" y="30" width="30" height="140" fill="var(--color-secondary)" rx="4"></rect>
              <text x="85" y="20" font-size="9" fill="var(--color-secondary)" text-anchor="middle" font-weight="bold">85%</text>
              <text x="85" y="185" font-size="8" fill="var(--color-light-text)" text-anchor="middle">SUVs</text>
              
              <rect x="150" y="70" width="30" height="100" fill="var(--color-border-light)" rx="4"></rect>
              <rect x="150" y="70" width="30" height="100" fill="var(--color-primary)" rx="4"></rect>
              <text x="165" y="60" font-size="9" fill="var(--color-dark-text)" text-anchor="middle" font-weight="bold">60%</text>
              <text x="165" y="185" font-size="8" fill="var(--color-light-text)" text-anchor="middle">Sedans</text>

              <rect x="230" y="15" width="30" height="155" fill="var(--color-border-light)" rx="4"></rect>
              <rect x="230" y="15" width="30" height="155" fill="var(--color-secondary)" rx="4"></rect>
              <text x="245" y="8" font-size="9" fill="var(--color-secondary)" text-anchor="middle" font-weight="bold">95%</text>
              <text x="245" y="185" font-size="8" fill="var(--color-light-text)" text-anchor="middle">Sports</text>

              <rect x="310" y="45" width="30" height="125" fill="var(--color-border-light)" rx="4"></rect>
              <rect x="310" y="45" width="30" height="125" fill="var(--color-primary)" rx="4"></rect>
              <text x="325" y="35" font-size="9" fill="var(--color-dark-text)" text-anchor="middle" font-weight="bold">75%</text>
              <text x="325" y="185" font-size="8" fill="var(--color-light-text)" text-anchor="middle">Electric</text>

              <rect x="390" y="85" width="30" height="85" fill="var(--color-border-light)" rx="4"></rect>
              <rect x="390" y="85" width="30" height="85" fill="#3B82F6" rx="4"></rect>
              <text x="405" y="75" font-size="9" fill="#3B82F6" text-anchor="middle" font-weight="bold">50%</text>
              <text x="405" y="185" font-size="8" fill="var(--color-light-text)" text-anchor="middle">Convertibles</text>
            </svg>
          </div>
        </div>

        <!-- CHART 3: BOOKING TRENDS -->
        <div class="db-section-card db-animate-in">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Booking Distribution</h3>
              <p class="db-section-card__subtitle">Completed dispatches weekly timeline</p>
            </div>
          </div>
          <div class="db-section-card__body" style="text-align:center;">
            <svg viewBox="0 0 500 200" style="width:100%; height:100%; max-height:220px;">
              <path d="M 40 150 L 110 80 L 180 120 L 250 50 L 320 90 L 390 40 L 460 70" fill="none" stroke="var(--color-secondary)" stroke-width="3" stroke-linecap="round"></path>
              <circle cx="40" cy="150" r="5" fill="var(--color-secondary)"></circle>
              <circle cx="110" cy="80" r="5" fill="var(--color-secondary)"></circle>
              <circle cx="180" cy="120" r="5" fill="var(--color-secondary)"></circle>
              <circle cx="250" cy="50" r="5" fill="var(--color-secondary)"></circle>
              <circle cx="320" cy="90" r="5" fill="var(--color-secondary)"></circle>
              <circle cx="390" cy="40" r="5" fill="var(--color-secondary)"></circle>
              <circle cx="460" cy="70" r="5" fill="var(--color-secondary)"></circle>
              <text x="40" y="180" font-size="8" fill="var(--color-light-text)" text-anchor="middle">Mon</text>
              <text x="110" y="180" font-size="8" fill="var(--color-light-text)" text-anchor="middle">Tue</text>
              <text x="180" y="180" font-size="8" fill="var(--color-light-text)" text-anchor="middle">Wed</text>
              <text x="250" y="180" font-size="8" fill="var(--color-light-text)" text-anchor="middle">Thu</text>
              <text x="320" y="180" font-size="8" fill="var(--color-light-text)" text-anchor="middle">Fri</text>
              <text x="390" y="180" font-size="8" fill="var(--color-light-text)" text-anchor="middle">Sat</text>
              <text x="460" y="180" font-size="8" fill="var(--color-light-text)" text-anchor="middle">Sun</text>
            </svg>
          </div>
        </div>

        <!-- CHART 4: VEHICLE CATEGORIES -->
        <div class="db-section-card db-animate-in">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Fleet Class Breakdown</h3>
              <p class="db-section-card__subtitle">Vehicle allocation percentages</p>
            </div>
          </div>
          <div class="db-section-card__body" style="display:flex; align-items:center; justify-content:center; gap:var(--space-6);">
            <svg viewBox="0 0 200 200" style="width:100%; max-width:160px; height:auto;">
              <circle cx="100" cy="100" r="70" fill="none" stroke="var(--color-secondary)" stroke-width="24" stroke-dasharray="153.9 439.6" stroke-dashoffset="0"></circle>
              <circle cx="100" cy="100" r="70" fill="none" stroke="var(--color-primary)" stroke-width="24" stroke-dasharray="110 439.6" stroke-dashoffset="-153.9"></circle>
              <circle cx="100" cy="100" r="70" fill="none" stroke="#3B82F6" stroke-width="24" stroke-dasharray="88 439.6" stroke-dashoffset="-263.9"></circle>
              <circle cx="100" cy="100" r="70" fill="none" stroke="#7C3AED" stroke-width="24" stroke-dasharray="88 439.6" stroke-dashoffset="-351.9"></circle>
              <circle cx="100" cy="100" r="58" fill="var(--color-card)"></circle>
              <text x="100" y="105" font-size="12" fill="var(--color-dark-text)" text-anchor="middle" font-weight="bold">18 units</text>
            </svg>
            <div style="font-size:var(--fs-xs); display:flex; flex-direction:column; gap:4px;">
              <div><span style="width:10px; height:10px; background:var(--color-secondary); display:inline-block; border-radius:2px; margin-right:4px;"></span> Luxury SUVs (35%)</div>
              <div><span style="width:10px; height:10px; background:var(--color-primary); display:inline-block; border-radius:2px; margin-right:4px;"></span> Luxury Sedans (25%)</div>
              <div><span style="width:10px; height:10px; background:#3B82F6; display:inline-block; border-radius:2px; margin-right:4px;"></span> Sports Cars (20%)</div>
              <div><span style="width:10px; height:10px; background:#7C3AED; display:inline-block; border-radius:2px; margin-right:4px;"></span> Electric (20%)</div>
            </div>
          </div>
        </div>

        <!-- CHART 5: MONTHLY RENTALS -->
        <div class="db-section-card db-animate-in">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Monthly Rentals Count</h3>
              <p class="db-section-card__subtitle">Aggregated hires by month</p>
            </div>
          </div>
          <div class="db-section-card__body" style="text-align:center;">
            <svg viewBox="0 0 500 200" style="width:100%; height:100%; max-height:220px;">
              <line x1="40" y1="160" x2="480" y2="160" stroke="var(--color-border-light)" stroke-width="1" />
              <rect x="70" y="80" width="16" height="80" fill="var(--color-secondary)"></rect>
              <rect x="90" y="95" width="16" height="65" fill="var(--color-primary)"></rect>
              <rect x="170" y="60" width="16" height="100" fill="var(--color-secondary)"></rect>
              <rect x="190" y="75" width="16" height="85" fill="var(--color-primary)"></rect>
              <rect x="270" y="40" width="16" height="120" fill="var(--color-secondary)"></rect>
              <rect x="290" y="55" width="16" height="105" fill="var(--color-primary)"></rect>
              <rect x="370" y="30" width="16" height="130" fill="var(--color-secondary)"></rect>
              <rect x="390" y="40" width="16" height="120" fill="var(--color-primary)"></rect>
              <text x="90" y="175" font-size="8" fill="var(--color-light-text)" text-anchor="middle">Apr</text>
              <text x="190" y="175" font-size="8" fill="var(--color-light-text)" text-anchor="middle">May</text>
              <text x="290" y="175" font-size="8" fill="var(--color-light-text)" text-anchor="middle">Jun</text>
              <text x="390" y="175" font-size="8" fill="var(--color-light-text)" text-anchor="middle">Jul</text>
            </svg>
          </div>
        </div>

        <!-- CHART 6: CUSTOMER GROWTH -->
        <div class="db-section-card db-animate-in">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Registered Customer Growth</h3>
              <p class="db-section-card__subtitle">Registered user counts trend</p>
            </div>
          </div>
          <div class="db-section-card__body" style="text-align:center;">
            <svg viewBox="0 0 500 200" style="width:100%; height:100%; max-height:220px;">
              <path d="M 40 160 C 120 160, 180 80, 260 80 C 340 80, 400 30, 480 30" fill="none" stroke="var(--color-secondary)" stroke-width="4"></path>
              <circle cx="480" cy="30" r="6" fill="var(--color-primary)" stroke="var(--color-secondary)" stroke-width="2"></circle>
              <text x="480" y="18" font-size="9" fill="var(--color-secondary)" text-anchor="middle" font-weight="bold">142 users</text>
              <text x="40" y="180" font-size="8" fill="var(--color-light-text)" text-anchor="middle">Q1</text>
              <text x="260" y="180" font-size="8" fill="var(--color-light-text)" text-anchor="middle">Q2</text>
              <text x="480" y="180" font-size="8" fill="var(--color-light-text)" text-anchor="middle">Q3</text>
            </svg>
          </div>
        </div>

        <!-- CHART 7: MOST POPULAR CARS -->
        <div class="db-section-card db-animate-in" style="grid-column: span 2;">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Most Popular Cars (Hires Count)</h3>
              <p class="db-section-card__subtitle">Hired frequency distribution</p>
            </div>
          </div>
          <div class="db-section-card__body" style="display:flex; flex-direction:column; gap: var(--space-4);">
            ${_renderPopularRow('Mercedes-Benz AMG GT 63 S', 42, 'var(--color-secondary)')}
            ${_renderPopularRow('Tesla Model S Plaid', 36, 'var(--color-primary)')}
            ${_renderPopularRow('BMW X7 xDrive40i', 28, 'var(--color-primary)')}
            ${_renderPopularRow('Porsche 911 Turbo S', 22, 'var(--color-primary)')}
          </div>
        </div>

      </div>
    `;
  }

  function _renderPopularRow(carName, count, barColor) {
    const percentage = (count / 50) * 100;
    return `
      <div>
        <div style="display:flex; justify-content:space-between; font-size:var(--fs-xs); margin-bottom:2px;">
          <span style="font-weight:var(--fw-medium); color:var(--color-dark-text);">${carName}</span>
          <span style="font-weight:var(--fw-bold);">${count} Hires</span>
        </div>
        <div style="width:100%; height:8px; background:var(--color-border-light); border-radius:4px; overflow:hidden;">
          <div style="width:${percentage}%; height:100%; background:${barColor}; border-radius:4px; transition: width 0.8s ease;"></div>
        </div>
      </div>
    `;
  }


  /* ============================================================
     13. RENDER: ADMIN FLEET MANAGEMENT
     ============================================================ */
  function RenderFleet() {
    const state = AdminState.uiState;
    const rates = _calcAverageRates();

    DashboardRenderer.contentArea.innerHTML = `
      <div class="db-page-header db-animate-in">
        <div class="db-page-header__left">
          <h2 class="db-page-header__title">Fleet Management</h2>
          <p class="db-page-header__subtitle">Manage vehicle specifications, pricing indices, and availability status</p>
        </div>
        <div class="db-page-header__actions">
          <button class="btn btn--outline btn--sm" onclick="AdminDashboard.toast.show({title:'Import Data',message:'Fleet import template file placeholder.',type:'info'})">
            ${Utils.icon('icon-upload','icon--xs')} Import
          </button>
          <button class="btn btn--outline btn--sm" onclick="AdminDashboard.toast.show({title:'Export Data',message:'Exporting current fleet to CSV...',type:'success'})">
            ${Utils.icon('icon-download','icon--xs')} Export
          </button>
          <button class="btn btn--primary btn--sm" onclick="AdminDashboard.showVehicleWizard()">
            ${Utils.icon('icon-plus','icon--sm')} Add Vehicle
          </button>
        </div>
      </div>

      <!-- Fleet Stats (8 KPIs Grid) -->
      <div class="db-stats-grid db-animate-stagger" style="grid-template-columns: repeat(4, 1fr); gap:var(--space-4); margin-bottom:var(--space-6);">
        ${_statCard('icon-car', 'primary', 'Total Fleet', AdminState.fleetData.length, 'Units in database')}
        ${_statCard('icon-check-circle', 'success', 'Available Vehicles', AdminState.fleetData.filter(v => v.status === 'available').length, 'Idle on lots')}
        ${_statCard('icon-clock', 'warning', 'Reserved Vehicles', AdminState.fleetData.filter(v => v.bookingState === 'reserved').length, 'Booked ahead')}
        ${_statCard('icon-steering', 'info', 'Currently Rented', AdminState.fleetData.filter(v => v.bookingState === 'rented').length, 'On active hire')}
        ${_statCard('icon-wrench', 'danger', 'Maintenance Status', AdminState.fleetData.filter(v => v.status === 'maintenance').length, 'Awaiting workshop')}
        ${_statCard('icon-archive', 'inactive', 'Inactive / Archived', AdminState.fleetData.filter(v => v.status === 'inactive' || v.status === 'archived').length, 'Decommissioned')}
        ${_statCard('icon-dollar', 'gold', 'Avg Daily Rate', Utils.formatCurrency(rates.avgDaily), 'Calculation matrix')}
        ${_statCard('icon-clock', 'gold', 'Avg Hourly Rate', Utils.formatCurrency(rates.avgHourly), 'Calculation matrix')}
      </div>

      <!-- Listing panel with filter rows -->
      <div class="db-section-card db-animate-in">
        <div class="db-filter-bar">
          <div class="db-filter-bar__search" style="max-width: 260px;">
            <input type="text" class="db-filter-bar__search-input" id="fleet-search" placeholder="Search by name, plate, VIN..." value="${Utils.escapeHtml(state.fleetSearch || '')}">
          </div>

          <select class="db-filter-bar__select" id="fleet-category-filter">
            <option value="all" ${state.fleetCategoryFilter === 'all' ? 'selected' : ''}>All Categories</option>
            <option value="Luxury Sedans" ${state.fleetCategoryFilter === 'Luxury Sedans' ? 'selected' : ''}>Luxury Sedans</option>
            <option value="Luxury SUVs" ${state.fleetCategoryFilter === 'Luxury SUVs' ? 'selected' : ''}>Luxury SUVs</option>
            <option value="Sports Cars" ${state.fleetCategoryFilter === 'Sports Cars' ? 'selected' : ''}>Sports Cars</option>
            <option value="Electric Vehicles" ${state.fleetCategoryFilter === 'Electric Vehicles' ? 'selected' : ''}>Electric Vehicles</option>
          </select>

          <select class="db-filter-bar__select" id="fleet-status-filter">
            <option value="all" ${state.fleetStatusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
            <option value="available" ${state.fleetStatusFilter === 'available' ? 'selected' : ''}>Available</option>
            <option value="rented" ${state.fleetStatusFilter === 'rented' ? 'selected' : ''}>Rented</option>
            <option value="maintenance" ${state.fleetStatusFilter === 'maintenance' ? 'selected' : ''}>Maintenance</option>
            <option value="inactive" ${state.fleetStatusFilter === 'inactive' ? 'selected' : ''}>Inactive / Archived</option>
          </select>

          <select class="db-filter-bar__select" id="fleet-fuel-filter">
            <option value="all" ${state.fleetFuelFilter === 'all' ? 'selected' : ''}>All Fuel Types</option>
            <option value="Petrol" ${state.fleetFuelFilter === 'Petrol' ? 'selected' : ''}>Petrol</option>
            <option value="Electric" ${state.fleetFuelFilter === 'Electric' ? 'selected' : ''}>Electric</option>
          </select>

          <select class="db-filter-bar__select" id="fleet-trans-filter">
            <option value="all" ${state.fleetTransFilter === 'all' ? 'selected' : ''}>All Transmissions</option>
            <option value="Automatic" ${state.fleetTransFilter === 'Automatic' ? 'selected' : ''}>Automatic</option>
          </select>

          <select class="db-filter-bar__select" id="fleet-seats-filter">
            <option value="all" ${state.fleetSeatsFilter === 'all' ? 'selected' : ''}>All Seats</option>
            <option value="2" ${state.fleetSeatsFilter === '2' ? 'selected' : ''}>2 Seats</option>
            <option value="4" ${state.fleetSeatsFilter === '4' ? 'selected' : ''}>4 Seats</option>
            <option value="5" ${state.fleetSeatsFilter === '5' ? 'selected' : ''}>5 Seats</option>
            <option value="7" ${state.fleetSeatsFilter === '7' ? 'selected' : ''}>7 Seats</option>
          </select>

          <select class="db-filter-bar__select" id="fleet-sort">
            <option value="newest" ${state.fleetSort === 'newest' ? 'selected' : ''}>Newest First</option>
            <option value="oldest" ${state.fleetSort === 'oldest' ? 'selected' : ''}>Oldest First</option>
            <option value="price-low" ${state.fleetSort === 'price-low' ? 'selected' : ''}>Price: Low to High</option>
            <option value="price-high" ${state.fleetSort === 'price-high' ? 'selected' : ''}>Price: High to Low</option>
            <option value="popularity" ${state.fleetSort === 'popularity' ? 'selected' : ''}>Popularity (Bookings)</option>
          </select>

          <!-- Toggle Card/Table View -->
          <div class="db-filter-bar__actions" style="margin-left: auto;">
            <button class="btn btn--outline btn--sm btn--icon ${state.fleetViewMode === 'table' ? 'btn--secondary' : ''}" onclick="AdminDashboard.setFleetViewMode('table')" title="Table layout">
              ${Utils.icon('icon-list')}
            </button>
            <button class="btn btn--outline btn--sm btn--icon ${state.fleetViewMode === 'card' ? 'btn--secondary' : ''}" onclick="AdminDashboard.setFleetViewMode('card')" title="Card grid layout">
              ${Utils.icon('icon-grid')}
            </button>
          </div>
        </div>

        <div id="fleet-items-container" class="db-section-card__body db-section-card__body--flush">
          <!-- Populated by JS -->
        </div>

        <div class="db-section-card__footer" id="fleet-pagination" style="display:flex; justify-content:space-between; align-items:center;">
          <!-- Populated by JS -->
        </div>
      </div>
    `;

    _bindFleetFilters();
    _renderFleetList();
  }

  function _calcAverageRates() {
    const list = AdminState.fleetData;
    if (list.length === 0) return { avgDaily: 0, avgHourly: 0 };
    const sumDaily = list.reduce((sum, v) => sum + v.dailyRate, 0);
    const sumHourly = list.reduce((sum, v) => sum + v.hourlyRate, 0);
    return {
      avgDaily: Math.round(sumDaily / list.length),
      avgHourly: Math.round(sumHourly / list.length),
    };
  }

  function _bindFleetFilters() {
    const search = document.getElementById('fleet-search');
    const category = document.getElementById('fleet-category-filter');
    const status = document.getElementById('fleet-status-filter');
    const fuel = document.getElementById('fleet-fuel-filter');
    const trans = document.getElementById('fleet-trans-filter');
    const seats = document.getElementById('fleet-seats-filter');
    const sort = document.getElementById('fleet-sort');

    const update = () => {
      const state = AdminState.uiState;
      state.fleetSearch = search ? search.value : '';
      state.fleetCategoryFilter = category ? category.value : 'all';
      state.fleetStatusFilter = status ? status.value : 'all';
      state.fleetFuelFilter = fuel ? fuel.value : 'all';
      state.fleetTransFilter = trans ? trans.value : 'all';
      state.fleetSeatsFilter = seats ? seats.value : 'all';
      state.fleetSort = sort ? sort.value : 'newest';
      state.fleetCurrentPage = 1;
      saveUiState();
      _renderFleetList();
    };

    if (search) search.addEventListener('input', Utils.debounce(update, 250));
    if (category) category.addEventListener('change', update);
    if (status) status.addEventListener('change', update);
    if (fuel) fuel.addEventListener('change', update);
    if (trans) trans.addEventListener('change', update);
    if (seats) seats.addEventListener('change', update);
    if (sort) sort.addEventListener('change', update);
  }

  function _renderFleetList() {
    const container = document.getElementById('fleet-items-container');
    const pagination = document.getElementById('fleet-pagination');
    if (!container || !pagination) return;

    const state = AdminState.uiState;
    let data = [...AdminState.fleetData];

    // Filter Search
    if (state.fleetSearch) {
      const q = state.fleetSearch.toLowerCase();
      data = data.filter(v => `${v.brand} ${v.model} ${v.plate} ${v.vin} ${v.category} ${v.specs.fuel}`.toLowerCase().includes(q));
    }
    // Filter Category
    if (state.fleetCategoryFilter !== 'all') data = data.filter(v => v.category === state.fleetCategoryFilter);
    // Filter Status
    if (state.fleetStatusFilter !== 'all') data = data.filter(v => v.status === state.fleetStatusFilter);
    // Filter Fuel
    if (state.fleetFuelFilter !== 'all') data = data.filter(v => v.specs.fuel === state.fleetFuelFilter);
    // Filter Transmission
    if (state.fleetTransFilter !== 'all') data = data.filter(v => v.specs.transmission === state.fleetTransFilter);
    // Filter Seats
    if (state.fleetSeatsFilter !== 'all') data = data.filter(v => v.specs.seats.toString() === state.fleetSeatsFilter);

    // Sort
    if (state.fleetSort === 'newest') data.sort((a,b) => b.year - a.year);
    else if (state.fleetSort === 'oldest') data.sort((a,b) => a.year - b.year);
    else if (state.fleetSort === 'price-low') data.sort((a,b) => a.dailyRate - b.dailyRate);
    else if (state.fleetSort === 'price-high') data.sort((a,b) => b.dailyRate - a.dailyRate);
    else if (state.fleetSort === 'popularity') data.sort((a,b) => b.bookingCount - a.bookingCount);

    if (data.length === 0) {
      container.innerHTML = _renderEmptyState('icon-car', 'No Vehicles Found', 'There are no active or registered vehicles matching the current query filters.');
      pagination.innerHTML = '';
      if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch(e) {}
      }
      return;
    }

    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / state.fleetItemsPerPage);
    if (state.fleetCurrentPage > totalPages) state.fleetCurrentPage = totalPages || 1;
    const startIdx = (state.fleetCurrentPage - 1) * state.fleetItemsPerPage;
    const paginatedData = data.slice(startIdx, startIdx + state.fleetItemsPerPage);

    if (state.fleetViewMode === 'table') {
      container.innerHTML = _renderFleetTable(paginatedData);
    } else {
      container.innerHTML = `<div class="db-rentals-grid" style="grid-template-columns: repeat(3, 1fr); padding: var(--space-6);">${paginatedData.map(v => _renderFleetCardItem(v)).join('')}</div>`;
    }

    pagination.innerHTML = `
      <div style="font-size: var(--fs-xs); color: var(--color-light-text);">
        Showing <strong>${startIdx + 1}</strong> to <strong>${Math.min(startIdx + state.fleetItemsPerPage, totalItems)}</strong> of <strong>${totalItems}</strong> units
      </div>
      <div style="display:flex; gap:var(--space-2);">
        <button class="btn btn--outline btn--sm" ${state.fleetCurrentPage === 1 ? 'disabled' : ''} onclick="AdminDashboard.setFleetPage(${state.fleetCurrentPage - 1})">Prev</button>
        ${Array.from({length: totalPages}).map((_, i) => `
          <button class="btn btn--sm ${state.fleetCurrentPage === (i+1) ? 'btn--primary' : 'btn--outline'}" onclick="AdminDashboard.setFleetPage(${i + 1})">${i + 1}</button>
        `).join('')}
        <button class="btn btn--outline btn--sm" ${state.fleetCurrentPage === totalPages ? 'disabled' : ''} onclick="AdminDashboard.setFleetPage(${state.fleetCurrentPage + 1})">Next</button>
      </div>
    `;
    if (typeof lucide !== 'undefined') {
      try { lucide.createIcons(); } catch(e) {}
    }
  }

  function _renderFleetTable(data) {
    const badges = { available:'available', rented:'booked', reserved:'pending', maintenance:'rejected', inactive:'inactive' };
    return `
      <div class="db-table-wrapper" style="margin:0;">
        <table class="db-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Reg Plate</th>
              <th>Category</th>
              <th>Fuel / Transmission</th>
              <th>Seats</th>
              <th>Pricing (Hr/Day)</th>
              <th>Featured</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(v => `
              <tr>
                <td>
                  <div style="display:flex; align-items:center; gap:var(--space-3);">
                    <img src="${v.images[0] || 'assets/images/cars/luxury.png'}" alt="${v.brand}" style="width:50px; height:35px; object-fit:cover; border-radius:var(--radius-md); background:var(--color-surface);">
                    <div>
                      <div style="font-weight:var(--fw-semibold); color:var(--color-dark-text);">${v.brand} ${v.model}</div>
                      <div style="font-size:10px; color:var(--color-light-text);">${v.year} · VIN: ${v.vin}</div>
                    </div>
                  </div>
                </td>
                <td><code style="font-family:var(--font-mono); font-size:var(--fs-xs);">${v.plate}</code></td>
                <td>${v.category}</td>
                <td>${v.specs.fuel} / ${v.specs.transmission}</td>
                <td>${v.specs.seats} seats</td>
                <td><strong>${Utils.formatCurrency(v.hourlyRate)}/hr</strong> · <strong>${Utils.formatCurrency(v.dailyRate)}/day</strong></td>
                <td>${v.featured ? `<span style="color:var(--color-secondary); font-size:1.25rem;">★</span>` : '—'}</td>
                <td><span class="db-badge db-badge--${badges[v.status] || 'inactive'}">${Utils.statusLabel(v.status)}</span></td>
                <td>
                  <div style="display:flex; gap: var(--space-2);">
                    <button class="btn btn--outline btn--sm" style="padding:4px 8px; font-size:10px;" onclick="AdminDashboard.showVehicleDetails('${v.id}')">View</button>
                    <button class="btn btn--outline btn--sm" style="padding:4px 8px; font-size:10px;" onclick="AdminDashboard.showVehicleWizard('${v.id}')">Edit</button>
                    <button class="btn btn--ghost btn--sm" style="padding:4px 8px; font-size:10px; color:var(--color-light-text);" onclick="AdminDashboard.duplicateVehicle('${v.id}')" title="Clone record">${Utils.icon('icon-plus','icon--xs')}</button>
                    <button class="btn btn--ghost btn--sm" style="padding:4px 8px; font-size:10px; color:var(--color-light-text);" onclick="AdminDashboard.archiveVehicle('${v.id}')" title="Archive">${Utils.icon('icon-close','icon--xs')}</button>
                    <button class="btn btn--ghost btn--sm" style="padding:4px 8px; font-size:10px; color:var(--color-danger);" onclick="AdminDashboard.deleteVehicle('${v.id}')" title="Delete">${Utils.icon('icon-trash','icon--xs')}</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function _renderFleetCardItem(v) {
    const badges = { available:'available', rented:'booked', reserved:'pending', maintenance:'rejected', inactive:'inactive' };
    return `
      <div class="db-rental-card" style="display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
        <div class="db-rental-card__image-wrap" style="height: 140px;">
          <img src="${v.images[0] || 'assets/images/cars/luxury.png'}" class="db-rental-card__image" alt="${v.brand}">
          <span class="db-badge db-badge--${badges[v.status] || 'inactive'}">${Utils.statusLabel(v.status)}</span>
        </div>
        
        <div class="db-rental-card__body" style="padding: var(--space-4); display:flex; flex-direction:column; gap: var(--space-3); flex: 1;">
          <div class="db-rental-card__header">
            <h4 class="db-rental-card__name">${v.brand} ${v.model}</h4>
            <span class="db-rental-card__id">${v.plate}</span>
          </div>
          
          <div class="db-rental-card__meta" style="margin-bottom:0;">
            <span>${Utils.icon('icon-tag','icon--xs')} ${v.category}</span>
            <span>${Utils.icon('icon-steering','icon--xs')} ${v.specs.transmission}</span>
            <span>${Utils.icon('icon-users','icon--xs')} ${v.specs.seats} seats</span>
          </div>

          <div class="db-rental-card__price" style="margin-bottom:0; justify-content:space-between; align-items:center;">
            <span class="db-rental-card__price-total">${Utils.formatCurrency(v.dailyRate)}/day</span>
            <span class="db-rental-card__price-rate">${Utils.formatCurrency(v.hourlyRate)}/hr</span>
          </div>

          <div class="db-rental-card__actions" style="margin-top:auto; padding-top:var(--space-3); border-top:1px solid var(--color-border-light);">
            <button class="btn btn--primary btn--sm" style="flex:1;" onclick="AdminDashboard.showVehicleDetails('${v.id}')">View</button>
            <button class="btn btn--outline btn--sm" onclick="AdminDashboard.showVehicleWizard('${v.id}')">Edit</button>
            <button class="btn btn--ghost btn--sm btn--icon" style="color:var(--color-danger);" onclick="AdminDashboard.deleteVehicle('${v.id}')">${Utils.icon('icon-trash','icon--sm')}</button>
          </div>
        </div>
      </div>
    `;
  }

  function showVehicleDetails(id) {
    const v = AdminState.fleetData.find(x => x.id === id);
    if (!v) return;

    const badges = { available:'available', rented:'booked', reserved:'pending', maintenance:'rejected', inactive:'inactive' };

    const content = `
      <div class="db-modal__header">
        <h3 class="db-modal__title">Vehicle Technical Profile</h3>
        <button class="db-modal__close" data-action="close-modal" aria-label="Close">${Utils.icon('icon-close')}</button>
      </div>
      <div class="db-modal__body db-rental-detail">
        <div style="display:grid; grid-template-columns: 3fr 1fr; gap:var(--space-4); margin-bottom:var(--space-6);">
          <div style="height:250px; background:#000; border-radius:var(--radius-lg); overflow:hidden; display:flex; align-items:center; justify-content:center;">
            <img id="verif-gallery-main" src="${v.images[0] || 'assets/images/cars/luxury.png'}" alt="${v.brand}" style="width:100%; height:100%; object-fit:cover; transition: opacity 0.3s ease;">
          </div>
          <div style="display:flex; flex-direction:column; gap:var(--space-2); height:250px; overflow-y:auto; scrollbar-width:none;">
            ${v.images.map((img, i) => `
              <div style="border:2px solid ${i===0?'var(--color-secondary)':'transparent'}; border-radius:var(--radius-md); overflow:hidden; height:74px; cursor:pointer; background:var(--color-surface);" onclick="AdminDashboard.switchDetailGallery('${img}', this)">
                <img src="${img}" alt="" style="width:100%; height:100%; object-fit:cover;">
              </div>
            `).join('')}
          </div>
        </div>

        <div class="db-rental-detail__vehicle" style="border:none; margin-bottom:0; padding-bottom:0;">
          <div class="db-rental-detail__vehicle-info" style="padding:0;">
            <h4 class="db-rental-detail__vehicle-name" style="font-size:var(--fs-h3);">${v.brand} ${v.model}</h4>
            <div style="display:flex; align-items:center; gap:var(--space-2); margin-top:4px;">
              <span class="db-badge db-badge--${badges[v.status] || 'inactive'}">${Utils.statusLabel(v.status)}</span>
              <span class="db-badge" style="border:1px solid var(--color-border-light);">${v.category}</span>
              <code style="font-family:var(--font-mono); font-size:var(--fs-xs);">${v.plate}</code>
            </div>
          </div>
        </div>

        <h4 class="db-rental-detail__section-title">Technical Specifications</h4>
        <div class="db-rental-detail__grid">
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Fuel Type</span><span class="db-rental-detail__value">${v.specs.fuel}</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Transmission</span><span class="db-rental-detail__value">${v.specs.transmission}</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Seats Allocation</span><span class="db-rental-detail__value">${v.specs.seats} Seats</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Doors Count</span><span class="db-rental-detail__value">${v.specs.doors} Doors</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Horsepower</span><span class="db-rental-detail__value">${v.specs.horsepower}</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Engine Details</span><span class="db-rental-detail__value">${v.specs.engine}</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Max Speed</span><span class="db-rental-detail__value">${v.specs.topSpeed}</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Acceleration (0-60)</span><span class="db-rental-detail__value">${v.specs.acceleration}</span></div>
        </div>

        <h4 class="db-rental-detail__section-title">Billing & Rental Price Indices</h4>
        <div class="db-rental-detail__grid" style="grid-template-columns: repeat(3, 1fr);">
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Hourly Pricing</span><span class="db-rental-detail__value db-rental-detail__value--highlight">${Utils.formatCurrency(v.hourlyRate)}/hr</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Daily Pricing</span><span class="db-rental-detail__value db-rental-detail__value--highlight">${Utils.formatCurrency(v.dailyRate)}/day</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Security Deposit Held</span><span class="db-rental-detail__value">${Utils.formatCurrency(v.deposit)}</span></div>
        </div>

        <h4 class="db-rental-detail__section-title">Included Features</h4>
        <div style="display:flex; flex-wrap:wrap; gap:var(--space-2); padding:var(--space-3) 0;">
          ${v.features.map(f => `<span class="db-badge" style="background:var(--color-surface); color:var(--color-dark-text); padding:4px 10px; border-radius: var(--radius-sm); font-size:10px;">✓ ${f}</span>`).join('')}
        </div>

        <h4 class="db-rental-detail__section-title">Rental Performance Statistics</h4>
        <div class="db-rental-detail__grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom:0;">
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Lifetime Hires Count</span><span class="db-rental-detail__value">${v.bookingCount} Hires</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Diagnostics Mileage Log</span><span class="db-rental-detail__value">${v.mileage.toLocaleString()} mi</span></div>
        </div>
      </div>
      <div class="db-modal__footer">
        <button class="btn btn--outline btn--sm" data-action="close-modal">Close Profile</button>
        <button class="btn btn--primary btn--sm" onclick="AdminDashboard.showVehicleWizard('${v.id}')">${Utils.icon('icon-edit','icon--sm')} Edit Specifications</button>
      </div>
    `;

    ModalController.openDynamic(content, '640px');
  }

  function switchDetailGallery(src, thumbContainer) {
    const mainImg = document.getElementById('verif-gallery-main');
    if (!mainImg) return;
    mainImg.style.opacity = '0.3';
    setTimeout(() => {
      mainImg.src = src; mainImg.style.opacity = '1';
    }, 200);

    const thumbnails = thumbContainer.parentNode.children;
    for (let t of thumbnails) { t.style.borderColor = 'transparent'; }
    thumbContainer.style.borderColor = 'var(--color-secondary)';
  }

  var editingVehicleId = null;
  var wizardUploadFiles = [];

  function showVehicleWizard(vehicleId = null) {
    editingVehicleId = vehicleId;
    currentWizardStep = 1;
    wizardUploadFiles = [];

    let v = {
      brand: '', model: '', year: 2024, category: 'Luxury', plate: '', vin: '', color: '',
      status: 'available', mileage: 0, condition: 'excellent', featured: false,
      hourlyRate: 50, dailyRate: 300, deposit: 500, pickupLocation: '', returnLocation: '', notes: '',
      specs: { fuel: 'Petrol', transmission: 'Automatic', seats: 5, doors: 4, horsepower: '', engine: '', topSpeed: '', acceleration: '', driveType: 'AWD' },
      features: [], images: [],
    };

    if (editingVehicleId) {
      const match = AdminState.fleetData.find(x => x.id === editingVehicleId);
      if (match) v = JSON.parse(JSON.stringify(match));
    }

    const titleText = editingVehicleId ? 'Edit Vehicle Profile' : 'Register New Fleet Vehicle';

    const content = `
      <div class="db-modal__header">
        <h3 class="db-modal__title">${titleText}</h3>
        <button class="db-modal__close" data-action="close-modal" aria-label="Close">${Utils.icon('icon-close')}</button>
      </div>
      
      <div style="background:var(--color-surface); padding: var(--space-4) var(--space-6); border-bottom:1px solid var(--color-border-light);">
        <div style="display:flex; justify-content:space-between; align-items:center; max-width:550px; margin: 0 auto; position:relative;">
          <div style="position:absolute; top:12px; left:5%; right:5%; height:2px; background:var(--color-border-light); z-index:0;"></div>
          <div id="wiz-progress-line" style="position:absolute; top:12px; left:5%; width:0%; height:2px; background:var(--color-secondary); z-index:0; transition: width 0.3s ease;"></div>
          
          ${_renderWizardStepIndicator(1, 'Info')}
          ${_renderWizardStepIndicator(2, 'Specs')}
          ${_renderWizardStepIndicator(3, 'Pricing')}
          ${_renderWizardStepIndicator(4, 'Features')}
          ${_renderWizardStepIndicator(5, 'Images')}
          ${_renderWizardStepIndicator(6, 'Review')}
        </div>
      </div>

      <div class="db-modal__body db-rental-detail" style="max-height: 480px; overflow-y:auto;">
        
        <!-- STEP 1: BASIC INFORMATION -->
        <div class="wiz-step-content" id="wiz-step-1">
          <div class="db-rental-detail__grid" style="grid-template-columns: 1fr 1fr; gap:var(--space-4);">
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Brand / Manufacturer *</label>
              <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="w-brand" name="brand" value="${Utils.escapeHtml(v.brand)}" required>
            </div>
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Model Name *</label>
              <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="w-model" name="model" value="${Utils.escapeHtml(v.model)}" required>
            </div>
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Manufacturing Year</label>
              <input type="number" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="w-year" name="year" value="${v.year}">
            </div>
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Category Classification</label>
              <select class="db-filter-bar__select" style="width:100%; height:40px;" id="w-category" name="category">
                <option value="Sedans" ${v.category==='Sedans'?'selected':''}>Sedans</option>
                <option value="SUVs" ${v.category==='SUVs'?'selected':''}>SUVs</option>
                <option value="Hatchbacks" ${v.category==='Hatchbacks'?'selected':''}>Hatchbacks</option>
                <option value="Convertibles" ${v.category==='Convertibles'?'selected':''}>Convertibles</option>
                <option value="Luxury" ${v.category==='Luxury'?'selected':''}>Luxury</option>
                <option value="Electric" ${v.category==='Electric'?'selected':''}>Electric</option>
                <option value="Sports" ${v.category==='Sports'?'selected':''}>Sports</option>
              </select>
            </div>
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">License Plate Number *</label>
              <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="w-plate" name="license_plate" value="${Utils.escapeHtml(v.plate)}" required>
            </div>
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Chassis VIN Number</label>
              <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="w-vin" name="vin" value="${Utils.escapeHtml(v.vin)}">
            </div>
            <div class="db-rental-detail__item" style="background:none; padding:0; grid-column: span 2;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Body Color Trim</label>
              <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="w-color" name="color" value="${Utils.escapeHtml(v.color)}">
            </div>
          </div>
        </div>

        <!-- STEP 2: TECHNICAL SPECIFICATIONS -->
        <div class="wiz-step-content" id="wiz-step-2" style="display:none;">
          <div class="db-rental-detail__grid" style="grid-template-columns: repeat(3, 1fr); gap:var(--space-4);">
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Fuel Type</label>
              <select class="db-filter-bar__select" style="width:100%; height:40px;" id="w-fuel" name="fuel_type">
                <option value="Petrol" ${v.specs.fuel==='Petrol'?'selected':''}>Petrol</option>
                <option value="Electric" ${v.specs.fuel==='Electric'?'selected':''}>Electric</option>
                <option value="Hybrid" ${v.specs.fuel==='Hybrid'?'selected':''}>Hybrid</option>
              </select>
            </div>
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Transmission</label>
              <select class="db-filter-bar__select" style="width:100%; height:40px;" id="w-transmission" name="transmission">
                <option value="Automatic" ${v.specs.transmission==='Automatic'?'selected':''}>Automatic</option>
                <option value="Manual" ${v.specs.transmission==='Manual'?'selected':''}>Manual</option>
              </select>
            </div>
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Drive Configuration</label>
              <select class="db-filter-bar__select" style="width:100%; height:40px;" id="w-drive" name="drive_type">
                <option value="AWD" ${v.specs.driveType==='AWD'?'selected':''}>AWD (All-Wheel)</option>
                <option value="4WD" ${v.specs.driveType==='4WD'?'selected':''}>4WD (Four-Wheel)</option>
                <option value="RWD" ${v.specs.driveType==='RWD'?'selected':''}>RWD (Rear-Wheel)</option>
                <option value="FWD" ${v.specs.driveType==='FWD'?'selected':''}>FWD (Front-Wheel)</option>
              </select>
            </div>
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Seats Count</label>
              <input type="number" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="w-seats" name="seats" value="${v.specs.seats}">
            </div>
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Doors Count</label>
              <input type="number" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="w-doors" name="doors" value="${v.specs.doors}">
            </div>
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Engine Description</label>
              <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="w-engine" name="engine" value="${Utils.escapeHtml(v.specs.engine)}" placeholder="e.g. 4.0L V8">
            </div>
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Horsepower</label>
              <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="w-hp" name="horsepower" value="${Utils.escapeHtml(v.specs.horsepower)}" placeholder="e.g. 500 HP">
            </div>
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Top Speed</label>
              <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="w-speed" name="top_speed" value="${Utils.escapeHtml(v.specs.topSpeed)}" placeholder="e.g. 190 mph">
            </div>
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Acceleration (0-60)</label>
              <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="w-acceleration" name="acceleration" value="${Utils.escapeHtml(v.specs.acceleration)}" placeholder="e.g. 3.5s">
            </div>
          </div>
        </div>

        <!-- STEP 3: RENTAL PRICING -->
        <div class="wiz-step-content" id="wiz-step-3" style="display:none;">
          <div class="db-rental-detail__grid" style="grid-template-columns: 1fr 1fr; gap:var(--space-4);">
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Hourly Rate ($) *</label>
              <input type="number" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="w-hr-rate" name="hourly_rate" value="${v.hourlyRate}" required>
            </div>
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Daily Rate ($) *</label>
              <input type="number" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="w-day-rate" name="daily_rate" value="${v.dailyRate}" required>
            </div>
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Security Deposit ($)</label>
              <input type="number" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="w-deposit" name="security_deposit" value="${v.deposit}">
            </div>
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Mileage Limit</label>
              <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="w-mileage" name="mileage_limit" value="${v.mileage}" placeholder="e.g. 200 mi/day">
            </div>
          </div>
        </div>

        <!-- STEP 4: VEHICLE FEATURES -->
        <div class="wiz-step-content" id="wiz-step-4" style="display:none;">
          <label class="db-rental-detail__label" style="margin-bottom:12px; display:block;">Select Included Accessories & Safety Systems</label>
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:var(--space-3);" id="wizard-features-checkboxes">
            ${['GPS', 'Bluetooth', 'Cruise Control', 'Parking Sensors', 'Sunroof', 'Leather Seats', 'Apple CarPlay', 'Android Auto', 'Rear Camera', 'Heated Seats', 'Wireless Charging'].map(f => {
              const checked = v.features.includes(f) ? 'checked' : '';
              return `
                <label style="display:flex; align-items:center; gap:var(--space-2); font-size:var(--fs-xs); cursor:pointer;">
                  <input type="checkbox" name="features[]" value="${f}" ${checked} style="width:16px; height:16px; accent-color:var(--color-secondary);">
                  <span>${f}</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>

        <!-- STEP 5: VEHICLE GALLERY IMAGES -->
        <div class="wiz-step-content" id="wiz-step-5" style="display:none;">
          <div style="border: 2px dashed var(--color-border-light); border-radius: var(--radius-lg); padding: var(--space-6); text-align:center; background: var(--color-surface); cursor:pointer;" onclick="document.getElementById('wizard-image-selector').click()">
            <div style="color:var(--color-secondary); font-size: 1.75rem; margin-bottom:4px;">${Utils.icon('icon-camera')}</div>
            <div style="font-weight:var(--fw-semibold); font-size:var(--fs-xs);">Drag & drop or Click to choose vehicle photos</div>
            <div style="font-size:10px; color:var(--color-light-text); margin-top:2px;">PNG, JPG accepted (stored locally)</div>
            <input type="file" id="wizard-image-selector" style="display:none;" accept="image/*" multiple onchange="AdminDashboard.handleWizardPhotoUpload(event)">
          </div>

          <div style="margin-top:var(--space-5);">
            <label class="db-rental-detail__label" style="margin-bottom:8px; display:block;">Image Previews list</label>
            <div style="display:flex; gap:var(--space-2); flex-wrap:wrap;" id="wizard-image-previews">
              ${v.images.length === 0 ? '<div style="font-size:10px; color:var(--color-light-text);">No images uploaded yet. Standard fallback will be used.</div>' : ''}
              ${v.images.map((img, i) => `
                <div style="position:relative; width:80px; height:60px; border-radius:var(--radius-md); overflow:hidden; background:#000;" class="wiz-uploaded-photo" data-src="${img}">
                  <img src="${img}" style="width:100%; height:100%; object-fit:cover;">
                  <button type="button" style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.6); color:#FFF; border:none; width:16px; height:16px; border-radius:50%; font-size:10px; line-height:16px; text-align:center; cursor:pointer;" onclick="this.parentNode.parentNode.removeChild(this.parentNode)">&times;</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- STEP 6: AVAILABILITY & PICKUP SETTINGS -->
        <div class="wiz-step-content" id="wiz-step-6" style="display:none;">
          <div class="db-rental-detail__grid" style="grid-template-columns: 1fr 1fr; gap:var(--space-4);">
            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Availability Status</label>
              <select class="db-filter-bar__select" style="width:100%; height:40px;" id="w-status" name="status">
                <option value="available" ${v.status==='available'?'selected':''}>Available</option>
                <option value="rented" ${v.status==='rented'?'selected':''}>Rented</option>
                <option value="maintenance" ${v.status==='maintenance'?'selected':''}>Maintenance</option>
                <option value="inactive" ${v.status==='inactive'?'selected':''}>Inactive / Archived</option>
              </select>
            </div>
            
            <div class="db-rental-detail__item" style="background:none; padding:0; display:flex; align-items:center; justify-content:center;">
              <label style="display:flex; align-items:center; gap:var(--space-2); font-size:var(--fs-xs); cursor:pointer;">
                <input type="checkbox" id="w-featured" name="featured" ${v.featured ? 'checked' : ''} style="width:18px; height:18px; accent-color:var(--color-secondary);">
                <strong>Feature on homepage</strong>
              </label>
            </div>

            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Default Pickup Hub</label>
              <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="w-pickup" name="pickup_location" value="${Utils.escapeHtml(v.pickupLocation)}" placeholder="e.g. Downtown Lounge">
            </div>

            <div class="db-rental-detail__item" style="background:none; padding:0;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Default Return Hub</label>
              <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="w-return" name="return_location" value="${Utils.escapeHtml(v.returnLocation)}" placeholder="e.g. Downtown Lounge">
            </div>

            <div class="db-rental-detail__item" style="background:none; padding:0; grid-column: span 2;">
              <label class="db-rental-detail__label" style="margin-bottom:4px;">Administrative Notes</label>
              <textarea class="db-filter-bar__search-input" style="width:100%; height:70px; padding:var(--space-3); resize:none;" id="w-notes" name="admin_notes" placeholder="Internal remarks...">${Utils.escapeHtml(v.notes)}</textarea>
            </div>
          </div>
        </div>

      </div>

      <div class="db-modal__footer" id="wizard-modal-footer">
        <!-- Buttons rendered dynamically -->
      </div>
    `;

    ModalController.openDynamic(content, '580px');
    _updateWizardUI();
  }

  function _renderWizardStepIndicator(stepNum, label) {
    return `
      <div class="wiz-indicator" id="wiz-ind-${stepNum}" style="display:flex; flex-direction:column; align-items:center; gap:4px; z-index:1; position:relative;">
        <div class="wiz-circle" style="width:26px; height:26px; border-radius:50%; background:var(--color-card); border: 2px solid var(--color-border-light); color:var(--color-light-text); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:var(--fw-bold); transition: all 0.3s ease;">
          ${stepNum}
        </div>
        <span style="font-size:9px; color:var(--color-light-text); font-weight:var(--fw-medium);">${label}</span>
      </div>
    `;
  }

  function _updateWizardUI() {
    for (let i = 1; i <= 6; i++) {
      const sec = document.getElementById(`wiz-step-${i}`);
      if (sec) sec.style.display = i === currentWizardStep ? 'block' : 'none';
      
      const ind = document.getElementById(`wiz-ind-${i}`);
      if (ind) {
        const circle = ind.querySelector('.wiz-circle');
        const span = ind.querySelector('span');
        if (i < currentWizardStep) {
          circle.style.borderColor = 'var(--color-secondary)';
          circle.style.background = 'var(--color-secondary)';
          circle.style.color = '#111';
          circle.textContent = '✓';
          span.style.color = 'var(--color-secondary)';
        } else if (i === currentWizardStep) {
          circle.style.borderColor = 'var(--color-secondary)';
          circle.style.background = 'var(--color-card)';
          circle.style.color = 'var(--color-secondary)';
          circle.textContent = i;
          span.style.color = 'var(--color-dark-text)';
        } else {
          circle.style.borderColor = 'var(--color-border-light)';
          circle.style.background = 'var(--color-card)';
          circle.style.color = 'var(--color-light-text)';
          circle.textContent = i;
          span.style.color = 'var(--color-light-text)';
        }
      }
    }

    const line = document.getElementById('wiz-progress-line');
    if (line) {
      line.style.width = `${((currentWizardStep - 1) / 5) * 90}%`;
    }

    const footer = document.getElementById('wizard-modal-footer');
    if (!footer) return;

    const backBtn = `<button type="button" class="btn btn--outline btn--sm" onclick="AdminDashboard.wizardGoBack()">${Utils.icon('icon-chevron-left','icon--sm')} Back</button>`;
    const cancelBtn = `<button type="button" class="btn btn--ghost btn--sm" data-action="close-modal">Cancel</button>`;
    
    if (currentWizardStep === 1) {
      footer.innerHTML = `${cancelBtn} <button type="button" class="btn btn--primary btn--sm" onclick="AdminDashboard.wizardGoNext()">Next Step ${Utils.icon('icon-chevron-right','icon--sm')}</button>`;
    } else if (currentWizardStep < 6) {
      footer.innerHTML = `${backBtn} <button type="button" class="btn btn--primary btn--sm" onclick="AdminDashboard.wizardGoNext()">Next Step ${Utils.icon('icon-chevron-right','icon--sm')}</button>`;
    } else {
      const submitText = editingVehicleId ? 'Save Specs' : 'Save Vehicle';
      footer.innerHTML = `${backBtn} <button type="button" class="btn btn--primary btn--sm" onclick="AdminDashboard.saveWizardData()">${Utils.icon('icon-check','icon--sm')} ${submitText}</button>`;
    }
  }

  function wizardGoBack() {
    if (currentWizardStep > 1) {
      currentWizardStep--; _updateWizardUI();
    }
  }

  function wizardGoNext() {
    if (currentWizardStep === 1) {
      const brand = document.getElementById('w-brand').value.trim();
      const model = document.getElementById('w-model').value.trim();
      const plate = document.getElementById('w-plate').value.trim();
      if (!brand || !model || !plate) {
        ToastController.show({ title: 'Validation Error', message: 'Please fill in all required basic fields (*).', type: 'error' });
        return;
      }
    } else if (currentWizardStep === 3) {
      const hr = document.getElementById('w-hr-rate').value;
      const day = document.getElementById('w-day-rate').value;
      if (!hr || !day) {
        ToastController.show({ title: 'Validation Error', message: 'Hourly and Daily rates are required.', type: 'error' });
        return;
      }
    }

    if (currentWizardStep < 6) {
      currentWizardStep++; _updateWizardUI();
    }
  }

  function handleWizardPhotoUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    wizardUploadFiles = wizardUploadFiles.concat(Array.from(files));

    const container = document.getElementById('wizard-image-previews');
    if (!container) return;

    if (container.querySelector('div') && container.querySelector('div').textContent.includes('No images')) {
      container.innerHTML = '';
    }

    for (let f of files) {
      const url = URL.createObjectURL(f);
      const preview = document.createElement('div');
      preview.style.position = 'relative';
      preview.style.width = '80px';
      preview.style.height = '60px';
      preview.style.borderRadius = 'var(--radius-md)';
      preview.style.overflow = 'hidden';
      preview.style.background = '#000';
      preview.className = 'wiz-uploaded-photo';
      preview.setAttribute('data-src', url);
      preview.innerHTML = `
        <img src="${url}" style="width:100%; height:100%; object-fit:cover;">
        <button type="button" style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.6); color:#FFF; border:none; width:16px; height:16px; border-radius:50%; font-size:10px; line-height:16px; text-align:center; cursor:pointer;" onclick="this.parentNode.parentNode.removeChild(this.parentNode)">&times;</button>
      `;
      container.appendChild(preview);
    }
    ToastController.show({ title: 'Photos Cached', message: `${files.length} images added to session draft.`, type: 'success' });
  }

  function saveWizardData() {
    const brand = document.getElementById('w-brand').value.trim();
    const model = document.getElementById('w-model').value.trim();
    const year = parseInt(document.getElementById('w-year').value, 10) || 2024;
    const category = document.getElementById('w-category').value;
    const plate = document.getElementById('w-plate').value.trim();
    const vin = document.getElementById('w-vin').value.trim();
    const color = document.getElementById('w-color').value.trim();

    const fuel = document.getElementById('w-fuel').value;
    const transmission = document.getElementById('w-transmission').value;
    const driveType = document.getElementById('w-drive').value;
    const seats = parseInt(document.getElementById('w-seats').value, 10) || 5;
    const doors = parseInt(document.getElementById('w-doors').value, 10) || 4;
    const engine = document.getElementById('w-engine').value.trim();
    const horsepower = document.getElementById('w-hp').value.trim();
    const topSpeed = document.getElementById('w-speed').value.trim();
    const acceleration = document.getElementById('w-acceleration').value.trim();

    const hourlyRate = parseInt(document.getElementById('w-hr-rate').value, 10) || 50;
    const dailyRate = parseInt(document.getElementById('w-day-rate').value, 10) || 300;
    const deposit = parseInt(document.getElementById('w-deposit').value, 10) || 500;
    const mileage = document.getElementById('w-mileage').value.trim();

    const selectedFeatures = [];
    document.querySelectorAll('#wizard-features-checkboxes input:checked').forEach(cb => {
      selectedFeatures.push(cb.value);
    });

    const images = [];
    document.querySelectorAll('.wiz-uploaded-photo').forEach(div => {
      images.push(div.getAttribute('data-src'));
    });
    if (images.length === 0) {
      images.push('assets/images/cars/luxury.png');
    }

    const status = document.getElementById('w-status').value;
    const featured = document.getElementById('w-featured').checked;
    const pickupLocation = document.getElementById('w-pickup').value.trim();
    const returnLocation = document.getElementById('w-return').value.trim();
    const notes = document.getElementById('w-notes').value.trim();

    const vehicleObj = {
      brand, model, year, category, plate, vin, color, status, featured, hourlyRate, dailyRate, deposit, pickupLocation, returnLocation, notes,
      specs: { fuel, transmission, driveType, seats, doors, engine, horsepower, topSpeed, acceleration },
      features: selectedFeatures,
      images,
      mileage: parseInt(mileage, 10) || 12000,
    };

    const token = localStorage.getItem('token');
    if (token) {
      // Persist to the real backend API
      const isEdit = !!editingVehicleId;
      const formData = new FormData();
      formData.append('carName', `${brand} ${model}`.trim());
      formData.append('brand', brand);
      formData.append('category', category);
      formData.append('fuelType', fuel);
      formData.append('transmission', transmission);
      formData.append('seatingCapacity', seats);
      formData.append('hourlyPrice', hourlyRate);
      formData.append('dailyPrice', dailyRate);
      formData.append('totalUnits', 1);
      formData.append('availableUnits', status === 'available' ? 1 : 0);
      formData.append('features', JSON.stringify(selectedFeatures));
      formData.append('description', notes || '');

      wizardUploadFiles.forEach(f => formData.append('images', f));

      if (!isEdit && wizardUploadFiles.length === 0) {
        ToastController.show({ title: 'Image Required', message: 'Please upload at least one vehicle photo.', type: 'error' });
        return;
      }

      if (isEdit) {
        const existing = AdminState.fleetData.find(x => x.id === editingVehicleId);
        if (existing && existing.apiPublicIds && existing.apiPublicIds.length > 0) {
          formData.append('retainedImages', JSON.stringify(existing.apiPublicIds));
        }
      }

      fetch(isEdit
          ? `http://localhost:5000/api/cars/${editingVehicleId}`
          : 'http://localhost:5000/api/cars', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        if (!data.success) throw new Error(data.message || 'Failed to save vehicle');
        ToastController.show({ title: isEdit ? 'Vehicle Updated' : 'Vehicle Added', message: `${brand} ${model} saved to fleet.`, type: 'success' });
        ModalController.close();
        fetchDashboardData().then(() => RenderFleet());
      })
      .catch(err => {
        ToastController.show({ title: 'Save Failed', message: err.message, type: 'error', duration: 5000 });
      });
      return;
    }

    if (editingVehicleId) {
      const idx = AdminState.fleetData.findIndex(x => x.id === editingVehicleId);
      if (idx !== -1) {
        vehicleObj.id = editingVehicleId;
        vehicleObj.bookingCount = AdminState.fleetData[idx].bookingCount || 0;
        AdminState.fleetData[idx] = vehicleObj;
      }
      ToastController.show({ title: 'Vehicle Updated', message: `${brand} ${model} records updated successfully.`, type: 'success' });
    } else {
      vehicleObj.id = 'VH-' + (AdminState.fleetData.length + 101);
      vehicleObj.bookingCount = 0;
      AdminState.fleetData.push(vehicleObj);
      ToastController.show({ title: 'Vehicle Added', message: `${brand} ${model} added to fleet catalog.`, type: 'success' });
    }

    ModalController.close();
    RenderFleet();
  }

  function duplicateVehicle(id) {
    const v = AdminState.fleetData.find(x => x.id === id);
    if (!v) return;

    const clone = JSON.parse(JSON.stringify(v));
    clone.id = 'VH-' + (AdminState.fleetData.length + 101);
    clone.model = clone.model + ' (Copy)';
    clone.plate = clone.plate + '-C';
    clone.bookingCount = 0;
    
    AdminState.fleetData.push(clone);
    ToastController.show({ title: 'Vehicle Duplicated', message: `Cloned ${v.brand} record. New reference plate is ${clone.plate}.`, type: 'success' });
    RenderFleet();
  }

  function archiveVehicle(id) {
    const v = AdminState.fleetData.find(x => x.id === id);
    if (v) {
      v.status = 'inactive';
      ToastController.show({ title: 'Vehicle Archived', message: `${v.brand} ${v.model} moved to inactive archive pool.`, type: 'info' });
      RenderFleet();
    }
  }

  function deleteVehicle(id) {
    const v = AdminState.fleetData.find(x => x.id === id);
    if (!v) return;

    ModalController.confirm({
      title: 'Confirm Fleet Deletion',
      message: `
        <div style="display:flex; gap:var(--space-3); align-items:center; margin-bottom:var(--space-3);">
          <img src="${v.images[0] || 'assets/images/cars/luxury.png'}" style="width:70px; height:50px; object-fit:cover; border-radius:var(--radius-md); background:var(--color-surface);">
          <div>
            <div style="font-weight:var(--fw-bold); color:var(--color-dark-text);">${v.brand} ${v.model}</div>
            <div style="font-size:10px; color:var(--color-light-text);">License Plate: ${v.plate}</div>
          </div>
        </div>
        <p>Warning: Deleting this vehicle will permanently remove its catalog specifications, rental statistics, and billing records from the local memory. This action cannot be undone.</p>
      `,
      type: 'danger',
      confirmText: 'Delete Vehicle Unit',
      cancelText: 'Keep Vehicle',
      onConfirm: () => {
        const token = localStorage.getItem('token');
        const isApiCar = !String(id).startsWith('VH-') && !!token;

        const afterDelete = () => {
          const idx = AdminState.fleetData.findIndex(x => x.id === id);
          if (idx !== -1) {
            AdminState.fleetData.splice(idx, 1);
            ToastController.show({ title: 'Vehicle Deleted', message: `${v.brand} ${v.model} has been removed from listings.`, type: 'error' });
            RenderFleet();
          }
        };

        if (isApiCar) {
          fetch(`http://localhost:5000/api/cars/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => {
            if (!data.success) throw new Error(data.message || 'Failed to delete vehicle');
            afterDelete();
          })
          .catch(err => {
            ToastController.show({ title: 'Delete Failed', message: err.message, type: 'error', duration: 5000 });
          });
          return;
        }

        afterDelete();
      }
    });
  }

  function setFleetViewMode(mode) {
    AdminState.uiState.fleetViewMode = mode;
    saveUiState();
    _renderFleetList();
    
    const btns = document.querySelectorAll('.db-filter-bar__actions .btn--icon');
    if (btns.length >= 2) {
      btns[0].classList.toggle('btn--secondary', mode === 'table');
      btns[1].classList.toggle('btn--secondary', mode === 'card');
    }
  }

  function setFleetPage(pageNum) {
    AdminState.uiState.fleetCurrentPage = pageNum;
    saveUiState();
    _renderFleetList();
  }


  /* ============================================================
     18. RENDER: BOOKINGS & PRE-BOOKINGS MANAGEMENT (PHASE 6)
     ============================================================ */
  function RenderBookings() {
    const state = AdminState.uiState;
    DashboardRenderer.contentArea.innerHTML = `
      <div class="db-page-header db-animate-in">
        <div class="db-page-header__left">
          <h2 class="db-page-header__title">Bookings, Pre-Bookings & Extensions</h2>
          <p class="db-page-header__subtitle">Manage direct customer leases, KYC status checks, and process pre-booking and extension requests</p>
        </div>
        <div class="db-page-header__actions">
          <button class="btn btn--outline btn--sm" onclick="AdminDashboard.toast.show({title:'Invoices Export',message:'Exporting active bookings lists to Excel...',type:'success'})">
            ${Utils.icon('icon-download','icon--xs')} Export
          </button>
          <button class="btn btn--outline btn--sm" onclick="AdminDashboard.refreshBookingsView()">
            ${Utils.icon('icon-rotate-ccw','icon--xs')} Refresh
          </button>
        </div>
      </div>

      <!-- Tab Switcher (Standard Bookings vs. Pre-Bookings vs. Extensions) -->
      <div class="db-tabs" data-db-tabs="bookings-modules" style="margin-bottom:var(--space-6); background: var(--color-surface); padding: 0; border-bottom: 1px solid var(--color-border-light);">
        <button class="db-tab ${state.bookingsActiveTab === 'standard' ? 'active' : ''}" onclick="AdminDashboard.setBookingsTab('standard')">Standard Bookings</button>
        <button class="db-tab ${state.bookingsActiveTab === 'prebooking' ? 'active' : ''}" onclick="AdminDashboard.setBookingsTab('prebooking')">Pre-Bookings review</button>
        <button class="db-tab ${state.bookingsActiveTab === 'extensions' ? 'active' : ''}" onclick="AdminDashboard.setBookingsTab('extensions')">Rental Extensions</button>
      </div>

      <!-- Tab Content Area -->
      <div id="bookings-active-tab-container">
        <!-- Rendered dynamically depending on tab -->
      </div>
    `;

    _renderBookingsTabContent();
  }

  function setBookingsTab(tabName) {
    AdminState.uiState.bookingsActiveTab = tabName;
    saveUiState();
    RenderBookings();
  }

  function _renderBookingsTabContent() {
    const container = document.getElementById('bookings-active-tab-container');
    if (!container) return;

    const tab = AdminState.uiState.bookingsActiveTab;
    if (tab === 'standard') {
      _renderStandardBookingsTab(container);
    } else if (tab === 'prebooking') {
      _renderPreBookingsTab(container);
    } else if (tab === 'extensions') {
      _renderExtensionsTab(container);
    }
  }

  function refreshBookingsView() {
    ToastController.show({ title: 'List Updated', message: 'Bookings list re-synced with storage.', type: 'success' });
    _renderBookingsTabContent();
  }


  /* ============================================================
     18.1 STANDARD BOOKINGS VIEW CONTROLLER
     ============================================================ */
  function _renderStandardBookingsTab(container) {
    const s = AdminState.statsData;
    const state = AdminState.uiState;
    const bookings = AdminState.bookingData;

    container.innerHTML = `
      <!-- Stats Summary -->
      <div class="db-stats-grid db-animate-stagger" style="grid-template-columns: repeat(4, 1fr); gap:var(--space-4); margin-bottom:var(--space-6);">
        ${_statCard('icon-clipboard', 'primary', 'Total Bookings', bookings.length, 'Cumulative orders')}
        ${_statCard('icon-check-circle', 'success', 'Ongoing Leases', bookings.filter(b=>b.status==='active').length, 'Active keys on road')}
        ${_statCard('icon-clock', 'warning', 'Upcoming Pickups', bookings.filter(b=>b.status==='confirmed').length, 'Pre-approved rentals')}
        ${_statCard('icon-close', 'danger', 'Cancelled Bookings', bookings.filter(b=>b.status==='cancelled').length, 'Failed authorizations')}
      </div>

      <!-- Filter Panel -->
      <div class="db-section-card db-animate-in" style="margin-bottom: var(--space-6);">
        <div class="db-filter-bar">
          <div class="db-filter-bar__search" style="max-width: 240px;">
            <input type="text" class="db-filter-bar__search-input" id="bookings-search" placeholder="Search by ID, name, email..." value="${Utils.escapeHtml(state.bookingsSearch || '')}">
          </div>

          <select class="db-filter-bar__select" id="bookings-status-filter">
            <option value="all" ${state.bookingsStatusFilter === 'all' ? 'selected' : ''}>All</option>
            <option value="pending" ${state.bookingsStatusFilter === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${state.bookingsStatusFilter === 'confirmed' ? 'selected' : ''}>Upcoming</option>
            <option value="active" ${state.bookingsStatusFilter === 'active' ? 'selected' : ''}>Active</option>
            <option value="extended" ${state.bookingsStatusFilter === 'extended' ? 'selected' : ''}>Extended</option>
            <option value="completed" ${state.bookingsStatusFilter === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${state.bookingsStatusFilter === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>

          <!-- Quick Filters Buttons -->
          <div style="display:flex; flex-wrap:wrap; gap:var(--space-2); margin-left:var(--space-3);" class="db-quick-filter-buttons">
            <button class="btn btn--outline btn--sm ${state.bookingsQuickFilter === 'all' ? 'btn--secondary' : ''}" onclick="AdminDashboard.setBookingsQuickFilter('all')">All</button>
            <button class="btn btn--outline btn--sm ${state.bookingsQuickFilter === 'pending' ? 'btn--secondary' : ''}" onclick="AdminDashboard.setBookingsQuickFilter('pending')">Pending</button>
            <button class="btn btn--outline btn--sm ${state.bookingsQuickFilter === 'pickups' ? 'btn--secondary' : ''}" onclick="AdminDashboard.setBookingsQuickFilter('pickups')">Today's Pickups</button>
          </div>
        </div>

        <div id="bookings-table-container" class="db-section-card__body db-section-card__body--flush">
          <!-- Table populated by JS -->
        </div>

        <div class="db-section-card__footer" id="bookings-pagination" style="display:flex; justify-content:space-between; align-items:center;">
          <!-- Pagination metrics -->
        </div>
      </div>
    `;

    _bindBookingsFilters();
    _renderBookingsList();
  }

  function setBookingsQuickFilter(q) {
    AdminState.uiState.bookingsQuickFilter = q;
    saveUiState();
    _renderBookingsTabContent();
  }

  function _bindBookingsFilters() {
    const search = document.getElementById('bookings-search');
    const status = document.getElementById('bookings-status-filter');

    const update = () => {
      const state = AdminState.uiState;
      state.bookingsSearch = search ? search.value : '';
      state.bookingsStatusFilter = status ? status.value : 'all';
      state.bookingsCurrentPage = 1;
      saveUiState();
      _renderBookingsList();
    };

    if (search) search.addEventListener('input', Utils.debounce(update, 250));
    if (status) status.addEventListener('change', update);
  }

  function _renderBookingsList() {
    const tableContainer = document.getElementById('bookings-table-container');
    const pagination = document.getElementById('bookings-pagination');
    if (!tableContainer || !pagination) return;

    const state = AdminState.uiState;
    let data = [...AdminState.bookingData];

    // Filter Search (Booking ID, Customer Name, Car Name)
    if (state.bookingsSearch) {
      const q = state.bookingsSearch.toLowerCase();
      data = data.filter(b => `${b.id} ${b.user} ${b.vehicle}`.toLowerCase().includes(q));
    }
    // Filter Status
    if (state.bookingsStatusFilter !== 'all') data = data.filter(b => b.status === state.bookingsStatusFilter);

    // Filter Quick Buttons
    if (state.bookingsQuickFilter === 'pending') {
      data = data.filter(b => b.status === 'pending');
    } else if (state.bookingsQuickFilter === 'pickups') {
      // Stub match for pickups today
      data = data.filter(b => b.status === 'confirmed' || b.status === 'pending');
    }

    if (data.length === 0) {
      tableContainer.innerHTML = _renderEmptyState('icon-clipboard', 'No Bookings Found', 'No bookings matched your filter guidelines.');
      pagination.innerHTML = '';
      if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch(e) {}
      }
      return;
    }

    // Pagination bounds
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / state.bookingsItemsPerPage);
    if (state.bookingsCurrentPage > totalPages) state.bookingsCurrentPage = totalPages || 1;
    const startIdx = (state.bookingsCurrentPage - 1) * state.bookingsItemsPerPage;
    const paginatedData = data.slice(startIdx, startIdx + state.bookingsItemsPerPage);

    const statusBadgeMap = { pending:'pending', confirmed:'booked', active:'approved', completed:'completed', cancelled:'cancelled' };
    const payBadgeMap = { paid:'available', pending:'pending', failed:'rejected' };

    tableContainer.innerHTML = `
      <div class="db-table-wrapper" style="margin:0;">
        <table class="db-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Customer Name</th>
              <th>Car</th>
              <th>Rental Start</th>
              <th>Rental End</th>
              <th>Booking Status</th>
              <th>Pickup Photo Status</th>
              <th>Return Photo Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${paginatedData.map(b => {
              let pickupStatus = 'Pending';
              let returnStatus = 'Pending';

              if (b.status === 'active' || b.status === 'extended') {
                pickupStatus = 'Uploaded';
                returnStatus = 'Pending';
              } else if (b.status === 'completed') {
                pickupStatus = 'Uploaded';
                returnStatus = 'Uploaded';
              } else if (b.status === 'pending' || b.status === 'confirmed' || b.status === 'cancelled') {
                pickupStatus = 'Pending';
                returnStatus = 'Pending';
              }

              const pickupBadgeClass = pickupStatus === 'Uploaded' ? 'success' : 'pending';
              const returnBadgeClass = returnStatus === 'Uploaded' ? 'success' : 'pending';

              return `
              <tr>
                <td><code style="font-family:var(--font-mono); font-size:var(--fs-xs);">${b.id}</code></td>
                <td>
                  <div style="font-weight:var(--fw-semibold); color:var(--color-dark-text);">${Utils.escapeHtml(b.user)}</div>
                  <div style="font-size:10px; color:var(--color-light-text);">${Utils.escapeHtml(b.email)}</div>
                </td>
                <td style="font-size:var(--fs-xs);">${Utils.escapeHtml(b.vehicle)}</td>
                <td style="font-size:var(--fs-xs);">${Utils.formatDate(b.pickup)}</td>
                <td style="font-size:var(--fs-xs);">${Utils.formatDate(b.returnDate)}</td>
                <td><span class="db-badge db-badge--${statusBadgeMap[b.status] || 'inactive'}">${Utils.statusLabel(b.status === 'confirmed' ? 'upcoming' : b.status)}</span></td>
                <td><span class="db-badge db-badge--${pickupBadgeClass}">${pickupStatus}</span></td>
                <td><span class="db-badge db-badge--${returnBadgeClass}">${returnStatus}</span></td>
                <td>
                  <div style="display:flex; gap:var(--space-2); flex-wrap:wrap; max-width:220px;">
                    <button class="btn btn--outline btn--sm" style="padding:4px 8px; font-size:10px;" onclick="AdminDashboard.showBookingDetails('${b.id}')">View</button>
                    ${b.status === 'pending' ? `
                      <button class="btn btn--primary btn--sm" style="padding:4px 8px; font-size:10px;" onclick="AdminDashboard.approveBookingModal('${b.id}')">Approve</button>
                      <button class="btn btn--ghost btn--sm" style="padding:4px 8px; font-size:10px; color:var(--color-danger);" onclick="AdminDashboard.rejectBookingModal('${b.id}')">Reject</button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      </div>
    `;

    pagination.innerHTML = `
      <div style="font-size: var(--fs-xs); color: var(--color-light-text);">
        Showing <strong>${startIdx + 1}</strong> to <strong>${Math.min(startIdx + state.bookingsItemsPerPage, totalItems)}</strong> of <strong>${totalItems}</strong> bookings
      </div>
      <div style="display:flex; gap:var(--space-2);">
        <button class="btn btn--outline btn--sm" ${state.bookingsCurrentPage === 1 ? 'disabled' : ''} onclick="AdminDashboard.setBookingsPage(${state.bookingsCurrentPage - 1})">Prev</button>
        ${Array.from({length: totalPages}).map((_, i) => `
          <button class="btn btn--sm ${state.bookingsCurrentPage === (i+1) ? 'btn--primary' : 'btn--outline'}" onclick="AdminDashboard.setBookingsPage(${i + 1})">${i + 1}</button>
        `).join('')}
        <button class="btn btn--outline btn--sm" ${state.bookingsCurrentPage === totalPages ? 'disabled' : ''} onclick="AdminDashboard.setBookingsPage(${state.bookingsCurrentPage + 1})">Next</button>
      </div>
    `;
    if (typeof lucide !== 'undefined') {
      try { lucide.createIcons(); } catch(e) {}
    }
  }

  function setBookingsPage(p) {
    AdminState.uiState.bookingsCurrentPage = p;
    saveUiState();
    _renderBookingsList();
  }


  /* ============================================================
     18.2 PRE-BOOKINGS VIEW CONTROLLER
     ============================================================ */
  function _renderPreBookingsTab(container) {
    const state = AdminState.uiState;
    const pbs = AdminState.preBookingsData;

    container.innerHTML = `
      <!-- Stats Summary -->
      <div class="db-stats-grid db-animate-stagger" style="grid-template-columns: repeat(4, 1fr); gap:var(--space-4); margin-bottom:var(--space-6);">
        ${_statCard('icon-clipboard', 'primary', 'Pending Reviews', pbs.filter(p=>p.status==='pending').length, 'Requires validation')}
        ${_statCard('icon-check-circle', 'success', 'Approved requests', pbs.filter(p=>p.status==='approved').length, 'Converted to booking')}
        ${_statCard('icon-warning', 'warning', 'Alternatives Offered', pbs.filter(p=>p.status==='alternative').length, 'Awaiting user choice')}
        ${_statCard('icon-close', 'danger', 'Declined requests', pbs.filter(p=>p.status==='rejected').length, 'Archived logs')}
      </div>

      <!-- Filter bar -->
      <div class="db-section-card db-animate-in" style="margin-bottom: var(--space-6);">
        <div class="db-filter-bar">
          <div class="db-filter-bar__search" style="max-width: 240px;">
            <input type="text" class="db-filter-bar__search-input" id="pb-search" placeholder="Search reference, name..." value="${Utils.escapeHtml(state.pbSearch || '')}">
          </div>

          <select class="db-filter-bar__select" id="pb-status-filter">
            <option value="all" ${state.pbStatusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
            <option value="pending" ${state.pbStatusFilter === 'pending' ? 'selected' : ''}>Pending Review</option>
            <option value="approved" ${state.pbStatusFilter === 'approved' ? 'selected' : ''}>Approved</option>
            <option value="alternative" ${state.pbStatusFilter === 'alternative' ? 'selected' : ''}>Alternative Suggested</option>
            <option value="rejected" ${state.pbStatusFilter === 'rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </div>

        <div id="prebookings-table-container" class="db-section-card__body db-section-card__body--flush">
          <!-- Populated by JS -->
        </div>

        <div class="db-section-card__footer" id="pb-pagination" style="display:flex; justify-content:space-between; align-items:center;">
          <!-- Pagination indicators -->
        </div>
      </div>
    `;

    _bindPBListFilters();
    _renderPreBookingsList();
  }

  function _bindPBListFilters() {
    const search = document.getElementById('pb-search');
    const status = document.getElementById('pb-status-filter');

    const update = () => {
      const state = AdminState.uiState;
      state.pbSearch = search ? search.value : '';
      state.pbStatusFilter = status ? status.value : 'all';
      state.pbCurrentPage = 1;
      saveUiState();
      _renderPreBookingsList();
    };

    if (search) search.addEventListener('input', Utils.debounce(update, 250));
    if (status) status.addEventListener('change', update);
  }

  function _renderPreBookingsList() {
    const container = document.getElementById('prebookings-table-container');
    const pagination = document.getElementById('pb-pagination');
    if (!container || !pagination) return;

    const state = AdminState.uiState;
    let data = [...AdminState.preBookingsData];

    // Filter search
    if (state.pbSearch) {
      const q = state.pbSearch.toLowerCase();
      data = data.filter(p => `${p.reference} ${p.user} ${p.vehicleName} ${p.email}`.toLowerCase().includes(q));
    }
    // Filter status
    if (state.pbStatusFilter !== 'all') data = data.filter(p => p.status === state.pbStatusFilter);

    if (data.length === 0) {
      container.innerHTML = _renderEmptyState('icon-clipboard', 'No Pre-Bookings Found', 'No pre-booking requests matched your queries.');
      pagination.innerHTML = '';
      if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch(e) {}
      }
      return;
    }

    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / state.pbItemsPerPage);
    if (state.pbCurrentPage > totalPages) state.pbCurrentPage = totalPages || 1;
    const startIdx = (state.pbCurrentPage - 1) * state.pbItemsPerPage;
    const paginatedData = data.slice(startIdx, startIdx + state.pbItemsPerPage);

    const statusBadgeMap = { pending:'pending', approved:'approved', rejected:'rejected', alternative:'waiting', expired:'expired' };
    const statusLabelMap = { pending:'Pending Review', approved:'Approved', rejected:'Rejected', alternative:'Alternative Offered', expired:'Expired' };

    container.innerHTML = `
      <div class="db-table-wrapper" style="margin:0;">
        <table class="db-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Customer</th>
              <th>Requested Vehicle</th>
              <th>Lease Dates</th>
              <th>Availability</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${paginatedData.map(p => `
              <tr>
                <td><code style="font-family:var(--font-mono); font-size:var(--fs-xs);">${p.reference}</code></td>
                <td>
                  <div style="font-weight:var(--fw-semibold); color:var(--color-dark-text);">${Utils.escapeHtml(p.user)}</div>
                  <div style="font-size:10px; color:var(--color-light-text);">${Utils.escapeHtml(p.email)}</div>
                </td>
                <td style="font-size:var(--fs-xs);">${Utils.escapeHtml(p.vehicleName)}</td>
                <td style="font-size:var(--fs-xs);">${p.pickupDate} – ${p.returnDate}</td>
                <td>
                  <span class="db-badge db-badge--${p.availability==='Available'?'available':p.availability==='Expired'?'inactive':'rejected'}">
                    ${p.availability}
                  </span>
                </td>
                <td><span class="db-badge db-badge--${statusBadgeMap[p.status]}">${statusLabelMap[p.status]}</span></td>
                <td>
                  <div style="display:flex; gap:var(--space-2); flex-wrap:wrap; max-width:220px;">
                    <button class="btn btn--outline btn--sm" style="padding:4px 8px; font-size:10px;" onclick="AdminDashboard.showPreBookingDetails('${p.id}')">View</button>
                    ${p.status === 'pending' ? `
                      <button class="btn btn--primary btn--sm" style="padding:4px 8px; font-size:10px;" onclick="AdminDashboard.approvePreBooking('${p.id}')">Approve</button>
                      <button class="btn btn--ghost btn--sm" style="padding:4px 8px; font-size:10px; color:var(--color-danger);" onclick="AdminDashboard.rejectPreBooking('${p.id}')">Reject</button>
                      <button class="btn btn--ghost btn--sm" style="padding:4px 8px; font-size:10px; color:var(--color-secondary);" onclick="AdminDashboard.showAlternativeSuggestionWizard('${p.id}')">Suggest Alternative</button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    pagination.innerHTML = `
      <div style="font-size: var(--fs-xs); color: var(--color-light-text);">
        Showing <strong>${startIdx + 1}</strong> to <strong>${Math.min(startIdx + state.pbItemsPerPage, totalItems)}</strong> of <strong>${totalItems}</strong> requests
      </div>
      <div style="display:flex; gap:var(--space-2);">
        <button class="btn btn--outline btn--sm" ${state.pbCurrentPage === 1 ? 'disabled' : ''} onclick="AdminDashboard.setPBPage(${state.pbCurrentPage - 1})">Prev</button>
        ${Array.from({length: totalPages}).map((_, i) => `
          <button class="btn btn--sm ${state.pbCurrentPage === (i+1) ? 'btn--primary' : 'btn--outline'}" onclick="AdminDashboard.setPBPage(${i + 1})">${i + 1}</button>
        `).join('')}
        <button class="btn btn--outline btn--sm" ${state.pbCurrentPage === totalPages ? 'disabled' : ''} onclick="AdminDashboard.setPBPage(${state.pbCurrentPage + 1})">Next</button>
      </div>
    `;
    if (typeof lucide !== 'undefined') {
      try { lucide.createIcons(); } catch(e) {}
    }
  }

  function setPBPage(p) {
    AdminState.uiState.pbCurrentPage = p;
    saveUiState();
    _renderPreBookingsList();
  }


  /* ============================================================
     18.3 BOOKING DETAILS OVERVIEW MODAL
     ============================================================ */
  function showBookingDetails(id) {
    const b = AdminState.bookingData.find(x => x.id === id);
    if (!b) return;

    // Populate Modal Fields
    document.getElementById('bd-modal-id').textContent = b.id;
    document.getElementById('bd-modal-customer-name').textContent = b.user;
    document.getElementById('bd-modal-customer-phone').textContent = b.phone || '+1 (555) 000-0000';
    document.getElementById('bd-modal-customer-email').textContent = b.email;

    // Vehicle image from the real booking data
    let carImage = b.image || 'assets/images/cars/luxury.png';

    document.getElementById('bd-modal-car-img').innerHTML = `<img src="${carImage}" alt="${b.vehicle}" style="width:100%; height:auto; border-radius:var(--radius-sm);" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHlsZT0iYmFja2dyb3VuZDojRjNGNEY2O3dpZHRoOjEwMCU7aGVpZ2h0OjEwMCU7cGFkZGluZzoyMHB4OyI+PHBhdGggZD0iTTE5IDE3aDJjLjYgMCAxLS40IDEtMXYtM2MwLS45LS43LTEuNy0xLjUtMS45QzE4LjcgMTAuNiAxNiAxMCAxNiAxMHMtMS4zLTEuNC0yLjItMi4zYy0uNS0uNC0xLjEtLjctMS44LS43SDVjLS42IDAtMS4xLjQtMS40LjlsLTEuNCAyLjlBMy43IDMuNyAwIDAgMCAxIDEzdjNjMCAuNi40IDEgMSAxaDIiLz48Y2lyY2xlIGN4PSI3IiBjeT0iMTciIHI9IjIiLz48cGF0aCBkPSJNOSAxN2g2Ii8+PGNpcmNsZSBjeD0iMTciIGN5PSIxNyIgcj0iMiIvPjwvc3ZnPg==';">`;
    document.getElementById('bd-modal-car-name').textContent = b.vehicle + (b.carCategory ? ` · ${b.carCategory}` : '');
    document.getElementById('bd-modal-car-price').textContent = Utils.formatCurrency(b.total) + ` (${b.type})`;

    document.getElementById('bd-modal-booking-date').textContent = b.date ? Utils.formatDate(b.date) : '—';
    document.getElementById('bd-modal-pickup-time').textContent = (b.pickup ? Utils.formatDate(b.pickup) + ' ' : '') + (b.pickupTime || '—');
    document.getElementById('bd-modal-return-time').textContent = (b.returnDate ? Utils.formatDate(b.returnDate) + ' ' : '') + (b.returnTime || '—');
    
    // Remaining time computed from real rental windows
    let remaining = 'Completed';
    const nowTs = Date.now();
    const pickupTs = b.pickupDateTimeISO ? new Date(b.pickupDateTimeISO).getTime() : null;
    const returnTs = b.returnDateTimeISO ? new Date(b.returnDateTimeISO).getTime() : null;
    if (b.status === 'active' || b.status === 'extended') {
      if (returnTs && returnTs > nowTs) {
        const hrs = Math.ceil((returnTs - nowTs) / (1000 * 60 * 60));
        remaining = hrs >= 24 ? `${Math.floor(hrs / 24)} Days, ${hrs % 24} Hours` : `${hrs} Hours`;
      } else {
        remaining = 'Return overdue';
      }
    } else if (b.status === 'confirmed' || b.status === 'pending') {
      if (pickupTs && pickupTs > nowTs) {
        const days = Math.ceil((pickupTs - nowTs) / (1000 * 60 * 60 * 24));
        remaining = `Starts in ${days} Day${days > 1 ? 's' : ''}`;
      } else {
        remaining = 'Pickup due';
      }
    } else if (b.status === 'cancelled') {
      remaining = 'Cancelled';
    }
    document.getElementById('bd-modal-remaining-time').textContent = remaining;

    // Status Badge
    const statusMap = { pending:'pending', confirmed:'upcoming', active:'active', extended:'extended', completed:'completed', cancelled:'cancelled' };
    const mappedStatus = statusMap[b.status] || 'inactive';
    document.getElementById('bd-modal-status-badge').innerHTML = `<span class="db-badge db-badge--${mappedStatus === 'upcoming' || mappedStatus === 'active' || mappedStatus === 'completed' ? 'success' : mappedStatus === 'extended' ? 'info' : 'pending'}">${Utils.statusLabel(mappedStatus)}</span>`;

    // Photo Statuses
    let pickupStatus = 'Pending';
    let returnStatus = 'Pending';
    if (b.status === 'active' || b.status === 'extended') {
      pickupStatus = 'Uploaded';
      returnStatus = 'Pending';
    } else if (b.status === 'completed') {
      pickupStatus = 'Uploaded';
      returnStatus = 'Uploaded';
    } else if (b.status === 'pending' || b.status === 'confirmed' || b.status === 'cancelled') {
      pickupStatus = 'Pending';
      returnStatus = 'Pending';
    }

    const pIcon = pickupStatus === 'Uploaded' ? 'icon-check-circle' : 'icon-camera';
    const rIcon = returnStatus === 'Uploaded' ? 'icon-check-circle' : 'icon-camera';
    const pColor = pickupStatus === 'Uploaded' ? 'var(--color-success)' : 'var(--color-light-text)';
    const rColor = returnStatus === 'Uploaded' ? 'var(--color-success)' : 'var(--color-light-text)';
    const pThumb = b.pickupPhotoUrl
      ? `<img src="${b.pickupPhotoUrl}" alt="Pickup photo" style="width:56px; height:40px; object-fit:cover; border-radius:var(--radius-sm); margin-bottom: var(--space-2); display:block;">`
      : `<span class="icon" style="color: ${pColor}; margin-bottom: var(--space-2);"><svg><use href="assets/icons/sprite.svg#${pIcon}"/></svg></span>`;
    const rThumb = b.returnPhotoUrl
      ? `<img src="${b.returnPhotoUrl}" alt="Return photo" style="width:56px; height:40px; object-fit:cover; border-radius:var(--radius-sm); margin-bottom: var(--space-2); display:block;">`
      : `<span class="icon" style="color: ${rColor}; margin-bottom: var(--space-2);"><svg><use href="assets/icons/sprite.svg#${rIcon}"/></svg></span>`;

    document.getElementById('bd-modal-pickup-photo-status').parentElement.innerHTML = `
      ${pThumb}
      <span id="bd-modal-pickup-photo-status" style="font-size: var(--fs-xs); color: ${pColor}; font-weight: var(--fw-semibold);">Pickup Photo<br>${pickupStatus}</span>
    `;
    
    document.getElementById('bd-modal-return-photo-status').parentElement.innerHTML = `
      ${rThumb}
      <span id="bd-modal-return-photo-status" style="font-size: var(--fs-xs); color: ${rColor}; font-weight: var(--fw-semibold);">Return Photo<br>${returnStatus}</span>
    `;

    // Timeline from real rental timestamps
    const fmt = (iso) => iso ? new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--';
    const timelineData = [
      { label: 'Booked', active: true, time: b.date ? fmt(b.pickupDateTimeISO || b.date) : '--' },
      { label: 'Pickup Uploaded', active: !!(b.pickupPhotoUrl), time: b.pickupPhotoUrl ? fmt(b.rentalStartTime) : '--' },
      { label: 'Rental Active', active: (b.status === 'active' || b.status === 'extended' || b.status === 'completed'), time: (b.status === 'active' || b.status === 'extended' || b.status === 'completed') ? fmt(b.rentalStartTime) : '--' },
      { label: 'Rental Extended', active: (b.extensions && b.extensions.length > 0), time: (b.extensions && b.extensions.length > 0) ? fmt(b.extensions[0].extendedAt) : '--' },
      { label: 'Return Uploaded', active: !!(b.returnPhotoUrl), time: b.returnPhotoUrl ? fmt(b.rentalEndTime) : '--' },
      { label: 'Rental Completed', active: (b.status === 'completed'), time: (b.status === 'completed') ? fmt(b.rentalEndTime) : '--' }
    ];

    if (b.status === 'cancelled') {
      timelineData.splice(1, 5);
      timelineData.push({ label: 'Cancelled', active: true, time: b.returnDateTimeISO ? fmt(b.returnDateTimeISO) : '--' });
    }

    document.getElementById('bd-modal-timeline').innerHTML = timelineData.map((t, idx) => {
      const dot = t.active ? 'db-timeline__dot--success' : '';
      const grayLine = !t.active ? 'opacity: 0.4;' : '';
      return `
        <div class="db-timeline__item" style="${grayLine}">
          <div class="db-timeline__dot ${dot}"></div>
          <div class="db-timeline__time">${t.time}</div>
          <div class="db-timeline__title" style="font-size:var(--fs-xs);">${t.label}</div>
        </div>
      `;
    }).join('');

    // Extension History from real data
    const extList = document.getElementById('bd-modal-extension-list');
    const extContainer = document.getElementById('bd-modal-extension-history');
    if (b.extensions && b.extensions.length > 0) {
      extList.innerHTML = b.extensions.map((ext, i) => `
        <li style="margin-bottom: var(--space-2);">Extension ${i + 1}: +${ext.additionalHours} hour(s). <span style="color:var(--color-success); font-weight:var(--fw-bold); float:right;">Approved</span></li>
        <li style="margin-bottom: var(--space-2); color: var(--color-light-text);">Additional Charge: ${Utils.formatCurrency(ext.additionalAmount || 0)}</li>
      `).join('');
      extContainer.style.display = 'block';
    } else {
      extContainer.style.display = 'none';
      extList.innerHTML = '';
    }

    // Open Modal
    document.getElementById('db-booking-details-modal').classList.add('open');
    document.querySelector('.db-modal-backdrop').classList.add('open');
  }

  function closeBookingDetails() {
    const modal = document.getElementById('db-booking-details-modal');
    if (modal) modal.classList.remove('open');
    const backdrop = document.querySelector('.db-modal-backdrop');
    // Ensure we don't close backdrop if another modal is still open
    if (backdrop && !document.querySelector('.db-modal.open')) {
       backdrop.classList.remove('open');
    }
  }


  /* ============================================================
     18.4 STANDARD BOOKING WIZARD MODALS (APPROVE/REJECT/ASSIGN)
     ============================================================ */
  function approveBookingModal(id) {
    const b = AdminState.bookingData.find(x => x.id === id);
    if (!b) return;

    ModalController.confirm({
      title: 'Approve Rental Booking',
      message: `
        <p>Are you sure you want to approve booking reference <strong>${b.id}</strong>?</p>
        <div style="margin-top:var(--space-3); padding:var(--space-3); background:var(--color-surface); border-radius:var(--radius-md);">
          <div>Customer: <strong>${Utils.escapeHtml(b.user)}</strong></div>
          <div>Vehicle: <strong>${Utils.escapeHtml(b.vehicle)}</strong></div>
          <div>Duration: <strong>${Utils.formatDate(b.pickup)} – ${Utils.formatDate(b.returnDate)}</strong></div>
        </div>
        <p style="font-size:10px; color:var(--color-light-text); margin-top:var(--space-3);">This will change the booking state to Confirmed and notify the customer to proceed to verification.</p>
      `,
      type: 'success',
      confirmText: 'Approve Lease',
      onConfirm: () => {
        b.status = 'confirmed';
        b.timeline.push({ label: 'Approved & Confirmed', time: 'Just now', active: true });
        
        ToastController.show({ title: 'Booking Approved', message: `Lease BK-${b.id} is now confirmed.`, type: 'success' });
        _renderBookingsTabContent();
      }
    });
  }

  function rejectBookingModal(id) {
    const b = AdminState.bookingData.find(x => x.id === id);
    if (!b) return;

    const content = `
      <div class="db-modal__header">
        <h3 class="db-modal__title" style="color:var(--color-danger);">Reject Booking Request</h3>
        <button class="db-modal__close" data-action="close-modal" aria-label="Close">${Utils.icon('icon-close')}</button>
      </div>
      <form onsubmit="AdminDashboard.submitBookingRejection(event, '${id}')">
        <div class="db-modal__body db-rental-detail">
          <p>Please select a formal reason for rejecting booking <strong>${b.id}</strong> (Customer: ${Utils.escapeHtml(b.user)}):</p>
          
          <div style="margin-top:var(--space-4);">
            <label class="db-rental-detail__label" style="margin-bottom:4px;">Rejection Reason</label>
            <select class="db-filter-bar__select" style="width:100%; height:40px;" id="rej-reason-select" required>
              <option value="Vehicle Unavailable">Vehicle Unavailable / Under Maintenance</option>
              <option value="Invalid Documents">Invalid Documents / KYC Validation Failed</option>
              <option value="Payment Failed">Payment Authorization Failed</option>
              <option value="Other">Other Reasons</option>
            </select>
          </div>

          <div style="margin-top:var(--space-4);">
            <label class="db-rental-detail__label" style="margin-bottom:4px;">Additional remarks (Customer notice)</label>
            <textarea class="db-filter-bar__search-input" style="width:100%; height:80px; padding:var(--space-3); resize:none;" id="rej-notes" placeholder="Reason details..." required></textarea>
          </div>
        </div>
        <div class="db-modal__footer">
          <button type="button" class="btn btn--outline btn--sm" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn btn--primary btn--sm btn--danger">Reject Request</button>
        </div>
      </form>
    `;

    ModalController.openDynamic(content, '480px');
  }

  function submitBookingRejection(e, id) {
    e.preventDefault();
    const b = AdminState.bookingData.find(x => x.id === id);
    if (!b) return;

    const reason = document.getElementById('rej-reason-select').value;
    const notes = document.getElementById('rej-notes').value;

    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/admin/bookings/${id}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ reason: `${reason}. ${notes}`.trim() })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) throw new Error(data.message || 'Cancellation failed');
        b.status = 'cancelled';
        b.timeline.push({ label: `Rejected: ${reason}`, time: 'Just now', active: true });

        ModalController.close();
        ToastController.show({ title: 'Booking Rejected', message: `Lease BK-${id} has been rejected. Reason: ${reason}`, type: 'error' });
        _renderBookingsTabContent();
        fetchDashboardData();
      })
      .catch(err => {
        ModalController.close();
        ToastController.show({ title: 'Rejection Failed', message: err.message || 'Could not reject booking.', type: 'error' });
      });
  }

  function assignVehicleModal(id) {
    const b = AdminState.bookingData.find(x => x.id === id);
    if (!b) return;

    // Get available vehicles from fleetData
    const avVehicles = AdminState.fleetData.filter(v => v.status === 'available');

    const content = `
      <div class="db-modal__header">
        <h3 class="db-modal__title">Assign Vehicle to Booking</h3>
        <button class="db-modal__close" data-action="close-modal" aria-label="Close">${Utils.icon('icon-close')}</button>
      </div>
      <form onsubmit="AdminDashboard.submitVehicleAssignment(event, '${id}')">
        <div class="db-modal__body db-rental-detail">
          <div style="display:flex; justify-content:space-between; margin-bottom:var(--space-4);">
            <div>
              <div style="font-size:10px; color:var(--color-light-text);">Active Booking Reference</div>
              <strong>${b.id}</strong> (User: ${Utils.escapeHtml(b.user)})
            </div>
            <div>
              <div style="font-size:10px; color:var(--color-light-text);">Requested model</div>
              <strong>${Utils.escapeHtml(b.vehicle)}</strong>
            </div>
          </div>

          <div style="margin-top:var(--space-4);">
            <label class="db-rental-detail__label" style="margin-bottom:4px;">Available Vehicles on Lot</label>
            <select class="db-filter-bar__select" style="width:100%; height:40px;" id="assign-veh-select" required>
              ${avVehicles.map(v => `<option value="${v.id}">${v.brand} ${v.model} (Plate: ${v.plate} · Rate: ${Utils.formatCurrency(v.dailyRate)}/day)</option>`).join('')}
              ${avVehicles.length === 0 ? '<option value="" disabled>No available vehicles in fleet</option>' : ''}
            </select>
          </div>
        </div>
        <div class="db-modal__footer">
          <button type="button" class="btn btn--outline btn--sm" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn btn--primary btn--sm" ${avVehicles.length === 0 ? 'disabled' : ''}>Assign Vehicle</button>
        </div>
      </form>
    `;

    ModalController.openDynamic(content, '480px');
  }

  function submitVehicleAssignment(e, id) {
    e.preventDefault();
    const b = AdminState.bookingData.find(x => x.id === id);
    if (!b) return;

    const vehId = document.getElementById('assign-veh-select').value;
    const v = AdminState.fleetData.find(x => x.id === vehId);
    if (!v) return;

    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/admin/bookings/${id}/assign-vehicle`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ carId: v.carId || vehId })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) throw new Error(data.message || 'Assignment failed');
        b.vehicleId = v.carId || vehId;
        b.vehicle = `${v.brand} ${v.model}`;
        b.timeline.push({ label: `Vehicle Assigned: ${v.brand} ${v.model}`, time: 'Just now', active: true });
        ModalController.close();
        ToastController.show({ title: 'Vehicle Assigned', message: `Vehicle ${v.brand} ${v.model} assigned to booking ${b.id}.`, type: 'success' });
        _renderBookingsTabContent();
        fetchDashboardData();
      })
      .catch(err => {
        ModalController.close();
        ToastController.show({ title: 'Assignment Failed', message: err.message || 'Could not assign vehicle.', type: 'error' });
      });
  }


  /* ============================================================
     18.5 PRE-BOOKING DISPATCH WORKFLOWS
     ============================================================ */
  function showPreBookingDetails(id) {
    const p = AdminState.preBookingsData.find(x => x.id === id);
    if (!p) return;

    const statusBadgeMap = { pending:'pending', approved:'approved', rejected:'rejected', alternative:'waiting', expired:'expired' };
    const statusLabelMap = { pending:'Pending Review', approved:'Approved', rejected:'Rejected', alternative:'Alternative Suggested', expired:'Expired' };

    const content = `
      <div class="db-modal__header">
        <h3 class="db-modal__title">Pre-Booking Request Profile</h3>
        <button class="db-modal__close" data-action="close-modal" aria-label="Close">${Utils.icon('icon-close')}</button>
      </div>
      <div class="db-modal__body db-rental-detail">
        <h4 class="db-rental-detail__section-title" style="margin-top:0;">Request Details</h4>
        <div class="db-rental-detail__grid" style="grid-template-columns: repeat(2, 1fr);">
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Customer Name</span><span class="db-rental-detail__value">${Utils.escapeHtml(p.user)}</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Email address</span><span class="db-rental-detail__value">${Utils.escapeHtml(p.email)}</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Requested Vehicle</span><span class="db-rental-detail__value">${Utils.escapeHtml(p.vehicleName)}</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Lease Dates</span><span class="db-rental-detail__value">${p.pickupDate} – ${p.returnDate}</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Estimated Billing</span><span class="db-rental-detail__value">${Utils.formatCurrency(p.estimatedCost)}</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Current Request Status</span><span class="db-rental-detail__value"><span class="db-badge db-badge--${statusBadgeMap[p.status]}">${statusLabelMap[p.status]}</span></span></div>
        </div>

        <div style="margin-top:var(--space-4); padding:var(--space-3); background:var(--color-surface); border-radius:var(--radius-md);">
          <div style="font-weight:var(--fw-semibold); color:var(--color-dark-text); font-size:var(--fs-xs);">Notes from Customer:</div>
          <p style="font-size:10px; color:var(--color-light-text); margin-top:2px;">"${p.notes || 'No custom notes provided.'}"</p>
        </div>

        ${p.status==='alternative' && p.suggestion ? `
          <h4 class="db-rental-detail__section-title">Offered Alternative Suggestions</h4>
          <div style="padding:var(--space-3); border:1px dashed var(--color-secondary); border-radius:var(--radius-md); background:var(--color-surface); font-size:var(--fs-xs);">
            <div>Offered Vehicle: <strong>${Utils.escapeHtml(p.suggestion.suggestedVehicle)}</strong></div>
            <div style="font-size:10px; color:var(--color-light-text); margin-top:2px;">Reason: "${Utils.escapeHtml(p.suggestion.reason)}" (Dispatched ${p.suggestion.sentOn})</div>
          </div>
        `:''}
      </div>
      <div class="db-modal__footer">
        <button class="btn btn--outline btn--sm" data-action="close-modal">Close Window</button>
        ${p.status === 'pending' ? `
          <button class="btn btn--primary btn--sm" onclick="AdminDashboard.approvePreBooking('${p.id}')">Approve</button>
        ` : ''}
      </div>
    `;

    ModalController.openDynamic(content, '540px');
  }

  function approvePreBooking(id) {
    const p = AdminState.preBookingsData.find(x => x.id === id);
    if (!p) return;

    ModalController.confirm({
      title: 'Approve Pre-Booking',
      message: `<p>Approve pre-booking request <strong>${p.reference}</strong> for ${Utils.escapeHtml(p.user)}?</p><p style="font-size:10px; color:var(--color-light-text); margin-top:var(--space-2);">This turns the request to Approved status, letting the user finish their checkout flow.</p>`,
      type: 'success',
      confirmText: 'Approve Request',
      onConfirm: () => {
        const token = localStorage.getItem('token');
        fetch(`http://localhost:5000/api/admin/bookings/${id}/approve-pre-booking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (!data.success) throw new Error(data.message || 'Approval failed');
            p.status = 'approved';
            p.availability = 'Available';
            ToastController.show({ title: 'Request Approved', message: `Pre-booking ${p.reference} approved.`, type: 'success' });
            _renderBookingsTabContent();
            fetchDashboardData();
          })
          .catch(err => {
            ToastController.show({ title: 'Approval Failed', message: err.message || 'Could not approve request.', type: 'error' });
          });
      }
    });
  }

  function rejectPreBooking(id) {
    const p = AdminState.preBookingsData.find(x => x.id === id);
    if (!p) return;

    const content = `
      <div class="db-modal__header">
        <h3 class="db-modal__title" style="color:var(--color-danger);">Reject Pre-Booking Request</h3>
        <button class="db-modal__close" data-action="close-modal" aria-label="Close">${Utils.icon('icon-close')}</button>
      </div>
      <form onsubmit="AdminDashboard.submitPreBookingRejection(event, '${id}')">
        <div class="db-modal__body db-rental-detail">
          <p>Provide rejection comments for request <strong>${p.reference}</strong>:</p>
          
          <div style="margin-top:var(--space-4);">
            <label class="db-rental-detail__label" style="margin-bottom:4px;">Rejection Comments</label>
            <textarea class="db-filter-bar__search-input" style="width:100%; height:80px; padding:var(--space-3); resize:none;" id="pb-rej-notes" placeholder="Please describe why this request cannot be processed..." required></textarea>
          </div>
        </div>
        <div class="db-modal__footer">
          <button type="button" class="btn btn--outline btn--sm" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn btn--primary btn--sm btn--danger">Reject Request</button>
        </div>
      </form>
    `;

    ModalController.openDynamic(content, '480px');
  }

  function submitPreBookingRejection(e, id) {
    e.preventDefault();
    const p = AdminState.preBookingsData.find(x => x.id === id);
    if (!p) return;

    const notes = document.getElementById('pb-rej-notes').value;
    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/admin/bookings/${id}/reject-pre-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ reason: notes })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) throw new Error(data.message || 'Rejection failed');
        p.status = 'rejected';
        p.rejectionReason = notes;
        p.availability = 'Unavailable';

        ModalController.close();
        ToastController.show({ title: 'Request Rejected', message: `Pre-booking ${p.reference} declined.`, type: 'error' });
        _renderBookingsTabContent();
        fetchDashboardData();
      })
      .catch(err => {
        ModalController.close();
        ToastController.show({ title: 'Rejection Failed', message: err.message || 'Could not reject request.', type: 'error' });
      });
  }


  /* ============================================================
     18.6 SMART ALTERNATIVE VEHICLE SUGGESTION WIZARD (4 STEPS)
     ============================================================ */
  let suggestionWizardStep = 1;
  let activePrebookingId = null;
  let selectedAlternativeVehicleId = null;

  function showAlternativeSuggestionWizard(pbId) {
    activePrebookingId = pbId;
    suggestionWizardStep = 1;
    selectedAlternativeVehicleId = null;

    const p = AdminState.preBookingsData.find(x => x.id === pbId);
    if (!p) return;

    // Filter smart recommendations dynamically
    const priceLimitLow = p.estimatedCost / 5 - 100; // Daily rate approximation
    const priceLimitHigh = p.estimatedCost / 5 + 100;
    
    // 1. Same Price Range Suggestions
    const samePriceSuggestions = AdminState.fleetData.filter(v => 
      v.status === 'available' && 
      v.dailyRate >= priceLimitLow && 
      v.dailyRate <= priceLimitHigh && 
      v.brand + ' ' + v.model !== p.vehicleName
    );

    // 2. Similar Specifications Suggestions (Same Category)
    const similarSpecificationSuggestions = AdminState.fleetData.filter(v => 
      v.status === 'available' && 
      v.category.includes(p.vehicleName.includes('SUV') ? 'SUV' : 'Sedan') && 
      v.brand + ' ' + v.model !== p.vehicleName
    );

    const content = `
      <div class="db-modal__header">
        <h3 class="db-modal__title">Suggest Alternative Vehicle</h3>
        <button class="db-modal__close" data-action="close-modal" aria-label="Close">${Utils.icon('icon-close')}</button>
      </div>

      <!-- Timeline steps -->
      <div style="background:var(--color-surface); padding: var(--space-4) var(--space-6); border-bottom:1px solid var(--color-border-light);">
        <div style="display:flex; justify-content:space-between; align-items:center; max-width:450px; margin:0 auto; position:relative;">
          <div style="position:absolute; top:12px; left:5%; right:5%; height:2px; background:var(--color-border-light); z-index:0;"></div>
          <div id="sug-progress-line" style="position:absolute; top:12px; left:5%; width:0%; height:2px; background:var(--color-secondary); z-index:0; transition: width 0.3s ease;"></div>
          
          ${_renderWizardStepIndicator(1, 'Requested')}
          ${_renderWizardStepIndicator(2, 'Smart Picks')}
          ${_renderWizardStepIndicator(3, 'Preview')}
          ${_renderWizardStepIndicator(4, 'Dispatch')}
        </div>
      </div>

      <div class="db-modal__body db-rental-detail" style="max-height: 480px; overflow-y:auto;">
        
        <!-- STEP 1: REQUESTED VEHICLE -->
        <div class="sug-step-content" id="sug-step-1">
          <p style="margin-bottom:var(--space-4);">Below are details of the customer's unavailable reservation request:</p>
          <div style="display:flex; gap:var(--space-4); align-items:center; background:var(--color-surface); padding:var(--space-4); border-radius:var(--radius-lg); border:1px solid var(--color-border-light); margin-bottom:var(--space-5);">
            <div style="width:120px; height:80px; background:#000; border-radius:var(--radius-md); overflow:hidden;">
              <img src="assets/images/cars/suv.png" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <div>
              <h4 style="font-weight:var(--fw-semibold); color:var(--color-dark-text);">${Utils.escapeHtml(p.vehicleName)}</h4>
              <div style="font-size:10px; color:var(--color-light-text);">Reference: ${p.reference}</div>
              <div style="font-size:10px; color:var(--color-light-text); margin-top:2px;">Requested Dates: ${p.pickupDate} – ${p.returnDate}</div>
            </div>
          </div>

          <div>
            <label class="db-rental-detail__label" style="margin-bottom:4px;">Reason for Unavailability *</label>
            <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="sug-unavail-reason" value="Fully reserved for requested dates" required>
          </div>
        </div>

        <!-- STEP 2: SUGGESTED ALTERNATIVE VEHICLES -->
        <div class="sug-step-content" id="sug-step-2" style="display:none;">
          <!-- Category 1: Price suggestions -->
          <h4 class="db-rental-detail__section-title" style="margin-top:0;">Same Price Range Suggestions ($300 – $600/day)</h4>
          <div class="db-rentals-grid" style="grid-template-columns: repeat(2,1fr); gap:var(--space-3); padding:0; margin-bottom:var(--space-5);">
            ${samePriceSuggestions.map(v => _renderSuggestionSelectCard(v)).join('')}
            ${samePriceSuggestions.length === 0 ? '<div style="font-size:10px; color:var(--color-light-text); padding:var(--space-2);">No available vehicles in this price bracket.</div>' : ''}
          </div>

          <!-- Category 2: Spec suggestions -->
          <h4 class="db-rental-detail__section-title">Similar Specifications Suggestions</h4>
          <div class="db-rentals-grid" style="grid-template-columns: repeat(2,1fr); gap:var(--space-3); padding:0;">
            ${similarSpecificationSuggestions.map(v => _renderSuggestionSelectCard(v)).join('')}
            ${similarSpecificationSuggestions.length === 0 ? '<div style="font-size:10px; color:var(--color-light-text); padding:var(--space-2);">No similar specification vehicles available.</div>' : ''}
          </div>
        </div>

        <!-- STEP 3: PREVIEW SELECTED VEHICLE -->
        <div class="sug-step-content" id="sug-step-3" style="display:none;">
          <div id="suggestion-preview-details">
            <!-- Rendered when step becomes active -->
          </div>
        </div>

        <!-- STEP 4: CONFIRM DISPATCH -->
        <div class="sug-step-content" id="sug-step-4" style="display:none;">
          <div style="text-align:center; padding: var(--space-5) 0;">
            <div style="font-size:2.5rem; color:var(--color-secondary); margin-bottom:var(--space-3);">${Utils.icon('icon-send')}</div>
            <h4 style="font-family:var(--font-heading); font-size:var(--fs-h4); color:var(--color-dark-text);">Ready to Dispatch Suggestion</h4>
            <p style="font-size:var(--fs-xs); color:var(--color-light-text); max-width:400px; margin: var(--space-2) auto var(--space-5) auto;">This suggestion envelope will be sent to the customer dashboard profile. They can accept the change or reject to cancel.</p>
          </div>
          
          <div style="background:var(--color-surface); padding:var(--space-4); border-radius:var(--radius-lg); border:1px solid var(--color-border-light);">
            <div style="font-size:var(--fs-xs); color:var(--color-light-text); margin-bottom:8px;">Suggestion Summary</div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:var(--fs-xs);"><span>Customer Profile</span><strong>${Utils.escapeHtml(p.user)}</strong></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:var(--fs-xs);"><span>Requested vehicle</span><span style="color:var(--color-danger); text-decoration:line-through;">${Utils.escapeHtml(p.vehicleName)}</span></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:var(--fs-xs);"><span>Offered vehicle alternative</span><strong style="color:var(--color-success);" id="sug-summary-offered-veh">Mercedes-Benz S-Class</strong></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:var(--fs-xs);"><span>Offered Daily Price</span><strong id="sug-summary-offered-price">$450/day</strong></div>
          </div>
        </div>

      </div>

      <div class="db-modal__footer" id="sug-modal-footer">
        <!-- Wizard buttons -->
      </div>
    `;

    ModalController.openDynamic(content, '540px');
    _updateSuggestionWizardUI();
  }

  function _renderSuggestionSelectCard(v) {
    return `
      <div class="db-pb-card__alt-vehicle" id="sug-veh-card-${v.id}" style="border:1px solid var(--color-border-light); padding:var(--space-3); border-radius:var(--radius-md); display:flex; gap:var(--space-3); cursor:pointer; background:var(--color-surface);" onclick="AdminDashboard.selectAlternativeVehicle('${v.id}')">
        <img src="${v.images[0] || 'assets/images/cars/luxury.png'}" style="width:70px; height:50px; object-fit:cover; border-radius:var(--radius-md); background:#000;">
        <div>
          <div style="font-size:var(--fs-xs); font-weight:var(--fw-semibold); color:var(--color-dark-text);">${v.brand} ${v.model}</div>
          <div style="font-size:9px; color:var(--color-light-text);">${v.specs.transmission} · ${v.specs.seats} seats</div>
          <div style="font-size:10px; font-weight:var(--fw-bold); color:var(--color-secondary); margin-top:2px;">${Utils.formatCurrency(v.dailyRate)}/day</div>
        </div>
      </div>
    `;
  }

  function selectAlternativeVehicle(vId) {
    selectedAlternativeVehicleId = vId;

    // Toggle active borders in Step 2 cards
    const cards = document.querySelectorAll('.db-pb-card__alt-vehicle');
    cards.forEach(c => { c.style.borderColor = 'var(--color-border-light)'; c.style.boxShadow = 'none'; });
    
    const activeCard = document.getElementById(`sug-veh-card-${vId}`);
    if (activeCard) {
      activeCard.style.borderColor = 'var(--color-secondary)';
      activeCard.style.boxShadow = '0 0 8px rgba(198,169,98,0.15)';
    }

    ToastController.show({
      title: 'Alternative Selected',
      message: 'Click Next to preview specs details.',
      type: 'info'
    });
  }

  function _updateSuggestionWizardUI() {
    // Show/hide step sections
    for (let i = 1; i <= 4; i++) {
      const sec = document.getElementById(`sug-step-${i}`);
      if (sec) sec.style.display = i === suggestionWizardStep ? 'block' : 'none';
      
      const ind = document.getElementById(`wiz-ind-${i}`);
      if (ind) {
        const circle = ind.querySelector('.wiz-circle');
        const span = ind.querySelector('span');
        if (i < suggestionWizardStep) {
          circle.style.borderColor = 'var(--color-secondary)';
          circle.style.background = 'var(--color-secondary)';
          circle.style.color = '#111';
          circle.textContent = '✓';
          span.style.color = 'var(--color-secondary)';
        } else if (i === suggestionWizardStep) {
          circle.style.borderColor = 'var(--color-secondary)';
          circle.style.background = 'var(--color-card)';
          circle.style.color = 'var(--color-secondary)';
          circle.textContent = i;
          span.style.color = 'var(--color-dark-text)';
        } else {
          circle.style.borderColor = 'var(--color-border-light)';
          circle.style.background = 'var(--color-card)';
          circle.style.color = 'var(--color-light-text)';
          circle.textContent = i;
          span.style.color = 'var(--color-light-text)';
        }
      }
    }

    const line = document.getElementById('sug-progress-line');
    if (line) {
      line.style.width = `${((suggestionWizardStep - 1) / 3) * 90}%`;
    }

    const footer = document.getElementById('sug-modal-footer');
    if (!footer) return;

    const backBtn = `<button type="button" class="btn btn--outline btn--sm" onclick="AdminDashboard.sugWizardBack()">${Utils.icon('icon-chevron-left','icon--sm')} Back</button>`;
    const cancelBtn = `<button type="button" class="btn btn--ghost btn--sm" data-action="close-modal">Cancel</button>`;
    
    if (suggestionWizardStep === 1) {
      footer.innerHTML = `${cancelBtn} <button type="button" class="btn btn--primary btn--sm" onclick="AdminDashboard.sugWizardNext()">Next ${Utils.icon('icon-chevron-right','icon--sm')}</button>`;
    } else if (suggestionWizardStep < 4) {
      footer.innerHTML = `${backBtn} <button type="button" class="btn btn--primary btn--sm" onclick="AdminDashboard.sugWizardNext()">Next ${Utils.icon('icon-chevron-right','icon--sm')}</button>`;
    } else {
      footer.innerHTML = `${backBtn} <button type="button" class="btn btn--primary btn--sm" onclick="AdminDashboard.submitAlternativeSuggestion()">${Utils.icon('icon-send','icon--sm')} Send Suggestion</button>`;
    }
  }

  function sugWizardBack() {
    if (suggestionWizardStep > 1) {
      suggestionWizardStep--; _updateSuggestionWizardUI();
    }
  }

  function sugWizardNext() {
    if (suggestionWizardStep === 1) {
      const reason = document.getElementById('sug-unavail-reason').value.trim();
      if (!reason) {
        ToastController.show({ title: 'Validation Error', message: 'Please describe the reason for vehicle unavailability.', type: 'error' });
        return;
      }
    } else if (suggestionWizardStep === 2) {
      if (!selectedAlternativeVehicleId) {
        ToastController.show({ title: 'Selection Required', message: 'Please select one alternative vehicle suggestion card.', type: 'error' });
        return;
      }
      _renderSuggestionPreviewStep();
    }

    if (suggestionWizardStep < 4) {
      suggestionWizardStep++; _updateSuggestionWizardUI();
    }
  }

  function _renderSuggestionPreviewStep() {
    const v = AdminState.fleetData.find(x => x.id === selectedAlternativeVehicleId);
    const previewDiv = document.getElementById('suggestion-preview-details');
    if (!v || !previewDiv) return;

    previewDiv.innerHTML = `
      <div style="height:160px; background:#000; border-radius:var(--radius-lg); overflow:hidden; display:flex; align-items:center; justify-content:center; margin-bottom:var(--space-4);">
        <img src="${v.images[0] || 'assets/images/cars/luxury.png'}" style="width:100%; height:100%; object-fit:cover;">
      </div>
      
      <h4 style="font-family:var(--font-heading); font-size:var(--fs-h4); color:var(--color-dark-text); margin-bottom:2px;">${v.brand} ${v.model}</h4>
      <div style="font-size:10px; color:var(--color-light-text); margin-bottom:var(--space-4);">${v.category} · plate: ${v.plate}</div>
      
      <div class="db-rental-detail__grid" style="grid-template-columns: repeat(2,1fr);">
        <div class="db-rental-detail__item"><span class="db-rental-detail__label">Fuel / Trans</span><span class="db-rental-detail__value">${v.specs.fuel} / ${v.specs.transmission}</span></div>
        <div class="db-rental-detail__item"><span class="db-rental-detail__label">Power & Engine</span><span class="db-rental-detail__value">${v.specs.horsepower} (${v.specs.engine})</span></div>
        <div class="db-rental-detail__item"><span class="db-rental-detail__label">Daily Price</span><span class="db-rental-detail__value db-rental-detail__value--highlight">${Utils.formatCurrency(v.dailyRate)}/day</span></div>
        <div class="db-rental-detail__item"><span class="db-rental-detail__label">Security Deposit</span><span class="db-rental-detail__value">${Utils.formatCurrency(v.deposit)}</span></div>
      </div>
    `;

    // Prefill Step 4 summary titles too
    const summVeh = document.getElementById('sug-summary-offered-veh');
    const summPrice = document.getElementById('sug-summary-offered-price');
    if (summVeh) summVeh.textContent = `${v.brand} ${v.model}`;
    if (summPrice) summPrice.textContent = `${Utils.formatCurrency(v.dailyRate)}/day`;
  }

  function submitAlternativeSuggestion() {
    const p = AdminState.preBookingsData.find(x => x.id === activePrebookingId);
    const v = AdminState.fleetData.find(x => x.id === selectedAlternativeVehicleId);
    const reason = document.getElementById('sug-unavail-reason').value;

    if (!p || !v) return;

    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/admin/bookings/${p.id}/suggest-alternative`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ carId: v.carId || v.id, message: reason })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) throw new Error(data.message || 'Suggestion failed');
        p.status = 'alternative';
        p.availability = 'Unavailable';
        p.suggestion = {
          requestedVehicle: p.vehicleName,
          suggestedVehicle: `${v.brand} ${v.model}`,
          reason: reason,
          sentOn: new Date().toISOString().split('T')[0],
        };

        ModalController.close();
        ToastController.show({
          title: 'Alternative Dispatched',
          message: `Offered ${v.brand} ${v.model} to ${p.user}.`,
          type: 'success'
        });

        _renderBookingsTabContent();
        DropdownController.updateNotificationBadge();
      })
      .catch(err => {
        ModalController.close();
        ToastController.show({ title: 'Dispatch Failed', message: err.message || 'Could not send suggestion.', type: 'error' });
      });
  }


  /* ============================================================
     18.2 RENTAL EXTENSIONS CONTROLLER
     ============================================================ */
  function _renderExtensionsTab(container) {
    const state = AdminState.uiState;
    const extensions = AdminState.extensionsData;

    const countPending = extensions.filter(x => x.status === 'pending').length;
    const countApproved = extensions.filter(x => x.status === 'approved').length;
    const countRejected = extensions.filter(x => x.status === 'rejected').length;
    const countExpired = extensions.filter(x => x.status === 'expired').length;

    container.innerHTML = `
      <div class="db-stats-grid db-animate-stagger" style="grid-template-columns: repeat(4, 1fr); gap:var(--space-4); margin-bottom:var(--space-6);">
        ${_statCard('icon-clock', 'warning', 'Pending Extensions', countPending, 'Awaiting approval')}
        ${_statCard('icon-check-circle', 'success', 'Approved Extensions', countApproved, 'Return dates updated')}
        ${_statCard('icon-close', 'danger', 'Rejected Extensions', countRejected, 'Requested refused')}
        ${_statCard('icon-alert-triangle', 'info', 'Expired Requests', countExpired, 'No action taken')}
      </div>

      <div class="db-section-card db-animate-in" id="extensions-card-container" style="margin-bottom: var(--space-6);">
        <div class="db-filter-bar">
          <div style="font-weight:var(--fw-semibold); font-size:var(--fs-small); color:var(--color-dark-text);">
            Filter Extension Requests:
          </div>
          <select class="db-filter-bar__select" id="extensions-status-filter" style="max-width:200px;">
            <option value="all" ${state.extensionsStatusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
            <option value="pending" ${state.extensionsStatusFilter === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="approved" ${state.extensionsStatusFilter === 'approved' ? 'selected' : ''}>Approved</option>
            <option value="rejected" ${state.extensionsStatusFilter === 'rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </div>

        <div class="db-table-wrapper">
          <table class="db-table" id="extensions-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Original Return</th>
                <th>Extension Requested</th>
                <th>Estimated Cost</th>
                <th>Reason</th>
                <th>Status</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <!-- Rendered dynamically -->
            </tbody>
          </table>
        </div>
        <div class="db-table-footer" id="extensions-pagination">
          <!-- Rendered dynamically -->
        </div>
      </div>
    `;

    document.getElementById('extensions-status-filter').addEventListener('change', (e) => {
      AdminState.uiState.extensionsStatusFilter = e.target.value;
      AdminState.uiState.extensionsCurrentPage = 1;
      saveUiState();
      _renderExtensionsList();
    });

    _renderExtensionsList();
  }

  function _renderExtensionsList() {
    const tbody = document.querySelector('#extensions-table tbody');
    const footer = document.getElementById('extensions-pagination');
    if (!tbody) return;

    const state = AdminState.uiState;
    let list = AdminState.extensionsData;

    if (state.extensionsStatusFilter !== 'all') {
      list = list.filter(x => x.status === state.extensionsStatusFilter);
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center;">
            ${_renderEmptyState('icon-alert-triangle', 'No Extension Requests Found', 'There are no extension requests currently matching this status.')}
          </td>
        </tr>
      `;
      if (footer) footer.innerHTML = '';
      if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch(e) {}
      }
      return;
    }

    const itemsPerPage = state.extensionsItemsPerPage || 5;
    const totalPages = Math.ceil(list.length / itemsPerPage);
    if (state.extensionsCurrentPage > totalPages) state.extensionsCurrentPage = totalPages || 1;
    const start = (state.extensionsCurrentPage - 1) * itemsPerPage;
    const paginated = list.slice(start, start + itemsPerPage);

    tbody.innerHTML = paginated.map(x => {
      let statusBadge = '';
      if (x.status === 'pending') statusBadge = `<span class="badge badge--warning">Pending</span>`;
      else if (x.status === 'approved') statusBadge = `<span class="badge badge--success">Approved</span>`;
      else if (x.status === 'rejected') statusBadge = `<span class="badge badge--danger" title="Reason: ${Utils.escapeHtml(x.rejectionReason || '')}">Rejected</span>`;
      else statusBadge = `<span class="badge badge--neutral">Expired</span>`;

      let actions = '';
      if (x.status === 'pending') {
        actions = `
          <button class="btn btn--primary btn--xs" onclick="AdminDashboard.approveExtensionModal('${x.id}')">Approve</button>
          <button class="btn btn--danger btn--xs" onclick="AdminDashboard.rejectExtensionModal('${x.id}')">Reject</button>
        `;
      } else {
        actions = `<span style="font-size:var(--fs-xs); color:var(--color-light-text);">Processed</span>`;
      }

      const newReturnDateVal = new Date(new Date(x.currentReturnDate).getTime() + x.requestedDays * 86400000).toISOString().split('T')[0];

      return `
        <tr>
          <td>
            <div style="font-weight:var(--fw-medium); color:var(--color-dark-text);">${Utils.escapeHtml(x.customerName)}</div>
            <div style="font-size:10px; color:var(--color-light-text);">${Utils.escapeHtml(x.customerEmail)}</div>
          </td>
          <td>
            <div style="font-weight:var(--fw-medium); color:var(--color-dark-text);">${Utils.escapeHtml(x.vehicleName)}</div>
            <div style="font-size:10px; color:var(--color-light-text);">Booking: ${x.bookingId}</div>
          </td>
          <td>${Utils.formatDate(x.currentReturnDate)}</td>
          <td>
            <div style="font-weight:var(--fw-medium); color:var(--color-secondary);">+${x.requestedDays} Days</div>
            <div style="font-size:10px; color:var(--color-light-text);">New date: ${Utils.formatDate(newReturnDateVal)}</div>
          </td>
          <td>${Utils.formatCurrency(x.estimatedCost)}</td>
          <td style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${Utils.escapeHtml(x.reason)}">${Utils.escapeHtml(x.reason)}</td>
          <td>${statusBadge}</td>
          <td style="text-align:right;">
            <div style="display:flex; justify-content:flex-end; gap:var(--space-1); align-items:center;">
              ${actions}
              <button class="btn btn--ghost btn--xs" onclick="AdminDashboard.showBookingDetails('${x.bookingId}')" title="View Booking Details">${Utils.icon('icon-eye', 'icon--xs')}</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (footer) {
      footer.innerHTML = `
        <span style="font-size:var(--fs-xs); color:var(--color-light-text);">Showing ${start+1}-${Math.min(start+itemsPerPage, list.length)} of ${list.length} requests</span>
        <div class="db-pagination-controls" style="display:flex; gap:var(--space-2);">
          <button class="btn btn--outline btn--xs" ${state.extensionsCurrentPage === 1 ? 'disabled' : ''} onclick="AdminDashboard.setExtensionsPage(${state.extensionsCurrentPage - 1})">Prev</button>
          <button class="btn btn--outline btn--xs" ${state.extensionsCurrentPage === totalPages ? 'disabled' : ''} onclick="AdminDashboard.setExtensionsPage(${state.extensionsCurrentPage + 1})">Next</button>
        </div>
      `;
    }
    if (typeof lucide !== 'undefined') {
      try { lucide.createIcons(); } catch(e) {}
    }
  }

  function setExtensionsPage(p) {
    AdminState.uiState.extensionsCurrentPage = p;
    saveUiState();
    _renderExtensionsList();
  }

  function approveExtensionModal(extId) {
    const ext = AdminState.extensionsData.find(x => x.id === extId);
    if (!ext) return;

    const newDate = new Date(new Date(ext.currentReturnDate).getTime() + ext.requestedDays * 86400000).toISOString().split('T')[0];

    const content = `
      <div class="db-modal__header">
        <h3 class="db-modal__title">Approve Extension Request</h3>
        <button class="db-modal__close" data-action="close-modal" aria-label="Close">${Utils.icon('icon-close')}</button>
      </div>
      <div class="db-modal__body">
        <p style="margin-bottom:var(--space-4); font-size:var(--fs-xs);">Verify details for extending rental duration:</p>
        <div class="db-rental-detail__grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom:var(--space-4); gap:var(--space-3);">
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Customer</span><span class="db-rental-detail__value">${Utils.escapeHtml(ext.customerName)}</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Vehicle</span><span class="db-rental-detail__value">${Utils.escapeHtml(ext.vehicleName)}</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Current Return Date</span><span class="db-rental-detail__value">${Utils.formatDate(ext.currentReturnDate)}</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Extension Period</span><span class="db-rental-detail__value" style="color:var(--color-secondary); font-weight:var(--fw-bold);">+${ext.requestedDays} Days</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">New Return Date</span><span class="db-rental-detail__value" style="color:var(--color-secondary); font-weight:var(--fw-bold);">${Utils.formatDate(newDate)}</span></div>
          <div class="db-rental-detail__item"><span class="db-rental-detail__label">Estimated Cost</span><span class="db-rental-detail__value" style="color:var(--color-primary); font-weight:var(--fw-bold);">${Utils.formatCurrency(ext.estimatedCost)}</span></div>
        </div>
        <p style="font-size:var(--fs-xs); color:var(--color-light-text);">Approving will charge/hold the estimated card amount and automatically shift the return calendar slot.</p>
      </div>
      <div class="db-modal__footer">
        <button class="btn btn--ghost btn--sm" data-action="close-modal">Cancel</button>
        <button class="btn btn--primary btn--sm" onclick="AdminDashboard.submitExtensionApproval('${extId}')">Approve Extension</button>
      </div>
    `;

    ModalController.openDynamic(content, '500px');
  }

  function submitExtensionApproval(extId) {
    const ext = AdminState.extensionsData.find(x => x.id === extId);
    if (!ext) return;

    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/admin/bookings/${ext.bookingId}/extensions/${ext.extensionId}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          if (data.message && data.message.includes('pending')) throw new Error('No pending extension request to approve.');
          throw new Error(data.message || 'Approval failed');
        }
        ext.status = 'approved';

        ModalController.close();
        ToastController.show({ title: 'Extension Approved', message: `Return date extended for ${ext.customerName}.`, type: 'success' });
        _renderBookingsTabContent();
        DropdownController.updateNotificationBadge();
        fetchDashboardData();
      })
      .catch(err => {
        ModalController.close();
        ToastController.show({ title: 'Approval Failed', message: err.message || 'Could not approve extension.', type: 'error' });
      });
  }

  function rejectExtensionModal(extId) {
    const content = `
      <div class="db-modal__header">
        <h3 class="db-modal__title">Reject Extension Request</h3>
        <button class="db-modal__close" data-action="close-modal" aria-label="Close">${Utils.icon('icon-close')}</button>
      </div>
      <div class="db-modal__body">
        <label class="db-rental-detail__label" style="margin-bottom:var(--space-2);">Reason for Rejection</label>
        <select class="db-filter-bar__select" id="ext-reject-reason" style="width:100%; margin-bottom:var(--space-4);">
          <option value="Vehicle scheduled for maintenance">Vehicle scheduled for maintenance</option>
          <option value="Vehicle reserved by another customer">Vehicle reserved by another customer</option>
          <option value="Account payment verification failure">Account payment verification failure</option>
          <option value="Other">Other (Write below)</option>
        </select>
        <textarea class="db-filter-bar__search-input" id="ext-reject-text" placeholder="Explain the reason for rejecting this extension request..." style="width:100%; height:100px; padding:var(--space-3); resize:none;"></textarea>
      </div>
      <div class="db-modal__footer">
        <button class="btn btn--ghost btn--sm" data-action="close-modal">Cancel</button>
        <button class="btn btn--danger btn--sm" onclick="AdminDashboard.submitExtensionRejection('${extId}')">Reject Request</button>
      </div>
    `;

    ModalController.openDynamic(content, '480px');
  }

  function submitExtensionRejection(extId) {
    const ext = AdminState.extensionsData.find(x => x.id === extId);
    if (!ext) return;

    const selectReason = document.getElementById('ext-reject-reason').value;
    const textReason = document.getElementById('ext-reject-text').value;
    const reason = selectReason === 'Other' ? textReason : selectReason;

    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/admin/bookings/${ext.bookingId}/extensions/${ext.extensionId}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ reason: reason })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) throw new Error(data.message || 'Rejection failed');
        ext.status = 'rejected';
        ext.rejectionReason = reason;

        ModalController.close();
        ToastController.show({ title: 'Extension Rejected', message: `Extension request refused.`, type: 'warning' });
        _renderBookingsTabContent();
        DropdownController.updateNotificationBadge();
      })
      .catch(err => {
        ModalController.close();
        ToastController.show({ title: 'Rejection Failed', message: err.message || 'Could not reject extension.', type: 'error' });
      });
  }


  /* ============================================================
     18.3 CUSTOMERS MANAGEMENT CONTROLLER
     ============================================================ */
  function RenderCustomers() {
    const state = AdminState.uiState;
    DashboardRenderer.contentArea.innerHTML = `
      <div class="db-page-header db-animate-in">
        <div class="db-page-header__left">
          <h2 class="db-page-header__title">Customer Accounts Management</h2>
          <p class="db-page-header__subtitle">Manage driving licenses, KYC state files, rental history, and subscription tiers</p>
        </div>
        <div class="db-page-header__actions">
          <button class="btn btn--primary btn--sm" onclick="AdminDashboard.toast.show({title:'New Account Registration',message:'Customer registration modal placeholder launched.',type:'info'})">
            ${Utils.icon('icon-plus','icon--xs')} Add Customer
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="db-stats-grid db-animate-stagger" style="grid-template-columns: repeat(6, 1fr); gap:var(--space-3); margin-bottom:var(--space-6);">
        ${_statCard('icon-users', 'primary', 'Total Users', AdminState.userData.length, 'Registered profiles')}
        ${_statCard('icon-check-circle', 'success', 'Active Users', AdminState.userData.filter(u=>u.status==='active').length, 'Active accounts')}
        ${_statCard('icon-award', 'gold', 'Premium Tiers', AdminState.userData.filter(u=>u.membership==='Gold'||u.membership==='Platinum').length, 'Gold & Platinum')}
        ${_statCard('icon-plus', 'info', 'New Registrations', AdminState.userData.filter(u=>u.joined.startsWith('2026')||u.joined.includes('-07-')).length, 'This month')}
        ${_statCard('icon-x-circle', 'danger', 'Blocked Users', AdminState.userData.filter(u=>u.status==='blocked').length, 'Suspended access')}
        ${_statCard('icon-alert-triangle', 'warning', 'Pending KYC', AdminState.userData.filter(u=>u.verificationStatus==='pending').length, 'Verification queue')}
      </div>

      <!-- Filters Panel -->
      <div class="db-section-card db-animate-in" id="customers-card-container" style="margin-bottom: var(--space-6);">
        <div class="db-filter-bar">
          <div class="db-filter-bar__search" style="max-width: 260px;">
            <input type="text" class="db-filter-bar__search-input" id="users-search" placeholder="Search ID, name, DL, email..." value="${Utils.escapeHtml(state.usersSearch || '')}">
          </div>

          <select class="db-filter-bar__select" id="users-status-filter">
            <option value="all" ${state.usersStatusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
            <option value="active" ${state.usersStatusFilter === 'active' ? 'selected' : ''}>Active</option>
            <option value="inactive" ${state.usersStatusFilter === 'inactive' ? 'selected' : ''}>Inactive</option>
            <option value="blocked" ${state.usersStatusFilter === 'blocked' ? 'selected' : ''}>Blocked</option>
          </select>

          <select class="db-filter-bar__select" id="users-membership-filter">
            <option value="all" ${state.usersMembershipFilter === 'all' ? 'selected' : ''}>All Membership Tiers</option>
            <option value="Platinum" ${state.usersMembershipFilter === 'Platinum' ? 'selected' : ''}>Platinum</option>
            <option value="Gold" ${state.usersMembershipFilter === 'Gold' ? 'selected' : ''}>Gold</option>
            <option value="Silver" ${state.usersMembershipFilter === 'Silver' ? 'selected' : ''}>Silver</option>
            <option value="Bronze" ${state.usersMembershipFilter === 'Bronze' ? 'selected' : ''}>Bronze</option>
          </select>

          <select class="db-filter-bar__select" id="users-verification-filter">
            <option value="all" ${state.usersVerificationFilter === 'all' ? 'selected' : ''}>All Verifications</option>
            <option value="verified" ${state.usersVerificationFilter === 'verified' ? 'selected' : ''}>Verified KYC</option>
            <option value="pending" ${state.usersVerificationFilter === 'pending' ? 'selected' : ''}>Pending Review</option>
            <option value="rejected" ${state.usersVerificationFilter === 'rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </div>

        <!-- Table -->
        <div class="db-table-wrapper">
          <table class="db-table" id="customers-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Customer ID</th>
                <th>Contact info</th>
                <th>Driving License</th>
                <th>Total Bookings</th>
                <th>Current Lease</th>
                <th>KYC Verification</th>
                <th>Status</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <!-- Populated by JS -->
            </tbody>
          </table>
        </div>
        
        <div class="db-table-footer" id="users-pagination">
          <!-- Rendered dynamically -->
        </div>
      </div>
    `;

    // Event listeners
    const searchInput = document.getElementById('users-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce(() => {
        AdminState.uiState.usersSearch = searchInput.value.toLowerCase().trim();
        AdminState.uiState.usersCurrentPage = 1;
        _renderCustomersList();
      }));
    }

    ['users-status-filter', 'users-membership-filter', 'users-verification-filter'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => {
          AdminState.uiState[id.replace('-filter', 'Filter').replace('users', 'users')] = el.value;
          AdminState.uiState.usersCurrentPage = 1;
          saveUiState();
          _renderCustomersList();
        });
      }
    });

    _renderCustomersList();
  }

  function _renderCustomersList() {
    const tbody = document.querySelector('#customers-table tbody');
    const footer = document.getElementById('users-pagination');
    if (!tbody) return;

    const state = AdminState.uiState;
    let list = AdminState.userData;

    // Filter Search
    if (state.usersSearch) {
      const q = state.usersSearch;
      list = list.filter(u => 
        u.id.toLowerCase().includes(q) || 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) || 
        u.phone.toLowerCase().includes(q) || 
        u.license.toLowerCase().includes(q)
      );
    }

    // Filter Status
    if (state.usersStatusFilter !== 'all') {
      list = list.filter(u => u.status === state.usersStatusFilter);
    }

    // Filter Membership
    if (state.usersMembershipFilter !== 'all') {
      list = list.filter(u => u.membership === state.usersMembershipFilter);
    }

    // Filter Verification
    if (state.usersVerificationFilter !== 'all') {
      list = list.filter(u => u.verificationStatus === state.usersVerificationFilter);
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center;">
            ${_renderEmptyState('icon-users', 'No Customers Match Filters', 'Try adjusting your search query or filter settings.')}
          </td>
        </tr>
      `;
      if (footer) footer.innerHTML = '';
      if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch(e) {}
      }
      return;
    }

    const itemsPerPage = state.usersItemsPerPage || 5;
    const totalPages = Math.ceil(list.length / itemsPerPage);
    if (state.usersCurrentPage > totalPages) state.usersCurrentPage = totalPages || 1;
    const start = (state.usersCurrentPage - 1) * itemsPerPage;
    const paginated = list.slice(start, start + itemsPerPage);

    tbody.innerHTML = paginated.map(u => {
      let vBadge = '';
      if (u.verificationStatus === 'verified') vBadge = `<span class="badge badge--success">${Utils.icon('icon-check-circle', 'icon--xs')} Verified</span>`;
      else if (u.verificationStatus === 'pending') vBadge = `<span class="badge badge--warning">Pending</span>`;
      else vBadge = `<span class="badge badge--danger">Rejected</span>`;

      let sBadge = '';
      if (u.status === 'active') sBadge = `<span class="badge badge--success">Active</span>`;
      else if (u.status === 'blocked') sBadge = `<span class="badge badge--danger">Suspended</span>`;
      else sBadge = `<span class="badge badge--neutral">Inactive</span>`;

      let initial = u.name.split(' ').map(x=>x[0]).join('');

      let actionToggle = '';
      if (u.status === 'active') {
        actionToggle = `<button class="btn btn--outline btn--xs" onclick="AdminDashboard.suspendCustomer('${u.id}')">Suspend</button>`;
      } else {
        actionToggle = `<button class="btn btn--primary btn--xs" onclick="AdminDashboard.activateCustomer('${u.id}')">Activate</button>`;
      }

      return `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:var(--space-3);">
              <div style="width:32px; height:32px; border-radius:50%; background:var(--color-primary); color:#FFF; display:flex; align-items:center; justify-content:center; font-size:var(--fs-xs); font-weight:var(--fw-bold); border: 1.5px solid var(--color-secondary); flex-shrink:0;">${initial}</div>
              <div>
                <div style="font-weight:var(--fw-semibold); color:var(--color-dark-text);">${Utils.escapeHtml(u.name)}</div>
                <span class="badge badge--gold" style="font-size:8px; padding:1px 4px; margin-top:2px;">${u.membership}</span>
              </div>
            </div>
          </td>
          <td style="font-family:var(--font-mono); font-size:var(--fs-xs); font-weight:var(--fw-medium); color:var(--color-dark-text);">${u.id}</td>
          <td>
            <div style="font-size:var(--fs-xs); color:var(--color-dark-text);">${Utils.escapeHtml(u.email)}</div>
            <div style="font-size:10px; color:var(--color-light-text);">${Utils.escapeHtml(u.phone)}</div>
          </td>
          <td><code style="font-family:var(--font-mono); font-size:var(--fs-xs);">${u.license}</code></td>
          <td style="text-align:center; font-weight:var(--fw-semibold);">${u.bookings}</td>
          <td style="font-size:var(--fs-xs); color:var(--color-dark-text);">${Utils.escapeHtml(u.currentRental)}</td>
          <td>${vBadge}</td>
          <td>${sBadge}</td>
          <td style="text-align:right;">
            <div style="display:flex; justify-content:flex-end; gap:var(--space-1);">
              <button class="btn btn--outline btn--xs" onclick="AdminDashboard.showCustomerDetails('${u.id}')">View</button>
              <button class="btn btn--outline btn--xs" onclick="AdminDashboard.editCustomerModal('${u.id}')">Edit</button>
              ${actionToggle}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (footer) {
      footer.innerHTML = `
        <span style="font-size:var(--fs-xs); color:var(--color-light-text);">Showing ${start+1}-${Math.min(start+itemsPerPage, list.length)} of ${list.length} customers</span>
        <div class="db-pagination-controls" style="display:flex; gap:var(--space-2);">
          <button class="btn btn--outline btn--xs" ${state.usersCurrentPage === 1 ? 'disabled' : ''} onclick="AdminDashboard.setUsersPage(${state.usersCurrentPage - 1})">Prev</button>
          <button class="btn btn--outline btn--xs" ${state.usersCurrentPage === totalPages ? 'disabled' : ''} onclick="AdminDashboard.setUsersPage(${state.usersCurrentPage + 1})">Next</button>
        </div>
      `;
    }
    if (typeof lucide !== 'undefined') {
      try { lucide.createIcons(); } catch(e) {}
    }
  }

  function setUsersPage(p) {
    AdminState.uiState.usersCurrentPage = p;
    saveUiState();
    _renderCustomersList();
  }

  function suspendCustomer(userId) {
    const u = AdminState.userData.find(x => x.id === userId);
    if (!u) return;

    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/admin/users/${userId}/suspend`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) throw new Error(data.message || 'Suspension failed');
        u.status = 'blocked';
        ToastController.show({ title: 'Account Suspended', message: `${u.name} status updated to Suspended.`, type: 'warning' });
        _renderCustomersList();
      })
      .catch(err => {
        ToastController.show({ title: 'Suspension Failed', message: err.message || 'Could not suspend account.', type: 'error' });
      });
  }

  function activateCustomer(userId) {
    const u = AdminState.userData.find(x => x.id === userId);
    if (!u) return;

    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/admin/users/${userId}/activate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) throw new Error(data.message || 'Activation failed');
        u.status = 'active';
        ToastController.show({ title: 'Account Activated', message: `${u.name} status updated to Active.`, type: 'success' });
        _renderCustomersList();
      })
      .catch(err => {
        ToastController.show({ title: 'Activation Failed', message: err.message || 'Could not activate account.', type: 'error' });
      });
  }

  function showCustomerDetails(userId) {
    const u = AdminState.userData.find(x => x.id === userId);
    if (!u) return;

    let initial = u.name.split(' ').map(x=>x[0]).join('');

    const historyHtml = u.bookingHistory.length === 0 
      ? `<div style="text-align:center; font-size:var(--fs-xs); color:var(--color-light-text); padding:var(--space-4);">No rental ledger logs.</div>`
      : u.bookingHistory.map(b => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-2) 0; border-bottom:1px solid var(--color-border-light);">
          <div>
            <div style="font-weight:var(--fw-medium); font-size:var(--fs-xs); color:var(--color-dark-text);">${b.vehicle}</div>
            <div style="font-size:10px; color:var(--color-light-text);">ID: ${b.id} · ${Utils.formatDate(b.date)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:var(--fw-bold); font-size:var(--fs-xs);">${Utils.formatCurrency(b.amount)}</div>
            <span class="badge badge--${b.status==='active'?'success':'neutral'}" style="font-size:8px; padding:1px 3px;">${b.status}</span>
          </div>
        </div>
      `).join('');

    const notifyHtml = u.notifications.length === 0
      ? `<div style="text-align:center; font-size:var(--fs-xs); color:var(--color-light-text); padding:var(--space-4);">No notification history.</div>`
      : u.notifications.map(n => `
        <div style="padding:var(--space-2) 0; border-bottom:1px solid var(--color-border-light);">
          <div style="font-size:var(--fs-xs); color:var(--color-dark-text);">${Utils.escapeHtml(n.text)}</div>
          <div style="font-size:9px; color:var(--color-light-text); margin-top:2px;">Sent: ${Utils.formatDate(n.date)}</div>
        </div>
      `).join('');

    const content = `
      <div class="db-modal__header">
        <h3 class="db-modal__title">Customer Profile Card</h3>
        <button class="db-modal__close" data-action="close-modal" aria-label="Close">${Utils.icon('icon-close')}</button>
      </div>
      <div class="db-modal__body" style="padding-top:0;">
        <div style="display:flex; align-items:center; gap:var(--space-4); margin-bottom:var(--space-5); background:linear-gradient(135deg, rgba(27,59,95,0.05), rgba(198,169,98,0.1)); padding:var(--space-4); border-radius:var(--radius-lg);">
          <div class="db-sidebar__profile-avatar" style="width:60px; height:60px; font-size:1.5rem; margin:0; line-height:60px; text-align:center;">${initial}</div>
          <div>
            <h4 style="font-family:var(--font-heading); font-size:var(--fs-h4); color:var(--color-dark-text); margin-bottom:2px;">${Utils.escapeHtml(u.name)}</h4>
            <div style="font-size:var(--fs-xs); color:var(--color-light-text);">Account ID: <strong>${u.id}</strong> · Tier: <span class="badge badge--gold" style="font-size:8px; vertical-align:middle; padding:2px 5px;">${u.membership}</span></div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-4); margin-bottom:var(--space-5);">
          <!-- Personal Info -->
          <div class="db-section-card" style="padding:var(--space-4); border: 1px solid var(--color-border-light);">
            <h4 style="font-weight:var(--fw-semibold); font-size:var(--fs-small); color:var(--color-primary); border-bottom:1px solid var(--color-border-light); padding-bottom:var(--space-2); margin-bottom:var(--space-2);">${Utils.icon('icon-user','icon--xs')} Personal Details</h4>
            <div style="font-size:var(--fs-xs); display:flex; flex-direction:column; gap:6px;">
              <div><strong>Email:</strong> ${Utils.escapeHtml(u.email)}</div>
              <div><strong>Phone:</strong> ${Utils.escapeHtml(u.phone)}</div>
              <div><strong>DOB:</strong> ${Utils.formatDate(u.dob)}</div>
              <div><strong>Address:</strong> ${Utils.escapeHtml(u.address)}</div>
              <div><strong>Registered:</strong> ${Utils.formatDate(u.joined)}</div>
            </div>
          </div>

          <!-- Verification & Credentials -->
          <div class="db-section-card" style="padding:var(--space-4); border: 1px solid var(--color-border-light);">
            <h4 style="font-weight:var(--fw-semibold); font-size:var(--fs-small); color:var(--color-primary); border-bottom:1px solid var(--color-border-light); padding-bottom:var(--space-2); margin-bottom:var(--space-2);">${Utils.icon('icon-shield-check','icon--xs')} KYC & Credentials</h4>
            <div style="font-size:var(--fs-xs); display:flex; flex-direction:column; gap:6px;">
              <div><strong>Driving License:</strong> <code>${u.license}</code></div>
              <div><strong>KYC Status:</strong> <span class="badge badge--${u.verificationStatus==='verified'?'success':(u.verificationStatus==='pending'?'warning':'danger')}">${u.verificationStatus}</span></div>
              <div><strong>Current Lease:</strong> <span style="font-weight:var(--fw-medium); color:var(--color-secondary);">${Utils.escapeHtml(u.currentRental)}</span></div>
              <div style="border-top:1px solid var(--color-border-light); margin-top:4px; padding-top:4px;"><strong>Emergency Contact:</strong></div>
              <div>${Utils.escapeHtml(u.emergencyContact.name)} (${u.emergencyContact.relation}) · ${u.emergencyContact.phone}</div>
            </div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1.2fr 0.8fr; gap:var(--space-4);">
          <!-- Booking History -->
          <div class="db-section-card" style="padding:var(--space-4); border: 1px solid var(--color-border-light);">
            <h4 style="font-weight:var(--fw-semibold); font-size:var(--fs-small); color:var(--color-primary); border-bottom:1px solid var(--color-border-light); padding-bottom:var(--space-2); margin-bottom:var(--space-2);">${Utils.icon('icon-clipboard','icon--xs')} Booking Ledger</h4>
            <div style="max-height:160px; overflow-y:auto;">
              ${historyHtml}
            </div>
          </div>

          <!-- Profile Alerts -->
          <div class="db-section-card" style="padding:var(--space-4); border: 1px solid var(--color-border-light);">
            <h4 style="font-weight:var(--fw-semibold); font-size:var(--fs-small); color:var(--color-primary); border-bottom:1px solid var(--color-border-light); padding-bottom:var(--space-2); margin-bottom:var(--space-2);">${Utils.icon('icon-bell','icon--xs')} Recent Alerts</h4>
            <div style="max-height:160px; overflow-y:auto;">
              ${notifyHtml}
            </div>
          </div>
        </div>
      </div>
      <div class="db-modal__footer">
        <button class="btn btn--primary btn--sm" data-action="close-modal">Close Profile</button>
      </div>
    `;

    ModalController.openDynamic(content, '780px');
  }

  function editCustomerModal(userId) {
    const u = AdminState.userData.find(x => x.id === userId);
    if (!u) return;

    const content = `
      <div class="db-modal__header">
        <h3 class="db-modal__title">Edit Customer Account</h3>
        <button class="db-modal__close" data-action="close-modal" aria-label="Close">${Utils.icon('icon-close')}</button>
      </div>
      <div class="db-modal__body">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-4); margin-bottom:var(--space-4);">
          <div class="db-rental-detail__item" style="background:none; padding:0;">
            <label class="db-rental-detail__label" style="margin-bottom:4px;">Full Name</label>
            <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="edit-user-name" name="full_name" value="${Utils.escapeHtml(u.name)}">
          </div>
          <div class="db-rental-detail__item" style="background:none; padding:0;">
            <label class="db-rental-detail__label" style="margin-bottom:4px;">Email Address</label>
            <input type="email" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="edit-user-email" name="email" value="${Utils.escapeHtml(u.email)}">
          </div>
          <div class="db-rental-detail__item" style="background:none; padding:0;">
            <label class="db-rental-detail__label" style="margin-bottom:4px;">Phone Number</label>
            <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="edit-user-phone" name="phone" value="${Utils.escapeHtml(u.phone)}">
          </div>
          <div class="db-rental-detail__item" style="background:none; padding:0;">
            <label class="db-rental-detail__label" style="margin-bottom:4px;">Driving License Code</label>
            <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="edit-user-license" name="driving_license" value="${Utils.escapeHtml(u.license)}">
          </div>
          <div class="db-rental-detail__item" style="background:none; padding:0; grid-column: span 2;">
            <label class="db-rental-detail__label" style="margin-bottom:4px;">Billing Street Address</label>
            <input type="text" class="db-filter-bar__search-input" style="width:100%; height:40px;" id="edit-user-address" name="billing_address" value="${Utils.escapeHtml(u.address)}">
          </div>
          <div class="db-rental-detail__item" style="background:none; padding:0;">
            <label class="db-rental-detail__label" style="margin-bottom:4px;">Membership Tier</label>
            <select class="db-filter-bar__select" id="edit-user-membership" name="membership_tier" style="width:100%;">
              <option value="Bronze" ${u.membership==='Bronze'?'selected':''}>Bronze</option>
              <option value="Silver" ${u.membership==='Silver'?'selected':''}>Silver</option>
              <option value="Gold" ${u.membership==='Gold'?'selected':''}>Gold</option>
              <option value="Platinum" ${u.membership==='Platinum'?'selected':''}>Platinum</option>
            </select>
          </div>
          <div class="db-rental-detail__item" style="background:none; padding:0;">
            <label class="db-rental-detail__label" style="margin-bottom:4px;">KYC Status Check</label>
            <select class="db-filter-bar__select" id="edit-user-kyc" name="kyc_status" style="width:100%;">
              <option value="verified" ${u.verificationStatus==='verified'?'selected':''}>Verified</option>
              <option value="pending" ${u.verificationStatus==='pending'?'selected':''}>Pending</option>
              <option value="rejected" ${u.verificationStatus==='rejected'?'selected':''}>Rejected</option>
            </select>
          </div>
        </div>
      </div>
      <div class="db-modal__footer">
        <button class="btn btn--ghost btn--sm" data-action="close-modal">Cancel</button>
        <button class="btn btn--primary btn--sm" onclick="AdminDashboard.saveCustomerEdit('${userId}')">Save Account Changes</button>
      </div>
    `;

    ModalController.openDynamic(content, '540px');
  }

  function saveCustomerEdit(userId) {
    const u = AdminState.userData.find(x => x.id === userId);
    if (!u) return;

    u.name = document.getElementById('edit-user-name').value;
    u.email = document.getElementById('edit-user-email').value;
    u.phone = document.getElementById('edit-user-phone').value;
    u.license = document.getElementById('edit-user-license').value;
    u.address = document.getElementById('edit-user-address').value;
    u.membership = document.getElementById('edit-user-membership').value;
    u.verificationStatus = document.getElementById('edit-user-kyc').value;

    ModalController.close();
    ToastController.show({ title: 'Customer Updated', message: `Customer details for ${u.name} updated in memory.`, type: 'success' });
    _renderCustomersList();
  }


  /* ============================================================
     18.4 SYSTEM HEALTH & DIAGNOSTICS MODULE
     ============================================================ */




  /* ============================================================
     18.4.1 NOTIFICATIONS CENTER MODULE
     ============================================================ */
  function RenderNotifications() {
    const state = AdminState.uiState;
    DashboardRenderer.contentArea.innerHTML = `
      <div class="db-page-header db-animate-in">
        <div class="db-page-header__left">
          <h2 class="db-page-header__title">Notifications Center</h2>
          <p class="db-page-header__subtitle">Review system events alerts and priority warnings logs</p>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 200px 1fr; gap:var(--space-6);" class="db-animate-in">
        <!-- Categories Panel -->
        <div>
          <div style="font-weight:var(--fw-bold); font-size:var(--fs-xs); text-transform:uppercase; letter-spacing:0.05em; color:var(--color-light-text); margin-bottom:var(--space-3); padding-left:var(--space-2);">Categories</div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            ${['All', 'Bookings', 'Customers', 'Fleet', 'Extensions', 'Verification', 'Payments', 'System'].map(c => `
              <button class="btn ${state.notificationsCategoryFilter === c.toLowerCase() ? 'btn--primary' : 'btn--ghost'}" 
                      style="justify-content:flex-start; text-align:left; font-size:var(--fs-xs); font-weight:var(--fw-medium);" 
                      onclick="AdminDashboard.setNotificationsCategoryFilter('${c.toLowerCase()}')">
                ${c}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Alerts Stream -->
        <div class="db-section-card" id="notifications-card-container">
          <div class="db-filter-bar" style="border-bottom:1px solid var(--color-border-light); padding-bottom:var(--space-3); margin-bottom:var(--space-4);">
            <div class="db-filter-bar__search" style="max-width: 240px;">
              <input type="text" class="db-filter-bar__search-input" id="notif-search" placeholder="Search alerts..." value="${Utils.escapeHtml(state.notificationsSearch || '')}">
            </div>
            
            <div style="display:flex; gap:var(--space-2); align-items:center;">
              <select class="db-filter-bar__select" id="notif-status-filter" style="max-width:140px; height:34px; font-size:var(--fs-xs);">
                <option value="all" ${state.notificationsStatusFilter === 'all' ? 'selected' : ''}>All Status</option>
                <option value="unread" ${state.notificationsStatusFilter === 'unread' ? 'selected' : ''}>Unread</option>
                <option value="read" ${state.notificationsStatusFilter === 'read' ? 'selected' : ''}>Read</option>
              </select>
              <button class="btn btn--outline btn--xs" onclick="AdminDashboard.markAllNotificationsRead()">${Utils.icon('icon-check-circle', 'icon--xs')} Mark all read</button>
              <button class="btn btn--outline btn--xs btn--danger" onclick="AdminDashboard.deleteAllNotifications()">${Utils.icon('icon-trash', 'icon--xs')} Clear All</button>
            </div>
          </div>

          <div id="notifications-list-container"></div>
          <div class="db-table-footer" id="notifications-pagination"></div>
        </div>
      </div>
    `;

    const searchInput = document.getElementById('notif-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce(() => {
        AdminState.uiState.notificationsSearch = searchInput.value.toLowerCase().trim();
        AdminState.uiState.notificationsCurrentPage = 1;
        _renderNotificationsList();
      }));
    }

    const selectEl = document.getElementById('notif-status-filter');
    if (selectEl) {
      selectEl.addEventListener('change', (e) => {
        AdminState.uiState.notificationsStatusFilter = e.target.value;
        AdminState.uiState.notificationsCurrentPage = 1;
        saveUiState();
        _renderNotificationsList();
      });
    }

    _renderNotificationsList();
  }

  function setNotificationsCategoryFilter(cat) {
    AdminState.uiState.notificationsCategoryFilter = cat;
    AdminState.uiState.notificationsCurrentPage = 1;
    saveUiState();
    RenderNotifications();
  }

  function _renderNotificationsList() {
    const listContainer = document.getElementById('notifications-list-container');
    const pagination = document.getElementById('notifications-pagination');
    if (!listContainer) return;

    const state = AdminState.uiState;
    let list = AdminState.notificationData.filter(x => !x.archived);

    // Filter category
    if (state.notificationsCategoryFilter && state.notificationsCategoryFilter !== 'all') {
      list = list.filter(n => n.category.toLowerCase() === state.notificationsCategoryFilter);
    }

    // Filter status
    if (state.notificationsStatusFilter === 'unread') {
      list = list.filter(n => !n.read);
    } else if (state.notificationsStatusFilter === 'read') {
      list = list.filter(n => n.read);
    }

    // Search query
    if (state.notificationsSearch) {
      const q = state.notificationsSearch;
      list = list.filter(n => n.title.toLowerCase().includes(q) || n.text.toLowerCase().includes(q));
    }

    if (list.length === 0) {
      listContainer.innerHTML = _renderEmptyState('icon-bell', 'No Notifications Found', 'There are no system events matching your filters.');
      if (pagination) pagination.innerHTML = '';
      if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch(e) {}
      }
      return;
    }

    const itemsPerPage = state.notificationsItemsPerPage || 5;
    const totalPages = Math.ceil(list.length / itemsPerPage);
    if (state.notificationsCurrentPage > totalPages) state.notificationsCurrentPage = totalPages || 1;
    const start = (state.notificationsCurrentPage - 1) * itemsPerPage;
    const paginated = list.slice(start, start + itemsPerPage);

    const icons = {
      bookings: 'icon-clipboard',
      customers: 'icon-users',
      fleet: 'icon-car',
      extensions: 'icon-clock',
      verification: 'icon-shield-check',
      payments: 'icon-dollar',
      system: 'icon-settings'
    };

    listContainer.innerHTML = paginated.map(n => `
      <div class="db-notification-panel__item ${n.read ? '' : 'unread'}" style="margin-bottom:var(--space-3); border:1px solid var(--color-border-light); border-radius:var(--radius-md); padding:var(--space-3) var(--space-4); display:flex; justify-content:space-between; align-items:center; cursor:default;">
        <div style="display:flex; gap:var(--space-3); align-items:center; flex:1; min-width:0;">
          <div class="db-notification-panel__item-icon db-notification-panel__item-icon--${n.type || 'info'}">
            ${Utils.icon(icons[n.category.toLowerCase()] || 'icon-info', 'icon--sm')}
          </div>
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:var(--space-2); flex-wrap:wrap;">
              <span style="font-weight:var(--fw-bold); font-size:var(--fs-xs); color:var(--color-dark-text);">${Utils.escapeHtml(n.title)}</span>
              <span class="badge ${n.priority === 'High' ? 'badge--danger' : (n.priority === 'Normal' ? 'badge--warning' : 'badge--neutral')}" style="font-size:8px; padding:1px 3px;">${n.priority} Priority</span>
            </div>
            <div style="font-size:var(--fs-xs); color:var(--color-light-text); margin-top:2px;">${Utils.escapeHtml(n.text)}</div>
            <div style="font-size:9px; color:var(--color-light-text); margin-top:4px;">Category: ${n.category} · Received: ${Utils.formatDate(n.timestamp)}</div>
          </div>
        </div>
        
        <div style="display:flex; gap:var(--space-2); margin-left:var(--space-4);">
          ${!n.read ? `<button class="btn btn--ghost btn--xs" onclick="AdminDashboard.markNotificationRead('${n.id}')" title="Mark Read">${Utils.icon('icon-check', 'icon--xs')}</button>` : ''}
          <button class="btn btn--ghost btn--xs btn--danger" onclick="AdminDashboard.deleteNotification('${n.id}')" title="Delete">${Utils.icon('icon-trash', 'icon--xs')}</button>
        </div>
      </div>
    `).join('');

    if (pagination) {
      pagination.innerHTML = `
        <span style="font-size:var(--fs-xs); color:var(--color-light-text);">Showing ${start+1}-${Math.min(start+itemsPerPage, list.length)} of ${list.length} alerts</span>
        <div class="db-pagination-controls" style="display:flex; gap:var(--space-2);">
          <button class="btn btn--outline btn--xs" ${state.notificationsCurrentPage === 1 ? 'disabled' : ''} onclick="AdminDashboard.setNotificationsPage(${state.notificationsCurrentPage - 1})">Prev</button>
          <button class="btn btn--outline btn--xs" ${state.notificationsCurrentPage === totalPages ? 'disabled' : ''} onclick="AdminDashboard.setNotificationsPage(${state.notificationsCurrentPage + 1})">Next</button>
        </div>
      `;
    }
    if (typeof lucide !== 'undefined') {
      try { lucide.createIcons(); } catch(e) {}
    }
  }

  function setNotificationsPage(p) {
    AdminState.uiState.notificationsCurrentPage = p;
    saveUiState();
    _renderNotificationsList();
  }

  function markNotificationRead(id) {
    const n = AdminState.notificationData.find(x => x.id === id);
    if (n) {
      n.read = true;
      _renderNotificationsList();
      DropdownController.updateNotificationBadge();
    }
  }

  function markAllNotificationsRead() {
    AdminState.notificationData.forEach(n => n.read = true);
    _renderNotificationsList();
    DropdownController.updateNotificationBadge();
    ToastController.show({ title: 'Marked Read', message: 'All notifications marked as read.', type: 'success' });
  }

  function deleteNotification(id) {
    const idx = AdminState.notificationData.findIndex(x => x.id === id);
    if (idx !== -1) {
      AdminState.notificationData.splice(idx, 1);
      _renderNotificationsList();
      DropdownController.updateNotificationBadge();
    }
  }

  function deleteAllNotifications() {
    AdminState.notificationData = [];
    _renderNotificationsList();
    DropdownController.updateNotificationBadge();
    ToastController.show({ title: 'Cleared All', message: 'All system notifications cleared.', type: 'warning' });
  }




  /* ============================================================
     18.5 BUSINESS REPORTS MODULE
     ============================================================ */
    function RenderReports() {
    const state = AdminState.uiState;
    
    let revenue = AdminState.statsData.monthlyRevenue || 0;
    const analytics = AdminState.bookingAnalyticsData;

    if (analytics) {
      const todayStr = new Date().toISOString().split('T')[0];
      const dSum = arr => (arr || []).reduce((s, x) => s + (x.revenue || x.totalAmount || 0), 0);
      if (state.reportsPeriodFilter === 'today') {
        revenue = AdminState.statsData.todayRevenue || 0;
      } else if (state.reportsPeriodFilter === 'week') {
        revenue = dSum((analytics.daily || []).slice(-7));
      } else if (state.reportsPeriodFilter === 'year') {
        revenue = dSum(analytics.monthly || []);
      } else if (state.reportsPeriodFilter === 'custom' && state.reportsStartDate && state.reportsEndDate) {
        const start = new Date(state.reportsStartDate);
        const end = new Date(state.reportsEndDate);
        revenue = dSum((analytics.daily || []).filter(d => {
          const dt = new Date(d.date || d.day || '');
          return dt >= start && dt <= end;
        }));
      } else {
        revenue = dSum((analytics.monthly || []).slice(-1)) || AdminState.statsData.monthlyRevenue || 0;
      }
    }
    
    let totalFleet = AdminState.statsData.totalFleet || 1;
    let rented = AdminState.statsData.currentlyRented || 0;
    let utilization = ((rented / totalFleet) * 100).toFixed(1);
    
    // Calculate popular vehicles
    const vehicleCounts = {};
    AdminState.bookingData.forEach(b => {
      if (b.vehicle && b.vehicle !== 'Unknown') {
        vehicleCounts[b.vehicle] = (vehicleCounts[b.vehicle] || 0) + 1;
      }
    });
    
    let topVehicles = Object.keys(vehicleCounts).map(v => ({
      name: v,
      count: vehicleCounts[v],
      category: AdminState.fleetData.find(f => f.brand + ' ' + f.model === v)?.category || 'Vehicle'
    })).sort((a,b) => b.count - a.count).slice(0, 3);
    
    if (analytics && analytics.topCars && analytics.topCars.length > 0) {
      topVehicles = analytics.topCars.slice(0, 3).map(tc => ({
        name: tc.brand ? `${tc.brand} ${tc.carName || ''}`.replace(/\s+/g, ' ').trim() : (tc.carName || 'Vehicle'),
        count: tc.count || 0,
        category: tc.category || 'Vehicle'
      }));
    } else if (topVehicles.length === 0) {
      topVehicles = AdminState.fleetData.slice(0, 3).map(f => ({ name: f.brand + ' ' + f.model, category: f.category, count: 0 }));
    }
    
    let popularHtml = topVehicles.map(v => `
      <tr>
        <td style="font-weight:var(--fw-semibold); color:var(--color-dark-text);">${v.name}</td>
        <td>${v.category}</td>
        <td style="text-align:right; font-weight:var(--fw-bold); color:var(--color-secondary);">${v.count} Hires</td>
      </tr>
    `).join('');

    DashboardRenderer.contentArea.innerHTML = `
      <div class="db-page-header db-animate-in">
        <div class="db-page-header__left">
          <h2 class="db-page-header__title">Business Analytics Reports</h2>
          <p class="db-page-header__subtitle">Generate and download fleet utilization summaries and financial logs forecasts</p>
        </div>
        <div class="db-page-header__actions" style="display:flex; gap:var(--space-2);">
          <button class="btn btn--outline btn--sm" onclick="AdminDashboard.simulateExport('PDF')">
            ${Utils.icon('icon-file-text','icon--xs')} PDF Export
          </button>
          <button class="btn btn--outline btn--sm" onclick="AdminDashboard.simulateExport('Excel')">
            ${Utils.icon('icon-download','icon--xs')} Excel Export
          </button>
          <button class="btn btn--outline btn--sm" onclick="AdminDashboard.simulateExport('CSV')">
            ${Utils.icon('icon-clipboard','icon--xs')} CSV Export
          </button>
        </div>
      </div>

      <!-- Report Filters Bar -->
      <div class="db-section-card db-animate-in" style="margin-bottom:var(--space-6); padding:var(--space-4);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--space-4);">
          <div style="display:flex; align-items:center; gap:var(--space-2);">
            <div style="font-weight:var(--fw-semibold); font-size:var(--fs-xs); color:var(--color-dark-text);">Select Report Period:</div>
            <div style="display:flex; gap:4px;">
              <button class="btn ${state.reportsPeriodFilter === 'today' ? 'btn--primary' : 'btn--outline'} btn--xs" onclick="AdminDashboard.setReportsPeriod('today')">Today</button>
              <button class="btn ${state.reportsPeriodFilter === 'week' ? 'btn--primary' : 'btn--outline'} btn--xs" onclick="AdminDashboard.setReportsPeriod('week')">This Week</button>
              <button class="btn ${state.reportsPeriodFilter === 'month' ? 'btn--primary' : 'btn--outline'} btn--xs" onclick="AdminDashboard.setReportsPeriod('month')">This Month</button>
              <button class="btn ${state.reportsPeriodFilter === 'year' ? 'btn--primary' : 'btn--outline'} btn--xs" onclick="AdminDashboard.setReportsPeriod('year')">This Year</button>
            </div>
          </div>
          
          <div style="display:flex; gap:var(--space-2); align-items:center;">
            <div style="font-size:var(--fs-xs); color:var(--color-light-text);">Custom Range:</div>
            <input type="date" class="db-filter-bar__search-input" id="rep-start-date" style="width:130px; height:30px; font-size:var(--fs-xs); padding:0 6px;" value="${state.reportsStartDate || ''}">
            <span style="font-size:var(--fs-xs); color:var(--color-light-text);">to</span>
            <input type="date" class="db-filter-bar__search-input" id="rep-end-date" style="width:130px; height:30px; font-size:var(--fs-xs); padding:0 6px;" value="${state.reportsEndDate || ''}">
            <button class="btn btn--ghost btn--xs" onclick="AdminDashboard.applyCustomRange()" style="border:1px solid var(--color-border-light);">Apply</button>
          </div>
        </div>
      </div>

      <!-- Charts/Placeholders Section -->
      <div class="db-section-grid db-animate-stagger" style="grid-template-columns: repeat(2, 1fr); gap:var(--space-6);">
        <!-- Widget 1 -->
        <div class="db-section-card">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Revenue Summary Report</h3>
              <p class="db-section-card__subtitle">Chart.js ready container: #report-revenue-chart</p>
            </div>
          </div>
          <div class="db-section-card__body" style="height:200px; display:flex; align-items:center; justify-content:center; background:#fafafa; border-radius:var(--radius-lg); position:relative;">
            <canvas id="report-revenue-chart" style="position:absolute; width:100%; height:100%; pointer-events:none;"></canvas>
            <div style="text-align:center; z-index:1;">
              <div style="font-family:var(--font-heading); font-size:2.5rem; color:var(--color-primary);">${revenue.toLocaleString()}</div>
              <div style="font-size:var(--fs-xs); color:var(--color-light-text);">Total Billing for Selected Period (+12.4% vs prev)</div>
            </div>
          </div>
        </div>

        <!-- Widget 2 -->
        <div class="db-section-card">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Fleet Utilization Analysis</h3>
              <p class="db-section-card__subtitle">Chart.js ready container: #report-utilization-chart</p>
            </div>
          </div>
          <div class="db-section-card__body" style="height:200px; display:flex; align-items:center; justify-content:center; background:#fafafa; border-radius:var(--radius-lg); position:relative;">
            <canvas id="report-utilization-chart" style="position:absolute; width:100%; height:100%; pointer-events:none;"></canvas>
            <div style="text-align:center; z-index:1;">
              <div style="font-family:var(--font-heading); font-size:2.5rem; color:var(--color-secondary);">${utilization}%</div>
              <div style="font-size:var(--fs-xs); color:var(--color-light-text);">Average Vehicle Occupancy Rate</div>
            </div>
          </div>
        </div>

        <!-- Widget 3 -->
        <div class="db-section-card">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Popular Vehicles</h3>
              <p class="db-section-card__subtitle">Most booked vehicle models</p>
            </div>
          </div>
          <div class="db-section-card__body db-section-card__body--flush">
            <div class="db-table-wrapper" style="margin:0;">
              <table class="db-table">
                <thead>
                  <tr>
                    <th>Vehicle Model</th>
                    <th>Category</th>
                    <th style="text-align:right;">Bookings</th>
                  </tr>
                </thead>
                <tbody>
                  ${popularHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Widget 4 -->
        <div class="db-section-card">
          <div class="db-section-card__header">
            <div>
              <h3 class="db-section-card__title">Rental Trends & Traffic</h3>
              <p class="db-section-card__subtitle">Peak pickup and return hours</p>
            </div>
          </div>
          <div class="db-section-card__body" style="height:200px; display:flex; align-items:center; justify-content:center; background:#fafafa; border-radius:var(--radius-lg); position:relative;">
            <canvas id="report-trends-chart" style="position:absolute; width:100%; height:100%; pointer-events:none;"></canvas>
            <div style="text-align:center; z-index:1;">
              <div style="font-family:var(--font-heading); font-size:2rem; color:var(--color-secondary);">09:00 AM - 11:30 AM</div>
              <div style="font-size:var(--fs-xs); color:var(--color-light-text);">Highest booking pickup traffic hours</div>
            </div>
          </div>
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') {
      try { lucide.createIcons(); } catch(e) {}
    }
  }

  function setReportsPeriod(p) {
    AdminState.uiState.reportsPeriodFilter = p;
    saveUiState();
    RenderReports();
  }

  function applyCustomRange() {
    const start = document.getElementById('rep-start-date').value;
    const end = document.getElementById('rep-end-date').value;
    if (!start || !end) {
      ToastController.show({ title: 'Invalid Range', message: 'Please select both start and end dates.', type: 'error' });
      return;
    }
    AdminState.uiState.reportsStartDate = start;
    AdminState.uiState.reportsEndDate = end;
    AdminState.uiState.reportsPeriodFilter = 'custom';
    saveUiState();
    RenderReports();
    ToastController.show({ title: 'Custom Range Applied', message: `Displaying logs from ${start} to ${end}.`, type: 'success' });
  }

  function simulateExport(format) {
    ToastController.show({
      title: `${format} Export Triggered`,
      message: `Compiling dashboard metrics and downloading ${format} report spreadsheet...`,
      type: 'success'
    });
    if (typeof lucide !== 'undefined') {
      try { lucide.createIcons(); } catch(e) {}
    }
  }


  /* ============================================================
     18.6 SYSTEM CONFIGURATION SETTINGS
     ============================================================ */
  function RenderSettings() {
    const state = AdminState.uiState;
    if (!['business', 'policies', 'notifications', 'system'].includes(state.settingsActiveTab)) {
      state.settingsActiveTab = 'business';
    }
    const d = AdminState.settingsData;

    DashboardRenderer.contentArea.innerHTML = `
      <div class="db-page-header db-animate-in">
        <div class="db-page-header__left">
          <h2 class="db-page-header__title">Platform Settings</h2>
          <p class="db-page-header__subtitle">Manage global corporate configurations, rental policy rules, system preferences, and notification channels</p>
        </div>
      </div>

      <!-- Settings Layout -->
      <div style="display:grid; grid-template-columns: 240px 1fr; gap:var(--space-6);" class="db-animate-in">
        <!-- Shortcuts Sidebar Menu -->
        <div style="display:flex; flex-direction:column; gap:8px; position:sticky; top:20px; align-self:start;">
          <button id="btn-set-shortcut-business" class="btn ${state.settingsActiveTab === 'business' ? 'btn--primary' : 'btn--ghost'}" style="justify-content:flex-start; font-size:var(--fs-xs); font-weight:var(--fw-semibold);" onclick="AdminDashboard.setSettingsTab('business')">
            <span class="icon" style="margin-right:8px; display:inline-flex; align-items:center;">${Utils.icon('icon-briefcase')}</span> Business Info
          </button>
          <button id="btn-set-shortcut-policies" class="btn ${state.settingsActiveTab === 'policies' ? 'btn--primary' : 'btn--ghost'}" style="justify-content:flex-start; font-size:var(--fs-xs); font-weight:var(--fw-semibold);" onclick="AdminDashboard.setSettingsTab('policies')">
            <span class="icon" style="margin-right:8px; display:inline-flex; align-items:center;">${Utils.icon('icon-shield')}</span> Rental Policies
          </button>
          <button id="btn-set-shortcut-notifications" class="btn ${state.settingsActiveTab === 'notifications' ? 'btn--primary' : 'btn--ghost'}" style="justify-content:flex-start; font-size:var(--fs-xs); font-weight:var(--fw-semibold);" onclick="AdminDashboard.setSettingsTab('notifications')">
            <span class="icon" style="margin-right:8px; display:inline-flex; align-items:center;">${Utils.icon('icon-bell')}</span> Notifications
          </button>
          <button id="btn-set-shortcut-system" class="btn ${state.settingsActiveTab === 'system' ? 'btn--primary' : 'btn--ghost'}" style="justify-content:flex-start; font-size:var(--fs-xs); font-weight:var(--fw-semibold);" onclick="AdminDashboard.setSettingsTab('system')">
            <span class="icon" style="margin-right:8px; display:inline-flex; align-items:center;">${Utils.icon('icon-settings')}</span> System Preferences
          </button>
        </div>

        <!-- Scrollable Forms Pane -->
        <div style="display:flex; flex-direction:column; gap:var(--space-6);">
          
          <!-- SECTION 1: Business Information -->
          <div id="settings-section-business" class="db-section-card" style="padding:var(--space-6); transition: box-shadow 0.3s ease; border-radius:var(--radius-lg); background:var(--color-surface); border:1px solid var(--color-border-light);">
            <div style="display:flex; align-items:center; gap:var(--space-2); margin-bottom:var(--space-5); border-bottom:1px solid var(--color-border-light); padding-bottom:var(--space-3);">
              <span class="icon" style="color:var(--color-primary); display:inline-flex; align-items:center;">${Utils.icon('icon-briefcase')}</span>
              <h3 style="font-family:var(--font-heading); font-size:var(--fs-h3); color:var(--color-primary); margin:0;">Business Information</h3>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-4);">
              <div style="display:flex; flex-direction:column; gap:6px; grid-column: span 2;">
                <label style="font-size:var(--fs-xxs); text-transform:uppercase; color:var(--color-light-text); font-weight:var(--fw-bold); letter-spacing:0.5px;">Company Name</label>
                <input type="text" class="db-filter-bar__search-input" id="set-bus-name" style="width:100%; height:40px; padding:0 var(--space-3); border-radius:var(--radius-md); border:1px solid var(--color-border-light); background:var(--color-surface); color:var(--color-dark-text);" value="${Utils.escapeHtml(d.business.name)}">
              </div>
              <div style="display:flex; flex-direction:column; gap:6px;">
                <label style="font-size:var(--fs-xxs); text-transform:uppercase; color:var(--color-light-text); font-weight:var(--fw-bold); letter-spacing:0.5px;">Contact Email</label>
                <input type="email" class="db-filter-bar__search-input" id="set-bus-email" style="width:100%; height:40px; padding:0 var(--space-3); border-radius:var(--radius-md); border:1px solid var(--color-border-light); background:var(--color-surface); color:var(--color-dark-text);" value="${Utils.escapeHtml(d.business.email)}">
              </div>
              <div style="display:flex; flex-direction:column; gap:6px;">
                <label style="font-size:var(--fs-xxs); text-transform:uppercase; color:var(--color-light-text); font-weight:var(--fw-bold); letter-spacing:0.5px;">Phone</label>
                <input type="text" class="db-filter-bar__search-input" id="set-bus-phone" style="width:100%; height:40px; padding:0 var(--space-3); border-radius:var(--radius-md); border:1px solid var(--color-border-light); background:var(--color-surface); color:var(--color-dark-text);" value="${Utils.escapeHtml(d.business.phone)}">
              </div>
              <div style="display:flex; flex-direction:column; gap:6px; grid-column: span 2;">
                <label style="font-size:var(--fs-xxs); text-transform:uppercase; color:var(--color-light-text); font-weight:var(--fw-bold); letter-spacing:0.5px;">Address</label>
                <input type="text" class="db-filter-bar__search-input" id="set-bus-address" style="width:100%; height:40px; padding:0 var(--space-3); border-radius:var(--radius-md); border:1px solid var(--color-border-light); background:var(--color-surface); color:var(--color-dark-text);" value="${Utils.escapeHtml(d.business.address)}">
              </div>
            </div>
          </div>

          <!-- SECTION 2: Rental Policies -->
          <div id="settings-section-policies" class="db-section-card" style="padding:var(--space-6); transition: box-shadow 0.3s ease; border-radius:var(--radius-lg); background:var(--color-surface); border:1px solid var(--color-border-light);">
            <div style="display:flex; align-items:center; gap:var(--space-2); margin-bottom:var(--space-5); border-bottom:1px solid var(--color-border-light); padding-bottom:var(--space-3);">
              <span class="icon" style="color:var(--color-primary); display:inline-flex; align-items:center;">${Utils.icon('icon-shield')}</span>
              <h3 style="font-family:var(--font-heading); font-size:var(--fs-h3); color:var(--color-primary); margin:0;">Rental Policies</h3>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-4);">
              <div style="display:flex; flex-direction:column; gap:6px;">
                <label style="font-size:var(--fs-xxs); text-transform:uppercase; color:var(--color-light-text); font-weight:var(--fw-bold); letter-spacing:0.5px;">Security Deposit ($)</label>
                <input type="number" class="db-filter-bar__search-input" id="set-prc-deposit" style="width:100%; height:40px; padding:0 var(--space-3); border-radius:var(--radius-md); border:1px solid var(--color-border-light); background:var(--color-surface); color:var(--color-dark-text);" value="${d.policies.securityDepositDefault}">
              </div>
              <div style="display:flex; flex-direction:column; gap:6px;">
                <label style="font-size:var(--fs-xxs); text-transform:uppercase; color:var(--color-light-text); font-weight:var(--fw-bold); letter-spacing:0.5px;">Late Return Fee ($/hr)</label>
                <input type="number" class="db-filter-bar__search-input" id="set-prc-late" style="width:100%; height:40px; padding:0 var(--space-3); border-radius:var(--radius-md); border:1px solid var(--color-border-light); background:var(--color-surface); color:var(--color-dark-text);" value="${d.policies.lateFeeHourly}">
              </div>
              <div style="display:flex; flex-direction:column; gap:6px; grid-column: span 2;">
                <label style="font-size:var(--fs-xxs); text-transform:uppercase; color:var(--color-light-text); font-weight:var(--fw-bold); letter-spacing:0.5px;">Cancellation Window</label>
                <select class="db-filter-bar__select" id="set-pol-window" style="width:100%; height:40px; border-radius:var(--radius-md); border:1px solid var(--color-border-light); background:var(--color-surface); color:var(--color-dark-text); padding:0 var(--space-3); font-size:var(--fs-xs);">
                  <option value="flexible" ${d.policies.cancellationPolicy==='flexible'?'selected':''}>Flexible (Free cancellation up to 24 hrs prior)</option>
                  <option value="moderate" ${d.policies.cancellationPolicy==='moderate'?'selected':''}>Moderate (Free cancellation up to 5 days prior)</option>
                  <option value="strict" ${d.policies.cancellationPolicy==='strict'?'selected':''}>Strict (No cancellation refunds)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- SECTION 3: Notification Preferences -->
          <div id="settings-section-notifications" class="db-section-card" style="padding:var(--space-6); transition: box-shadow 0.3s ease; border-radius:var(--radius-lg); background:var(--color-surface); border:1px solid var(--color-border-light);">
            <div style="display:flex; align-items:center; gap:var(--space-2); margin-bottom:var(--space-5); border-bottom:1px solid var(--color-border-light); padding-bottom:var(--space-3);">
              <span class="icon" style="color:var(--color-primary); display:inline-flex; align-items:center;">${Utils.icon('icon-bell')}</span>
              <h3 style="font-family:var(--font-heading); font-size:var(--fs-h3); color:var(--color-primary); margin:0;">Notification Preferences</h3>
            </div>
            <div style="display:flex; flex-direction:column; gap:var(--space-4); padding-top:var(--space-2);">
              <div style="display:flex; align-items:center; gap:var(--space-3);">
                <input type="checkbox" id="set-notif-email" style="width:18px; height:18px; accent-color:var(--color-primary); cursor:pointer;" ${d.notifications.bookings ? 'checked' : ''}>
                <label for="set-notif-email" style="font-size:var(--fs-xs); color:var(--color-dark-text); cursor:pointer; font-weight:var(--fw-medium);">Email Notifications</label>
              </div>
              <div style="display:flex; align-items:center; gap:var(--space-3);">
                <input type="checkbox" id="set-notif-alerts" style="width:18px; height:18px; accent-color:var(--color-primary); cursor:pointer;" ${d.notifications.verifications ? 'checked' : ''}>
                <label for="set-notif-alerts" style="font-size:var(--fs-xs); color:var(--color-dark-text); cursor:pointer; font-weight:var(--fw-medium);">Admin Alerts</label>
              </div>
              <div style="display:flex; align-items:center; gap:var(--space-3);">
                <input type="checkbox" id="set-notif-browser" style="width:18px; height:18px; accent-color:var(--color-primary); cursor:pointer;" ${d.notifications.browser ? 'checked' : ''}>
                <label for="set-notif-browser" style="font-size:var(--fs-xs); color:var(--color-dark-text); cursor:pointer; font-weight:var(--fw-medium);">Browser Notifications</label>
              </div>
            </div>
          </div>

          <!-- SECTION 4: System Preferences -->
          <div id="settings-section-system" class="db-section-card" style="padding:var(--space-6); transition: box-shadow 0.3s ease; border-radius:var(--radius-lg); background:var(--color-surface); border:1px solid var(--color-border-light);">
            <div style="display:flex; align-items:center; gap:var(--space-2); margin-bottom:var(--space-5); border-bottom:1px solid var(--color-border-light); padding-bottom:var(--space-3);">
              <span class="icon" style="color:var(--color-primary); display:inline-flex; align-items:center;">${Utils.icon('icon-settings')}</span>
              <h3 style="font-family:var(--font-heading); font-size:var(--fs-h3); color:var(--color-primary); margin:0;">System Preferences</h3>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--space-4);">
              <div style="display:flex; flex-direction:column; gap:6px;">
                <label style="font-size:var(--fs-xxs); text-transform:uppercase; color:var(--color-light-text); font-weight:var(--fw-bold); letter-spacing:0.5px;">Time Zone</label>
                <select class="db-filter-bar__select" id="set-sys-timezone" style="width:100%; height:40px; border-radius:var(--radius-md); border:1px solid var(--color-border-light); background:var(--color-surface); color:var(--color-dark-text); padding:0 var(--space-3); font-size:var(--fs-xs);">
                  <option value="UTC-8" ${d.system.timezone==='UTC-8'?'selected':''}>Pacific Time (US & Canada) - GMT-8</option>
                  <option value="UTC-5" ${d.system.timezone==='UTC-5'?'selected':''}>Eastern Time (US & Canada) - GMT-5</option>
                  <option value="UTC+0" ${d.system.timezone==='UTC+0'?'selected':''}>GMT / Coordinated Universal Time</option>
                  <option value="UTC+1" ${d.system.timezone==='UTC+1'?'selected':''}>Central European Time - GMT+1</option>
                  <option value="UTC+5.5" ${d.system.timezone==='UTC+5.5'?'selected':''}>Indian Standard Time - GMT+5:30</option>
                </select>
              </div>
              <div style="display:flex; flex-direction:column; gap:6px;">
                <label style="font-size:var(--fs-xxs); text-transform:uppercase; color:var(--color-light-text); font-weight:var(--fw-bold); letter-spacing:0.5px;">Currency</label>
                <select class="db-filter-bar__select" id="set-sys-currency" style="width:100%; height:40px; border-radius:var(--radius-md); border:1px solid var(--color-border-light); background:var(--color-surface); color:var(--color-dark-text); padding:0 var(--space-3); font-size:var(--fs-xs);">
                  <option value="USD" ${d.system.currency==='USD'?'selected':''}>USD ($) - United States Dollar</option>
                  <option value="EUR" ${d.system.currency==='EUR'?'selected':''}>EUR (€) - Euro</option>
                  <option value="GBP" ${d.system.currency==='GBP'?'selected':''}>GBP (£) - British Pound</option>
                  <option value="INR" ${d.system.currency==='INR'?'selected':''}>INR (₹) - Indian Rupee</option>
                </select>
              </div>
              <div style="display:flex; flex-direction:column; gap:6px; grid-column: span 2;">
                <label style="font-size:var(--fs-xxs); text-transform:uppercase; color:var(--color-light-text); font-weight:var(--fw-bold); letter-spacing:0.5px;">Date Format</label>
                <select class="db-filter-bar__select" id="set-sys-dateformat" style="width:100%; height:40px; border-radius:var(--radius-md); border:1px solid var(--color-border-light); background:var(--color-surface); color:var(--color-dark-text); padding:0 var(--space-3); font-size:var(--fs-xs);">
                  <option value="YYYY-MM-DD" ${d.system.dateFormat==='YYYY-MM-DD'?'selected':''}>YYYY-MM-DD (e.g. 2026-07-09)</option>
                  <option value="MM/DD/YYYY" ${d.system.dateFormat==='MM/DD/YYYY'?'selected':''}>MM/DD/YYYY (e.g. 07/09/2026)</option>
                  <option value="DD-MM-YYYY" ${d.system.dateFormat==='DD-MM-YYYY'?'selected':''}>DD-MM-YYYY (e.g. 09-07-2026)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- HIDDEN ELEMENTS to prevent JS runtime errors on unsaved legacy configurations -->
          <div style="display:none;">
            <input type="text" id="set-bus-hours" value="${Utils.escapeHtml(d.business.hours || '08:00 AM - 10:00 PM')}">
            <input type="number" id="set-prc-min" value="${d.policies.dailyRateMin || 150}">
            <input type="number" id="set-prc-cancel" value="${d.policies.cancellationFee || 100}">
            <input type="number" id="set-pol-ext" value="${d.policies.maxExtensionDays || 7}">
            <input type="checkbox" id="set-pol-hourly" ${d.policies.hourlyEnabled ? 'checked' : ''}>
            <input type="checkbox" id="set-notif-reminders" ${d.notifications.reminders ? 'checked' : ''}>
            <input type="text" id="set-mail-host" value="${Utils.escapeHtml(d.email.smtpHost || '')}">
            <input type="text" id="set-mail-port" value="${Utils.escapeHtml(d.email.smtpPort || '')}">
            <input type="email" id="set-mail-email" value="${Utils.escapeHtml(d.email.senderEmail || '')}">
            <input type="text" id="set-mail-name" value="${Utils.escapeHtml(d.email.senderName || '')}">
            <select id="set-mail-enc">
              <option value="ssl" ${d.email.encryption==='ssl'?'selected':''}>ssl</option>
              <option value="tls" ${d.email.encryption==='tls'?'selected':''}>tls</option>
              <option value="none" ${d.email.encryption==='none'?'selected':''}>none</option>
            </select>
          </div>

          <!-- Bottom Actions Bar -->
          <div style="border-top:1px solid var(--color-border-light); padding-top:var(--space-4); display:flex; justify-content:flex-end; gap:var(--space-3); margin-top:var(--space-2);">
            <button class="btn btn--ghost btn--sm" onclick="AdminDashboard.resetSettings()">Reset Default</button>
            <button class="btn btn--outline btn--sm" onclick="AdminDashboard.navigateTo('overview')">Cancel</button>
            <button class="btn btn--primary btn--sm" onclick="AdminDashboard.saveSettingsChanges()">Save Changes</button>
          </div>
        </div>
      </div>
    `;

    if (typeof lucide !== 'undefined') {
      try { lucide.createIcons(); } catch(e) {}
    }
  }

  function setSettingsTab(tabName) {
    AdminState.uiState.settingsActiveTab = tabName;
    saveUiState();

    const el = document.getElementById(`settings-section-${tabName}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.boxShadow = '0 0 0 2px var(--color-secondary)';
      setTimeout(() => {
        el.style.boxShadow = '';
      }, 1500);
    }

    const buttons = document.querySelectorAll('[id^="btn-set-shortcut-"]');
    buttons.forEach(btn => {
      if (btn.id === `btn-set-shortcut-${tabName}`) {
        btn.className = 'btn btn--primary';
      } else {
        btn.className = 'btn btn--ghost';
      }
    });
  }

  function saveSettingsChanges() {
    const d = AdminState.settingsData;

    // 1. Business Info
    d.business.name = document.getElementById('set-bus-name').value;
    d.business.email = document.getElementById('set-bus-email').value;
    d.business.phone = document.getElementById('set-bus-phone').value;
    d.business.address = document.getElementById('set-bus-address').value;
    d.business.hours = document.getElementById('set-bus-hours').value;

    // 2. Rental Policies
    d.policies.securityDepositDefault = parseInt(document.getElementById('set-prc-deposit').value) || 0;
    d.policies.lateFeeHourly = parseInt(document.getElementById('set-prc-late').value) || 0;
    d.policies.cancellationPolicy = document.getElementById('set-pol-window').value;
    d.policies.dailyRateMin = parseInt(document.getElementById('set-prc-min').value) || 0;
    d.policies.cancellationFee = parseInt(document.getElementById('set-prc-cancel').value) || 0;
    d.policies.hourlyEnabled = document.getElementById('set-pol-hourly').checked;
    d.policies.maxExtensionDays = parseInt(document.getElementById('set-pol-ext').value) || 7;

    // 3. Notification Settings
    d.notifications.bookings = document.getElementById('set-notif-email').checked;
    d.notifications.verifications = document.getElementById('set-notif-alerts').checked;
    d.notifications.browser = document.getElementById('set-notif-browser').checked;
    d.notifications.reminders = document.getElementById('set-notif-reminders').checked;

    // 4. Email Configuration (Retained for system integrity)
    d.email.smtpHost = document.getElementById('set-mail-host').value;
    d.email.smtpPort = document.getElementById('set-mail-port').value;
    d.email.senderEmail = document.getElementById('set-mail-email').value;
    d.email.senderName = document.getElementById('set-mail-name').value;
    d.email.encryption = document.getElementById('set-mail-enc').value;

    // 6. System Preferences
    d.system.timezone = document.getElementById('set-sys-timezone').value;
    d.system.currency = document.getElementById('set-sys-currency').value;
    d.system.dateFormat = document.getElementById('set-sys-dateformat').value;

    ToastController.show({
      title: 'Settings Saved',
      message: 'Global preferences committed to local in-memory configurations.',
      type: 'success'
    });
  }

  function resetSettings() {
    AdminState.settingsData = {
      business: {
        name: 'JET CABS Luxury Car Rentals Ltd.',
        email: 'ops@jetcabs.com',
        phone: '+1 (555) 100-2000',
        address: '456 Prestige Boulevard, Suite 100, Beverly Hills, CA 90210',
        hours: '08:00 AM - 10:00 PM'
      },
      policies: {
        hourlyEnabled: true,
        dailyRateMin: 150,
        securityDepositDefault: 500,
        lateFeeHourly: 50,
        cancellationFee: 100,
        cancellationPolicy: 'flexible',
        maxExtensionDays: 7
      },
      email: {
        smtpHost: 'smtp.jetcabs-mail.com',
        smtpPort: '465',
        senderName: 'JET CABS Operations',
        senderEmail: 'no-reply@jetcabs.com',
        encryption: 'ssl'
      },
      notifications: {
        bookings: true,
        extensions: true,
        reminders: true,
        verifications: true,
        browser: false
      },
      system: {
        currency: 'USD',
        timezone: 'UTC-8',
        language: 'en',
        dateFormat: 'YYYY-MM-DD',
        maintenanceMode: false
      },
      security: {
        sessionLifetime: 60,
        passwordExpiryDays: 90,
        enforceMfa: false,
        roleAccess: 'superadmin'
      }
    };

    RenderSettings();
    ToastController.show({ title: 'Preferences Reset', message: 'Restored default settings configurations.', type: 'info' });
  }

  function testSmtpConnection() {
    ToastController.show({ title: 'SMTP Test Initialized', message: 'Authenticating with SMTP gateway...', type: 'info' });
    setTimeout(() => {
      ToastController.show({
        title: 'Connection Successful',
        message: `Mailer verified! Test dispatch sent to ${AdminState.adminData.email}.`,
        type: 'success'
      });
    }, 1500);
  }

  function revokeAdminSession(sessionId) {
    const idx = AdminState.securitySessionsData.findIndex(s => s.id === sessionId);
    if (idx !== -1) {
      const sess = AdminState.securitySessionsData[idx];
      AdminState.securitySessionsData.splice(idx, 1);
      RenderSettings();
      ToastController.show({
        title: 'Session Revoked',
        message: `Active session for admin '${sess.adminName}' (IP: ${sess.ipAddress}) has been terminated.`,
        type: 'success'
      });
    }
  }


  function syncFleetWithCentralData() {
    if (window.vehiclesData && Array.isArray(window.vehiclesData)) {
      window.vehiclesData.forEach(v => {
        const adminVehId = 'VH-' + (100 + parseInt(v.id, 10));
        let existing = AdminState.fleetData.find(x => x.id === adminVehId);
        
        let category = v.category;
        if (category === 'Luxury') category = 'Luxury Sedans';
        else if (category === 'SUV') category = 'Luxury SUVs';
        else if (category === 'Electric') category = 'Electric Vehicles';
        else if (category === 'Sports') category = 'Sports Cars';
        else if (category === 'Economy') category = 'Economy Cars';

        const specs = {
          fuel: v.specifications?.fuel || 'Petrol',
          transmission: v.specifications?.transmission || 'Automatic',
          seats: parseInt(v.specifications?.seats) || 5,
          doors: parseInt(v.specifications?.doors) || 4,
          horsepower: v.specifications?.horsepower || '',
          engine: v.specifications?.engine || '',
          topSpeed: v.specifications?.topSpeed || '',
          acceleration: v.specifications?.acceleration || '',
          driveType: v.specifications?.driveType || ''
        };

        if (existing) {
          existing.brand = v.brand || existing.brand;
          existing.model = v.name || existing.model;
          existing.category = category || existing.category;
          existing.dailyRate = v.dailyPrice || existing.dailyRate;
          existing.hourlyRate = v.hourlyPrice || existing.hourlyRate;
          existing.specs = { ...existing.specs, ...specs };
          existing.carId = v.id || existing.carId;
        } else {
          AdminState.fleetData.push({
            id: adminVehId,
            carId: v.id,
            brand: v.brand,
            model: v.name,
            year: 2024,
            category: category,
            plate: 'DE-7' + (100 + parseInt(v.id, 10)),
            vin: 'VIN-' + v.id + '-TEMP',
            color: v.color || 'Black',
            status: 'available',
            mileage: parseInt(v.specifications?.mileage) || 5000,
            condition: 'excellent',
            featured: v.badges?.includes('Featured') || false,
            hourlyRate: v.hourlyPrice || 50,
            dailyRate: v.dailyPrice || 300,
            weeklyRate: (v.dailyPrice || 300) * 6,
            monthlyRate: (v.dailyPrice || 300) * 22,
            deposit: 500,
            pickupLocation: 'JET CABS Downtown Hub',
            returnLocation: 'JET CABS Downtown Hub',
            notes: v.description || '',
            specs: specs,
            features: v.features || [],
            images: v.galleryImages || [v.heroImage],
            bookingCount: v.reviewCount || 0
          });
        }
      });
    }
  }


  /* ---- Auth Guard: require a valid admin session ---- */
  function initAuthGuard() {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.replace('login.html');
      return;
    }

    fetch('http://localhost:5000/api/admin/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success || !data.data || data.data.role !== 'admin') {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          window.location.replace('login.html');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        window.location.replace('login.html');
      });
  }

  /* ---- Load real fleet, users & bookings from the backend API ---- */
  function fetchDashboardData() {
    const token = localStorage.getItem('token');
    if (!token) return Promise.resolve(false);

    return fetch('http://localhost:5000/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success || !data.data) return false;

        const { cars = [], users = [], bookings = [] } = data.data;

        AdminState.fleetData = cars.map(car => {
          const brandPrefix = car.brand ? `${car.brand} ` : '';
          const model = car.carName && car.carName.startsWith(brandPrefix)
            ? car.carName.slice(brandPrefix.length)
            : car.carName;
          const carBookings = bookings.filter(b => b.car && String(b.car._id) === String(car._id));
          // The booking flow does not write back to car.status, so derive the
          // effective fleet status from active bookings as well.
          const hasPendingPickup = carBookings.some(b => b.bookingStatus === 'Pending Pickup');
          const hasActiveRental = carBookings.some(b => ['Active', 'Extended'].includes(b.bookingStatus));
          return {
            id: String(car._id),
            apiPublicIds: (car.images || []).map(img => img.public_id),
            brand: car.brand,
            model,
            year: car.createdAt ? new Date(car.createdAt).getFullYear() : 2024,
            category: car.category,
            plate: 'DB-' + String(car._id).slice(-6).toUpperCase(),
            vin: '',
            color: '',
            status: car.status === 'Maintenance' ? 'maintenance'
              : (car.status === 'Reserved' || hasPendingPickup || hasActiveRental) ? 'rented'
              : car.status === 'Available' ? 'available'
              : 'inactive',
            bookingState: hasActiveRental ? 'rented' : hasPendingPickup ? 'reserved' : null,
            mileage: 5000,
            condition: 'excellent',
            featured: false,
            hourlyRate: car.hourlyPrice,
            dailyRate: car.dailyPrice,
            weeklyRate: (car.dailyPrice || 0) * 6,
            monthlyRate: (car.dailyPrice || 0) * 22,
            deposit: 500,
            pickupLocation: 'JET CABS Downtown Hub',
            returnLocation: 'JET CABS Downtown Hub',
            notes: car.description || '',
            specs: {
              fuel: car.fuelType,
              transmission: car.transmission,
              seats: car.seatingCapacity,
              doors: 4,
              horsepower: '',
              engine: '',
              topSpeed: '',
              acceleration: '',
              driveType: 'AWD'
            },
            features: car.features || [],
            images: (car.images || []).map(img => img.url),
            bookingCount: carBookings.length
          };
        });

        // ---- Build the Fleet Classification Summary (grouped by category) ----
        const categoryMap = new Map();
        AdminState.fleetData.forEach(v => {
          const name = v.category || 'Uncategorized';
          if (!categoryMap.has(name)) {
            categoryMap.set(name, { name, total: 0, available: 0, booked: 0, maintenance: 0 });
          }
          const cat = categoryMap.get(name);
          cat.total += 1;
          if (v.status === 'maintenance') cat.maintenance += 1;
          else if (v.status === 'rented') cat.booked += 1;
          else if (v.status === 'available') cat.available += 1;
        });
        AdminState.fleetSummaryCategories = Array.from(categoryMap.values())
          .sort((a, b) => a.name.localeCompare(b.name));

        // ---- Hydrate userData (Users module + Recent Registrations) ----
        AdminState.userData = users.map(u => ({
          id: String(u._id),
          name: u.fullName || 'Unknown',
          email: u.email || '',
          phone: u.phone || 'N/A',
          license: 'N/A',
          status: u.role === 'admin' ? 'active' : 'active',
          membership: u.role === 'admin' ? 'Staff' : 'Silver',
          verificationStatus: 'verified',
          bookings: bookings.filter(b => b.customer && String(b.customer._id) === String(u._id)).length,
          currentRental: '—',
          joined: u.createdAt
        }));

        // ---- Hydrate bookings / pre-bookings / extensions ----
        AdminState.bookingData = [];
        AdminState.preBookingsData = [];
        AdminState.extensionsData = [];
        let totalRevenue = 0;
        let todayPickups = 0;
        let todayReturns = 0;
        const todayDateStr = new Date().toISOString().split('T')[0];

        bookings.forEach(b => {
          const customerName = b.customer ? (b.customer.fullName || 'Unknown') : 'Unknown';
          const customerEmail = b.customer ? (b.customer.email || '') : '';
          const customerPhone = b.customer ? (b.customer.phone || '') : '';
          const carBrand = b.car ? (b.car.brand || '') : '';
          const carNameRaw = b.car ? (b.car.carName || '') : '';
          const carModel = carNameRaw.startsWith(carBrand) ? carNameRaw.slice(carBrand.length) : carNameRaw;
          const vehicleName = `${carBrand} ${carModel}`.replace(/\s+/g, ' ').trim() || 'Unknown';
          const pickupISO = b.rentalDetails && b.rentalDetails.pickupDateTime;
          const returnISO = b.rentalDetails && b.rentalDetails.returnDateTime;
          const pickupDateStr = pickupISO ? new Date(pickupISO).toISOString().split('T')[0] : '';
          const returnDateStr = returnISO ? new Date(returnISO).toISOString().split('T')[0] : '';
          const totalAmt = b.totalAmount != null ? b.totalAmount : (b.estimatedPricing ? b.estimatedPricing.estimatedTotal : 0);
          const rentalType = b.rentalDetails && b.rentalDetails.rentalType === 'hourly' ? 'Hourly' : 'Daily';

          if (b.bookingStatus === 'Pending Pickup' && b.bookingType === 'PRE_BOOKING') {
            AdminState.preBookingsData.push({
              id: String(b._id),
              reference: 'PRE-' + String(b._id).slice(-6).toUpperCase(),
              user: customerName,
              email: customerEmail,
              phone: customerPhone,
              vehicleName: vehicleName,
              pickupDate: pickupDateStr,
              returnDate: returnDateStr,
              availability: 'Available',
              status: 'pending',
              estimatedCost: totalAmt
            });
            return;
          }

          let status = 'active';
          if (b.bookingStatus === 'Pending Pickup') status = 'pending';
          else if (b.bookingStatus === 'Confirmed') status = 'confirmed';
          else if (b.bookingStatus === 'Completed') status = 'completed';
          else if (b.bookingStatus === 'Cancelled') status = 'cancelled';
          else if (b.bookingStatus === 'Extended') status = 'extended';

          AdminState.bookingData.push({
            id: String(b._id),
            reference: 'BK-' + String(b._id).slice(-6).toUpperCase(),
            user: customerName,
            email: customerEmail,
            phone: customerPhone,
            vehicle: vehicleName,
            vehicleId: b.car ? String(b.car._id) : null,
            carCategory: b.car ? b.car.category : '',
            image: b.car && b.car.images && b.car.images.length > 0 ? b.car.images[0].url : '',
            pickupPhotoUrl: b.pickupPhoto && b.pickupPhoto.url ? b.pickupPhoto.url : '',
            returnPhotoUrl: b.returnPhoto && b.returnPhoto.url ? b.returnPhoto.url : '',
            pickupDateTimeISO: pickupISO,
            returnDateTimeISO: returnISO,
            rentalStartTime: b.rentalStartTime,
            rentalEndTime: b.rentalEndTime,
            extensions: b.extensionHistory || [],
            bookingType: b.bookingType || '',
            total: totalAmt,
            type: rentalType,
            date: b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : '',
            pickup: pickupDateStr,
            pickupTime: pickupISO ? new Date(pickupISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            returnDate: returnDateStr,
            returnTime: returnISO ? new Date(returnISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            status: status,
            timeline: [{ label: 'Booked', time: 'Just now', active: true }]
          });

          if (status === 'completed' || status === 'active') {
            totalRevenue += totalAmt;
          }
          if (pickupDateStr === todayDateStr) todayPickups++;
          if (returnDateStr === todayDateStr) todayReturns++;

          if (b.extensionHistory && b.extensionHistory.length > 0 && (status === 'extended' || status === 'completed')) {
            b.extensionHistory.forEach((ext, i) => {
              const hours = ext.additionalHours || 0;
              AdminState.extensionsData.push({
                id: 'EXT-' + String(b._id).slice(-6) + '-' + i,
                extensionId: String(ext._id),
                bookingId: String(b._id),
                customerName: customerName,
                customerEmail: customerEmail,
                vehicleName: vehicleName,
                currentReturnDate: returnDateStr,
                requestedDays: Math.max(1, Math.round(hours / 24)),
                estimatedCost: ext.additionalAmount || 0,
                reason: '',
                status: 'approved'
              });
            });
          }
        });

        // ---- Recent activity (bookings + users) ----
        const acts = [];
        bookings.slice(0, 5).forEach(b => {
          const carBrand = b.car ? (b.car.brand || '') : '';
          const carNameRaw = b.car ? (b.car.carName || '') : '';
          const carModel = carNameRaw.startsWith(carBrand) ? carNameRaw.slice(carBrand.length) : carNameRaw;
          acts.push({
            date: b.createdAt ? b.createdAt.split('T')[0] : '',
            type: 'success',
            event: 'Booking Created',
            desc: `Booking for ${`${carBrand} ${carModel}`.replace(/\s+/g, ' ').trim() || 'Vehicle'} created.`
          });
        });
        users.slice(0, 3).forEach(u => {
          acts.push({
            date: u.createdAt ? u.createdAt.split('T')[0] : '',
            type: 'info',
            event: 'New Registration',
            desc: `${u.fullName || 'User'} registered an account.`
          });
        });
        AdminState.recentActivity = acts;

        AdminState.upcomingEvents = bookings
          .filter(b => b.bookingStatus === 'Pending Pickup' && b.rentalDetails && b.rentalDetails.pickupDateTime)
          .slice(0, 5)
          .map(b => {
            const isPickup = new Date(b.rentalDetails.pickupDateTime) >= new Date();
            return {
              title: `${isPickup ? 'Pickup' : 'Return'} · ${b.car ? (b.car.brand + ' ' + b.car.carName) : 'Vehicle'} · ${b.customer ? b.customer.fullName : 'Customer'}`,
              time: new Date(b.rentalDetails.pickupDateTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
              info: isPickup ? b.rentalDetails.pickupLocation || '' : (b.rentalDetails.returnLocation || ''),
              type: isPickup ? 'pickup' : 'return'
            };
          });

        AdminState.statsData = {
          ...AdminState.statsData,
          totalFleet: cars.length,
          availableVehicles: cars.filter(c => c.status === 'Available').length,
          reservedVehicles: bookings.filter(b => ['Pending Pickup', 'Active', 'Extended'].includes(b.bookingStatus)).length,
          currentlyRented: bookings.filter(b => ['Active', 'Extended'].includes(b.bookingStatus)).length,
          activeBookings: bookings.filter(b => ['Active', 'Extended'].includes(b.bookingStatus)).length,
          pendingBookings: bookings.filter(b => b.bookingStatus === 'Pending Pickup').length,
          pendingPrebookings: AdminState.preBookingsData.length,
          totalUsers: users.length,
          newUsersToday: users.filter(u => u.createdAt && u.createdAt.split('T')[0] === todayDateStr).length,
          todayPickups: todayPickups,
          todayReturns: todayReturns,
          monthlyRevenue: totalRevenue
        };

        const token2 = localStorage.getItem('token');
        return Promise.all([
          fetch('http://localhost:5000/api/admin/analytics/summary', { headers: { 'Authorization': `Bearer ${token2}` } })
            .then(res => res.json())
            .then(d => d.success ? d.data : null)
            .catch(() => null),
          fetch('http://localhost:5000/api/admin/analytics/bookings?days=30', { headers: { 'Authorization': `Bearer ${token2}` } })
            .then(res => res.json())
            .then(d => d.success ? d.data : null)
            .catch(() => null)
        ]).then(([summary, analytics]) => {
          if (summary) {
            AdminState.statsData = {
              ...AdminState.statsData,
              totalRevenue: summary.totalRevenue,
              todayRevenue: summary.todayRevenue,
              monthlyRevenue: summary.monthRevenue,
              completedBookings: summary.completedBookings,
              cancelledBookings: summary.cancelledBookings,
              totalCustomers: summary.totalCustomers
            };
          }
          if (analytics) {
            AdminState.bookingAnalyticsData = {
              daily: analytics.daily || [],
              weekly: analytics.weekly || [],
              monthly: analytics.monthly || [],
              statusDistribution: analytics.statusDistribution || [],
              topCars: analytics.topCars || [],
              activeCustomers: analytics.activeCustomers || []
            };
          }
          return true;
        });
      })
      .catch(() => false);
  }

  /* ============================================================
     19. INITIALIZATION
     ============================================================ */
  function init() {
    initAuthGuard();
    try { syncFleetWithCentralData(); } catch(e) { console.error("syncFleetWithCentralData error:", e); }
    fetchDashboardData().then(loaded => {
      if (loaded) {
        try { DashboardRenderer.navigate(AdminState.uiState.currentModule || 'overview'); } catch(e) { console.error("navigate-after-fetch error:", e); }
      }
    });
    try { restoreUiState(); } catch(e) { console.error("restoreUiState error:", e); }
    try { SidebarController.init(); } catch(e) { console.error("SidebarController.init error:", e); }
    try { HeaderController.init(); } catch(e) { console.error("HeaderController.init error:", e); }
    try { DropdownController.init(); } catch(e) { console.error("DropdownController.init error:", e); }
    try { ModalController.init(); } catch(e) { console.error("ModalController.init error:", e); }
    try { TabController.init(); } catch(e) { console.error("TabController.init error:", e); }
    try { DashboardRenderer.init(); } catch(e) { console.error("DashboardRenderer.init error:", e); }
    try { DropdownController.updateNotificationBadge(); } catch(e) { console.error("DropdownController.updateNotificationBadge error:", e); }

    try {
      const startModule = AdminState.uiState.currentModule || 'overview';
      DashboardRenderer.navigate(startModule);
    } catch(e) {
      console.error("DashboardRenderer.navigate error during init:", e);
    }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }


  /* ============================================================
     20. PUBLIC API
     ============================================================ */
  return {
    init,
    state: AdminState,
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
    // Public CRUD/Wizard triggers
    showVehicleDetails,
    switchDetailGallery,
    showVehicleWizard,
    fetchDashboardData,
    wizardGoBack,
    wizardGoNext,
    handleWizardPhotoUpload,
    saveWizardData,
    duplicateVehicle,
    archiveVehicle,
    deleteVehicle,
    setFleetViewMode,
    setFleetPage,
    // Phase 6 Bookings triggers
    setBookingsTab,
    setBookingsPage,
    setBookingsQuickFilter,
    showBookingDetails,
    closeBookingDetails,
    approveBookingModal,
    rejectBookingModal,
    submitBookingRejection,
    assignVehicleModal,
    submitVehicleAssignment,
    refreshBookingsView,
    // Pre-bookings triggers
    setPBPage,
    showPreBookingDetails,
    approvePreBooking,
    rejectPreBooking,
    submitPreBookingRejection,
    // Suggest alternative triggers
    showAlternativeSuggestionWizard,
    selectAlternativeVehicle,
    sugWizardBack,
    sugWizardNext,
    submitAlternativeSuggestion,
    // Phase 7 Customers triggers
    setUsersPage,
    suspendCustomer,
    activateCustomer,
    showCustomerDetails,
    editCustomerModal,
    saveCustomerEdit,
    // Phase 7 Extensions triggers
    setExtensionsPage,
    approveExtensionModal,
    submitExtensionApproval,
    rejectExtensionModal,
    submitExtensionRejection,
    // Phase 7 System triggers
    setNotificationsCategoryFilter,
    setNotificationsPage,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    deleteAllNotifications,
    // Phase 7 Reports triggers
    setReportsPeriod,
    applyCustomRange,
    simulateExport,
    // Phase 7 Settings triggers
    setSettingsTab,
    saveSettingsChanges,
    resetSettings,
    testSmtpConnection,
    revokeAdminSession,
  };

})();
