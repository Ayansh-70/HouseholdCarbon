import React, { useState } from 'react';
import { submitFootprintData } from '../services/api';

function Workspace() {
  const [formData, setFormData] = useState({
    electricity: '',
    naturalGas: '',
    water: '',
    householdSize: '',
    heatingFuel: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      // Map DOM id to our data model keys
      [id === 'gas' ? 'naturalGas' : id === 'household-size' ? 'householdSize' : id === 'fuel-type' ? 'heatingFuel' : id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = {
        electricity: Number(formData.electricity),
        naturalGas: Number(formData.naturalGas),
        water: Number(formData.water),
        householdSize: Number(formData.householdSize),
        heatingFuel: formData.heatingFuel.toLowerCase() // mapping "Natural Gas" -> "gas", wait, our validation expects "electric", "gas", "oil", "none"
      };

      // Map template fuel types to our strict API payload
      if (formData.heatingFuel === 'Natural Gas') payload.heatingFuel = 'gas';
      if (formData.heatingFuel === 'Electricity') payload.heatingFuel = 'electric';
      if (formData.heatingFuel === 'LPG') payload.heatingFuel = 'oil'; // map LPG to oil penalty
      if (formData.heatingFuel === 'Biomass') payload.heatingFuel = 'none'; // map Biomass to none
      if (!payload.heatingFuel) payload.heatingFuel = 'gas'; // fallback just in case

      const data = await submitFootprintData(payload);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to finalize calculation request pipelines.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="workspace-section">
      <div className="workspace-wrapper">
        
        {/* Interactive Data Entry Form Panel */}
        <div className="input-panel">
          <h3 className="panel-title">Resource Ledger</h3>
          <p className="panel-subtitle">Provide your average monthly operational data parameters below.</p>
          
          <form id="footprint-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="electricity">Monthly Electricity (kWh)</label>
              <input 
                type="number" 
                id="electricity" 
                className="form-control" 
                placeholder="e.g. 350" 
                required 
                min="0"
                value={formData.electricity}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="gas">Monthly Natural Gas (therms)</label>
              <input 
                type="number" 
                id="gas" 
                className="form-control" 
                placeholder="e.g. 15" 
                required 
                min="0"
                value={formData.naturalGas}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="water">Monthly Water Volume (liters)</label>
              <input 
                type="number" 
                id="water" 
                className="form-control" 
                placeholder="e.g. 1200" 
                required 
                min="0"
                value={formData.water}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="household-size">Household Occupancy Size</label>
              <input 
                type="number" 
                id="household-size" 
                className="form-control" 
                placeholder="Number of residents" 
                required 
                min="1"
                value={formData.householdSize}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="fuel-type">Primary Thermal Heating Profile</label>
              <select 
                id="fuel-type" 
                className="form-control" 
                required
                value={formData.heatingFuel}
                onChange={handleChange}
              >
                <option value="" disabled>Select fuel type...</option>
                <option value="Natural Gas">Natural Gas Combustion</option>
                <option value="Electricity">Electric Grid Heat Pump</option>
                <option value="LPG">Liquefied Petroleum Gas (LPG)</option>
                <option value="Biomass">Biomass / Wood Pellets</option>
              </select>
            </div>
            
            <button type="submit" className="submit-btn" disabled={isLoading}>
              <span>{isLoading ? 'Processing...' : 'Calculate Global Footprint'}</span>
            </button>
            
            {error && (
              <div className="error-banner" style={{ display: 'block' }}>
                {error}
              </div>
            )}
          </form>
        </div>
        
        {/* Real-Time Premium Bento Presentation Output Panel Grid */}
        <div className="bento-grid">
          
          {/* Bento Block A: Absolute Carbon Weight Valuation Badge */}
          <div className="bento-card">
            <p className="card-label">Absolute Total Footprint</p>
            <div className="score-display">
              {result ? result.calculation.totalCO2e.toFixed(2) : '0.00'}
              <span className="score-unit">CO₂e kg</span>
            </div>
          </div>
          
          {/* Bento Block B: Relative Per-Capita Carbon Distribution Metric Badge */}
          <div className="bento-card">
            <p className="card-label">Per-Capita Allocation</p>
            <div className="score-display">
              {result ? result.calculation.perCapitaCO2e.toFixed(2) : '0.00'}
              <span className="score-unit">kg/person</span>
            </div>
          </div>
          
          {/* Bento Block C: Gemini Prompt-Engine Output Block Container Frame */}
          <div className="bento-card col-span-2 ai-advisor-card">
            <div className="ai-badge">✨ Gemini Context</div>
            <p className="card-label" style={{ color: '#06B6D4' }}>Strategic Reduction Model</p>
            
            {isLoading && (
              <div className="skeleton-loader" style={{ display: 'block' }}>
                <div className="skeleton-bar" style={{ height: '1.25rem', width: '45%', marginBottom: '1.25rem' }}></div>
                <div className="skeleton-bar" style={{ height: '0.875rem', width: '100%', marginBottom: '0.75rem' }}></div>
                <div className="skeleton-bar" style={{ height: '0.875rem', width: '92%', marginBottom: '0.75rem' }}></div>
                <div className="skeleton-bar" style={{ height: '0.875rem', width: '96%', marginBottom: '0.75rem' }}></div>
                <div className="skeleton-bar" style={{ height: '0.875rem', width: '78%', marginBottom: '1.5rem' }}></div>
                <div className="skeleton-bar" style={{ height: '1.125rem', width: '35%', marginBottom: '1rem' }}></div>
                <div className="skeleton-bar" style={{ height: '0.875rem', width: '88%', marginBottom: '0.75rem' }}></div>
                <div className="skeleton-bar" style={{ height: '0.875rem', width: '84%' }}></div>
              </div>
            )}
            
            {!isLoading && result && (
              <div className="ai-content">
                {result.insightsSource === 'fallback' && (
                  <p style={{ color: '#ef4444', marginBottom: '1rem' }}>
                    <em>Showing general tips as AI insights are currently unavailable.</em>
                  </p>
                )}
                <ul>
                  {result.insights.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {!isLoading && !result && !error && (
              <div className="ai-content">
                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Provide your consumption parameters and submit to initialize real-time prompt-engineered environmental strategy responses.</p>
              </div>
            )}

            {!isLoading && error && (
              <div className="ai-content">
                <p style={{ color: '#ef4444', fontStyle: 'italic' }}>Pipeline execution failed.</p>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </section>
  );
}

export default Workspace;
