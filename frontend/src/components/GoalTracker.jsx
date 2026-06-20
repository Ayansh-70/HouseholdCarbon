import { useState } from 'react';
import './GoalTracker.css';

export default function GoalTracker({ hookState }) {
  const { goal, startGoal, resetGoal, activeCoachingPanel, dismissCoachingPanel, currentProgress, isLoadingCoaching } = hookState;
  const [percentInput, setPercentInput] = useState(20);
  const [daysInput, setDaysInput] = useState(60);
  const [showHistory, setShowHistory] = useState(false);

  const handleStart = (e) => {
    e.preventDefault();
    // Use the latest carbon or fallback to 0 if they haven't calculated yet
    const baseline = hookState.currentCarbon || 0;
    startGoal(percentInput, daysInput, baseline);
  };

  if (!goal) {
    return (
      <div className="goal-tracker-container setup-mode">
        <h4>Set a reduction goal</h4>
        <form onSubmit={handleStart} className="goal-setup-form">
          <span>Reduce by</span>
          <select value={percentInput} onChange={e => setPercentInput(Number(e.target.value))}>
            <option value={5}>5%</option>
            <option value={10}>10%</option>
            <option value={15}>15%</option>
            <option value={20}>20%</option>
            <option value={30}>30%</option>
            <option value={50}>50%</option>
          </select>
          <span>in</span>
          <select value={daysInput} onChange={e => setDaysInput(Number(e.target.value))}>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
          <button type="submit" className="goal-start-btn">Start tracking</button>
        </form>
      </div>
    );
  }

  // Active goal UI
  // eslint-disable-next-line react-hooks/purity
  const daysSinceStart = Math.floor((Date.now() - new Date(goal.goalSetAt).getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, goal.goalDays - daysSinceStart);
  
  const deadlineDate = new Date(new Date(goal.goalSetAt).getTime() + goal.goalDays * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  
  const expectedProgress = Math.min(100, (daysSinceStart / goal.goalDays) * 100);
  let statusColor = '#00c896'; // Green on track
  if (currentProgress < expectedProgress - 20) {
    statusColor = '#e85d4a'; // Red far behind
  } else if (currentProgress < expectedProgress) {
    statusColor = '#f5a623'; // Amber slightly behind
  }

  return (
    <div className="goal-tracker-container active-mode">
      <div className="goal-header">
        <h4>Reduce by {goal.goalPercent}% by {deadlineDate}</h4>
        <span className="days-pill">{daysLeft} days left</span>
      </div>

      <div className="goal-progress-section">
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            role="progressbar" 
            aria-valuenow={currentProgress} 
            aria-valuemin="0" 
            aria-valuemax="100"
            style={{ width: `${currentProgress}%`, backgroundColor: statusColor }}
          ></div>
          
          <div className="milestone-marker" style={{ left: '25%' }}></div>
          <div className="milestone-marker" style={{ left: '50%' }}></div>
          <div className="milestone-marker" style={{ left: '75%' }}></div>
          <div className="milestone-marker" style={{ left: '100%' }}></div>
        </div>
        
        <div className="progress-text">
          <span style={{ color: statusColor }}>{currentProgress.toFixed(1)}% of goal achieved</span>
          <span className="expected-text">Expected: {expectedProgress.toFixed(0)}%</span>
        </div>
      </div>

      {activeCoachingPanel && (
        <div className="coaching-panel slide-in">
          <div className="coaching-header">
            <span className="milestone-badge" role="alert">⭐ {activeCoachingPanel.milestone}% milestone reached!</span>
            <button className="close-btn" onClick={dismissCoachingPanel}>&times;</button>
          </div>
          
          <div className="coaching-body">
            {isLoadingCoaching && !activeCoachingPanel.message ? (
              <div className="coaching-skeleton">
                <div className="skeleton-line"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
            ) : (
              <p>{activeCoachingPanel.message}</p>
            )}
          </div>
        </div>
      )}

      <div className="goal-footer">
        {Object.keys(goal.coachingMessages).length > 0 && (
          <button className="text-btn" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? 'Hide past coaching' : 'View past coaching'}
          </button>
        )}
        <button className="text-btn danger" onClick={resetGoal}>Reset goal</button>
      </div>

      {showHistory && Object.keys(goal.coachingMessages).length > 0 && (
        <div className="coaching-history">
          {Object.entries(goal.coachingMessages).map(([milestone, msg]) => (
            <div key={milestone} className="history-item">
              <span className="history-badge">{milestone}%</span>
              <p>{msg}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
