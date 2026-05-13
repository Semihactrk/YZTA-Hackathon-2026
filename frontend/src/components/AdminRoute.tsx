import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

export default function AdminRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    if (user?.role !== "admin") {
        return <Navigate to="/" replace />; // Yetkisi yoksa anasayfaya at
    }

    return <>{children}</>;
}
