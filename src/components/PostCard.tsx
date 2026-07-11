"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Anchor,
  Check,
  ImagePlus,
  MessageCircle,
  Pencil,
  Send,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import Avatar from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import { fileToDataUrl } from "@/lib/image";
import { timeAgo } from "@/lib/time";
import { TAG_RE } from "@/lib/tags";
import { isVerified, type Post, type User } from "@/lib/types";

const LIMIT = 280;

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
  getUser,
  onLike,
  onDelete,
  onEdit,
  onComment,
  onDeleteComment,
  swayIndex = 0,
}: {
  post: Post;
  author: User | null;
  me: User;
  getUser: (id: string) => User | null;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (postId: string, text: string, image: string | null) => void;
  onComment: (postId: string, text: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  swayIndex?: number;
}) {
  const liked = post.likes.includes(me.id);
  const [burst, setBurst] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [editImage, setEditImage] = useState<string | null>(post.image);
  const editFileRef = useRef<HTMLInputElement>(null);
  const name = author?.name ?? "Пропавший без вести";
  const handle = author?.handle ?? "ghost";

  function startEdit() {
    setEditText(post.text);
    setEditImage(post.image);
    setEditing(true);
  }

  function saveEdit() {
    if (!editText.trim() && !editImage) return;
    onEdit(post.id, editText, editImage);
    setEditing(false);
  }

  async function pickEditImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setEditImage(await fileToDataUrl(file, 1024));
    } catch {
      /* ignore unreadable files */
    }
  }

  function sendComment() {
    if (!draft.trim()) return;
    onComment(post.id, draft);
    setDraft("");
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
    >
      <div
        className="glass group sway rounded-3xl p-4 transition-colors hover:border-white/15 sm:p-5"
        style={
          {
            "--sway-delay": `${(swayIndex % 7) * -1.4}s`,
            "--sway-dur": `${6.5 + (swayIndex % 3) * 0.9}s`,
          } as React.CSSProperties
        }
      >
        <div className="flex gap-3 sm:gap-3.5">
          {author ? (
            <Link href={`/u/${author.handle}`} className="shrink-0 self-start">
              <Avatar name={name} avatar={author.avatar} size={46} />
            </Link>
          ) : (
            <Avatar name={name} avatar={null} size={46} />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              {author ? (
                <Link
                  href={`/u/${author.handle}`}
                  className="truncate font-semibold text-white transition-colors hover:text-indigo-300"
                >
                  {name}
                </Link>
              ) : (
                <span className="truncate font-semibold text-white">{name}</span>
              )}
              {isVerified(author) && <VerifiedBadge className="self-center" />}
              <span className="ml-0.5 truncate text-sm text-indigo-100/40">
                @{handle} · {timeAgo(post.createdAt)}
                {post.editedAt && (
                  <span title={`Изменено: ${timeAgo(post.editedAt)}`}> · изм.</span>
                )}
              </span>
              {post.userId === me.id && !editing && (
                <span className="ml-auto flex items-center">
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={startEdit}
                    className="rounded-lg p-1.5 text-indigo-100/25 opacity-60 transition-opacity hover:bg-indigo-500/15 hover:text-indigo-300 lg:opacity-0 lg:group-hover:opacity-100"
                    aria-label="Редактировать пост"
                  >
                    <Pencil size={14} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onDelete(post.id)}
                    className="rounded-lg p-1.5 text-indigo-100/25 opacity-60 transition-opacity hover:bg-red-500/15 hover:text-red-300 lg:opacity-0 lg:group-hover:opacity-100"
                    aria-label="Удалить пост"
                  >
                    <Trash2 size={15} />
                  </motion.button>
                </span>
              )}
            </div>

            {editing ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2"
              >
                <textarea
                  className="field min-h-24 resize-none"
                  value={editText}
                  maxLength={LIMIT}
                  onChange={(e) => setEditText(e.target.value)}
                  autoFocus
                />
                {editImage && (
                  <div className="relative mt-2 overflow-hidden rounded-2xl border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editImage} alt="" className="max-h-80 w-full object-cover" />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setEditImage(null)}
                      className="absolute right-2.5 top-2.5 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm"
                      aria-label="Убрать изображение"
                    >
                      <X size={14} />
                    </motion.button>
                  </div>
                )}
                <div className="mt-2.5 flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => editFileRef.current?.click()}
                    className="rounded-xl p-2 text-indigo-300/80 transition-colors hover:bg-indigo-500/15 hover:text-indigo-200"
                    aria-label="Заменить изображение"
                  >
                    <ImagePlus size={17} />
                  </motion.button>
                  <input
                    ref={editFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={pickEditImage}
                  />
                  <span
                    className={`ml-auto text-xs tabular-nums ${
                      LIMIT - editText.length <= 20
                        ? "text-amber-300"
                        : "text-indigo-100/35"
                    }`}
                  >
                    {LIMIT - editText.length}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditing(false)}
                    className="rounded-full px-4 py-1.5 text-sm text-indigo-100/55 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Отмена
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={saveEdit}
                    disabled={!editText.trim() && !editImage}
                    className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition-opacity disabled:opacity-40"
                  >
                    <Check size={14} />
                    Сохранить
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <>
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
                    <img
                      src={post.image}
                      alt=""
                      className="max-h-96 w-full object-cover"
                    />
                  </motion.div>
                )}
              </>
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

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setCommentsOpen((o) => !o)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                  commentsOpen
                    ? "text-sky-300"
                    : "hover:bg-sky-500/10 hover:text-sky-300"
                }`}
                aria-label="Комментарии"
              >
                <MessageCircle
                  size={16}
                  className={commentsOpen ? "fill-sky-400/20" : ""}
                />
                <span className="tabular-nums">{post.comments.length}</span>
              </motion.button>

              <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm">
                <Share2 size={16} />
              </span>
            </div>

            {/* comments */}
            <AnimatePresence initial={false}>
              {commentsOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-3 border-t border-white/10 pt-3.5">
                    <AnimatePresence initial={false}>
                      {post.comments.map((c) => {
                        const cAuthor = getUser(c.userId);
                        return (
                          <motion.div
                            key={c.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="group/comment flex gap-2.5"
                          >
                            {cAuthor ? (
                              <Link
                                href={`/u/${cAuthor.handle}`}
                                className="shrink-0 self-start"
                              >
                                <Avatar
                                  name={cAuthor.name}
                                  avatar={cAuthor.avatar}
                                  size={30}
                                />
                              </Link>
                            ) : (
                              <Avatar name="?" avatar={null} size={30} />
                            )}
                            <div className="glass-soft min-w-0 flex-1 rounded-2xl px-3.5 py-2.5">
                              <div className="flex items-baseline gap-1.5">
                                {cAuthor ? (
                                  <Link
                                    href={`/u/${cAuthor.handle}`}
                                    className="truncate text-sm font-semibold text-white hover:text-indigo-300"
                                  >
                                    {cAuthor.name}
                                  </Link>
                                ) : (
                                  <span className="truncate text-sm font-semibold text-white">
                                    Пропавший без вести
                                  </span>
                                )}
                                {isVerified(cAuthor) && (
                                  <VerifiedBadge size={13} className="self-center" />
                                )}
                                <span className="text-xs text-indigo-100/35">
                                  {timeAgo(c.createdAt)}
                                </span>
                                {c.userId === me.id && (
                                  <button
                                    onClick={() => onDeleteComment(post.id, c.id)}
                                    className="ml-auto rounded p-1 text-indigo-100/25 opacity-60 transition-opacity hover:text-red-300 lg:opacity-0 lg:group-hover/comment:opacity-100"
                                    aria-label="Удалить комментарий"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                              <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-indigo-50/85">
                                {c.text}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {post.comments.length === 0 && (
                      <p className="text-sm text-indigo-100/40">
                        Пока нет комментариев — будьте первым!
                      </p>
                    )}

                    <div className="flex items-center gap-2.5">
                      <Avatar name={me.name} avatar={me.avatar} size={30} />
                      <input
                        className="field py-2 text-sm"
                        value={draft}
                        maxLength={200}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") sendComment();
                        }}
                        placeholder="Написать комментарий…"
                      />
                      <motion.button
                        whileHover={draft.trim() ? { scale: 1.08 } : {}}
                        whileTap={draft.trim() ? { scale: 0.92 } : {}}
                        onClick={sendComment}
                        disabled={!draft.trim()}
                        className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 p-2.5 text-white shadow-lg shadow-indigo-900/40 transition-opacity disabled:opacity-40"
                        aria-label="Отправить комментарий"
                      >
                        <Send size={15} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
