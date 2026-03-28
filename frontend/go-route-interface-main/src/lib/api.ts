/**
 * API Service for Bus Booking System
 * Connects to Django REST backend
 */

// Use a consistent base URL. 
// Standardized to localhost:8000 to match the frontend origin localhost:8080.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Helper to extract the CSRF token from document.cookie
 * Django sends this in a cookie named 'csrftoken' by default.
 * Ensure CSRF_COOKIE_HTTPONLY = False in Django settings.
 */
export function getCookie(name: string): string | null {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

/** Types matching Django REST API response shapes */
export interface Bus {
  id: number;
  bus_number: string;
  operator_name: string;
  bus_type: string;
  total_seats: number;
}

export interface Route {
  id: number;
  source: string;
  destination: string;
  distance_km: number;
}

export interface Schedule {
  id: number;
  bus: Bus;
  route: Route;
  departure_time: string;
  arrival_time: string;
  price: string;
  available_seats: number;
}

export interface Booking {
  id: number;
  passenger_name: string;
  seat_number: number;
  bus_number: string;
  operator_name: string;
  source: string;
  destination: string;
  departure_time: string;
  price: number;
}

export interface BookingPayload {
  schedule_id: number;
  passenger_name: string;
  seat_number: number;
}

export interface ApiError {
  error?: string;
  detail?: string;
  message?: string;
}

/**
 * Search for available buses on a route
 */
export async function searchBuses(source: string, destination: string): Promise<Schedule[]> {
  const params = new URLSearchParams({ source, destination });
  const res = await fetch(`${API_BASE_URL}/api/search/?${params}`, {
    credentials: "include"
  });
  
  if (!res.ok) {
    const err: ApiError = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || `Search failed (${res.status})`);
  }
  return res.json();
}

/**
 * Create a new booking
 * Includes CSRF token and credentials for session-based auth
 */
export async function createBooking(payload: BookingPayload): Promise<Booking> {
  const csrfToken = getCookie("csrftoken");

  const res = await fetch(`${API_BASE_URL}/api/book/`, {
    method: "POST",
    credentials: "include", 
    headers: { 
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken || "", 
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err: ApiError = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || `Booking failed (${res.status})`);
  }
  return res.json();
}

/**
 * Cancel an existing booking
 */
export async function cancelBooking(bookingId: number): Promise<void> {
  const csrfToken = getCookie("csrftoken");

  const res = await fetch(`${API_BASE_URL}/api/cancel/${bookingId}/`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "X-CSRFToken": csrfToken || "",
    }
  });

  if (!res.ok) {
    const err: ApiError = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || `Cancellation failed (${res.status})`);
  }
}

/**
 * Fetch all bookings for the logged-in user
 */
export async function getBookings(): Promise<Booking[]> {
  const res = await fetch(`${API_BASE_URL}/api/my-bookings/`, {
    credentials: "include",
  });

  if (!res.ok) {
    const err: ApiError = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || `Failed to fetch bookings (${res.status})`);
  }

  return res.json();
}

// ─── Smart recommendation API ─────────────────────────────────────────────────
export interface BusResult {
  rank:       number;
  bus_id:     number;
  operator:   string;
  bus_number: string;
  departure:  string;
  arrival:    string;
  fare:       string;
  bus_type:   string;
  seats:      number;
  scores: {
    total:   number;
    price:   number;
    time:    number;
    comfort: number;
    seats:   number;
    rating:  number;
  };
  confidence: number;
  reason:     string;
}

export interface RecommendResponse {
  preference: string;
  results:    BusResult[];
  meta:       { total: number };
}

export async function fetchRecommendations(
  source:      string,
  destination: string,
  preference:  string
): Promise<RecommendResponse> {
  const response = await fetch("http://localhost:8000/api/ai/recommend/", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ source, destination, preference }),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}
