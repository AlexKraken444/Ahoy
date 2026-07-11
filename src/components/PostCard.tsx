"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Anchor, MessageCircle, Share2, Trash2 } from "lucide-react";
import Avatar from "@/components/Avatar";
import { timeAgo } from "@/lib/time";
import { TAG_RE } from "@/lib/tags";
import type { Post, User } from "@/lib/store";

function renderText(text: string) {
  const tags = text.match(TAG_RE) ?? [];
  const parts = text.split(TAG_RE);
  const nodes: React.ReactNode[] = [];
  parts.forEach((part, i) => {
    nodes.push(part);
    if (i < tags.length) {
      nodes.push(
        <span key={i} className="font-medium text-indigo-300">
          {tags[i]}
        </span>
      );
    }
  });
  return nodes;
}

export default function PostCard({
  post,
  author,
  me,
  onLike,
  onDelete,
}: {
  post: Post;
  author: User | null;
  me: User;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const liked = post.likes.includes(me.id);
  const [burst, setBurst] = useState(0);
  const name = author?.name ?? "Пропавший без вести";
  const handle = author?.handle ?? "ghost";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="glass group rounded-3xl p-5 transition-colors hover:border-white/15"
    >
      <div className="flex gap-3.5">
        <Avatar name={name} avatar={author?.avatar ?? null} size={46} />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate font-semibold text-white">{name}</span>
            <span className="truncate text-sm text-indigo-100/40">
              @{handle} · {timeAgo(post.createdAt)}
            </span>
            {post.userId === me.id && (
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete(post.id)}
                className="ml-auto rounded-lg p-1.5 text-indigo-100/25 opacity-0 transition-opacity hover:bg-red-500/15 hover:text-red-300 group-hover:opacity-100"
                aria-label="Удалить пост"
              >
                <Trash2 size={15} />
              </motion.button>
            )}
          </div>

          <p className="mt-1.5 whitespace-pre-wrap break-words leading-relaxed text-indigo-50/90">
            {renderText(post.text)}
          </p>

          {post.image && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 overflow-hidden rounded-2xl border border-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.image} alt="" className="max-h-96 w-full object-cover" />
            </motion.div>
          )}

          {/* actions */}
          <div className="mt-3.5 flex items-center gap-1 text-indigo-100/40">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => {
                if (!liked) setBurst((b) => b + 1);
                onLike(post.id);
              }}
              className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                liked
                  ? "text-indigo-300"
                  : "hover:bg-indigo-500/10 hover:text-indigo-300"
              }`}
              aria-label="Поставить якорь"
            >
              <motion.span
                key={burst}
                animate={liked ? { scale: [1, 1.5, 1], rotate: [0, -18, 0] } : {}}
                transition={{ duration: 0.45 }}
              >
                <Anchor size={16} className={liked ? "fill-indigo-400/30" : ""} />
              </motion.span>
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={post.likes.length}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 10, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="tabular-nums"
                >
                  {post.likes.length}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm">
              <MessageCircle size={16} />0
            </span>
            <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm">
              <Share2 size={16} />
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
