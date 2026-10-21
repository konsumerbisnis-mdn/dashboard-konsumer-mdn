# 05 · Data Leads: Daftar File, Kolom, dan Aturan Pemakaian

*Sub-ketentuan dari Ketentuan Olah Data LW321 v4 · file `05_data_leads_sumber_dan_kolom.md` · indeks: [00_INDEX.md](00_INDEX.md)*

## Tujuan
Mengenali 9 file Leads (7 Ritel + 2 Mikro), kolom instansi/segmen/plafond per file, dan aturan pemakaian baris & deduplikasi CIF.

## Kapan dirujuk
- Memakai Leads sebagai sumber pelengkap instansi (fallback INSTANSI_ASAL).
- Analisis potensi plafond leads.
- Sebelum menghitung penetrasi leads atau slicing ASTRI.
- Konsolidasi/penggabungan file leads.

## Konteks minimum
- Kunci join ke LW321/Data Debitur = **CIF** (7 karakter alfanumerik).
- File Leads di-update berkala; selalu pakai versi terbaru ([01_dasar_definisi_kolom_dan_sumber_data.md](01_dasar_definisi_kolom_dan_sumber_data.md), bagian 9).

> **Catatan penomoran:** isi aturan di bawah disalin dari `ketentuan_olah_data_LW321_v4.md`, termasuk nomor bagian aslinya. Perubahan setelah v4 ditandai *(update …)* atau *(sementara …)*. Jika teks menyebut "bagian X" atau "Lampiran A/B", cari file-nya di tabel *Peta Bagian Asal* pada [00_INDEX.md](00_INDEX.md).

---

# ATURAN

### 10.5 Data Leads (sumber tambahan untuk melengkapi instansi)
- Ada **9 file Leads** total, **update berkala**:
  - 7 file **Leads Briguna Ritel**: BUMN (kurasi), SPAN POLRI, SPAN ASN, SPAN TNI, PURNA, SWASTA, PRA-PURNA
  - 2 file **Leads Briguna Mikro** (ditambahkan Jul'26, ikut jadi sumber fallback INSTANSI_ASAL):
    - `LEADS_PRA_PURNA_Briguna_MIKRO` — instansi dari `SATKER → SUB SATKER → KL`; punya kolom `SEGMEN INSTANSI` (ASN/TNI/POLRI) untuk slicing segmen; **tidak punya kolom plafond**
    - `Leads_Briguna_Mikro_[posisi]` — instansi dari `nama_perusahaan`; punya kolom `jenis_pekerjaan` untuk slicing segmen; plafond dari `max_plafond`
- Kolom plafond per file (untuk analisis potensi): BUMN=`PLAFOND`, SPAN ASN/TNI/POLRI=`max plafond`, PURNA/SWASTA/MIKRO=`max_plafond`, kedua file PRA-PURNA (Ritel & Mikro) **tidak punya kolom plafond** (bukan 0 — kolomnya memang tidak ada; total plafond akan understate).
- Banyak leads bernilai plafond = 0 (terbesar LEADS PURNA) — kalau menganalisis potensi plafond, sadari ini membuat angka understate.
- Pakai **semua baris** (baik "Debitur Baru" maupun "Debitur Eksisting") saat mengambil info instansi dari Leads — karena LW321/Data Debitur adalah portofolio eksisting real, jadi leads cuma sumber pelengkap info instansi, bukan filter status.
- Kalau 1 CIF muncul di >1 file Leads dengan info beda, **tidak digabung** — dihitung/dipakai terpisah per file leads asalnya (untuk kurasi INSTANSI_ASAL, pilih satu nilai terbaik: prioritas source "KURASI" > data terbaru > paling detail). Dedup CIF hanya **di dalam file yang sama**.

---

## Sub-ketentuan terkait

- [04_database_instansi_kurasi.md](04_database_instansi_kurasi.md) — pemakaian Leads dalam kurasi INSTANSI_ASAL/INSTANSI_FINAL
- [06_penetrasi_leads_dan_slicing_astri.md](06_penetrasi_leads_dan_slicing_astri.md) — metodologi penetrasi leads & slicing ASTRI
- [07_instansi_tidak_terdeteksi.md](07_instansi_tidak_terdeteksi.md) — definisi "tidak terdeteksi" (CIF tidak ketemu di 9 file Leads)
