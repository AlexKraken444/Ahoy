"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Send, X } from "lucide-react";
import Avatar from "@/components/Avatar";
import { fileToDataUrl } from "@/lib/image";
import type { User } from "@/lib/types";

const LIMIT = 280;

export default function Composer({
  me,
  onPost,
}: {
  me: User;
  onPost: (text: string, image: string | null) => void;
}) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const left = LIMIT - text.length;
  const canPost = text.trim().length > 0 || image !== null;

  function autoGrow() {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }

  async function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setImage(await fileToDataUrl(file, 1024));
    } catch {
      /* ignore unreadable files */
    }
  }

  function publish() {
    if (!canPost) return;
    onPost(text, image);
    setText("");
    setImage(null);
    if (areaRef.current) areaRef.current.style.height = "auto";
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-3xl p-5"
    >
      <div className="flex gap-3.5">
        <Avatar name={me.name} avatar={me.avatar} size={46} />
        <div className="min-w-0 flex-1">
          <textarea
            ref={areaRef}
            value={text}
            maxLength={LIMIT}
            onChange={(e) => {
              setText(e.target.value);
              autoGrow();
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") publish();
            }}
            placeholder="Что нового в море?"
            className="min-h-12 w-full resize-none bg-transparent pt-2.5 text-[1.02rem] leading-relaxed text-indigo-50 outline-none placeholder:text-indigo-100/35"
            rows={1}
          />

          <AnimatePresence>
            {image && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="relative mt-2 overflow-hidden"
              >
                <div className="relative overflow-hidden rounded-2xl border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="max-h-80 w-full object-cover" />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setImage(null)}
                    className="absolute right-2.5 top-2.5 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm"
                    aria-label="Убрать изображение"
                  >
                    <X size={15} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-3 flex items-center gap-2 border-t border-white/8 pt-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => fileRef.current?.click()}
              className="rounded-xl p-2 text-indigo-300/80 transition-colors hover:bg-indigo-500/15 hover:text-indigo-200"
              aria-label="Прикрепить изображение"
            >
              <ImagePlus size={19} />
            </motion.button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={pickImage}
            />

            <span
              className={`ml-auto text-xs tabular-nums transition-colors ${
                left <= 20 ? "text-amber-300" : "text-indigo-100/35"
              }`}
            >
              {left}
            </span>

            <motion.button
              whileHover={canPost ? { scale: 1.04 } : {}}
              whileTap={canPost ? { scale: 0.95 } : {}}
              onClick={publish}
              disabled={!canPost}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition-opacity disabled:opacity-40"
            >
              <Send size={15} />
              Опубликовать
            </motion.button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
