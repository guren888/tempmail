# Guren TempMail Public

Struktur:
- `worker.js` = backend proxy ke Mail.cx
- `public/` = website
- `wrangler.toml` = konfigurasi Worker

## Deploy dari GitHub ke Cloudflare

1. Buat repository GitHub, misalnya `guren-tempmail-public`.
2. Upload semua file dan folder ini.
3. Cloudflare Dashboard → Workers & Pages → Create application → Import repository.
4. Pilih repository GitHub tersebut.
5. Deploy Worker.

## Tambahkan token Mail.cx

Setelah Worker dibuat:
Workers & Pages → pilih Worker → Settings → Variables and Secrets → Add → Secret.

Nama:
`MAILCX_API_TOKEN`

Value:
token Mail.cx kamu (`tm_...`)

Lalu Deploy.

Token tidak ada di GitHub dan tidak dikirim ke browser. Cloudflare menyimpan secret sebagai secret Worker.

## Website

Worker ini sekaligus melayani folder `public/` jika konfigurasi static assets ditambahkan melalui dashboard/build. Jika dashboard meminta konfigurasi static assets, arahkan assets ke folder `public`.

Alternatif paling mudah: gunakan Cloudflare Worker dengan static assets dan set folder `public` sebagai asset directory.

## Endpoint frontend

Frontend memanggil:
- `/api/config`
- `/api/inbox/<email>`
- `/api/email/<id>`

Worker meneruskan request ke Mail.cx dengan header token rahasia.

Jangan pernah menaruh token Mail.cx di `app.js`, `index.html`, atau repository GitHub.
