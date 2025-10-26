// src/products.js
const PRODUCTS = [
  {
    id: "panel-v1",
    name: "Panel V1",
    params: [
      {
        id: "panelWidth",
        label: "Panel Width",
        type: "number",
        min: 10,
        max: 1000,
        step: 1,
        default: 200,
        unit: "mm",
      },
      {
        id: "panelHeight",
        label: "Panel Height",
        type: "number",
        min: 10,
        max: 1000,
        step: 1,
        default: 430,
        unit: "mm",
      },
      {
        id: "cellSize",
        label: "Cell Size",
        type: "number",
        min: 1,
        max: 50,
        step: 0.01,
        default: 14.78,
      },
      {
        id: "thickness",
        label: "Thickness",
        type: "number",
        min: 1,
        max: 100,
        step: 1,
        default: 10,
      },
      { id: "color", label: "Color", type: "color", default: "#00c8a3" },
    ],
  },
  {
    id: "lamp-v1",
    name: "Lamp V1",
    params: [
      {
        id: "radius",
        label: "Radius",
        type: "number",
        min: 50,
        max: 300,
        step: 1,
        default: 120,
        unit: "mm",
      },
      {
        id: "height",
        label: "Height",
        type: "number",
        min: 80,
        max: 600,
        step: 5,
        default: 300,
        unit: "mm",
      },
      {
        id: "shade",
        label: "Shade",
        type: "select",
        options: [
          { value: "linen", label: "Linen" },
          { value: "cotton", label: "Cotton" },
          { value: "paper", label: "Paper" },
        ],
        default: "linen",
      },
      { id: "color", label: "Color", type: "color", default: "#f0b300" },
    ],
  },
];

export default PRODUCTS;
