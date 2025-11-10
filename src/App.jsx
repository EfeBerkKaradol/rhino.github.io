import React, { useEffect, useMemo, useRef, useState } from "react";
import { createViewport, createSession } from "@shapediver/viewer";
import PRODUCTS from "./products";
import ARViewer from "./ARViewer";
import ExportSystem from "./ExportSystem";

// Ortak input renderer (number/boolean/string/color)
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
  if (def.type === "boolean") {
    return (
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="hint">{value ? "On" : "Off"}</span>
      </label>
    );
  }
  if (def.type === "string") {
    return (
      <>
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          style={{
            background: "#1f2430",
            color: "white",
            border: "1px solid #2f3546",
            padding: "6px 10px",
            borderRadius: 8,
          }}
        />
        <div className="hint">{String(value ?? "")}</div>
      </>
    );
  }
  // number: range varsa slider; yoksa number input
  const isRange = def.min !== undefined && def.max !== undefined;
  return (
    <>
      {isRange ? (
        <input
          type="range"
          min={def.min}
          max={def.max}
          step={def.step ?? 1}
          value={Number(value)}
          onChange={(e) =>
            onChange(
              def.step && def.step < 1
                ? parseFloat(e.target.value)
                : parseInt(e.target.value, 10)
            )
          }
        />
      ) : (
        <input
          type="number"
          value={Number(value)}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            background: "#1f2430",
            color: "white",
            border: "1px solid #2f3546",
            padding: "6px 10px",
            borderRadius: 8,
            width: 120,
          }}
        />
      )}
      <div className="hint">
        {String(value)} {def.unit ?? ""}
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

  // AR ve Export state'leri
  const [arActive, setArActive] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Ekranda gösterilecek parametre şeması (statik ya da auto çıkarılmış)
  const [paramDefs, setParamDefs] = useState([]);
  // Parametre değerleri: { [paramId]: value }
  const [values, setValues] = useState({});

  // 1) Viewport'u bir kez kur
  useEffect(() => {
    (async () => {
      if (!canvasRef.current || viewportReady) return;
      await createViewport({ id: "myViewport", canvas: canvasRef.current });
      setViewportReady(true);
    })();
  }, [viewportReady]);

  // 2) Ürün değişince yeni session aç + parametre şemasını hazırla
  useEffect(() => {
    if (!viewportReady || !product) return;

    (async () => {
      try {
        if (session && typeof session.close === "function") {
          try {
            await session.close();
          } catch {}
        }

        const ticket = (product.ticket ?? "").trim().replace(/[\r\n]/g, "");
        const modelViewUrl = (product.modelViewUrl ?? "").trim();
        if (!ticket || !modelViewUrl) {
          setStatus(`'${product.name}' için ticket veya modelViewUrl eksik.`);
          return;
        }

        const s = await createSession({
          id: `session-${product.id}`,
          ticket,
          modelViewUrl,
        });
        setSession(s);

        // Tanısal amaçlı liste
        const keys = Object.keys(s.parameters || {});
        setParamKeys(keys);

        // === Parametre şeması ===
        if (product.paramSource === "static" && Array.isArray(product.params)) {
          // 1. ürün gibi: statik
          setParamDefs(product.params);
          const init = {};
          for (const p of product.params) {
            init[p.id] = p.default ?? (p.type === "color" ? "#9aa7ff" : 0);
          }
          setValues(init);
        } else {
          // AUTO: session.parameters'tan üret
          const defs = keys.map((id) => {
            const h = s.parameters[id];
            const v = h?.value;

            // Tür çıkarımı
            let type =
              typeof v === "number"
                ? "number"
                : typeof v === "boolean"
                ? "boolean"
                : typeof v === "string" &&
                  /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)
                ? "color"
                : "string";

            // Range bilgisi varsa kullan (yoksa number input olur)
            const min = h?.min ?? undefined;
            const max = h?.max ?? undefined;
            const step = h?.step ?? (typeof v === "number" ? 1 : undefined);

            return {
              id,
              label: h?.name || id,
              type,
              min,
              max,
              step,
              default: v,
            };
          });

          setParamDefs(defs);
          const init = {};
          for (const d of defs) init[d.id] = d.default;
          setValues(init);
        }

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
    const updated = [],
      missing = [];

    for (const def of paramDefs) {
      const handle = session.parameters?.[def.id];
      const v = values[def.id];
      if (!handle) {
        missing.push(def.label || def.id);
        continue;
      }
      handle.value = v;
      updated.push(def.label || def.id);
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
          <a href="#ar">AR Görünüm</a>
          <a href="#export">Dışa Aktar</a>
          <a href="#hakkinda">Hakkında</a>
          <a href="#iletisim">İletişim</a>
        </nav>
      </header>

      {/* HERO */}
      <section className="hero">
        <div>
          <h1>Web Üzerinde Parametrik Ürün Önizleme</h1>
          <p>
            Ürün seç → parametreleri düzenle → <b>Uygula</b> → AR'da görüntüle →
            Dışa aktar. (Her ürün kendi şemasını getirir.)
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
              <button
                className="btn"
                onClick={() => setArActive(true)}
                disabled={!session}
                title="Artırılmış gerçeklik modunu başlat"
              >
                📱 AR Görünüm
              </button>
              <button
                className="btn"
                onClick={() => setShowExport(!showExport)}
                disabled={!paramDefs.length}
                title="Parametreleri dışa aktar"
              >
                💾 Dışa Aktar
              </button>
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

          {/* Export Sistemi */}
          {showExport && (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                background: "#1a1d25",
                borderRadius: 8,
              }}
            >
              <ExportSystem
                session={session}
                currentParams={values}
                paramDefs={paramDefs}
                productName={product?.name || "Ürün"}
              />
            </div>
          )}
        </section>

        {/* Parametre Paneli */}
        <aside className="card panel">
          <h3>Parametreler</h3>

          {paramDefs.map((def) => (
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
            <button
              className="btn ghost"
              onClick={() => {
                const reset = {};
                for (const d of paramDefs)
                  reset[d.id] =
                    d.default ?? (d.type === "color" ? "#9aa7ff" : 0);
                setValues(reset);
              }}
            >
              Varsayılan
            </button>
          </div>

          <hr className="divider" />
          <details>
            <summary>Modelde bulunan parametre ID'leri</summary>
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

      {/* AR Viewer Overlay */}
      <ARViewer
        session={session}
        isActive={arActive}
        onClose={() => setArActive(false)}
        currentParams={values}
        productName={product?.name || "Ürün"}
      />
    </div>
  );
}
