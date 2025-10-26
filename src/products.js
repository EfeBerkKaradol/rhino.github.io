// src/products.js
// Not: Buradaki ticket ve modelViewUrl build sırasında GitHub Actions Secrets'tan gelir.
// Lokal geliştirirken .env.local dosyandan okunur.

const PRODUCTS = [
  {
    id: "panel-v1",
    name: "Panel V1 (ShapeDiver)",
    modelViewUrl: import.meta.env.VITE_SD_MODEL_VIEW_URL,
    ticket: import.meta.env.VITE_SD_TICKET,
    params: [
      // Aşağıdaki ID'ler ShapeDiver'daki gerçek GUID'lerdir:
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
      // Renk parametren varsa buraya:
      // { id: "RENK_GUID", label: "Color", type: "color", default: "#00c8a3" }
    ],
  },
];

export default PRODUCTS;
