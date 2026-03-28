import { useEffect, useState } from "react";

type Stats = {
  total_buses: number;
  total_routes: number;
  total_users: number;
  total_bookings: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/admin/stats/", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error(err));
  }, []);

  if (!stats) {
    return <p className="text-lg">Loading dashboard...</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-4 gap-6">

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Total Buses</p>
          <p className="text-3xl font-bold">{stats.total_buses}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Total Routes</p>
          <p className="text-3xl font-bold">{stats.total_routes}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Total Users</p>
          <p className="text-3xl font-bold">{stats.total_users}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Total Bookings</p>
          <p className="text-3xl font-bold">{stats.total_bookings}</p>
        </div>

      </div>
    </div>
  );
}