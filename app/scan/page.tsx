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
  const API_URL = "https://daa8-158-140-166-68.ngrok-free.app/predict";

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    handleFileSelect(f);
  }

  function handleFileSelect(f: File | null) {
    setFile(f);
    setResult(null);
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
      setResult("Mohon isi medical record, patient name, dan pilih file.");
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
        // expected response: { confidence, image_url, medical_record, patient_name, pdf_file, predicted_class, status }
        if (data) {
          const { confidence, image_url, medical_record: mr, patient_name: pn, pdf_file, predicted_class } = data as any;
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
      })
      .finally(() => setStatus("done"));
  }

  const handleDownloadPdf = async () => {
    try {
      // Tampilkan indikator loading jika perlu (opsional)
      const pdfEndpoint = "https://daa8-158-140-166-68.ngrok-free.app/download_pdf";
      
      const response = await fetch(pdfEndpoint, {
        method: 'GET',
        headers: {
          // Header ini wajib untuk melewati halaman peringatan ngrok
          'ngrok-skip-browser-warning': 'true' 
        }
      });

      if (!response.ok) {
        throw new Error(`Gagal mengunduh: ${response.status}`);
      }

      // Ubah response menjadi bentuk Blob (file)
      const blob = await response.blob();
      
      // Buat URL sementara untuk file Blob tersebut
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Buat elemen <a> sementara untuk memicu unduhan otomatis
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Hasil_CT_Scan_${patientName || 'Pasien'}.pdf`); // Nama file yang diunduh
      document.body.appendChild(link);
      link.click();
      
      // Bersihkan elemen dan URL sementara
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error("Error saat mengunduh PDF:", error);
      alert("Terjadi kesalahan saat mengunduh laporan PDF.");
    }
  };

return (
  <div className="page">
    <link rel="stylesheet" href="/static/css/auth.css" />

    <main className="shell full-width" style={{ padding: "40px 20px" }}>
      
      {/* Container utama yang akan membagi layar menjadi 2 jika ada hasil */}
      <div className={`scan-container ${status === "done" && resultData ? "has-result" : ""}`}>
        
        
          
          {/* KOLOM KIRI: ANALISIS CT SCAN */}
          <section className="scan-card-dynamic flex-card">
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div className="h1" style={{ fontSize: 28, marginBottom: 6 }}>Analisis CT Scan</div>
              <div className="desc">Masukkan data pasien dan unggah gambar</div>
            </div>

            <div className="form">
              <div className="field">
                <label>🏥 Medical Record</label>
                <input 
                  type="text" 
                  value={medicalRecord} 
                  onChange={(e) => setMedicalRecord(e.target.value)} 
                  placeholder="Contoh: 123456" 
                />
              </div>
              <div className="field">
                <label>👤 Nama Pasien</label>
                <input 
                  type="text" 
                  value={patientName} 
                  onChange={(e) => setPatientName(e.target.value)} 
                  placeholder="Nama Lengkap" 
                />
              </div>
            </div>

            <div className="upload" style={{ marginTop: 20, flex: 1 }}>
              <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: "none" }} />
              {!preview ? (
                <button className="btn-primary" onClick={() => inputRef.current?.click()}>
                  ➕ Pilih Gambar CT Scan
                </button>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <img src={preview} alt="preview" style={{ width: "100%", borderRadius: 10, maxHeight: 300, objectFit: "contain" }} />
                  <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                    <button className="btn-primary" onClick={startScan} disabled={status === "scanning"} style={{ flex: 1 }}>
                      {status === "scanning" ? "⏳ Memproses..." : "Mulai Analisis"}
                    </button>
                    <button className="btn-secondary" onClick={() => handleFileSelect(null)} style={{padding: '12px 20px', borderRadius: '10px', border:'1px solid #ddd', background:'#fff'}}>✕</button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="footer" style={{ marginTop: 'auto', paddingTop: 20 }}>
              <span className="pill">Powered by CT-AI</span>
            </div>
          </section>

          {/* KOLOM KANAN: HASIL ANALISIS (Muncul jika ada data) */}
          {status === "done" && resultData && !result?.includes("Gagal") && (
            <section className="result-card flex-card" style={{ marginTop: 0 }}>
              <div className="result-header">
                <span className="result-badge">Hasil Analisis AI</span>
                <div className={`result-main-value ${resultData?.predicted_class === "Normal" ? "status-normal" : "status-abnormal"}`}>
                  {resultData?.predicted_class === "Normal" ? "✅ NORMAL" : "⚠️ ABNORMAL"}
                </div>
              </div>

              <div className="result-content" style={{ flex: 1 }}>
                <div className="confidence-section">
                  <div className="result-label-group">
                    <span className="result-label">Tingkat Kepercayaan</span>
                    <span className="result-data-bold">{(Number(resultData.confidence) * 100).toFixed(2)}%</span>
                  </div>
                  <div className="confidence-bar-bg">
                    <div 
                      className={`confidence-bar-fill ${resultData?.predicted_class === "Normal" ? "bg-teal" : "bg-red"}`}
                      style={{ width: `${Number(resultData.confidence) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="result-grid">
                  <div className="result-item">
                    <div className="result-label">Pasien</div>
                    <div className="result-data">{resultData?.patient_name}</div>
                  </div>
                  <div className="result-item">
                    <div className="result-label">ID Rekam Medis</div>
                    <div className="result-data">{resultData?.medical_record}</div>
                  </div>
                </div>
              </div>

              {/* URL PDF BARU */}
              <div style={{ padding: '0 20px 20px 20px' }}>
                <button 
                    onClick={handleDownloadPdf}
                    className="btn-pdf"
                    type="button"
                    style={{ 
                    margin: 0, 
                    width: '100%', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                    }}
                >
                    📄 Unduh Laporan PDF
                </button>
              </div>
            </section>
          )}
        </div>
    </main>
  </div>
);
}
