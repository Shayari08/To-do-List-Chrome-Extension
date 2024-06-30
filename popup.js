document.addEventListener('DOMContentLoaded', function () {
  const taskList = document.getElementById('task-list');
  const newTaskInput = document.getElementById('new-task');
  const toggleShowHiddenButton = document.getElementById('toggle-show-hidden');

  // Load tasks from storage
  function loadTasks() {
    chrome.storage.local.get(['tasks'], function (data) {
      const tasks = data.tasks || [];
      tasks.forEach(task => {
        const div = createTaskElement(task);
        taskList.appendChild(div);
      });
    });
  }

  // Save tasks to storage
  function saveTasks(tasks) {
    chrome.storage.local.set({ tasks });
  }

  // Create task element
  function createTaskElement(task) {
    const div = document.createElement('div');
    div.classList.add('task-item');

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', function () {
      if (checkbox.checked) {
        span.style.textDecoration = 'line-through';
        span.style.opacity = '0.5';
        div.classList.add('completed');
      } else {
        span.style.textDecoration = 'none';
        span.style.opacity = '1';
        div.classList.remove('completed');
      }
      updateTaskList();
    });

    // Task text
    const span = document.createElement('span');
    span.textContent = task;
    span.style.textAlign = 'left';

    // Double-click to delete
    div.addEventListener('dblclick', function () {
      div.remove(); // Remove the task element from the DOM
      removeTask(task); // Remove the task from storage
    });

    // Edit icon
    const editIcon = document.createElement('i');
    editIcon.classList.add('fas', 'fa-pencil-alt', 'edit-icon');
    editIcon.title = 'Edit Task';
    editIcon.addEventListener('click', function () {
      const newTask = prompt('Edit task:', task);
      if (newTask !== null && newTask.trim() !== '') {
        span.textContent = newTask.trim();
        updateTask(task, newTask.trim()); // Update the task in storage
      }
    });

    // Hide button
    const hideButton = document.createElement('button');
    hideButton.textContent = 'Hide';
    hideButton.addEventListener('click', function () {
      div.style.display = 'none'; // Hide the task element
      removeTask(task); // Remove the task from storage
    });

    // Append elements to task div
    div.appendChild(checkbox);
    div.appendChild(span);
    div.appendChild(editIcon);
    div.appendChild(hideButton);

    return div;
  }

  // Update tasks in storage
  function updateTaskList() {
    saveTasks(getTasksFromList());
  }

  // Retrieve tasks from DOM
  function getTasksFromList() {
    return Array.from(taskList.children).map(div => div.querySelector('span').textContent);
  }

  // Remove task from storage
  function removeTask(task) {
    chrome.storage.local.get(['tasks'], function (data) {
      let tasks = data.tasks || [];
      tasks = tasks.filter(t => t !== task);
      saveTasks(tasks);
    });
  }

  // Update task in storage
  function updateTask(oldTask, newTask) {
    chrome.storage.local.get(['tasks'], function (data) {
      let tasks = data.tasks || [];
      const index = tasks.indexOf(oldTask);
      if (index !== -1) {
        tasks[index] = newTask;
        saveTasks(tasks);
      }
    });
  }

  // Handle new task input
  newTaskInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
      const newTask = newTaskInput.value.trim();
      if (newTask !== '' && newTask !== null) {
        chrome.storage.local.get(['tasks'], function (data) {
          const tasks = data.tasks || [];
          tasks.push(newTask);
          saveTasks(tasks);
          const div = createTaskElement(newTask);
          taskList.appendChild(div);
        });
        newTaskInput.value = '';
      } else {
        alert('Task cannot be empty!');
      }
    }
  });

  // Show hidden tasks button functionality
  toggleShowHiddenButton.addEventListener('click', function () {
    const tasks = taskList.querySelectorAll('.task-item');
    tasks.forEach(task => {
      if (task.style.display === 'none') {
        task.style.display = ''; // Show hidden task
      }
    });
  });

  loadTasks(); // Load tasks on page load
});
