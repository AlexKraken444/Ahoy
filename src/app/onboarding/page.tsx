"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, Sailboat } from "lucide-react";
import Avatar from "@/components/Avatar";
import Logo from "@/components/Logo";
import { currentUser, updateUser, type User } from "@/lib/store";
import { fileToDataUrl } from "@/lib/image";

const BIO_LIMIT = 160;

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const u = currentUser();
    if (!u) {
      router.replace("/");
      return;
    }
    if (u.onboarded) {
      router.replace("/feed");
      return;
    }
    setUser(u);
    setHandle(u.handle);
  }, [router]);

  async function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAvatar(await fileToDataUrl(file, 384));
    } catch {
      /* ignore unreadable files */
    }
  }

  function finish() {
    if (!user) return;
    const cleanHandle =
      handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") || user.handle;
    updateUser({
      ...user,
      avatar,
      handle: cleanHandle,
      bio: bio.trim(),
      onboarded: true,
    });
    router.push("/feed");
  }

  if (!user) return null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 36, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass w-full max-w-lg rounded-3xl p-8 sm:p-10"
      >
        <div className="flex justify-center">
          <Logo />
        </div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } } }}
        >
          <motion.h1
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            className="font-display mt-7 text-center text-2xl font-bold text-white"
          >
            Добро пожаловать на борт,
            <br />
            <span className="bg-gradient-to-r from-indigo-300 to-violet-400 bg-clip-text text-transparent">
              {user.name}!
            </span>
          </motion.h1>

          <motion.p
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            className="mt-2 text-center text-sm text-indigo-100/60"
          >
            Осталось оформить каюту: добавьте фото и пару слов о себе
          </motion.p>

          {/* avatar picker */}
          <motion.div
            variants={{ hidden: { opacity: 0, scale: 0.85 }, show: { opacity: 1, scale: 1 } }}
            className="mt-8 flex justify-center"
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileRef.current?.click()}
              className="group relative rounded-full"
              aria-label="Загрузить фото профиля"
            >
              <Avatar name={user.name} avatar={avatar} size={112} />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera size={26} className="text-white" />
              </span>
              <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg ring-4 ring-[#0d0d2b]">
                <Camera size={16} />
              </span>
            </motion.button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={pickAvatar}
            />
          </motion.div>

          {/* handle */}
          <motion.label
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            className="relative mt-8 block"
          >
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-indigo-300/70">
              @
            </span>
            <input
              className="field pl-9"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="имя_на_борту"
              maxLength={24}
            />
          </motion.label>

          {/* bio */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            className="mt-4"
          >
            <textarea
              className="field min-h-24 resize-none"
              value={bio}
              maxLength={BIO_LIMIT}
              onChange={(e) => setBio(e.target.value)}
              placeholder="О себе: кто вы и куда держите курс?"
            />
            <div className="mt-1 text-right text-xs text-indigo-100/40">
              {bio.length}/{BIO_LIMIT}
            </div>
          </motion.div>

          <motion.button
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={finish}
            className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3.5 font-semibold text-white shadow-lg shadow-indigo-900/50"
          >
            <Sailboat size={19} />
            Поднять паруса
          </motion.button>

          <motion.p
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            className="mt-4 text-center text-xs text-indigo-100/40"
          >
            Фото и описание можно будет изменить позже
          </motion.p>
        </motion.div>
      </motion.div>
    </main>
  );
}
