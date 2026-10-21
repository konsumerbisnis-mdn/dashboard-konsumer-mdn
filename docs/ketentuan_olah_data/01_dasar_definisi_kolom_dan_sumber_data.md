# 01 · Dasar: Definisi Kolom LW321, Format Kolektibilitas, Sumber Data

*Sub-ketentuan dari Ketentuan Olah Data LW321 v4 · file `01_dasar_definisi_kolom_dan_sumber_data.md` · indeks: [00_INDEX.md](00_INDEX.md)*

## Tujuan
Fondasi untuk hampir semua task: arti kolom LW321, cara memisahkan produk (Ritel/Mikro), definisi SML/NPL, format CIF, aturan angka kolektibilitas, dan aturan memilih posisi data.

## Kapan dirujuk
- Setiap kali membaca/mengolah LW321 atau sumber yang dijoin via CIF.
- Saat perlu menentukan produk (Karya/Purna/Pra-Purna/Mikro) dari `DESCRIPTION`.
- Saat menentukan posisi data mana yang dipakai atau membandingkan dua periode.

## Konteks minimum
Tidak ada prasyarat — ini file dasar. File lain umumnya bergantung pada file ini.

> **Catatan penomoran:** isi aturan di bawah disalin dari `ketentuan_olah_data_LW321_v4.md`, termasuk nomor bagian aslinya. Perubahan setelah v4 ditandai *(update …)* atau *(sementara …)*. Jika teks menyebut "bagian X" atau "Lampiran A/B", cari file-nya di tabel *Peta Bagian Asal* pada [00_INDEX.md](00_INDEX.md).

---

# ATURAN

## 1. Definisi Dasar Kolom LW321

| Istilah | Sumber Kolom / Definisi |
|---|---|
| Kolektibilitas | `KOL_ADK` |
| Outstanding / OS | `BALANCE DALAM IDR` (atau `BAKI DEBET` pada file yang sudah punya kolom ini) |
| Pemisah produk | `DESCRIPTION` |
| Briguna Mikro | DESCRIPTION mengandung `KREDIT MIKRO - GBT` |
| Briguna Karya / Purna / Pra-Purna (Umum) | DESCRIPTION mengandung kata "KARYA" / "PURNA" (bukan "PRA PURNA") / "UMUM" atau "PRA PURNA" — DESCRIPTION berisi "PRA PURNA" termasuk Pra-Purna, sama saja dengan "UMUM" *(update 9 Okt'26)* |
| **Briguna Ritel** | Gabungan: Briguna Karya + Briguna Purna + Briguna Pra-Purna (Umum) — **di luar Mikro** |
| Umur Tunggakan | `PERIODE − NEXT_PMT_DATE` (dalam hari). Bisa negatif — itu wajar untuk Lancar (belum jatuh tempo); jadi anomali kalau dipasangkan dengan KOL_ADK yang sudah DPK/NPL |
| Total Tunggakan | `TUNGGAKAN POKOK + TUNGGAKAN BUNGA + TUNGGAKAN PINALTI` |
| SML / NPL | Diturunkan dari KOL_ADK (SML = Kol 2, NPL = Kol 3/4/5) |
| CIF | Nomor induk debitur BRI (`CIFNO`) — **wajib ada di semua output pengolahan data mulai sekarang**. Format baku: **7 karakter alfanumerik** (mis. `G810252`, `JIL0661`), konsisten di semua sumber (LW321, Data Debitur, Data Leads, Database Disburse) |

## 5. Aturan Format Angka Kolektibilitas

- Kolom **kolektibilitas** apa pun (Kolek, Kol Juni, Kol Juli, KOL_ADK, dst.) → **pakai angka 1–5 saja**.
- **Kecuali** kolom **Kualitas Kredit** dan **Kriteria Kredit** → tetap pakai **teks** sesuai definisi di atas.

## 9. Sumber Data

- Selalu pakai **file/posisi data terbaru** yang tersedia di Project untuk setiap ketentuan (LW321 maupun Obligor CC), kecuali diminta eksplisit pakai posisi tertentu.
- Saat membandingkan dua periode (mis. New SML/NPL), baseline & posisi target harus disebutkan jelas di judul/keterangan output (mis. "posisi 13 Jul'26 vs baseline 14 Jun'26").

---

## Riwayat perubahan setelah v4

- 9 Okt'26: DESCRIPTION berisi "PRA PURNA" dipastikan masuk Briguna Pra-Purna (sama dengan "UMUM").

## Sub-ketentuan terkait

- [02_one_obligor_dan_kriteria_kredit.md](02_one_obligor_dan_kriteria_kredit.md) — logika one obligor & Kriteria Kredit yang memakai definisi kolom di sini
- [03_format_nominatif_dan_rekap_kualitas_kredit.md](03_format_nominatif_dan_rekap_kualitas_kredit.md) — header nominatif yang memakai Kolek/CIF/OS
- [04_database_instansi_kurasi.md](04_database_instansi_kurasi.md) — CIF sebagai primary key lintas sumber (10.1)
- [13_master_kanca_area_unit_dedicated.md](13_master_kanca_area_unit_dedicated.md) — mapping kode kanca → nama → area
