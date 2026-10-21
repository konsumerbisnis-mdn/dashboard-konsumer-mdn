/* ================= master kanca, area & unit dedicated (Ketentuan LW321 Lampiran A & B) ================= */
const AREA_L = { "AREA 1": "AREA 1 / MEDAN", "AREA 2": "AREA 2 / PEMATANG SIANTAR", "AREA 3": "AREA 3 / LUBUK PAKAM", "AREA 4": "AREA 4 / PADANG SIDEMPUAN" };
const KC_MASTER = [[53,"KC Medan Putri Hijau",1],[336,"KC Medan Iskandar Muda",1],[367,"KC Medan Sisingamangaraja",1],[404,"KC Medan Gatot Subroto",1],[633,"KC Medan Thamrin",1],
  [113,"KC Pematang Siantar",2],[144,"KC Kabanjahe",2],[194,"KC Sidikalang",2],[228,"KC Rantau Prapat",2],[314,"KC Balige",2],[636,"KC Perdagangan",2],[2062,"KC Kota Pinang",2],
  [154,"KC Tanjung Balai",3],[238,"KC Binjai",3],[266,"KC Lubuk Pakam",3],[283,"KC Tebing Tinggi",3],[323,"KC Kisaran",3],[638,"KC Stabat",3],
  [85,"KC Sibolga",4],[99,"KC Tarutung",4],[135,"KC Padang Sidempuan",4],[176,"KC Gunung Sitoli",4],[637,"KC Panyabungan",4],[1097,"KC Sibuhuan",4],[201,"RO Medan",0]]
  .map(([boc, nama, a]) => ({ boc, nama, area: a ? AREA_L["AREA " + a] : "REGIONAL OFFICE" }));
const KC_BY = new Map(KC_MASTER.map(u => [String(u.boc), u]));
const UD_MASTER = [[3275,"Unit Sei Sikambing",404],[3382,"Unit Gatot Subroto",404],[3383,"Unit Kapten Muslim",404],[3530,"Unit Setiabudi",404],[5325,"Unit Pasar Glugur",404],
  [3342,"Unit Belawan",336],[3532,"Unit Pasar Pringgan",336],[5328,"Unit Simpang Pos",336],[5329,"Unit Titi Kuning",367],[5326,"Unit Sidorame",633],
  [3352,"Unit Pasar Horas",113],[5342,"Unit Parluasan",113],[3375,"Unit Jatinegara Binjai",238],[3376,"Unit Bangkatan Binjai",238],[3276,"Unit Stabat",638],
  [3538,"Unit Sei Rampah",283],[3834,"Unit Ahmad Yani Tebing Tinggi",283],[3535,"Unit Sisingamangaraja Sibolga",85],[3536,"Unit Sisingamangaraja Sidikalang",194],[5376,"Unit Salak",194],
  [3832,"Unit Teluk Dalam",176],[5266,"Unit Diponegoro Gunung Sitoli",176],[3833,"Unit Lau Cimba",144],[5288,"Unit Ahmad Dahlan Lubuk Pakam",266],[5338,"Unit Padang Matinggi",135],
  [5339,"Unit Sisingamangaraja Padang Sidempuan",135],[5384,"Unit Teluk Nibung",154],[5393,"Unit Silindung Tarutung",99],[7039,"Unit Samosir",314]];
const UD_BY = new Map(UD_MASTER.map(([c, n, k]) => [String(c), { nama: n, kc: k }]));
const kcName = code => (KC_BY.get(String(+code || code)) || {}).nama || (code ? "Uker " + code : "");
const kcAreaOf = code => (KC_BY.get(String(+code || code)) || {}).area || "LAINNYA";
// nama kanca dari teks bebas: "KC Binjai", "BINJAI", "00238 -- KC Binjai(Konsolidasi)" → master
const kcKey = s => String(s || "").toLowerCase().replace(/^\s*\d+\s*-+\s*/, "").replace(/\(.*?\)/g, "").replace(/^\s*(kc|kantor cabang)\s+/, "").replace(/y/g, "i").replace(/[^a-z]/g, "");
const KC_BYKEY = new Map(KC_MASTER.map(u => [kcKey(u.nama), u]));
const kcByName = nm => KC_BYKEY.get(kcKey(nm));
const kcArea = kc => { const u = kcByName(kc); return u ? u.area : ""; };
const kcClean = (code, txt) => { const u = KC_BY.get(String(+code)); if (u) return u.nama; const m = kcByName(txt); return m ? m.nama : String(txt || "").replace(/^\s*\d+\s*-+\s*/, "").replace(/\(.*?\)/g, "").trim(); };
const titleCase = s => String(s || "").toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase()).replace(/\s+/g, " ").trim();
