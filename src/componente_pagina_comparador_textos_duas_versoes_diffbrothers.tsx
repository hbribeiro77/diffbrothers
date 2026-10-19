import { useEffect, useMemo, useRef, useState } from "react";
import {
  alinharTextosEmBlocosDeLinhaDiffbrothers,
  aplicarDecisaoNoBlocoDeDiferencaDiffbrothers,
  camposEstaoVaziosParaComparacaoDiffbrothers,
  existeDecisaoDiferenteDeManterTextoADiffbrothers,
  listarTrechosDoDocumentoFinalComOrigemDiffbrothers,
  montarDocumentoFinalAPartirDosBlocosDiffbrothers,
  resumirComparacaoDeLinhasDiffbrothers,
  type BlocoComparacaoLinhasDiffbrothers,
  type DecisaoBlocoDiferencaDiffbrothers,
} from "./modulo_alinhar_linhas_e_montar_documento_final_diffbrothers.ts";

type ModoVisualizacaoComparacaoDiffbrothers = "lado_a_lado" | "diff_unificado" | "somente_alteracoes";

const MAX_LINHAS_IGUAIS_VISIVEIS_NO_MODO_SO_MUDANCAS = 3;

function rotuloContagemDiffbrothers(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

function linhasDoLadoMaisCurtoPreenchidasDiffbrothers(linhasA: string[], linhasB: string[]): Array<[string | null, string | null]> {
  const tamanho = Math.max(linhasA.length, linhasB.length, 1);
  const pares: Array<[string | null, string | null]> = [];
  for (let indice = 0; indice < tamanho; indice += 1) {
    pares.push([linhasA[indice] ?? null, linhasB[indice] ?? null]);
  }
  return pares;
}

function linhasVisiveisDeTrechoIgualDiffbrothers(
  linhas: string[],
  modo: ModoVisualizacaoComparacaoDiffbrothers,
): { visiveis: string[]; omitidas: number } {
  if (modo === "somente_alteracoes" && linhas.length > MAX_LINHAS_IGUAIS_VISIVEIS_NO_MODO_SO_MUDANCAS) {
    return {
      visiveis: linhas.slice(0, MAX_LINHAS_IGUAIS_VISIVEIS_NO_MODO_SO_MUDANCAS),
      omitidas: linhas.length - MAX_LINHAS_IGUAIS_VISIVEIS_NO_MODO_SO_MUDANCAS,
    };
  }
  return { visiveis: linhas, omitidas: 0 };
}

export function ComponentePaginaComparadorTextosDuasVersoesDiffbrothers() {
  const [textoA, setTextoA] = useState("");
  const [textoB, setTextoB] = useState("");
  const [camposRecolhidos, setCamposRecolhidos] = useState(false);
  const [blocos, setBlocos] = useState<BlocoComparacaoLinhasDiffbrothers[] | null>(null);
  const [modo, setModo] = useState<ModoVisualizacaoComparacaoDiffbrothers>("lado_a_lado");
  const [pedirConfirmacao, setPedirConfirmacao] = useState(false);
  const [avisoCopia, setAvisoCopia] = useState<string | null>(null);
  const [idDestacado, setIdDestacado] = useState<string | null>(null);
  const [tickDestaque, setTickDestaque] = useState(0);
  const [idsIguaisExpandidos, setIdsIguaisExpandidos] = useState<string[]>([]);
  const [avisoAlinhamento, setAvisoAlinhamento] = useState<string | null>(null);
  const raizRef = useRef<HTMLDivElement>(null);
  const alinhamentoPendenteRef = useRef<{ origem: "comparacao" | "documento"; idBloco: string; topo: number } | null>(
    null,
  );

  const camposVazios = camposEstaoVaziosParaComparacaoDiffbrothers(textoA, textoB);
  const resumo = useMemo(() => (blocos ? resumirComparacaoDeLinhasDiffbrothers(blocos) : null), [blocos]);
  const documentoFinal = useMemo(
    () => (blocos ? montarDocumentoFinalAPartirDosBlocosDiffbrothers(blocos) : ""),
    [blocos],
  );
  const trechosDocumento = useMemo(
    () => (blocos ? listarTrechosDoDocumentoFinalComOrigemDiffbrothers(blocos) : []),
    [blocos],
  );
  const numeroPorBloco = useMemo(() => {
    const mapa = new Map<string, number>();
    blocos?.forEach((bloco, indice) => mapa.set(bloco.id, indice + 1));
    return mapa;
  }, [blocos]);

  useEffect(() => {
    if (!idDestacado) return;
    const timer = window.setTimeout(() => setIdDestacado(null), 1600);
    return () => window.clearTimeout(timer);
  }, [idDestacado, tickDestaque]);

  useEffect(() => {
    const pedido = alinhamentoPendenteRef.current;
    if (!pedido) return;
    alinhamentoPendenteRef.current = null;
    const destino = raizRef.current?.querySelector(
      pedido.origem === "comparacao"
        ? `[data-ancora-documento="${pedido.idBloco}"]`
        : `[data-ancora-comparacao="${pedido.idBloco}"]`,
    );
    if (!(destino instanceof HTMLElement)) return;
    if (pedido.origem === "comparacao") {
      const painel = raizRef.current?.querySelector(".db-documento-texto");
      if (!(painel instanceof HTMLElement)) return;
      painel.scrollTop += destino.getBoundingClientRect().top - painel.getBoundingClientRect().top;
      return;
    }
    window.scrollBy({ top: destino.getBoundingClientRect().top - pedido.topo, behavior: "smooth" });
  }, [tickDestaque, idsIguaisExpandidos]);

  function alinharOutroPainel(origem: "comparacao" | "documento", idBloco: string) {
    const bloco = blocos?.find((item) => item.id === idBloco);
    const ficouDeFora = bloco?.tipo === "diferenca" && bloco.decisao.tipo === "remover";
    setIdDestacado(idBloco);
    setTickDestaque((valor) => valor + 1);
    if (origem === "comparacao" && ficouDeFora) {
      alinhamentoPendenteRef.current = null;
      setAvisoAlinhamento(`Trecho ${numeroPorBloco.get(idBloco) ?? ""} ficou de fora do documento final.`);
      return;
    }
    setAvisoAlinhamento(null);
    const referencia = raizRef.current?.querySelector(
      origem === "comparacao" ? `[data-ancora-comparacao="${idBloco}"]` : `[data-ancora-documento="${idBloco}"]`,
    );
    alinhamentoPendenteRef.current = {
      origem,
      idBloco,
      topo: referencia?.getBoundingClientRect().top ?? 0,
    };
    setIdsIguaisExpandidos((atual) => (atual.includes(idBloco) ? atual : [...atual, idBloco]));
  }

  function executarComparacao() {
    setBlocos(alinharTextosEmBlocosDeLinhaDiffbrothers(textoA, textoB));
    setCamposRecolhidos(true);
    setPedirConfirmacao(false);
    setAvisoCopia(null);
  }

  function pedirOuExecutarComparacao() {
    if (camposVazios) return;
    if (blocos && existeDecisaoDiferenteDeManterTextoADiffbrothers(blocos)) {
      setPedirConfirmacao(true);
      return;
    }
    executarComparacao();
  }

  function definirDecisao(idBloco: string, decisao: DecisaoBlocoDiferencaDiffbrothers) {
    setBlocos((atual) => (atual ? aplicarDecisaoNoBlocoDeDiferencaDiffbrothers(atual, idBloco, decisao) : atual));
  }

  async function copiarDocumentoFinal() {
    try {
      await navigator.clipboard.writeText(documentoFinal);
      setAvisoCopia("Texto copiado.");
    } catch {
      setAvisoCopia("Selecione o documento final e copie com Ctrl+C.");
    }
  }

  return (
    <div className="db-pagina" ref={raizRef}>
      <header className="db-cabecalho">
        <p className="db-marca">Diffbrothers</p>
        <h1>Comparar duas versões</h1>
        <p className="db-subtitulo">
          Cole o texto base e a outra versão. O documento final começa igual ao texto A; em cada diferença você escolhe o
          que fica.
        </p>
      </header>

      {camposRecolhidos ? (
        <div className="db-barra-textos-recolhidos">
          <p>Textos recolhidos. Abra de novo para alterar e comparar outra vez.</p>
          <button type="button" className="db-botao-secundario" onClick={() => setCamposRecolhidos(false)}>
            Editar textos
          </button>
        </div>
      ) : (
        <section className="db-entradas" aria-label="Textos para comparar">
          <label className="db-campo">
            <span>Texto A (base)</span>
            <textarea
              id="texto-a"
              value={textoA}
              onChange={(evento) => setTextoA(evento.target.value)}
              rows={8}
              spellCheck={false}
            />
          </label>
          <label className="db-campo">
            <span>Texto B</span>
            <textarea
              id="texto-b"
              value={textoB}
              onChange={(evento) => setTextoB(evento.target.value)}
              rows={8}
              spellCheck={false}
            />
          </label>
          <div className="db-acoes-entrada">
            <button type="button" className="db-botao-primario" disabled={camposVazios} onClick={pedirOuExecutarComparacao}>
              Comparar
            </button>
            {camposVazios ? (
                <p className="db-aviso-entrada">Informe ao menos um dos textos para comparar.</p>
              ) : null}
          </div>
        </section>
      )}

      {pedirConfirmacao ? (
        <div className="db-confirmacao" role="alertdialog" aria-labelledby="db-confirmacao-titulo">
          <p id="db-confirmacao-titulo">
            Comparar de novo descarta as escolhas já feitas no documento final.
          </p>
          <div className="db-confirmacao-acoes">
            <button type="button" className="db-botao-secundario" onClick={() => setPedirConfirmacao(false)}>
              Cancelar
            </button>
            <button type="button" className="db-botao-primario" onClick={executarComparacao}>
              Continuar
            </button>
          </div>
        </div>
      ) : null}

      {blocos && resumo ? (
        <div className="db-resultado-layout">
          <section className="db-comparacao" aria-label="Comparação">
            <div className="db-comparacao-topo">
              <p className="db-resumo" role="status">
                {resumo.semDiferencas ? <strong>Sem diferenças. </strong> : <strong>Diferenças encontradas. </strong>}
                {rotuloContagemDiffbrothers(resumo.linhasIguais, "linha igual", "linhas iguais")}
                {" · "}
                {rotuloContagemDiffbrothers(resumo.linhasSoEmA, "só no texto A", "só no texto A")}
                {" · "}
                {rotuloContagemDiffbrothers(resumo.linhasSoEmB, "só no texto B", "só no texto B")}
              </p>
              <div className="db-modos" role="tablist" aria-label="Modo de comparação">
                {(
                  [
                    ["lado_a_lado", "Lado a lado"],
                    ["diff_unificado", "Diff"],
                    ["somente_alteracoes", "Só mudanças"],
                  ] as const
                ).map(([valor, rotulo]) => (
                  <button
                    key={valor}
                    type="button"
                    role="tab"
                    aria-selected={modo === valor}
                    className={modo === valor ? "db-modo db-modo-ativo" : "db-modo"}
                    onClick={() => setModo(valor)}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
            </div>

            {modo === "lado_a_lado" ? (
              <div className="db-split-cabecalho db-cabecalho-colunas">
                <span>Texto A</span>
                <span>Texto B</span>
              </div>
            ) : null}

            {avisoAlinhamento ? (
              <p className="db-aviso-alinhamento" role="status">
                {avisoAlinhamento}
              </p>
            ) : null}
            <div className="db-blocos">
              {blocos.map((bloco) => (
                <BlocoComparacao
                  key={bloco.id}
                  bloco={bloco}
                  numero={numeroPorBloco.get(bloco.id) ?? 0}
                  modo={modo}
                  expandido={idsIguaisExpandidos.includes(bloco.id)}
                  destacado={idDestacado === bloco.id}
                  onDecidir={(decisao) => definirDecisao(bloco.id, decisao)}
                  onAlinhar={() => alinharOutroPainel("comparacao", bloco.id)}
                />
              ))}
            </div>
          </section>

          <aside className="db-documento" aria-label="Documento final">
            <div className="db-documento-topo">
              <h2>Documento final</h2>
              <button type="button" className="db-botao-primario" onClick={() => void copiarDocumentoFinal()}>
                Copiar
              </button>
            </div>
            <p className="db-documento-nota">A cor mostra de onde veio o trecho. Copiar leva o texto sem cor.</p>
            <ul className="db-legenda">
              <li>
                <span className="db-amostra db-origem-a" /> Texto A
              </li>
              <li>
                <span className="db-amostra db-origem-b" /> Texto B
              </li>
              <li>
                <span className="db-amostra db-origem-escrito" /> Escrito
              </li>
            </ul>
            {avisoCopia ? (
              <p className="db-aviso-copia" role="status">
                {avisoCopia}
              </p>
            ) : null}
            {documentoFinal.length === 0 ? <p className="db-documento-nota">Documento vazio.</p> : null}
            <div className="db-documento-texto" tabIndex={0}>
              {trechosDocumento.map((trecho, indice) => (
                <div
                  key={`${trecho.idBloco}-${indice}`}
                  role="button"
                  tabIndex={0}
                  data-ancora-documento={trecho.idBloco}
                  className={`db-trecho db-origem-${trecho.origem}${idDestacado === trecho.idBloco ? " db-trecho-destacado" : ""}`}
                  onClick={() => alinharOutroPainel("documento", trecho.idBloco)}
                  onKeyDown={(evento) => {
                    if (evento.key !== "Enter" && evento.key !== " ") return;
                    evento.preventDefault();
                    alinharOutroPainel("documento", trecho.idBloco);
                  }}
                >
                  <span className="db-numero">{numeroPorBloco.get(trecho.idBloco)}</span>
                  <pre>{trecho.texto}</pre>
                </div>
              ))}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function BlocoComparacao({
  bloco,
  numero,
  modo,
  expandido,
  destacado,
  onDecidir,
  onAlinhar,
}: {
  bloco: BlocoComparacaoLinhasDiffbrothers;
  numero: number;
  modo: ModoVisualizacaoComparacaoDiffbrothers;
  expandido: boolean;
  destacado: boolean;
  onDecidir: (decisao: DecisaoBlocoDiferencaDiffbrothers) => void;
  onAlinhar: () => void;
}) {
  const classeArtigo = `db-bloco${bloco.tipo === "igual" ? " db-bloco-igual" : " db-bloco-diferenca"}${destacado ? " db-bloco-destacado" : ""}`;
  const botaoNumero = (
    <button type="button" className="db-numero" onClick={onAlinhar} aria-label={`Trecho ${numero}. Alinhar o outro painel`}>
      {numero}
    </button>
  );

  if (bloco.tipo === "igual") {
    const { visiveis, omitidas } = linhasVisiveisDeTrechoIgualDiffbrothers(
      bloco.linhas,
      expandido ? "lado_a_lado" : modo,
    );
    return (
      <article className={classeArtigo} data-ancora-comparacao={bloco.id}>
        {botaoNumero}
        <div className="db-bloco-miolo" onClick={onAlinhar} role="presentation">
          {modo === "lado_a_lado" ? (
            <div className="db-split">
              {visiveis.map((linha, indice) => (
                <div key={indice} className="db-split-linha db-linha-igual">
                  <pre>{linha || " "}</pre>
                  <pre>{linha || " "}</pre>
                </div>
              ))}
            </div>
          ) : (
            visiveis.map((linha, indice) => (
              <div key={indice} className="db-diff-linha db-linha-igual">
                <span className="db-prefixo" aria-hidden>
                  {" "}
                </span>
                <span>{linha || " "}</span>
              </div>
            ))
          )}
          {omitidas > 0 ? <p className="db-omitidas">… {omitidas} linhas iguais omitidas …</p> : null}
        </div>
      </article>
    );
  }

  const decisao = bloco.decisao;
  const pares = linhasDoLadoMaisCurtoPreenchidasDiffbrothers(bloco.linhasA, bloco.linhasB);

  return (
    <article className={classeArtigo} data-ancora-comparacao={bloco.id}>
      {botaoNumero}
      <div className="db-bloco-miolo">
      <div className="db-decisoes" role="group" aria-label="Decisão deste bloco">
        <button type="button" aria-pressed={decisao.tipo === "manter_a"} onClick={() => onDecidir({ tipo: "manter_a" })}>
          Manter A
        </button>
        <button type="button" aria-pressed={decisao.tipo === "usar_b"} onClick={() => onDecidir({ tipo: "usar_b" })}>
          Usar B
        </button>
        <button type="button" aria-pressed={decisao.tipo === "juntar"} onClick={() => onDecidir({ tipo: "juntar" })}>
          Juntar
        </button>
        <button type="button" aria-pressed={decisao.tipo === "remover"} onClick={() => onDecidir({ tipo: "remover" })}>
          Remover
        </button>
        <button
          type="button"
          aria-pressed={decisao.tipo === "escrever"}
          onClick={() => onDecidir({ tipo: "escrever", texto: decisao.tipo === "escrever" ? decisao.texto : "" })}
        >
          Escrever
        </button>
      </div>
      {decisao.tipo === "escrever" ? (
        <label className="db-escrever">
          <span>Texto deste bloco no documento final</span>
          <textarea
            value={decisao.texto}
            rows={3}
            onChange={(evento) => onDecidir({ tipo: "escrever", texto: evento.target.value })}
          />
        </label>
      ) : null}

      {modo === "lado_a_lado" ? (
        <div className="db-split" onClick={onAlinhar} role="presentation">
          {pares.map(([esquerda, direita], indice) => (
            <div key={indice} className="db-split-linha">
              <pre className={esquerda === null ? "db-celula-vazia" : "db-origem-a"}>{esquerda ?? " "}</pre>
              <pre className={direita === null ? "db-celula-vazia" : "db-origem-b"}>{direita ?? " "}</pre>
            </div>
          ))}
        </div>
      ) : (
        <div className="db-diff-unificado" onClick={onAlinhar} role="presentation">
          {bloco.linhasA.map((linha, indice) => (
            <div key={`a-${indice}`} className="db-diff-linha db-origem-a">
              <span className="db-prefixo" aria-hidden>
                −
              </span>
              <span>{linha || " "}</span>
            </div>
          ))}
          {bloco.linhasB.map((linha, indice) => (
            <div key={`b-${indice}`} className="db-diff-linha db-origem-b">
              <span className="db-prefixo" aria-hidden>
                +
              </span>
              <span>{linha || " "}</span>
            </div>
          ))}
        </div>
      )}
      </div>
    </article>
  );
}
