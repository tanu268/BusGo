import { useEffect, useState } from "react";
import { getCsrfToken } from "../../lib/csrf";

type RouteType = {
  id: number;
  source: string;
  destination: string;
  distance_km: number;
};

export default function RouteManagement() {
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [distance, setDistance] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/me/", { credentials: "include" });
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/routes/", {
        credentials: "include",
      });
      const data = await res.json();
      setRoutes(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load routes.");
    }
  };

  const addRoute = async () => {
    if (!source.trim() || !destination.trim()) {
      setError("Source and destination are required.");
      return;
    }
    if (!distance || Number(distance) <= 0) {
      setError("Enter a valid distance.");
      return;
    }
    setError(null);
    setSuccess(null);

    const res = await fetch("http://localhost:8000/api/routes/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCsrfToken(),
      },
      credentials: "include",
      body: JSON.stringify({
        source: source.trim(),
        destination: destination.trim(),
        distance_km: Number(distance),  // ✅ correctly placed here
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.detail || body.error || `Error ${res.status}`);
      return;
    }

    setSuccess("Route added successfully!");
    setTimeout(() => setSuccess(null), 3000);
    setSource("");
    setDestination("");
    setDistance("");
    fetchRoutes();
  };

  const deleteRoute = async (id: number) => {
    const res = await fetch(`http://localhost:8000/api/routes/${id}/`, {
      method: "DELETE",
      credentials: "include",
      headers: { "X-CSRFToken": getCsrfToken() },
    });
    if (!res.ok) { setError("Failed to delete route."); return; }
    fetchRoutes();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Route Management</h1>

      <div className="bg-white p-6 rounded shadow mb-8 w-full max-w-xl">
        <h2 className="text-xl font-semibold mb-4">Add Route</h2>

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
            placeholder="Source City"
            value={source}
            onChange={(e) => { setSource(e.target.value); setError(null); }}
            className="border p-2 rounded flex-1 min-w-[130px]"
          />
          <input
            type="text"
            placeholder="Destination City"
            value={destination}
            onChange={(e) => { setDestination(e.target.value); setError(null); }}
            className="border p-2 rounded flex-1 min-w-[130px]"
          />
          {/* ✅ distance_km input correctly placed in JSX */}
          <input
            type="number"
            placeholder="Distance (km)"
            value={distance}
            min={1}
            onChange={(e) => { setDistance(Number(e.target.value)); setError(null); }}
            className="border p-2 rounded w-32"
          />
          <button
            onClick={addRoute}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Add Route
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">All Routes ({routes.length})</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border text-left">Source</th>
              <th className="p-2 border text-left">Destination</th>
              <th className="p-2 border text-left">Distance</th>
              <th className="p-2 border text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <tr key={route.id} className="hover:bg-gray-50">
                <td className="p-2 border">{route.source}</td>
                <td className="p-2 border">{route.destination}</td>
                <td className="p-2 border">{route.distance_km} km</td>
                <td className="p-2 border">
                  <button
                    onClick={() => deleteRoute(route.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {routes.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center p-4 text-gray-400">
                  No routes added yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
