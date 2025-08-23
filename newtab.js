// New Tab Page Script for Daily Focus Extension
let currentStep = 1;
let dailyGoal = '';
let dailyPriorities = ['', '', ''];

console.log('🆕 NEW TAB: Daily Focus new tab page loaded');

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🆕 NEW TAB: DOM loaded, checking if daily prompt needed');
  
  // Check if daily goal already completed today
  const result = await chrome.storage.local.get(['dailyGoalCompleted', 'lastCompletionDate']);
  const today = new Date().toDateString();
  
  if (result.dailyGoalCompleted && result.lastCompletionDate === today) {
    console.log('🆕 NEW TAB: Daily goal already completed, redirecting to Google immediately');
    // Instant redirect if already completed today
    window.location.href = 'https://www.google.com';
  } else {
    console.log('🆕 NEW TAB: Daily goal needed, showing prompt');
    showStep(1);
  }
});

// Skip link functionality
document.getElementById('skipLink').addEventListener('click', (e) => {
  e.preventDefault();
  console.log('🆕 NEW TAB: User clicked skip, redirecting to Google');
  window.location.href = 'https://www.google.com';
});

function showStep(step) {
  currentStep = step;
  const container = document.getElementById('mainContainer');
  
  console.log('🎬 TRANSITION: Showing step', step);
  
  // Fade out current content
  container.style.opacity = '0';
  
  setTimeout(() => {
    if (step === 1) {
      container.innerHTML = `
        <div class="step-indicator">
          <span class="step-number">1</span>
          <span class="step-text">of 2</span>
        </div>
        <h1 class="question-title">What's your main goal for today?</h1>
        <p class="question-subtitle">Set your intention for the day</p>
        <div class="input-container">
          <input 
            type="text" 
            id="daily-goal-input" 
            class="daily-input" 
            placeholder="Type your answer here..."
            value="${dailyGoal}"
            maxlength="200"
            autofocus
          />
          <div class="input-actions">
            <span class="enter-hint">Press Enter ↵</span>
          </div>
        </div>
      `;
    
    // Add event listeners for step 1
    const input = document.getElementById('daily-goal-input');
    input.focus();
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        dailyGoal = input.value.trim();
        console.log('🆕 NEW TAB: Goal entered:', dailyGoal);
        showStep(2);
      }
    });
    
    input.addEventListener('input', (e) => {
      dailyGoal = e.target.value;
    });
    
    } else if (step === 2) {
      container.innerHTML = `
      <div class="step-indicator">
        <span class="step-number">2</span>
        <span class="step-text">of 2</span>
      </div>
      <h1 class="question-title">What are your top 3 priorities?</h1>
      <p class="question-subtitle">List them in order of importance</p>
      <div class="priorities-container">
        <div class="priority-item">
          <span class="priority-number">1.</span>
          <input 
            type="text" 
            class="priority-input" 
            data-priority="0"
            placeholder="Most important priority..."
            value="${dailyPriorities[0]}"
            maxlength="150"
          />
        </div>
        <div class="priority-item">
          <span class="priority-number">2.</span>
          <input 
            type="text" 
            class="priority-input" 
            data-priority="1"
            placeholder="Second priority..."
            value="${dailyPriorities[1]}"
            maxlength="150"
          />
        </div>
        <div class="priority-item">
          <span class="priority-number">3.</span>
          <input 
            type="text" 
            class="priority-input" 
            data-priority="2"
            placeholder="Third priority..."
            value="${dailyPriorities[2]}"
            maxlength="150"
          />
        </div>
      </div>
      <div class="input-actions">
        <button id="back-button" class="back-button">← Back</button>
        <button id="complete-button" class="complete-button" disabled>Complete Setup</button>
      </div>
    `;
    
    // Add event listeners for step 2
    const priorityInputs = document.querySelectorAll('.priority-input');
    const completeButton = document.getElementById('complete-button');
    const backButton = document.getElementById('back-button');
    
    // Focus first empty input
    let firstEmptyInput = null;
    priorityInputs.forEach((input, index) => {
      if (!input.value && !firstEmptyInput) {
        firstEmptyInput = input;
      }
    });
    if (firstEmptyInput) {
      firstEmptyInput.focus();
    } else {
      priorityInputs[0].focus();
    }
    
    priorityInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        dailyPriorities[index] = e.target.value;
        updateCompleteButton();
      });
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const nextInput = priorityInputs[index + 1];
          if (nextInput) {
            nextInput.focus();
          } else if (canComplete()) {
            completeDailyGoal();
          }
        }
      });
    });
    
    backButton.addEventListener('click', () => {
      console.log('🆕 NEW TAB: User clicked back');
      showStep(1);
    });
    
    completeButton.addEventListener('click', completeDailyGoal);
    
    updateCompleteButton();
    
    } else if (step === 'complete') {
      container.innerHTML = `
        <div class="completion-message">
          <h1 class="completion-title">🎉 All Set!</h1>
          <p class="completion-subtitle">Your daily goal and priorities have been saved.</p>
          <p class="redirect-message">Redirecting to Google...</p>
        </div>
      `;
    }
    
    // Fade in new content
    container.style.opacity = '1';
    
  }, 200); // 200ms delay for fade out
}

function updateCompleteButton() {
  const completeButton = document.getElementById('complete-button');
  if (completeButton) {
    completeButton.disabled = !canComplete();
  }
}

function canComplete() {
  const goalValid = dailyGoal && dailyGoal.trim() !== '';
  const prioritiesValid = dailyPriorities.filter(p => p && p.trim() !== '').length >= 3;
  
  console.log('🆕 NEW TAB: canComplete check - Goal valid:', goalValid, 'Priorities valid:', prioritiesValid);
  
  return goalValid && prioritiesValid;
}

async function completeDailyGoal() {
  console.log('🆕 NEW TAB: Completing daily goal');
  console.log('🆕 NEW TAB: Daily goal:', dailyGoal);
  console.log('🆕 NEW TAB: Daily priorities:', dailyPriorities);
  
  if (!canComplete()) {
    console.log('🆕 NEW TAB: Cannot complete - missing data');
    return;
  }
  
  const filteredPriorities = dailyPriorities.filter(p => p && p.trim() !== '');
  const today = new Date().toDateString();
  
  try {
    // Save to storage with timer start time
    await chrome.storage.local.set({
      dailyGoal: dailyGoal.trim(),
      dailyPriorities: filteredPriorities,
      dailyGoalCompleted: true,
      lastCompletionDate: today,
      timerStartTime: Date.now(), // Start timer when form is completed
      timerElapsed: 0, // Reset elapsed time
      prioritiesChecked: new Array(filteredPriorities.length).fill(false) // Initialize unchecked priorities
    });
    
    console.log('🆕 NEW TAB: Daily goal saved successfully');
    console.log('⏱️ TIMER: Started timer at', new Date().toLocaleTimeString());
    
    // Show completion step with smooth transition
    showStep('complete');
    
    // Redirect after a brief moment to show the completion animation
    setTimeout(() => {
      console.log('🆕 NEW TAB: Redirecting to Google');
      window.location.href = 'https://www.google.com';
    }, 1000);
    
  } catch (error) {
    console.error('🆕 NEW TAB: Failed to save daily goal:', error);
  }
}

// Completion message is now handled in showStep('complete')
