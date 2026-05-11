// Chatbot widget — talks directly to the existing /chat endpoint (multi-agent orchestration).
import { useState, useRef, useEffect } from "react";
import { sendChat } from "../api/services";

interface Message { role: "user" | "bot"; text: string; }

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Message[]>([
    { role: "bot", text: "Merhaba! 🌿 Ürünler, stok durumu veya siparişleriniz hakkında yardımcı olabilirim." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const { reply } = await sendChat(text);
      setMsgs((m) => [...m, { role: "bot", text: reply }]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen((o) => !o)} title="Asistan">
        {open ? "✕" : "💬"}
      </button>
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <span className="chat-header-title">🌿 Toprak Ana Asistanı</span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "var(--text-2)", fontSize: "1rem", cursor: "pointer" }}
            >✕</button>
          </div>
          <div className="chat-messages">
            {msgs.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role}`} style={{ whiteSpace: "pre-wrap" }}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="chat-bubble bot" style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                <span className="loading-spinner" style={{ width: 14, height: 14 }} />
                <span style={{ fontSize: "0.8rem", color: "var(--text-3)" }}>Yazıyor…</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="chat-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Mesajınızı yazın…"
            />
            <button className="chat-send-btn" onClick={send} disabled={loading}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
