"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, X } from "lucide-react";
import Avatar from "@/components/Avatar";
import { fileToDataUrl } from "@/lib/image";
import { ApiError, updateProfile } from "@/lib/api";
import type { User } from "@/lib/types";

export default function EditProfileModal({
  me,
  open,
  onClose,
  onSaved,
}: {
  me: User;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: User) => void;
}) {
  const [name, setName] = useState(me.name);
  const [handle, setHandle] = useState(me.handle);
  const [bio, setBio] = useState(me.bio);
  const [avatar, setAvatar] = useState(me.avatar);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(me.name);
      setHandle(me.handle);
      setBio(me.bio);
      setAvatar(me.avatar);
      setError("");
    }
  }, [open, me]);

  async function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setAvatar(await fileToDataUrl(file, 384));
    } catch {
      /* ignore unreadable files */
    }
  }

  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateProfile({ name, handle, bio, avatar });
      onSaved(updated);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Нет связи с сервером");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="glass w-full max-w-md rounded-3xl p-6 sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-white">
                Редактировать профиль
              </h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="rounded-xl p-2 text-indigo-100/50 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Закрыть"
              >
                <X size={18} />
              </motion.button>
            </div>

            <div className="mt-5 flex justify-center">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileRef.current?.click()}
                className="group relative rounded-full"
                aria-label="Сменить фото профиля"
              >
                <Avatar name={name || me.name} avatar={avatar} size={88} />
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera size={22} className="text-white" />
                </span>
              </motion.button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={pickAvatar}
              />
            </div>

            <div className="mt-5 space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-indigo-100/45">
                  Имя
                </label>
                <input
                  className="field"
                  value={name}
                  maxLength={40}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше имя"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-indigo-100/45">
                  Ник
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-indigo-300/70">
                    @
                  </span>
                  <input
                    className="field pl-9"
                    value={handle}
                    maxLength={24}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="имя_на_борту"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-indigo-100/45">
                  О себе
                </label>
                <textarea
                  className="field min-h-20 resize-none"
                  value={bio}
                  maxLength={160}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Пара слов о себе…"
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  key={error}
                  initial={{ opacity: 0, x: 0 }}
                  animate={{ opacity: 1, x: [0, -8, 8, -5, 5, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-3 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-300"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={save}
              disabled={saving}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3 font-semibold text-white shadow-lg shadow-indigo-900/50 transition-opacity disabled:opacity-60"
            >
              <Check size={17} />
              {saving ? "Сохраняем…" : "Сохранить"}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
