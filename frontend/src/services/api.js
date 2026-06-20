const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Submits the user's footprint data to the backend.
 * @param {Object} data - The footprint input data containing electricity, gas, water, householdSize, and heatingFuel
 * @returns {Promise<Object>} The footprint calculation and AI insights result
 */
export const submitFootprintData = async (data) => {
  const response = await fetch(`${API_BASE_URL}/footprint`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok || !result.success) {
    if (result.details) {
      throw new Error(result.details.map(d => d.message).join(', '));
    }
    throw new Error(result.error || 'Failed to calculate footprint');
  }

  return result.data;
};

/**
 * Fetches the footprint history for the user.
 * @returns {Promise<Array>} An array of historical footprint entries
 */
export const fetchHistory = async () => {
  const response = await fetch(`${API_BASE_URL}/footprint/history`);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch history');
  }

  return result.data;
};
/**
 * Fetches the footprint history specifically formatted for the heatmap visualization.
 * @returns {Promise<Array>} An array of formatted history entries for the heatmap
 */
export const fetchHeatmapHistory = async () => {
  const response = await fetch(`${API_BASE_URL}/history`);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch history');
  }

  return result.data;
};

/**
 * Fetches goal coaching messages from the AI based on the user's progress.
 * @param {Object} data - The current goal tracking data
 * @returns {Promise<string>} The AI-generated coaching message
 */
export const fetchGoalCoaching = async (data) => {
  const response = await fetch(`${API_BASE_URL}/goal-coaching`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch coaching');
  }

  return result.message;
};
