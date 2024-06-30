chrome.runtime.onInstalled.addListener(function () {
  chrome.alarms.create('archiveTasks', { periodInMinutes: 1440 }); // Set alarm to trigger daily
});

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === 'archiveTasks') {
    chrome.storage.local.get(['tasks', 'archivedTasks'], function (data) {
      const tasks = data.tasks || [];
      const archivedTasks = data.archivedTasks || [];
      const date = new Date().toLocaleDateString();
      tasks.forEach(task => archivedTasks.push(`${task} (Archived on ${date})`));
      chrome.storage.local.set({ tasks: [], archivedTasks });
    });
  }
});
