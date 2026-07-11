"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, LogOut, Pencil } from "lucide-react";
import Avatar from "@/components/Avatar";
import { fileToDataUrl } from "@/lib/image";
import { updateUser, type User } from "@/lib/store";
import { daysAboard } from "@/lib/time";

export default function ProfileCard({
  me,
  postCount,
  onLogout,
  onChange,
}: {
  me: User;
  postCount: number;
  onLogout: () => void;
  onChange: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(me.bio);

  async function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      updateUser({ ...me, avatar: await fileToDataUrl(file, 384) });
      onChange();
    } catch {
      /* ignore unreadable files */
    }
  }

  function saveBio() {
    updateUser({ ...me, bio: bio.trim() });
    setEditing(false);
    onChange();
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="glass rounded-3xl p-6"
    >
      <div className="flex flex-col items-center text-center">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => fileRef.current?.click()}
          className="group relative rounded-full"
          aria-label="Сменить фото профиля"
        >
          <Avatar name={me.name} avatar={me.avatar} size={84} />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera size={20} className="text-white" />
          </span>
        </motion.button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={pickAvatar}
        />

        <h2 className="mt-3.5 font-display text-lg font-bold text-white">{me.name}</h2>
        <p className="text-sm text-indigo-300/80">@{me.handle}</p>

        <AnimatePresence mode="wait" initial={false}>
          {editing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-3 w-full"
            >
              <textarea
                className="field min-h-20 resize-none text-sm"
                value={bio}
                maxLength={160}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Пара слов о себе…"
                autoFocus
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={saveBio}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-500/25 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-indigo-500/40"
              >
                <Check size={15} /> Сохранить
              </motion.button>
            </motion.div>
          ) : (
            <motion.button
              key="view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              onClick={() => {
                setBio(me.bio);
                setEditing(true);
              }}
              className="group/bio mt-3 flex w-full items-start justify-center gap-1.5 rounded-xl px-2 py-1 text-sm leading-relaxed text-indigo-100/65 transition-colors hover:bg-white/5"
              title="Изменить описание"
            >
              <span>{me.bio || "Расскажите о себе…"}</span>
              <Pencil
                size={12}
                className="mt-1 shrink-0 text-indigo-100/25 opacity-0 transition-opacity group-hover/bio:opacity-100"
              />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {[
          { label: "постов", value: postCount },
          { label: "дней в море", value: daysAboard(me.joinedAt) },
        ].map((s) => (
          <div key={s.label} className="glass-soft rounded-2xl py-3 text-center">
            <div className="font-display text-xl font-bold text-white">{s.value}</div>
            <div className="mt-0.5 text-[11px] uppercase tracking-wide text-indigo-100/45">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onLogout}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-2.5 text-sm font-medium text-indigo-100/60 transition-colors hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
      >
        <LogOut size={15} />
        Сойти на берег
      </motion.button>
    </motion.aside>
  );
}
