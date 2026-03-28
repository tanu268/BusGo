import { useEffect, useState } from "react";
import { getCsrfToken } from "../../lib/csrf";

type Bus = {
  id: number;
  bus_number: string;
  operator_name: string;
};

type RouteType = {
  id: number;
  source: string;
  destination: string;
};

type Schedule = {
  id: number;
  bus: Bus;
  route: RouteType;
  departure_time: string;
  arrival_time: string;
  price: number;
  available_seats: number;
};

export default function ScheduleManagement() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedBus, setSelectedBus] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/me/", { credentials: "include" });
    fetchBuses();
    fetchRoutes();
    fetchSchedules();
  }, []);

  const fetchBuses = async () => {
    const res = await fetch("http://localhost:8000/api/buses/", { credentials: "include" });
    const data = await res.json();
    setBuses(Array.isArray(data) ? data : []);
  };

  const fetchRoutes = async () => {
    const res = await fetch("http://localhost:8000/api/routes/", { credentials: "include" });
    const data = await res.json();
    setRoutes(Array.isArray(data) ? data : []);
  };

  const fetchSchedules = async () => {
    const res = await fetch("http://localhost:8000/api/schedules/", { credentials: "include" });
    const data = await res.json();
    setSchedules(Array.isArray(data) ? data : []);
  };

  const addSchedule = async () => {
    // ✅ Validate ALL fields including arrivalTime
    if (!selectedBus || !selectedRoute || !departureTime || !arrivalTime || !price) {
      setError("All fields are required including arrival time.");
      return;
    }

    // ✅ Validate arrival is after departure BEFORE sending to Django
    if (new Date(arrivalTime) <= new Date(departureTime)) {
      setError("Arrival time must be after departure time.");
      return;
    }

    setError(null);
    setSuccess(null);

    const res = await fetch("http://localhost:8000/api/schedules/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCsrfToken(),
      },
      credentials: "include",
      body: JSON.stringify({
        bus_id: selectedBus,
        route_id: selectedRoute,
        departure_time: new Date(departureTime).toISOString(),
        arrival_time: new Date(arrivalTime).toISOString(),  // ✅ correctly sent
        price: Number(price),
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.detail || body.error || `Error ${res.status}`);
      return;
    }

    setSuccess("Schedule added successfully!");
    setTimeout(() => setSuccess(null), 3000);

    // ✅ Reset ALL fields including arrivalTime
    setSelectedBus("");
    setSelectedRoute("");
    setDepartureTime("");
    setArrivalTime("");   // ✅ was missing before
    setPrice("");
    fetchSchedules();
  };

  const deleteSchedule = async (id: number) => {
    const res = await fetch(`http://localhost:8000/api/schedules/${id}/`, {
      method: "DELETE",
      credentials: "include",
      headers: { "X-CSRFToken": getCsrfToken() },
    });
    if (!res.ok) { setError("Failed to delete schedule."); return; }
    fetchSchedules();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Schedule Management</h1>

      <div className="bg-white p-6 rounded shadow mb-8 w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Add Schedule</h2>

        {error && (
          <div className="mb-3 px-4 py-2 bg-red-50 border border-red-300 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-3 px-4 py-2 bg-green-50 border border-green-300 text-green-700 rounded text-sm">
            {success}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <select
            value={selectedBus}
            onChange={(e) => { setSelectedBus(e.target.value); setError(null); }}
            className="border p-2 rounded flex-1 min-w-[160px]"
          >
            <option value="">Select Bus</option>
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.operator_name} ({bus.bus_number})
              </option>
            ))}
          </select>

          <select
            value={selectedRoute}
            onChange={(e) => { setSelectedRoute(e.target.value); setError(null); }}
            className="border p-2 rounded flex-1 min-w-[160px]"
          >
            <option value="">Select Route</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.source} → {route.destination}
              </option>
            ))}
          </select>

          {/* ✅ Labels added so user knows which datetime is which */}
          <div className="flex flex-col flex-1 min-w-[180px]">
            <label className="text-xs text-gray-500 mb-1">Departure Time</label>
            <input
              type="datetime-local"
              value={departureTime}
              onChange={(e) => { setDepartureTime(e.target.value); setError(null); }}
              className="border p-2 rounded"
            />
          </div>

          <div className="flex flex-col flex-1 min-w-[180px]">
            <label className="text-xs text-gray-500 mb-1">Arrival Time</label>
            <input
              type="datetime-local"
              value={arrivalTime}
              onChange={(e) => { setArrivalTime(e.target.value); setError(null); }}
              className="border p-2 rounded"
            />
          </div>

          <input
            type="number"
            placeholder="Price (₹)"
            value={price}
            min={1}
            onChange={(e) => { setPrice(e.target.value); setError(null); }}
            className="border p-2 rounded w-28"
          />

          <button
            onClick={addSchedule}
            className="bg-black text-white px-4 py-2 rounded self-end"
          >
            Add Schedule
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">All Schedules ({schedules.length})</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border text-left">Bus</th>
              <th className="p-2 border text-left">Route</th>
              <th className="p-2 border text-left">Departure</th>
              <th className="p-2 border text-left">Arrival</th>
              <th className="p-2 border text-left">Price</th>
              <th className="p-2 border text-left">Seats</th>
              <th className="p-2 border text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule) => (
              <tr key={schedule.id} className="hover:bg-gray-50">
                <td className="p-2 border">{schedule.bus?.operator_name || "—"}</td>
                <td className="p-2 border">
                  {schedule.route?.source} → {schedule.route?.destination}
                </td>
                <td className="p-2 border">
                  {new Date(schedule.departure_time).toLocaleString()}
                </td>
                <td className="p-2 border">
                  {/* ✅ Show arrival time in table too */}
                  {schedule.arrival_time
                    ? new Date(schedule.arrival_time).toLocaleString()
                    : "—"}
                </td>
                <td className="p-2 border">₹{schedule.price}</td>
                <td className="p-2 border">{schedule.available_seats}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => deleteSchedule(schedule.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {schedules.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center p-4 text-gray-400">
                  No schedules added yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}