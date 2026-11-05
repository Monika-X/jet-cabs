/* ============================================================
   CAR RENTAL SYSTEM — VALIDATION.JS
   Reusable Form Validation Helpers
   ============================================================ */

'use strict';

const Validate = (() => {

  /* ---- Regex Patterns ---- */
  const patterns = {
    email:    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    phone:    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]{7,15}$/,
    name:     /^[a-zA-Z\s'-]{2,50}$/,
    password: /^.{8,}$/,
    url:      /^https?:\/\/.+/,
  };

  /* ============================================================
     1. FIELD VALIDATORS
     ============================================================ */

  /**
   * Check if field is non-empty
   * @param {string} value
   * @returns {boolean}
   */
  function isRequired(value) {
    return value !== null && value !== undefined && value.toString().trim().length > 0;
  }

  /**
   * Validate email format
   * @param {string} email
   * @returns {boolean}
   */
  function isValidEmail(email) {
    return patterns.email.test(email.trim());
  }

  /**
   * Validate phone number format
   * @param {string} phone
   * @returns {boolean}
   */
  function isValidPhone(phone) {
    return patterns.phone.test(phone.trim());
  }

  /**
   * Validate name (letters, spaces, hyphens, apostrophes)
   * @param {string} name
   * @returns {boolean}
   */
  function isValidName(name) {
    return patterns.name.test(name.trim());
  }

  /**
   * Check minimum length
   * @param {string} value
   * @param {number} min
   * @returns {boolean}
   */
  function minLength(value, min) {
    return value.trim().length >= min;
  }

  /**
   * Check maximum length
   * @param {string} value
   * @param {number} max
   * @returns {boolean}
   */
  function maxLength(value, max) {
    return value.trim().length <= max;
  }

  /**
   * Check if two values match (e.g., password confirmation)
   * @param {string} value1
   * @param {string} value2
   * @returns {boolean}
   */
  function matches(value1, value2) {
    return value1 === value2;
  }

  /* ============================================================
     2. PASSWORD STRENGTH
     ============================================================ */

  /**
   * Calculate password strength
   * @param {string} password
   * @returns {{ score: number, label: string, color: string }}
   */
  function getPasswordStrength(password) {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const levels = [
      { min: 0, label: 'Very Weak', color: '#EF4444' },
      { min: 2, label: 'Weak',      color: '#F97316' },
      { min: 3, label: 'Fair',      color: '#F59E0B' },
      { min: 4, label: 'Good',      color: '#22C55E' },
      { min: 5, label: 'Strong',    color: '#16A34A' },
      { min: 6, label: 'Very Strong', color: '#15803D' },
    ];

    const level = [...levels].reverse().find(l => score >= l.min) || levels[0];

    return {
      score,
      maxScore: 6,
      label: level.label,
      color: level.color,
      percentage: Math.round((score / 6) * 100)
    };
  }

  /* ============================================================
     3. DATE VALIDATION
     ============================================================ */

  /**
   * Check if a date is in the future
   * @param {string} dateStr
   * @returns {boolean}
   */
  function isFutureDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }

  /**
   * Check if end date is after start date
   * @param {string} startStr
   * @param {string} endStr
   * @returns {boolean}
   */
  function isValidDateRange(startStr, endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    return end > start;
  }

  /* ============================================================
     4. UI HELPERS — Show / Clear Errors
     ============================================================ */

  /**
   * Show error message on a form field
   * @param {HTMLElement} input - The input element
   * @param {string} message - Error message
   */
  function showError(input, message) {
    if (!input) return;

    input.classList.add('error');
    input.classList.remove('success');

    const group = input.closest('.form-group');
    if (group) {
      const errorEl = group.querySelector('.form-error');
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('visible');
      }
    }
  }

  /**
   * Clear error on a form field
   * @param {HTMLElement} input
   */
  function clearError(input) {
    if (!input) return;

    input.classList.remove('error');

    const group = input.closest('.form-group');
    if (group) {
      const errorEl = group.querySelector('.form-error');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
      }
    }
  }

  /**
   * Show success state on a form field
   * @param {HTMLElement} input
   */
  function showSuccess(input) {
    if (!input) return;

    input.classList.remove('error');
    input.classList.add('success');

    const group = input.closest('.form-group');
    if (group) {
      const errorEl = group.querySelector('.form-error');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
      }
    }
  }

  /**
   * Clear all errors in a form
   * @param {HTMLFormElement} form
   */
  function clearAllErrors(form) {
    if (!form) return;

    form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(input => {
      clearError(input);
    });
  }

  /* ============================================================
     5. FORM HANDLER
     ============================================================ */

  /**
   * Setup a form with validation and submit handling
   * @param {string} formId - Form element ID
   * @param {Object} rules - Validation rules { fieldName: [{ validate: fn, message: string }] }
   * @param {Function} onSuccess - Called with form data when validation passes
   */
  function setupForm(formId, rules, onSuccess) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      clearAllErrors(form);
      let isValid = true;

      // Run validation rules
      for (const [fieldName, fieldRules] of Object.entries(rules)) {
        const input = form.querySelector(`[name="${fieldName}"]`);
        if (!input) continue;

        const value = input.value;

        for (const rule of fieldRules) {
          if (!rule.validate(value, form)) {
            showError(input, rule.message);
            isValid = false;
            break; // stop at first error for this field
          }
        }

        if (isValid) {
          showSuccess(input);
        }
      }

      if (isValid && typeof onSuccess === 'function') {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        onSuccess(data, form);
      }
    });

    // Real-time validation on blur
    form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(input => {
      input.addEventListener('blur', () => {
        const fieldName = input.getAttribute('name');
        if (!fieldName || !rules[fieldName]) return;

        clearError(input);
        const value = input.value;

        for (const rule of rules[fieldName]) {
          if (!rule.validate(value, form)) {
            showError(input, rule.message);
            break;
          }
        }
      });

      // Clear error on focus
      input.addEventListener('focus', () => {
        clearError(input);
      });
    });
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */
  return {
    isRequired,
    isValidEmail,
    isValidPhone,
    isValidName,
    minLength,
    maxLength,
    matches,
    getPasswordStrength,
    isFutureDate,
    isValidDateRange,
    showError,
    clearError,
    showSuccess,
    clearAllErrors,
    setupForm,
  };

})();
