"use client"

import React, { useState, useRef } from "react";

export default function ScanPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "scanning" | "done">("idle");
  const [result, setResult] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [medicalRecord, setMedicalRecord] = useState("");
  const [patientName, setPatientName] = useState("");
  const [resultData, setResultData] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const API_URL = "https://sidesct.cloud/predict";

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    handleFileSelect(f);
  }

  function handleFileSelect(f: File | null) {
    setFile(f);
    setResult(null);
    setResultData(null);
    setStatus("idle");
    if (!f) return setPreview(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    handleFileSelect(f);
  }

  function handleDragOver(e: React.DragEvent) { e.preventDefault(); }

  function startScan() {
    if (!file || !medicalRecord || !patientName) {
      setResult("Mohon isi medical record, nama pasien, dan pilih file.");
      return;
    }
    setStatus("scanning");
    setResult(null);
    setPdfUrl(null);
    setImageUrl(null);
    setResultData(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("medical_record", medicalRecord);
    formData.append("patient_name", patientName);

    fetch(API_URL, { method: "POST", body: formData })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error((data && data.message) || `Server returned ${res.status}`);
        if (data) {
          const { confidence, image_url, pdf_file, predicted_class } = data as any;
          setResultData(data);
          setResult(`Hasil: ${predicted_class} — Confidence: ${Number(confidence).toFixed(3)}`);
          if (image_url) setImageUrl(image_url);
          if (pdf_file) {
            try {
              const u = new URL(String(pdf_file), API_URL);
              setPdfUrl(u.toString());
            } catch (e) {
              setPdfUrl(API_URL + String(pdf_file));
            }
          }
        } else {
          setResult("Respon tidak valid dari server.");
        }
      })
      .catch((err) => {
        setResult(`Gagal menghubungi server: ${err.message}`);
        setStatus("done");
      })
      .finally(() => setStatus("done"));
  }

  const handleDownloadPdf = async () => {
    try {
      if (!resultData?.pdf_file) {
        alert("File PDF tidak tersedia.");
        return;
      }
      const pdfEndpoint = `https://sidesct.cloud/download_pdf?file=${encodeURIComponent(resultData.pdf_file)}`;
      const response = await fetch(pdfEndpoint, {
        method: 'GET',
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (!response.ok) throw new Error(`Gagal mengunduh: ${response.status}`);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Hasil_CT_Scan_${patientName || 'Pasien'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error saat mengunduh PDF:", error);
      alert("Terjadi kesalahan saat mengunduh laporan PDF.");
    }
  };

  const isNormal = resultData?.predicted_class?.toLowerCase() === "normal";
  const hasValidResult = status === "done" && resultData && !result?.includes("Gagal");

  return (
    <>
      <link rel="stylesheet" href="/static/css/scan.css" />

      <div className="sp-page">
        {/* NAVBAR */}
        <nav className="sp-nav">
          <div className="sp-nav-left">
            <div className="sp-nav-logo">
              <img src="/static/img/logo-poltekkes.webp" alt="SiDes CT Logo" />
            </div>
            <div className="sp-nav-brand">
              <div className="sp-nav-title">SiDes CT</div>
              <div className="sp-nav-subtitle">Sistem Deteksi Stroke Iskemik</div>
            </div>
          </div>
          <div className="sp-nav-right">
            <div className="sp-status-dot">AI Model Aktif</div>
            <button
              onClick={() => (window.location.href = '/login')}
              className="sp-btn-logout"
            >
              <span>↩</span> Logout
            </button>
          </div>
        </nav>

        <main className="sp-main">
          {/* Page Header */}
          <div className="sp-page-header">
            <div className="sp-page-label">🧠 CT Scan Analyzer</div>
            <h1 className="sp-page-title">Analisis CT Scan Kepala</h1>
            <p className="sp-page-desc">Unggah Citra CT Scan untuk mendeteksi kemungkinan stroke iskemik menggunakan AI</p>
          </div>

          {/* Main Grid */}
          <div className={`sp-grid ${hasValidResult ? "has-result" : ""}`}>

            {/* ─── KOLOM KIRI: INPUT ─── */}
            <div className="sp-card">
              <div className="sp-card-header">
                <div className="sp-card-icon">📋</div>
                <div>
                  <h2 className="sp-card-title">Data Pasien & Citra</h2>
                  <p className="sp-card-subtitle">Isi form berikut sebelum melakukan analisis</p>
                </div>
              </div>
              <div className="sp-card-body">

                {/* Form Grid */}
                <div className="sp-form-grid">
                  <div className="sp-field">
                    <label className="sp-label">🏥 Rekam Medis</label>
                    <input
                      className="sp-input"
                      type="text"
                      value={medicalRecord}
                      onChange={(e) => setMedicalRecord(e.target.value)}
                      placeholder="Contoh: RM-123456"
                    />
                  </div>
                  <div className="sp-field">
                    <label className="sp-label">👤 Nama Pasien</label>
                    <input
                      className="sp-input"
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Nama Lengkap"
                    />
                  </div>
                </div>

                <div className="sp-divider" />

                {/* Upload / Preview */}
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  style={{ display: "none" }}
                />

                {!preview ? (
                  <div
                    className="sp-dropzone"
                    onClick={() => inputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    {/* <span className="sp-dropzone-icon">🩻</span> */}
                    <p className="sp-dropzone-title">Unggah Citra CT Scan</p>
                    <p className="sp-dropzone-hint">Seret file ke sini atau klik untuk memilih · PNG, JPG, DICOM</p>
                    <button className="sp-btn-upload" type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
                      ➕ Pilih File
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="sp-preview-wrap">
                      <img src={preview} alt="CT Scan Preview" className="sp-preview-img" />
                      {status === "scanning" && (
                        <div className="sp-scanning-overlay">
                          <div className="sp-scan-line" />
                          <div className="sp-spinner" />
                          <span className="sp-scanning-text">Menganalisis...</span>
                        </div>
                      )}
                      {status !== "scanning" && (
                        <div className="sp-preview-overlay">
                          <button
                            className="sp-preview-btn remove"
                            onClick={() => handleFileSelect(null)}
                            title="Hapus Citra"
                          >✕</button>
                        </div>
                      )}
                    </div>

                    <div className="sp-actions">
                      <button
                        className="sp-btn-primary"
                        onClick={startScan}
                        disabled={status === "scanning"}
                      >
                        {status === "scanning" ? (
                          <>⏳ Memproses Analisis...</>
                        ) : (
                          <>🔬 Mulai Analisis</>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error */}
                {result?.includes("Gagal") || (status === "done" && result && !resultData) ? (
                  <div className="sp-error">
                    <span>⚠️</span>
                    <span>{result}</span>
                  </div>
                ) : null}

                {/* Footer */}
                <div className="sp-footer">
                  <span className="sp-pill">⚡ Powered by CT-AI</span>
                  <span>·</span>
                  <span>Hanya untuk keperluan medis terautorisasi</span>
                </div>
              </div>
            </div>

            {/* ─── KOLOM KANAN: RESULT ─── */}
            {hasValidResult && (
              <div className={`sp-card sp-result-card`}>
                <div className="sp-card-header">
                  <div className="sp-card-icon">📊</div>
                  <div>
                    <h2 className="sp-card-title">Hasil Analisis AI</h2>
                    <p className="sp-card-subtitle">Diproses menggunakan model deep learning</p>
                  </div>
                </div>

                {/* Result Header Band */}
                <div className={`sp-result-header-band ${isNormal ? "normal" : "abnormal"}`}>
                  <div className="sp-result-badge">DIAGNOSIS SEMENTARA</div>
                  <p className={`sp-result-verdict ${isNormal ? "normal" : "abnormal"}`}>
                    {isNormal ? "✅ NORMAL" : "⚠️ STROKE ISKEMIKTERDETEKSI"}
                  </p>
                  <p className="sp-result-sub">
                    {isNormal
                      ? "Tidak ditemukan indikasi stroke Iskemik pada CT Scan ini"
                      : "Terdeteksi potensi abnormalitas pada CT Scan"}
                  </p>
                </div>

                <div className="sp-result-body">
                  {/* Confidence */}
                  <div>
                    <div className="sp-conf-header">
                      <span className="sp-conf-label">Tingkat Kepercayaan</span>
                      <span className={`sp-conf-value ${isNormal ? "normal" : "abnormal"}`}>
                        {(Number(resultData.confidence) * 100).toFixed(3)}%
                      </span>
                    </div>
                    <div className="sp-conf-track">
                      <div
                        className={`sp-conf-fill ${isNormal ? "normal" : "abnormal"}`}
                        style={{ width: `${Number(resultData.confidence) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="sp-info-grid">
                    <div className="sp-info-item">
                      <p className="sp-info-label">Nama Pasien</p>
                      <p className="sp-info-value">{resultData?.patient_name}</p>
                    </div>
                    <div className="sp-info-item">
                      <p className="sp-info-label">ID Rekam Medis</p>
                      <p className="sp-info-value" style={{ fontFamily: "var(--font-mono)" }}>
                        {resultData?.medical_record}
                      </p>
                    </div>
                    <div className="sp-info-item">
                      <p className="sp-info-label">Kelas Prediksi</p>
                      <p className="sp-info-value">{resultData?.predicted_class}</p>
                    </div>
                    <div className="sp-info-item">
                      <p className="sp-info-label">Waktu Analisis</p>
                      <p className="sp-info-value" style={{ fontFamily: "var(--font-mono)" }}>
                        {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="sp-ai-note">
                    <span className="sp-ai-note-icon">ℹ️</span>
                    <span>Hasil ini merupakan bantuan analisis AI dan <strong>bukan pengganti diagnosis dokter</strong>. Selalu konfirmasikan dengan tenaga medis berpengalaman.</span>
                  </div>
                </div>

                {/* Download PDF */}
                <div className="sp-result-footer">
                  <button
                    onClick={handleDownloadPdf}
                    className="sp-btn-download"
                    type="button"
                  >
                    📄 Unduh Laporan PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}