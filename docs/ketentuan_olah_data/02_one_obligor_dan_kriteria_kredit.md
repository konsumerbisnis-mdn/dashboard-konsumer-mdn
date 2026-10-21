# 02 · One Obligor & Logika Kriteria Kredit

*Sub-ketentuan dari Ketentuan Olah Data LW321 v4 · file `02_one_obligor_dan_kriteria_kredit.md` · indeks: [00_INDEX.md](00_INDEX.md)*

## Tujuan
Menentukan apakah penurunan kolektibilitas rekening Briguna disebabkan tunggakan riil atau one obligor (CC / pinjaman lain), lalu memberi label Kriteria Kredit detail.

## Kapan dirujuk
- Membuat nominatif kualitas kredit (kolom Kualitas Kredit & Kriteria Kredit).
- Analisis penyebab SML/NPL (DG karena Briguna vs CC vs produk lain).
- Membuat rekap one-obligor per cabang/area.

## Konteks minimum
- Kolektibilitas = `KOL_ADK` (selalu dianggap benar). SML = Kol 2, NPL = Kol 3/4/5.
- Umur Tunggakan = `PERIODE − NEXT_PMT_DATE` (hari); Total Tunggakan = pokok + bunga + pinalti.
- Join antar sumber pakai **CIF** (7 karakter alfanumerik), bukan nomor rekening.
- Detail lengkap definisi: [01_dasar_definisi_kolom_dan_sumber_data.md](01_dasar_definisi_kolom_dan_sumber_data.md).

> **Catatan penomoran:** isi aturan di bawah disalin dari `ketentuan_olah_data_LW321_v4.md`, termasuk nomor bagian aslinya. Perubahan setelah v4 ditandai *(update …)* atau *(sementara …)*. Jika teks menyebut "bagian X" atau "Lampiran A/B", cari file-nya di tabel *Peta Bagian Asal* pada [00_INDEX.md](00_INDEX.md).

---

# ATURAN

## 2. Deteksi One Obligor

Sebuah rekening terindikasi **one obligor** (kolektibilitasnya turun bukan karena Briguna itu sendiri menunggak) jika:
- Total Tunggakan = 0, **atau**
- Umur Tunggakan tidak sejalan dengan KOL_ADK

> **Penjelasan *(update 9 Okt'26)*:** `KOL_ADK` adalah kolektibilitas **atas nama CIF** (level debitur), sedangkan **Umur Tunggakan** adalah jumlah hari yang telah lewat dari jatuh tempo angsuran bulanan **rekening tsb** (level rekening). Jadi sebuah rekening bisa saja Umur Tunggakannya minus (lancar) tetapi KOL_ADK-nya SML atau NPL — yang SML/NPL bisa jadi pinjaman lain atas CIF yang sama. "Tidak sejalan" berarti Umur Tunggakan rekening tidak mencapai rentang kolektibilitasnya; sebagai acuan operasional dipakai rentang bagian 4 (Kol 2 ↔ 0–89 hari, Kol 3/4/5 ↔ ≥90 hari), mis. umur minus padahal Kol 2–5, atau umur <90 hari padahal Kol 3/4/5.

**KOL_ADK selalu dianggap mutlak benar** — tidak pernah dikoreksi meskipun tunggakan terbaca 0.

### Cara mencari penyebab one obligor:
- **Karena Kartu Kredit (CC):** cocokkan **CIF** (bukan nomor rekening) ke file `OBLIGOR BRIGUNA KPR WITH CARD`, gunakan sumber data **terbaru** yang tersedia. Dianggap "One Obligor CC" kalau CIF ditemukan **dan** kolektibilitas kartunya (`kol_adk` pada file tsb) ≥ 2.
- **Karena pinjaman lain (bukan CC):** cocokkan **CIF** yang sama ke pinjaman Briguna lain di LW321 (periode sebelumnya maupun periode berjalan — periode mengikuti nama/posisi file LW321 yang dipakai *(update 9 Okt'26)*) — kalau ada rekening lain a.n. CIF yang sama dengan kolektibilitas ≥ 2, itu indikasi "One Obligor Lainnya".
- Kalau tunggakan=0 tapi tidak ketemu penyebab CC maupun pinjaman lain, tetap dikategorikan "One Obligor Lainnya" (penyebab tidak teridentifikasi, tapi bukan tunggakan riil).

## 4. Logika "Kriteria Kredit" (detail)

```
1. Cek One Obligor dulu (Total Tunggakan = 0 ATAU Umur Tunggakan tidak sejalan KOL_ADK):
   - KOL_ADK = 1           → "Lancar"
   - KOL_ADK = 2           → "One Obligor SML"
   - KOL_ADK = 3/4/5       → "One Obligor NPL"   (tidak dirinci sub-bucket)

2. Kalau BUKAN one obligor (tunggakan riil, sejalan dengan KOL_ADK):
   - KOL_ADK = 1           → "Lancar"
   - KOL_ADK = 2, berdasar Umur Tunggakan:
       0–29 hari           → "SML 1"
       30–60 hari          → "SML 2"
       61–89 hari          → "SML 3"
   - KOL_ADK = 3/4/5, berdasar Umur Tunggakan:
       90–119 hari         → "NPL Baru"
       > 119 hari, cek umur pinjaman (PERIODE − TGL_REALISASI):
           < 2 tahun       → "NPL Dibawah 2 Tahun"
           ≥ 2 tahun       → "NPL"
```

Catatan: kolom **Kualitas Kredit** tetap "SML"/"NPL" apa adanya walaupun Kriteria Kredit-nya "One Obligor ..." — one-obligor cuma memperjelas *kenapa*, bukan mengubah status kualitas kreditnya.

---

## Riwayat perubahan setelah v4

- 9 Okt'26: ditambahkan penjelasan KOL_ADK (level CIF) vs Umur Tunggakan (level rekening) sebagai dasar kriteria "tidak sejalan".
- 9 Okt'26: frasa "Juni maupun Juli" diganti menjadi periode sebelumnya/berjalan sesuai nama file LW321 yang dipakai.

## Sub-ketentuan terkait

- [01_dasar_definisi_kolom_dan_sumber_data.md](01_dasar_definisi_kolom_dan_sumber_data.md) — definisi kolom (Umur Tunggakan, Total Tunggakan, KOL_ADK)
- [03_format_nominatif_dan_rekap_kualitas_kredit.md](03_format_nominatif_dan_rekap_kualitas_kredit.md) — header nominatif & desain tabel rekap one-obligor (bagian 3 & 7)
