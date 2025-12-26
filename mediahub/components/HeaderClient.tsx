// components/HeaderClient.tsx

"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function HeaderClient() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={() => router.push("/")}
            className="flex items-center text-2xl font-bold text-purple-600 hover:text-purple-700 transition-colors"
          >
            🎵 MusicHub
          </button>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-gray-600 text-sm">
                👋 {user.email?.split('@')[0] || "Пользователь"}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded-full text-sm font-medium transition-colors"
              >
                Выйти
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-medium"
            >
              Войти
            </button>
          )}
        </div>
      </div>
    </header>
  );
}