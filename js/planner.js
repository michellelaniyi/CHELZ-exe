
// ========================================
// CHELZ.EXE — ACADEMIC PLANNER
// ========================================

// DOM elements
const taskForm = document.getElementById("task-form");
const taskTitleInput = document.getElementById("task-title");
const taskCourseInput = document.getElementById("task-course");
const taskDueDateInput = document.getElementById("task-due-date");

const taskTableBody = document.getElementById("task-table-body");
const emptyMessage = document.getElementById("empty-message");
const plannerDate = document.getElementById("planner-date");

const totalCount = document.getElementById("total-count");
const pendingCount = document.getElementById("pending-count");
const completedCount = document.getElementById("completed-count");

const filterButtons = document.querySelectorAll(".task-filter");

// Load saved tasks. Keep the existing storage key for compatibility.
function loadTasks() {
    try {
        const savedTasks = JSON.parse(
            localStorage.getItem("chelzTasks") || "[]"
        );

        if (!Array.isArray(savedTasks)) {
            return [];
        }

        // Keep older saved tasks compatible with the updated planner.
        return savedTasks
            .filter(task => task && typeof task === "object")
            .map(task => ({
                ...task,
                id: String(task.id ?? createTaskId()),
                title: String(task.title ?? ""),
                course: String(task.course ?? "Other"),
                dueDate: String(task.dueDate ?? ""),
                completed: task.completed === true
            }));
    } catch (error) {
        console.error("Could not load saved planner tasks:", error);
        return [];
    }
}

let tasks = loadTasks();
let currentFilter = "all";
let editingTaskId = null;

// ========================================
// HELPERS
// ========================================

function createTaskId() {
    return (
        Date.now().toString() +
        Math.random().toString(16).slice(2)
    );
}

function saveTasks() {
    try {
        localStorage.setItem("chelzTasks", JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error("Could not save planner tasks:", error);
        alert(
            "Your changes could not be saved. Check your browser storage settings."
        );
        return false;
    }
}

function getTodayDate() {
    const now = new Date();

    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );
}

function formatDate(dateString) {
    if (!dateString) {
        return "No due date";
    }

    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (
        Number.isNaN(date.getTime()) ||
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return "Invalid date";
    }

    return date.toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function isOverdue(task) {
    if (!task.dueDate || task.completed) {
        return false;
    }

    const [year, month, day] = task.dueDate.split("-").map(Number);
    const dueDate = new Date(year, month - 1, day);

    return dueDate < getTodayDate();
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function createCell(content, className = "") {
    const cell = document.createElement("td");

    if (className) {
        cell.className = className;
    }

    if (content instanceof Node) {
        cell.appendChild(content);
    } else if (content !== undefined && content !== null) {
        cell.textContent = String(content);
    }

    return cell;
}

function getFilteredTasks() {
    if (currentFilter === "pending") {
        return tasks.filter(task => !task.completed);
    }

    if (currentFilter === "completed") {
        return tasks.filter(task => task.completed);
    }

    return tasks;
}

// ========================================
// PLANNER DATE
// ========================================

if (plannerDate) {
    plannerDate.textContent = new Date().toLocaleDateString("en-NG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

// ========================================
// ADD TASK
// ========================================

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = taskTitleInput.value.trim();
    const course = taskCourseInput.value;
    const dueDate = taskDueDateInput.value;

    if (!title || !course) {
        return;
    }

    const newTask = {
        id: createTaskId(),
        title,
        course,
        dueDate,
        completed: false
    };

    tasks.push(newTask);

    if (!saveTasks()) {
        tasks.pop();
        return;
    }

    editingTaskId = null;
    taskForm.reset();

    renderTasks();
    taskTitleInput.focus();
});

// ========================================
// RENDER TASK TABLE
// ========================================

function renderTasks() {
    taskTableBody.replaceChildren();

    const filteredTasks = getFilteredTasks();

    filteredTasks.forEach(task => {
        const row = document.createElement("tr");

        if (task.completed) {
            row.classList.add("is-completed");
        }

        if (editingTaskId === task.id) {
            renderEditingRow(row, task);
        } else {
            renderTaskRow(row, task);
        }

        taskTableBody.appendChild(row);
    });

    updateCounters();
    updateEmptyMessage(filteredTasks);
}

// Render a normal task row.
function renderTaskRow(row, task) {
    // Task title and completion checkbox
    const titleCell = document.createElement("td");
    const titleWrapper = document.createElement("div");

    titleWrapper.className = "task-title-wrapper";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute(
        "aria-label",
        `Mark ${task.title} as ${task.completed ? "pending" : "completed"}`
    );

    checkbox.addEventListener("change", function () {
        updateTask(task.id, {
            completed: checkbox.checked
        });
    });

    const title = createElement("span", "task-title", task.title);

    titleWrapper.append(checkbox, title);
    titleCell.appendChild(titleWrapper);

    // Course
    const courseCell = createCell(task.course, "task-course");

    // Due date
    const dueDateCell = document.createElement("td");

    if (task.dueDate) {
        dueDateCell.textContent = formatDate(task.dueDate);

        if (isOverdue(task)) {
            dueDateCell.classList.add("task-due-date", "overdue");
            dueDateCell.textContent += " · Overdue";
        }
    } else {
        dueDateCell.textContent = "—";
    }

    // Status badge
    const status = createElement(
        "span",
        `task-status ${task.completed ? "completed" : "pending"}`,
        task.completed ? "Completed" : "Pending"
    );

    const statusCell = createCell(status);

    // Actions
    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = createActionButton("Edit", "edit-task-button");
    editButton.setAttribute("aria-label", `Edit ${task.title}`);

    editButton.addEventListener("click", function () {
        editingTaskId = task.id;
        renderTasks();
    });

    const deleteButton = createActionButton(
        "Delete",
        "delete-task-button"
    );

    deleteButton.setAttribute("aria-label", `Delete ${task.title}`);

    deleteButton.addEventListener("click", function () {
        deleteTask(task.id);
    });

    actions.append(editButton, deleteButton);

    const actionsCell = createCell(actions, "task-actions-cell");

    row.append(
        titleCell,
        courseCell,
        dueDateCell,
        statusCell,
        actionsCell
    );
}

// ========================================
// EDIT TASK
// ========================================

function renderEditingRow(row, task) {
    // Editable title
    const titleInput = document.createElement("input");

    titleInput.type = "text";
    titleInput.className = "task-edit-input";
    titleInput.value = task.title;
    titleInput.maxLength = 120;
    titleInput.required = true;
    titleInput.setAttribute("aria-label", "Task name");

    row.appendChild(createCell(titleInput));

    // Editable course
    const courseSelect = document.createElement("select");

    courseSelect.className = "task-edit-select";
    courseSelect.setAttribute("aria-label", "Course");

    const courses = [
        ["COS 102", "COS 102"],
        ["CSC 106", "CSC 106"],
        ["GST 112", "GST 112"],
        ["GST 122", "GST 122"],
        ["COS 111", "COS 111"],
        ["MTH 102", "MTH 102"],
        ["PHY 102", "PHY 102"],
        ["PHY 108", "PHY 108"],
        ["Other", "Other"]
    ];

    courses.forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        courseSelect.appendChild(option);
    });

    // Preserve a course value from an older or custom task.
    if (!courses.some(([value]) => value === task.course)) {
        const option = document.createElement("option");
        option.value = task.course;
        option.textContent = task.course;
        courseSelect.appendChild(option);
    }

    courseSelect.value = task.course;
    row.appendChild(createCell(courseSelect));

    // Editable due date
    const dueDateInput = document.createElement("input");

    dueDateInput.type = "date";
    dueDateInput.className = "task-edit-input";
    dueDateInput.value = task.dueDate;
    dueDateInput.setAttribute("aria-label", "Due date");

    row.appendChild(createCell(dueDateInput));

    // Current status
    const status = createElement(
        "span",
        `task-status ${task.completed ? "completed" : "pending"}`,
        task.completed ? "Completed" : "Pending"
    );

    row.appendChild(createCell(status));

    // Save and cancel actions
    const actions = document.createElement("div");
    actions.className = "task-actions";

    const saveButton = createActionButton("Save", "save-task-button");

    saveButton.addEventListener("click", function () {
        const updatedTitle = titleInput.value.trim();

        if (!updatedTitle) {
            titleInput.setCustomValidity("Please enter a task name.");
            titleInput.reportValidity();
            titleInput.focus();
            return;
        }

        titleInput.setCustomValidity("");

        updateTask(task.id, {
            title: updatedTitle,
            course: courseSelect.value,
            dueDate: dueDateInput.value
        });

        editingTaskId = null;
        renderTasks();
    });

    const cancelButton = createActionButton(
        "Cancel",
        "cancel-task-button"
    );

    cancelButton.addEventListener("click", function () {
        editingTaskId = null;
        renderTasks();
    });

    // Enter saves; Escape cancels while editing the task title.
    titleInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            saveButton.click();
        }

        if (event.key === "Escape") {
            editingTaskId = null;
            renderTasks();
        }
    });

    actions.append(saveButton, cancelButton);
    row.appendChild(createCell(actions, "task-actions-cell"));

    // Focus the title field when edit mode appears.
    requestAnimationFrame(() => {
        titleInput.focus();
        titleInput.select();
    });
}

function createActionButton(label, extraClass) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = `task-action-button ${extraClass}`;
    button.textContent = label;

    return button;
}

// ========================================
// UPDATE TASK
// ========================================

function updateTask(taskId, changes) {
    const index = tasks.findIndex(task => task.id === taskId);

    if (index === -1) {
        return;
    }

    const previousTask = tasks[index];

    tasks[index] = {
        ...previousTask,
        ...changes
    };

    if (!saveTasks()) {
        tasks[index] = previousTask;
        renderTasks();
        return;
    }

    renderTasks();
}

// ========================================
// DELETE TASK
// ========================================

function deleteTask(taskId) {
    const index = tasks.findIndex(task => task.id === taskId);

    if (index === -1) {
        return;
    }

    const deletedTask = tasks[index];

    tasks = tasks.filter(task => task.id !== taskId);

    if (!saveTasks()) {
        tasks.splice(index, 0, deletedTask);
        renderTasks();
        return;
    }

    if (editingTaskId === taskId) {
        editingTaskId = null;
    }

    renderTasks();
}

// ========================================
// COUNTERS AND EMPTY STATE
// ========================================

function updateCounters() {
    totalCount.textContent = tasks.length;

    pendingCount.textContent = tasks.filter(
        task => !task.completed
    ).length;

    completedCount.textContent = tasks.filter(
        task => task.completed
    ).length;
}

function updateEmptyMessage(filteredTasks) {
    emptyMessage.hidden = filteredTasks.length > 0;

    if (tasks.length === 0) {
        emptyMessage.textContent =
            "Your list is looking peaceful. Add your first task above.";
    } else if (filteredTasks.length === 0) {
        if (currentFilter === "pending") {
            emptyMessage.textContent =
                "No pending tasks. You're all caught up!";
        } else if (currentFilter === "completed") {
            emptyMessage.textContent =
                "No completed tasks yet. Keep going!";
        } else {
            emptyMessage.textContent =
                "No tasks to display.";
        }
    }
}

// ========================================
// FILTER TASKS
// ========================================

filterButtons.forEach(button => {
    button.addEventListener("click", function () {
        currentFilter = button.dataset.filter;
        editingTaskId = null;

        filterButtons.forEach(filterButton => {
            const isActive = filterButton === button;

            filterButton.classList.toggle("active", isActive);
            filterButton.setAttribute(
                "aria-pressed",
                String(isActive)
            );
        });

        renderTasks();
    });
});

// ========================================
// INITIAL RENDER
// ========================================

renderTasks();