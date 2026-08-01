# Деплой samoy.love

Статический сайт (Astro → `dist/`), хостится на своём сервере под nginx.
Релиз — автоматический: пуш в `main` → GitHub Actions собирает и заливает на сервер.

## Первичная настройка сервера (один раз)

```bash
# 1. Папка сайта
sudo mkdir -p /var/www/samoy.love
sudo chown $USER:$USER /var/www/samoy.love

# 2. nginx-конфиг
sudo cp deploy/nginx/samoy.love.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/samoy.love.conf /etc/nginx/sites-enabled/
# До выпуска сертификата закомментируйте ssl-блоки или сразу:
sudo certbot --nginx -d samoy.love -d www.samoy.love
sudo nginx -t && sudo systemctl reload nginx
```

DNS: A-записи `samoy.love` и `www.samoy.love` → IP сервера (поддомены
`snakes.` / `metro.` / `launcher.` уже настроены отдельными проектами).

## Ключ для деплоя (один раз)

```bash
# На своей машине: отдельный ключ только для деплоя
ssh-keygen -t ed25519 -f deploy_key -C "gh-actions-samoy.love" -N ""
# Публичную часть — на сервер:
ssh-copy-id -i deploy_key.pub user@server
```

В настройках GitHub-репозитория → Settings → Secrets and variables → Actions:

| Секрет | Значение |
|---|---|
| `DEPLOY_HOST` | IP или хост сервера |
| `DEPLOY_USER` | ssh-пользователь |
| `DEPLOY_SSH_KEY` | содержимое приватного `deploy_key` |

## Релиз

- **Автоматически**: `git push` в `main` — workflow `Deploy` собирает сайт и
  выкатывает `dist/` в `/var/www/samoy.love` через rsync (`--delete` — сервер
  всегда точная копия сборки).
- **Вручную**: вкладка Actions → Deploy → Run workflow.
- PR и ветки проверяются workflow `CI` (сборка без деплоя).

## Раскладка nginx на сервере (207.127.93.34)

На хосте живут четыре сайта, и у каждого конфига есть владелец — **деплой своего
проекта перезаписывает файл целиком**, поэтому переименовывать их нельзя:

| Файл в `sites-available` | Домен | Кем перезаписывается |
|---|---|---|
| `chillhub-launcher.conf` | launcher.samoy.love | CI ChillHub (`deploy/launcher.conf`) |
| `metro.conf` | metro.samoy.love | `scripts/deploy.sh` в MetroMap |
| `snakes.conf` | snakes.samoy.love | деплой Snakes |
| `samoy.love.conf` | samoy.love, www | этот репозиторий |
| `000-default.conf` | catch-all | вручную, см. ниже |

`000-default.conf` — общесерверный: без него default_server'ом становился первый
по алфавиту конфиг (ChillHub), и любой чужой домен, направленный на этот IP,
отдавал бы чужой сайт. Теперь такие запросы обрываются (444 / отказ в TLS).

В `nginx.conf` отключены TLSv1 и TLSv1.1 и сужен include до `sites-enabled/*.conf`,
чтобы случайный `.bak` рядом с конфигом не подхватился молча.

Бэкапы: `/root/nginx-backup-cleanup.tar.gz`, прежние версии — в `/etc/nginx/archive/`.

Осиротевший `launcher.conf` (старый общий конфиг launcher+metro, больше не
подключён) скопирован в `/etc/nginx/archive/launcher.conf.retired-2026-08-01`.
Удалить оригинал:

```bash
sudo rm /etc/nginx/sites-available/launcher.conf && sudo nginx -t
```

## Локально

```bash
npm run dev      # дев-сервер
npm run build    # прод-сборка в dist/
npm run preview  # предпросмотр прод-сборки
```
