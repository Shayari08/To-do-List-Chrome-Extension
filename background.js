// Run auto-archiving once a day
function autoArchive() {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  chrome.storage.local.get(["lastArchiveDate", "tasks", "archivedTasks"], (res) => {
    const lastArchived = res.lastArchiveDate || "";
    const archived = res.archivedTasks || [];
    const tasks = res.tasks || [];

    const isAfter4AM = now.getHours() >= 4;

    if (lastArchived !== todayStr && isAfter4AM) {
      const [toArchive, remaining] = partition(tasks, t => t.done);
      if (toArchive.length) {
        chrome.storage.local.set({
          archivedTasks: archived.concat(toArchive),
          tasks: remaining,
          lastArchiveDate: todayStr,
        });
      } else {
        chrome.storage.local.set({ lastArchiveDate: todayStr });
      }
    }
  });
}

// Partition array based on condition
function partition(arr, condition) {
  return arr.reduce(([pass, fail], elem) => {
    return condition(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]];
  }, [[], []]);
}

// Set up interval for auto-archiving at 4 AM
setInterval(autoArchive, 24 * 60 * 60 * 1000); // Once a day
