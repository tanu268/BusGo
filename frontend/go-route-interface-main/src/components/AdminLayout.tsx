import { Link } from "react-router-dom";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">

      {/* Sidebar */}
      <div className="w-60 bg-gray-900 text-white p-6">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>

        <nav className="flex flex-col gap-4">
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/buses">Buses</Link>
          <Link to="/admin/routes">Routes</Link>
          <Link to="/admin/schedules">Schedules</Link>
          <Link to="/admin/users">Users</Link>
          <Link to="/admin/Analytics">Analytics</Link>
        </nav>
      </div>

      {/* Page Content */}
      <div className="flex-1 p-8 bg-gray-100">
        {children}
      </div>

    </div>
  );
}