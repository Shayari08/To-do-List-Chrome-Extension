const taskList = document.getElementById("taskList");
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addTask");
const bulkArchiveBtn = document.getElementById("bulkArchive");
const showHiddenBtn = document.getElementById("showHidden");

// Add a task to the UI
function addTask(text, done = false) {
  const li = document.createElement("li");
  li.className = "flex items-center justify-between bg-gray-100 px-2 py-1 rounded";
  li.innerHTML = `
    <label class="flex items-center space-x-2 flex-1">
      <input type="checkbox" ${done ? "checked" : ""} />
      <span class="task-text ${done ? "line-through text-gray-500" : ""}">${text}</span>
    </label>
    <div class="space-x-1 flex-shrink-0">
      <button class="edit bg-yellow-400 text-white px-1 rounded text-xs">Edit</button>
      <button class="archive bg-purple-500 text-white px-1 rounded text-xs">📦</button>
      <button class="hide bg-gray-500 text-white px-1 rounded text-xs">Hide</button>
      <button class="delete bg-red-500 text-white px-1 rounded text-xs">Delete</button>
    </div>
  `;

  const checkbox = li.querySelector("input[type='checkbox']");
  const span = li.querySelector(".task-text");
  const editBtn = li.querySelector(".edit");
  const deleteBtn = li.querySelector(".delete");
  const archiveBtn = li.querySelector(".archive");
  const hideBtn = li.querySelector(".hide");

  checkbox.addEventListener("change", () => {
    span.classList.toggle("line-through", checkbox.checked);
    span.classList.toggle("text-gray-500", checkbox.checked);
    saveTasks();
  });

  editBtn.addEventListener("click", () => {
    const originalText = span.textContent;
    span.contentEditable = true;
    span.classList.add("border", "border-gray-300");
    span.focus();
    span.addEventListener("blur", () => {
      const newText = span.textContent.trim();
      if (newText && newText !== originalText) {
        span.textContent = newText;
        saveTasks();
      }
      span.contentEditable = false;
      span.classList.remove("border", "border-gray-300");
    });
  });

  deleteBtn.addEventListener("click", () => {
    li.remove();
    saveTasks();
  });

  archiveBtn.addEventListener("click", () => {
    archiveTask({ text: span.textContent, done: checkbox.checked });
    li.remove();
    saveTasks();
  });

  hideBtn.addEventListener("click", () => {
    chrome.storage.local.get(["hiddenTasks"], (res) => {
      const hidden = res.hiddenTasks || [];
      hidden.push({ text: span.textContent, done: checkbox.checked });
      chrome.storage.local.set({ hiddenTasks: hidden }, () => {
        li.remove();
        saveTasks();
      });
    });
  });

  taskList.appendChild(li);
}

function saveTasks() {
  const tasks = [];
  document.querySelectorAll("#taskList li").forEach(li => {
    const text = li.querySelector(".task-text").textContent;
    const done = li.querySelector("input[type='checkbox']").checked;
    tasks.push({ text, done });
  });
  chrome.storage.local.set({ tasks });
}

function loadTasks() {
  taskList.innerHTML = "";
  chrome.storage.local.get("tasks", (data) => {
    (data.tasks || []).forEach(task => addTask(task.text, task.done));
  });
}

function archiveTask(task) {
  const today = new Date().toISOString().split("T")[0];
  chrome.storage.local.get(["archive"], (result) => {
    const archive = result.archive || {};
    if (!archive[today]) archive[today] = [];
    archive[today].push(task);
    chrome.storage.local.set({ archive });
  });
}

function partition(arr, condition) {
  return arr.reduce(([pass, fail], elem) => {
    return condition(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]];
  }, [[], []]);
}

function autoArchiveIfDue() {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  chrome.storage.local.get(["lastArchiveDate", "tasks", "archive"], (res) => {
    const lastArchived = res.lastArchiveDate || "";
    const archive = res.archive || {};
    const tasks = res.tasks || [];
    const isAfter4AM = now.getHours() >= 4;

    if (lastArchived !== todayStr && isAfter4AM) {
      const [toArchive, remaining] = partition(tasks, t => t.done);
      if (!archive[todayStr]) archive[todayStr] = [];
      archive[todayStr] = archive[todayStr].concat(toArchive);
      chrome.storage.local.set({
        archive,
        tasks: remaining,
        lastArchiveDate: todayStr
      });
    }
  });
}

addBtn.addEventListener("click", () => {
  const text = taskInput.value.trim();
  if (text) {
    addTask(text);
    taskInput.value = "";
    saveTasks();
  }
});

taskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const text = taskInput.value.trim();
    if (text) {
      addTask(text);
      taskInput.value = "";
      saveTasks();
    }
  }
});

bulkArchiveBtn.addEventListener("click", () => {
  chrome.storage.local.get(["tasks", "archive"], (res) => {
    const tasks = res.tasks || [];
    const archive = res.archive || {};
    const [toArchive, remaining] = partition(tasks, t => t.done);
    const today = new Date().toISOString().split("T")[0];
    if (!archive[today]) archive[today] = [];
    archive[today] = archive[today].concat(toArchive);
    chrome.storage.local.set({ archive, tasks: remaining }, loadTasks);
  });
});

showHiddenBtn.addEventListener("click", () => {
  chrome.storage.local.get(["hiddenTasks", "tasks"], (res) => {
    const hidden = res.hiddenTasks || [];
    const tasks = res.tasks || [];
    const updatedTasks = tasks.concat(hidden);

    chrome.storage.local.set({ tasks: updatedTasks, hiddenTasks: [] }, loadTasks);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  autoArchiveIfDue();
  loadTasks();
  new Sortable(taskList, {
    animation: 150,
    onEnd: saveTasks
  });
});
