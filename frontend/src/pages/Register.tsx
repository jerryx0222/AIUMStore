import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await register(form);
      navigate("/");
    } catch {
      setError("註冊失敗，請確認資料是否正確");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h1>會員註冊</h1>
      {error && <p className="error">{error}</p>}
      <input
        placeholder="帳號"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        required
      />
      <input
        placeholder="電子郵件"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <input
        placeholder="密碼"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
        minLength={8}
      />
      <button type="submit">註冊</button>
    </form>
  );
}
