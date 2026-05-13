import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string })?.from ?? "/";
    const justRegistered = (location.state as { registered?: boolean })?.registered === true;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{ email?: string; password?: string; api?: string }>({});

    const validate = () => {
        const e: typeof errors = {};
        if (!email.trim()) e.email = "E-posta zorunlu";
        if (!password.trim()) e.password = "Şifre zorunlu";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        const result = await login(email, password);
        if (!result.success) {
            setErrors({ api: result.error });
            return;
        }
        
        if (result.user?.role === "admin") {
            navigate("/admin", { replace: true });
        } else {
            navigate(from, { replace: true });
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: "100vh", background: "var(--bg)" }}>
            <div className="card" style={{ width: "100%", maxWidth: 420, padding: "2.5rem" }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🌿</div>
                    <h1
                        style={{ fontFamily: "var(--font-head)", fontSize: "1.8rem", color: "var(--text)" }}
                    >
                        Toprak Ana
                    </h1>
                    <p style={{ color: "var(--text-3)", fontSize: "0.88rem", marginTop: "0.4rem" }}>
                        Devam etmek için giriş yapın
                    </p>
                </div>

                {justRegistered && (
                    <div
                        style={{
                            background: "rgba(76,175,125,0.12)",
                            border: "1px solid rgba(76,175,125,0.3)",
                            borderRadius: "var(--radius-sm)",
                            padding: "0.7rem 1rem",
                            color: "var(--green)",
                            fontSize: "0.88rem",
                            marginBottom: "1rem",
                            textAlign: "center",
                        }}
                    >
                        Kayıt başarılı! Şimdi giriş yapabilirsiniz.
                    </div>
                )}

                {errors.api && (
                    <div className="error-msg" style={{ marginBottom: "1rem" }}>{errors.api}</div>
                )}

                <form
                    onSubmit={handleSubmit}
                    noValidate
                    style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
                >
                    <div className="form-group">
                        <label className="form-label">E-posta</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setErrors((er) => ({ ...er, email: undefined, api: undefined }));
                            }}
                            placeholder="ornek@email.com"
                            style={{ width: "100%", borderColor: errors.email ? "var(--red)" : undefined }}
                            autoFocus
                        />
                        {errors.email && (
                            <span style={{ color: "var(--red)", fontSize: "0.78rem" }}>{errors.email}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setErrors((er) => ({ ...er, password: undefined, api: undefined }));
                            }}
                            placeholder="••••••••"
                            style={{ width: "100%", borderColor: errors.password ? "var(--red)" : undefined }}
                        />
                        {errors.password && (
                            <span style={{ color: "var(--red)", fontSize: "0.78rem" }}>{errors.password}</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: "100%", padding: "0.75rem", fontSize: "0.95rem" }}
                    >
                        Giriş Yap
                    </button>
                </form>

                <p
                    style={{
                        textAlign: "center",
                        marginTop: "1.25rem",
                        fontSize: "0.85rem",
                        color: "var(--text-3)",
                    }}
                >
                    Hesabınız yok mu?{" "}
                    <Link to="/register" style={{ color: "var(--accent)" }}>
                        Kayıt Ol
                    </Link>
                </p>

                <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
                    <Link to="/" style={{ color: "var(--text-3)", fontSize: "0.82rem" }}>
                        ← Mağazaya Dön
                    </Link>
                </div>
            </div>
        </div>
    );
}