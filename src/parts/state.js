/* ================= state (data dari Apps Script, tidak disimpan permanen di perangkat) ================= */
// DB.ker = keragaan & RKA semua produk · DB.rmkSets = produktivitas {R: Briguna Ritel, M: Briguna Mikro, K: KPR}
// DB.pipeSets = pipeline {B: Briguna, K: KPR} · DB.lwSets = LW321 {B, K} · DB.gerak = agregat DG/UG · DB.rate = suku bunga KPR · DB.foto = {rm, kc}
const DB = { source: "server", rmkSets: {}, pipeSets: {}, lwSets: {}, gerak: {}, foto: { rm: {}, kc: {} } };
const S = { periode: null, unit: "ALL" };
const LOADING = { core: true, lw: true };
let KER_LOADING = true, RM_LOADING = true, PIPE_LOADING = true, RATE_LOADING = true;
// segmen aktif per menu (diingat per perangkat)
const SEG = Object.assign({ rm: "R", pipe: "B", lw: "B", sim: "brg" }, lsGet(STORE + "-seg") || {});
const saveSEG = () => lsSet(STORE + "-seg", SEG);
const RML = {
  R: { key: "R", seg: "Briguna Ritel", role: "Relationship Manager Briguna", who: "RM", s: "Baru", k: "Suplesi", isS: t => t.jenis === "Baru",
    note: "Baru = realisasi baru; Suplesi = tambahan plafon (net Delta Suplesi, Rp juta). Target dari sheet list RM ritel." },
  M: { key: "M", seg: "Briguna Mikro", role: "Mantri Briguna Mikro", who: "Mantri", s: "Baru", k: "Suplesi", isS: t => t.jenis === "Baru",
    note: "Baru = realisasi baru; Suplesi = tambahan plafon (net Delta Suplesi, Rp juta). Nama mantri dicocokkan lewat PN dari sheet list mantri mikro." },
  K: { key: "K", seg: "KPR", role: "Relationship Manager KPR", who: "RM", s: "Subsidi", k: "Komersil", isS: t => t.jenis === "KPRS",
    note: "Subsidi = KPR Sejahtera (FLPP); Komersil = Tier 1–3, Secondary, Take Over & Top Up." }
};
let RL = RML.K;
function useRM(seg) {
  SEG.rm = RML[seg] ? seg : "R"; RL = RML[SEG.rm];
  const P = DB.rmkSets[SEG.rm]; DB.rmk = P && P.months && P.months.length ? P : null;
}
const PIPEL = { B: { key: "B", seg: "Briguna Ritel & Mikro", j: ["Ritel", "Mikro"] }, K: { key: "K", seg: "KPR", j: ["Subsidi", "Komersil"] } };
let PL = PIPEL.K;
function usePipe(seg) { SEG.pipe = PIPEL[seg] ? seg : "B"; PL = PIPEL[SEG.pipe]; DB.pipe = DB.pipeSets[SEG.pipe] || null; }
const LWL = { B: { key: "B", seg: "Briguna Ritel & Mikro" }, K: { key: "K", seg: "KPR" } };
const isMidMonth = d => +d.slice(8) < new Date(+d.slice(0, 4), +d.slice(5, 7), 0).getDate();
const role = () => (Auth.user || {}).role || "guest";
const isAdmin = () => role() === "admin";
