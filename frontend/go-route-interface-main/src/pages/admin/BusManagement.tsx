import { useEffect, useState } from "react";
import { getCsrfToken } from "../../lib/csrf";

type Bus = {
  id: number;
  bus_number: string;
  operator_name: string;
  bus_type: string;
  total_seats: number;
};

export default function BusManagement() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [name, setName] = useState("");
  const [seats, setSeats] = useState<number | "">("");
  const [busType, setBusType] = useState("AC Sleeper"); // ✅ default value
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/api/me/", { credentials: "include" });
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/buses/", {
        credentials: "include",
      });
      const data = await res.json();
      setBuses(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load buses.");
    }
  };

  const addBus = async () => {
    if (!name.trim()) { setError("Operator name is required."); return; }
    if (!seats || Number(seats) <= 0) { setError("Enter a valid seat count."); return; }
    if (!busType) { setError("Select a bus type."); return; }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/buses/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfToken(),
        },
        credentials: "include",
        body: JSON.stringify({
          bus_number: "BUS" + Math.floor(Math.random() * 9000 + 1000),
          operator_name: name.trim(),
          bus_type: busType,        // ✅ uses selected value instead of hardcoded
          total_seats: Number(seats),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.detail || body.error || `Error ${res.status}: ${res.statusText}`);
        return;
      }

      setSuccess("Bus added successfully!");
      setTimeout(() => setSuccess(null), 3000);
      setName("");
      setSeats("");
      setBusType("AC Sleeper"); // ✅ reset to default after submit
      fetchBuses();
    } catch {
      setError("Network error. Is the Django server running?");
    } finally {
      setLoading(false);
    }
  };

  const deleteBus = async (id: number) => {
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/buses/${id}/`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRFToken": getCsrfToken() },
      });
      if (!res.ok) { setError("Failed to delete bus."); return; }
      fetchBuses();
    } catch {
      setError("Network error while deleting.");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Bus Management</h1>

      <div className="bg-white p-6 rounded shadow mb-8 w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Add Bus</h2>

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

        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Operator Name"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            className="border p-2 rounded flex-1 min-w-[160px]"
          />

          {/* ✅ Bus type dropdown — admin can now choose */}
          <select
            value={busType}
            onChange={(e) => { setBusType(e.target.value); setError(null); }}
            className="border p-2 rounded flex-1 min-w-[160px]"
          >
            <option value="AC Sleeper">AC Sleeper</option>
            <option value="Non-AC Sleeper">Non-AC Sleeper</option>
            <option value="AC Seater">AC Seater</option>
            <option value="Non-AC Seater">Non-AC Seater</option>
            <option value="Volvo">Volvo</option>
          </select>

          <input
            type="number"
            placeholder="Total Seats"
            value={seats}
            min={1}
            onChange={(e) => { setSeats(Number(e.target.value)); setError(null); }}
            className="border p-2 rounded w-32"
          />

          <button
            onClick={addBus}
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Bus"}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">All Buses ({buses.length})</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border text-left">Bus Number</th>
              <th className="p-2 border text-left">Operator Name</th>
              <th className="p-2 border text-left">Type</th>
              <th className="p-2 border text-left">Total Seats</th>
              <th className="p-2 border text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {buses.map((bus) => (
              <tr key={bus.id} className="hover:bg-gray-50">
                <td className="p-2 border">{bus.bus_number || "—"}</td>
                <td className="p-2 border">{bus.operator_name || "—"}</td>
                <td className="p-2 border">{bus.bus_type || "—"}</td>
                <td className="p-2 border">{bus.total_seats}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => deleteBus(bus.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {buses.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center p-4 text-gray-400">
                  No buses added yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}