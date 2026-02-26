"use client"

import React, { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (username === "admin" && password === "admin") {
      // dummy success — redirect to scan page
      window.location.href = "/scan";
    } else {
      setError("Username atau password salah.");
    }
  }

  return (
    <div className="page">
      {/* shared stylesheet for auth/scan pages */}
      <link rel="stylesheet" href="/static/css/auth.css" />

      <main className="shell">

        <section className="hero" aria-label="Panel Informasi">
          <div className="hero-inner">
            <div className="hero-kicker">Selamat Datang</div>
            <h1 className="hero-title">Sistem Deteksi Stroke<br/>Berbasis Citra CT Scan</h1>
            <p className="hero-subtitle"></p>
          </div>
        </section>

        <section className="auth" aria-label="Panel Masuk">
          <div className="card">
            <div className="logo" aria-label="Logo SiDes CT">
              <img src="/static/img/logo-poltekkes.webp" alt="Logo SiDes CT" />
            </div>

            <div className="h1">SiDes CT</div>

            <p className="desc">
              Nikmati kemudahahn sistem deteksi <b>Stroke Berbasis Citra CT Scan</b> dengan <b>deep learning</b>
            </p>

            <div className="sep">Masuk dengan akun</div>

            <form className="form" onSubmit={handleSubmit} autoComplete="on">
              <div className="field">
                <label htmlFor="username">Username<span className="req">*</span></label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  required
                />
                <div className="hint">Default: <b>admin</b></div>
              </div>

              <div className="field">
                <label htmlFor="password">Password<span className="req">*</span></label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                />
                <button
                  className="pw-toggle"
                  type="button"
                  aria-label="Tampilkan/sembunyikan password"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  <svg id="eyeIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7S2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.6"/>
                  </svg>
                </button>
              </div>

              <button className="btn-primary" type="submit">Masuk</button>

              {error && <div style={{ color: "#ef4444", marginTop: 10 }}>{error}</div>}
            </form>

            <div className="footer">
              <span className="pill">Powered by <span style={{ letterSpacing: ".08em" }}>CT-AI</span></span>
            </div>
          </div>
        </section>

      </main>

      {/* styles moved to /static/css/auth.css */}
    </div>
  );
}
