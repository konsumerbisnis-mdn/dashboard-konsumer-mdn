# 10 · Format Output KPI "Kinerja & Prognosa" (Historis + Komitmen + RKA)

*Sub-ketentuan dari Ketentuan Olah Data LW321 v4 · file `10_format_kpi_kinerja_prognosa.md` · indeks: [00_INDEX.md](00_INDEX.md)*

## Tujuan
Standar penyajian laporan KPI (OS, SML, NPL nominal & rasio) per segmen: satuan, arah perhitungan %Penc, dan perlakuan bulan yang datanya belum ada.

## Kapan dirujuk
- Laporan KPI bulanan/kuartalan vs RKA.
- Menghitung %Penc (pencapaian) untuk KPI apa pun.

## Konteks minimum
- Angka realisasi per cabang dari sheet `database keragaan` (Rp Juta); target dari sheet `RKA` (**Rupiah penuh** — bagi 1.000.000 dulu). Detail: [11_database_kinerja_keragaan_dan_rka.md](11_database_kinerja_keragaan_dan_rka.md).
- Prognosa SML/NPL dari [09_pergerakan_dg_ug_historis_prognosa.md](09_pergerakan_dg_ug_historis_prognosa.md).

> **Catatan penomoran:** isi aturan di bawah disalin dari `ketentuan_olah_data_LW321_v4.md`, termasuk nomor bagian aslinya. Perubahan setelah v4 ditandai *(update …)* atau *(sementara …)*. Jika teks menyebut "bagian X" atau "Lampiran A/B", cari file-nya di tabel *Peta Bagian Asal* pada [00_INDEX.md](00_INDEX.md).

---

# ATURAN

## 13. Format Output "Kinerja & Prognosa" (KPI Historis + Komitmen + RKA)

Untuk laporan KPI bulanan/kuartalan (OS, SML Nominal, NPL Nominal, Rasio SML, Rasio NPL) per segmen (Konsumer/Briguna Ritel/KPR):

- Satuan nominal = **Rp Juta**. Kalau angka besar (≥1.000 Rp Juta) boleh dipersingkat ke format Miliar, mis. `9,258,719` → `9,258.7 M` atau gaya serupa, sesuai konteks presentasi.
- **%Penc (persen pencapaian)** untuk **KPI kualitas kredit (SML/NPL, nominal maupun rasio)** = **RKA ÷ Realisasi/Prognosa** — karena RKA di sini adalah **batas atas/ceiling** yang diinginkan makin rendah realisasinya makin baik. Jadi realisasi lebih kecil dari RKA (baik) → %Penc > 100%.
- **%Penc untuk KPI pertumbuhan (OS dan DEB)** = **Realisasi ÷ RKA** (arah normal: makin tinggi realisasi makin baik).
- Prinsip umum: **semakin tinggi %Penc = semakin baik**, untuk semua KPI — arah pembagiannya yang menyesuaikan jenis KPI.
- Bulan yang komitmen/datanya **belum tersedia** (biasanya Desember tahun berjalan) → tampilkan sebagai **"Menyusul"**, JANGAN ditampilkan sebagai `0` atau `0.00%` (menyesatkan, seolah gagal capai target).
- Baseline "Posisi" bulan Komitmen = hasil realisasi/prognosa bulan sebelumnya (chaining), sama seperti bagian 12.

---

## Sub-ketentuan terkait

- [11_database_kinerja_keragaan_dan_rka.md](11_database_kinerja_keragaan_dan_rka.md) — sumber angka realisasi (keragaan) & target (RKA), satuan, kode uker khusus
- [09_pergerakan_dg_ug_historis_prognosa.md](09_pergerakan_dg_ug_historis_prognosa.md) — prognosa SML/NPL & chaining baseline
