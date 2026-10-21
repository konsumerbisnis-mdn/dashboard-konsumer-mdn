# 06 · Penetrasi Data Leads & Slicing ASTRI (ASN/TNI/POLRI)

*Sub-ketentuan dari Ketentuan Olah Data LW321 v4 · file `06_penetrasi_leads_dan_slicing_astri.md` · indeks: [00_INDEX.md](00_INDEX.md)*

## Tujuan
Metodologi baku (sudah final) untuk mengukur berapa leads yang sudah realisasi di portofolio, plus pemecahan per segmen ASN/TNI/POLRI dan per produk.

## Kapan dirujuk
- Rekap penetrasi leads Ritel / Mikro.
- Sisa potensi leads.
- Analisis leads per segmen ASTRI atau per produk realisasi.

## Konteks minimum
- Sumber acuan tunggal = **LW321 posisi terbaru**; join via CIF.
- Produk ditentukan dari `DESCRIPTION` LW321 ([01_dasar_definisi_kolom_dan_sumber_data.md](01_dasar_definisi_kolom_dan_sumber_data.md), bagian 1).
- Daftar file leads & kolom segmennya: [05_data_leads_sumber_dan_kolom.md](05_data_leads_sumber_dan_kolom.md).

> **Catatan penomoran:** isi aturan di bawah disalin dari `ketentuan_olah_data_LW321_v4.md`, termasuk nomor bagian aslinya. Perubahan setelah v4 ditandai *(update …)* atau *(sementara …)*. Jika teks menyebut "bagian X" atau "Lampiran A/B", cari file-nya di tabel *Peta Bagian Asal* pada [00_INDEX.md](00_INDEX.md).

---

# ATURAN

### 10.6 Rekap Penetrasi Data Leads (metodologi FINAL — sudah dieksekusi)
- **Sumber acuan TUNGGAL: LW321 posisi terbaru** (contoh eksekusi: 19 Jul'26) untuk SEMUA komponen — status penetrasi, sisa OS, tanggal realisasi, kolektibilitas, produk, kanca. **Jangan campur sumber lain** (mis. Data Debitur bulan sebelumnya) — konsekuensinya:
  - Hanya **2 status**: `SUDAH REAL` (CIF ketemu di LW321 posisi tsb) / `BELUM REAL` (tidak ketemu). **Tidak ada kategori "Real Lunas/Tidak Aktif"** — kategori itu butuh sumber kedua dan sudah ditolak.
- **1 rekening terpilih per CIF** = rekening dengan **tanggal realisasi TERBARU** (gabungan semua produk). Nominatif memakai **satu set kolom realisasi** dengan kolom **"Ritel/Mikro"** sebagai pembeda segmen produk: Norek, Sisa OS, Kolek (posisi yang sama), Tgl Real Terbaru, Kanca. (Konsekuensi: CIF yang punya Ritel & Mikro sekaligus dihitung di produk rekening terbarunya saja.)
- Leads Ritel maupun Mikro sama-sama dicek ke **seluruh** portofolio (Ritel+Mikro) supaya cross-sell kelihatan (leads Ritel yang closing di Mikro, dan sebaliknya).
- Laporan **terpisah** untuk leads Ritel dan leads Mikro. Rekap per instansi memakai nama **raw apa adanya dari leads**.
- Struktur output baku (1 file): **Rekap Garis Besar** (per kategori leads: total, real di Ritel Deb+OS, real di Mikro Deb+OS, % penetrasi, sisa potensi) + **Rekap Instansi Ritel & Mikro** (per file leads × instansi raw) + **Nominatif Ritel & Mikro** (autofilter, freeze header).
- **Sisa potensi** = leads yang CIF-nya tidak ketemu di LW321 posisi acuan.

### 10.8 Slicing ASTRI (ASN/TNI/POLRI) dari Data Leads
- **Dari leads Ritel**: langsung pakai 3 file SPAN (ASN/TNI/POLRI) — segmen = nama filenya.
- **Dari leads Mikro**: filter kolom segmen di masing-masing file — `SEGMEN INSTANSI` (LEADS_PRA_PURNA_MIKRO) dan `jenis_pekerjaan` (Leads_Briguna_Mikro), ambil nilai ASN/TNI/POLRI saja.
- **Produk realisasi detail** (Briguna Karya / Purna / Pra-Purna (Umum) / Mikro) ditentukan dari `DESCRIPTION` rekening terpilih di LW321 (aturan bagian 1), dengan metodologi rekening terpilih yang sama seperti 10.6.
- Output baku: Rekap Garis Besar (Kategori Leads × Segmen → real per produk fokus + sisa potensi), Rekap per Produk (semua produk), Nominatif gabungan.

---

## Sub-ketentuan terkait

- [05_data_leads_sumber_dan_kolom.md](05_data_leads_sumber_dan_kolom.md) — daftar 9 file Leads, kolom segmen (`SEGMEN INSTANSI`, `jenis_pekerjaan`) dan plafond
- [01_dasar_definisi_kolom_dan_sumber_data.md](01_dasar_definisi_kolom_dan_sumber_data.md) — pemisahan produk dari `DESCRIPTION` dan definisi kolektibilitas
- [13_master_kanca_area_unit_dedicated.md](13_master_kanca_area_unit_dedicated.md) — nama kanca/area untuk rekap
