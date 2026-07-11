"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Pencil } from "lucide-react";
import Avatar from "@/components/Avatar";
import EditProfileModal from "@/components/EditProfileModal";
import PostCard from "@/components/PostCard";
import {
  addComment,
  currentUser,
  deleteComment,
  deletePost,
  getPosts,
  getUserByHandle,
  getUsers,
  isVerified,
  toggleLike,
  updatePost,
  type Post,
  type User,
} from "@/lib/store";
import VerifiedBadge from "@/components/VerifiedBadge";
import { daysAboard, monthYearGenitive } from "@/lib/time";
import { pluralRu } from "@/lib/tags";

export default function ProfilePage() {
  const params = useParams<{ handle: string }>();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<User | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState(false);

  const handleParam = decodeURIComponent(params.handle ?? "");

  const refresh = useCallback(() => {
    setMe(currentUser());
    setUsers(getUsers());
    setPosts(getPosts());
    setProfile(getUserByHandle(handleParam));
    setReady(true);
  }, [handleParam]);

  useEffect(() => {
    const u = currentUser();
    if (!u) {
      router.replace("/");
      return;
    }
    if (!u.onboarded) {
      router.replace("/onboarding");
      return;
    }
    refresh();
  }, [router, refresh]);

  if (!ready || !me) return null;

  const isMe = profile?.id === me.id;
  const userPosts = profile ? posts.filter((p) => p.userId === profile.id) : [];
  const anchors = userPosts.reduce((sum, p) => sum + p.likes.length, 0);
  const getUser = (id: string) => users.find((u) => u.id === id) ?? null;

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pb-16">
      {/* top bar */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass sticky top-3 z-20 mb-6 mt-3 flex items-center gap-3 rounded-2xl px-3 py-2.5"
      >
        <motion.div whileHover={{ x: -3 }} whileTap={{ scale: 0.92 }}>
          <Link
            href="/feed"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-indigo-100/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Назад в ленту"
          >
            <ArrowLeft size={18} />
          </Link>
        </motion.div>
        <div className="min-w-0">
          <div className="truncate font-display font-bold text-white">
            {profile ? profile.name : "Профиль"}
          </div>
          {profile && (
            <div className="text-xs text-indigo-100/45">
              {userPosts.length} {pluralRu(userPosts.length, ["пост", "поста", "постов"])}
            </div>
          )}
        </div>
      </motion.header>

      {!profile ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-10 text-center"
        >
          <p className="font-display text-lg font-bold text-white">
            Человек за бортом!
          </p>
          <p className="mt-2 text-sm text-indigo-100/55">
            Пользователь @{handleParam} не найден — возможно, он сменил ник или
            сошёл на берег.
          </p>
          <Link
            href="/feed"
            className="mt-5 inline-block rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/50"
          >
            Вернуться в ленту
          </Link>
        </motion.div>
      ) : (
        <>
          {/* profile hero */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="glass rounded-3xl p-6 sm:p-8"
          >
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              >
                <Avatar name={profile.name} avatar={profile.avatar} size={96} />
              </motion.div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h1 className="font-display text-2xl font-bold text-white">
                    {profile.name}
                  </h1>
                  {isVerified(profile) && <VerifiedBadge size={20} />}
                  {isMe && (
                    <span className="rounded-full bg-indigo-500/25 px-2.5 py-0.5 text-xs font-medium text-indigo-200">
                      это вы
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-indigo-300/80">@{profile.handle}</p>

                {profile.bio && (
                  <p className="mt-3 leading-relaxed text-indigo-100/75">{profile.bio}</p>
                )}

                <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-indigo-100/45 sm:justify-start">
                  <CalendarDays size={14} />
                  На борту с {monthYearGenitive(profile.joinedAt)}
                </p>
              </div>

              {isMe && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditing(true)}
                  className="flex shrink-0 items-center gap-2 rounded-2xl bg-indigo-500/20 px-4 py-2.5 text-sm font-medium text-indigo-200 transition-colors hover:bg-indigo-500/35"
                >
                  <Pencil size={14} />
                  Редактировать
                </motion.button>
              )}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: pluralRu(userPosts.length, ["пост", "поста", "постов"]), value: userPosts.length },
                { label: pluralRu(anchors, ["якорь", "якоря", "якорей"]), value: anchors },
                { label: "дней в море", value: daysAboard(profile.joinedAt) },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="glass-soft rounded-2xl py-3.5 text-center"
                >
                  <div className="font-display text-xl font-bold text-white">
                    {s.value}
                  </div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-wide text-indigo-100/45">
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* posts */}
          <div className="mt-6 space-y-4">
            <AnimatePresence initial={false}>
              {userPosts.map((post, i) => (
                <PostCard
                  key={post.id}
                  post={post}
                  author={profile}
                  me={me}
                  getUser={getUser}
                  swayIndex={i}
                  onLike={(id) => {
                    toggleLike(id, me.id);
                    refresh();
                  }}
                  onDelete={(id) => {
                    deletePost(id);
                    refresh();
                  }}
                  onEdit={(postId, text, image) => {
                    updatePost(postId, text, image);
                    refresh();
                  }}
                  onComment={(postId, text) => {
                    addComment(postId, me.id, text);
                    refresh();
                  }}
                  onDeleteComment={(postId, commentId) => {
                    deleteComment(postId, commentId);
                    refresh();
                  }}
                />
              ))}
            </AnimatePresence>

            {userPosts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-3xl p-10 text-center text-indigo-100/50"
              >
                {isMe
                  ? "Вы ещё ничего не публиковали — самое время начать!"
                  : `${profile.name} ещё ничего не публиковал(а).`}
              </motion.div>
            )}
          </div>

          {isMe && (
            <EditProfileModal
              me={me}
              open={editing}
              onClose={() => setEditing(false)}
              onSaved={(updated) => {
                if (updated.handle !== handleParam) {
                  router.replace(`/u/${updated.handle}`);
                } else {
                  refresh();
                }
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
