import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ComponentePaginaComparadorTextosDuasVersoesDiffbrothers } from "./componente_pagina_comparador_textos_duas_versoes_diffbrothers.tsx";
import "./estilos_pagina_comparador_textos_duas_versoes_diffbrothers.css";

const elementoRaiz = document.getElementById("root");
if (!elementoRaiz) {
  throw new Error("Elemento #root ausente");
}

createRoot(elementoRaiz).render(
  <StrictMode>
    <ComponentePaginaComparadorTextosDuasVersoesDiffbrothers />
  </StrictMode>,
);
