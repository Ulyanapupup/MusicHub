// components/HeaderClient.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function HeaderClient() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        fetchUsername(data.session.user.id);
      }
    };

    initializeAuth();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUsername(session.user.id);
        } else {
          setUsername("");
        }
      }
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function fetchUsername(userId: string) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single();
      
      if (data?.username) {
        setUsername(data.username);
      }
    } catch (error) {
      console.log("Не удалось получить username:", error);
    }
  }

  const handleLogout = async () => {
    try {
      // Простой выход без сложной логики
      await supabase.auth.signOut();
      
      // Сразу обновляем UI
      setUser(null);
      setUsername("");
      
      // Переходим на главную
      window.location.href = "/"; // Используем window.location для полного обновления
      
    } catch (error) {
      console.error("Logout error:", error);
      // Если ошибка, все равно перенаправляем на главную
      window.location.href = "/";
    }
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
              <span className="text-gray-600 text-sm hidden sm:block">
                👋 {username || user.email?.split('@')[0] || "Пользователь"}
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
