# Comparador de duas versões e documento final

## Objetivo

Página em que a pessoa cola duas versões parecidas do mesmo texto, vê o que permaneceu e o que mudou linha a linha, e monta um terceiro documento escolhendo, em cada bloco de diferença, o que entra no resultado.

## Tela

1. Dois campos: Texto A (base) e Texto B, e o botão Comparar.
2. Os dois campos vazios (só espaço em branco) não comparam. Um lado vazio é comparação válida.
3. Depois da comparação, os campos recolhem. Dá para reabri-los com os textos intactos.
4. Resumo: linhas iguais, linhas só no texto A, linhas só no texto B. Textos iguais mostram «Sem diferenças».
5. Comparação com três modos: lado a lado, diff e só mudanças. No modo só mudanças, um trecho igual com mais de 3 linhas mostra as 3 primeiras e indica quantas foram omitidas.
6. Painel do documento final ao lado, atualizado na hora, com copiar. Se a área de transferência falhar, a pessoa copia o painel à mão.

## Regras

- Quebras de linha do Windows (`\r\n`) viram quebra normal (`\n`) antes do diff.
- Linhas iguais seguidas formam um trecho sem ação e entram no resultado.
- Linhas removidas, inseridas ou trocadas em sequência formam um bloco de diferença. A leitura é linha a linha. Uma ação vale para o bloco inteiro.
- O documento final começa igual ao texto A. A decisão inicial de cada diferença é manter A.
- Ações do bloco: manter A, usar B, juntar (linhas de A e depois as de B), remover, ou escrever outro texto no lugar do bloco.
- Trecho igual não se remove nesta versão.
- Escrever com texto vazio equivale a omitir o bloco.
- Comparar de novo, havendo alguma decisão diferente de «manter A», pede confirmação e então zera as escolhas.

## Técnica

Aplicação React com Vite e TypeScript. O diff usa a biblioteca `diff` (`diffLines`), a mesma do Transcribrothers. Não há backend: o texto fica no navegador.

Um módulo puro alinha as linhas, agrupa os blocos, aplica a decisão e monta o texto final. A tela só exibe e guarda a decisão de cada bloco.

## Fora desta versão

Login, histórico, exportar Word ou PDF, apagar linha igual, diff dentro da linha e qualquer servidor.

## Testes

Testes automatizados do módulo puro: textos iguais, só A, só B, uma linha trocada, várias linhas no mesmo bloco, juntar, remover, texto escrito pela pessoa, texto escrito vazio e quebra de linha do Windows.
