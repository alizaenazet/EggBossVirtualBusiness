import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bird,
  Coins,
  Egg,
  Home,
  PiggyBank,
  Play,
  Pill,
  RotateCcw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Volume2,
  VolumeX,
  Wallet,
  Wheat,
} from "lucide-react";
import {
  drawEvent,
  formatRupiah,
  hitungAnggaran,
  hitungHasil,
  hitungSkorAkhir,
  HARGA_AYAM,
  MODAL_AWAL,
  TOTAL_BULAN,
  type BudgetBreakdown,
  type GameEvent,
  type MonthRecord,
} from "@/lib/game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Egg Boss — Jadi Juragan Ayam Petelur!" },
      {
        name: "description",
        content:
          "Game simulasi anggaran usaha ayam petelur 3 bulan: atur modal, ambil kartu kejadian, dan raih laba sebesar-besarnya.",
      },
      { property: "og:title", content: "Egg Boss — Jadi Juragan Ayam Petelur!" },
      {
        property: "og:description",
        content:
          "Kelola anggaran selama 3 bulan, rawat ayam, jual telur, raih laba. Game edukasi budgeting yang seru!",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EggBoss,
});

type Screen = "menu" | "budgeting" | "manage" | "event" | "result" | "final";

function EggBoss() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [currentMonth, setCurrentMonth] = useState(1);
  const [modal, setModal] = useState(MODAL_AWAL);
  const [totalLaba, setTotalLaba] = useState(0);
  const [kehabisanModal, setKehabisanModal] = useState(false);
  const [history, setHistory] = useState<MonthRecord[]>([]);

  const [jumlahAyam, setJumlahAyam] = useState(0);
  const [beliAyam, setBeliAyam] = useState(0);
  const [event, setEvent] = useState<GameEvent | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const startMusic = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => { });
    }
  };

  const startGame = () => {
    setScreen("budgeting");
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const anggaran = useMemo(
    () => hitungAnggaran(jumlahAyam, beliAyam, currentMonth),
    [jumlahAyam, beliAyam, currentMonth],
  );
  const totalAyam = anggaran.totalAyam;
  const modalTersisa = modal - anggaran.totalPengeluaran;
  const saldoMinus = modalTersisa < 0;
  const canContinue = totalAyam > 0 && (currentMonth > 1 || beliAyam > 0);

  const result = useMemo(
    () => (event ? hitungHasil(totalAyam, event) : null),
    [event, totalAyam],
  );

  const reset = () => {
    setScreen("menu");
    setCurrentMonth(1);
    setModal(MODAL_AWAL);
    setTotalLaba(0);
    setKehabisanModal(false);
    setHistory([]);
    setJumlahAyam(0);
    resetAnggaran();
    setEvent(null);
  };

  const resetAnggaran = () => {
    setBeliAyam(0);
  };

  const confirmBudget = () => {
    if (currentMonth === 1) {
      setJumlahAyam(beliAyam);
    } else {
      setJumlahAyam((prev) => prev + beliAyam);
    }
    setModal(modalTersisa);
    if (modalTersisa < 0) setKehabisanModal(true);
    setBeliAyam(0);
    setScreen("manage");
  };

  const finishMonth = () => {
    if (!result || !event) return;
    const modalBaru = modal + result.laba;
    setModal(modalBaru);
    setTotalLaba((t) => t + result.laba);
    if (modalBaru < 0) setKehabisanModal(true);
    setHistory((h) => [...h, { bulan: currentMonth, event, result }]);
    setEvent(null);
    resetAnggaran();
    if (currentMonth >= TOTAL_BULAN) {
      setScreen("final");
    } else {
      setCurrentMonth((m) => m + 1);
      setScreen("budgeting");
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Fixed corner Audio toggle button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleMute}
          className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-transform hover:scale-105 active:scale-95"
          title={isMuted ? "Unmute Musik" : "Mute Musik"}
          aria-label={isMuted ? "Unmute Musik" : "Mute Musik"}
        >
          {isMuted ? (
            <VolumeX className="size-5 text-muted-foreground" />
          ) : (
            <Volume2 className="size-5 text-primary" />
          )}
        </button>
      </div>

      <audio ref={audioRef} src="/backsound.mp3" loop preload="auto" />

      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-10">
        {screen === "menu" && (
          <MenuScreen key="menu" onStartMusic={startMusic} onEnterGame={startGame} />
        )}
        {screen === "budgeting" && (
          <BudgetScreen
            key={`budget-${currentMonth}`}
            currentMonth={currentMonth}
            modal={modal}
            ayamDimiliki={jumlahAyam}
            beliAyam={beliAyam}
            setBeliAyam={setBeliAyam}
            anggaran={anggaran}
            modalTersisa={modalTersisa}
            saldoMinus={saldoMinus}
            canContinue={canContinue}
            onNext={confirmBudget}
          />
        )}
        {screen === "manage" && (
          <ManageScreen
            key={`manage-${currentMonth}`}
            currentMonth={currentMonth}
            jumlahAyam={jumlahAyam}
            modal={modal}
            onNext={() => setScreen("event")}
          />
        )}
        {screen === "event" && (
          <EventScreen
            key={`event-${currentMonth}`}
            currentMonth={currentMonth}
            event={event}
            onDraw={() => setEvent(drawEvent())}
            onNext={() => setScreen("result")}
          />
        )}
        {screen === "result" && result && event && (
          <ResultScreen
            key={`result-${currentMonth}`}
            currentMonth={currentMonth}
            result={result}
            event={event}
            totalLaba={totalLaba}
            onNext={finishMonth}
          />
        )}
        {screen === "final" && (
          <FinalScreen
            key="final"
            history={history}
            totalLaba={totalLaba}
            kehabisanModal={kehabisanModal}
            modal={modal}
            onRestart={reset}
          />
        )}
      </div>
    </div>
  );
}

function MonthBadge({ bulan }: { bulan: number }) {
  return (
    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
      Bulan {bulan} dari {TOTAL_BULAN}
    </p>
  );
}

/* ---------------- Screen 0: Multi-Step Onboarding ---------------- */

function MenuScreen({
  onStartMusic,
  onEnterGame,
}: {
  onStartMusic: () => void;
  onEnterGame: () => void;
}) {
  const [step, setStep] = useState(0);

  const goStep1 = () => {
    onStartMusic();
    setStep(1);
  };

  return (
    <div className="flex w-full flex-col items-center justify-center text-center">
      {/* ---- Step 0: Splash Screen ---- */}
      {step === 0 && (
        <div key="step-0" className="animate-fade-in-up flex flex-col items-center gap-6">
          <div className="animate-egg-bounce flex size-32 items-center justify-center rounded-full bg-yolk shadow-xl shadow-primary/30">
            <Egg className="size-16 text-primary-foreground" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="font-display text-6xl font-extrabold tracking-tight text-foreground sm:text-7xl">
              🐔 EGG BOSS
            </h1>
            <p className="mt-3 font-display text-2xl font-bold text-primary">
              Jadi Juragan Ayam Petelur!
            </p>
          </div>
          <button
            onClick={goStep1}
            className="animate-pulse-glow mt-4 inline-flex items-center gap-3 rounded-full bg-primary px-10 py-5 font-display text-xl font-extrabold text-primary-foreground shadow-lg shadow-primary/40 transition-transform hover:scale-105 active:scale-95"
          >
            <Play className="size-6 fill-current" />
            Mulai Bermain
          </button>
        </div>
      )}

      {/* ---- Step 1: Modal Awal ---- */}
      {step === 1 && (
        <div key="step-1" className="animate-fade-in-up w-full max-w-sm">
          <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-2xl backdrop-blur-md">
            <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-yolk/20">
              <Wallet className="size-10 text-primary" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Suntikan Dana
            </p>
            <p className="mt-3 font-display text-lg font-bold leading-relaxed text-foreground">
              Anda mendapatkan suntikan dana awal sebesar{" "}
              <span className="text-primary">{formatRupiah(MODAL_AWAL)}</span>.
            </p>
            <button
              onClick={() => setStep(2)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-lg shadow-primary/40 transition-transform hover:scale-[1.02] active:scale-95"
            >
              Lanjut
              <ArrowRight className="size-5" />
            </button>
          </div>
        </div>
      )}

      {/* ---- Step 2: Mekanik Dasar ---- */}
      {step === 2 && (
        <div key="step-2" className="animate-fade-in-up w-full max-w-sm">
          <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-2xl backdrop-blur-md">
            <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-yolk/20">
              <p className="text-[55px] text-primary">
                🐔
              </p>
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Mekanik Dasar
            </p>
            <p className="mt-3 font-display text-lg font-bold leading-relaxed text-foreground">
              Beli ayam seharga{" "}
              <span className="text-primary">{formatRupiah(HARGA_AYAM)}/ekor</span>.{" "}
              Kelola anggaran pakan, obat, dan hadapi berbagai kejadian tak
              terduga di pasar.
            </p>
            <button
              onClick={() => setStep(3)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-lg shadow-primary/40 transition-transform hover:scale-[1.02] active:scale-95"
            >
              Lanjut
              <ArrowRight className="size-5" />
            </button>
          </div>
        </div>
      )}

      {/* ---- Step 3: Tujuan Game ---- */}
      {step === 3 && (
        <div key="step-3" className="animate-fade-in-up w-full max-w-sm">
          <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-2xl backdrop-blur-md">
            <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-yolk/20">
              <Trophy className="size-10 text-primary" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Tujuan Game
            </p>
            <p className="mt-3 font-display text-lg font-bold leading-relaxed text-foreground">
              Bertahanlah selama {TOTAL_BULAN} bulan (1 Kuartal). Kumpulkan laba
              setinggi-tingginya dan buktikan Anda adalah{" "}
              <span className="text-primary">Egg Boss</span> sejati!
            </p>
            <button
              onClick={onEnterGame}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-lg shadow-primary/40 transition-transform hover:scale-[1.02] active:scale-95"
            >
              <Target className="size-5" />
              Masuk ke Peternakan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Round 1: Budgeting ---------------- */

interface BudgetProps {
  currentMonth: number;
  modal: number;
  ayamDimiliki: number;
  beliAyam: number;
  setBeliAyam: (n: number) => void;
  anggaran: BudgetBreakdown;
  modalTersisa: number;
  saldoMinus: boolean;
  canContinue: boolean;
  onNext: () => void;
}

function BudgetScreen(p: BudgetProps) {
  const a = p.anggaran;
  const rows = [
    {
      icon: <Wheat className="size-5 text-primary" />,
      label: "Biaya Pakan",
      value: a.biayaPakan,
      hint: `${a.kelompokAyam} kelompok × Rp 200.000`,
    },
    {
      icon: <Pill className="size-5 text-primary" />,
      label: "Biaya Obat / Vitamin",
      value: a.biayaObat,
      hint: `${a.kelompokAyam} kelompok × Rp 25.000`,
    },
    {
      icon: <Home className="size-5 text-primary" />,
      label: "Kandang & Peralatan",
      value: a.biayaKandang,
      hint:
        p.currentMonth === 1
          ? `${a.kelompokAyam} kelompok × Rp 400.000`
          : "Rp 0 (Hanya dibayar pada Bulan 1)",
    },
    {
      icon: <Wallet className="size-5 text-primary" />,
      label: "Biaya Tetap",
      value: a.biayaTetap,
      hint: "Listrik & air, tenaga kerja, transportasi, lain-lain",
    },
    {
      icon: <PiggyBank className="size-5 text-primary" />,
      label: "Dana Cadangan (15%)",
      value: a.danaCadangan,
      hint: "15% dari total biaya operasional",
    },
  ];

  return (
    <div className="animate-card-in w-full">
      <div className="mb-6 text-center">
        <MonthBadge bulan={p.currentMonth} />
        <h2 className="font-display text-3xl font-extrabold text-foreground">
          Ronde 1 — Atur Anggaran 💰
        </h2>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          Anggaran dihitung otomatis dari jumlah ayammu (per kelipatan 10 ekor).
        </p>
      </div>

      <div
        className={`mb-6 rounded-2xl border px-5 py-4 text-center shadow-sm ${p.saldoMinus
          ? "border-destructive/40 bg-destructive/10"
          : "border-border bg-card"
          }`}
      >
        <p className="text-sm font-bold text-muted-foreground">Sisa Kas</p>
        <p
          className={`font-display text-3xl font-extrabold ${p.saldoMinus ? "text-loss" : "text-profit"
            }`}
        >
          {formatRupiah(p.modalTersisa)}
        </p>
        <p className="mt-1 text-xs font-bold text-muted-foreground">
          Kas tersedia bulan ini: {formatRupiah(p.modal)}
          {p.ayamDimiliki > 0 && ` • Ayam dimiliki: ${p.ayamDimiliki} ekor`}
        </p>
        {p.saldoMinus && (
          <p className="mt-2 text-sm font-bold text-loss">
            ⚠️ Peringatan: Saldo minus! Anda beroperasi dengan hutang, namun
            tetap bisa lanjut ke bulan berikutnya.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <NumberField
            icon={<Bird className="size-5 text-primary" />}
            label={
              p.ayamDimiliki > 0
                ? "Beli Ayam Tambahan (ekor) — opsional"
                : "Jumlah Ayam yang dibeli (ekor)"
            }
            value={p.beliAyam}
            onChange={p.setBeliAyam}
            placeholder={p.ayamDimiliki > 0 ? "0" : "cth: 100"}
          />
          <p className="mt-2 rounded-xl bg-secondary px-3 py-2 text-sm font-bold text-secondary-foreground">
            Biaya beli = {p.beliAyam} × {formatRupiah(HARGA_AYAM)} ={" "}
            {formatRupiah(a.biayaBeliAyam)}
          </p>
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            Total ayam: {a.totalAyam.toLocaleString("id-ID")} ekor →{" "}
            {a.kelompokAyam} kelompok (per 10 ekor)
          </p>
        </div>

        {rows.map((r) => (
          <div
            key={r.label}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm opacity-95"
          >
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
              {r.icon}
              {r.label}
            </span>
            <div className="flex items-center gap-2 rounded-xl border border-input bg-muted px-4 py-3">
              <span className="font-bold text-muted-foreground">Rp</span>
              <input
                type="text"
                readOnly
                disabled
                value={r.value.toLocaleString("id-ID")}
                className="w-full cursor-not-allowed bg-transparent text-lg font-bold text-foreground outline-none"
              />
            </div>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              {r.hint}
            </p>
          </div>
        ))}

        <div className="rounded-2xl border border-border bg-secondary p-4 shadow-sm">
          <p className="text-sm font-bold text-secondary-foreground">
            Total Pengeluaran Bulan Ini
          </p>
          <p className="font-display text-2xl font-extrabold text-foreground">
            {formatRupiah(a.totalPengeluaran)}
          </p>
        </div>
      </div>

      <button
        onClick={p.onNext}
        disabled={!p.canContinue}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-lg shadow-primary/40 transition-all enabled:hover:scale-[1.02] enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Lanjut
        <ArrowRight className="size-5" />
      </button>
      {!p.canContinue && (
        <p className="mt-3 text-center text-sm font-bold text-muted-foreground">
          Beli minimal 1 ayam untuk melanjutkan 🐣
        </p>
      )}
    </div>
  );
}

function NumberField({
  icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
        {icon}
        {label}
      </span>
      <input
        type="number"
        min={0}
        value={value === 0 ? "" : value}
        placeholder={placeholder ?? "0"}
        onChange={(e) =>
          onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))
        }
        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-lg font-bold text-foreground outline-none transition-colors placeholder:font-medium placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
    </label>
  );
}

/* ---------------- Round 2: Kelola Peternakan ---------------- */

function ManageScreen({
  currentMonth,
  jumlahAyam,
  modal,
  onNext,
}: {
  currentMonth: number;
  jumlahAyam: number;
  modal: number;
  onNext: () => void;
}) {
  const produksiHarian = Math.round(jumlahAyam * 0.8);
  const rows = [
    {
      label: "Total Ayam",
      value: `${jumlahAyam.toLocaleString("id-ID")} ekor`,
      icon: <Bird className="size-5 text-primary" />,
    },
    {
      label: "Perkiraan Telur / hari",
      value: `${produksiHarian.toLocaleString("id-ID")} butir`,
      icon: <Egg className="size-5 text-primary" />,
    },
    {
      label: "Perkiraan Telur / bulan",
      value: `${(produksiHarian * 30).toLocaleString("id-ID")} butir`,
      icon: <Egg className="size-5 text-primary" />,
    },
    {
      label: "Sisa Modal",
      value: formatRupiah(modal),
      icon: <Wallet className="size-5 text-profit" />,
    },
  ];
  return (
    <div className="animate-card-in w-full">
      <div className="mb-6 text-center">
        <MonthBadge bulan={currentMonth} />
        <h2 className="font-display text-3xl font-extrabold text-foreground">
          Ronde 2 — Kelola Peternakan 🐓
        </h2>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          Cek kondisi peternakanmu sebelum bulan ini berjalan.
        </p>
      </div>
      <div className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-xl">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-3 rounded-xl bg-secondary px-4 py-3"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-secondary-foreground">
              {r.icon}
              {r.label}
            </span>
            <span className="text-sm font-extrabold text-foreground">{r.value}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onNext}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-lg shadow-primary/40 transition-transform hover:scale-[1.02] active:scale-95"
      >
        Lanjut ke Kartu Kejadian
        <ArrowRight className="size-5" />
      </button>
    </div>
  );
}

/* ---------------- Round 3: Event Card ---------------- */

function EventScreen({
  currentMonth,
  event,
  onDraw,
  onNext,
}: {
  currentMonth: number;
  event: GameEvent | null;
  onDraw: () => void;
  onNext: () => void;
}) {
  return (
    <div className="animate-card-in flex w-full flex-col items-center">
      <div className="mb-6 text-center">
        <MonthBadge bulan={currentMonth} />
        <h2 className="font-display text-3xl font-extrabold text-foreground">
          Ronde 3 — Kartu Kejadian 🎴
        </h2>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          Nasib usahamu bulan ini ditentukan di sini...
        </p>
      </div>

      {!event ? (
        <button
          onClick={onDraw}
          className="group flex h-72 w-full max-w-xs flex-col items-center justify-center gap-4 rounded-3xl border-4 border-dashed border-primary/50 bg-card shadow-xl transition-transform hover:scale-105 active:scale-95"
        >
          <Sparkles className="size-12 text-primary transition-transform group-hover:rotate-12" />
          <span className="font-display text-xl font-extrabold text-primary">
            Ambil Kartu Kejadian
          </span>
        </button>
      ) : (
        <div
          key={event.id}
          className={`animate-card-flip flex h-72 w-full max-w-xs flex-col items-center justify-center gap-3 rounded-3xl border-4 px-6 text-center shadow-xl ${event.good ? "border-profit/50 bg-profit/10" : "border-loss/50 bg-loss/10"
            }`}
        >
          <span className="text-6xl">{event.emoji}</span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-widest ${event.good ? "bg-profit/20 text-profit" : "bg-loss/20 text-loss"
              }`}
          >
            {event.good ? "Kabar Baik" : "Kabar Buruk"}
          </span>
          <h3 className="font-display text-2xl font-extrabold text-foreground">
            {event.title}
          </h3>
          <p className="text-sm font-semibold text-muted-foreground">
            {event.description}
          </p>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!event}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-10 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-lg shadow-primary/40 transition-all enabled:hover:scale-105 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Lihat Hasil Usaha
        <ArrowRight className="size-5" />
      </button>
    </div>
  );
}

/* ---------------- Round 4: Monthly Result ---------------- */

function ResultScreen({
  currentMonth,
  result,
  event,
  totalLaba,
  onNext,
}: {
  currentMonth: number;
  result: NonNullable<ReturnType<typeof hitungHasil>>;
  event: GameEvent;
  totalLaba: number;
  onNext: () => void;
}) {
  const untung = result.laba >= 0;
  const lastMonth = currentMonth >= TOTAL_BULAN;
  const rows: { label: string; value: string; icon: React.ReactNode }[] = [
    {
      label: "Total Ayam",
      value: `${result.jumlahAyam.toLocaleString("id-ID")} ekor`,
      icon: <Bird className="size-5 text-primary" />,
    },
    {
      label: "Total Produksi Telur",
      value: `${result.produksiPerBulan.toLocaleString("id-ID")} butir/bulan`,
      icon: <Egg className="size-5 text-primary" />,
    },
    {
      label: "Total Pendapatan",
      value: formatRupiah(result.pendapatanBulanan),
      icon: <Coins className="size-5 text-profit" />,
    },
    {
      label: "Total Biaya Operasional",
      value: formatRupiah(result.biayaOperasional),
      icon: <Wheat className="size-5 text-loss" />,
    },
  ];

  return (
    <div className="animate-card-in w-full">
      <div className="mb-6 text-center">
        <MonthBadge bulan={currentMonth} />
        <h2 className="font-display text-3xl font-extrabold text-foreground">
          Ronde 4 — Hitung Hasil 📊
        </h2>
        <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-secondary-foreground">
          {event.emoji} Kejadian: {event.title}
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-xl sm:p-6">
        <div className="space-y-3">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between gap-3 rounded-xl bg-secondary px-4 py-3"
            >
              <span className="flex items-center gap-2 text-sm font-bold text-secondary-foreground">
                {r.icon}
                {r.label}
              </span>
              <span className="text-sm font-extrabold text-foreground">{r.value}</span>
            </div>
          ))}
        </div>

        <div
          className={`mt-4 flex items-center justify-between rounded-2xl px-5 py-4 ${untung ? "bg-profit/15" : "bg-loss/15"
            }`}
        >
          <span
            className={`flex items-center gap-2 font-display text-lg font-extrabold ${untung ? "text-profit" : "text-loss"
              }`}
          >
            {untung ? (
              <TrendingUp className="size-6" />
            ) : (
              <TrendingDown className="size-6" />
            )}
            {untung ? "Laba Bulan Ini" : "Rugi Bulan Ini"}
          </span>
          <span
            className={`font-display text-2xl font-extrabold ${untung ? "text-profit" : "text-loss"
              }`}
          >
            {formatRupiah(result.laba)}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-secondary px-5 py-3">
          <span className="text-sm font-bold text-secondary-foreground">
            Akumulasi Laba (setelah bulan {currentMonth})
          </span>
          <span className="font-display text-lg font-extrabold text-foreground">
            {formatRupiah(totalLaba + result.laba)}
          </span>
        </div>
      </div>

      <button
        onClick={onNext}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-lg shadow-primary/40 transition-transform hover:scale-[1.02] active:scale-95"
      >
        {lastMonth ? "Lihat Skor Akhir" : "Lanjut ke Bulan Berikutnya"}
        <ArrowRight className="size-5" />
      </button>
    </div>
  );
}

/* ---------------- Round 5: Final Score ---------------- */

function TrendChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const w = 100;
  const h = 44;
  const pts = values.map((v, i) => {
    const x = values.length === 1 ? w / 2 : (i / (values.length - 1)) * w;
    const y = h - ((v - min) / span) * h;
    return [x, y] as const;
  });
  const naik = values.length > 1 && values[values.length - 1]! >= values[0]!;
  const stroke = naik ? "var(--color-profit)" : "var(--color-loss)";
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-24 w-full"
      aria-label="Grafik tren laba bulanan"
    >
      <polyline
        points={pts.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.5} fill={stroke} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

function FinalScreen({
  history,
  totalLaba,
  kehabisanModal,
  modal,
  onRestart,
}: {
  history: MonthRecord[];
  totalLaba: number;
  kehabisanModal: boolean;
  modal: number;
  onRestart: () => void;
}) {
  const [bonusPoint, setBonusPoint] = useState(false);
  const poin = hitungSkorAkhir(totalLaba, bonusPoint);
  const labaList = history.map((h) => h.result.laba);
  const untung = totalLaba >= 0;

  return (
    <div className="animate-card-in w-full">
      <div className="mb-6 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Ronde 5
        </p>
        <h2 className="font-display text-3xl font-extrabold text-foreground">
          Hitung Skor Akhir 🏆
        </h2>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          Rekap usaha ayam petelurmu selama {TOTAL_BULAN} bulan
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-xl sm:p-6">
        <div className="space-y-3">
          {history.map((h, i) => {
            const prev = i > 0 ? history[i - 1]!.result.laba : null;
            const naik = prev === null ? null : h.result.laba >= prev;
            return (
              <div
                key={h.bulan}
                className="flex items-center justify-between gap-3 rounded-xl bg-secondary px-4 py-3"
              >
                <span className="flex items-center gap-2 text-sm font-bold text-secondary-foreground">
                  {h.event.emoji} Bulan {h.bulan}
                  <span className="hidden text-xs font-semibold text-muted-foreground sm:inline">
                    {h.event.title}
                  </span>
                </span>
                <span
                  className={`flex items-center gap-1 text-sm font-extrabold ${h.result.laba >= 0 ? "text-profit" : "text-loss"
                    }`}
                >
                  {formatRupiah(h.result.laba)}
                  {naik === null ? "" : naik ? "📈" : "📉"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl bg-secondary/60 px-4 py-3">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Tren Laba Bulanan
          </p>
          <TrendChart values={labaList} />
          <div className="flex justify-between text-xs font-bold text-muted-foreground">
            {history.map((h) => (
              <span key={h.bulan}>Bln {h.bulan}</span>
            ))}
          </div>
        </div>

        <div
          className={`mt-4 flex items-center justify-between rounded-2xl px-5 py-4 ${untung ? "bg-profit/15" : "bg-loss/15"
            }`}
        >
          <span
            className={`flex items-center gap-2 font-display text-lg font-extrabold ${untung ? "text-profit" : "text-loss"
              }`}
          >
            {untung ? (
              <TrendingUp className="size-6" />
            ) : (
              <TrendingDown className="size-6" />
            )}
            Total Laba 3 Bulan
          </span>
          <span
            className={`font-display text-2xl font-extrabold ${untung ? "text-profit" : "text-loss"
              }`}
          >
            {formatRupiah(totalLaba)}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-secondary px-5 py-3">
          <span className="flex items-center gap-2 text-sm font-bold text-secondary-foreground">
            <Wallet className="size-5 text-primary" />
            Sisa Modal Akhir
          </span>
          <span className="font-display text-lg font-extrabold text-foreground">
            {formatRupiah(modal)}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl border border-border bg-secondary px-5 py-3">
          <span className="flex items-center gap-2 text-sm font-bold text-secondary-foreground">
            <Sparkles className="size-5 text-primary" />
            Bonus Performa (+10 Poin)
          </span>
          <button
            type="button"
            onClick={() => setBonusPoint((b) => !b)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bonusPoint ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            aria-label="Toggle bonus poin"
          >
            <span
              className={`inline-block size-4 transform rounded-full bg-white transition-transform ${bonusPoint ? "translate-x-6" : "translate-x-1"
                }`}
            />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-primary px-5 py-4">
          <span className="flex items-center gap-2 font-display text-lg font-extrabold text-primary-foreground">
            <Trophy className="size-6" />
            Total Poin
          </span>
          <span className="font-display text-3xl font-extrabold text-primary-foreground">
            {poin > 0 ? `+${poin}` : poin} ⭐
          </span>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-lg shadow-primary/40 transition-transform hover:scale-[1.02] active:scale-95"
      >
        <RotateCcw className="size-5" />
        Main Lagi
      </button>
    </div>
  );
}
