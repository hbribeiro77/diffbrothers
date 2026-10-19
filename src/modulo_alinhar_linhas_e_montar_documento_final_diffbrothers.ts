import { diffLines } from "diff";

export type DecisaoBlocoDiferencaDiffbrothers =
  | { tipo: "manter_a" }
  | { tipo: "usar_b" }
  | { tipo: "juntar" }
  | { tipo: "remover" }
  | { tipo: "escrever"; texto: string };

export type BlocoIgualComparacaoLinhasDiffbrothers = {
  id: string;
  tipo: "igual";
  linhas: string[];
};

export type BlocoDiferencaComparacaoLinhasDiffbrothers = {
  id: string;
  tipo: "diferenca";
  linhasA: string[];
  linhasB: string[];
  decisao: DecisaoBlocoDiferencaDiffbrothers;
};

export type BlocoComparacaoLinhasDiffbrothers =
  | BlocoIgualComparacaoLinhasDiffbrothers
  | BlocoDiferencaComparacaoLinhasDiffbrothers;

export type ResumoComparacaoLinhasDiffbrothers = {
  linhasIguais: number;
  linhasSoEmA: number;
  linhasSoEmB: number;
  semDiferencas: boolean;
};

export function camposEstaoVaziosParaComparacaoDiffbrothers(textoA: string, textoB: string): boolean {
  return textoA.trim() === "" && textoB.trim() === "";
}

function normalizarQuebrasDeLinhaDiffbrothers(texto: string): string {
  return texto.replace(/\r\n/g, "\n");
}

function linhasDeParteDoDiffDiffbrothers(valor: string): string[] {
  if (valor === "") return [];
  const brutas = valor.split("\n");
  if (brutas.length > 0 && brutas[brutas.length - 1] === "") brutas.pop();
  return brutas;
}

export function alinharTextosEmBlocosDeLinhaDiffbrothers(
  textoA: string,
  textoB: string,
): BlocoComparacaoLinhasDiffbrothers[] {
  const normalizadoA = normalizarQuebrasDeLinhaDiffbrothers(textoA);
  const normalizadoB = normalizarQuebrasDeLinhaDiffbrothers(textoB);
  if (normalizadoA === "" && normalizadoB === "") return [];

  const partes = diffLines(normalizadoA, normalizadoB);
  const blocos: BlocoComparacaoLinhasDiffbrothers[] = [];

  for (let indice = 0; indice < partes.length; indice += 1) {
    const parte = partes[indice];
    if (!parte) continue;

    if (parte.removed) {
      const proxima = partes[indice + 1];
      const linhasB = proxima?.added ? linhasDeParteDoDiffDiffbrothers(proxima.value) : [];
      blocos.push({
        id: `bloco-${blocos.length}`,
        tipo: "diferenca",
        linhasA: linhasDeParteDoDiffDiffbrothers(parte.value),
        linhasB,
        decisao: { tipo: "manter_a" },
      });
      if (proxima?.added) indice += 1;
      continue;
    }

    if (parte.added) {
      blocos.push({
        id: `bloco-${blocos.length}`,
        tipo: "diferenca",
        linhasA: [],
        linhasB: linhasDeParteDoDiffDiffbrothers(parte.value),
        decisao: { tipo: "manter_a" },
      });
      continue;
    }

    const linhas = linhasDeParteDoDiffDiffbrothers(parte.value);
    if (linhas.length === 0) continue;
    blocos.push({
      id: `bloco-${blocos.length}`,
      tipo: "igual",
      linhas,
    });
  }

  return blocos;
}

export function resumirComparacaoDeLinhasDiffbrothers(
  blocos: BlocoComparacaoLinhasDiffbrothers[],
): ResumoComparacaoLinhasDiffbrothers {
  let linhasIguais = 0;
  let linhasSoEmA = 0;
  let linhasSoEmB = 0;
  for (const bloco of blocos) {
    if (bloco.tipo === "igual") {
      linhasIguais += bloco.linhas.length;
    } else {
      linhasSoEmA += bloco.linhasA.length;
      linhasSoEmB += bloco.linhasB.length;
    }
  }
  return {
    linhasIguais,
    linhasSoEmA,
    linhasSoEmB,
    semDiferencas: linhasSoEmA === 0 && linhasSoEmB === 0,
  };
}

export type OrigemTrechoDocumentoFinalDiffbrothers = "igual" | "a" | "b" | "escrito";

export type TrechoDocumentoFinalComOrigemDiffbrothers = {
  idBloco: string;
  origem: OrigemTrechoDocumentoFinalDiffbrothers;
  texto: string;
};

export function listarTrechosDoDocumentoFinalComOrigemDiffbrothers(
  blocos: BlocoComparacaoLinhasDiffbrothers[],
): TrechoDocumentoFinalComOrigemDiffbrothers[] {
  const trechos: TrechoDocumentoFinalComOrigemDiffbrothers[] = [];
  for (const bloco of blocos) {
    if (bloco.tipo === "igual") {
      trechos.push({ idBloco: bloco.id, origem: "igual", texto: bloco.linhas.join("\n") });
      continue;
    }
    const decisao = bloco.decisao;
    if (decisao.tipo === "remover") continue;
    if (decisao.tipo === "manter_a") {
      if (bloco.linhasA.length > 0) {
        trechos.push({ idBloco: bloco.id, origem: "a", texto: bloco.linhasA.join("\n") });
      }
      continue;
    }
    if (decisao.tipo === "usar_b") {
      if (bloco.linhasB.length > 0) {
        trechos.push({ idBloco: bloco.id, origem: "b", texto: bloco.linhasB.join("\n") });
      }
      continue;
    }
    if (decisao.tipo === "juntar") {
      if (bloco.linhasA.length > 0) {
        trechos.push({ idBloco: bloco.id, origem: "a", texto: bloco.linhasA.join("\n") });
      }
      if (bloco.linhasB.length > 0) {
        trechos.push({ idBloco: bloco.id, origem: "b", texto: bloco.linhasB.join("\n") });
      }
      continue;
    }
    if (decisao.texto !== "") trechos.push({ idBloco: bloco.id, origem: "escrito", texto: decisao.texto });
  }
  return trechos;
}

export function montarDocumentoFinalAPartirDosBlocosDiffbrothers(
  blocos: BlocoComparacaoLinhasDiffbrothers[],
): string {
  return listarTrechosDoDocumentoFinalComOrigemDiffbrothers(blocos)
    .map((trecho) => trecho.texto)
    .join("\n");
}

export function aplicarDecisaoNoBlocoDeDiferencaDiffbrothers(
  blocos: BlocoComparacaoLinhasDiffbrothers[],
  idBloco: string,
  decisao: DecisaoBlocoDiferencaDiffbrothers,
): BlocoComparacaoLinhasDiffbrothers[] {
  return blocos.map((bloco) => {
    if (bloco.tipo !== "diferenca" || bloco.id !== idBloco) return bloco;
    return { ...bloco, decisao };
  });
}

export function existeDecisaoDiferenteDeManterTextoADiffbrothers(
  blocos: BlocoComparacaoLinhasDiffbrothers[],
): boolean {
  return blocos.some((bloco) => bloco.tipo === "diferenca" && bloco.decisao.tipo !== "manter_a");
}
