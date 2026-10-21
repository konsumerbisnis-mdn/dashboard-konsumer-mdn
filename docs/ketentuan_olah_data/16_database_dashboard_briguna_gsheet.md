# 16 · Database Utama Dashboard Briguna (Google Sheets)

*Sub-ketentuan baru (20 Okt'26) · file `16_database_dashboard_briguna_gsheet.md` · indeks: [00_INDEX.md](00_INDEX.md)*

> *(update 21 Okt'26)* Dashboard Briguna kini digabung dengan Dashboard KPR menjadi **Dashboard Konsumer Region I - Medan**. Database di file ini tetap dipakai; sheet tambahan (produktivitas KPR, `RM & KC card`, `LW321 KPR`) dan ketentuan aplikasinya ada di [17_dashboard_konsumer_web.md](17_dashboard_konsumer_web.md).

## Tujuan
Mencatat struktur sheet & kolom file `database_dashboard_briguna_mdn` (Google Sheets, diunduh sebagai .xlsx) yang akan menjadi **database utama** Dashboard Briguna, beserta temuan kualitas data yang harus dibereskan sebelum dipakai.

## Kapan dirujuk
- Membangun / memperbarui Dashboard Briguna (frontend HTML atau backend Google Apps Script).
- Mengisi atau menempel data baru ke Google Sheet database.

---

# STRUKTUR (posisi file 20 Okt'26)

| Sheet | Baris | Grain | Kolom kunci | Satuan | Padanan di `DB Keragaan Disburse RKA` |
|---|---|---|---|---|---|
| `keragaan` | 97.373 | uker × tanggal × produk | Uker, Tanggal, Desc, DEB, OS, DPK, NPL, DEB DPK, DEB NPL | Rp juta | `Keragaan` (sama persis kolomnya) |
| `RKA` | 510 | mata anggaran × kode uker, kolom per akhir bulan Jan'25–Des'26 | Mata Anggaran, KODE UKER, UNIT KERJA, D1 = 31/01/2025, E1.. = `EOMONTH(kolom kiri,1)` | Rupiah penuh (DEB = jumlah) | `RKA` |
| `disburse ritel 2025` | 6.673 | per rekening (5.689) + baris rekap RM per tanggal tanpa nama debitur (1.046) | Kanca, Nama RM, Tanggal Realisasi, OS NET, FLAG SUPLESI (BARU/SUPLESI), DESCRIPTION, Nama Debitur, CIF, OS Gross, Jlh Debitur | Rp juta | `Disburse 2025` |
| `disburse ritel 2026` | 7.349 | per rekening, 1 Jan – 16 Okt'26 | KD KC, Kantor Cabang, AREA HEAD, NO_REKENING, CIF, Real Baru/Suplesi, Os Sblm, **Delta Suplesi** (net disburse), EQ_PLAFOND, SUKU_BUNGA, PRODUK (Kretap/Kresun/Umum), TGL_REALISASI, PN_AO, PN AO (9 digit), **RM PENGELOLA** | Rp juta | `Disburse` (kolom dipangkas dari 45 → 20) |
| `disburse mikro` | 3.727 | per rekening, 1 Jan – Okt'26 | KD KC, KANCA, KD UKER, UNIT_KERJA, NO_REKENING, CIF, LOAN_TYPE, Real Baru/Suplesi, Delta Suplesi, PRODUK, SEGMEN = MIKRO, TGL_REALISASI, PN_AO, SEGMEN PROFESI, INSTANSI, Kode Instansi | Rp juta | **baru** (sebelumnya disburse Mikro belum tersedia) |
| `list RM ritel` *(update 20 Okt'26)* | — | RM × bulan | Bulan, KANCA, Nama RM, JG, Target, PN AO, PN AO 9 dig (bentuk = `Database RM`) | Rp juta | `Database RM` |
| `list mantri mikro` *(akan ditambahkan user)* | — | mantri × bulan | bentuk sama dengan `list RM ritel`; nama mantri di disburse Mikro dicocokkan lewat PN_AO | Rp juta | — |

Catatan struktur:
- Nama sheet di file = `disburse mikro` (bukan `disburse mikro 2026`).
- `keragaan` memuat Desc yang sama dengan ketentuan 11: Ritel, Karya, Purna, Pra-Purna, Pra0Purna (typo), Mikro, Mikro D, KPR. Tanggal 31 Des'22 – 19 Okt'26. Aturan anti double-count (11 bagian 15.4) tetap berlaku.
- `RKA` kode khusus: `B` = Total RO Medan, `D` = total unit dedicated, `L` = unit lainnya (ketentuan 11 bagian 15.7).
- Target RM Ritel ada di sheet `list RM ritel`; target mantri Mikro di `list mantri mikro` (menyusul). Pencapaian & kuadran hanya dihitung untuk RM/mantri yang punya target.
- **Tidak ada sheet LW321** → detail debitur (kolektibilitas, tunggakan) masuk lewat upload admin di aplikasi web (disimpan ke sheet `LW321` dan `LW321 bulan lalu`).
- `disburse mikro`: tidak ada nama mantri/RM, hanya `PN_AO` (74 baris `#N/A`); `NAMA RO` berisi "Medan" (regional office). Header kolom 38–40 tampak tergeser: `PAYROL / NO PAYROL` berisi tiering suku bunga, `TANGGAL REALIASI` berisi angka hari.

# TEMUAN KUALITAS DATA (wajib dibereskan di Google Sheet)

Penyebab utama (dikonfirmasi user 20 Okt'26): perbedaan format penulisan angka — data berformat US (koma = ribuan, titik = desimal) ditempel ke spreadsheet berlokal **Indonesia** (koma = desimal). User sedang memperbaiki di spreadsheet. Akibatnya:

1. **Angka ≥ 1.000 terbaca sebagai desimal (dibagi 1.000)** dan angka di bawah 1.000 kehilangan desimalnya.
   - `keragaan` 30 Sep'26 uker 53 Ritel: DEB 4,128 → **4.128**; OS 673.713 juta → **673.713** (seharusnya 673.712,8); DPK 19.362 juta → **19.362**.
   - Nilai ≥ 1.000.000 tersimpan sebagai teks (`"1,000,041"`). Uker 2062/1097/3275… tersimpan sebagai teks `"2,062.00"`.
   - `RKA`: sebagian besar sel berupa teks `"635,325,977,101"`; baris DEB terbaca 1,014 → 1.014.
   - `disburse ritel 2026` Delta Suplesi ikut rusak: total Sep'26 = **119.099** juta, seharusnya **125.301** (sesuai PPT & DB lama); Jan'26 66.644 vs 67.635.
2. **Angka bertitik berubah jadi tanggal**: 551 sel `OS NET` & 266 `OS Gross` di disburse 2025 (mis. "5.1" → 1-Mei-2026), 104 sel `SUKU_BUNGA` mikro ("9.10" → 9-Okt-2026), 2 CIF mikro jadi tanggal.
3. `-` dipakai untuk nol (teks), dan persen tersimpan sebagai teks (`"12.0%"`).
4. NO_REKENING tersimpan sebagai angka → nol di depan hilang (aman untuk join bila dinormalisasi tanpa nol depan; aplikasi menampilkan ulang 15 digit).

Data rusak ini **tidak bisa dipulihkan secara pasti** (mis. 2.0 bisa berarti 2 atau 2.000), jadi harus diisi ulang dari sumber.

# CARA PENGISIAN YANG BENAR

1. Google Sheets → File → Setelan → **Lokal = Amerika Serikat** (atau pastikan sumber memakai format Indonesia bila lokal tetap Indonesia), sebelum menempel.
2. Isi ulang lewat **File → Impor → Unggah .xlsx → Ganti sheet**, jangan copy-paste teks berformat.
3. Kolom angka disimpan sebagai **angka murni** (tanpa pemisah ribuan teks, tanpa `-`, persen sebagai 0,12 atau 12).
4. Kolom kode (CIF, NO_REKENING, PN) diformat **Teks biasa** sebelum ditempel.

# APLIKASI WEB (20 Okt'26)

- Arsitektur: GitHub Pages (index.html, css/styles.css, js/config.js, auth.js, app.js, tools.js) + Google Apps Script (`google_apps_script.gs`) sebagai API & gatekeeper; spreadsheet privat.
- Peran: **Admin** (semua + upload LW321, user, log), **RM** (dashboard, debitur kelolaan sendiri berdasarkan Nama RM / PN, tools), **Guest** (agregat saja).
- Apps Script membangun cache ringkas (gzip) di Drive: keragaan sejak Jan'24, RKA, target + transaksi disburse teragregasi, detail disburse per rekening, LW321 (+ bulan lalu). Sync paksa oleh admin; peran lain maks. tiap 2 menit; opsional pemicu harian 06.00.
- Sheet sistem yang dibuat otomatis: `users`, `access_log`, `LW321`, `LW321 bulan lalu`.
- Diuji dengan tiruan Apps Script memakai data DB lama yang benar: net disburse Ritel Sep'26 = 125.301 juta, kuadran Sep'26 19·2·14·2, OS Ritel 14 Okt'26 = 5.986.301 juta, LW321 30 Sep'26 66.864 rekening (SML 1,49%, NPL 2,15%).
- *(update 21 Okt'26)* Digantikan oleh **Dashboard Konsumer** (gabungan Briguna + KPR) — lihat [17](17_dashboard_konsumer_web.md). Akun & password Dashboard Briguna tetap berlaku setelah upgrade (jalankan `setup`, bukan `doGet`).

# KEAMANAN

- Spreadsheet saat ini **dipublikasikan ke web** (link `pubhtml`): siapa pun yang memegang link bisa membaca seluruh isinya. Bila memakai Apps Script sebagai gatekeeper, publikasi web harus **dimatikan** dan sheet hanya bisa dibaca oleh akun pemilik Apps Script.
- Data per debitur (LW321: nama, rekening, kolektibilitas, tunggakan) termasuk data nasabah yang dilindungi; pastikan lokasi penyimpanan (Google Drive pribadi / GitHub) sesuai kebijakan bank dan UU PDP.

## Sub-ketentuan terkait
[17](17_dashboard_konsumer_web.md) · [11](11_database_kinerja_keragaan_dan_rka.md) · [12](12_database_disburse_dan_rm.md) · [13](13_master_kanca_area_unit_dedicated.md) · [15](15_update_materi_briguna.md) · [02](02_one_obligor_dan_kriteria_kredit.md)
