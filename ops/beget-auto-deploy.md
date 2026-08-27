# Mystery Logic → Beget automatic deployment

The production flow is intentionally split into two workflows:

1. `production-beget.yml` builds and validates the exact production runtime ZIP.
2. `deploy-beget.yml` downloads only that successful artifact and deploys it to Beget.

The deploy job never builds from unvalidated source.

## One-time GitHub Actions secrets

Required repository secrets:

- `BEGET_HOST` — Beget SSH host, for example `account.beget.tech`.
- `BEGET_USER` — Beget account login or a dedicated FTP account login with SSH enabled.
- `BEGET_PASSWORD` — password for that SSH/SFTP account.

Optional repository secrets:

- `BEGET_PATH` — remote website directory. Defaults to `mysterylogic.com/public_html` relative to the account home.
- `BEGET_PORT` — SSH port. Defaults to `22`.

For least privilege, prefer a dedicated Beget FTP account restricted to the Mystery Logic site directory and enable SSH for it. If that account starts directly inside the site's `public_html`, set `BEGET_PATH` to `.`.

Do not put any password, private key, token, or hosting credential in the repository.

**Success semantics are strict:** if any required Beget secret is missing, the deployment workflow fails and production is explicitly marked as **not deployed**. A green `Deploy Mystery Logic to Beget` run therefore means the validated payload was uploaded and the live HTTP smoke completed successfully; a skipped upload can no longer masquerade as a successful production release.

## Safety gates

Before upload the workflow:

- downloads the successful `mysterylogic-beget-production` artifact;
- revalidates required routes and release cache stamp;
- connects over encrypted SSH transport;
- refuses a missing/root deployment path;
- checks the remote directory already contains a Mystery Logic-like `index.html`;
- creates a compressed rollback archive in `~/.mysterylogic-deploy-backups/`.

Deployment uses `rsync` and preserves `.well-known/` and `.user.ini`.

After upload it performs live HTTP smoke checks for:

- `/`;
- `/tom-1/`;
- `/detektivnye-igry-dlya-dvoih/`;
- `/detektivnye-igry-dlya-dvoih/poslednyaya-ariya/`;
- `/detektivnaya-igra-s-ii/` — it must contain the current **«Восемь минут без камеры»** version, must remain `noindex,follow`, must use the current release-stamped client asset, and must not contain the obsolete **«Архив погас»** wording.

If live smoke fails, the previous files are restored from the rollback archive and the workflow fails. Five latest rollback archives are retained.

## Triggering

Automatic: every successful `Build Mystery Logic production bundle for Beget` run on `main` triggers the deployment workflow.

Manual: run `Deploy Mystery Logic to Beget` from GitHub Actions. A specific successful production bundle run ID can be supplied; if omitted, the latest successful `main` bundle is used.

If the required secrets are not configured yet, the workflow fails before SSH/upload and lists only the missing secret names. No Beget files are touched.
