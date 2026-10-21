# 08 · LW325 — Nominatif PH (Hapus Buku)

*Sub-ketentuan dari Ketentuan Olah Data LW321 v4 · file `08_lw325_ph_hapus_buku.md` · indeks: [00_INDEX.md](00_INDEX.md)*

## Tujuan
Cara membaca file LW325 (kumulatif rekening PH), filter Briguna Ritel, dan cara memakainya untuk memisahkan NPL yang lunas riil vs di-PH.

## Kapan dirujuk
- Menghitung PH per bulan.
- Mengisi variabel PH dan "UG NPL ke L/Lunas" pada tabel pergerakan DG/UG historis.

## Konteks minimum
- `NOMOR_REKENING` LW325 dibandingkan ke `NOMOR_REKENING` LW321 setelah dinormalisasi jadi string.
- Kerangka 7 variabel pergerakan ada di [09_pergerakan_dg_ug_historis_prognosa.md](09_pergerakan_dg_ug_historis_prognosa.md).

> **Catatan penomoran:** isi aturan di bawah disalin dari `ketentuan_olah_data_LW321_v4.md`, termasuk nomor bagian aslinya. Perubahan setelah v4 ditandai *(update …)* atau *(sementara …)*. Jika teks menyebut "bagian X" atau "Lampiran A/B", cari file-nya di tabel *Peta Bagian Asal* pada [00_INDEX.md](00_INDEX.md).

---

# ATURAN

## 11. LW325 — Nominatif PH (Hapus Buku)

File `2023_LW325_PH_V7...xlsx` (sheet tunggal, header di baris 8) adalah daftar **kumulatif seluruh rekening yang sudah di-PH (Penghapusbukuan/write-off)** sejak tahun-tahun lampau sampai posisi terbaru — bukan hanya bulan berjalan, jadi **wajib difilter TGL PH** sesuai periode yang dibutuhkan.

### 11.1 Definisi kolom
- **`TGL PH`** — tanggal debitur tsb di-PH (write-off). Ini kolom filter utama untuk analisis per periode/bulan.
- **`SISA AKHIR PH POKOK`** — OS akhir (pokok) pada saat/setelah PH. Ini nilai nominal PH yang dipakai untuk agregasi (bukan `SISA AWAL PH POKOK`, yang mencerminkan kondisi sebelum PH).
- **`DESKRIPSI SEGMEN`** — deskripsi produk, dipakai untuk filter Briguna Ritel. Berisi string seperti `"KREDIT RITEL - KONSUMTIF - NON CASH COLATERAL - KRETAP"`. Filter dengan **contains** (bukan exact match) untuk 3 kata kunci berikut, yang seluruhnya termasuk **Briguna Ritel**:
  - `KRESUN` (= Briguna Purna)
  - `KRETAP` (= Briguna Karya)
  - `BRIGUNA UMUM` (= Briguna Pra-Purna)
  - *(Selain 3 itu ada juga KPR, `KREDIT PEGAWAI`, dan produk lain di file yang sama — bukan Briguna Ritel, jangan diikutkan.)* *(update 9 Okt'26)*
- **`NOMOR_REKENING`** — numerik, format sudah bersih (tanpa leading zero berlebih), langsung sebanding dengan `NOMOR_REKENING` LW321 setelah dinormalisasi jadi string.

### 11.2 Cara pakai untuk analisis pergerakan DG/UG bulanan
- Total **PH per bulan** = `SUM(SISA AKHIR PH POKOK)` untuk baris dengan `TGL PH` jatuh di bulan tsb, setelah difilter Ritel (11.1).
- Untuk memisahkan **"NPL ke Lunas riil"** vs **"PH"** di antara rekening NPL yang hilang dari LW321 bulan berjalan: cocokkan `NOMOR_REKENING` rekening yang hilang ke daftar PH LW325 (any-time, tidak perlu match bulan persis, karena TGL PH bisa beda tipis dengan tanggal cut-off LW321) —
  - **Match ketemu** → masuk kolom **PH**.
  - **Tidak ketemu** → diasumsikan **Lunas riil** (masuk kolom "NPL ke L/Lunas" bersama rekening yang naik tier ke Lancar).

---

## Riwayat perubahan setelah v4

- 9 Okt'26: `KREDIT PEGAWAI` **dikeluarkan** dari filter Briguna Ritel di LW325. Briguna Ritel hanya Karya (KRETAP), Purna (KRESUN), dan Pra-Purna (BRIGUNA UMUM) — konsisten dengan definisi LW321 (bagian 1). Angka PH Ritel yang pernah dihitung dengan KREDIT PEGAWAI perlu dihitung ulang bila dipakai lagi.

## Sub-ketentuan terkait

- [09_pergerakan_dg_ug_historis_prognosa.md](09_pergerakan_dg_ug_historis_prognosa.md) — tabel 7 variabel pergerakan DG/UG yang memakai PH
- [01_dasar_definisi_kolom_dan_sumber_data.md](01_dasar_definisi_kolom_dan_sumber_data.md) — definisi Briguna Ritel di LW321
