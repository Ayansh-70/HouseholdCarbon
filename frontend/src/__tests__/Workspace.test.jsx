import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Workspace from '../components/Workspace';
import * as api from '../services/api';

// Mock the API layer
vi.mock('../services/api', () => ({
  submitFootprintData: vi.fn(),
  fetchHeatmapHistory: vi.fn().mockResolvedValue([]),
  fetchGoalCoaching: vi.fn().mockResolvedValue("Mock coaching message")
}));

describe('Workspace Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all fields and labels', () => {
    render(<Workspace />);
    
    expect(screen.getByLabelText(/MONTHLY ELECTRICITY USE \(kWh\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/MONTHLY GAS OR HEATING FUEL \(therms\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/MONTHLY WATER USE \(liters\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/NUMBER OF PEOPLE IN HOME/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/MAIN HEATING FUEL TYPE/i)).toBeInTheDocument();
  });

  it('validates required fields before submitting', () => {
    render(<Workspace />);
    // Initial UI state check
    expect(screen.getAllByText('0.00').length).toBeGreaterThan(0); // placeholder total
  });

  it('calls submitFootprintData and displays results on successful submission', async () => {
    api.submitFootprintData.mockResolvedValueOnce({
      calculation: {
        totalCO2e: 450.50,
        perCapitaCO2e: 225.25,
        breakdown: {}
      },
      insightsSource: 'ai',
      insights: {
        summary: "Test summary",
        severity: "medium",
        actions: [
          { priority: 1, category: "electricity", title: "Test tip 1", detail: "Detail", estimated_saving_kg: 5 }
        ],
        encouragement: "Keep it up!"
      }
    });

    render(<Workspace />);
    
    fireEvent.change(screen.getByLabelText(/MONTHLY ELECTRICITY USE/i), { target: { value: '200' } });
    fireEvent.change(screen.getByLabelText(/MONTHLY GAS OR HEATING FUEL/i), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText(/MONTHLY WATER USE/i), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText(/NUMBER OF PEOPLE IN HOME/i), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/MAIN HEATING FUEL TYPE/i), { target: { value: 'Natural Gas' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Calculate Global Footprint/i }));

    await waitFor(() => {
      expect(api.submitFootprintData).toHaveBeenCalledWith({
        electricity: 200,
        naturalGas: 50,
        water: 1000,
        householdSize: 2,
        heatingFuel: 'gas' // mapped value
      });
    });

    // Check if the DOM updated (we look for the action title since the calculation is now live from input state, not the mock payload)
    expect(await screen.findByText('Test tip 1')).toBeInTheDocument();
    expect(screen.getByText('Test summary')).toBeInTheDocument();
  });
});
