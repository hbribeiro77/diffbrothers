import { describe, expect, it } from "vitest";
import {
  alinharTextosEmBlocosDeLinhaDiffbrothers,
  aplicarDecisaoNoBlocoDeDiferencaDiffbrothers,
  camposEstaoVaziosParaComparacaoDiffbrothers,
  existeDecisaoDiferenteDeManterTextoADiffbrothers,
  listarTrechosDoDocumentoFinalComOrigemDiffbrothers,
  montarDocumentoFinalAPartirDosBlocosDiffbrothers,
  resumirComparacaoDeLinhasDiffbrothers,
} from "./modulo_alinhar_linhas_e_montar_documento_final_diffbrothers.ts";

describe("campos vazios", () => {
  it("considera vazios dois textos só com espaço ou quebra", () => {
    expect(camposEstaoVaziosParaComparacaoDiffbrothers("  \n", "\t")).toBe(true);
  });

  it("aceita comparar quando só um lado tem texto", () => {
    expect(camposEstaoVaziosParaComparacaoDiffbrothers("linha", "  ")).toBe(false);
  });
});

describe("alinhar textos em blocos de linha", () => {
  it("trata textos iguais como um único trecho igual", () => {
    const blocos = alinharTextosEmBlocosDeLinhaDiffbrothers("um\ndois", "um\ndois");
    expect(blocos).toEqual([{ id: "bloco-0", tipo: "igual", linhas: ["um", "dois"] }]);
    expect(resumirComparacaoDeLinhasDiffbrothers(blocos)).toEqual({
      linhasIguais: 2,
      linhasSoEmA: 0,
      linhasSoEmB: 0,
      semDiferencas: true,
    });
    expect(montarDocumentoFinalAPartirDosBlocosDiffbrothers(blocos)).toBe("um\ndois");
  });

  it("normaliza quebra de linha do Windows antes de comparar", () => {
    const blocos = alinharTextosEmBlocosDeLinhaDiffbrothers("um\r\ndois", "um\ndois");
    expect(blocos).toEqual([{ id: "bloco-0", tipo: "igual", linhas: ["um", "dois"] }]);
  });

  it("quando só o texto A tem conteúdo, a diferença começa mantendo A", () => {
    const blocos = alinharTextosEmBlocosDeLinhaDiffbrothers("um\ndois", "");
    expect(blocos).toEqual([
      {
        id: "bloco-0",
        tipo: "diferenca",
        linhasA: ["um", "dois"],
        linhasB: [],
        decisao: { tipo: "manter_a" },
      },
    ]);
    expect(montarDocumentoFinalAPartirDosBlocosDiffbrothers(blocos)).toBe("um\ndois");
    expect(resumirComparacaoDeLinhasDiffbrothers(blocos).linhasSoEmA).toBe(2);
  });

  it("quando só o texto B tem conteúdo, manter A deixa o documento vazio", () => {
    const blocos = alinharTextosEmBlocosDeLinhaDiffbrothers("", "nova");
    expect(blocos[0]).toMatchObject({
      tipo: "diferenca",
      linhasA: [],
      linhasB: ["nova"],
      decisao: { tipo: "manter_a" },
    });
    expect(montarDocumentoFinalAPartirDosBlocosDiffbrothers(blocos)).toBe("");
  });

  it("agrupa linhas trocadas em sequência num único bloco entre trechos iguais", () => {
    const blocos = alinharTextosEmBlocosDeLinhaDiffbrothers(
      "um\ndois\ntres\nquatro",
      "um\nDOIS\nTRES\nquatro",
    );
    expect(blocos).toEqual([
      { id: "bloco-0", tipo: "igual", linhas: ["um"] },
      {
        id: "bloco-1",
        tipo: "diferenca",
        linhasA: ["dois", "tres"],
        linhasB: ["DOIS", "TRES"],
        decisao: { tipo: "manter_a" },
      },
      { id: "bloco-2", tipo: "igual", linhas: ["quatro"] },
    ]);
    expect(resumirComparacaoDeLinhasDiffbrothers(blocos)).toEqual({
      linhasIguais: 2,
      linhasSoEmA: 2,
      linhasSoEmB: 2,
      semDiferencas: false,
    });
  });

  it("preserva linha em branco no meio do trecho igual", () => {
    const blocos = alinharTextosEmBlocosDeLinhaDiffbrothers("um\n\ndois", "um\n\ndois");
    expect(montarDocumentoFinalAPartirDosBlocosDiffbrothers(blocos)).toBe("um\n\ndois");
  });
});

describe("decisões do documento final", () => {
  const base = () =>
    alinharTextosEmBlocosDeLinhaDiffbrothers("um\ndois\ntres", "um\nDOIS\ntres");

  it("usar B troca só o bloco de diferença", () => {
    const blocos = aplicarDecisaoNoBlocoDeDiferencaDiffbrothers(base(), "bloco-1", { tipo: "usar_b" });
    expect(montarDocumentoFinalAPartirDosBlocosDiffbrothers(blocos)).toBe("um\nDOIS\ntres");
    expect(existeDecisaoDiferenteDeManterTextoADiffbrothers(base())).toBe(false);
    expect(existeDecisaoDiferenteDeManterTextoADiffbrothers(blocos)).toBe(true);
  });

  it("juntar coloca as linhas de A e depois as de B", () => {
    const blocos = aplicarDecisaoNoBlocoDeDiferencaDiffbrothers(base(), "bloco-1", { tipo: "juntar" });
    expect(montarDocumentoFinalAPartirDosBlocosDiffbrothers(blocos)).toBe("um\ndois\nDOIS\ntres");
  });

  it("remover omite o bloco e mantém o resto", () => {
    const blocos = aplicarDecisaoNoBlocoDeDiferencaDiffbrothers(base(), "bloco-1", { tipo: "remover" });
    expect(montarDocumentoFinalAPartirDosBlocosDiffbrothers(blocos)).toBe("um\ntres");
  });

  it("escrever substitui o bloco pelo texto da pessoa", () => {
    const blocos = aplicarDecisaoNoBlocoDeDiferencaDiffbrothers(base(), "bloco-1", {
      tipo: "escrever",
      texto: "linha nova\noutra",
    });
    expect(montarDocumentoFinalAPartirDosBlocosDiffbrothers(blocos)).toBe("um\nlinha nova\noutra\ntres");
  });

  it("escrever vazio omite o bloco", () => {
    const blocos = aplicarDecisaoNoBlocoDeDiferencaDiffbrothers(base(), "bloco-1", {
      tipo: "escrever",
      texto: "",
    });
    expect(montarDocumentoFinalAPartirDosBlocosDiffbrothers(blocos)).toBe("um\ntres");
  });

  it("não altera bloco igual nem o array original", () => {
    const original = base();
    const blocos = aplicarDecisaoNoBlocoDeDiferencaDiffbrothers(original, "bloco-0", { tipo: "remover" });
    expect(blocos[0]).toEqual(original[0]);
    expect(original[1]).toMatchObject({ decisao: { tipo: "manter_a" } });
  });

  it("marca a origem de cada trecho e o texto copiado continua o mesmo", () => {
    const base = alinharTextosEmBlocosDeLinhaDiffbrothers("um\ndois\ntres", "um\nDOIS\ntres");
    expect(listarTrechosDoDocumentoFinalComOrigemDiffbrothers(base)).toEqual([
      { idBloco: "bloco-0", origem: "igual", texto: "um" },
      { idBloco: "bloco-1", origem: "a", texto: "dois" },
      { idBloco: "bloco-2", origem: "igual", texto: "tres" },
    ]);

    const junto = aplicarDecisaoNoBlocoDeDiferencaDiffbrothers(base, "bloco-1", { tipo: "juntar" });
    expect(listarTrechosDoDocumentoFinalComOrigemDiffbrothers(junto)).toEqual([
      { idBloco: "bloco-0", origem: "igual", texto: "um" },
      { idBloco: "bloco-1", origem: "a", texto: "dois" },
      { idBloco: "bloco-1", origem: "b", texto: "DOIS" },
      { idBloco: "bloco-2", origem: "igual", texto: "tres" },
    ]);

    const escrito = aplicarDecisaoNoBlocoDeDiferencaDiffbrothers(base, "bloco-1", {
      tipo: "escrever",
      texto: "linha nova\noutra",
    });
    expect(listarTrechosDoDocumentoFinalComOrigemDiffbrothers(escrito)).toEqual([
      { idBloco: "bloco-0", origem: "igual", texto: "um" },
      { idBloco: "bloco-1", origem: "escrito", texto: "linha nova\noutra" },
      { idBloco: "bloco-2", origem: "igual", texto: "tres" },
    ]);

    const removido = aplicarDecisaoNoBlocoDeDiferencaDiffbrothers(base, "bloco-1", { tipo: "remover" });
    expect(listarTrechosDoDocumentoFinalComOrigemDiffbrothers(removido).map((trecho) => trecho.idBloco)).toEqual([
      "bloco-0",
      "bloco-2",
    ]);

    const usandoB = aplicarDecisaoNoBlocoDeDiferencaDiffbrothers(base, "bloco-1", { tipo: "usar_b" });
    const trechos = listarTrechosDoDocumentoFinalComOrigemDiffbrothers(usandoB);
    expect(trechos.map((trecho) => trecho.texto).join("\n")).toBe(
      montarDocumentoFinalAPartirDosBlocosDiffbrothers(usandoB),
    );
  });

  it("aceitar inserção só presente em B inclui essa linha", () => {
    const alinhado = alinharTextosEmBlocosDeLinhaDiffbrothers("um\ntres", "um\ndois\ntres");
    const blocos = aplicarDecisaoNoBlocoDeDiferencaDiffbrothers(alinhado, "bloco-1", { tipo: "usar_b" });
    expect(montarDocumentoFinalAPartirDosBlocosDiffbrothers(blocos)).toBe("um\ndois\ntres");
  });
});
