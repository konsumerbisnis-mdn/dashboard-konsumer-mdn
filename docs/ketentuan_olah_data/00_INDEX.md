# INDEKS — Ketentuan Olah Data LW321 (v4, dipecah per sub-ketentuan)

Folder ini memecah `ketentuan_olah_data_LW321_v4.md` menjadi sub-ketentuan per topik/tahap. **Cara pakai:** cari task di tabel *Panduan per task*, buka hanya file yang tercantum. Setiap file berisi: tujuan, kapan dirujuk, konteks minimum, aturan (disalin dari v4; perubahan sesudahnya ditandai *(update …)* / *(sementara …)*), riwayat perubahan, dan tautan ke file terkait.

## Daftar sub-ketentuan

| File | Isi | Bagian asal v4 |
|---|---|---|
| [01_dasar_definisi_kolom_dan_sumber_data.md](01_dasar_definisi_kolom_dan_sumber_data.md) | Definisi kolom LW321, pemisah produk, SML/NPL, CIF, format angka kolektibilitas, aturan pemilihan posisi data | 1, 5, 9 |
| [02_one_obligor_dan_kriteria_kredit.md](02_one_obligor_dan_kriteria_kredit.md) | Deteksi one obligor (CC / pinjaman lain) & logika Kriteria Kredit | 2, 4 |
| [03_format_nominatif_dan_rekap_kualitas_kredit.md](03_format_nominatif_dan_rekap_kualitas_kredit.md) | Header nominatif kualitas kredit, aturan khusus Mikro, desain tabel rekap, kolom Instansi di nominatif top-N | 3, 6, 7, 14 |
| [04_database_instansi_kurasi.md](04_database_instansi_kurasi.md) | Database instansi: kolom instansi, kurasi INSTANSI_ASAL/FINAL/GENERAL, SEGMEN_FINAL, sheet pendamping | 10 (pengantar), 10.1–10.4 |
| [05_data_leads_sumber_dan_kolom.md](05_data_leads_sumber_dan_kolom.md) | 9 file Leads: kolom instansi/segmen/plafond, aturan pemakaian & dedup CIF | 10.5 |
| [06_penetrasi_leads_dan_slicing_astri.md](06_penetrasi_leads_dan_slicing_astri.md) | Metodologi penetrasi leads (final) & slicing ASTRI | 10.6, 10.8 |
| [07_instansi_tidak_terdeteksi.md](07_instansi_tidak_terdeteksi.md) | Rekap instansi tidak terdeteksi | 10.7 |
| [08_lw325_ph_hapus_buku.md](08_lw325_ph_hapus_buku.md) | LW325 — PH/hapus buku | 11 |
| [09_pergerakan_dg_ug_historis_prognosa.md](09_pergerakan_dg_ug_historis_prognosa.md) | Pergerakan DG/UG: 7 variabel, rumus, historis vs prognosa, nominatif top-N | 12 |
| [10_format_kpi_kinerja_prognosa.md](10_format_kpi_kinerja_prognosa.md) | Format KPI Kinerja & Prognosa, arah %Penc | 13 |
| [11_database_kinerja_keragaan_dan_rka.md](11_database_kinerja_keragaan_dan_rka.md) | Database kinerja: struktur 4 sheet, satuan, keragaan, RKA | 15 (pengantar), 15.1–15.4, 15.7 |
| [12_database_disburse_dan_rm.md](12_database_disburse_dan_rm.md) | Database disburse & master RM, alur input disburse baru | 15.5, 15.6 |
| [13_master_kanca_area_unit_dedicated.md](13_master_kanca_area_unit_dedicated.md) | Area Head, Lampiran A (kanca–area), Lampiran B (unit dedicated) | 8, Lampiran A, Lampiran B |
| [15_update_materi_briguna.md](15_update_materi_briguna.md) | Update materi PPT Briguna: peta slide → sumber → rumus, mode tanggal, SML berjalan, angka yang wajib ditanyakan | baru (15 Okt'26) |
| [16_database_dashboard_briguna_gsheet.md](16_database_dashboard_briguna_gsheet.md) | Database utama Dashboard Briguna (Google Sheets): struktur 5 sheet, temuan kualitas data (lokal angka), cara pengisian, keamanan | baru (20 Okt'26) |
| [17_dashboard_konsumer_web.md](17_dashboard_konsumer_web.md) | Dashboard Konsumer RO Medan (gabungan Briguna + KPR): 6 menu, aturan hitung Konsumer/KPR Subsidi/DG-UG, sheet produktivitas KPR & `RM & KC card`, upload, peran, unduhan, istilah RPC, tampilan/SFX, upgrade | baru (21 Okt'26) |
| [18_brispot_warm_hot_leads.md](18_brispot_warm_hot_leads.md) | Brispot Briguna per jam: klasifikasi Warm/Hot (3 tahap)/Cair (sheet Rule), plafon vs net OS, unik per NIK, Rencana Real & Guidance, output persis layout sheet RM BGRITEL / KC BGRITEL / Mantri BGMIKRO / Unit BGMIKRO | baru (21 Okt'26) |

## Panduan per task — file mana yang dibuka

| Task | Buka file | Opsional |
|---|---|---|
| Nominatif kualitas kredit Ritel/Mikro (Kualitas & Kriteria Kredit) | 01, 02, 03 | 13 |
| Analisis penyebab SML/NPL / rekap one obligor per cabang | 02, 03 | 01, 13 |
| New SML/NPL atau perbandingan 2 posisi LW321 | 01, 02 | 03 |
| Database instansi / instansi bersih dari Data Debitur | 04, 05 | 01 |
| Kolom Instansi cepat untuk nominatif top-N | 03 (bagian 14) | 04 |
| Konsolidasi / penggabungan file leads | 05 | 01 |
| Penetrasi leads Ritel/Mikro, sisa potensi | 05, 06 | 13 |
| Leads per segmen ASN/TNI/POLRI (ASTRI) | 05, 06 | — |
| Rekap instansi tidak terdeteksi | 07, 04 | 05 |
| PH per bulan / pemisahan NPL lunas vs PH | 08 | 09 |
| Tabel pergerakan DG/UG historis | 09, 08 | 01 |
| Prognosa SML/NPL bulan depan + nominatif top-N | 09 | 03, 08 |
| Laporan KPI kinerja vs RKA, %Penc | 10, 11 | 13 |
| Kinerja per cabang/area dari keragaan | 11, 13 | 10 |
| Input data disburse baru dari chat | 12 | 11, 13 |
| Pencapaian target RM | 12 | 11 |
| Mapping kode uker / unit dedicated / Area Head | 13 | 11 |
| Update materi / PPT Briguna | 15 | 09, 10, 11, 12, 08, 04 |
| Dashboard Briguna / database Google Sheets | 16 | 11, 12, 13, 02 |
| Dashboard Konsumer (Briguna + KPR) — website, menu, sheet produktivitas KPR, foto RM/ikon KC, unduhan | 17, 16 | 09, 10, 11, 12, 13 |
| Warm/Hot leads Brispot per RM/Mantri & per uker (tarikan per jam) | 18 | 13, 17 |

## Alur & ketergantungan antar sub-ketentuan

```
01 Dasar (kolom, produk, CIF, posisi data) ──┬─> 02 One obligor & Kriteria ──> 03 Format nominatif & rekap
                                            ├─> 09 Pergerakan DG/UG <── 08 LW325 PH
                                            │         └──> (nominatif top-N: kolom Instansi di 03/bag.14)
                                            ├─> 04 Kurasi instansi <── 05 Data Leads ──> 06 Penetrasi & ASTRI
                                            │         └──> 07 Instansi tidak terdeteksi
13 Master kanca/area/unit ──> dipakai 03, 06, 11, 12, 18
11 Database kinerja (keragaan, RKA) ──> 10 Format KPI & %Penc
11 ──> 12 Disburse & RM (input data baru, pencapaian RM)
09, 10, 11, 12, 08, 04, 06 ──> 15 Update materi Briguna
11, 12, 13, 02 ──> 16 Database dashboard (Google Sheets)
16, 09, 10 ──> 17 Dashboard Konsumer (Briguna + KPR)
Brispot (per jam) ──> 18 Warm/Hot leads ──> (pipeline di 17)
```

## Peta Bagian Asal → File

Dipakai bila teks aturan merujuk "bagian X" (nomor bagian asli v4 dipertahankan di setiap file).

| Bagian asal v4 | File |
|---|---|
| Bagian 1 — Definisi Dasar Kolom LW321 | [01_dasar_definisi_kolom_dan_sumber_data.md](01_dasar_definisi_kolom_dan_sumber_data.md) |
| Bagian 2 — Deteksi One Obligor | [02_one_obligor_dan_kriteria_kredit.md](02_one_obligor_dan_kriteria_kredit.md) |
| Bagian 3 — Header Wajib Nominatif Kualitas Kredit | [03_format_nominatif_dan_rekap_kualitas_kredit.md](03_format_nominatif_dan_rekap_kualitas_kredit.md) |
| Bagian 4 — Logika Kriteria Kredit | [02_one_obligor_dan_kriteria_kredit.md](02_one_obligor_dan_kriteria_kredit.md) |
| Bagian 5 — Format Angka Kolektibilitas | [01_dasar_definisi_kolom_dan_sumber_data.md](01_dasar_definisi_kolom_dan_sumber_data.md) |
| Bagian 6 — Ketentuan Khusus Data Mikro | [03_format_nominatif_dan_rekap_kualitas_kredit.md](03_format_nominatif_dan_rekap_kualitas_kredit.md) |
| Bagian 7 — Desain Tabel Rekap one-obligor | [03_format_nominatif_dan_rekap_kualitas_kredit.md](03_format_nominatif_dan_rekap_kualitas_kredit.md) |
| Bagian 8 — Area Head | [13_master_kanca_area_unit_dedicated.md](13_master_kanca_area_unit_dedicated.md) |
| Bagian 9 — Sumber Data | [01_dasar_definisi_kolom_dan_sumber_data.md](01_dasar_definisi_kolom_dan_sumber_data.md) |
| Bagian 10 (pengantar), 10.1–10.4 — Database Instansi & kurasi | [04_database_instansi_kurasi.md](04_database_instansi_kurasi.md) |
| Bagian 10.5 — Data Leads | [05_data_leads_sumber_dan_kolom.md](05_data_leads_sumber_dan_kolom.md) |
| Bagian 10.6 — Rekap Penetrasi Data Leads | [06_penetrasi_leads_dan_slicing_astri.md](06_penetrasi_leads_dan_slicing_astri.md) |
| Bagian 10.7 — Instansi Tidak Terdeteksi | [07_instansi_tidak_terdeteksi.md](07_instansi_tidak_terdeteksi.md) |
| Bagian 10.8 — Slicing ASTRI | [06_penetrasi_leads_dan_slicing_astri.md](06_penetrasi_leads_dan_slicing_astri.md) |
| Bagian 11 — LW325 PH (Hapus Buku) | [08_lw325_ph_hapus_buku.md](08_lw325_ph_hapus_buku.md) |
| Bagian 12 — Pergerakan DG/UG (Historis & Prognosa) | [09_pergerakan_dg_ug_historis_prognosa.md](09_pergerakan_dg_ug_historis_prognosa.md) |
| Bagian 13 — Format KPI Kinerja & Prognosa | [10_format_kpi_kinerja_prognosa.md](10_format_kpi_kinerja_prognosa.md) |
| Bagian 14 — Kolom Instansi di Nominatif Top-N | [03_format_nominatif_dan_rekap_kualitas_kredit.md](03_format_nominatif_dan_rekap_kualitas_kredit.md) |
| Bagian 15 (pengantar), 15.1–15.4, 15.7 — Database Kinerja: keragaan & RKA | [11_database_kinerja_keragaan_dan_rka.md](11_database_kinerja_keragaan_dan_rka.md) |
| Bagian 15.5–15.6 — Database Disburse & RM | [12_database_disburse_dan_rm.md](12_database_disburse_dan_rm.md) |
| Lampiran A — Master kode kanca–nama–area | [13_master_kanca_area_unit_dedicated.md](13_master_kanca_area_unit_dedicated.md) |
| Lampiran B — 29 unit dedicated Briguna Mikro | [13_master_kanca_area_unit_dedicated.md](13_master_kanca_area_unit_dedicated.md) |

## Riwayat perubahan setelah v4 (9 Okt'26)

Folder ini **lebih baru** dari `ketentuan_olah_data_LW321_v4.md` utuh pada poin-poin berikut:

- [01](01_dasar_definisi_kolom_dan_sumber_data.md) — DESCRIPTION berisi "PRA PURNA" masuk Briguna Pra-Purna.
- [02](02_one_obligor_dan_kriteria_kredit.md) — penjelasan KOL_ADK (level CIF) vs Umur Tunggakan (level rekening) untuk kriteria "tidak sejalan"; periode LW321 mengikuti nama file.
- [08](08_lw325_ph_hapus_buku.md) — `KREDIT PEGAWAI` dikeluarkan dari filter PH Briguna Ritel.
- [11](11_database_kinerja_keragaan_dan_rka.md) — rujukan disburse 15.4 → 15.5.
- [15](15_update_materi_briguna.md) — *(15 Okt'26)* file baru untuk update materi PPT Briguna. Catatan: nama sheet DB Keragaan kini `Keragaan`, `RKA`, `Disburse`, `Database RM` (di file 11 masih nama lama).
- [16](16_database_dashboard_briguna_gsheet.md) — *(20 Okt'26)* file baru: database utama dashboard di Google Sheets (5 sheet, termasuk disburse Mikro yang sebelumnya belum tersedia) dan temuan angka rusak akibat lokal spreadsheet.
- [17](17_dashboard_konsumer_web.md) — *(21 Okt'26)* file baru: Dashboard Konsumer gabungan Briguna + KPR — Konsumer = Ritel + Mikro + KPR (penjumlahan ketat), KPR Subsidi = FLPP/Sejahtera atau plafon ≤ 185 jt, istilah **DSR → RPC**, produktivitas per bulan + carry over, unduhan Excel/CSV/PDF/PNG per tabel/grafik, sheet `Database History`/`Database Monthly` (produktivitas KPR) dan `RM & KC card`, sheet `LW321 KPR` (+ bulan lalu), peran Admin/RM/Guest. *(update 21 Okt'26)* deteksi Ritel vs Mikro Brispot dikonfirmasi (kata "Unit" di UNIT KERJA).
- [18](18_brispot_warm_hot_leads.md) — *(21 Okt'26)* file baru: Brispot warm/hot leads. Warm/Hot pakai plafon, Cair pakai net OS; unik per NIK; leads = seluruh nominatif; "Pencairan berhasil diputus" tetap "-"; sheet Debitur Gajadi & kolom tindak lanjut diabaikan; filter SEGMEN tidak diperlukan (nama RM/Mantri sudah menentukan segmen); sumber Rencana Real = RM BGRITEL Z6 / Mantri BGMIKRO AB6. Output **persis layout 4 sheet template** (RM BGRITEL, KC BGRITEL, Mantri BGMIKRO, Unit BGMIKRO; tabel atas urutan LIST + tabel bawah tersortir untuk dikirim, teks WA).

## ⏳ Aturan sementara (menunggu penjelasan lanjutan user)

- [03](03_format_nominatif_dan_rekap_kualitas_kredit.md) — one obligor tak teridentifikasi masuk kolom "DG karena Obligor produk lain" (bagian 7).
- [03](03_format_nominatif_dan_rekap_kualitas_kredit.md) — INSTANSI_ASAL nominatif top-N memakai urutan lengkap 10.2 termasuk Data Leads (bagian 14).
- [15](15_update_materi_briguna.md) — struktur kolom file Managing Portofolio belum diketahui (dicatat setelah file pertama diunggah).
- [16](16_database_dashboard_briguna_gsheet.md) — sheet target RM (`database RM`) belum ada di database Google Sheets; pemetaan PN_AO disburse Mikro ke nama mantri belum ditentukan.
- [17](17_dashboard_konsumer_web.md) — aturan KPR Subsidi (FLPP/Sejahtera atau plafon ≤ 185 jt) masih asumsi; hak pakai logo & audio pembuka di situs publik belum dikonfirmasi.
- [18](18_brispot_warm_hot_leads.md) — Pencairan Sukses dibatasi tanggal hari tarikan (mengikuti template, belum dikonfirmasi eksplisit); selisih unit mantri LIST vs Brispot menunggu konfirmasi.

## Aturan pemeliharaan

- Ketentuan baru/perubahan ditulis ke **sub-file yang relevan saja**, lalu perbarui tabel di indeks ini bila ada file/topik baru.
- Aturan dokumen asli v4 (dikutip di bawah) menyatakan "hanya 1 file ketentuan aktif di Project". Sejak update 9 Okt'26, `ketentuan_olah_data_LW321_v4.md` utuh **sudah tertinggal** (lihat Riwayat perubahan) — bila ada perbedaan, **folder ini yang berlaku**. **Menunggu keputusan user:** arsipkan/hapus file v4 utuh setelah pemecahan ini diverifikasi, agar sumber aturan tetap tunggal (folder ini).

## Catatan dari dokumen asli v4

> Dikutip apa adanya dari kepala dan kaki dokumen v4.

> # KETENTUAN OLAH DATA LW321 (v4 — konsolidasi)
>
> Dokumen ini menggantikan `ketentuan_olah_data_LW321_v3`. Berisi seluruh ketentuan standing instruction ("untuk selanjutnya...") yang disepakati sepanjang diskusi pengolahan data LW321.
>
> **Perubahan v4:** penambahan **Bagian 15 — Database Kinerja (Keragaan / Disburse / RKA / RM)** beserta seluruh aturan turunannya (satuan, anti double-count, alur pengisian data disburse baru, arah %Penc per mata anggaran), serta **Lampiran A** (master kode kanca–nama–area) dan **Lampiran B** (mapping 29 unit dedicated Briguna Mikro ke kanca induk).
>
>
> *Dokumen ini disusun dari kesepakatan sepanjang sesi kerja pengolahan data LW321. Update dokumen ini (hapus versi lama di Project knowledge, unggah versi baru) setiap kali ada ketentuan baru yang disepakati — hanya 1 file ketentuan aktif di Project.*
