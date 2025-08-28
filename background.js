// Create notification when alarm triggers
chrome.alarms.onAlarm.addListener(function(alarm) {
  chrome.storage.local.get(['reminders'], function(result) {
    const reminders = result.reminders || [];
    const reminder = reminders.find(r => r.id === alarm.name);
    
    if (reminder) {
      // Show cute notification
      chrome.notifications.create(alarm.name, {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '💝 ' + reminder.title,
        message: reminder.message,
        priority: 2,
        buttons: [
          { title: 'Dismiss' }
        ]
      });
      
      // Remove the reminder from storage
      const updatedReminders = reminders.filter(r => r.id !== alarm.name);
      chrome.storage.local.set({reminders: updatedReminders});
    }
  });
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
  if (buttonIndex === 0) { // Dismiss button
    chrome.notifications.clear(notificationId);
  }
});

// Clear old reminders on startup
chrome.runtime.onStartup.addListener(function() {
  chrome.storage.local.get(['reminders'], function(result) {
    const reminders = result.reminders || [];
    const now = Date.now();
    const upcomingReminders = reminders.filter(r => r.when > now);
    
    if (upcomingReminders.length !== reminders.length) {
      chrome.storage.local.set({reminders: upcomingReminders});
    }
    
    // Recreate alarms for upcoming reminders
    upcomingReminders.forEach(reminder => {
      chrome.alarms.create(reminder.id, {when: reminder.when});
    });
  });
});

// Also clear old reminders when extension is installed/updated
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.get(['reminders'], function(result) {
    const reminders = result.reminders || [];
    const now = Date.now();
    const upcomingReminders = reminders.filter(r => r.when > now);
    
    if (upcomingReminders.length !== reminders.length) {
      chrome.storage.local.set({reminders: upcomingReminders});
    }
    
    // Recreate alarms for upcoming reminders
    upcomingReminders.forEach(reminder => {
      chrome.alarms.create(reminder.id, {when: reminder.when});
    });
  });
});