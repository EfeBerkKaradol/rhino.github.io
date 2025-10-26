// src/products.js
// Not: 1. ürün ENV’den, 2-3. ürün doğrudan ticket string’inden okunur.
// Hepsi aynı Model View URL’ini kullanıyor (EU sistemi).

const MVU = (import.meta.env.VITE_SD_MODEL_VIEW_URL ?? "").trim();

const PRODUCTS = [
  {
    id: "panel-v1",
    name: "Panel V1 (ShapeDiver / ENV)",
    modelViewUrl: MVU,
    ticket: (import.meta.env.VITE_SD_TICKET ?? "").trim(),
    // Bu üründe parametreleri statik tanımlıyoruz (GUID'ler mevcut)
    paramSource: "static",
    params: [
      {
        id: "e21fe99d-83fe-463e-8aa8-3739181ff153",
        label: "Panel Width",
        type: "number",
        min: 10,
        max: 1000,
        step: 1,
        default: 200,
      },
      {
        id: "cfe4d435-134b-459e-a0be-188e0bf8f7fa",
        label: "Panel Height",
        type: "number",
        min: 10,
        max: 1000,
        step: 1,
        default: 430,
      },
      {
        id: "ec0fb370-19be-4230-9bcd-9e665c4a7cf2",
        label: "Cell Size",
        type: "number",
        min: 1,
        max: 50,
        step: 0.01,
        default: 14.78,
      },
      {
        id: "0fc311fe-4358-43d0-8bf8-35d1a1c00120",
        label: "Thickness",
        type: "number",
        min: 1,
        max: 100,
        step: 1,
        default: 10,
      },
    ],
  },

  // === Yeni Ürün 1 (ticket senin verdiğin) ===
  {
    id: "product-2",
    name: "Ürün 2 (ShapeDiver)",
    modelViewUrl: MVU,
    ticket: (import.meta.env.VITE_SD_TICKET_2 ?? "").trim(),
    paramSource: "auto", // session.parameters'tan dinamik üret
  },

  // === Yeni Ürün 2 (ticket senin verdiğin) ===
  {
    id: "product-3",
    name: "Ürün 3 (ShapeDiver)",
    modelViewUrl: MVU,
    ticket: (import.meta.env.VITE_SD_TICKET_3 ?? "").trim(),
    paramSource: "auto",
  },
];

export default PRODUCTS;
