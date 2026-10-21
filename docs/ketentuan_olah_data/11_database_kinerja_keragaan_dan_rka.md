# 11 · Database Kinerja: Struktur File, Keragaan, dan RKA

*Sub-ketentuan dari Ketentuan Olah Data LW321 v4 · file `11_database_kinerja_keragaan_dan_rka.md` · indeks: [00_INDEX.md](00_INDEX.md)*

## Tujuan
Aturan membaca file `Database Keragaan Disburse RKA.xlsx`: struktur 4 sheet, satuan angka, hubungan keragaan ↔ LW321, aturan anti double-count keragaan, dan aturan sheet RKA (kode uker khusus, Uker 201).

## Kapan dirujuk
- Laporan kinerja per cabang/area dari keragaan.
- Membandingkan realisasi vs RKA.
- Tren OS/DEB/SML/NPL historis per cabang.
- Menambah (append) data baru ke file database.

## Konteks minimum
- Mapping kode uker → nama kanca → area, dan 29 unit dedicated: [13_master_kanca_area_unit_dedicated.md](13_master_kanca_area_unit_dedicated.md).
- Arah %Penc per jenis KPI: [10_format_kpi_kinerja_prognosa.md](10_format_kpi_kinerja_prognosa.md).
- Aturan sheet `database disburse` & `database RM`: [12_database_disburse_dan_rm.md](12_database_disburse_dan_rm.md).

> **Catatan penomoran:** isi aturan di bawah disalin dari `ketentuan_olah_data_LW321_v4.md`, termasuk nomor bagian aslinya. Perubahan setelah v4 ditandai *(update …)* atau *(sementara …)*. Jika teks menyebut "bagian X" atau "Lampiran A/B", cari file-nya di tabel *Peta Bagian Asal* pada [00_INDEX.md](00_INDEX.md).

---

# ATURAN

## 15. Database Kinerja — `Database Keragaan Disburse RKA.xlsx`

File tunggal berisi **4 sheet**, jadi sumber baku untuk angka kinerja cabang, realisasi disburse, target RKA, dan master RM. **File ini di-update berkala (append)** — selalu pakai posisi terbaru, dan pastikan tidak ada duplikasi saat menambah data.

### 15.1 Struktur & grain

| Sheet | Grain | Kolom kunci | Cakupan (per posisi Jul'26) |
|---|---|---|---|
| `database keragaan` | kode uker × tanggal × produk | Uker, Tanggal, Desc, DEB, OS, DPK, NPL, DEB DPK, DEB NPL | 31 Des'22 – berjalan |
| `database disburse` | per rekening realisasi | lihat 15.5 *(update 9 Okt'26)* | 1 Jan'26 – berjalan, **Ritel saja** |
| `database RM` | RM × bulan (**header di baris 2**) | Bulan, KANCA, Nama RM, JG, Target, PN AO, PN AO 9 dig | Jan'26 – berjalan |
| `RKA` | mata anggaran × kode uker × bulan | Mata Anggaran, KODE UKER, UNIT KERJA, kolom per akhir bulan | Jan'25 – Des'26 |

### 15.2 Satuan angka (WAJIB diperhatikan sebelum membandingkan)
- `database keragaan` → **Rp Juta**
- `database disburse` → **Rp Juta**
- `database RM` kolom Target → **Rp Juta**
- `RKA` → **Rupiah penuh** (harus dibagi 1.000.000 dulu sebelum dibandingkan dengan keragaan/disburse)

### 15.3 Hubungan keragaan ↔ LW321
**Angka keragaan = angka LW321.** Bedanya hanya level penyajian: LW321 = detail per debitur, keragaan/KAP = angka kinerja per cabang langsung. Jadi tidak perlu rekonsiliasi/pemilihan "mana yang resmi" — keduanya sumber yang sama. Untuk laporan kinerja per cabang pakai keragaan; untuk nominatif/analisis per debitur pakai LW321.

### 15.4 `database keragaan` — aturan pakai
- **Nilai `Desc`**: Briguna Karya, Briguna Purna, Briguna Pra-Purna, **Briguna Ritel**, Briguna Mikro, **Briguna Mikro D**, KPR.
- **ANTI DOUBLE-COUNT (2 aturan wajib):**
  1. `Briguna Ritel` = **agregat** dari Karya + Purna + Pra-Purna (sudah diverifikasi identik). Jangan pernah menjumlahkan baris Ritel bersama ketiga komponennya.
  2. `Briguna Mikro D` = angka Briguna Mikro **hanya untuk 29 unit dedicated** (grain per unit), sedangkan `Briguna Mikro` = angka **per kanca** (sudah mencakup seluruh unit, termasuk yang dedicated). Jangan dijumlahkan bersama. Mapping unit dedicated → kanca induk: **Lampiran B**.
- **Default periode = EOM** (tanggal akhir bulan) kecuali user menyebut tanggal secara eksplisit. Data harian tersedia sejak ± Mar'25; sebelum itu hanya EOM.
- `DPK` di sheet ini = **kol 2 / SML** (bukan Dana Pihak Ketiga). `NPL` = kol 3/4/5.
- **Keterbatasan yang diketahui**: `DEB DPK` & `DEB NPL` baru terisi penuh mulai 2026 (2025 ±19%, 2024 ±11%, 2023 kosong) dan **belum ada sumber pengganti**. Untuk tren jumlah debitur SML/NPL, batasi ke periode yang tersedia dan beri catatan di output.
- Sheet ini hanya punya kode uker tanpa nama. Mapping kode → nama kanca → area: **Lampiran A**.

### 15.7 `RKA` — target
- Mata anggaran = kombinasi metrik × produk: `OS/DEB/DPK/NPL` × `BRIGUNA RITEL / BRIGUNA KARYA / BRIGUNA PURNA / BRIGUNA PRA-PURNA / BRIGUNA MIKRO / BRIGUNA MIKRO D / KPR`.
- Kolom bulan = akhir bulan Jan'25 s.d. Des'26.
- **Kode uker khusus**: `B` = **Total RO Medan** (baris agregat), `D` = **All Unit Dedicated Briguna Mikro** (agregat 29 unit).
- **Uker 201 = Kanwil/RO Medan** — sisa kredit pindahan dari Kantor Fungsional Aceh, **tidak ada target/RKA** di sana. Perlakuan: **realisasi 201 tetap dijumlahkan** ke total RO Medan, dan RKA level RO tetap memakai baris `B — Total RO Medan`.
- Arah %Penc mengikuti bagian 13 (SML/NPL = RKA ÷ Realisasi; OS/DEB = Realisasi ÷ RKA).

---

## Riwayat perubahan setelah v4

- 9 Okt'26: rujukan kolom kunci `database disburse` di tabel 15.1 dikoreksi dari 15.4 ke 15.5.

## Sub-ketentuan terkait

- [12_database_disburse_dan_rm.md](12_database_disburse_dan_rm.md) — sheet `database disburse` & `database RM` (bagian 15.5–15.6)
- [13_master_kanca_area_unit_dedicated.md](13_master_kanca_area_unit_dedicated.md) — Lampiran A & B
- [10_format_kpi_kinerja_prognosa.md](10_format_kpi_kinerja_prognosa.md) — arah %Penc (bagian 13)
- [01_dasar_definisi_kolom_dan_sumber_data.md](01_dasar_definisi_kolom_dan_sumber_data.md) — LW321 sebagai sumber per debitur
