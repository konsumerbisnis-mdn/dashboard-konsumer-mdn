# 04 · Database Instansi Debitur: Kolom & Kurasi Instansi

*Sub-ketentuan dari Ketentuan Olah Data LW321 v4 · file `04_database_instansi_kurasi.md` · indeks: [00_INDEX.md](00_INDEX.md)*

## Tujuan
Aturan membangun database instansi dari Data Debitur bulanan: definisi kolom instansi, 4 kolom hasil kurasi (INSTANSI_ASAL, INSTANSI_FINAL, INSTANSI_GENERAL, SEGMEN_FINAL), aturan generalisasi, dan sheet pendamping wajib.

## Kapan dirujuk
- Membuat/memperbarui database instansi atau "instansi bersih".
- Analisis per instansi/segmen dari Data Debitur.
- Mengisi kolom instansi dengan kurasi penuh (bukan sekadar fallback cepat).

## Konteks minimum
- Data Debitur = versi lengkap LW321 (kolom bisa berubah tiap bulan).
- Join lintas sumber **hanya via CIF** (7 karakter alfanumerik); NOREK tidak reliable.
- Fallback INSTANSI_ASAL memakai Data Leads — aturan pemakaian Leads ada di [05_data_leads_sumber_dan_kolom.md](05_data_leads_sumber_dan_kolom.md).

> **Catatan penomoran:** isi aturan di bawah disalin dari `ketentuan_olah_data_LW321_v4.md`, termasuk nomor bagian aslinya. Perubahan setelah v4 ditandai *(update …)* atau *(sementara …)*. Jika teks menyebut "bagian X" atau "Lampiran A/B", cari file-nya di tabel *Peta Bagian Asal* pada [00_INDEX.md](00_INDEX.md).

---

# ATURAN

## 10. Database Instansi Debitur (Data Debitur bulanan)

Data Debitur adalah versi lengkap LW321 (ada info instansi, gaji, payroll, tgl lahir, dll — kolom berubah-ubah tiap bulan). Kolom yang paling sering dipakai: **NAMA_INSTANSI**.

### 10.1 Definisi kolom terkait instansi
- `jenis_pinjaman`: Kretap=Briguna Karya, Kresun=Briguna Purna, Umum=Briguna Pra-Purna, GBT=Briguna Mikro
- `NAMA_INSTANSI`: nama instansi detail (kadang kosong/"LAINNYA" karena tidak diisi RM saat realisasi)
- `SEGMEN`: instansi versi general (TNI/POLRI/ASN/BUMN GRUP & BUMD/SWASTA/PENSIUNAN/BRI GRUP/PEGAWAI BRI/HONORER-PPPK/LAINNYA)
- `SATKER`, `KL`: instansi detail alternatif (SATKER lebih detail, KL lebih general) — dipakai kalau NAMA_INSTANSI kosong
- **Primary key gabungan lintas sumber (LW321, Data Debitur, Data Leads, Database Disburse, dst.): CIF**. NOREK tidak reliable lintas sumber (beda digit, kadang itu rekening gaji bukan rekening pinjaman).

### 10.2 Kolom hasil kurasi (wajib 3 kolom ini di setiap output database instansi)
1. **INSTANSI_ASAL** — hasil fallback pengisian (belum distandardisasi ejaan), urutan:
   `NAMA_INSTANSI → SATKER → KL → cari di Data Leads (match by CIF)`
2. **INSTANSI_FINAL** — hasil kurasi dari INSTANSI_ASAL:
   - Standardisasi nama mirip (ejaan/spasi/singkatan) jadi satu nama baku — **hanya auto-merge yang 100% aman** (identik setelah dibersihkan format/case/tanda baca). Kandidat lain yang mirip tapi berisiko (beda nomor sekolah/unit, dsb.) masuk sheet "Kandidat Merge - Review" utk dicek manual, tidak di-auto-merge.
   - Override dari Data Leads kalau leads lebih detail/baru/bersumber "KURASI" dibanding data asal yang generik.
   - **Semua baris Kresun/Purna → INSTANSI_FINAL dipaksa jadi "PENSIUNAN"** (bukan nama instansi asal tempat kerja dulu).
3. **INSTANSI_GENERAL** — level lebih general dari INSTANSI_FINAL, mengelompokkan variasi penulisan & sub-unit dari instansi/jenis yang sama jadi satu nama umum (lihat 10.3). Kolom terpisah, INSTANSI_FINAL tetap ada apa adanya.

Serta 1 kolom segmen hasil kurasi:
4. **SEGMEN_FINAL** — SEGMEN dibersihkan biar konsisten dgn INSTANSI_FINAL:
   - Rule-based dari keyword nama instansi dulu, fallback voting mayoritas (Segmen paling sering muncul utk instansi itu).
   - **Semua baris Kresun/Purna → SEGMEN_FINAL dipaksa "PENSIUNAN"**.
   - **Pegadaian (semua variasi) → SEGMEN_FINAL = "BRI GRUP"** (bukan BUMN GRUP & BUMD).

### 10.3 Aturan generalisasi INSTANSI_GENERAL
**Prinsip**: kumpulkan variasi penulisan/singkatan DAN sub-unit dari instansi/jenis yang sama jadi satu nama umum, meskipun itu menghilangkan detail lokasi/nomor unit spesifik (mis. Yonif Siantar & Yonif Gunung Sitoli → sama-sama "YONIF").

**Dikecualikan dari generalisasi (tetap detail apa adanya, termasuk nomor & nama daerah):**
- Semua nama sekolah (SD/SMP/SMA/SMK/MIN/MTs/MAN/dst.)
- Kantor Camat, Kecamatan, Kelurahan, Pemda/Pemkab/Pemko — tetap pakai nama daerahnya

**Contoh brand/instansi spesifik yang disatukan (regardless lokasi):**
- BRI, PT BRI, Bank Rakyat Indonesia, Pegawai BRI (cabang manapun) → **"BRI"**
- BRIGUNA DIGITAL & BRIGUNA DIGITAL_BRI → **"BRIGUNA DIGITAL"** (satu kelompok)
- BNN, Badan Narkotika Nasional (semua level) → **"BNN"**
- HKBP, Huria Kristen Batak Protestan, BPSK HKBP, BP 4 K → **"HURIA KRISTEN BATAK PROTESTAN"**
- USU, Universitas Sumatera Utara (semua fakultas) → **"UNIVERSITAS SUMATERA UTARA"**
- LANTAMAL (bukan ke-generalisasi jadi ANTAM!) → **"LANTAMAL"**

**Contoh jenis TNI/Polri/pemerintahan yang disatukan per tipe (lokasi/nomor dibuang):**
- YONIF, KODIM, KOREM, KODAM, ARHANUD, BRIGIF, BINTALDAM, DENMADAM, dan kode DAM sejenis lainnya → nama tipe itu sendiri
- POLRES, POLRESTA, POLDA, POLSEK, BRIMOB → nama tipe itu sendiri (tidak disatukan jadi "POLRI" blanket)
- PA (awalan kode, mis. "ASN_PA ...") → **"PENGADILAN AGAMA"**; PN (awalan kode / berdiri sendiri) → **"PENGADILAN NEGERI"**
- KANWIL + instansi spesifik di belakangnya dikelompokkan ke instansi itu, BUKAN ke "KANWIL" blanket — mis. Kanwil DJP/Ditjen Pajak → **"DITJEN PAJAK"**, Kanwil Bea Cukai → **"BEA CUKAI"**, Kanwil Kementerian Agama → **"KEMENAG"**, Kanwil BPN → **"BPN"**, Kanwil Pegadaian → **"PEGADAIAN"**
- KPP Pratama / Kantor Pelayanan Pajak Pratama → **"KPP PRATAMA"**

**Preprocessing wajib sebelum matching:** kolaps huruf yang terpisah spasi (mis. "A R H A N U D S E" → "ARHANUDSE" → cocok ke rule ARHANUD; "P E N S I U N A N" → "PENSIUNAN").

**Untuk nama yang tidak match rule/keyword dikenal**: best-effort — buang nama kota/kabupaten (gazetteer Sumut), nomor, angka romawi, kata "Cabang/Unit/KC" di ujung nama. Kalau hasilnya kosong/terlalu pendek, biarkan sama dengan INSTANSI_FINAL (tidak dipaksakan).

### 10.4 Sheet pendamping wajib di setiap output database instansi
- **"Kandidat Merge - Review"**: pasangan nama mirip (skor kemiripan ≥85) yang tidak di-auto-merge karena berisiko, untuk dicek manual.
- **"Mapping Instansi General"**: semua nama INSTANSI_FINAL beserta hasil pengelompokan INSTANSI_GENERAL-nya + jumlah debitur, untuk transparansi/audit.

---

## Sub-ketentuan terkait

- [05_data_leads_sumber_dan_kolom.md](05_data_leads_sumber_dan_kolom.md) — 9 file Leads sebagai sumber fallback & aturan prioritas bila CIF muncul di >1 file
- [07_instansi_tidak_terdeteksi.md](07_instansi_tidak_terdeteksi.md) — rekap instansi tidak terdeteksi (memakai INSTANSI_FINAL)
- [03_format_nominatif_dan_rekap_kualitas_kredit.md](03_format_nominatif_dan_rekap_kualitas_kredit.md) — kolom Instansi di nominatif top-N (cukup INSTANSI_ASAL)
- [01_dasar_definisi_kolom_dan_sumber_data.md](01_dasar_definisi_kolom_dan_sumber_data.md) — definisi CIF & produk
