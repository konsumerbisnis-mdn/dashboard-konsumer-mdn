# Dashboard Konsumer Region I - Medan (Briguna Ritel · Briguna Mikro · KPR)

Website statis (GitHub Pages) + Google Apps Script (API & penjaga akses) + Google Sheets (database privat).
Tampilan, animasi pembuka, dan suara mengikuti Dashboard KPR RO Medan.

```
Browser (GitHub Pages)  ──HTTPS POST──▶  Apps Script Web App  ──▶  Google Sheets + Google Drive (privat)
 index.html, css, js, sfx   login, RBAC, cache,                     keragaan, RKA, disburse, list RM/mantri,
 (tanpa data)               masking per peran                       produktivitas KPR, LW321, RM & KC card, users, log
```

## Menu

| No | Menu | Isi |
|---|---|---|
| 1 | Keragaan | Highlight Konsumer per RO / per area / per kanca (Briguna Ritel, Briguna Mikro, KPR, total). Pilihan produk; KPI OS, SML, NPL, Debitur per KC; Time Series SML & NPL; grafik vs RKA |
| 2 | Produktivitas RM | Briguna Ritel, Briguna Mikro, KPR: per RM / per cabang, per bulan & carry over, kartu RM berfoto (BRILIAN), kuadran, perbandingan bulan & tahun |
| 3 | Nominatif Portofolio | Per debitur (Briguna & KPR): ringkasan, semua debitur, EWS, peluang, tindak lanjut |
| 4 | Kualitas Kredit | DG / UG SML & NPL (vs LW321 bulan lalu), matriks kolektibilitas, DG/UG per kanca, rincian SML & NPL |
| 5 | Pipeline Brispot RM | Briguna & KPR: funnel, jadwal akad, usia pipeline, rencana realisasi, per KC & RM |
| 6 | Simulasi Suku Bunga | Briguna (max plafond THP & RPC, angsuran, jadwal) dan KPR (tabel suku bunga per program) |

Setiap tabel/grafik punya tombol **Unduh**: Excel, CSV (data tabel), PDF dan Gambar PNG (tampilan tabel/grafik).
Istilah DSR diganti **RPC** (repayment capacity).

## Isi folder

| File | Fungsi |
|---|---|
| `index.html` | Kerangka: animasi pembuka, login, beranda, menu, dialog |
| `css/app.css` | Tema Dashboard KPR (terang/gelap) + tambahan Konsumer |
| `js/config.js` | **URL Web App Apps Script** dan pengaturan umum (tanpa data/password) |
| `js/auth.js` | Hash password, login/logout, sesi terenkripsi, idle logout, RBAC tampilan |
| `js/sfx.js` | Pemutar suara antarmuka dari folder `sfx/` (sesuai Panduan Coding Sound) |
| `js/app.js` | Seluruh dashboard |
| `js/diag.js` | Kotak diagnosis bila halaman gagal dimuat (`#reset` di akhir alamat untuk reset pengaturan) |
| `sfx/*.mp3` | Suara klik, sorot, masuk, kembali, tutup, aktif, dan animasi pembuka |
| `assets/*.png` | Logo |
| `google_apps_script.gs` | Backend: **jangan diunggah ke GitHub**, ditempel di Apps Script |

## Sheet di Google Sheets

| Sheet | Isi / kolom kunci |
|---|---|
| `keragaan` | Uker, Tanggal, Desc (Briguna Karya/Purna/Pra-Purna/Mikro/Mikro D, **KPR**), DEB, OS, DPK, NPL, DEB DPK, DEB NPL (Rp juta) |
| `RKA` | Mata Anggaran (OS/DPK/NPL/DEB + produk, termasuk **KPR**), KODE UKER, UNIT KERJA, kolom per akhir bulan (Rupiah penuh) |
| `disburse ritel 2025`, `disburse ritel 2026`, `disburse mikro` | Disburse Briguna (net = Delta Suplesi / OS NET, Rp juta) |
| `list RM ritel` | Bulan, KANCA, Nama RM, JG, Target, PN AO 9 dig |
| `list mantri mikro` | Bentuk sama dengan list RM ritel |
| `Database History` (boleh dinamai `produktivitas KPR history`) | Produktivitas KPR per RM per bulan: BLN, THN, KANCA, NAMA RM, Target Deb, Target Disb, Subsidi (Deb, OS), Komersil (Deb, OS), Total (Deb, OS), JG, …, Area — sama persis dengan file *Database Produktivitas* |
| `Database Monthly` (boleh dinamai `produktivitas KPR monthly`) | Pencairan harian KPR: TGL, BLN, THN, Tanggal, Nama RM, Plafon, Deb, Jenis, kanca, Nama RM (lengkap) |
| `RM & KC card` | Dibuat otomatis. Tipe (RM/KC), Nama, Kunci, File ID (Google Drive), Diperbarui, Oleh. Diisi dari menu Admin → upload foto/ikon; bisa juga diisi manual dengan link/ID file Drive |
| `LW321`, `LW321 bulan lalu`, `LW321 KPR`, `LW321 KPR bulan lalu` | Dibuat otomatis dari menu Admin → Kelola data |
| `users`, `access_log` | Dibuat otomatis oleh `setup()` |

Pipeline Brispot (Briguna & KPR) dan tabel suku bunga KPR diupload dari menu Admin dan disimpan sebagai file di folder Drive `KonsumerDashboard_cache`.

## Deploy

Ikuti dokumen **Panduan Deploy Dashboard Briguna** (langkah sama). Ringkasnya:

1. Google Sheets: hentikan publikasi ke web, lokal angka sesuai sumber, tambah sheet produktivitas KPR.
2. Apps Script: tempel `google_apps_script.gs`, isi `CFG.SHEET_ID`, jalankan `setup` (catat password admin di log bila akun admin baru dibuat), opsional `installDailyTrigger`.
3. Deploy → Web app (Execute as: Me, Who has access: Anyone) → salin URL `/exec`.
   Sudah pernah deploy versi Briguna? Cukup ganti kodenya, jalankan `setup` lagi, lalu **Deploy → Manage deployments → Edit → New version** (URL tetap, akun lama tetap).
4. GitHub: unggah semua file **kecuali** `google_apps_script.gs`, isi `API_URL` di `js/config.js`, aktifkan Pages (main / root).
5. Login admin → Admin → Kelola data: upload LW321 Briguna & KPR (terkini dan bulan lalu), Pipeline Brispot Briguna & KPR, tabel suku bunga KPR, foto RM, ikon KC. Tambah user RM / Guest di tab User.

## Peran & akses

| Menu | Admin | RM | Guest |
|---|---|---|---|
| Keragaan, Produktivitas, Simulasi | ✓ | ✓ | ✓ |
| Kualitas Kredit | detail | kelolaan sendiri | agregat per kanca |
| Nominatif Portofolio | semua | kelolaan sendiri | ✗ |
| Pipeline Brispot | semua | berkas pemrakarsa sendiri | tanpa nama debitur |
| Admin (upload, user, log, sync paksa) | ✓ | ✗ | ✗ |

Pembatasan dilakukan di Apps Script (server), bukan hanya disembunyikan di tampilan.

## Catatan

- Logo BRI/Danantara dan audio animasi pembuka diambil dari Dashboard KPR. Pastikan pemakaiannya sesuai kebijakan merek & hak pakai internal.
- Kriteria Subsidi KPR di LW321 (FLPP/Sejahtera atau plafon ≤ Rp185 juta) dan jenis Ritel/Mikro di Pipeline Briguna (kolom produk/segmen) adalah pendekatan; sesuaikan bila format file berbeda.
- Catatan tindak lanjut (RTL) di Nominatif tersimpan di perangkat masing-masing, tidak dikirim ke server.
- Siapa pun yang sudah login bisa melihat data yang memang ditampilkan untuknya. LW321 dan pipeline berisi data nasabah; pastikan penyimpanan di Google Drive sesuai kebijakan bank dan UU PDP.
