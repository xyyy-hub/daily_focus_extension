// Popup JavaScript for Daily Focus Extension

let timerInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
  await updatePopupView();
  startTimer();
  
  // Add event listeners
  const triggerButton = document.getElementById('trigger-button');
  const resetButton = document.getElementById('reset-button');
  
  if (triggerButton) {
    triggerButton.addEventListener('click', triggerDailyPrompt);
  }
  
  if (resetButton) {
    resetButton.addEventListener('click', resetDailyFocus);
  }
});

async function updatePopupView() {
  try {
    const result = await chrome.storage.local.get([
      'dailyGoalCompleted', 'dailyGoal', 'dailyPriorities', 'lastCompletionDate',
      'goalChecked', 'prioritiesChecked', 'timerStartTime', 'timerElapsed'
    ]);
    
    const today = new Date().toDateString();
    const isCompleted = result.dailyGoalCompleted && result.lastCompletionDate === today;
    
    const completedView = document.getElementById('completed-view');
    const pendingView = document.getElementById('pending-view');
    
    if (isCompleted) {
      // Show completed view with todo list
      completedView.style.display = 'flex';
      pendingView.style.display = 'none';
      
      // Setup goal text (no checkbox)
      const goalElement = document.getElementById('current-goal');
      
      if (goalElement) {
        goalElement.textContent = result.dailyGoal || 'No goal set';
      }
      
      // Setup priorities checkboxes
      const prioritiesElement = document.getElementById('current-priorities');
      if (prioritiesElement) {
        prioritiesElement.innerHTML = '';
        const priorities = result.dailyPriorities || [];
        const prioritiesChecked = result.prioritiesChecked || [];
        
        priorities.forEach((priority, index) => {
          if (priority.trim()) {
            const priorityItem = document.createElement('div');
            priorityItem.className = 'priority-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `priority-${index}`;
            checkbox.className = 'todo-checkbox';
            checkbox.checked = prioritiesChecked[index] || false;
            
            const label = document.createElement('label');
            label.htmlFor = `priority-${index}`;
            label.textContent = priority;
            label.className = 'priority-label';
            
            // Add event listener for priority checkbox
            checkbox.addEventListener('change', async () => {
              const currentResult = await chrome.storage.local.get(['prioritiesChecked', 'dailyPriorities']);
              const updatedChecked = [...(currentResult.prioritiesChecked || [])];
              updatedChecked[index] = checkbox.checked;
              await chrome.storage.local.set({ prioritiesChecked: updatedChecked });
              updateProgress();
              checkTimerCompletion();
            });
            
            priorityItem.appendChild(checkbox);
            priorityItem.appendChild(label);
            prioritiesElement.appendChild(priorityItem);
          }
        });
      }
      
      // Update progress initially
      updateProgress();
      
    } else {
      // Show pending view
      completedView.style.display = 'none';
      pendingView.style.display = 'flex';
    }
  } catch (error) {
    console.error('Error updating popup view:', error);
  }
}

async function updateProgress() {
  try {
    const result = await chrome.storage.local.get(['prioritiesChecked', 'dailyPriorities']);
    
    const prioritiesChecked = result.prioritiesChecked || [];
    const totalPriorities = (result.dailyPriorities || []).filter(p => p.trim()).length;
    
    const completedPriorities = prioritiesChecked.filter(checked => checked).length;
    
    // Update progress bar (only priorities count)
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    if (progressFill && progressText) {
      const progressPercentage = totalPriorities > 0 ? (completedPriorities / totalPriorities) * 100 : 0;
      progressFill.style.width = `${progressPercentage}%`;
      
      // Change text and color based on progress
      if (progressPercentage === 100 && totalPriorities > 0) {
        progressText.textContent = '🎉 Congrats! All completed';
        progressFill.style.backgroundColor = '#10b981'; // Green when complete
      } else {
        progressText.textContent = `${completedPriorities} of ${totalPriorities} completed`;
        progressFill.style.backgroundColor = '#6366f1'; // Blue in progress
      }
    }
  } catch (error) {
    console.error('Error updating progress:', error);
  }
}

async function triggerDailyPrompt() {
  try {
    console.log('🆕 POPUP: Opening new tab for daily prompt');
    
    // For new tab override approach, just open a new tab
    // The newtab.html will handle showing the prompt automatically
    await chrome.tabs.create({ url: 'chrome://newtab/' });
    
    console.log('🆕 POPUP: New tab opened successfully');
    window.close(); // Close popup
  } catch (error) {
    console.error('🆕 POPUP: Error opening new tab:', error);
  }
}

async function resetDailyFocus() {
  try {
    // Reset the daily focus data
    await chrome.storage.local.set({
      dailyGoalCompleted: false,
      dailyGoal: '',
      dailyPriorities: [],
      lastCompletionDate: null,
      prioritiesChecked: [],
      timerStartTime: null,
      timerElapsed: 0
    });
    
    console.log('🔄 POPUP: Daily focus data reset');
    
    // Update the popup view
    await updatePopupView();
    
    // Restart timer display
    startTimer();
  } catch (error) {
    console.error('Error resetting daily focus:', error);
  }
}

// Timer Functions
async function startTimer() {
  // Clear any existing timer
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  const result = await chrome.storage.local.get(['timerStartTime', 'timerElapsed', 'prioritiesChecked', 'dailyPriorities']);
  const timerDisplay = document.getElementById('timer-display');
  
  if (!timerDisplay) return;

  // Check if all priorities are completed
  const priorities = result.dailyPriorities || [];
  const prioritiesChecked = result.prioritiesChecked || [];
  const allCompleted = priorities.length > 0 && prioritiesChecked.length === priorities.length && 
                      prioritiesChecked.every(checked => checked);

  if (allCompleted) {
    // Show final time if all completed
    const finalTime = result.timerElapsed || 0;
    timerDisplay.textContent = formatTime(finalTime);
    return;
  }

  // Start timer if we have a start time
  if (result.timerStartTime) {
    timerInterval = setInterval(async () => {
      const now = Date.now();
      const elapsed = Math.floor((now - result.timerStartTime) / 1000) + (result.timerElapsed || 0);
      
      timerDisplay.textContent = formatTime(elapsed);
      
      // Save elapsed time periodically
      await chrome.storage.local.set({ timerElapsed: elapsed });
    }, 1000);
  } else {
    timerDisplay.textContent = '00:00:00';
  }
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

async function checkTimerCompletion() {
  const result = await chrome.storage.local.get(['dailyPriorities', 'prioritiesChecked', 'timerStartTime']);
  const priorities = result.dailyPriorities || [];
  const prioritiesChecked = result.prioritiesChecked || [];
  
  const allCompleted = priorities.length > 0 && prioritiesChecked.length === priorities.length && 
                      prioritiesChecked.every(checked => checked);

  if (allCompleted && timerInterval) {
    // Stop the timer
    clearInterval(timerInterval);
    timerInterval = null;
    console.log('🎉 TIMER: All priorities completed! Timer stopped.');
  }
}
