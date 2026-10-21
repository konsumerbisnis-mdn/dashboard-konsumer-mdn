# 09 · Pergerakan DG/UG Kualitas Kredit — Historis & Prognosa

*Sub-ketentuan dari Ketentuan Olah Data LW321 v4 · file `09_pergerakan_dg_ug_historis_prognosa.md` · indeks: [00_INDEX.md](00_INDEX.md)*

## Tujuan
Kerangka 7 variabel pergerakan SML/NPL bulanan, rumus saldo akhir, definisi Net UG SML / Net DG NPL, cara mengisi variabel untuk data historis maupun prognosa, dan aturan nominatif top-N pergerakan.

## Kapan dirujuk
- Tabel pergerakan kualitas kredit bulanan (historis antar 2 posisi LW321).
- Prognosa/proyeksi SML-NPL bulan mendatang.
- Nominatif top-N rekening DG/UG.

## Konteks minimum
- Lancar/SML/NPL diturunkan dari `KOL_ADK` ([01_dasar_definisi_kolom_dan_sumber_data.md](01_dasar_definisi_kolom_dan_sumber_data.md)).
- PH historis dari LW325 ([08_lw325_ph_hapus_buku.md](08_lw325_ph_hapus_buku.md)).
- Kolom Instansi pada nominatif top-N: [03_format_nominatif_dan_rekap_kualitas_kredit.md](03_format_nominatif_dan_rekap_kualitas_kredit.md) (bagian 14).

> **Catatan penomoran:** isi aturan di bawah disalin dari `ketentuan_olah_data_LW321_v4.md`, termasuk nomor bagian aslinya. Perubahan setelah v4 ditandai *(update …)* atau *(sementara …)*. Jika teks menyebut "bagian X" atau "Lampiran A/B", cari file-nya di tabel *Peta Bagian Asal* pada [00_INDEX.md](00_INDEX.md).

---

# ATURAN

## 12. Metodologi Proyeksi Pergerakan DG/UG Kualitas Kredit (Prognosa & Historis)

7 variabel standar untuk tabel pergerakan kualitas kredit bulanan:

| Variabel | Arti | Kolom SML sheet | Kolom NPL sheet (cross-ref) |
|---|---|---|---|
| DG SML ke NPL | SML memburuk jadi NPL | `DG ke NPL` | `DG SML ke NPL` (=nilai sama) |
| Upgrade SML ke Lancar/LR | SML membaik jadi Lancar | `UG ke L` | — |
| SML yang Lunas | SML lunas (hilang dari portofolio) | `Lunas` | — |
| UG dari NPL ke SML | NPL membaik jadi SML | `UG NPL ke SML` | `UG ke SML` (=nilai sama) |
| DG Lancar/LR ke SML | Lancar memburuk jadi SML | `DG L ke SML` | — |
| UG dari NPL ke L/Lunas | NPL membaik jadi Lancar ATAU lunas riil | — | `UG ke L` |
| PH (Hapus Buku) | NPL di-write-off | — | `PH` |

Rumus saldo akhir:
```
Prognosa SML = Posisi SML − Lunas − DG ke NPL − UG ke L + DG L ke SML + UG NPL ke SML
Prognosa NPL = Posisi NPL − UG ke L(NPL) − UG ke SML − PH + DG SML ke NPL
```

**Baseline Posisi bulan berjalan = hasil Prognosa bulan sebelumnya** (chaining Juli→Agustus→September, dst).

### 12.1 "Net UG SML" / "Net DG NPL" — definisi
Ini **BUKAN** target/variabel independen terpisah dari 7 variabel di atas — melainkan **angka turunan** dari selisih Prognosa vs Posisi awal bulan itu:
```
Net UG SML (bulan X) = Posisi SML awal X − Prognosa SML akhir X   (positif = SML bersih menurun/membaik)
Net DG NPL (bulan X) = Prognosa NPL akhir X − Posisi NPL awal X   (positif = NPL bersih bertambah/memburuk)
```
Kalau user memberi target "Net UG SML = sekian" dan "Net DG NPL = sekian" untuk suatu bulan, itu otomatis terpenuhi selama total Prognosa SML/NPL bulan itu sudah sesuai target yang diberikan terpisah — **tidak perlu dipaksakan sebagai constraint tambahan pada salah satu dari 7 variabel**.

### 12.2 Cara isi 7 variabel per skenario data

**Historis (data aktual 2 periode tersedia)**: bandingkan langsung KOL_ADK per Nomor Rekening yang sama antar 2 periode LW321 berurutan (lihat pengelompokan Lancar/SML/NPL dari KOL_ADK, bagian 1). PH pakai LW325 (bagian 11), bukan estimasi/proksi.

**Prognosa (bulan belum ada data aktual)**, basis kandidat = LW321 posisi terbaru yang tersedia:
- **DG SML→NPL**: proyeksikan bulan *crossing* per rekening dari `NEXT_PMT_DATE` riil (bukan asumsi flat 30 hari/bulan) — dicari bulan pertama di mana `(akhir bulan target − NEXT_PMT_DATE) ≥ 90 hari`. Tiap rekening otomatis hanya masuk **satu** bulan proyeksi (tidak overlap).
- **Upgrade SML→Lancar & UG NPL→SML/Lunas**: rekening diurutkan dari Umur Tunggakan **terkecil**, dibagi rata 3 (atau N) kelompok bulan — kelompok tunggakan terpendek = bulan terdekat, dstnya.
- **DG Lancar→SML**: Lancar tidak punya Umur Tunggakan (belum menunggak), jadi distribusi ke bulan bersifat **random** (bukan proyeksi tanggal), pakai top-N rekening Lancar terbesar sebagai kandidat.
- **SML Lunas (prognosa)**: proyeksikan dari `TGL JATUH TEMPO` riil rekening SML — rekening yang jatuh tempo di bulan target dianggap lunas wajar bulan itu (jika tidak ada yang cocok, isi 0).
- **PH (prognosa)**: kalau user tidak berikan target eksplisit, tidak usah diisi/estimasi sepihak — biarkan kosong untuk diisi manual, ATAU tanya dulu ke user.

### 12.3 Aturan nominatif top-N pergerakan (lihat juga bagian 14)
- Nilai per rekening **selalu OS riil** dari data sumber — jangan pernah di-skalakan/estimasi proporsional (pernah dicoba, ditolak user).
- Kalau total OS riil dari kandidat top-N melebihi target agregat bulan itu, **batasi jumlah rekening yang ditampilkan** (kurang dari N) supaya tidak melebihi total — jangan paksa tampilkan semua N dengan baris "Sisa" jadi negatif.
- Tambahkan baris **"Sisa / rekening lainnya"** (= Total − jumlah top-N yang ditampilkan) dan baris **TOTAL** supaya rekonsiliasi ke angka pergerakan per cabang/agregat yang sudah ditetapkan.
- **Rekening antar bulan harus berbeda** (boleh sedikit yang sama secara kebetulan, tapi jangan sengaja pakai daftar sama tiap bulan) — capai ini lewat proyeksi bulan yang genuinely berbeda (12.2), bukan lewat random assignment semata kalau ada basis proyeksi yang lebih baik (tanggal/umur tunggakan).

---

## Sub-ketentuan terkait

- [08_lw325_ph_hapus_buku.md](08_lw325_ph_hapus_buku.md) — PH & pemisahan NPL lunas riil vs PH
- [01_dasar_definisi_kolom_dan_sumber_data.md](01_dasar_definisi_kolom_dan_sumber_data.md) — definisi KOL_ADK, Umur Tunggakan, pemilihan posisi data
- [03_format_nominatif_dan_rekap_kualitas_kredit.md](03_format_nominatif_dan_rekap_kualitas_kredit.md) — kolom Instansi di nominatif top-N (bagian 14)
- [10_format_kpi_kinerja_prognosa.md](10_format_kpi_kinerja_prognosa.md) — format KPI & %Penc — baseline chaining yang sama
