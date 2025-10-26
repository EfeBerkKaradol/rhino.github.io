import React, { useRef, useState } from "react";

export default function App() {
  const viewerRef = useRef(null);
  const [width, setWidth] = useState(450);
  const [height, setHeight] = useState(300);
  const [color, setColor] = useState("#9aa7ff");

  const applyParams = () => {
    alert("Parametreler kaydedildi (görüntüleyici bağlanınca güncellenecek).");
  };

  return (
    <div className="page">
      {/* HEADER */}
      <header className="header">
        <div className="brand">
          <div className="logo" aria-hidden />
          <span className="brand-name">Parametrik Ürün POC</span>
        </div>
        <nav className="nav">
          <a href="#urun">Ürün</a>
          <a href="#hakkinda">Hakkında</a>
          <a href="#iletisim">İletişim</a>
        </nav>
      </header>

      {/* HERO */}
      <section className="hero">
        <div>
          <h1>Web Üzerinde Parametrik Ürün Önizleme</h1>
        </div>
        <div className="hero-badge">POC</div>
      </section>

      {/* MAIN */}
      <main className="main">
        {/* Viewer */}
        <section className="card view">
          <div className="view-toolbar">
            <button className="btn" disabled>
              İndir Görsel
            </button>
            <button className="btn" disabled>
              Döndür
            </button>
            <button className="btn" disabled>
              Sıfırla
            </button>
          </div>
          <div className="viewer" ref={viewerRef}>
            <div className="viewer-placeholder">
              <div className="dot" />
              <p>
                3D görüntü burada görünecek.
                <br />
                <small>(Görüntüleyici bağlanınca yüklenecek)</small>
              </p>
            </div>
          </div>
        </section>

        {/* Panel */}
        <aside className="card panel">
          <h3>Parametreler</h3>

          <div className="form-row">
            <label htmlFor="w">Genişlik (mm)</label>
            <input
              id="w"
              type="range"
              min={200}
              max={800}
              step={5}
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value, 10))}
            />
            <div className="hint">{width} mm</div>
          </div>

          <div className="form-row">
            <label htmlFor="h">Yükseklik (mm)</label>
            <input
              id="h"
              type="range"
              min={100}
              max={600}
              step={5}
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value, 10))}
            />
            <div className="hint">{height} mm</div>
          </div>

          <div className="form-row">
            <label htmlFor="c">Renk</label>
            <input
              id="c"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: 56, height: 32, padding: 0, border: "none" }}
            />
            <div className="hint">{color}</div>
          </div>

          <div className="panel-actions">
            <button className="btn primary" onClick={applyParams}>
              Uygula
            </button>
            <button className="btn ghost" disabled>
              Varsayılan
            </button>
          </div>
        </aside>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div>©2025 — Arayüz POC</div>
        <div className="footer-links">
          <a href="#kvkk">KVKK</a>
          <span>•</span>
          <a href="#sozlesme">Mesafeli Satış</a>
          <span>•</span>
          <a href="#iade">İade/Değişim</a>
        </div>
      </footer>
    </div>
  );
}
