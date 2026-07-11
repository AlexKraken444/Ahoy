"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, LogOut, Waves } from "lucide-react";
import Avatar from "@/components/Avatar";
import Composer from "@/components/Composer";
import Logo from "@/components/Logo";
import PostCard from "@/components/PostCard";
import ProfileCard from "@/components/ProfileCard";
import {
  addPost,
  currentUser,
  deletePost,
  getPosts,
  getUsers,
  logout,
  toggleLike,
  type Post,
  type User,
} from "@/lib/store";

const TRENDS = [
  { tag: "#Ahoy", posts: "12,4 тыс." },
  { tag: "#МореЗовёт", posts: "8,1 тыс." },
  { tag: "#ПопутныйВетер", posts: "5,7 тыс." },
  { tag: "#ШтормовоеПредупреждение", posts: "3,2 тыс." },
  { tag: "#КаютаДняБезКота", posts: "1,9 тыс." },
];

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

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 pb-16">
      {/* -------- mobile header -------- */}
      <header className="glass sticky top-3 z-20 mb-6 mt-3 flex items-center justify-between rounded-2xl px-4 py-2.5 lg:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          <Avatar name={me.name} avatar={me.avatar} size={34} />
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

          <div className="mt-5 space-y-4">
            <AnimatePresence initial={false}>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  author={authorOf(post.userId)}
                  me={me}
                  onLike={(id) => {
                    toggleLike(id, me.id);
                    refresh();
                  }}
                  onDelete={(id) => {
                    deletePost(id);
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
              <ul>
                {TRENDS.map((t, i) => (
                  <motion.li
                    key={t.tag}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                  >
                    <button className="block w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/5">
                      <div className="text-sm font-semibold text-indigo-200">{t.tag}</div>
                      <div className="text-xs text-indigo-100/40">{t.posts} постов</div>
                    </button>
                  </motion.li>
                ))}
              </ul>
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
