import { useState, useEffect } from 'react';
import { fetchGoalCoaching } from '../services/api';

export function useGoal(latestCarbon) {
  const [goal, setGoal] = useState(() => {
    const saved = localStorage.getItem('hcGoal');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoadingCoaching, setIsLoadingCoaching] = useState(false);
  const [activeCoachingPanel, setActiveCoachingPanel] = useState(null);

  // Save to localStorage whenever goal changes
  useEffect(() => {
    if (goal) {
      localStorage.setItem('hcGoal', JSON.stringify(goal));
    } else {
      localStorage.removeItem('hcGoal');
    }
  }, [goal]);

  // Milestone detection logic
  useEffect(() => {
    if (!goal || !latestCarbon) return;

    const currentProgress = ((goal.baselineCarbon - latestCarbon) / (goal.baselineCarbon * goal.goalPercent / 100)) * 100;
    const progressClamped = Math.max(0, Math.min(100, currentProgress));
    
    // Check milestones 25, 50, 75, 100
    const thresholds = [25, 50, 75, 100];
    
    // Find all milestones that the current progress meets or exceeds, 
    // AND haven't been reached yet. We want to process them sequentially.
    const milestonesToUnlock = thresholds.filter(
      t => progressClamped >= t && !goal.milestonesReached.includes(t)
    );

    if (milestonesToUnlock.length > 0) {
      // Process the *first* unreached milestone in the sequence
      // This ensures if a user jumps from 0 to 60, they get the 25% milestone first,
      // and won't get the 50% until the 25% is processed and state is updated.
      const nextMilestone = milestonesToUnlock[0];
      
      const unlockMilestone = async () => {
        setIsLoadingCoaching(true);
        setActiveCoachingPanel({ milestone: nextMilestone, message: null }); // Show skeleton
        
        try {
          const daysElapsed = Math.floor((Date.now() - new Date(goal.goalSetAt).getTime()) / (1000 * 60 * 60 * 24));
          
          const message = await fetchGoalCoaching({
            milestone: nextMilestone,
            goalPercent: goal.goalPercent,
            goalDays: goal.goalDays,
            baselineCarbon: goal.baselineCarbon,
            currentCarbon: latestCarbon,
            daysElapsed: daysElapsed
          });

          setGoal(prev => ({
            ...prev,
            milestonesReached: [...prev.milestonesReached, nextMilestone].sort((a, b) => a - b),
            coachingMessages: { ...prev.coachingMessages, [nextMilestone]: message }
          }));

          setActiveCoachingPanel({ milestone: nextMilestone, message });
        } catch (error) {
          console.error("Failed to fetch coaching message:", error);
          const fallback = "Great progress! Keep focusing on your highest-use category to stay on track.";
          setGoal(prev => ({
            ...prev,
            milestonesReached: [...prev.milestonesReached, nextMilestone].sort((a, b) => a - b),
            coachingMessages: { ...prev.coachingMessages, [nextMilestone]: fallback }
          }));
          setActiveCoachingPanel({ milestone: nextMilestone, message: fallback });
        } finally {
          setIsLoadingCoaching(false);
        }
      };

      unlockMilestone();
    }

  }, [latestCarbon, goal]);

  const startGoal = (percent, days, baseline) => {
    setGoal({
      goalPercent: percent,
      goalDays: days,
      baselineCarbon: baseline,
      goalSetAt: new Date().toISOString(),
      milestonesReached: [],
      coachingMessages: {}
    });
  };

  const resetGoal = () => {
    setGoal(null);
    setActiveCoachingPanel(null);
  };

  const dismissCoachingPanel = () => {
    setActiveCoachingPanel(null);
  };

  return {
    goal,
    startGoal,
    resetGoal,
    isLoadingCoaching,
    activeCoachingPanel,
    dismissCoachingPanel,
    currentProgress: goal && latestCarbon 
      ? Math.max(0, Math.min(100, ((goal.baselineCarbon - latestCarbon) / (goal.baselineCarbon * goal.goalPercent / 100)) * 100)) 
      : 0
  };
}
