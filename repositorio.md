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

## Testes

```powershell
npm test
```
