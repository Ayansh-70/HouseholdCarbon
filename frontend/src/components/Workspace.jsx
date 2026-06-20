import React, { useState, useEffect, useRef } from 'react';
import { submitFootprintData, fetchHeatmapHistory } from '../services/api';
import CarbonHeatmap from './CarbonHeatmap';
import GoalTracker from './GoalTracker';
import { useGoal } from '../hooks/useGoal';
import EquivalenceBadge from './EquivalenceBadge';
import AverageComparisonBadge from './AverageComparisonBadge';

// Emission factors
const EMISSION_FACTORS = {
  electricity: 0.42,
  water: 0.001,
  heating: {
    'Natural Gas': 5.3,
    'LPG': 6.32,
    'Heating Oil': 7.21,
    'Electric Heat Pump': 1.2,
    'Biomass': 0.8
  }
};

// Custom hook for animated numbers
function useAnimatedNumber(targetValue, duration = 600) {
  const [value, setValue] = useState(targetValue);
  const startValue = useRef(targetValue);
  const startTime = useRef(null);
  const animFrame = useRef(null);

  useEffect(() => {
    startValue.current = value;
    startTime.current = performance.now();

    const animate = (time) => {
      let progress = (time - startTime.current) / duration;
      if (progress > 1) progress = 1;
      
      // Easing function (easeOutExpo)
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startValue.current + (targetValue - startValue.current) * ease;
      
      setValue(current);
      
      if (progress < 1) {
        animFrame.current = requestAnimationFrame(animate);
      }
    };

    if (animFrame.current) cancelAnimationFrame(animFrame.current);
    animFrame.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animFrame.current);
  }, [targetValue, duration]);

  return value;
}

function Workspace() {
  const [formData, setFormData] = useState({
    electricity: '',
    naturalGas: '',
    water: '',
    householdSize: '',
    heatingFuel: 'LPG'
  });

  const [liveMetrics, setLiveMetrics] = useState({ total: 0, perCapita: 0 });
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Analyzing your footprint...");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [badgeText, setBadgeText] = useState("✦ GEMINI CONTEXT");

  const [activeTab, setActiveTab] = useState('summary');
  const [heatmapHistory, setHeatmapHistory] = useState([]);
  const [submittedCarbon, setSubmittedCarbon] = useState(null);

  const goalHook = useGoal(submittedCarbon);

  const animatedTotal = useAnimatedNumber(liveMetrics.total);
  const animatedPerCapita = useAnimatedNumber(liveMetrics.perCapita);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('hc_last_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
        setShowBanner(true);
      } catch(e) {}
    }

    // Load heatmap history
    fetchHeatmapHistory().then(data => {
      setHeatmapHistory(data);
      if (data.length > 0) {
        setSubmittedCarbon(data[data.length - 1].totalCarbon);
      }
    }).catch(err => console.error("Failed to load history:", err));
  }, []);

  // Save to localStorage and calculate live metrics
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('hc_last_session', JSON.stringify(formData));

      const electricity = Number(formData.electricity) || 0;
      const gas = Number(formData.naturalGas) || 0;
      const water = Number(formData.water) || 0;
      const size = Number(formData.householdSize) || 1;
      const fuel = formData.heatingFuel || 'LPG';

      const elecCo2 = electricity * EMISSION_FACTORS.electricity;
      const gasCo2 = gas * (EMISSION_FACTORS.heating[fuel] || 5.3);
      const waterCo2 = water * EMISSION_FACTORS.water;

      const total = elecCo2 + gasCo2 + waterCo2;
      const perCapita = total / size;

      setLiveMetrics({ total, perCapita });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [formData]);

  // Handle loading text cycle
  useEffect(() => {
    let interval;
    if (isLoading) {
      const messages = ["Analyzing your footprint...", "Consulting Gemini AI...", "Building your reduction plan..."];
      let i = 0;
      setLoadingText(messages[0]);
      interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingText(messages[i]);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    // Clear validation error if typing
    if (validationErrors[id]) {
      setValidationErrors(prev => ({ ...prev, [id]: null }));
    }
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleClearData = () => {
    localStorage.removeItem('hc_last_session');
    setFormData({ electricity: '', naturalGas: '', water: '', householdSize: '', heatingFuel: 'LPG' });
    setShowBanner(false);
    setResult(null);
    setValidationErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.electricity && formData.electricity !== 0) errors.electricity = "This field is required.";
    if (!formData.naturalGas && formData.naturalGas !== 0) errors.naturalGas = "This field is required.";
    if (!formData.water && formData.water !== 0) errors.water = "This field is required.";
    if (!formData.householdSize && formData.householdSize !== 0) errors.householdSize = "This field is required.";
    if (!formData.heatingFuel) errors.heatingFuel = "This field is required.";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setBadgeText("✦ GEMINI CONTEXT");

    try {
      // Map UI fuel types to strict backend Zod schema enums ('gas', 'electric', 'oil', 'none')
      let mappedFuel = 'none';
      if (formData.heatingFuel === 'Natural Gas') mappedFuel = 'gas';
      else if (formData.heatingFuel === 'Electric Heat Pump') mappedFuel = 'electric';
      else if (formData.heatingFuel === 'LPG' || formData.heatingFuel === 'Heating Oil') mappedFuel = 'oil';
      else if (formData.heatingFuel === 'Biomass') mappedFuel = 'none';

      const payload = {
        electricity: Number(formData.electricity),
        naturalGas: Number(formData.naturalGas),
        water: Number(formData.water),
        householdSize: Number(formData.householdSize),
        heatingFuel: mappedFuel 
      };

      const data = await submitFootprintData(payload);
      setResult(data);
      setSubmittedCarbon(data.calculation.totalCO2e);
      
      // Refresh heatmap data
      const newHistory = await fetchHeatmapHistory();
      setHeatmapHistory(newHistory);
      
      // Scroll to top of results
      document.querySelector('.bento-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Flash badge
      setBadgeText("✦ UPDATED");
      setTimeout(() => setBadgeText("✦ GEMINI CONTEXT"), 2000);

    } catch (err) {
      setError(err.message || 'Failed to finalize calculation request pipelines.');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine color for total footprint
  const getTotalColor = (total) => {
    if (total > 500) return '#e85d4a';
    if (total >= 200) return '#f5a623';
    return '#00c896';
  };

  const totalColor = getTotalColor(liveMetrics.total);
  const showBenchmark = liveMetrics.total > 0 && result !== null;

  return (
    <section id="workspace-section">
      <div className="workspace-wrapper">
        
        {/* Interactive Data Entry Form Panel */}
        <div className="input-panel">
          {showBanner && (
            <div className="welcome-banner">
              <span><strong>Welcome back!</strong> We restored your last session's data.</span>
              <button onClick={() => setShowBanner(false)}>&times;</button>
            </div>
          )}

          <h3 className="panel-title">Resource Ledger</h3>
          <p className="panel-subtitle">Enter your monthly home usage below.</p>
          
          <form id="footprint-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="electricity">MONTHLY ELECTRICITY USE (kWh)</label>
              <input 
                type="number" 
                id="electricity" 
                className={`form-control ${validationErrors.electricity ? 'input-error' : ''}`} 
                placeholder="e.g. 350" 
                min="0"
                value={formData.electricity}
                onChange={handleChange}
              />
              {validationErrors.electricity && <span className="inline-error-text">{validationErrors.electricity}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="naturalGas">MONTHLY GAS OR HEATING FUEL (therms)</label>
              <input 
                type="number" 
                id="naturalGas" 
                className={`form-control ${validationErrors.naturalGas ? 'input-error' : ''}`} 
                placeholder="e.g. 15" 
                min="0"
                value={formData.naturalGas}
                onChange={handleChange}
              />
              {validationErrors.naturalGas && <span className="inline-error-text">{validationErrors.naturalGas}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="water">MONTHLY WATER USE (liters)</label>
              <input 
                type="number" 
                id="water" 
                className={`form-control ${validationErrors.water ? 'input-error' : ''}`} 
                placeholder="e.g. 1200" 
                min="0"
                value={formData.water}
                onChange={handleChange}
              />
              {validationErrors.water && <span className="inline-error-text">{validationErrors.water}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="householdSize">NUMBER OF PEOPLE IN HOME</label>
              <input 
                type="number" 
                id="householdSize" 
                className={`form-control ${validationErrors.householdSize ? 'input-error' : ''}`} 
                placeholder="Number of residents" 
                min="1"
                value={formData.householdSize}
                onChange={handleChange}
              />
              {validationErrors.householdSize && <span className="inline-error-text">{validationErrors.householdSize}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="heatingFuel">MAIN HEATING FUEL TYPE</label>
              <select 
                id="heatingFuel" 
                className={`form-control ${validationErrors.heatingFuel ? 'input-error' : ''}`} 
                value={formData.heatingFuel}
                onChange={handleChange}
              >
                <option value="" disabled>Select fuel type...</option>
                <option value="Natural Gas">Natural Gas</option>
                <option value="Electric Heat Pump">Electric Heat Pump</option>
                <option value="LPG">LPG</option>
                <option value="Heating Oil">Heating Oil</option>
                <option value="Biomass">Biomass</option>
              </select>
              {validationErrors.heatingFuel && <span className="inline-error-text">{validationErrors.heatingFuel}</span>}
            </div>
            
            <button type="submit" className="submit-btn" disabled={isLoading}>
              <span>{isLoading ? 'Processing...' : 'Calculate Global Footprint'}</span>
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button type="button" onClick={handleClearData} style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer' }}>
                Clear saved data
              </button>
            </div>
          </form>

          <GoalTracker hookState={goalHook} />
        </div>
        
        {/* Real-Time Premium Bento Presentation Output Panel Grid */}
        <div className="bento-grid">
          
          <div className="bento-card">
            <p className="card-label">Absolute Total Footprint</p>
            <div className="score-display" style={{ color: totalColor, transition: 'color 0.5s ease' }}>
              {animatedTotal.toFixed(2)}
              <span className="score-unit">CO₂e kg</span>
            </div>
            
            {/* Context Row for Equivalence and National Average */}
            {liveMetrics.total > 0 && (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                <EquivalenceBadge kgCO2={liveMetrics.total} />
                <AverageComparisonBadge kgCO2={liveMetrics.total} />
              </div>
            )}
          </div>
          
          <div className="bento-card">
            <p className="card-label">Per-Capita Allocation</p>
            <div className="score-display">
              {animatedPerCapita.toFixed(2)}
              <span className="score-unit">kg/person</span>
            </div>
          </div>

          {showBenchmark && (
            <div className="bento-card col-span-2 fade-in" style={{ paddingBottom: '3rem' }}>
              <p className="card-label" style={{ color: '#00c896', fontSize: '0.7rem', letterSpacing: '0.05em' }}>MONTHLY HOUSEHOLD BENCHMARK</p>
              <div className="benchmark-container">
                <div className="benchmark-bar-wrapper">
                  <div className="benchmark-zone green"></div>
                  <div className="benchmark-zone yellow"></div>
                  <div className="benchmark-zone red"></div>
                  
                  {/* Global refs */}
                  <div className="benchmark-ref" style={{ left: '10%' }}>India (145)</div>
                  <div className="benchmark-ref" style={{ left: '25%' }}>Paris (208)</div>
                  <div className="benchmark-ref" style={{ left: '60%' }}>Global (375)</div>

                  {/* User marker - cap at 100% */}
                  <div className="benchmark-marker" style={{ left: `${Math.min(100, (liveMetrics.total / 600) * 100)}%` }}>
                    <div className="benchmark-marker-label">You: {Math.round(liveMetrics.total)} kg</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="bento-card col-span-2 ai-advisor-card">
            <div className="dashboard-tabs">
              <button className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>AI Summary</button>
              <button className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>Timeline</button>
            </div>
            
            {activeTab === 'summary' ? (
              <>
                <div className="ai-badge" style={{ transition: 'all 0.3s' }}>{badgeText}</div>
                <p className="card-label" style={{ color: '#06B6D4' }}>Strategic Reduction Model</p>
                
                {isLoading && (
                  <div className="spinner-container fade-in">
                    <div className="custom-spinner"></div>
                    <div className="spinner-text">{loadingText}</div>
                  </div>
                )}
                
                {!isLoading && result && result.insights && (
                  <div className="ai-content fade-in">
                    {result.insightsSource === 'fallback' && (
                      <p style={{ color: '#ef4444', marginBottom: '1rem', fontStyle: 'italic', fontSize: '0.85rem' }}>
                        Showing general tips as AI insights are currently unavailable.
                      </p>
                    )}
                    
                    <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                      {result.insights.summary}
                    </p>

                    {result.insights.actions && result.insights.actions.map((action, idx) => {
                      let borderColor = '#00c896'; // default
                      if (action.category === 'electricity') borderColor = '#f5a623'; // yellow
                      if (action.category === 'heating') borderColor = '#e85d4a'; // orange/red
                      if (action.category === 'water') borderColor = '#3b82f6'; // blue
                      
                      return (
                        <div key={idx} className="ai-action-card" style={{ borderLeftColor: borderColor }}>
                          <div className="ai-action-header">
                            <span className="ai-action-title">{action.title}</span>
                            {action.estimated_saving_kg && (
                              <span className="ai-action-badge">~{action.estimated_saving_kg} kg saved/mo</span>
                            )}
                          </div>
                          <span className="ai-action-detail">{action.detail}</span>
                        </div>
                      );
                    })}

                    <p style={{ color: '#00c896', fontStyle: 'italic', fontSize: '0.813rem', marginTop: '1.5rem', textAlign: 'center' }}>
                      {result.insights.encouragement}
                    </p>
                  </div>
                )}

                {!isLoading && !result && !error && (
                  <div className="ai-content">
                    <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9rem' }}>
                      Fill in your monthly usage on the left and click Calculate — Gemini AI will build your personal reduction plan.
                    </p>
                  </div>
                )}

                {!isLoading && error && (
                  <div className="ai-content">
                    <p style={{ color: '#ef4444', fontStyle: 'italic' }}>{error}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="timeline-tab-content fade-in">
                <CarbonHeatmap history={heatmapHistory} />
              </div>
            )}
          </div>
        </div>
        
      </div>
    </section>
  );
}

export default Workspace;
