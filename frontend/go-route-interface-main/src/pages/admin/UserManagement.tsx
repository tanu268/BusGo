import { useEffect, useState } from "react";
import { getCsrfToken } from "../../lib/csrf";

type User = {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  date_joined: string;
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/me/", { credentials: "include" });
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/users/", {
        credentials: "include",
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load users.");
    }
  };

  const deleteUser = async (id: number) => {
    setError(null);
    const res = await fetch(`http://localhost:8000/api/users/${id}/`, {
      method: "DELETE",
      credentials: "include",
      headers: { "X-CSRFToken": getCsrfToken() },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Failed to delete user.");
      return;
    }
    fetchUsers();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">User Management</h1>

      {error && (
        <div className="mb-4 px-4 py-2 bg-red-50 border border-red-300 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">All Users ({users.length})</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border text-left">Username</th>
              <th className="p-2 border text-left">Email</th>
              <th className="p-2 border text-left">Role</th>
              <th className="p-2 border text-left">Joined</th>
              <th className="p-2 border text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="p-2 border">{user.username}</td>
                <td className="p-2 border">{user.email || "—"}</td>
                <td className="p-2 border">
                  {/* ✅ Show admin badge */}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    user.is_staff
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {user.is_staff ? "Admin" : "User"}
                  </span>
                </td>
                <td className="p-2 border text-sm text-gray-500">
                  {new Date(user.date_joined).toLocaleDateString()}
                </td>
                <td className="p-2 border">
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center p-4 text-gray-400">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
