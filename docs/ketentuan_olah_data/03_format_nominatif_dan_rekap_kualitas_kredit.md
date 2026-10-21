# 03 · Format Output: Nominatif & Rekap Kualitas Kredit (termasuk khusus Mikro)

*Sub-ketentuan dari Ketentuan Olah Data LW321 v4 · file `03_format_nominatif_dan_rekap_kualitas_kredit.md` · indeks: [00_INDEX.md](00_INDEX.md)*

## Tujuan
Standar tampilan output kualitas kredit: urutan kolom nominatif, aturan khusus Mikro (kolom UKER, rekap per unit), desain tabel rekap one-obligor, dan kolom Instansi pada nominatif top-N.

## Kapan dirujuk
- Menyusun file nominatif kualitas kredit (Ritel/Mikro).
- Menyusun rekap per cabang/area/unit.
- Menambah kolom Instansi pada nominatif top-N atau pergerakan DG/UG.

## Konteks minimum
- Nilai Kolek tampil sebagai **angka 1–5**; Kualitas Kredit & Kriteria Kredit sebagai **teks** ([01_dasar_definisi_kolom_dan_sumber_data.md](01_dasar_definisi_kolom_dan_sumber_data.md), bagian 5).
- Isi kolom Kualitas Kredit / Kriteria Kredit dihitung menurut [02_one_obligor_dan_kriteria_kredit.md](02_one_obligor_dan_kriteria_kredit.md).
- Nama kanca & area dari [13_master_kanca_area_unit_dedicated.md](13_master_kanca_area_unit_dedicated.md).

> **Catatan penomoran:** isi aturan di bawah disalin dari `ketentuan_olah_data_LW321_v4.md`, termasuk nomor bagian aslinya. Perubahan setelah v4 ditandai *(update …)* atau *(sementara …)*. Jika teks menyebut "bagian X" atau "Lampiran A/B", cari file-nya di tabel *Peta Bagian Asal* pada [00_INDEX.md](00_INDEX.md).

---

# ATURAN

## 3. Header Wajib — Nominatif Kualitas Kredit

Urutan kolom baku untuk output nominatif kualitas kredit:

1. Kode Kanca
2. Kanca
3. **Uker** — *khusus kalau mengolah data Briguna Mikro* (kolom `UKER`)
4. Nomor Rekening
5. Nama Debitur
6. CIF
7. **Kolek** — angka `KOL_ADK` (1–5), **bukan** label teks
8. Produk (Karya / Purna / Pra-Purna / Briguna Mikro)
9. RM Pengelola — dari kolom `PN PENGELOLA SINGLEPN`, **buang angka & simbol pada 11 karakter pertama** (format sumber: `"00235274 - Nama RM"` → hasil bersih: `"Nama RM"`)
10. Umur Tunggakan
11. Baki Debet (OS)
12. Total Tunggakan
13. **Kualitas Kredit** — versi singkat, **teks**: Lancar / SML / NPL (murni dari KOL_ADK, tidak berubah walau one obligor)
14. **Kriteria Kredit** — versi detail, **teks** (lihat logika di bagian 4)

**Tidak perlu baris TOTAL** di bawah nominatif. Kalau perlu subtotal, hanya menjumlahkan data yang sedang difilter.

## 6. Ketentuan Khusus Data Mikro

- Wajib sertakan kolom **UKER** (unit) di samping KANCA pada setiap output yang melibatkan Briguna Mikro.
- Rekap Mikro dipecah **per Cabang + per Unit**, bukan per cabang saja.
- Rekap Ritel cukup **per Cabang** saja (tidak ada unit).

## 7. Desain Tabel Rekap (kategori one-obligor per cabang/area)

Urutan kolom kiri→kanan:

**Cabang | DG karena Briguna (Deb, OS) | DG karena Obligor CC (Deb, OS) | DG karena Obligor produk lain (Deb, OS) | TOTAL (Deb, OS)**

Pemetaan Kriteria Kredit → kolom *(sementara 9 Okt'26 — menunggu penjelasan lanjutan user)*: **DG karena Briguna** = tunggakan riil (SML 1/2/3, NPL Baru, NPL Dibawah 2 Tahun, NPL); **DG karena Obligor CC** = One Obligor CC; **DG karena Obligor produk lain** = One Obligor Lainnya, **termasuk** yang penyebabnya tidak teridentifikasi.

Desain visual:
- Header 2 tingkat (grup besar di atas, sub "Deb"/"OS" di bawah), merged cell, background navy gelap (`#1F4E78`), teks putih bold.
- Baris data: font normal, angka rata kanan, zebra-stripe (selang-seling putih/abu-abu muda `#F2F2F2`) antar baris cabang.
- Baris TOTAL: bold, background biru muda/lavender (`#D9E1F2`), di baris paling bawah.
- Ada baris caption/keterangan definisi kategori tepat di atas tabel.

## 14. Nominatif Top-N — Kolom "Instansi"

Kalau output nominatif (top-N debitur, pergerakan DG/UG, dsb.) perlu kolom Instansi, pakai **INSTANSI_ASAL** (fallback `NAMA_INSTANSI → SATKER → KL → cari di Data Leads (match by CIF)`, disamakan dengan bagian 10.2 *(sementara 9 Okt'26 — menunggu penjelasan lanjutan user)*), dicocokkan via **CIF** dari file Data Debitur bulanan yang paling baru. Tidak perlu full curation (INSTANSI_FINAL/GENERAL, bagian 10.3) kecuali diminta eksplisit — cukup "instansi bersih" hasil fallback saja untuk output cepat/nominatif ad-hoc.

---

## ⏳ Aturan sementara (menunggu penjelasan lanjutan user)

- Bagian 7: one obligor yang penyebabnya tidak teridentifikasi sementara masuk kolom "DG karena Obligor produk lain".
- Bagian 14: INSTANSI_ASAL untuk nominatif top-N sementara memakai urutan lengkap bagian 10.2 (termasuk langkah Data Leads).

## Sub-ketentuan terkait

- [02_one_obligor_dan_kriteria_kredit.md](02_one_obligor_dan_kriteria_kredit.md) — cara mengisi Kualitas Kredit & Kriteria Kredit (bagian 4)
- [01_dasar_definisi_kolom_dan_sumber_data.md](01_dasar_definisi_kolom_dan_sumber_data.md) — format angka kolektibilitas & CIF
- [04_database_instansi_kurasi.md](04_database_instansi_kurasi.md) — definisi INSTANSI_ASAL lengkap (bagian 10.2) yang dirujuk bagian 14
- [09_pergerakan_dg_ug_historis_prognosa.md](09_pergerakan_dg_ug_historis_prognosa.md) — nominatif top-N pergerakan DG/UG (bagian 12.3)
- [13_master_kanca_area_unit_dedicated.md](13_master_kanca_area_unit_dedicated.md) — master kanca/area & unit
