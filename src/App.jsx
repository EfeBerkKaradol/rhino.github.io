import React, { useEffect, useMemo, useRef, useState } from "react";
import { createViewport, createSession } from "@shapediver/viewer";
import PRODUCTS from "./products";

// Basit input renderer
function ParamInput({ def, value, onChange }) {
  if (def.type === "color") {
    return (
      <>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 56, height: 32, padding: 0, border: "none" }}
        />
        <div className="hint">{value}</div>
      </>
    );
  }
  // number
  return (
    <>
      <input
        type="range"
        min={def.min}
        max={def.max}
        step={def.step ?? 1}
        value={value}
        onChange={(e) =>
          onChange(
            def.step && def.step < 1
              ? parseFloat(e.target.value)
              : parseInt(e.target.value, 10)
          )
        }
      />
      <div className="hint">
        {value} {def.unit ?? ""}
      </div>
    </>
  );
}

export default function App() {
  const canvasRef = useRef(null);
  const [viewportReady, setViewportReady] = useState(false);

  const [selectedId, setSelectedId] = useState(PRODUCTS[0]?.id ?? "");
  const product = useMemo(
    () => PRODUCTS.find((p) => p.id === selectedId),
    [selectedId]
  );

  const [session, setSession] = useState(null);
  const [paramKeys, setParamKeys] = useState([]);
  const [status, setStatus] = useState("");

  // Parametre değerleri: { [paramId]: value }
  const [values, setValues] = useState({});

  // 1) Viewport’u bir kez kur
  useEffect(() => {
    (async () => {
      if (!canvasRef.current || viewportReady) return;
      await createViewport({ id: "myViewport", canvas: canvasRef.current });
      setViewportReady(true);
    })();
  }, [viewportReady]);

  // 2) Ürün değişince yeni session aç + varsayılan değerleri yükle
  useEffect(() => {
    if (!viewportReady || !product) return;

    (async () => {
      try {
        // Eski session'ı kapat
        if (session && typeof session.close === "function") {
          try {
            await session.close();
          } catch {}
        }

        // >>> BURASI ÖNEMLİ: env değerlerini trim’le
        const ticket = (product.ticket ?? "").trim().replace(/[\r\n]/g, "");
        const modelViewUrl = (product.modelViewUrl ?? "").trim();

        console.log("env check", {
          ticket_len: ticket.length,
          url: modelViewUrl,
        });

        if (!ticket || !modelViewUrl) {
          alert(`'${product.name}' için ticket veya modelViewUrl eksik.`);
          return;
        }

        const s = await createSession({
          id: `session-${product.id}`,
          ticket,
          modelViewUrl,
        });
        setSession(s);

        // Parametre ID'lerini ShapeDiver'dan oku (diagnostic amaçlı)
        setParamKeys(Object.keys(s.parameters || {}));

        // Varsayılan değerler
        const initial = {};
        for (const p of product.params) {
          initial[p.id] = p.default ?? (p.type === "color" ? "#9aa7ff" : 0);
        }
        setValues(initial);
        setStatus(`'${product.name}' yüklendi.`);
      } catch (err) {
        console.error(err);
        setStatus(
          "Session oluşturulamadı. (Whitelist/ticket ayarlarını kontrol edin.)"
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, viewportReady]);

  const applyParams = async () => {
    if (!session || !product) return;

    const updated = [];
    const missing = [];

    for (const p of product.params) {
      const handle = session.parameters?.[p.id];
      const v = values[p.id];
      if (!handle) {
        missing.push(p.label || p.id);
        continue;
      }
      handle.value = v;
      updated.push(p.label || p.id);
    }

    if (updated.length > 0) {
      await session.customize();
      setStatus(
        `Güncellendi: ${updated.join(", ")}${
          missing.length ? ` • Bulunamadı: ${missing.join(", ")}` : ""
        }`
      );
    } else {
      setStatus(
        `Hiç parametre güncellenmedi. Bulunamadı: ${missing.join(", ")}`
      );
    }
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
          <p>
            Ürün seç → parametreleri düzenle → <b>Uygula</b>. (Her ürün kendi
            parametre şemasını getirir.)
          </p>
        </div>
        <div className="hero-badge">POC</div>
      </section>

      {/* MAIN */}
      <main className="main">
        {/* Viewer */}
        <section className="card view">
          <div
            className="view-toolbar"
            style={{ justifyContent: "space-between" }}
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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

            {/* Ürün seçimi */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label htmlFor="product" className="hint">
                Ürün
              </label>
              <select
                id="product"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                style={{
                  background: "#1f2430",
                  color: "white",
                  border: "1px solid #2f3546",
                  padding: "6px 10px",
                  borderRadius: 8,
                }}
              >
                {PRODUCTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="viewer">
            <canvas ref={canvasRef} id="sd-canvas" />
          </div>

          {status && (
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
              {status}
            </div>
          )}
        </section>

        {/* Parametre Paneli */}
        <aside className="card panel">
          <h3>Parametreler</h3>

          {product?.params?.map((def) => (
            <div key={def.id} className="form-row">
              <label htmlFor={def.id}>{def.label}</label>
              <ParamInput
                def={def}
                value={values[def.id]}
                onChange={(v) => setValues((s) => ({ ...s, [def.id]: v }))}
              />
            </div>
          ))}

          <div className="panel-actions">
            <button className="btn primary" onClick={applyParams}>
              Uygula
            </button>
            <button className="btn ghost" disabled>
              Varsayılan
            </button>
          </div>

          <hr className="divider" />

          <details>
            <summary>Modelde bulunan parametre ID’leri</summary>
            {paramKeys.length === 0 ? (
              <div className="hint">Henüz okunamadı.</div>
            ) : (
              <ul style={{ marginTop: 6 }}>
                {paramKeys.map((k) => (
                  <li key={k}>
                    <code>{k}</code>
                  </li>
                ))}
              </ul>
            )}
          </details>
        </aside>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div>©2025 — Arayüz POC. Tüm hakları saklıdır.</div>
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
