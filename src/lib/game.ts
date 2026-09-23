export const MODAL_AWAL = 50_000_000;
export const HARGA_AYAM = 50_000;
export const HARGA_TELUR_DASAR = 2_000;
export const BIAYA_OPERASIONAL_DASAR = 6_300_000;
export const LAYING_RATE = 0.8;
export const HARI_PER_BULAN = 30;

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  good: boolean;
  emoji: string;
}

export const EVENTS: GameEvent[] = [
  {
    id: "produksi-tinggi",
    title: "Produksi Tinggi",
    description: "Kondisi ayam sangat baik. Produksi telur meningkat 20%.",
    good: true,
    emoji: "📈",
  },
  {
    id: "pakan-naik",
    title: "Harga Pakan Naik",
    description: "Biaya pakan bertambah Rp1.000.000.",
    good: false,
    emoji: "🌾",
  },
  {
    id: "ayam-sakit",
    title: "Ayam Sakit",
    description:
      "Produksi telur turun 20% dan biaya obat bertambah Rp500.000.",
    good: false,
    emoji: "🤒",
  },
  {
    id: "telur-naik",
    title: "Harga Telur Naik",
    description: "Harga jual telur menjadi Rp2.200/butir.",
    good: true,
    emoji: "🥚",
  },
  {
    id: "permintaan-naik",
    title: "Permintaan Meningkat",
    description:
      "Seluruh telur berhasil terjual dan mendapat bonus Rp500.000.",
    good: true,
    emoji: "🛒",
  },
  {
    id: "wabah-penyakit",
    title: "Wabah Penyakit",
    description:
      "Wabah menyerang kandang. Produksi telur turun 40% dan biaya penanganan bertambah Rp1.500.000.",
    good: false,
    emoji: "🦠",
  },
];

export const BAD_EVENT_IDS = ["pakan-naik", "ayam-sakit", "wabah-penyakit"];
export const GOOD_EVENT_IDS = ["produksi-tinggi", "telur-naik", "permintaan-naik"];

const BAD_EVENTS = () => EVENTS.filter((e) => BAD_EVENT_IDS.includes(e.id));
const GOOD_EVENTS = () => EVENTS.filter((e) => GOOD_EVENT_IDS.includes(e.id));

/** 66% kartu buruk, 34% kartu baik. */
export function drawEvent(): GameEvent {
  const roll = Math.floor(Math.random() * 100) + 1;
  const pool = roll <= 66 ? BAD_EVENTS() : GOOD_EVENTS();
  return pool[Math.floor(Math.random() * pool.length)]!;
}

/* ---------- Anggaran otomatis (rasio kelipatan 10 ekor) ---------- */
export const BIAYA_TETAP = 1_800_000;

export interface BudgetBreakdown {
  totalAyam: number;
  kelompokAyam: number;
  biayaPakan: number;
  biayaObat: number;
  biayaKandang: number;
  biayaTetap: number;
  danaCadangan: number;
  biayaBeliAyam: number;
  totalPengeluaran: number;
}

export function hitungAnggaran(
  ayamDimiliki: number,
  ayamTambahan: number,
  bulan: number = 1,
): BudgetBreakdown {
  const totalAyam = ayamDimiliki + ayamTambahan;
  const kelompokAyam = Math.ceil(totalAyam / 10);
  const biayaPakan = kelompokAyam * 200_000;
  const biayaObat = kelompokAyam * 25_000;
  const biayaKandang = bulan === 1 ? kelompokAyam * 400_000 : 0;
  const biayaTetap = BIAYA_TETAP;
  const danaCadangan = Math.round(
    (biayaPakan + biayaObat + biayaKandang + biayaTetap) * 0.15,
  );
  const biayaBeliAyam = ayamTambahan * HARGA_AYAM;
  return {
    totalAyam,
    kelompokAyam,
    biayaPakan,
    biayaObat,
    biayaKandang,
    biayaTetap,
    danaCadangan,
    biayaBeliAyam,
    totalPengeluaran:
      biayaBeliAyam +
      biayaPakan +
      biayaObat +
      biayaKandang +
      biayaTetap +
      danaCadangan,
  };
}

export const TOTAL_BULAN = 3;

export interface GameResult {
  jumlahAyam: number;
  produksiPerBulan: number;
  hargaJualTelur: number;
  pendapatanBulanan: number;
  biayaOperasional: number;
  laba: number;
  poin: number;
}

export interface MonthRecord {
  bulan: number;
  event: GameEvent;
  result: GameResult;
}

/** Skor akhir berdasarkan total laba 3 bulan. */
export function hitungSkorAkhir(
  totalLaba: number,
  bonusPoint: boolean = false,
): number {
  let poin = 0;
  if (totalLaba > 12_000_000) poin = 30;
  else if (totalLaba >= 9_000_000) poin = 25;
  else if (totalLaba >= 6_000_000) poin = 20;
  else if (totalLaba >= 3_000_000) poin = 10;
  else if (totalLaba >= 0) poin = 5;
  else poin = -10;

  if (bonusPoint) poin += 10;
  return poin;
}

export function hitungHasil(jumlahAyam: number, event: GameEvent): GameResult {
  let produksiPerBulan = jumlahAyam * LAYING_RATE * HARI_PER_BULAN;
  let hargaJualTelur = HARGA_TELUR_DASAR;
  let biayaOperasional = BIAYA_OPERASIONAL_DASAR;
  let bonusPendapatan = 0;

  switch (event.id) {
    case "produksi-tinggi":
      produksiPerBulan *= 1.2;
      break;
    case "pakan-naik":
      biayaOperasional += 1_000_000;
      break;
    case "ayam-sakit":
      produksiPerBulan *= 0.8;
      biayaOperasional += 500_000;
      break;
    case "telur-naik":
      hargaJualTelur = 2_200;
      break;
    case "permintaan-naik":
      bonusPendapatan = 500_000;
      break;
    case "wabah-penyakit":
      produksiPerBulan *= 0.6;
      biayaOperasional += 1_500_000;
      break;
  }

  produksiPerBulan = Math.round(produksiPerBulan);
  const pendapatanBulanan = produksiPerBulan * hargaJualTelur + bonusPendapatan;
  const laba = pendapatanBulanan - biayaOperasional;

  let poin: number;
  if (laba > 4_000_000) poin = 30;
  else if (laba >= 3_000_000) poin = 25;
  else if (laba >= 2_000_000) poin = 20;
  else if (laba >= 1_000_000) poin = 10;
  else if (laba >= 0) poin = 5;
  else poin = -10;

  return {
    jumlahAyam,
    produksiPerBulan,
    hargaJualTelur,
    pendapatanBulanan,
    biayaOperasional,
    laba,
    poin,
  };
}

export function formatRupiah(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}Rp ${Math.abs(n).toLocaleString("id-ID")}`;
}
