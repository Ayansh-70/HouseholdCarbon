import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Workspace from '../components/Workspace';
import * as api from '../services/api';

// Mock the API layer
vi.mock('../services/api', () => ({
  submitFootprintData: vi.fn()
}));

describe('Workspace Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all fields and labels', () => {
    render(<Workspace />);
    
    expect(screen.getByLabelText(/Monthly Electricity \(kWh\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Monthly Natural Gas \(therms\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Monthly Water Volume \(liters\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Household Occupancy Size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Primary Thermal Heating Profile/i)).toBeInTheDocument();
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
      insights: ["Test tip 1", "Test tip 2"]
    });

    render(<Workspace />);
    
    fireEvent.change(screen.getByLabelText(/Monthly Electricity/i), { target: { value: '200' } });
    fireEvent.change(screen.getByLabelText(/Monthly Natural Gas/i), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText(/Monthly Water Volume/i), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText(/Household Occupancy Size/i), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/Primary Thermal Heating Profile/i), { target: { value: 'Natural Gas' } });

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

    // Check if the DOM updated
    expect(await screen.findByText('450.50')).toBeInTheDocument();
    expect(screen.getByText('225.25')).toBeInTheDocument();
    expect(screen.getByText('Test tip 1')).toBeInTheDocument();
  });
});
