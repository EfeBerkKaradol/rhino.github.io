import React, { useState } from "react";

const ExportSystem = ({ session, currentParams, paramDefs, productName }) => {
  const [exportFormat, setExportFormat] = useState("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState("");

  // CSV formatında export
  const exportToCSV = () => {
    const headers = ["Parametre", "Değer", "Tür", "Birim"];
    const rows = paramDefs.map((def) => [
      def.label || def.id,
      currentParams[def.id] || def.default || "",
      def.type,
      def.unit || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    return csvContent;
  };

  // GH/GHX formatında export (Grasshopper için)
  const exportToGrasshopper = (format) => {
    const timestamp = new Date().toISOString();
    const paramData = {};

    paramDefs.forEach((def) => {
      paramData[def.id] = {
        value: currentParams[def.id] || def.default,
        type: def.type,
        label: def.label || def.id,
        unit: def.unit || "",
      };
    });

    if (format === "gh") {
      return JSON.stringify(
        {
          product: productName,
          timestamp,
          parameters: paramData,
          format: "grasshopper-simple",
        },
        null,
        2
      );
    } else {
      const xmlData = `<?xml version="1.0" encoding="utf-8"?>
<grasshopper>
  <definition name="${productName}_params" timestamp="${timestamp}">
    <groups>
      <group name="Parametreler">
        ${Object.entries(paramData)
          .map(
            ([id, data]) => `
        <param name="${data.label}" id="${id}" type="${data.type}" value="${
              data.value
            }" unit="${data.unit || ""}" />
        `
          )
          .join("")}
      </group>
    </groups>
  </definition>
</grasshopper>`;
      return xmlData;
    }
  };

  // TXT formatında export
  const exportToTXT = () => {
    const timestamp = new Date().toLocaleString("tr-TR");
    let content = `ÜRÜN PARAMETRELERİ\n`;
    content += `===================\n\n`;
    content += `Ürün: ${productName}\n`;
    content += `Tarih: ${timestamp}\n\n`;
    content += `PARAMETRELER:\n`;
    content += `-----------\n\n`;

    paramDefs.forEach((def) => {
      const value = currentParams[def.id] || def.default || "";
      const unit = def.unit ? ` ${def.unit}` : "";
      content += `${def.label || def.id}: ${value}${unit}\n`;
      content += `  Tür: ${def.type}\n\n`;
    });

    return content;
  };

  // Dosya indirme fonksiyonu
  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export işlemini başlat
  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess("");

    try {
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      const baseFilename = `${productName}_${timestamp}`.replace(/\s+/g, "_");

      let content, filename, mimeType;

      switch (exportFormat) {
        case "csv":
          content = exportToCSV();
          filename = `${baseFilename}.csv`;
          mimeType = "text/csv;charset=utf-8;";
          break;

        case "gh":
          content = exportToGrasshopper("gh");
          filename = `${baseFilename}.gh`;
          mimeType = "application/json;charset=utf-8;";
          break;

        case "ghx":
          content = exportToGrasshopper("ghx");
          filename = `${baseFilename}.ghx`;
          mimeType = "application/xml;charset=utf-8;";
          break;

        case "txt":
          content = exportToTXT();
          filename = `${baseFilename}.txt`;
          mimeType = "text/plain;charset=utf-8;";
          break;

        default:
          throw new Error("Desteklenmeyen format");
      }

      downloadFile(content, filename, mimeType);
      setExportSuccess(`${filename} başarıyla indirildi!`);

      setTimeout(() => {
        setExportSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Export hatası:", error);
      setExportSuccess("Export işlemi başarısız!");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-system">
      <h4>Parametreleri Dışa Aktar</h4>

      <div className="export-format-selection">
        <label htmlFor="export-format">Format:</label>
        <select
          id="export-format"
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value)}
          style={{
            background: "#1f2430",
            color: "white",
            border: "1px solid #2f3546",
            padding: "6px 10px",
            borderRadius: 8,
            marginLeft: 8,
          }}
        >
          <option value="csv">CSV (Excel)</option>
          <option value="txt">TXT (Metin)</option>
          <option value="gh">GH (Grasshopper JSON)</option>
          <option value="ghx">GHX (Grasshopper XML)</option>
        </select>
      </div>

      <div className="export-description">
        {exportFormat === "csv" && (
          <p className="hint">
            Excel veya diğer tablolama programlarında açılabilen CSV formatı.
          </p>
        )}
        {exportFormat === "txt" && (
          <p className="hint">
            Basit metin formatında okunabilir parametre listesi.
          </p>
        )}
        {exportFormat === "gh" && (
          <p className="hint">
            Grasshopper için JSON formatında parametre dosyası.
          </p>
        )}
        {exportFormat === "ghx" && (
          <p className="hint">
            Grasshopper definition XML formatı (Rhino Grasshopper).
          </p>
        )}
      </div>

      <div className="export-actions">
        <button
          className="btn primary"
          onClick={handleExport}
          disabled={isExporting || !paramDefs.length}
        >
          {isExporting ? "Dışa Aktarılıyor..." : "Parametreleri İndir"}
        </button>
      </div>

      {exportSuccess && (
        <div
          className={`export-message ${
            exportSuccess.includes("başarısız") ? "error" : "success"
          }`}
        >
          {exportSuccess}
        </div>
      )}

      <div className="export-preview">
        <details>
          <summary>Önizleme ({paramDefs.length} parametre)</summary>
          <div className="preview-content">
            {paramDefs.slice(0, 5).map((def) => (
              <div key={def.id} className="preview-item">
                <strong>{def.label || def.id}:</strong>{" "}
                {currentParams[def.id] || def.default || "—"}
                {def.unit && ` ${def.unit}`}
              </div>
            ))}
            {paramDefs.length > 5 && (
              <div className="hint">
                ... ve {paramDefs.length - 5} parametre daha
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  );
};

export default ExportSystem;
