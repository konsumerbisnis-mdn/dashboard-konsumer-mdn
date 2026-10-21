# 18 — Brispot Briguna: Warm Leads & Hot Leads per RM/Mantri

*Baru (21 Okt'26). Sumber: file `Brispot Briguna - <tgl> <jam> Temp.xlsx` (tarikan Brispot per jam).*

## Tujuan
Mengetahui posisi **warm leads + hot leads** milik tiap RM (Briguna Ritel) dan Mantri (Briguna Mikro) pada jam penarikan data, beserta pencairan sukses hari itu dibandingkan Rencana Realisasi dan Guidance.

## Kapan dirujuk
Setiap ada file Brispot Briguna baru, untuk membuat tabel leads per RM/Mantri dan per uker.

## Struktur file sumber
| Sheet | Fungsi | Dipakai? |
|---|---|---|
| **Nominatif** | Data mentah Brispot (A–AT), 1 baris = 1 pengajuan (REFNO). Kolom AU–BC = rumus bantu | Ya (data utama) |
| **Rule** | Peta STATUS KREDIT → STATUS & REMARKS | Ya |
| **LIST** | Master RM (C=Kanca, D=Nama RM) & Mantri (H=KC, I=Unit, J=Nama Mantri); named range `KANCA`, `RM`, `KC_UNIT`, `UNIT_KERJA`, `NAMA_MANTRI` | Ya |
| **RM BGRITEL** kolom Z6 dst. | Rencana Realisasi RM: Kanca, Nama RM, Karya/Purna/Pra-Purna (Deb, OS), **Total AH=Deb, AI=Net**, AJ7=tanggal rencana | Ya |
| **Mantri BGMIKRO** kolom AB6 dst. | Rencana Realisasi Mantri: Kanca, Unit, Nama, …, **Total AK=Deb, AL=Net**, AM7=tanggal rencana | Ya |
| Guidance (RM BGRITEL kol. Q = 315; Mantri BGMIKRO kol. S = 200), D/H mantri (kol. F) | Isian tetap per baris di template | Ya (diambil apa adanya) |
| Debitur Gajadi | Daftar CIF tidak jadi | **Abaikan** (tidak ada filter DEB JADI) |
| SBK Pelanggan, Unit Dedicated BGMIKRO | Pivot SBK / rekap dedicated | Tidak |
| Kolom Tindak lanjut / TGL CAIR (Nominatif), LIST kolom A | Isian manual | **Abaikan** |

## Aturan
1. **Klasifikasi (sheet Rule, cocok tanpa beda huruf besar/kecil & spasi):**
   - **WARM LEADS** = PRAKARSA (Sedang dalam proses prakarsa)
   - **HOT LEADS** dirinci 3 tahap: **MENUNGGU PUTUSAN** (Menunggu proses putusan kredit), **APPROVED** (Prakarsa telah diputus & siap cair), **MENUNGGU PENCAIRAN** (verifikasi pencairan; menunggu putusan pencairan; putusan berhasil diverifikasi ADK)
   - **PENCAIRAN SUKSES** = Pencairan Sukses
   - Lainnya (Prakarsa ditolak, Pencairan digagalkan, **Pencairan berhasil diputus**) = "-" / tidak dihitung.
2. **Nominal:** Warm & Hot memakai **PLAFON**; Pencairan Sukses menampilkan Plaf. dan **Net (NET OS)** — gap memakai Net. Teks "Rp x.xxx,-" dikonversi ke angka; tabel dalam **Rp juta**.
3. **Unik per NIK:** 1 NIK = 1 lead. Bila NIK punya beberapa REFNO, ambil status paling maju (Cair > Hot > Warm > "-"), lalu pengajuan terbaru. FLAG DOUBLE di template (isian manual) tidak dipakai — dihitung ulang.
4. **Cakupan waktu:** warm/hot = **seluruh** pengajuan di nominatif. Pencairan Sukses = tanggal pencairan **sama dengan tanggal Rencana Realisasi** (hari tarikan), mengikuti template.
5. **Atribusi:** NAMA PEMRAKARSA dicocokkan ke LIST. Nama RM pasti Briguna Ritel, nama Mantri pasti Briguna Mikro → **tidak perlu filter SEGMEN** (template lama: kolom Plaf tanpa filter segmen = human error, dikonfirmasi). Nama beda ejaan dicocokkan fuzzy (≥0,9) dan dilaporkan, mis. Brispot "Hotdinar Oktaviana Gultom" = LIST "Hotdinar Oktaviani Gultom".
6. **SEGMEN** (bila diperlukan): UNIT KERJA mengandung "Unit" (case-insensitive) → BG MIKRO, selain itu BG RITEL — sudah benar termasuk unit dedicated.
7. **Uker Mantri** mengikuti LIST (master template). Selisih dengan unit di Brispot dilaporkan ke user.

## Format output — mengikuti persis sheet template *(update 21 Okt'26)*
Output = file Excel berisi 4 sheet template **RM BGRITEL, KC BGRITEL, Mantri BGMIKRO, Unit BGMIKRO** (format, warna, conditional formatting, kolom tersembunyi dipertahankan), sheet lain dibuang, semua sel diisi **nilai** (bukan rumus) agar terbaca di HP/preview.

Kolom tiap tabel:
`No | (Kode Uker, tersembunyi) | Kantor Cabang | [Unit] | Nama RM/Mantri atau Jumlah RM/Mantri | [D/H, tersembunyi] | Rencana Realisasi <tgl> (Deb, Net) | WARM LEADS – Prakarsa (Deb, Plaf.) | Hot Leads – Menunggu putusan, Approved, Menunggu Pencairan, TOTAL (Deb, Plaf. masing-masing) | Target Disburse – Guidance, Gap Hot Leads thd Guidance (= Total Hot Plaf − Guidance) | Pencairan Sukses (Deb, Plaf., Net) | Gap Rencana Real vs Pencairan Sukses (= Net cair − Net rencana)` + baris TOTAL.

Setiap sheet berisi 2 tabel:
- **Tabel atas** — urutan master LIST (KC/Unit = agregasi dari sheet RM/Mantri).
- **Tabel bawah ("SORT BY", versi kirim)** — diurutkan: Pencairan Sukses Net ↓, lalu Total Hot Plaf ↓, lalu Warm Plaf ↓; dilengkapi "Pukul : HH:MM" dan teks WA: *"Berikut disampaikan Brispot Briguna Ritel/Mikro per RM/KC/Mantri/Unit posisi dd mmmm yyyy Brispot (Update HH:MM WIB)."* — jam diambil dari nama file tarikan.

## Validasi
- Total Warm/Hot = hitungan REFNO aktif di Nominatif setelah dedup NIK.
- Per sel dibandingkan dengan nilai template; beda hanya pada kasus ejaan nama (21 Okt'26: Hotdinar / KC Tarutung).
- Total tabel atas = jumlah baris tabel bawah.

## Riwayat
- 21 Okt'26 — dibuat dari Brispot 21 Okt 26 jam 14.16. Ritel: Warm 192 deb / Rp32.884 jt, Hot 57 / Rp14.931 jt (putusan 13, approved 31, menunggu cair 13), cair hari ini 4 / Net Rp1.040 jt. Mikro: Warm 138 / Rp26.379 jt, Hot 21 / Rp4.860 jt, cair 1 / Net Rp116 jt.
- 21 Okt'26 — format output diubah dari tabel ringkas menjadi persis layout 4 sheet template.

## ⏳ Terbuka
- Selisih unit mantri LIST vs Brispot: Artha Bella Tambunan (LIST Samosir vs Brispot Pangururan Balige), Muhammad Ilham ↔ Muhammad Affandi (Simpang Pos/Belawan tertukar), Norika (penamaan Unit Ahmad Yani). Menunggu konfirmasi.

Terkait: [17](17_dashboard_konsumer_web.md) (Pipeline Brispot), [12](12_database_disburse_dan_rm.md) (master RM), [13](13_master_kanca_area_unit_dedicated.md).
