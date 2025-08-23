// Simplified background script for New Tab Override approach
console.log('🎯 Daily Focus Extension: Background script loaded (New Tab Override mode)');

// Reset daily goal at midnight
chrome.alarms.create('dailyReset', {
  when: getNextMidnight(),
  periodInMinutes: 24 * 60 // Every 24 hours
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReset') {
    console.log('🌅 DAILY RESET: Clearing daily goal completion');
    chrome.storage.local.set({
      dailyGoalCompleted: false,
      lastCompletionDate: null
    });
  }
});

// Handle messages from popup or other parts of extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📩 BACKGROUND: Received message:', request);
  
  if (request.action === 'test') {
    console.log('🧪 BACKGROUND: Test message received');
    sendResponse({ success: true, message: 'Background script is working' });
    
  } else if (request.action === 'resetDailyGoal') {
    console.log('🔄 BACKGROUND: Resetting daily goal (manual)');
    chrome.storage.local.set({
      dailyGoalCompleted: false,
      lastCompletionDate: null
    }).then(() => {
      sendResponse({ success: true, message: 'Daily goal reset' });
    });
    
  } else if (request.action === 'getDailyStatus') {
    chrome.storage.local.get(['dailyGoalCompleted', 'lastCompletionDate', 'dailyGoal', 'dailyPriorities']).then(result => {
      const today = new Date().toDateString();
      const isCompleted = result.dailyGoalCompleted && result.lastCompletionDate === today;
      
      sendResponse({
        success: true,
        completed: isCompleted,
        goal: result.dailyGoal || '',
        priorities: result.dailyPriorities || [],
        lastCompletionDate: result.lastCompletionDate
      });
    });
  }
  
  return true; // Keep message channel open for async response
});

// Utility function to get next midnight
function getNextMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime();
}

// Extension installation/startup logging
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🆕 EXTENSION: Installed/updated', details.reason);
  
  if (details.reason === 'install') {
    console.log('🎉 EXTENSION: First install - welcome!');
  }
});

chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 EXTENSION: Chrome startup detected');
});
