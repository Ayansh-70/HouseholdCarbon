const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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

export const fetchHistory = async () => {
  const response = await fetch(`${API_BASE_URL}/footprint/history`);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch history');
  }

  return result.data;
};
export const fetchHeatmapHistory = async () => {
  const response = await fetch(`${API_BASE_URL}/history`);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch history');
  }

  return result.data;
};

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
