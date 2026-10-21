# 07 · Rekap "Instansi Tidak Terdeteksi"

*Sub-ketentuan dari Ketentuan Olah Data LW321 v4 · file `07_instansi_tidak_terdeteksi.md` · indeks: [00_INDEX.md](00_INDEX.md)*

## Tujuan
Definisi dan format rekap debitur yang instansinya tidak terdeteksi (blank, channel digital, label generik, junk).

## Kapan dirujuk
- Audit kualitas pengisian instansi oleh RM.
- Rekap debitur tanpa instansi per produk, termasuk tiering OS.

## Konteks minimum
- Basis = kolom **INSTANSI_FINAL** hasil kurasi Data Debitur ([04_database_instansi_kurasi.md](04_database_instansi_kurasi.md)).
- "9 file Leads" = daftar di [05_data_leads_sumber_dan_kolom.md](05_data_leads_sumber_dan_kolom.md).
- Produk Ritel = Karya + Purna + Pra-Purna; Mikro terpisah ([01_dasar_definisi_kolom_dan_sumber_data.md](01_dasar_definisi_kolom_dan_sumber_data.md)).

> **Catatan penomoran:** isi aturan di bawah disalin dari `ketentuan_olah_data_LW321_v4.md`, termasuk nomor bagian aslinya. Perubahan setelah v4 ditandai *(update …)* atau *(sementara …)*. Jika teks menyebut "bagian X" atau "Lampiran A/B", cari file-nya di tabel *Peta Bagian Asal* pada [00_INDEX.md](00_INDEX.md).

---

# ATURAN

### 10.7 Rekap "Instansi Tidak Terdeteksi" (dari Data Debitur / Instansi Bersih)
Definisi **tidak terdeteksi** = INSTANSI_FINAL yang:
1. **Blank/kosong** (tidak terisi di NAMA_INSTANSI/SATKER/KL dan CIF tidak ketemu di 9 file Leads), atau
2. **Channel digital** — BRIGUNA DIGITAL / BRIGUNA DIGITAL_BRI (nama channel, bukan instansi), atau
3. **Label generik** — "LAINNYA ...", "LAIN-LAIN/BAYAR SENDIRI", "SEKTOR LAINNYA/UMUM", "INSTANSI LAINNYA", "DANA PENSIUN LAINNYA", atau
4. **Junk** — nilai angka/simbol saja (mis. "0", "097").

**Bukan** tidak terdeteksi: nama pendek yang valid (BRI, PLN, BPN, AQUA, dst.) dan nama informatif yang kebetulan mengandung kata "Lainnya" (mis. "PENSIUNAN PEMPROVSU DAN LAINNYA").

Output: rekap per Produk (Ritel/Mikro) × Indikasi (4 kategori di atas) dengan Deb & OS + sheet detail per nilai apa adanya. Bila diminta tiering, pakai **3 tier OS per debitur: <50 Jt | 50–100 Jt | >100 Jt** (masing-masing Deb & OS), header 2 tingkat.

---

## Sub-ketentuan terkait

- [04_database_instansi_kurasi.md](04_database_instansi_kurasi.md) — cara membentuk INSTANSI_FINAL
- [05_data_leads_sumber_dan_kolom.md](05_data_leads_sumber_dan_kolom.md) — 9 file Leads yang dicek sebelum dinyatakan blank
