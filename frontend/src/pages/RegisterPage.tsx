import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface FormState {
    name: string;
    email: string;
    password: string;
    confirm: string;
}

const EMPTY: FormState = { name: "", email: "", password: "", confirm: "" };

export default function RegisterPage() {
    const { register, login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState<FormState>(EMPTY);
    const [errors, setErrors] = useState<Partial<FormState & { api: string }>>({});

    const field = (key: keyof FormState) => ({
        value: form[key],
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            setForm((f) => ({ ...f, [key]: e.target.value }));
            setErrors((er) => ({ ...er, [key]: undefined, api: undefined }));
        },
    });

    const validate = (): boolean => {
        const e: Partial<FormState & { api: string }> = {};
        if (!form.name.trim()) e.name = "Ad soyad zorunlu";
        if (!form.email.trim()) e.email = "E-posta zorunlu";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Geçerli bir e-posta girin";
        if (!form.password) e.password = "Şifre zorunlu";
        else if (form.password.length < 4) e.password = "Şifre en az 4 karakter olmalı";
        if (form.password !== form.confirm) e.confirm = "Şifreler eşleşmiyor";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        const result = await register(form.name, form.email, form.password);
        if (!result.success) {
            setErrors({ api: result.error });
            return;
        }
        
        // Kayıt başarılıysa otomatik giriş yap
        await login(form.email, form.password);
        navigate("/");
    };

    return (
        <div className="flex-center" style={{ minHeight: "100vh", background: "var(--bg)" }}>
            <div className="card" style={{ width: "100%", maxWidth: 420, padding: "2.5rem" }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🌿</div>
                    <h1
                        style={{ fontFamily: "var(--font-head)", fontSize: "1.8rem", color: "var(--text)" }}
                    >
                        Hesap Oluştur
                    </h1>
                    <p style={{ color: "var(--text-3)", fontSize: "0.88rem", marginTop: "0.4rem" }}>
                        Toprak Ana'ya hoş geldiniz
                    </p>
                </div>

                {errors.api && (
                    <div className="error-msg" style={{ marginBottom: "1rem" }}>{errors.api}</div>
                )}

                <form
                    onSubmit={handleSubmit}
                    noValidate
                    style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
                >
                    <div className="form-group">
                        <label className="form-label">Ad Soyad</label>
                        <input
                            {...field("name")}
                            placeholder="Örn: Ayşe Kaya"
                            style={{ width: "100%", borderColor: errors.name ? "var(--red)" : undefined }}
                            autoFocus
                        />
                        {errors.name && (
                            <span style={{ color: "var(--red)", fontSize: "0.78rem" }}>{errors.name}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">E-posta</label>
                        <input
                            {...field("email")}
                            type="email"
                            placeholder="ornek@email.com"
                            style={{ width: "100%", borderColor: errors.email ? "var(--red)" : undefined }}
                        />
                        {errors.email && (
                            <span style={{ color: "var(--red)", fontSize: "0.78rem" }}>{errors.email}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Şifre</label>
                        <input
                            {...field("password")}
                            type="password"
                            placeholder="En az 4 karakter"
                            style={{ width: "100%", borderColor: errors.password ? "var(--red)" : undefined }}
                        />
                        {errors.password && (
                            <span style={{ color: "var(--red)", fontSize: "0.78rem" }}>{errors.password}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Şifre Tekrar</label>
                        <input
                            {...field("confirm")}
                            type="password"
                            placeholder="Şifrenizi tekrar girin"
                            style={{ width: "100%", borderColor: errors.confirm ? "var(--red)" : undefined }}
                        />
                        {errors.confirm && (
                            <span style={{ color: "var(--red)", fontSize: "0.78rem" }}>{errors.confirm}</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: "100%", padding: "0.75rem", fontSize: "0.95rem" }}
                    >
                        Kayıt Ol
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
                    Zaten hesabınız var mı?{" "}
                    <Link to="/login" style={{ color: "var(--accent)" }}>
                        Giriş Yap
                    </Link>
                </p>
            </div>
        </div>
    );
}