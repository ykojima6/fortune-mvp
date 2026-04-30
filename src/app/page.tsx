"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import {
  CalendarDays,
  Lock,
  Mail,
  MessageCircle,
  Moon,
  Shuffle,
  Sparkles,
  User,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { majorArcana, tarotBackImage, type TarotCard } from "@/lib/tarot";
import type { Shuku } from "@/lib/shukuyo";

type Mode = "signin" | "signup";

type ReadingResult = {
  id: string | null;
  shuku: Shuku;
  tarot: TarotCard;
  reversed: boolean;
  calendar: {
    solar_date: string;
    lunar_month?: number | null;
    lunar_day?: number | null;
    is_leap_month?: boolean | null;
    moon_phase?: string | null;
    rokuyo?: string | null;
    sexagenary?: string | null;
  } | null;
  reading: string;
};

type Profile = {
  id: string;
  name: string;
  birth_date: string;
  email: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type TarotSelection = {
  cardId: number;
  reversed: boolean;
};

type DeckCard = TarotSelection & {
  deckKey: string;
};

export default function Home() {
  const [mode, setMode] = useState<Mode>("signin");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authForm, setAuthForm] = useState({
    name: "",
    birthDate: "",
    email: "",
    password: "",
  });
  const [authMessage, setAuthMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState<ReadingResult | null>(null);
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [deck, setDeck] = useState<DeckCard[]>(() => createInitialDeck());
  const [selectedDeckIndex, setSelectedDeckIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) void loadProfile(data.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) void loadProfile(session.user.id);
      if (!session?.user) setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDeck(createShuffledDeck());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const featuredCards = useMemo(() => majorArcana.slice(0, 6), []);
  const revealedSelection = selectedDeckIndex === null ? null : deck[selectedDeckIndex];
  const revealedCard = revealedSelection ? majorArcana[revealedSelection.cardId] : null;

  async function loadProfile(userId: string) {
    if (!supabase) return;
    const { data } = await supabase
      .from("profiles")
      .select("id,name,birth_date,email")
      .eq("id", userId)
      .maybeSingle();
    setProfile(data);
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");
    setBusy(true);

    try {
      if (!supabase) {
        setAuthMessage("Supabase環境変数が未設定です。.env.local を設定してください。");
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: {
            data: { name: authForm.name, birth_date: authForm.birthDate },
          },
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            name: authForm.name,
            birth_date: authForm.birthDate,
            email: authForm.email,
          });
          await loadProfile(data.user.id);
        }
        setAuthMessage("登録しました。メール確認が有効な場合は受信メールを確認してください。");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password,
        });
        if (error) throw error;
      }
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "認証に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function createReading(selection: TarotSelection) {
    const name = profile?.name || authForm.name || "あなた";
    const birthDate = profile?.birth_date || authForm.birthDate;
    if (!birthDate) {
      setAuthMessage("生年月日を登録してから占ってください。");
      return;
    }

    setBusy(true);
    setChat([]);
    try {
      const response = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          name,
          birthDate,
          tarotCardId: selection.cardId,
          tarotReversed: selection.reversed,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "占い生成に失敗しました。");
      setReading(data);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "占い生成に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function chooseDeckCard(index: number) {
    if (busy || selectedDeckIndex !== null) return;
    const selection = deck[index];
    setSelectedDeckIndex(index);
    await createReading(selection);
  }

  function shuffleForRedraw() {
    setDeck(createShuffledDeck());
    setSelectedDeckIndex(null);
    setReading(null);
    setChat([]);
    setQuestion("");
    setAuthMessage("");
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reading || !question.trim()) return;
    const nextQuestion = question.trim();
    setQuestion("");
    setChat((messages) => [...messages, { role: "user", content: nextQuestion }]);
    setChatBusy(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: reading.reading, question: nextQuestion }),
      });
      const data = await response.json();
      setChat((messages) => [
        ...messages,
        { role: "assistant", content: data.answer || "回答を生成できませんでした。" },
      ]);
    } finally {
      setChatBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setReading(null);
    setChat([]);
  }

  return (
    <main className="min-h-screen bg-[#050608] text-stone-100">
      <section className="grid min-h-screen grid-cols-1 lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative flex min-h-[520px] flex-col justify-between overflow-hidden border-b border-white/10 bg-[#090b10] px-6 py-7 lg:border-b-0 lg:border-r lg:px-10">
          <div className="absolute inset-0 opacity-35 [background:radial-gradient(circle_at_22%_20%,#00b8a933,transparent_28%),radial-gradient(circle_at_84%_12%,#d9b66d24,transparent_24%),linear-gradient(145deg,#08090d,#10151b_48%,#050608)]" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center border border-cyan-300/40 bg-cyan-300/10">
                <Moon className="h-5 w-5 text-cyan-200" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-cyan-100/70">Lunar Arcana</p>
                <h1 className="text-xl font-semibold text-white">宿曜タロット・オラクル</h1>
              </div>
            </div>
            {user && (
              <button
                onClick={signOut}
                className="border border-white/15 px-3 py-2 text-sm text-stone-300 transition hover:border-white/40 hover:text-white"
              >
                Logout
              </button>
            )}
          </div>

          <div className="relative z-10 my-12 max-w-xl">
            <p className="mb-4 inline-flex items-center gap-2 border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs uppercase tracking-[0.22em] text-amber-100">
              <Sparkles className="h-4 w-4" />
              Shukuyo x Lunar Calendar x Tarot
            </p>
            <h2 className="text-4xl font-semibold leading-tight text-white md:text-6xl">
              生まれ持つ宿と、今日めくる運命。
            </h2>
            <p className="mt-6 max-w-lg text-base leading-8 text-stone-300">
              宿曜が映すあなたの本質に、暦の流れと大アルカナの一枚を重ねる。今日の選択が少し澄んで見える、静かで深いデイリーオラクル。
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6">
            {featuredCards.map((card) => (
              <div key={card.id} className="border border-white/10 bg-white/[0.03] p-2">
                <Image src={card.image} alt={card.jpName} width={180} height={300} className="w-full" />
              </div>
            ))}
          </div>
        </aside>

        <div className="flex flex-col gap-5 px-5 py-6 md:px-8 lg:px-10">
          {!isSupabaseConfigured && (
            <div className="border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              Supabase未設定です。画面確認はできますが、認証には .env.local の設定が必要です。
            </div>
          )}

          {!user ? (
            <AuthPanel
              mode={mode}
              setMode={setMode}
              form={authForm}
              setForm={setAuthForm}
              onSubmit={submitAuth}
              busy={busy}
              message={authMessage}
            />
          ) : (
            <section className="grid flex-1 grid-cols-1 gap-5 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="space-y-5">
                <div className="border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-sm uppercase tracking-[0.22em] text-cyan-100/60">Profile</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">{profile?.name ?? user.email}</h2>
                  <p className="mt-2 text-stone-400">{profile?.birth_date ?? "生年月日未登録"}</p>
                  <div className="mt-5 border border-white/10 bg-black/20 p-3">
                    <div className="grid grid-cols-[74px_1fr] gap-3">
                      {revealedCard ? (
                        <Image
                          src={revealedCard.image}
                          alt={revealedCard.jpName}
                          width={148}
                          height={247}
                          className={revealedSelection?.reversed ? "rotate-180" : ""}
                        />
                      ) : (
                        <Image
                          src={tarotBackImage}
                          alt="裏向きのタロットカード"
                          width={148}
                          height={247}
                          className="aspect-[3/5] w-full object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/60">Current draw</p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {revealedCard ? revealedCard.jpName : "未選択"}
                        </p>
                        <p className="text-sm text-stone-400">
                          {revealedCard
                            ? `${revealedCard.name} / ${revealedSelection?.reversed ? "逆位置" : "正位置"}`
                            : "裏向きの22枚から1枚選んでください"}
                        </p>
                        {busy && selectedDeckIndex !== null && (
                          <div className="mt-3">
                            <LoadingPulse compact />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={shuffleForRedraw}
                    disabled={busy}
                    className="mt-4 flex w-full items-center justify-center gap-2 border border-white/15 px-4 py-3 font-semibold text-white transition hover:border-cyan-200/70 hover:text-cyan-100 disabled:cursor-wait disabled:opacity-60"
                  >
                    <Shuffle className="h-5 w-5" />
                    {selectedDeckIndex === null ? "シャッフルし直す" : "もう一度シャッフルして引き直す"}
                  </button>
                  {authMessage && <p className="mt-4 text-sm text-amber-100">{authMessage}</p>}
                </div>

                <div className="border border-white/10 bg-white/[0.04] p-5">
                  <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.22em] text-cyan-100/60">Major Arcana</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">裏向きの22枚から選ぶ</h3>
                    </div>
                    <p className="text-sm text-stone-400">{busy ? "展開中..." : "1枚だけ選択"}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 xl:grid-cols-4 2xl:grid-cols-6">
                    {deck.map((deckCard, index) => {
                      const card = majorArcana[deckCard.cardId];
                      const revealed = selectedDeckIndex === index;
                      const locked = selectedDeckIndex !== null && !revealed;
                      return (
                        <button
                          key={deckCard.deckKey}
                          type="button"
                          onClick={() => chooseDeckCard(index)}
                          disabled={busy || selectedDeckIndex !== null}
                          className={`group min-w-0 border p-1.5 transition ${
                            revealed
                              ? "border-cyan-200 bg-cyan-200/15"
                              : locked
                                ? "border-white/5 bg-black/10 opacity-45"
                                : "border-white/10 bg-black/20 hover:border-white/35"
                          }`}
                          title={revealed ? `${card.jpName} (${card.name})` : "裏向きのカード"}
                          aria-pressed={revealed}
                        >
                          <div className="relative aspect-[3/5] w-full [perspective:900px]">
                            {revealed && busy && (
                              <span className="pointer-events-none absolute -inset-1 z-10 border border-cyan-200/70 shadow-[0_0_22px_rgba(103,232,249,0.35)]" />
                            )}
                            <div
                              className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${
                                revealed ? "[transform:rotateY(180deg)]" : ""
                              }`}
                            >
                              <Image
                                src={tarotBackImage}
                                alt="裏向きのタロットカード"
                                width={120}
                                height={200}
                                className="absolute inset-0 h-full w-full object-cover [backface-visibility:hidden]"
                              />
                              <Image
                                src={card.image}
                                alt={revealed ? card.jpName : ""}
                                aria-hidden={!revealed}
                                width={120}
                                height={200}
                                className="absolute inset-0 h-full w-full [backface-visibility:hidden]"
                                style={{
                                  transform: deckCard.reversed
                                    ? "rotateY(180deg) rotate(180deg)"
                                    : "rotateY(180deg)",
                                }}
                              />
                            </div>
                          </div>
                          <span className="mt-1 block truncate text-xs text-stone-300 group-hover:text-white">
                            {revealed ? `${card.jpName} / ${deckCard.reversed ? "逆" : "正"}` : `${index + 1}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {reading && (
                  <div className="border border-white/10 bg-[#0d1117] p-5">
                    <div className="grid grid-cols-[120px_1fr] gap-4">
                      <Image
                        src={reading.tarot.image}
                        alt={reading.tarot.jpName}
                        width={240}
                        height={400}
                        className={reading.reversed ? "rotate-180" : ""}
                      />
                      <div>
                        <p className="text-sm text-cyan-100/70">Drawn card</p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">{reading.tarot.jpName}</h3>
                        <p className="mt-1 text-stone-400">
                          {reading.tarot.name} / {reading.reversed ? "逆位置" : "正位置"}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-stone-300">
                          {reading.reversed ? reading.tarot.reversed : reading.tarot.upright}
                        </p>
                        <div className="mt-5 border-t border-white/10 pt-4">
                          <p className="text-sm text-cyan-100/70">Shukuyo</p>
                          <p className="mt-1 text-lg text-white">
                            {reading.shuku.name}宿 <span className="text-stone-400">({reading.shuku.reading})</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid min-h-[620px] grid-rows-[1fr_auto] border border-white/10 bg-white/[0.035]">
                <div className="overflow-auto p-5 md:p-7">
                  {reading ? (
                    <article className="prose prose-invert max-w-none prose-p:leading-8">
                      <h2 className="mb-6 text-3xl font-semibold text-white">今日の占い結果</h2>
                      <div className="whitespace-pre-wrap text-stone-200">{reading.reading}</div>
                      <div className="mt-8 space-y-3">
                        {chat.map((message, index) => (
                          <div
                            key={`${message.role}-${index}`}
                            className={
                              message.role === "user"
                                ? "ml-auto max-w-[82%] bg-cyan-200 px-4 py-3 text-black"
                                : "max-w-[86%] border border-white/10 bg-black/30 px-4 py-3 text-stone-200"
                            }
                          >
                            {message.content}
                          </div>
                        ))}
                        {chatBusy && <p className="text-sm text-stone-400">回答中...</p>}
                      </div>
                    </article>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      {busy ? (
                        <ReadingLoading />
                      ) : (
                        <>
                          <MessageCircle className="mb-5 h-12 w-12 text-cyan-100/50" />
                          <h2 className="text-2xl font-semibold text-white">カードを1枚選んでください</h2>
                          <p className="mt-3 max-w-md text-stone-400">
                            裏向きのカードを選ぶと、そのカードが表になり、正位置・逆位置が決定して占い結果を生成します。
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <form onSubmit={submitQuestion} className="flex gap-3 border-t border-white/10 p-4">
                  <input
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    disabled={!reading || chatBusy}
                    placeholder="結果について質問する"
                    className="min-w-0 flex-1 border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-stone-500 focus:border-cyan-200/70 disabled:opacity-50"
                  />
                  <button
                    disabled={!reading || chatBusy}
                    className="bg-white px-5 py-3 font-semibold text-black transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    送信
                  </button>
                </form>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function createShuffledDeck(): DeckCard[] {
  const cards = majorArcana.map((card) => ({
    cardId: card.id,
    reversed: Math.random() > 0.5,
    deckKey: `${card.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  }));

  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
  }

  return cards;
}

function createInitialDeck(): DeckCard[] {
  return majorArcana.map((card) => ({
    cardId: card.id,
    reversed: false,
    deckKey: `initial-${card.id}`,
  }));
}

function ReadingLoading() {
  return (
    <div className="w-full max-w-lg px-4">
      <div className="mx-auto mb-7 grid h-20 w-20 place-items-center border border-cyan-200/35 bg-cyan-200/10 shadow-[0_0_34px_rgba(103,232,249,0.14)]">
        <Sparkles className="h-9 w-9 animate-pulse text-cyan-100" />
      </div>
      <p className="text-sm uppercase tracking-[0.28em] text-cyan-100/60">Reading in progress</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">占い結果を出力中</h2>
      <p className="mt-3 text-sm leading-7 text-stone-400">
        宿曜、暦、選ばれたカードを重ねて、今日の流れを読み解いています。
      </p>
      <div className="mt-8 space-y-3 text-left">
        <LoadingPulse label="宿曜の特性を確認中" />
        <LoadingPulse label="今日の暦を照合中" delay="animation-delay-200" />
        <LoadingPulse label="タロットの意味を統合中" delay="animation-delay-400" />
      </div>
      <div className="oracle-scan mt-8 h-1 w-full overflow-hidden bg-white/10">
        <div className="h-full w-1/3 bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,0.8)]" />
      </div>
    </div>
  );
}

function LoadingPulse({
  label = "占い結果を生成中",
  delay = "",
  compact = false,
}: {
  label?: string;
  delay?: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 text-cyan-100/75 ${compact ? "text-xs" : "text-sm"} ${delay}`}>
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping bg-cyan-200 opacity-50" />
        <span className="relative inline-flex h-2.5 w-2.5 bg-cyan-100" />
      </span>
      <span>{label}</span>
    </div>
  );
}

function AuthPanel({
  mode,
  setMode,
  form,
  setForm,
  onSubmit,
  busy,
  message,
}: {
  mode: Mode;
  setMode: (mode: Mode) => void;
  form: { name: string; birthDate: string; email: string; password: string };
  setForm: (form: { name: string; birthDate: string; email: string; password: string }) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  busy: boolean;
  message: string;
}) {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 items-center">
      <div className="w-full border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/30 md:p-7">
        <div className="mb-6 grid grid-cols-2 border border-white/10 p-1">
          <button
            onClick={() => setMode("signin")}
            className={mode === "signin" ? "bg-white py-3 font-semibold text-black" : "py-3 text-stone-400"}
            type="button"
          >
            ログイン
          </button>
          <button
            onClick={() => setMode("signup")}
            className={mode === "signup" ? "bg-white py-3 font-semibold text-black" : "py-3 text-stone-400"}
            type="button"
          >
            新規登録
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <Field
                icon={<User className="h-5 w-5" />}
                label="名前"
                autoComplete="name"
                value={form.name}
                onChange={(value) => setForm({ ...form, name: value })}
                required
              />
              <Field
                icon={<CalendarDays className="h-5 w-5" />}
                label="生年月日"
                type="date"
                value={form.birthDate}
                onChange={(value) => setForm({ ...form, birthDate: value })}
                required
              />
            </>
          )}
          <Field
            icon={<Mail className="h-5 w-5" />}
            label="メールアドレス"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(value) => setForm({ ...form, email: value })}
            required
          />
          <Field
            icon={<Lock className="h-5 w-5" />}
            label="パスワード"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={form.password}
            onChange={(value) => setForm({ ...form, password: value })}
            required
          />

          <button
            disabled={busy}
            className="mt-2 w-full bg-cyan-200 px-5 py-4 font-semibold text-black transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "処理中..." : mode === "signup" ? "アカウントを作成" : "ログイン"}
          </button>
          {message && <p className="text-sm text-amber-100">{message}</p>}
        </form>
      </div>
    </section>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  type = "text",
  required,
  autoComplete,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-stone-400">{label}</span>
      <span className="flex items-center gap-3 border border-white/10 bg-black/30 px-4 py-3 text-stone-400 focus-within:border-cyan-200/70">
        {icon}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-stone-600"
        />
      </span>
    </label>
  );
}
