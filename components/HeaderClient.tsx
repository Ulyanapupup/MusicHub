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

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Принудительно обновляем состояние
      setUser(null);
      router.refresh();
      router.push("/");
    } catch (error: any) {
      console.error("Ошибка при выходе:", error.message);
      alert("Ошибка при выходе из системы");
    }
  }

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 
              onClick={() => router.push("/")} 
              className="text-2xl font-bold text-purple-600 cursor-pointer"
            >
              🎵 MusicHub
            </h1>
            <nav className="ml-10 space-x-4">
              <button 
                onClick={() => router.push("/")}
                className="text-gray-700 hover:text-purple-600"
              >
                Главная
              </button>
              <button 
                onClick={() => router.push("/music")}
                className="text-gray-700 hover:text-purple-600"
              >
                Все группы
              </button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-700">
                  {user.email?.split('@')[0]}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  Выйти
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
