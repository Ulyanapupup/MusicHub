// components/HeaderClient.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function HeaderClient() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState<string>("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      // 1. Выходим из Supabase Auth
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // 2. Сбрасываем локальное состояние
      setUser(null);
      setUsername("");

      // 3. Принудительно обновляем данные страницы
      router.refresh();

      // 4. Переходим на главную с небольшой задержкой
      setTimeout(() => {
        router.push("/");
        setIsLoggingOut(false);
      }, 300);

    } catch (error) {
      console.error("Ошибка при выходе:", error);
      setIsLoggingOut(false);
      alert("Не удалось выйти из системы. Попробуйте еще раз.");
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
                onTouchStart={(e) => e.preventDefault()} // Для мобильных устройств
                disabled={isLoggingOut}
                className="bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {isLoggingOut ? "Выход..." : "Выйти"}
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/login")}
              onTouchStart={(e) => e.preventDefault()} // Для мобильных устройств
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-medium active:scale-95"
            >
              Войти
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

