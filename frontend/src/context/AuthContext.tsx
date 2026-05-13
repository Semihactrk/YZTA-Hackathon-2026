import { createContext, useContext, useState, type ReactNode } from "react";

export interface MockUser {
    id: number;
    name: string;
    email: string;
    role?: string;
}



interface AuthResult {
    success: boolean;
    error?: string;
    user?: MockUser;
}

interface AuthCtx {
    user: MockUser | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<AuthResult>;
    register: (name: string, email: string, password: string) => Promise<AuthResult>;
    logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

const AUTH_KEY = "auth_user";

function loadUser(): MockUser | null {
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<MockUser | null>(loadUser);

    const register = async (name: string, email: string, password: string): Promise<AuthResult> => {
        try {
            const response = await fetch("http://localhost:8000/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                return { success: false, error: data.detail || "Kayıt işlemi başarısız." };
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: "Sunucu bağlantı hatası." };
        }
    };

    const login = async (email: string, password: string): Promise<AuthResult> => {
        try {
            const response = await fetch("http://localhost:8000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                return { success: false, error: data.detail || "E-posta veya şifre hatalı." };
            }
            
            // Backend returns user object
            localStorage.setItem(AUTH_KEY, JSON.stringify(data.user));
            setUser(data.user);
            return { success: true, user: data.user };
        } catch (error) {
            return { success: false, error: "Sunucu bağlantı hatası." };
        }
    };

    const logout = () => {
        localStorage.removeItem(AUTH_KEY);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}