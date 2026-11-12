/**
 * Centralized Vehicle API Data Source for JET CABS
 * This file replaces the static array with backend API fetches.
 */

window.vehiclesData = []; // Fallback empty array just in case legacy code checks it

window.CarAPI = {
  baseUrl: '/api/cars',

  /**
   * Fetch cars from the backend API with query parameters.
   * @param {Object} params - Query parameters (search, category, page, limit, sort, minPrice, maxPrice, etc.)
   * @returns {Promise<Object>} - The API response object
   */
  async fetchCars(params = {}) {
    try {
      const url = new URL(this.baseUrl);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          url.searchParams.append(key, params[key]);
        }
      });
      
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch cars');
      return data;
    } catch (error) {
      console.error('CarAPI fetchCars Error:', error);
      throw error;
    }
  },

  /**
   * Fetch a single car by its ID.
   * @param {String} id - The car ID
   * @returns {Promise<Object>} - The API response object
   */
  async fetchCarById(id) {
    try {
      const res = await fetch(`${this.baseUrl}/${id}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch car');
      return data;
    } catch (error) {
      console.error('CarAPI fetchCarById Error:', error);
      throw error;
    }
  }
};
