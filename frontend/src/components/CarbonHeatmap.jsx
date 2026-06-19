import React, { useState, useMemo } from 'react';
import './CarbonHeatmap.css';

const WEEKS = 13;
const DAYS_PER_WEEK = 7;
const TOTAL_DAYS = WEEKS * DAYS_PER_WEEK; // 91 days (13 weeks)

// Color scale function
const getIntensityLevel = (totalCarbon) => {
  if (totalCarbon === undefined || totalCarbon === null) return 0;
  if (totalCarbon <= 2) return 1;
  if (totalCarbon <= 5) return 2;
  if (totalCarbon <= 10) return 3;
  if (totalCarbon <= 20) return 4;
  return 5;
};

export default function CarbonHeatmap({ history = [] }) {
  const [selectedDay, setSelectedDay] = useState(null);

  // Generate grid structure
  const { grid, monthLabels } = useMemo(() => {
    const today = new Date();
    // Normalize today to start of day
    today.setHours(0, 0, 0, 0);

    // Find the end date: this coming Saturday to finish the current week, 
    // or if today is Saturday, today is the end.
    const endDayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
    const daysUntilSaturday = 6 - endDayOfWeek;
    
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + daysUntilSaturday);

    // Calculate start date (13 weeks ago, Sunday)
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - TOTAL_DAYS + 1);

    // Map history to an easily accessible dictionary by YYYY-MM-DD
    const historyMap = {};
    history.forEach(entry => {
      if (entry && entry.date) {
        historyMap[entry.date] = entry;
      }
    });

    const generatedGrid = [];
    let currentMonth = -1;
    const labels = [];

    // Columns are weeks, rows are days of the week (Sunday -> Saturday)
    for (let col = 0; col < WEEKS; col++) {
      const weekCol = [];
      let monthChangedInWeek = false;

      for (let row = 0; row < DAYS_PER_WEEK; row++) {
        const currentCellDate = new Date(startDate);
        currentCellDate.setDate(startDate.getDate() + (col * 7) + row);
        
        // Month label logic (anchor it to the first week a month changes)
        if (currentCellDate.getMonth() !== currentMonth && currentCellDate.getDate() <= 7) {
          currentMonth = currentCellDate.getMonth();
          monthChangedInWeek = true;
          labels.push({ col, label: currentCellDate.toLocaleString('default', { month: 'short' }) });
        }

        const dateStr = currentCellDate.toISOString().split('T')[0];
        const data = historyMap[dateStr] || null;
        
        weekCol.push({
          dateStr,
          data,
          level: data ? getIntensityLevel(data.totalCarbon) : 0,
          isFuture: currentCellDate > today
        });
      }
      generatedGrid.push(weekCol);
    }

    return { grid: generatedGrid, monthLabels: labels };
  }, [history]);

  if (!history || history.length === 0) {
    return (
      <div className="heatmap-empty-state">
        <p>Submit your first footprint to start building your timeline</p>
      </div>
    );
  }

  return (
    <div className="carbon-heatmap-container">
      <div className="heatmap-scroll-wrapper">
        <div className="heatmap-inner">
          <div className="heatmap-months">
            {monthLabels.map((ml, i) => (
              <span key={i} style={{ gridColumn: ml.col + 1 }}>{ml.label}</span>
            ))}
          </div>
          
          <div className="heatmap-grid-area">
            <div className="heatmap-days">
              <span></span>
              <span>M</span>
              <span></span>
              <span>W</span>
              <span></span>
              <span>F</span>
              <span></span>
            </div>
            
            <div className="heatmap-grid">
              {grid.map((week, weekIndex) => (
                <div key={weekIndex} className="heatmap-col">
                  {week.map((day, dayIndex) => (
                    <div 
                      key={day.dateStr}
                      className={`heatmap-cell level-${day.level} ${day.isFuture ? 'future' : ''} ${selectedDay?.dateStr === day.dateStr ? 'selected' : ''}`}
                      onClick={() => !day.isFuture && setSelectedDay(day)}
                      data-tooltip={day.isFuture ? null : `${day.dateStr}: ${day.data ? day.data.totalCarbon.toFixed(1) : 'No data'} kg CO₂`}
                      aria-label={day.isFuture ? null : `${day.dateStr}: ${day.data ? day.data.totalCarbon.toFixed(1) : 'No data'} kg CO₂`}
                    ></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        <span>Less</span>
        <div className="heatmap-cell level-0"></div>
        <div className="heatmap-cell level-1"></div>
        <div className="heatmap-cell level-2"></div>
        <div className="heatmap-cell level-3"></div>
        <div className="heatmap-cell level-4"></div>
        <div className="heatmap-cell level-5"></div>
        <span>More</span>
      </div>

      {selectedDay && (
        <div className="heatmap-detail-panel fade-in">
          <h4>{new Date(selectedDay.dateStr).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h4>
          
          {!selectedDay.data ? (
            <p className="no-data-text">No data recorded for this day</p>
          ) : (
            <div className="detail-stats">
              <div className="detail-total">
                <span className="big-num">{selectedDay.data.totalCarbon.toFixed(1)}</span>
                <span className="unit">kg CO₂e</span>
              </div>
              
              <div className="breakdown-bars">
                <div className="bar-row">
                  <span className="bar-label">Electricity</span>
                  <div className="bar-track">
                    <div className="bar-fill electricity" style={{ width: `${Math.min(100, (selectedDay.data.electricity / selectedDay.data.totalCarbon) * 100)}%` }}></div>
                  </div>
                  <span className="bar-value">{selectedDay.data.electricity.toFixed(1)} kg</span>
                </div>
                <div className="bar-row">
                  <span className="bar-label">Heating</span>
                  <div className="bar-track">
                    <div className="bar-fill heating" style={{ width: `${Math.min(100, (selectedDay.data.gas / selectedDay.data.totalCarbon) * 100)}%` }}></div>
                  </div>
                  <span className="bar-value">{selectedDay.data.gas.toFixed(1)} kg</span>
                </div>
                <div className="bar-row">
                  <span className="bar-label">Water</span>
                  <div className="bar-track">
                    <div className="bar-fill water" style={{ width: `${Math.min(100, (selectedDay.data.water / selectedDay.data.totalCarbon) * 100)}%` }}></div>
                  </div>
                  <span className="bar-value">{selectedDay.data.water.toFixed(1)} kg</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
