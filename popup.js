document.addEventListener('DOMContentLoaded', function() {
  const setReminderBtn = document.getElementById('setReminder');
  const reminderTitle = document.getElementById('reminderTitle');
  const reminderMessage = document.getElementById('reminderMessage');
  const timeUnit = document.getElementById('timeUnit');
  const reminderOffset = document.getElementById('reminderOffset');
  const specificTime = document.getElementById('specificTime');
  const remindersContainer = document.getElementById('remindersContainer');
  
  // Show/hide specific time input based on selection
  timeUnit.addEventListener('change', function() {
    if (this.value === 'specific') {
      reminderOffset.style.display = 'none';
      specificTime.style.display = 'block';
    } else {
      reminderOffset.style.display = 'block';
      specificTime.style.display = 'none';
    }
  });
  
  // Load existing reminders
  loadReminders();
  
  setReminderBtn.addEventListener('click', function() {
    const title = reminderTitle.value.trim();
    const message = reminderMessage.value.trim();
    
    if (!title || !message) {
      alert('Please add both a title and message for your reminder!');
      return;
    }
    
    let when;
    const selectedOption = timeUnit.value;
    
    if (selectedOption === 'minutes') {
      const minutes = parseInt(reminderOffset.value);
      if (isNaN(minutes) || minutes <= 0) {
        alert('Please enter a valid number of minutes!');
        return;
      }
      when = Date.now() + (minutes * 60 * 1000);
    } 
    else if (selectedOption === 'hours') {
      const hours = parseInt(reminderOffset.value);
      if (isNaN(hours) || hours <= 0) {
        alert('Please enter a valid number of hours!');
        return;
      }
      when = Date.now() + (hours * 60 * 60 * 1000);
    }
    else if (selectedOption === 'specific') {
      const timeValue = specificTime.value;
      if (!timeValue) {
        alert('Please select a specific time!');
        return;
      }
      
      const now = new Date();
      const [hours, minutes] = timeValue.split(':');
      const reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
                                   parseInt(hours), parseInt(minutes));
      
      if (reminderDate <= now) {
        // If the time has passed today, set for tomorrow
        reminderDate.setDate(reminderDate.getDate() + 1);
      }
      
      when = reminderDate.getTime();
    }
    
    // Create a unique ID for this reminder
    const id = "reminder_" + Date.now();
    
    // Save reminder to storage
    chrome.storage.local.get(['reminders'], function(result) {
      const reminders = result.reminders || [];
      reminders.push({
        id: id,
        title: title,
        message: message,
        when: when
      });
      
      chrome.storage.local.set({reminders: reminders}, function() {
        // Set the alarm
        chrome.alarms.create(id, {when: when});
        
        // Clear inputs
        reminderTitle.value = '';
        reminderMessage.value = '';
        reminderOffset.value = '5';
        
        // Refresh reminder list
        loadReminders();
      });
    });
  });
  
  function loadReminders() {
    chrome.storage.local.get(['reminders'], function(result) {
      const reminders = result.reminders || [];
      const now = Date.now();
      
      // Filter out past reminders
      const upcomingReminders = reminders.filter(r => r.when > now);
      
      // Update storage with only upcoming reminders
      if (upcomingReminders.length !== reminders.length) {
        chrome.storage.local.set({reminders: upcomingReminders});
      }
      
      // Display reminders
      if (upcomingReminders.length === 0) {
        remindersContainer.innerHTML = '<p>No upcoming reminders. Add one above! 🌸</p>';
      } else {
        let html = '';
        upcomingReminders.forEach(reminder => {
          const date = new Date(reminder.when);
          const timeString = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          const dateString = date.toLocaleDateString();
          
          html += `
            <div class="reminder-item">
              <div class="reminder-title">${reminder.title}</div>
              <div>${reminder.message}</div>
              <div class="reminder-time">${dateString} at ${timeString}</div>
              <button class="delete-btn" data-id="${reminder.id}">Delete</button>
              <div style="clear: both;"></div>
            </div>
          `;
        });
        remindersContainer.innerHTML = html;
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
          button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            deleteReminder(id);
          });
        });
      }
    });
  }
  
  function deleteReminder(id) {
    chrome.storage.local.get(['reminders'], function(result) {
      const reminders = result.reminders || [];
      const updatedReminders = reminders.filter(r => r.id !== id);
      
      chrome.storage.local.set({reminders: updatedReminders}, function() {
        // Cancel the alarm
        chrome.alarms.clear(id);
        
        // Refresh reminder list
        loadReminders();
      });
    });
  }
});