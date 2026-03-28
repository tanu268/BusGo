import BusManagement from "./pages/admin/BusManagement";
import RouteManagement from "./pages/admin/RouteManagement";
import ScheduleManagement from "./pages/admin/ScheduleManagement";
import UserManagement from "./pages/admin/UserManagement";
import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import UserChatbot from "@/components/UserChatbot"; // ✅ import

import Index from "./pages/Index";
import SearchResults from "./pages/SearchResults";
import Analytics from "./pages/admin/Analytics";
import MyBookings from "./pages/MyBookings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ProtectedRoute from "@/components/ProtectedRoute";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/admin/AdminDashboard";

const queryClient = new QueryClient();

type User = {
  username: string;
  email: string;
  is_staff: boolean;
};

function LayoutWrapper({ children, user, setUser }: any) {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <>
      {!isAdminPage && <Navbar user={user} setUser={setUser} />}
      {children}
      {/* ✅ Show chatbot only for logged-in normal users */}
      {user && !user.is_staff && !isAdminPage && <UserChatbot />}
    </>
  );
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/me/", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data && data.username) {
          setUser(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <LayoutWrapper user={user} setUser={setUser}>
            <Routes>
              <Route
                path="/"
                element={user ? <Index /> : <Navigate to="/login" replace />}
              />
              <Route path="/search" element={<SearchResults />} />
              <Route
                path="/bookings"
                element={
                  <ProtectedRoute user={user}>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<Login setUser={setUser} />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute user={user} adminOnly>
                    <AdminLayout><AdminDashboard /></AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/buses"
                element={
                  <ProtectedRoute user={user} adminOnly>
                    <AdminLayout><BusManagement /></AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/routes"
                element={
                  <ProtectedRoute user={user} adminOnly>
                    <AdminLayout><RouteManagement /></AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/schedules"
                element={
                  <ProtectedRoute user={user} adminOnly>
                    <AdminLayout><ScheduleManagement /></AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute user={user} adminOnly>
                    <AdminLayout><UserManagement /></AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute user={user} adminOnly>
                    <AdminLayout><Analytics /></AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </LayoutWrapper>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;