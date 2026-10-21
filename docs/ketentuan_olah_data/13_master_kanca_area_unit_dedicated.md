# 13 · Master Kanca, Area Head, dan Unit Dedicated Briguna Mikro

*Sub-ketentuan dari Ketentuan Olah Data LW321 v4 · file `13_master_kanca_area_unit_dedicated.md` · indeks: [00_INDEX.md](00_INDEX.md)*

## Tujuan
Tabel referensi kode uker → nama kanca → Area Head, dan mapping 29 unit dedicated Briguna Mikro ke kanca induk.

## Kapan dirujuk
- Setiap mapping kode uker ke nama cabang/area (LW321, keragaan, disburse, RKA).
- Membaca baris `Briguna Mikro D` atau mata anggaran `... BRIGUNA MIKRO D`.
- Rekap per Area Head.

## Konteks minimum
Tidak ada prasyarat. "KANWIL Medan" di LW321 = "RO Medan" (kode 201, non-area). Perlakuan RKA untuk Uker 201 ada di [11_database_kinerja_keragaan_dan_rka.md](11_database_kinerja_keragaan_dan_rka.md) (bagian 15.7).

> **Catatan penomoran:** isi aturan di bawah disalin dari `ketentuan_olah_data_LW321_v4.md`, termasuk nomor bagian aslinya. Perubahan setelah v4 ditandai *(update …)* atau *(sementara …)*. Jika teks menyebut "bagian X" atau "Lampiran A/B", cari file-nya di tabel *Peta Bagian Asal* pada [00_INDEX.md](00_INDEX.md).

---

# ATURAN

## 8. Area Head

Pembagian cabang → Area Head mengacu ke file `PEMBAGIAN AREA HEAD.xlsx` (kolom "Kantor Cabang" → "Area"). Catatan: "KANWIL Medan" pada data LW321 = "RO Medan" pada file pembagian area (tidak masuk ke Area manapun / non-area). **Master lengkap kode–nama–area: lihat Lampiran A.**

## Lampiran A — Master Kode Kanca, Nama, dan Area

Sumber: `PEMBAGIAN AREA HEAD.xlsx`. Dipakai untuk semua mapping kode uker → nama cabang → Area Head (keragaan, disburse, RKA, LW321).

| Kode Uker | Kantor Cabang | Area |
|---|---|---|
| 53 | KC Medan Putri Hijau | AREA 1 |
| 336 | KC Medan Iskandar Muda | AREA 1 |
| 367 | KC Medan Sisingamangaraja | AREA 1 |
| 404 | KC Medan Gatot Subroto | AREA 1 |
| 633 | KC Medan Thamrin | AREA 1 |
| 113 | KC Pematang Siantar | AREA 2 |
| 144 | KC Kabanjahe | AREA 2 |
| 194 | KC Sidikalang | AREA 2 |
| 228 | KC Rantau Prapat | AREA 2 |
| 314 | KC Balige | AREA 2 |
| 636 | KC Perdagangan | AREA 2 |
| 2062 | KC Kota Pinang | AREA 2 |
| 154 | KC Tanjung Balai | AREA 3 |
| 238 | KC Binjai | AREA 3 |
| 266 | KC Lubuk Pakam | AREA 3 |
| 283 | KC Tebing Tinggi | AREA 3 |
| 323 | KC Kisaran | AREA 3 |
| 638 | KC Stabat | AREA 3 |
| 85 | KC Sibolga | AREA 4 |
| 99 | KC Tarutung | AREA 4 |
| 135 | KC Padang Sidempuan | AREA 4 |
| 176 | KC Gunung Sitoli | AREA 4 |
| 637 | KC Panyabungan | AREA 4 |
| 1097 | KC Sibuhuan | AREA 4 |
| 201 | RO Medan | *(non-area — lihat 15.7)* |

Catatan: "KANWIL Medan" pada data LW321 = "RO Medan" (kode 201).

## Lampiran B — Mapping 29 Unit Dedicated Briguna Mikro → Kanca Induk

Dipakai untuk membaca baris `Briguna Mikro D` di sheet keragaan (yang hanya punya kode unit) dan RKA mata anggaran `... BRIGUNA MIKRO D`.

| Kode Unit | Nama Unit (sesuai RKA) | Kanca Induk |
|---|---|---|
| 3275 | Unit Sei Sikambing Medan Gatot | KC Medan Gatot Subroto (404) |
| 3382 | Unit Gatot Subroto Medan Gatot | KC Medan Gatot Subroto (404) |
| 3383 | Unit Kapten Muslim Medan Gatot | KC Medan Gatot Subroto (404) |
| 3530 | Unit Setiabudi Medan Gatot S | KC Medan Gatot Subroto (404) |
| 5325 | Unit Pasar Glugur Medan Gatot | KC Medan Gatot Subroto (404) |
| 3342 | Unit Belawan Medan Ismu | KC Medan Iskandar Muda (336) |
| 3532 | Unit Pasar Pringgan Medan Ismu | KC Medan Iskandar Muda (336) |
| 5328 | Unit Simpang Pos Medan Ismu | KC Medan Iskandar Muda (336) |
| 5329 | Unit Titi Kuning Medan Sisinga | KC Medan Sisingamangaraja (367) |
| 5326 | Unit Sidorame Medan Thamrin | KC Medan Thamrin (633) |
| 3352 | Unit Pasar Horas | KC Pematang Siantar (113) |
| 5342 | Unit Parluasan Pematang Siantar | KC Pematang Siantar (113) |
| 3375 | Unit Jatinegara Binjai | KC Binjai (238) |
| 3376 | Unit Bangkatan Binjai | KC Binjai (238) |
| 3276 | Unit Stabat | KC Stabat (638) |
| 3538 | Unit Sei Rampah Tebing Tinggi | KC Tebing Tinggi (283) |
| 3834 | Unit Ahmad Yani Tebing Tinggi | KC Tebing Tinggi (283) |
| 3535 | Unit Sisingamangaraja Sibolga | KC Sibolga (85) |
| 3536 | Unit Sisingamangaraja Sidikala | KC Sidikalang (194) |
| 5376 | Unit Salak Sidikalang | KC Sidikalang (194) |
| 3832 | Unit Teluk Dalam Gn Sitoli | KC Gunung Sitoli (176) |
| 5266 | Unit Diponegoro Gunung Sitoli | KC Gunung Sitoli (176) |
| 3833 | Unit Lau Cimba Kabanjahe | KC Kabanjahe (144) |
| 5288 | Unit Ahmad Dahlan Lubuk Pakam | KC Lubuk Pakam (266) |
| 5338 | Unit Padang Matinggi Padang Si | KC Padang Sidempuan (135) |
| 5339 | Unit Sisingamangaraja Padang S | KC Padang Sidempuan (135) |
| 5384 | Unit Teluk Nibung Tanjung Bala | KC Tanjung Balai (154) |
| 5393 | Unit Silindung Tarutung | KC Tarutung (99) |
| 7039 | Unit Samosir Balige | KC Balige (314) |

*Nama unit di RKA terpotong 30 karakter; kanca induk diturunkan dari sufiks nama unit dan sudah dikonfirmasi konsisten dengan Lampiran A.*

---

## Sub-ketentuan terkait

- [11_database_kinerja_keragaan_dan_rka.md](11_database_kinerja_keragaan_dan_rka.md) — aturan Uker 201, kode `B` dan `D` di RKA, anti double-count Mikro D
- [12_database_disburse_dan_rm.md](12_database_disburse_dan_rm.md) — pengisian Kantor Cabang clean pada data disburse
