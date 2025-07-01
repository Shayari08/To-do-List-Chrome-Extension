const archivedList = document.getElementById("archivedList");
const clearBtn = document.getElementById("clearAll");

function loadArchived() {
  chrome.storage.local.get("archive", (res) => {
    const archive = res.archive || {};
    archivedList.innerHTML = "";

    const dates = Object.keys(archive).sort((a, b) => b.localeCompare(a));
    if (dates.length === 0) {
      archivedList.innerHTML = `<p class="text-gray-500 text-sm">No archived tasks.</p>`;
      return;
    }

    dates.forEach((date) => {
      const section = document.createElement("div");
      section.className = "bg-gray-100 p-3 rounded space-y-2";

      const title = document.createElement("h2");
      title.className = "text-lg font-semibold";
      title.textContent = `📅 ${date}`;
      section.appendChild(title);

      archive[date].forEach((task, taskIndex) => {
        const li = document.createElement("li");
        li.className = "flex items-center justify-between bg-white px-3 py-2 rounded shadow-sm";
        li.innerHTML = `
          <span class="${task.done ? 'line-through text-gray-500' : ''}">${task.text}</span>
          <div class="space-x-2 flex-shrink-0">
            <button class="restore bg-green-500 text-white px-2 py-0.5 rounded text-xs">🔁 Restore</button>
            <button class="delete bg-red-500 text-white px-2 py-0.5 rounded text-xs">🗑️</button>
          </div>
        `;

        li.querySelector(".restore").addEventListener("click", () => {
          chrome.storage.local.get("tasks", (res2) => {
            const tasks = res2.tasks || [];
            tasks.push(task);
            chrome.storage.local.set({ tasks }, () => {
              deleteSingleArchived(date, taskIndex);
            });
          });
        });

        li.querySelector(".delete").addEventListener("click", () => {
          deleteSingleArchived(date, taskIndex);
        });

        section.appendChild(li);
      });

      archivedList.appendChild(section);
    });
  });
}

function deleteSingleArchived(date, indexToRemove) {
  chrome.storage.local.get("archive", (res) => {
    const archive = res.archive || {};
    if (!archive[date]) return;

    archive[date].splice(indexToRemove, 1);
    if (archive[date].length === 0) delete archive[date];

    chrome.storage.local.set({ archive }, loadArchived);
  });
}

clearBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all archived tasks?")) {
    chrome.storage.local.set({ archive: {} }, loadArchived);
  }
});

document.addEventListener("DOMContentLoaded", loadArchived);
