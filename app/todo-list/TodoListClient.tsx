"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import type { ITodo } from "@/models/Todo";

export default function TodoListClient() {
  const [todos, setTodos] = useState<ITodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<ITodo | null>(null);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/todos");

      if (response.ok) {
        const data = await response.json();
        setTodos(data.todos || []);
      }
    } catch (error) {
      console.error("Error fetching todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingTodo(null);
    setTitle("");
    const now = new Date();
    setDueDate(format(now, "yyyy-MM-dd"));
    setDueTime(format(now, "HH:mm"));
    setDescription("");
    setIsFormOpen(true);
  };

  const handleEditClick = (todo: ITodo) => {
    setEditingTodo(todo);
    setTitle(todo.title);
    const due = new Date(todo.dueDate);
    setDueDate(format(due, "yyyy-MM-dd"));
    setDueTime(format(due, "HH:mm"));
    setDescription(todo.description || "");
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    if (!dueDate) {
      alert("Please select a due date");
      return;
    }
    if (!dueTime) {
      alert("Please select a due time");
      return;
    }

    setIsSaving(true);

    try {
      const dueDateTime = new Date(`${dueDate}T${dueTime}`);

      if (Number.isNaN(dueDateTime.getTime())) {
        alert("Invalid due date/time");
        setIsSaving(false);
        return;
      }

      const todoData = {
        title: title.trim(),
        dueDate: dueDateTime.toISOString(),
        description: description.trim(),
      };

      if (editingTodo) {
        // Update existing todo
        const response = await fetch(`/api/todos/${editingTodo._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(todoData),
        });

        if (!response.ok) {
          throw new Error("Failed to update todo");
        }
      } else {
        // Create new todo
        const response = await fetch("/api/todos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(todoData),
        });

        if (!response.ok) {
          throw new Error("Failed to create todo");
        }
      }

      setIsFormOpen(false);
      setEditingTodo(null);
      fetchTodos();
    } catch (error) {
      console.error("Error saving todo:", error);
      alert("Failed to save todo. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleComplete = async (todo: ITodo) => {
    try {
      const response = await fetch(`/api/todos/${todo._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: !todo.completed }),
      });

      if (response.ok) {
        fetchTodos();
      } else {
        alert("Failed to update todo");
      }
    } catch (error) {
      console.error("Error updating todo:", error);
      alert("Failed to update todo");
    }
  };

  const handleDelete = async (todoId: string) => {
    if (!confirm("Are you sure you want to delete this todo?")) {
      return;
    }

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTodos();
      } else {
        alert("Failed to delete todo");
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
      alert("Failed to delete todo");
    }
  };

  const sortedTodos = [...todos].sort((a, b) => {
    // Sort by completed status first (incomplete first), then by due date
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const now = new Date();
  const todayKey = format(now, "yyyy-MM-dd");

  const overdueTodos = sortedTodos.filter(
    (todo) => !todo.completed && new Date(todo.dueDate) < now
  );
  const todayTodos = sortedTodos.filter(
    (todo) =>
      !todo.completed &&
      format(new Date(todo.dueDate), "yyyy-MM-dd") === todayKey
  );
  const upcomingTodos = sortedTodos.filter((todo) => {
    if (todo.completed) return false;
    const due = new Date(todo.dueDate);
    return format(due, "yyyy-MM-dd") !== todayKey && due > now;
  });
  const completedTodos = sortedTodos.filter((todo) => todo.completed);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Todo List
          </h1>
          <button
            onClick={handleAddClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Todo
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overdue Todos */}
            {overdueTodos.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-3">
                  Overdue
                </h2>
                <div className="space-y-2">
                  {overdueTodos.map((todo) => (
                    <TodoItem
                      key={todo._id.toString()}
                      todo={todo}
                      onToggleComplete={() => handleToggleComplete(todo)}
                      onEdit={() => handleEditClick(todo)}
                      onDelete={() => handleDelete(todo._id.toString())}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Today's Todos */}
            {todayTodos.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-3">
                  Today
                </h2>
                <div className="space-y-2">
                  {todayTodos.map((todo) => (
                    <TodoItem
                      key={todo._id.toString()}
                      todo={todo}
                      onToggleComplete={() => handleToggleComplete(todo)}
                      onEdit={() => handleEditClick(todo)}
                      onDelete={() => handleDelete(todo._id.toString())}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Todos */}
            {upcomingTodos.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Upcoming
                </h2>
                <div className="space-y-2">
                  {upcomingTodos.map((todo) => (
                    <TodoItem
                      key={todo._id.toString()}
                      todo={todo}
                      onToggleComplete={() => handleToggleComplete(todo)}
                      onEdit={() => handleEditClick(todo)}
                      onDelete={() => handleDelete(todo._id.toString())}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Todos */}
            {completedTodos.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-3">
                  Completed
                </h2>
                <div className="space-y-2">
                  {completedTodos.map((todo) => (
                    <TodoItem
                      key={todo._id.toString()}
                      todo={todo}
                      onToggleComplete={() => handleToggleComplete(todo)}
                      onEdit={() => handleEditClick(todo)}
                      onDelete={() => handleDelete(todo._id.toString())}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {todos.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p className="text-lg mb-2">No todos yet</p>
                <p className="text-sm">Click "Add Todo" to create your first todo!</p>
              </div>
            )}
          </div>
        )}

        {/* Todo Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl m-4">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {editingTodo ? "Edit Todo" : "New Todo"}
                  </h2>
                  <button
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingTodo(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter todo title"
                      required
                    />
                  </div>

                  {/* Due Date & Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Due Date & Time *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                      />
                      <input
                        type="time"
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter todo description"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormOpen(false);
                        setEditingTodo(null);
                      }}
                      className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface TodoItemProps {
  todo: ITodo;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function TodoItem({ todo, onToggleComplete, onEdit, onDelete }: TodoItemProps) {
  const now = new Date();
  const isOverdue = !todo.completed && new Date(todo.dueDate) < now;
  const isToday =
    !todo.completed &&
    format(new Date(todo.dueDate), "yyyy-MM-dd") ===
      format(new Date(), "yyyy-MM-dd");

  return (
    <div
      className={`bg-white dark:bg-gray-700 rounded-lg p-4 border ${
        isOverdue
          ? "border-red-300 dark:border-red-600"
          : isToday
          ? "border-blue-300 dark:border-blue-600"
          : "border-gray-200 dark:border-gray-600"
      } ${todo.completed ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggleComplete}
          className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            todo.completed
              ? "bg-green-500 border-green-500"
              : "border-gray-300 dark:border-gray-500 hover:border-green-500"
          }`}
        >
          {todo.completed && (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold text-gray-900 dark:text-white ${
              todo.completed ? "line-through" : ""
            }`}
          >
            {todo.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Due: {format(new Date(todo.dueDate), "MMM d, yyyy HH:mm")}
            {isOverdue && (
              <span className="ml-2 text-red-600 dark:text-red-400 font-medium">
                (Overdue)
              </span>
            )}
            {isToday && (
              <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                (Today)
              </span>
            )}
          </p>
          {todo.description && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              {todo.description}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Edit"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

