# Deploy

O artefato é **um arquivo só**, `build/server.cjs`, com tudo empacotado dentro. Não existe `node_modules` na VM, não existe `npm install` lá, não existe compilação lá.

Isso é possível porque a árvore de produção é JavaScript puro. O `@prisma/client` do Prisma 7 com driver adapter não carrega engine binário, e `pg`, `bcryptjs` e `jsonwebtoken` não têm parte nativa. Como consequência o mesmo arquivo roda em x86 e em ARM sem recompilar, o que importa para a migração futura para a A1.Flex.

## Preparar a VM, uma vez

```bash
sudo bash infra/provision.sh
```

Instala e endurece o sistema, instala o Node e cria o usuário `caixa` com `/opt/caixa`.

## Construir o artefato, na sua máquina

```bash
pnpm artifact
```

Roda o `tsc` e depois empacota com esbuild. Saída em `build/server.cjs`, por volta de 7 MB.

## Enviar

```bash
scp build/server.cjs ubuntu@146.235.32.133:/tmp/server.cjs
scp infra/caixa-api.service ubuntu@146.235.32.133:/tmp/caixa-api.service
```

## Instalar, na VM

Na primeira vez, crie o `.env`. Ele carrega as mesmas variáveis do desenvolvimento, com a string **com pooler** do Neon.

```bash
sudo install -o caixa -g caixa -m 600 /dev/null /opt/caixa/.env
sudo -u caixa tee /opt/caixa/.env > /dev/null <<'EOF'
DATABASE_URL=postgresql://...-pooler...?sslmode=require
PORT=3333
JWT_SECRET=troque-por-um-segredo-longo-de-verdade
JWT_EXPIRES_IN=1d
BCRYPT_ROUNDS=10
EOF
```

O modo `600` importa, a senha do banco está nesse arquivo. Não existe `DIRECT_URL` aqui porque a VM nunca roda migration, isso sai da sua máquina.

Depois, a cada deploy.

```bash
sudo install -o caixa -g caixa -m 640 /tmp/server.cjs /opt/caixa/server.cjs
sudo install -m 644 /tmp/caixa-api.service /etc/systemd/system/caixa-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now caixa-api
sudo systemctl restart caixa-api
```

## Conferir

```bash
systemctl status caixa-api --no-pager
curl -s localhost:3333/health
journalctl -u caixa-api -n 30 --no-pager
```

Esperado é `{"status":"ok"}`.

Para validar de verdade, que é o fluxo inteiro tocando o Neon, mande o smoke test junto no `scp` e rode na VM.

```bash
node /tmp/smoke-test.mjs http://localhost:3333
```

Ele cria restaurante, dono, catálogos, lança entrada e saída, confere os totais e os nomes vindos do join, corrige, remove e confirma que competência futura é recusada com 422. Cada execução deixa um restaurante de teste no banco, e ele imprime o id para você limpar depois.

## Migrations

Rodam da sua máquina contra o Neon, nunca da VM.

```bash
pnpm db:deploy
```

Use `DIRECT_URL`, a string sem pooler. Migration não roda em PgBouncer em modo transação.

## Ainda falta

- Abrir 80 e 443 na Security List da Oracle e inserir as regras no iptables **antes** do REJECT, com `-I INPUT 5`
- Proxy reverso com HTTPS na frente da porta 3333
- CORS, para o frontend em outra origem conseguir chamar a API

Enquanto o proxy não existe, teste sem expor nada tunelando pelo SSH.

```bash
ssh -L 3333:localhost:3333 ubuntu@146.235.32.133
```

Com o túnel aberto, `http://localhost:3333` na sua máquina fala com a API na VM.
