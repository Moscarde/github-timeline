# Deploy na VPS

O checkout fica em `/opt/projects/github-timeline`. O `.env` da VPS contém
`GITHUB_TOKEN`, `VISIT_SALT` e `PORT=3002` e deve ter permissão `600`. O Nginx
encaminha `github-timeline.frangolab.com` para `127.0.0.1:3002`; o Certbot gerencia
o certificado e o redirecionamento HTTP para HTTPS.

```sh
cd /opt/projects/github-timeline
git pull --ff-only
docker compose up -d --build
docker compose ps
curl -fsS https://github-timeline.frangolab.com/healthz
```

Depois de alterar `compose.yaml` localmente, sincronize-o antes de executar o
deploy. O banco permanece no volume `github-timeline_timeline-data`.
