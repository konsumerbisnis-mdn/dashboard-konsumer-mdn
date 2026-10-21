# 12 · Database Disburse & Master RM (termasuk alur input data disburse baru)

*Sub-ketentuan dari Ketentuan Olah Data LW321 v4 · file `12_database_disburse_dan_rm.md` · indeks: [00_INDEX.md](00_INDEX.md)*

## Tujuan
Aturan pakai sheet `database disburse` (realisasi Ritel) dan `database RM` (master RM & target), serta alur baku saat user mengirim data disburse baru lewat chat.

## Kapan dirujuk
- User mengirim data disburse baru untuk diolah/di-append.
- Analisis realisasi disburse (baru vs suplesi, suku bunga).
- Analisis pencapaian target RM.

## Konteks minimum
- File: `Database Keragaan Disburse RKA.xlsx` (4 sheet; struktur lengkap di [11_database_kinerja_keragaan_dan_rka.md](11_database_kinerja_keragaan_dan_rka.md)). Di-update berkala (append) — cegah duplikasi.
- Satuan: `database disburse` dan Target `database RM` = **Rp Juta**.
- Nama kanca clean dari kode `KD KC`: [13_master_kanca_area_unit_dedicated.md](13_master_kanca_area_unit_dedicated.md) (Lampiran A).
- Pembersihan nama RM dari `PN PENGELOLA SINGLEPN` ("bagian 3 no. 9"): buang angka & simbol pada 11 karakter pertama — lihat [03_format_nominatif_dan_rekap_kualitas_kredit.md](03_format_nominatif_dan_rekap_kualitas_kredit.md).

> **Catatan penomoran:** isi aturan di bawah disalin dari `ketentuan_olah_data_LW321_v4.md`, termasuk nomor bagian aslinya. Perubahan setelah v4 ditandai *(update …)* atau *(sementara …)*. Jika teks menyebut "bagian X" atau "Lampiran A/B", cari file-nya di tabel *Peta Bagian Asal* pada [00_INDEX.md](00_INDEX.md).

---

# ATURAN

### 15.5 `database disburse` — aturan pakai & pengisian data baru
- **Scope**: Briguna Ritel saja (`PRODUK` = Kretap/Kresun/Umum; SEGMEN semua "RITEL"). **Disburse Mikro belum tersedia — akan menyusul.**
- **Metrik realisasi baku = `OS NET`** (uang baru; untuk Suplesi sudah dikurangi OS sebelumnya). Bukan `EQ_PLAFOND`.
- `Real Baru/Suplesi` membedakan realisasi baru vs suplesi.
- Kolom suku bunga yang dipakai = **`SUKU_BUNGA`**. Ada dua kolom bernama sama (bentuk desimal 0,0825 dan persen 8,25) — pilih yang menghasilkan angka **wajar untuk kredit pegawai: ±5% s.d. belasan persen** (boleh sedikit di bawah 5% atau di atas belasan). Normalisasi ke satu format sebelum analisis.

**Alur kerja saat user mengirim data disburse baru lewat chat:**
Data mentah yang dikirim **belum punya** 3 kolom berikut. Ketiganya diisi oleh Claude:

| Kolom | Cara mengisi |
|---|---|
| **Kantor Cabang** | Nama cabang **versi clean** (mis. `KC Medan Iskandar Muda`, bukan `00336 -- KC Medan Iskandar M`). Ambil dari `KD KC` → Lampiran A. |
| **PN AO (9 digit)** | Dari kolom `PN_AO`, dinormalisasi jadi 9 digit (buang spasi/`.0`, lalu zero-pad kiri sampai 9 karakter). |
| **Nama RM - RO** | **Lookup `PN AO (9 digit)` ke sheet `database RM`** (kolom `PN AO 9 dig`), pakai baris bulan yang sesuai. **Kalau tidak ketemu**, cross-check ke LW321 posisi terdekat lewat `NOMOR_REKENING`, atau `CIF` + kanca yang sama, lalu ambil RM dari `PN PENGELOLA SINGLEPN` (dibersihkan sesuai bagian 3 no. 9). |

Catatan penting: `PN_AO` pada data disburse historis **tidak reliable** (satu RM bisa punya 2–3 PN, satu PN dipakai beberapa nama RM), sementara master `database RM` bersih (PN unik per bulan). Karena itu urutannya: lookup PN dulu → kalau gagal/ambigu, baru fallback ke LW321. **Untuk analisis pencapaian RM, gunakan kolom `Nama RM - RO`** (+ Kantor Cabang), bukan PN.

### 15.6 `database RM` — master RM & target
- Header ada di **baris 2** (baris 1 judul).
- `Target` = target **OS NET** per RM per bulan, satuan Rp Juta.
- `JG` = job grade (4/5/6/7/BBAP).
- Pencapaian RM = total `OS NET` disburse yang `Nama RM - RO`-nya = RM tsb pada bulan yang sama.
- Master ini per bulan — RM bisa masuk/keluar/pindah kanca antar bulan, jadi selalu lookup pakai pasangan (Bulan, RM).

---

## Sub-ketentuan terkait

- [11_database_kinerja_keragaan_dan_rka.md](11_database_kinerja_keragaan_dan_rka.md) — struktur file database kinerja & satuan
- [13_master_kanca_area_unit_dedicated.md](13_master_kanca_area_unit_dedicated.md) — Lampiran A untuk nama kanca clean
- [03_format_nominatif_dan_rekap_kualitas_kredit.md](03_format_nominatif_dan_rekap_kualitas_kredit.md) — format pembersihan nama RM (bagian 3 no. 9)
