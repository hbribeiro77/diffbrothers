# Repositório Diffbrothers

Comparador de duas versões de um texto, com documento final montado trecho a trecho. Roda no navegador.

## Remoto

https://github.com/hbribeiro77/diffbrothers.git

## Rodar

Na pasta do projeto, com Node.js instalado:

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 5184
```

Abra `http://127.0.0.1:5184`. A porta 5184 evita a 5173, que é o painel do Localmanager.

No Localmanager o app já está no manifesto, com o mesmo comando e a mesma porta. Ele não sobe sozinho.

## Container na VPS

O app é estático. A imagem compila o Vite e o Nginx entrega os arquivos. Não há banco nem variável secreta.

### EasyPanel

Igual ao Hubsia e ao YouTube Playlist: Dockerfile na raiz, porta lida de `PORT`, health em `GET /health`.

| Campo | Valor |
|-------|-------|
| Fonte | GitHub → `hbribeiro77/diffbrothers` |
| Build | Dockerfile na raiz |
| Porta interna | `80` |
| Health check | HTTP `GET /health` |
| Domínio | o subdomínio gerado pelo painel |

Se o painel injetar outra `PORT`, o Nginx escuta nela. A porta interna do painel tem de ser a mesma.

### Docker Compose

Na pasta do projeto:

```powershell
docker compose up -d --build
```

O container escuta na 80 e a máquina publica em `5184`. Abra `http://IP-DA-VPS:5184`. Para mudar a porta publicada, troque só o número da esquerda em `docker-compose.yml` (`"OUTRA:80"`).

## Testes

```powershell
npm test
```
