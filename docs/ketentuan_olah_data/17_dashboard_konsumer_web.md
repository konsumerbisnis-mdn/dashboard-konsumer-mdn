# 17 · Dashboard Konsumer Region I - Medan (gabungan Briguna + KPR) — aplikasi web

*Sub-ketentuan baru (21 Okt'26) · file `17_dashboard_konsumer_web.md` · indeks: [00_INDEX.md](00_INDEX.md)*

## Tujuan
Mencatat ketentuan yang disepakati untuk **Dashboard Konsumer Region I - Medan**, yaitu Dashboard Briguna (ketentuan 16) yang digabung dengan Dashboard KPR (`Dashboard_KPR_Medan.html`) menjadi satu website: menu, aturan hitung, database Google Sheets tambahan, upload, unduhan, peran, tampilan/SFX, dan keamanan.

## Kapan dirujuk
- Membangun / merevisi Dashboard Konsumer (frontend GitHub Pages atau `google_apps_script.gs`).
- Menambah sheet atau mengisi data baru untuk dashboard (produktivitas KPR, foto RM/ikon KC, LW321 KPR, pipeline).
- Menjawab pertanyaan angka yang tampil di dashboard (cara hitung Konsumer, KPR Subsidi, DG/UG, %Penc).

---

# MENU (wajib, urutan tetap)

Seluruh menu **mengikuti pola menu dashboard KPR** (filter, kartu, panel buka/tutup, "Buka semua / Minimize semua"). Pilihan segmen ditampilkan sebagai tombol di atas menu.

| No | Menu | Isi | Segmen |
|---|---|---|---|
| 1 | **Keragaan** | HIGHLIGHT per RO / per Area / per Kanca; OS, SML, NPL, Debitur per KC; Time Series SML & NPL; komposisi produk | Konsumer, Briguna Ritel, Briguna Mikro, KPR (+ Karya/Purna/Pra-Purna/Mikro D) |
| 2 | **Produktivitas RM** | **per bulan dan carry over** (wajib keduanya); kartu RM dengan foto, per cabang dengan ikon KC; kuadran | a. Briguna Ritel & Mikro · b. KPR |
| 3 | **Nominatif Portofolio** | per debitur: ringkasan, kualitas, EWS, peluang, daftar debitur | a. Briguna Ritel & Mikro · b. KPR |
| 4 | **Kualitas Kredit** | DG/UG, SML, NPL (pergerakan 2 posisi LW321, tabel per kantor cabang) | Briguna Ritel & Mikro · KPR |
| 5 | **Pipeline Brispot RM** | funnel, jadwal akad, rencana realisasi, rekap per KC, per RM, daftar pipeline | a. Briguna Ritel & Mikro · b. KPR |
| 6 | **Simulasi Suku Bunga** | a. Briguna (anuitas & flat) · b. KPR (mengikuti tabel suku bunga di html KPR) | — |
| — | Beranda, Admin | Beranda = kartu ringkas tiap menu; Admin = upload data, user, log | — |

# ATURAN HITUNG

- **Ritel = Karya + Purna + Pra-Purna** (Desc `Pra0Purna` dihitung sebagai Pra-Purna). **Konsumer = Ritel + Mikro + KPR.** Aturan anti double-count ketentuan 11 tetap berlaku.
- Penjumlahan Konsumer bersifat **ketat**: bila salah satu komponen (mis. RKA Debitur Mikro) kosong, hasil Konsumer dibiarkan kosong — tidak dijumlah sebagian (mencegah %Penc menyesatkan, contoh kasus 140%).
- RKA dalam Rupiah penuh → **÷ 1.000.000** jadi Rp juta (DEB tetap jumlah).
- **%Penc** (ketentuan 10): OS & Debitur = realisasi ÷ RKA; SML & NPL = RKA ÷ realisasi; **maksimum 120%**.
- **Kuadran RM**: K1 ≥ 105%, K2 100–<105%, K3 50–<100%, K4 < 50%. Hanya RM/mantri yang punya target.
- Segmen produktivitas: Briguna Ritel & Mikro = **Baru / Suplesi**; KPR = **Subsidi / Komersil (KPRS)**.
- **KPR Subsidi di LW321** = deskripsi FLPP/Sejahtera **atau** plafon ≤ 185 jt; sisanya Komersil. Baris LW321 KPR **tanpa deskripsi produk tidak dihitung** sebagai KPR bila kolom deskripsi ada.
- LW321 KPR tanpa kolom saldo: OS = **jumlah kolom KOLEKTIBILITAS_*** (ketentuan 01 bagian 5).
- Urutan produk tampilan: Karya, Purna, Pra-Purna, Mikro, Lainnya, KPR Subsidi, KPR Komersil.
- **DG/UG** (ketentuan 09): dicocokkan per nomor rekening antara LW321 posisi berjalan vs bulan lalu; rekening hilang memakai OS bulan lalu. Kategori: DG Lancar→SML, DG SML→NPL, DG Lancar→NPL, UG SML→Lancar, UG NPL→SML, UG NPL→Lancar, rekening baru, Lancar lunas/keluar, SML hilang (lunas), NPL hilang (lunas/PH).
- **Pipeline Briguna**: Ritel vs Mikro dipisahkan otomatis dari nama produk/segmen di file Brispot. Berkas BATAL tidak dihitung. Usia: HOT = hari ini − tgl putusan; WARM/COLD = hari ini − tgl prakarsa.
  - *(update 21 Okt'26)* Untuk file **Brispot Briguna** (sheet Nominatif), segmen dikonfirmasi: `UNIT KERJA` mengandung "Unit" (tanpa beda huruf besar/kecil) → **BG MIKRO**, selain itu **BG RITEL** (berlaku juga untuk unit dedicated). Klasifikasi WARM/HOT/Pencairan Sukses, nominal (Warm/Hot = plafon, Cair = net OS), dan unik per NIK mengikuti [18](18_brispot_warm_hot_leads.md).

- **Keragaan Briguna Mikro per unit** *(update 27 Okt'26)*: saat Produk = Briguna Mikro, di bawah tabel "Per kantor cabang" ada tabel **Per unit** (OS, DtD/MtD/YtD, %RKA, SML, NPL, debitur) dari database keragaan `Desc` = "Briguna Mikro D" dengan RKA per unit dari sheet RKA (mata anggaran × BRIGUNA MIKRO D × kode unit). Ikut saringan Area & Kantor Cabang (unit dipetakan ke kanca induk lewat Lampiran B). Unit tanpa baris RKA menampilkan %RKA "–". Pilihan Produk "Mikro Unit Dedicated" tetap tersedia untuk melihat seluruh halaman per unit.
- **Rentang tanggal & Mantri Mikro** *(update 22 Okt'26)*: tabel Nett punya kalender Dari–Sampai (plus tombol Bulan terpilih / 7 hari / 30 hari) dan dihitung dari transaksi harian per produk (`tx[].pr`: KA Karya, PP Pra-Purna, PU Purna). Tabel yang sama tampil di segmen Briguna Mikro (Nama Mantri). Target JG = jumlah target bulanan pada bulan yang tersentuh rentang.
- **Sync per menu** *(update 22 Okt'26, admin)*: tombol "Sync …" di bilah atas membangun ulang hanya data menu itu lewat `syncParts` (Keragaan = ker, Produktivitas = rmk Ritel+Mikro atau kpr, Nominatif/Kualitas = LW321 & DG/UG). Pipeline tidak punya sync sheet karena datanya diupload.
- **Tabel Produktivitas Nett RM Briguna Ritel** *(update 22 Okt'26, menu Produktivitas RM → segmen Briguna Ritel)*: per RM untuk bulan terpilih (bulan berjalan = tanggal 1 s.d. tanggal data terakhir) — Karya / Pra-Purna / Purna × Baru / Suplesi (Deb, OS), Total Nett Disburse, Target JG, GAP (= realisasi − target), % pencapaian, Kuadran; urut pencapaian tertinggi; baris Grand Total dan per Area. Produk: Kretap = Karya, Kresun = Purna, Umum = Pra-Purna ([12](12_database_disburse_dan_rm.md)). Mengikuti filter Area/KC di atasnya. Rincian produk dikirim Apps Script di `months[].pd`.
- **Brispot Briguna · Warm / Hot Leads** *(update 22 Okt'26, menu Pipeline Brispot → Briguna)*: 4 tabel RM / KC / Mantri / Unit dari file Brispot per jam; ketentuan & cara upload di [18](18_brispot_warm_hot_leads.md).

# ISTILAH

- Kata **DSR diganti RPC** (*repayment capacity*, batas angsuran terhadap penghasilan) di seluruh dashboard, termasuk simulasi. Default simulasi Briguna: RPC 70%, bunga 11%, tenor 120 bulan.

# DATABASE GOOGLE SHEETS (tambahan dari ketentuan 16)

| Sheet | Nama yang dikenali | Isi | Diisi oleh |
|---|---|---|---|
| Produktivitas KPR history | `Database History`, `produktivitas kpr history`, `kpr history`, `database history kpr` | bentuk sama dengan sheet "Database History" di `Database_Produktivitas.xlsx` (transaksi historis per RM) | user, impor .xlsx |
| Produktivitas KPR monthly | `Database Monthly`, `produktivitas kpr monthly`, `kpr monthly`, `database monthly kpr` | bentuk sama dengan sheet "Database Monthly" (rekap per RM per bulan) | user, impor .xlsx |
| `RM & KC card` | juga `RM KC card`, `RM dan KC card` | kolom **Tipe** (RM / KC), **Nama**, **Kunci**, **File ID**, **Diperbarui**, **Oleh** | otomatis dari upload Admin |
| `LW321`, `LW321 bulan lalu` | — | LW321 Briguna Ritel & Mikro posisi berjalan & pembanding | upload Admin |
| `LW321 KPR`, `LW321 KPR bulan lalu` | — | LW321 KPR posisi berjalan & pembanding | upload Admin |
| `users`, `access_log` | — | akun & log akses | otomatis |

- Sheet produktivitas KPR **berbeda bentuk** dengan `list RM ritel` / disburse; jangan diubah ke bentuk Briguna — Apps Script membaca masing-masing bentuk aslinya.
- Foto RM & ikon KC disimpan **privat** di folder Drive `KonsumerDashboard_foto`; sheet hanya menyimpan nama + File ID. Foto RM dipotong 320 px (webp), ikon KC 256 px (utuh/contain). Pencocokan nama memakai kunci nama ternormalisasi.
- Cache data di folder Drive `KonsumerDashboard_cache` (gzip).

# UPLOAD (oleh Admin dari website)

- LW321 Briguna Ritel & Mikro dan LW321 KPR: pilih **posisi berjalan** atau **bulan lalu**.
- Pipeline Brispot Briguna dan Pipeline KPR.
- Tabel suku bunga (rate) KPR.
- Foto RM / ikon KC (maks. 8 file per kali).
- Setelah upload, cache dibangun ulang; tombol **Sync** untuk memaksa.

# PERAN (RBAC)

| Peran | Akses |
|---|---|
| **Admin** | semua menu + Admin (upload, user, log), tombol Data |
| **RM** | semua menu kecuali Admin; Nominatif & Pipeline **hanya debitur/pipeline miliknya** — dicocokkan dari `rm_name` akun dengan RM pengelola di LW321/pipeline (nama dinormalisasi) **atau** PN akun. Akun RM wajib diisi `rm_name` / PN yang sama dengan di data. |
| **Guest** | agregat saja; **tanpa Nominatif**; Pipeline dengan nama debitur disamarkan (•••); Kualitas hanya agregat DG/UG |

# UNDUHAN

- Setiap bagian yang berisi tabel atau grafik punya tombol **Unduh**: **Excel (.xlsx)**, **CSV**, **PDF**, **Gambar (PNG)**.
- Excel/CSV = **data tabel lengkap** (semua baris, bukan hanya yang tampil); grafik tanpa tabel diunduh sebagai data grafiknya.
- PDF/PNG = **tampilan tabel atau grafiknya** (tabel berhalaman dibuka penuh dulu). PDF ukuran A4, otomatis lanskap untuk tabel lebar, multi-halaman, dengan judul & waktu unduh.
- CSV memakai pemisah `;` dan koma desimal (cocok untuk Excel lokal Indonesia).

# TAMPILAN & SFX

- Tampilan **mengikuti dashboard KPR plek ketiplek**: tema PS5, logo Danantara/BRI, animasi pembuka + audio, mode gelap/terang, zoom.
- SFX mengikuti `sfx-dashboard-kpr.zip` dan `PANDUAN-SOUND.md` ("Cara A" = file audio, cadangan synth): navigasi = enter, beranda = back, hover = hover (jeda min. 70 ms), on/close/klik sesuai panduan. Tombol suara di banner bisa mematikan.
- Judul aplikasi: **"Dashboard Konsumer Region I - Medan"**.

# ARSITEKTUR & KEAMANAN

- GitHub Pages (statis: `index.html`, `css/`, `js/`, `assets/`, `sfx/`) + Google Apps Script sebagai API & gatekeeper; spreadsheet tetap privat (publikasi web dimatikan, lihat ketentuan 16).
- **`google_apps_script.gs` tidak boleh diunggah ke repo publik.** Tidak ada data sensitif di file GitHub; semua data lewat Apps Script dengan token sesi.
- Password di-hash (SHA-256 di browser dengan prefix `briguna`, lalu hash bergaram di server) — akun dari Dashboard Briguna tetap berlaku.
- CSP ketat; pustaka luar hanya dari cdnjs (Chart.js, xlsx, jsPDF) dan jsdelivr (html-to-image untuk PDF/gambar). Bila jaringan kantor memblokir jsdelivr, unduhan PDF/PNG gagal.
- Logout otomatis setelah 30 menit tidak aktif.

# CARA UPGRADE DARI DASHBOARD BRIGUNA

1. Ganti seluruh isi Apps Script dengan `google_apps_script.gs` versi Konsumer.
2. Jalankan fungsi **`setup`** (bukan `doGet`) → membuat sheet sistem & `RM & KC card`; akun admin lama dipertahankan ("Akun admin sudah ada").
3. Deploy → Kelola deployment → **Versi baru** (URL tetap).
4. Isi `API_URL` di `js/config.js`, unggah file website ke GitHub.
5. Opsional: jalankan `installDailyTrigger` untuk sync harian.

# ⏳ Asumsi yang perlu dikonfirmasi user

- Aturan KPR Subsidi (FLPP/Sejahtera atau plafon ≤ 185 jt).
- ~~Deteksi Ritel vs Mikro pada file Pipeline Brispot Briguna.~~ *(dikonfirmasi 21 Okt'26 — lihat Aturan Hitung & [18](18_brispot_warm_hot_leads.md))*
- Hak pakai logo & audio pembuka di situs publik.

## Riwayat
- 21 Okt'26 — file dibuat dari sesi revisi Dashboard Konsumer gabungan (Briguna + KPR). Diuji dengan tiruan Apps Script: KPR OS 14 Okt'26 = 3.495.642,4 juta (sama dengan html KPR), RKA KPR Okt = 3.609.475; LW321 Briguna 30 Sep'26 66.864 rek. vs 31 Agu'26 68.012 rek.; LW321 KPR 13.402 rek. (3.340 Komersil, 10.062 Subsidi).
- 21 Okt'26 — deteksi Ritel vs Mikro di Brispot Briguna dikonfirmasi user (kata "Unit" di UNIT KERJA); rujukan ke ketentuan 18.

## Sub-ketentuan terkait
[16](16_database_dashboard_briguna_gsheet.md) · [11](11_database_kinerja_keragaan_dan_rka.md) · [12](12_database_disburse_dan_rm.md) · [09](09_pergerakan_dg_ug_historis_prognosa.md) · [10](10_format_kpi_kinerja_prognosa.md) · [13](13_master_kanca_area_unit_dedicated.md) · [01](01_dasar_definisi_kolom_dan_sumber_data.md) · [18](18_brispot_warm_hot_leads.md)
