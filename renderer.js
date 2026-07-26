// 待办清单前端逻辑

const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const remainingCount = document.getElementById('remaining-count');
const clearCompletedBtn = document.getElementById('clear-completed');

const STORAGE_KEY = 'desktop-todo-items';

let todos = loadTodos();

function loadTodos() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function render() {
  todoList.innerHTML = '';

  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    li.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;
    span.addEventListener('dblclick', () => startEdit(li, todo));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    todoList.appendChild(li);
  });

  updateEmptyState();
  updateStats();
}

function addTodo(text) {
  if (!text.trim()) return;

  const todo = {
    id: Date.now().toString(),
    text: text.trim(),
    completed: false,
  };

  todos.unshift(todo);
  saveTodos();
  render();
}

function toggleTodo(id) {
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
  saveTodos();
  render();
}

function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  render();
}

function clearCompleted() {
  todos = todos.filter((todo) => !todo.completed);
  saveTodos();
  render();
}

function startEdit(li, todo) {
  const span = li.querySelector('.todo-text');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'edit-input';
  input.value = todo.text;

  function finishEdit() {
    const newText = input.value.trim();
    if (newText) {
      todos = todos.map((t) =>
        t.id === todo.id ? { ...t, text: newText } : t
      );
      saveTodos();
    }
    render();
  }

  input.addEventListener('blur', finishEdit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      finishEdit();
    } else if (e.key === 'Escape') {
      render();
    }
  });

  li.replaceChild(input, span);
  input.focus();
}

function updateEmptyState() {
  if (todos.length === 0) {
    emptyState.style.display = 'block';
    todoList.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    todoList.style.display = 'block';
  }
}

function updateStats() {
  const remaining = todos.filter((todo) => !todo.completed).length;
  remainingCount.textContent = `${remaining} 个待完成`;
  clearCompletedBtn.style.display = todos.some((t) => t.completed)
    ? 'inline-block'
    : 'none';
}

todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addTodo(todoInput.value);
  todoInput.value = '';
  todoInput.focus();
});

clearCompletedBtn.addEventListener('click', clearCompleted);

// 初始化渲染
render();
todoInput.focus();
