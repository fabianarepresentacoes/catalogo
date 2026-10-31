# Variações (cor / temperatura)

Gera `variacoes.json` (usado pelo site) e `variacoes.csv` (aba "Variações" da planilha, via IMPORTDATA).

- `fixnames.py`: conserta palavras quebradas nos nomes (ex.: "Pr Eto" -> "Preto").
- `group.py`: agrupa produtos da mesma parceira + categoria cujo nome e especificações são iguais
  tirando cor e temperatura. Regras conservadoras: combinação cor+temperatura repetida no grupo,
  produto sem cor/temperatura quando a dimensão varia, ou produto com várias temperaturas no mesmo
  código ficam FORA do grupo.

Entradas (caminhos fixos em /home/claude, ajustar se preciso): `p1.json` = get_values da aba Página1,
`bd.json` = linhas da aba Banco_de_Dados. Depois de rodar, gravar `variacoes.json` e `variacoes.csv`
na raiz do repositório (ver o final da conversa de 31/10/2026).
