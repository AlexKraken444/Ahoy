"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, LogOut, Waves } from "lucide-react";
import Avatar from "@/components/Avatar";
import Composer from "@/components/Composer";
import Logo from "@/components/Logo";
import PostCard from "@/components/PostCard";
import ProfileCard from "@/components/ProfileCard";
import {
  addComment,
  addPost,
  currentUser,
  deleteComment,
  deletePost,
  getPosts,
  getUsers,
  logout,
  toggleLike,
  updatePost,
  type Post,
  type User,
} from "@/lib/store";
import { computeTrends, pluralRu } from "@/lib/tags";

export default function FeedPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const refresh = useCallback(() => {
    setMe(currentUser());
    setPosts(getPosts());
    setUsers(getUsers());
  }, []);

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

  function handleLogout() {
    logout();
    router.push("/");
  }

  if (!me) return null;

  const authorOf = (id: string) => users.find((u) => u.id === id) ?? null;
  const myPostCount = posts.filter((p) => p.userId === me.id).length;
  const trends = computeTrends(posts).slice(0, 5);

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 pb-16">
      {/* -------- mobile header -------- */}
      <header className="glass sticky top-3 z-20 mb-6 mt-3 flex items-center justify-between rounded-2xl px-4 py-2.5 lg:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          <Link href={`/u/${me.handle}`} aria-label="Мой профиль">
            <Avatar name={me.name} avatar={me.avatar} size={34} />
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-xl p-2 text-indigo-100/50 transition-colors hover:bg-red-500/10 hover:text-red-300"
            aria-label="Выйти"
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <div className="grid gap-6 pt-0 lg:grid-cols-[290px_minmax(0,1fr)] lg:pt-8 xl:grid-cols-[290px_minmax(0,1fr)_300px]">
        {/* -------- left column -------- */}
        <div className="hidden lg:block">
          <div className="sticky top-8 space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Logo />
            </motion.div>
            <ProfileCard
              me={me}
              postCount={myPostCount}
              onLogout={handleLogout}
              onChange={refresh}
            />
          </div>
        </div>

        {/* -------- feed -------- */}
        <main className="min-w-0">
          <motion.h1
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display mb-5 hidden items-center gap-2.5 text-2xl font-bold text-white lg:flex"
          >
            <Waves size={22} className="text-indigo-400" />
            Лента
          </motion.h1>

          <Composer
            me={me}
            onPost={(text, image) => {
              addPost(me.id, text, image);
              refresh();
            }}
          />

          {/* trends as chips on screens without the right column */}
          {trends.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 xl:hidden">
              {trends.map((t) => (
                <span
                  key={t.tag}
                  className="glass-soft flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs"
                >
                  <span className="font-semibold text-indigo-300">{t.tag}</span>
                  <span className="tabular-nums text-indigo-100/45">{t.count}</span>
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 space-y-4">
            <AnimatePresence initial={false}>
              {posts.map((post, i) => (
                <PostCard
                  key={post.id}
                  post={post}
                  author={authorOf(post.userId)}
                  me={me}
                  getUser={authorOf}
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

            {posts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-3xl p-10 text-center text-indigo-100/50"
              >
                В море пока тихо… Станьте первым, кто нарушит штиль!
              </motion.div>
            )}
          </div>
        </main>

        {/* -------- right column -------- */}
        <div className="hidden xl:block">
          <div className="sticky top-8 space-y-5">
            <motion.section
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55 }}
              className="glass rounded-3xl p-5"
            >
              <h2 className="font-display mb-3 flex items-center gap-2 font-bold text-white">
                <Flame size={17} className="text-amber-400" />
                Сейчас в тренде
              </h2>
              {trends.length > 0 ? (
                <ul>
                  <AnimatePresence initial={false}>
                    {trends.map((t, i) => (
                      <motion.li
                        key={t.tag}
                        layout
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5"
                      >
                        <div className="text-sm font-semibold text-indigo-200">{t.tag}</div>
                        <div className="text-xs text-indigo-100/40">
                          {t.count} {pluralRu(t.count, ["пост", "поста", "постов"])}
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              ) : (
                <p className="px-1 text-sm leading-relaxed text-indigo-100/45">
                  Пока тихо — хэштеги ещё никто не использовал. Добавьте{" "}
                  <span className="font-semibold text-indigo-300">#хэштег</span> в пост
                  и задайте первый тренд!
                </p>
              )}
            </motion.section>

            <motion.section
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="glass rounded-3xl p-5 text-sm leading-relaxed text-indigo-100/55"
            >
              <span className="font-semibold text-indigo-200">Ahoy</span> — уютная
              гавань в открытом море интернета. Пишите, ставьте якоря и держите
              курс на интересное. ⚓
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}
