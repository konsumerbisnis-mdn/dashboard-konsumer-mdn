# 15 · Update Materi Briguna (PPT Executive Committee Region 1 / Medan)

*Sub-ketentuan baru (15 Okt'26) · file `15_update_materi_briguna.md` · indeks: [00_INDEX.md](00_INDEX.md)*

## Tujuan
Cara Claude memperbarui materi Briguna (PPT "Materi Briguna – Oktober 2026") setiap bulan/minggu: slide mana mengambil angka dari mana, rumus yang sudah **diverifikasi cocok dengan PPT Okt'26**, angka yang wajib ditanyakan ke user, dan aturan penyajian.

## Kapan dirujuk
- User meminta "update materi Briguna", slide Briguna, atau evaluasi bulanan/progress ke prognosa.

## Konteks minimum
- Sumber angka utama: `DB Keragaan Disburse RKA.xlsx` ([11](11_database_kinerja_keragaan_dan_rka.md), [12](12_database_disburse_dan_rm.md)). Rumus %Penc: [10](10_format_kpi_kinerja_prognosa.md). PH: [08](08_lw325_ph_hapus_buku.md). DG/UG & prognosa: [09](09_pergerakan_dg_ug_historis_prognosa.md). Instansi: [04](04_database_instansi_kurasi.md). Leads: [05](05_data_leads_sumber_dan_kolom.md), [06](06_penetrasi_leads_dan_slicing_astri.md).

---

# ATURAN

## 1. Lingkup deck
- "Briguna" di kartu OS/SML/NPL = **Briguna Ritel** (Karya + Purna + Pra-Purna). **Mikro** hanya muncul di slide disburse dan growth (dan guidance).
- Slide **KPR dibuang**. Slide lampiran tersembunyi (16–32 di PPT Okt'26) **tidak ikut** kecuali diminta.
- Desain boleh berubah; **datanya** yang baku. Pertahankan logo Danantara & BRI, palet biru BRI (batang gelap = realisasi, biru muda = RKA, garis = %Penc), judul pil, kartu berbingkai. Grafik dibuat native (bisa diedit). Rapikan teks yang saling menimpa.

## 2. Dua mode tanggal (user yang menentukan tiap kali)
| Mode | Dipakai untuk | Posisi data |
|---|---|---|
| **A. Akhir bulan (EOM)** | Evaluasi bulanan | Tanggal akhir bulan terakhir; riwayat Jan–EOM. |
| **B. Tanggal berjalan** | Progress ke prognosa | Tanggal yang diminta user (bukan otomatis tanggal terbaru DB); riwayat tetap EOM, titik terakhir = tanggal berjalan. |

- Selalu tulis tanggal posisi di tiap slide (mis. "13-Okt-26").
- **Jika user belum menyebut mode/tanggal, tanyakan.**

## 3. SML berjalan (bukan anomali)
Pada **bulan berjalan** (bukan akhir bulan), SML Ritel wajar jauh lebih tinggi daripada EOM (contoh: SML 30 Sep'26 = 91 M [1,5%] vs 13 Okt'26 = 436 M [7,3%]) karena tanggal jatuh tempo debitur tidak sama dengan tanggal gaji masuk — debitur "SML berjalan" menunggak beberapa hari tiap bulan. Aturan:
- Jangan menyebutnya lonjakan/memburuk; beri catatan "SML berjalan, mengikuti tanggal gajian".
- Bandingkan dengan **tanggal yang sama bulan lalu** bila datanya ada, atau jelaskan bahwa perbandingan dengan EOM tidak setara.
- Prognosa dan %Penc SML tetap mengacu EOM bulan prognosa.

## 4. Peta slide → sumber → rumus (PPT Okt'26)
Satuan Keragaan/Disburse = Rp juta; RKA = Rupiah penuh (bagi 1.000.000). Mode tanggal berlaku untuk semua angka "posisi".

| Slide | Isi | Sumber | Rumus / catatan |
|---|---|---|---|
| 2 | OS, growth YoY, SML, NPL Briguna Ritel | Keragaan (`Desc` = Briguna Ritel) | OS/SML(`DPK`)/NPL pada tanggal posisi; %SML = SML÷OS; growth YoY = OS ÷ OS tanggal sama tahun lalu − 1 |
| 2 | Komposisi per produk (debitur & OS) | Keragaan (Karya, Purna, Pra-Purna) | Persentase terhadap Ritel; jangan jumlahkan baris "Briguna Ritel" bersama komponen |
| 2 | Marketshare | **File marketshare** (bukan DB) | MS = OS BRI ÷ OS Industri; Δ dalam bps |
| 2 | Produktivitas RM (jumlah RM per kuadran/bulan; tabel target JG) | `Database RM` | Hitung baris per `Bulan` × `Kuadran`; target per `JG` dari kolom `Target` |
| 3, 5 | OS/SML/NPL vs RKA + %Penc | Keragaan + RKA (kode uker `B`) | OS/DEB: realisasi ÷ RKA; SML/NPL: RKA ÷ realisasi ([10](10_format_kpi_kinerja_prognosa.md)). Titik "Prog. Okt–Des" = **prognosa dari user (tanya)** |
| 3, 5, 6 | Net disburse bulanan | `Disburse` | **Σ `Delta Suplesi` per bulan `TGL_REALISASI`** (Ritel; Rp juta) — terverifikasi identik dengan PPT Jan–13 Okt'26 |
| 5 | Delta OS MtD | Keragaan | **OS(tanggal) − OS(EOM bulan sebelumnya)** Briguna Ritel — terverifikasi (11.435 … 47.451) |
| 5 | Run Off | Turunan | **Run Off = Net Disb − ΔOS MtD** (PH sudah termasuk di dalamnya; contoh Sep'26: 125.301 − 47.451 = 77.850). Rata-rata run off = rata-rata bulan penuh |
| 5 | PH per bulan | LW325 ([08](08_lw325_ph_hapus_buku.md)) | Σ `SISA AKHIR PH POKOK` per bulan `TGL PH`, filter Ritel |
| 5 | Tabel kebutuhan disburse | Turunan | Kebutuhan = (Prognosa − OS posisi) + Run Off + PH; per hari = ÷ hari kerja tersisa; per RM = ÷ jumlah RM. **Prognosa & input Mikro: tanya user** |
| 5 | Man power | — | **Tanya user** (CBM, Matnri, RM, SO) |
| 6, 7 | Trend disburse Ritel & Mikro | Ritel: `Disburse`; **Mikro: dari user** | — |
| 7 | Growth Ritel/Mikro | Keragaan | = ΔOS bulanan (Rp miliar); Mikro dari baris `Briguna Mikro` (**bukan** `Briguna Mikro D`) |
| 7 | Kuadran RM Ritel | `Database RM` | Jumlah RM per `Kuadran` per `Bulan` (terverifikasi cocok setelah DB dikoreksi). **Kuadran Mantri Mikro: dari user** |
| 8 | DG/UG SML & NPL bulanan | LW321 antar 2 posisi + [09](09_pergerakan_dg_ug_historis_prognosa.md) | Butuh pasangan LW321 per bulan |
| 9–13 | Top instansi DG/UG, potensi DG NPL, prognosa UG, pipeline | LW321 + database instansi ([04](04_database_instansi_kurasi.md)) + **file Managing Portofolio** | Lihat bagian 5 |
| 4 | Strategi, top penyebab, langkah penanganan, pipeline | File Managing Portofolio, leads, RM DB | Angka di dalam kalimat diperbarui; narasi/program lain `[isi manual]` |

## 5. File Managing Portofolio (akan diunggah user)
- Isi: **LW321 khusus SML dan NPL** yang sudah dilengkapi **PROGNOSA bulan berikutnya, PENYEBAB, RTL (rencana tindak lanjut)**, dan keterangan lain.
- Dipakai untuk: tabel "Top Penyebab SML & NPL Baru", prognosa UG/DG (slide 12–13), pipeline UG, dan kalimat langkah penanganan.
- **Struktur kolom belum diketahui** — saat file pertama diunggah, pelajari kolomnya lalu catat di bagian ini.

## 6. Angka yang WAJIB ditanyakan ke user (jangan ditebak)
1. **Prognosa** OS/SML/NPL (Okt–Des) dan angka guidance (Prog. bulan berikutnya).
2. **Data Mikro**: net disburse bulanan, kuadran Mantri Mikro (belum ada di DB).
3. **Man power** (jumlah CBM/Matnri/RM/SO) dan program/narasi strategi.
4. **Industri marketshare** bila file marketshare terbaru belum diunggah.
5. Mode & tanggal posisi (bagian 2).

Angka yang tidak punya sumber ditulis `[isi manual]` di slide, bukan dikira-kira.

## 7. Catatan kualitas data
- Sheet DB sekarang bernama `Keragaan`, `RKA`, `Disburse`, `Database RM` (di [11](11_database_kinerja_keragaan_dan_rka.md) masih nama lama). `Database RM` kini punya kolom `Net Disb`, `%Kuadran`, `Kuadran`. `Disburse` punya dua kolom `SUKU_BUNGA` ([12](12_database_disburse_dan_rm.md)).
- Di `Keragaan` ada baris `Desc` = `Briguna Pra0Purna` (typo, 28 Sep–1 Okt'26, 50 baris) — **diperlakukan sebagai Briguna Pra-Purna**; Ritel = Karya + Purna + Pra-Purna (termasuk baris itu).
- Uker 201 (Kanwil/RO) ikut total RO; RKA RO = baris kode `B` ([11](11_database_kinerja_keragaan_dan_rka.md)).
- Typo di PPT lama yang jangan diulang: label "Mei-25" (seharusnya Mei-26); kalimat berbunga "…….".

## 8. Checklist sebelum menyerahkan deck
- Tanggal posisi tertulis di tiap slide dan konsisten.
- Net disb, ΔOS, run off saling cocok (Net Disb − ΔOS = Run Off).
- %Penc searah aturan 10; komposisi produk = 100%.
- Semua `[isi manual]` didaftar di akhir balasan.

---

## Riwayat
- 15 Okt'26: dibuat dari pelatihan atas PPT "Materi Briguna – Oktober 2026". Status: **aturan siap; deck belum dibuat**. Rumus Net Disb, ΔOS, Run Off, dan Kuadran sudah dicocokkan dengan angka di PPT Okt'26.

## Sub-ketentuan terkait
[11](11_database_kinerja_keragaan_dan_rka.md) · [12](12_database_disburse_dan_rm.md) · [10](10_format_kpi_kinerja_prognosa.md) · [09](09_pergerakan_dg_ug_historis_prognosa.md) · [08](08_lw325_ph_hapus_buku.md) · [04](04_database_instansi_kurasi.md) · [06](06_penetrasi_leads_dan_slicing_astri.md)
