"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Compass, Loader2, Lock, Mail, Sailboat, UserRound, Waves } from "lucide-react";
import Logo from "@/components/Logo";
import { ApiError, hasToken, login, me, register } from "@/lib/api";

type Mode = "login" | "register";

const FEATURES = [
  { icon: Waves, text: "Живая лента — делитесь мыслями и фотографиями" },
  { icon: Compass, text: "Свой профиль с аватаром и историей" },
  { icon: Sailboat, text: "Якоря вместо лайков и попутный ветер в карму" },
];

export default function AuthPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasToken()) {
      setReady(true);
      return;
    }
    me()
      .then((user) => {
        if (user) {
          router.replace(user.onboarded ? "/feed" : "/onboarding");
        } else {
          setReady(true); // сессия действительно истекла (401)
        }
      })
      .catch(() => {
        // сервер недоступен или холодный старт — НЕ разлогиниваем,
        // лента сама дозагрузится и повторит запрос
        router.replace("/feed");
      });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "register" && name.trim().length < 2) {
      setError("Введите имя (минимум 2 символа)");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Похоже, это не email — проверьте адрес");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен быть не короче 6 символов");
      return;
    }

    setLoading(true);
    try {
      const user =
        mode === "register"
          ? await register(name, email, password)
          : await login(email, password);
      router.push(user.onboarded ? "/feed" : "/onboarding");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Нет связи с сервером");
      setLoading(false);
    }
  }

  if (!ready) return null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2">
        {/* -------- brand panel -------- */}
        <motion.section
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="hidden lg:block"
        >
          <Logo size="lg" />
          <h1 className="font-display mt-8 text-5xl font-black leading-tight text-white">
            Море
            <br />
            <span className="bg-gradient-to-r from-indigo-300 to-violet-400 bg-clip-text text-transparent">
              общения
            </span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-indigo-100/70">
            Социальная сеть для тех, кто в плавании. Поднимайте паруса,
            публикуйте посты и держите курс на интересное.
          </p>

          <ul className="mt-10 space-y-4">
            {FEATURES.map((f, i) => (
              <motion.li
                key={f.text}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.15, duration: 0.5 }}
                className="flex items-center gap-3 text-indigo-100/80"
              >
                <span className="glass-soft flex h-10 w-10 items-center justify-center rounded-xl text-indigo-300">
                  <f.icon size={19} />
                </span>
                {f.text}
              </motion.li>
            ))}
          </ul>
        </motion.section>

        {/* -------- auth card -------- */}
        <motion.section
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="glass mx-auto w-full max-w-md rounded-3xl p-8"
        >
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </div>

          {/* tabs */}
          <div className="glass-soft relative mb-7 grid grid-cols-2 rounded-2xl p-1">
            {(["register", "login"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`relative z-10 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                  mode === m ? "text-white" : "text-indigo-100/50 hover:text-indigo-100/80"
                }`}
              >
                {mode === m && (
                  <motion.span
                    layoutId="auth-tab"
                    className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 shadow-lg shadow-indigo-900/40"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                {m === "register" ? "Регистрация" : "Вход"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              onSubmit={submit}
              className="space-y-4"
            >
              <h2 className="font-display text-xl font-bold text-white">
                {mode === "register" ? "Добро пожаловать на борт" : "С возвращением, моряк"}
              </h2>

              {mode === "register" && (
                <label className="relative block">
                  <UserRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-200/40" />
                  <input
                    className="field pl-10"
                    placeholder="Ваше имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </label>
              )}

              <label className="relative block">
                <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-200/40" />
                <input
                  className="field pl-10"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>

              <label className="relative block">
                <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-200/40" />
                <input
                  className="field pl-10"
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                />
              </label>

              <AnimatePresence>
                {error && (
                  <motion.p
                    key={error}
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: 1, x: [0, -8, 8, -5, 5, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-300"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3.5 font-semibold text-white shadow-lg shadow-indigo-900/50 transition-opacity disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : mode === "register" ? (
                  "Создать аккаунт"
                ) : (
                  "Войти"
                )}
              </motion.button>

              <p className="pt-1 text-center text-xs text-indigo-100/40">
                {mode === "register"
                  ? "Уже есть аккаунт? Переключитесь на «Вход»"
                  : "Впервые здесь? Переключитесь на «Регистрацию»"}
              </p>
            </motion.form>
          </AnimatePresence>
        </motion.section>
      </div>
    </main>
  );
}
