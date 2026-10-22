/* Konfigurasi umum. Hanya berisi alamat API dan pengaturan tampilan: TIDAK ada data atau password di sini,
   karena file ini publik di GitHub Pages. */
window.APP_CONFIG = Object.freeze({
  // URL Web App Google Apps Script (Deploy → Web app → salin URL yang berakhiran /exec)
  API_URL: "https://script.google.com/macros/s/AKfycbzO3N5mWev3h5F6BIFktlfZm9BLhT184EbqrCJDviVH3bheqhp_9dflaLJ9iPMbidRv/exec",
  APP_NAME: "Dashboard Konsumer Region I - Medan",
  // awalan hash password di browser; harus sama dengan setup() di Apps Script ('briguna')
  HASH_PREFIX: "briguna",
  // keluar otomatis bila tidak ada aktivitas (menit)
  IDLE_MINUTES: 30,
  // batas waktu satu request ke Apps Script (detik)
  TIMEOUT_SEC: 120,
  // batas waktu Sync (detik): server membangun ulang semua data, bisa sampai ±6 menit
  SYNC_TIMEOUT_SEC: 420,
  // ukuran potongan upload LW321 (baris per request)
  UPLOAD_CHUNK: 4000,
  // nilai awal Simulasi Briguna
  SIM_BRIGUNA: { RPC: 70, RATE: 11, TENOR: 120 }
});
