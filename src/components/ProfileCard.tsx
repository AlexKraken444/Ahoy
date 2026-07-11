"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, LogOut, Pencil } from "lucide-react";
import Avatar from "@/components/Avatar";
import EditProfileModal from "@/components/EditProfileModal";
import VerifiedBadge from "@/components/VerifiedBadge";
import { fileToDataUrl } from "@/lib/image";
import { isVerified, updateUser, type User } from "@/lib/store";
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

        <Link href={`/u/${me.handle}`} className="group/name mt-3.5">
          <h2 className="flex items-center justify-center gap-1.5 font-display text-lg font-bold text-white transition-colors group-hover/name:text-indigo-300">
            {me.name}
            {isVerified(me) && <VerifiedBadge size={17} />}
          </h2>
          <p className="text-sm text-indigo-300/80">@{me.handle}</p>
        </Link>

        {me.bio && (
          <p className="mt-3 text-sm leading-relaxed text-indigo-100/65">{me.bio}</p>
        )}
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
        onClick={() => setEditing(true)}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500/20 py-2.5 text-sm font-medium text-indigo-200 transition-colors hover:bg-indigo-500/35"
      >
        <Pencil size={14} />
        Редактировать профиль
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onLogout}
        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-2.5 text-sm font-medium text-indigo-100/60 transition-colors hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
      >
        <LogOut size={15} />
        Сойти на берег
      </motion.button>

      <EditProfileModal
        me={me}
        open={editing}
        onClose={() => setEditing(false)}
        onSaved={() => onChange()}
      />
    </motion.aside>
  );
}
