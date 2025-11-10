const MVU = (import.meta.env.VITE_SD_MODEL_VIEW_URL ?? "").trim();

const PRODUCTS = [
  {
    id: "panel-v1",
    name: "Panel V1 (ShapeDiver / ENV)",
    modelViewUrl: MVU,
    ticket: (import.meta.env.VITE_SD_TICKET ?? "").trim(),
    paramSource: "auto",
    arEnabled: true,
    exportFormats: ["csv", "txt", "gh", "ghx"],
  },

  {
    id: "product-2",
    name: "Ürün 2 (ShapeDiver)",
    modelViewUrl: MVU,
    ticket: (import.meta.env.VITE_SD_TICKET_2 ?? "").trim(),
    paramSource: "auto",
    arEnabled: true,
    exportFormats: ["csv", "txt", "gh", "ghx"],
  },

  {
    id: "product-3",
    name: "Ürün 3 (ShapeDiver)",
    modelViewUrl: MVU,
    ticket: (import.meta.env.VITE_SD_TICKET_3 ?? "").trim(),
    paramSource: "auto",
    arEnabled: true,
    exportFormats: ["csv", "txt", "gh", "ghx"],
  },

  {
    id: "demo-static",
    name: "Demo Ürün (Statik Parametreler)",
    modelViewUrl: MVU,
    ticket: "demo-ticket",
    paramSource: "static",
    arEnabled: true,
    exportFormats: ["csv", "txt"],
    params: [
      {
        id: "width",
        label: "Genişlik",
        type: "number",
        min: 10,
        max: 100,
        step: 1,
        default: 50,
        unit: "mm",
      },
      {
        id: "height",
        label: "Yükseklik",
        type: "number",
        min: 5,
        max: 50,
        step: 0.5,
        default: 25,
        unit: "mm",
      },
      {
        id: "color",
        label: "Renk",
        type: "color",
        default: "#7aa2ff",
      },
      {
        id: "rounded",
        label: "Köşe Yuvarlatma",
        type: "boolean",
        default: true,
      },
      {
        id: "material",
        label: "Malzeme",
        type: "string",
        default: "Alüminyum",
      },
    ],
  },
];

export default PRODUCTS;
