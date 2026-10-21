# KETENTUAN OLAH DATA LW321 (v4 — konsolidasi)

Dokumen ini menggantikan `ketentuan_olah_data_LW321_v3`. Berisi seluruh ketentuan standing instruction ("untuk selanjutnya...") yang disepakati sepanjang diskusi pengolahan data LW321.

**Perubahan v4:** penambahan **Bagian 15 — Database Kinerja (Keragaan / Disburse / RKA / RM)** beserta seluruh aturan turunannya (satuan, anti double-count, alur pengisian data disburse baru, arah %Penc per mata anggaran), serta **Lampiran A** (master kode kanca–nama–area) dan **Lampiran B** (mapping 29 unit dedicated Briguna Mikro ke kanca induk).

---

## 1. Definisi Dasar Kolom LW321

| Istilah | Sumber Kolom / Definisi |
|---|---|
| Kolektibilitas | `KOL_ADK` |
| Outstanding / OS | `BALANCE DALAM IDR` (atau `BAKI DEBET` pada file yang sudah punya kolom ini) |
| Pemisah produk | `DESCRIPTION` |
| Briguna Mikro | DESCRIPTION mengandung `KREDIT MIKRO - GBT` |
| Briguna Karya / Purna / Pra-Purna (Umum) | DESCRIPTION mengandung kata "KARYA" / "PURNA" (bukan "PRA PURNA") / "UMUM" |
| **Briguna Ritel** | Gabungan: Briguna Karya + Briguna Purna + Briguna Pra-Purna (Umum) — **di luar Mikro** |
| Umur Tunggakan | `PERIODE − NEXT_PMT_DATE` (dalam hari). Bisa negatif — itu wajar untuk Lancar (belum jatuh tempo); jadi anomali kalau dipasangkan dengan KOL_ADK yang sudah DPK/NPL |
| Total Tunggakan | `TUNGGAKAN POKOK + TUNGGAKAN BUNGA + TUNGGAKAN PINALTI` |
| SML / NPL | Diturunkan dari KOL_ADK (SML = Kol 2, NPL = Kol 3/4/5) |
| CIF | Nomor induk debitur BRI (`CIFNO`) — **wajib ada di semua output pengolahan data mulai sekarang**. Format baku: **7 karakter alfanumerik** (mis. `G810252`, `JIL0661`), konsisten di semua sumber (LW321, Data Debitur, Data Leads, Database Disburse) |

## 2. Deteksi One Obligor

Sebuah rekening terindikasi **one obligor** (kolektibilitasnya turun bukan karena Briguna itu sendiri menunggak) jika:
- Total Tunggakan = 0, **atau**
- Umur Tunggakan tidak sejalan dengan KOL_ADK

**KOL_ADK selalu dianggap mutlak benar** — tidak pernah dikoreksi meskipun tunggakan terbaca 0.

### Cara mencari penyebab one obligor:
- **Karena Kartu Kredit (CC):** cocokkan **CIF** (bukan nomor rekening) ke file `OBLIGOR BRIGUNA KPR WITH CARD`, gunakan sumber data **terbaru** yang tersedia. Dianggap "One Obligor CC" kalau CIF ditemukan **dan** kolektibilitas kartunya (`kol_adk` pada file tsb) ≥ 2.
- **Karena pinjaman lain (bukan CC):** cocokkan **CIF** yang sama ke pinjaman Briguna lain di LW321 (Juni maupun Juli/periode berjalan) — kalau ada rekening lain a.n. CIF yang sama dengan kolektibilitas ≥ 2, itu indikasi "One Obligor Lainnya".
- Kalau tunggakan=0 tapi tidak ketemu penyebab CC maupun pinjaman lain, tetap dikategorikan "One Obligor Lainnya" (penyebab tidak teridentifikasi, tapi bukan tunggakan riil).

## 3. Header Wajib — Nominatif Kualitas Kredit

Urutan kolom baku untuk output nominatif kualitas kredit:

1. Kode Kanca
2. Kanca
3. **Uker** — *khusus kalau mengolah data Briguna Mikro* (kolom `UKER`)
4. Nomor Rekening
5. Nama Debitur
6. CIF
7. **Kolek** — angka `KOL_ADK` (1–5), **bukan** label teks
8. Produk (Karya / Purna / Pra-Purna / Briguna Mikro)
9. RM Pengelola — dari kolom `PN PENGELOLA SINGLEPN`, **buang angka & simbol pada 11 karakter pertama** (format sumber: `"00235274 - Nama RM"` → hasil bersih: `"Nama RM"`)
10. Umur Tunggakan
11. Baki Debet (OS)
12. Total Tunggakan
13. **Kualitas Kredit** — versi singkat, **teks**: Lancar / SML / NPL (murni dari KOL_ADK, tidak berubah walau one obligor)
14. **Kriteria Kredit** — versi detail, **teks** (lihat logika di bagian 4)

**Tidak perlu baris TOTAL** di bawah nominatif. Kalau perlu subtotal, hanya menjumlahkan data yang sedang difilter.

## 4. Logika "Kriteria Kredit" (detail)

```
1. Cek One Obligor dulu (Total Tunggakan = 0 ATAU Umur Tunggakan tidak sejalan KOL_ADK):
   - KOL_ADK = 1           → "Lancar"
   - KOL_ADK = 2           → "One Obligor SML"
   - KOL_ADK = 3/4/5       → "One Obligor NPL"   (tidak dirinci sub-bucket)

2. Kalau BUKAN one obligor (tunggakan riil, sejalan dengan KOL_ADK):
   - KOL_ADK = 1           → "Lancar"
   - KOL_ADK = 2, berdasar Umur Tunggakan:
       0–29 hari           → "SML 1"
       30–60 hari          → "SML 2"
       61–89 hari          → "SML 3"
   - KOL_ADK = 3/4/5, berdasar Umur Tunggakan:
       90–119 hari         → "NPL Baru"
       > 119 hari, cek umur pinjaman (PERIODE − TGL_REALISASI):
           < 2 tahun       → "NPL Dibawah 2 Tahun"
           ≥ 2 tahun       → "NPL"
```

Catatan: kolom **Kualitas Kredit** tetap "SML"/"NPL" apa adanya walaupun Kriteria Kredit-nya "One Obligor ..." — one-obligor cuma memperjelas *kenapa*, bukan mengubah status kualitas kreditnya.

## 5. Aturan Format Angka Kolektibilitas

- Kolom **kolektibilitas** apa pun (Kolek, Kol Juni, Kol Juli, KOL_ADK, dst.) → **pakai angka 1–5 saja**.
- **Kecuali** kolom **Kualitas Kredit** dan **Kriteria Kredit** → tetap pakai **teks** sesuai definisi di atas.

## 6. Ketentuan Khusus Data Mikro

- Wajib sertakan kolom **UKER** (unit) di samping KANCA pada setiap output yang melibatkan Briguna Mikro.
- Rekap Mikro dipecah **per Cabang + per Unit**, bukan per cabang saja.
- Rekap Ritel cukup **per Cabang** saja (tidak ada unit).

## 7. Desain Tabel Rekap (kategori one-obligor per cabang/area)

Urutan kolom kiri→kanan:

**Cabang | DG karena Briguna (Deb, OS) | DG karena Obligor CC (Deb, OS) | DG karena Obligor produk lain (Deb, OS) | TOTAL (Deb, OS)**

Desain visual:
- Header 2 tingkat (grup besar di atas, sub "Deb"/"OS" di bawah), merged cell, background navy gelap (`#1F4E78`), teks putih bold.
- Baris data: font normal, angka rata kanan, zebra-stripe (selang-seling putih/abu-abu muda `#F2F2F2`) antar baris cabang.
- Baris TOTAL: bold, background biru muda/lavender (`#D9E1F2`), di baris paling bawah.
- Ada baris caption/keterangan definisi kategori tepat di atas tabel.

## 8. Area Head

Pembagian cabang → Area Head mengacu ke file `PEMBAGIAN AREA HEAD.xlsx` (kolom "Kantor Cabang" → "Area"). Catatan: "KANWIL Medan" pada data LW321 = "RO Medan" pada file pembagian area (tidak masuk ke Area manapun / non-area). **Master lengkap kode–nama–area: lihat Lampiran A.**

## 9. Sumber Data

- Selalu pakai **file/posisi data terbaru** yang tersedia di Project untuk setiap ketentuan (LW321 maupun Obligor CC), kecuali diminta eksplisit pakai posisi tertentu.
- Saat membandingkan dua periode (mis. New SML/NPL), baseline & posisi target harus disebutkan jelas di judul/keterangan output (mis. "posisi 13 Jul'26 vs baseline 14 Jun'26").

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

### 10.6 Rekap Penetrasi Data Leads (metodologi FINAL — sudah dieksekusi)
- **Sumber acuan TUNGGAL: LW321 posisi terbaru** (contoh eksekusi: 19 Jul'26) untuk SEMUA komponen — status penetrasi, sisa OS, tanggal realisasi, kolektibilitas, produk, kanca. **Jangan campur sumber lain** (mis. Data Debitur bulan sebelumnya) — konsekuensinya:
  - Hanya **2 status**: `SUDAH REAL` (CIF ketemu di LW321 posisi tsb) / `BELUM REAL` (tidak ketemu). **Tidak ada kategori "Real Lunas/Tidak Aktif"** — kategori itu butuh sumber kedua dan sudah ditolak.
- **1 rekening terpilih per CIF** = rekening dengan **tanggal realisasi TERBARU** (gabungan semua produk). Nominatif memakai **satu set kolom realisasi** dengan kolom **"Ritel/Mikro"** sebagai pembeda segmen produk: Norek, Sisa OS, Kolek (posisi yang sama), Tgl Real Terbaru, Kanca. (Konsekuensi: CIF yang punya Ritel & Mikro sekaligus dihitung di produk rekening terbarunya saja.)
- Leads Ritel maupun Mikro sama-sama dicek ke **seluruh** portofolio (Ritel+Mikro) supaya cross-sell kelihatan (leads Ritel yang closing di Mikro, dan sebaliknya).
- Laporan **terpisah** untuk leads Ritel dan leads Mikro. Rekap per instansi memakai nama **raw apa adanya dari leads**.
- Struktur output baku (1 file): **Rekap Garis Besar** (per kategori leads: total, real di Ritel Deb+OS, real di Mikro Deb+OS, % penetrasi, sisa potensi) + **Rekap Instansi Ritel & Mikro** (per file leads × instansi raw) + **Nominatif Ritel & Mikro** (autofilter, freeze header).
- **Sisa potensi** = leads yang CIF-nya tidak ketemu di LW321 posisi acuan.

### 10.7 Rekap "Instansi Tidak Terdeteksi" (dari Data Debitur / Instansi Bersih)
Definisi **tidak terdeteksi** = INSTANSI_FINAL yang:
1. **Blank/kosong** (tidak terisi di NAMA_INSTANSI/SATKER/KL dan CIF tidak ketemu di 9 file Leads), atau
2. **Channel digital** — BRIGUNA DIGITAL / BRIGUNA DIGITAL_BRI (nama channel, bukan instansi), atau
3. **Label generik** — "LAINNYA ...", "LAIN-LAIN/BAYAR SENDIRI", "SEKTOR LAINNYA/UMUM", "INSTANSI LAINNYA", "DANA PENSIUN LAINNYA", atau
4. **Junk** — nilai angka/simbol saja (mis. "0", "097").

**Bukan** tidak terdeteksi: nama pendek yang valid (BRI, PLN, BPN, AQUA, dst.) dan nama informatif yang kebetulan mengandung kata "Lainnya" (mis. "PENSIUNAN PEMPROVSU DAN LAINNYA").

Output: rekap per Produk (Ritel/Mikro) × Indikasi (4 kategori di atas) dengan Deb & OS + sheet detail per nilai apa adanya. Bila diminta tiering, pakai **3 tier OS per debitur: <50 Jt | 50–100 Jt | >100 Jt** (masing-masing Deb & OS), header 2 tingkat.

### 10.8 Slicing ASTRI (ASN/TNI/POLRI) dari Data Leads
- **Dari leads Ritel**: langsung pakai 3 file SPAN (ASN/TNI/POLRI) — segmen = nama filenya.
- **Dari leads Mikro**: filter kolom segmen di masing-masing file — `SEGMEN INSTANSI` (LEADS_PRA_PURNA_MIKRO) dan `jenis_pekerjaan` (Leads_Briguna_Mikro), ambil nilai ASN/TNI/POLRI saja.
- **Produk realisasi detail** (Briguna Karya / Purna / Pra-Purna (Umum) / Mikro) ditentukan dari `DESCRIPTION` rekening terpilih di LW321 (aturan bagian 1), dengan metodologi rekening terpilih yang sama seperti 10.6.
- Output baku: Rekap Garis Besar (Kategori Leads × Segmen → real per produk fokus + sisa potensi), Rekap per Produk (semua produk), Nominatif gabungan.

## 11. LW325 — Nominatif PH (Hapus Buku)

File `2023_LW325_PH_V7...xlsx` (sheet tunggal, header di baris 8) adalah daftar **kumulatif seluruh rekening yang sudah di-PH (Penghapusbukuan/write-off)** sejak tahun-tahun lampau sampai posisi terbaru — bukan hanya bulan berjalan, jadi **wajib difilter TGL PH** sesuai periode yang dibutuhkan.

### 11.1 Definisi kolom
- **`TGL PH`** — tanggal debitur tsb di-PH (write-off). Ini kolom filter utama untuk analisis per periode/bulan.
- **`SISA AKHIR PH POKOK`** — OS akhir (pokok) pada saat/setelah PH. Ini nilai nominal PH yang dipakai untuk agregasi (bukan `SISA AWAL PH POKOK`, yang mencerminkan kondisi sebelum PH).
- **`DESKRIPSI SEGMEN`** — deskripsi produk, dipakai untuk filter Briguna Ritel. Berisi string seperti `"KREDIT RITEL - KONSUMTIF - NON CASH COLATERAL - KRETAP"`. Filter dengan **contains** (bukan exact match) untuk 4 kata kunci berikut, yang seluruhnya termasuk **Briguna Ritel**:
  - `KRESUN` (= Briguna Purna)
  - `KRETAP` (= Briguna Karya)
  - `BRIGUNA UMUM` (= Briguna Pra-Purna)
  - `KREDIT PEGAWAI` (kredit pegawai BRI — termasuk scope Briguna Ritel untuk analisis PH)
  - *(Selain 4 itu ada juga KPR dan produk lain di file yang sama — bukan Briguna Ritel, jangan diikutkan.)*
- **`NOMOR_REKENING`** — numerik, format sudah bersih (tanpa leading zero berlebih), langsung sebanding dengan `NOMOR_REKENING` LW321 setelah dinormalisasi jadi string.

### 11.2 Cara pakai untuk analisis pergerakan DG/UG bulanan
- Total **PH per bulan** = `SUM(SISA AKHIR PH POKOK)` untuk baris dengan `TGL PH` jatuh di bulan tsb, setelah difilter Ritel (11.1).
- Untuk memisahkan **"NPL ke Lunas riil"** vs **"PH"** di antara rekening NPL yang hilang dari LW321 bulan berjalan: cocokkan `NOMOR_REKENING` rekening yang hilang ke daftar PH LW325 (any-time, tidak perlu match bulan persis, karena TGL PH bisa beda tipis dengan tanggal cut-off LW321) —
  - **Match ketemu** → masuk kolom **PH**.
  - **Tidak ketemu** → diasumsikan **Lunas riil** (masuk kolom "NPL ke L/Lunas" bersama rekening yang naik tier ke Lancar).

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

## 13. Format Output "Kinerja & Prognosa" (KPI Historis + Komitmen + RKA)

Untuk laporan KPI bulanan/kuartalan (OS, SML Nominal, NPL Nominal, Rasio SML, Rasio NPL) per segmen (Konsumer/Briguna Ritel/KPR):

- Satuan nominal = **Rp Juta**. Kalau angka besar (≥1.000 Rp Juta) boleh dipersingkat ke format Miliar, mis. `9,258,719` → `9,258.7 M` atau gaya serupa, sesuai konteks presentasi.
- **%Penc (persen pencapaian)** untuk **KPI kualitas kredit (SML/NPL, nominal maupun rasio)** = **RKA ÷ Realisasi/Prognosa** — karena RKA di sini adalah **batas atas/ceiling** yang diinginkan makin rendah realisasinya makin baik. Jadi realisasi lebih kecil dari RKA (baik) → %Penc > 100%.
- **%Penc untuk KPI pertumbuhan (OS dan DEB)** = **Realisasi ÷ RKA** (arah normal: makin tinggi realisasi makin baik).
- Prinsip umum: **semakin tinggi %Penc = semakin baik**, untuk semua KPI — arah pembagiannya yang menyesuaikan jenis KPI.
- Bulan yang komitmen/datanya **belum tersedia** (biasanya Desember tahun berjalan) → tampilkan sebagai **"Menyusul"**, JANGAN ditampilkan sebagai `0` atau `0.00%` (menyesatkan, seolah gagal capai target).
- Baseline "Posisi" bulan Komitmen = hasil realisasi/prognosa bulan sebelumnya (chaining), sama seperti bagian 12.

## 14. Nominatif Top-N — Kolom "Instansi"

Kalau output nominatif (top-N debitur, pergerakan DG/UG, dsb.) perlu kolom Instansi, pakai **INSTANSI_ASAL** (fallback `NAMA_INSTANSI → SATKER → KL`, bagian 10.1–10.2), dicocokkan via **CIF** dari file Data Debitur bulanan yang paling baru. Tidak perlu full curation (INSTANSI_FINAL/GENERAL, bagian 10.3) kecuali diminta eksplisit — cukup "instansi bersih" hasil fallback saja untuk output cepat/nominatif ad-hoc.

---

## 15. Database Kinerja — `Database Keragaan Disburse RKA.xlsx`

File tunggal berisi **4 sheet**, jadi sumber baku untuk angka kinerja cabang, realisasi disburse, target RKA, dan master RM. **File ini di-update berkala (append)** — selalu pakai posisi terbaru, dan pastikan tidak ada duplikasi saat menambah data.

### 15.1 Struktur & grain

| Sheet | Grain | Kolom kunci | Cakupan (per posisi Jul'26) |
|---|---|---|---|
| `database keragaan` | kode uker × tanggal × produk | Uker, Tanggal, Desc, DEB, OS, DPK, NPL, DEB DPK, DEB NPL | 31 Des'22 – berjalan |
| `database disburse` | per rekening realisasi | lihat 15.4 | 1 Jan'26 – berjalan, **Ritel saja** |
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

### 15.5 `database disburse` — aturan pakai & pengisian data baru
- **Scope**: Briguna Ritel saja (`PRODUK` = Kretap/Kresun/Umum; SEGMEN semua "RITEL"). **Disburse Mikro belum tersedia — akan menyusul.**
- **Metrik realisasi baku = `OS NET`** (uang baru; untuk Suplesi sudah dikurangi OS sebelumnya). Bukan `EQ_PLAFOND`.
- `Real Baru/Suplesi` membedakan realisasi baru vs suplesi.
- Kolom suku bunga yang dipakai = **`SUKU_BUNGA`**. Ada dua kolom bernama sama (bentuk desimal 0,0825 dan persen 8,25) — pilih yang menghasilkan angka **wajar untuk kredit pegawai: ±5% s.d. belasan persen** (boleh sedikit di bawah 5% atau di atas belasan). Normalisasi ke satu format sebelum analisis.

**Alur kerja saat user mengirim data disburse baru lewat chat:**
Data mentah yang dikirim **belum punya** 3 kolom berikut. Ketiganya diisi oleh Claude:

| Kolom | Cara mengisi |
|---|---|
| **Kantor Cabang** | Nama cabang **versi clean** (mis. `KC Medan Iskandar Muda`, bukan `00336 -- KC Medan Iskandar M`). Ambil dari `KD KC` → Lampiran A. |
| **PN AO (9 digit)** | Dari kolom `PN_AO`, dinormalisasi jadi 9 digit (buang spasi/`.0`, lalu zero-pad kiri sampai 9 karakter). |
| **Nama RM - RO** | **Lookup `PN AO (9 digit)` ke sheet `database RM`** (kolom `PN AO 9 dig`), pakai baris bulan yang sesuai. **Kalau tidak ketemu**, cross-check ke LW321 posisi terdekat lewat `NOMOR_REKENING`, atau `CIF` + kanca yang sama, lalu ambil RM dari `PN PENGELOLA SINGLEPN` (dibersihkan sesuai bagian 3 no. 9). |

Catatan penting: `PN_AO` pada data disburse historis **tidak reliable** (satu RM bisa punya 2–3 PN, satu PN dipakai beberapa nama RM), sementara master `database RM` bersih (PN unik per bulan). Karena itu urutannya: lookup PN dulu → kalau gagal/ambigu, baru fallback ke LW321. **Untuk analisis pencapaian RM, gunakan kolom `Nama RM - RO`** (+ Kantor Cabang), bukan PN.

### 15.6 `database RM` — master RM & target
- Header ada di **baris 2** (baris 1 judul).
- `Target` = target **OS NET** per RM per bulan, satuan Rp Juta.
- `JG` = job grade (4/5/6/7/BBAP).
- Pencapaian RM = total `OS NET` disburse yang `Nama RM - RO`-nya = RM tsb pada bulan yang sama.
- Master ini per bulan — RM bisa masuk/keluar/pindah kanca antar bulan, jadi selalu lookup pakai pasangan (Bulan, RM).

### 15.7 `RKA` — target
- Mata anggaran = kombinasi metrik × produk: `OS/DEB/DPK/NPL` × `BRIGUNA RITEL / BRIGUNA KARYA / BRIGUNA PURNA / BRIGUNA PRA-PURNA / BRIGUNA MIKRO / BRIGUNA MIKRO D / KPR`.
- Kolom bulan = akhir bulan Jan'25 s.d. Des'26.
- **Kode uker khusus**: `B` = **Total RO Medan** (baris agregat), `D` = **All Unit Dedicated Briguna Mikro** (agregat 29 unit).
- **Uker 201 = Kanwil/RO Medan** — sisa kredit pindahan dari Kantor Fungsional Aceh, **tidak ada target/RKA** di sana. Perlakuan: **realisasi 201 tetap dijumlahkan** ke total RO Medan, dan RKA level RO tetap memakai baris `B — Total RO Medan`.
- Arah %Penc mengikuti bagian 13 (SML/NPL = RKA ÷ Realisasi; OS/DEB = Realisasi ÷ RKA).

---

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
*Dokumen ini disusun dari kesepakatan sepanjang sesi kerja pengolahan data LW321. Update dokumen ini (hapus versi lama di Project knowledge, unggah versi baru) setiap kali ada ketentuan baru yang disepakati — hanya 1 file ketentuan aktif di Project.*
