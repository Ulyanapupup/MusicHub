// app/login/page.tsx

"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleSignUp() {
    if (!username.trim()) {
      alert("Пожалуйста, введите никнейм");
      return;
    }

    if (username.length < 3 || username.length > 50) {
      alert("Никнейм должен быть от 3 до 50 символов");
      return;
    }

    setLoading(true);

    try {
      // 1. Проверяем, не занят ли никнейм
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.trim())
        .maybeSingle();

      if (existingUser) {
        alert("Этот никнейм уже занят, выберите другой");
        setLoading(false);
        return;
      }

      // 2. Регистрируем пользователя в Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim()
          }
        }
      });

      if (authError) {
        throw new Error(`Ошибка регистрации: ${authError.message}`);
      }

      console.log("Пользователь создан в Auth:", authData.user?.id);

      // 3. Если регистрация прошла успешно и есть пользователь
      if (authData.user) {
        // 4. Создаем профиль в таблице profiles
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: authData.user.id,
            email: email,
            username: username.trim(),
            created_at: new Date().toISOString()
          }, {
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (profileError) {
          console.error("Ошибка создания профиля:", profileError);
          
          // Если это ошибка уникальности username, предложим другой
          if (profileError.code === '23505' && profileError.message.includes('username')) {
            alert("Этот никнейм уже занят. Пожалуйста, выберите другой.");
            setLoading(false);
            return;
          }
          
          throw new Error(`Не удалось создать профиль: ${profileError.message}`);
        }

        console.log("Профиль успешно создан/обновлен");

        // 5. Пробуем сразу войти (если email не требует подтверждения)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.warn("Не удалось автоматически войти:", signInError);
          // Улучшенное сообщение
          alert(`На адрес ${email} было отправлено письмо для подтверждения.\n\nПожалуйста, проверьте вашу почту (в том числе папку "Спам") и перейдите по ссылке в письме.`);
          setIsSignUp(false);
          setUsername("");
          setEmail("");
          setPassword("");
        } else {
          // Если вход удался (email подтверждение не требуется)
          alert("🎉 Регистрация успешна! Вы автоматически вошли в систему.");
          router.push("/");
        }
      } else {
        // Email confirmation required (пользователя нет, значит нужна проверка email)
        alert(`📬 Регистрация почти завершена!\n\nНа адрес ${email} было отправлено письмо для подтверждения регистрации.\n\nПожалуйста:\n1. Проверьте вашу почту\n2. Найдите письмо от MusicHub\n3. Перейдите по ссылке подтверждения\n\nПосле этого вы сможете войти в систему.`);
        setIsSignUp(false);
        setUsername("");
        setEmail("");
        setPassword("");
      }
    
    } catch (error: any) {
      console.error("Ошибка при регистрации:", error);
      // Более информативное сообщение об ошибке
      if (error.message.includes("already registered")) {
        alert("Пользователь с таким email уже зарегистрирован. Попробуйте войти или восстановить пароль.");
      } else if (error.message.includes("password")) {
        alert("Ошибка с паролем. Убедитесь, что пароль содержит минимум 6 символов.");
      } else {
        alert(`Ошибка при регистрации: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn() {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(`Ошибка входа: ${error.message}`);
      }

      console.log("Вход успешен");
      router.push("/");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white border rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold mb-2 text-center text-gray-800">
        {isSignUp ? "Регистрация" : "Вход"}
      </h1>
      <p className="text-gray-600 text-center mb-6">
        {isSignUp ? "Создайте новый аккаунт" : "Войдите в свой аккаунт"}
      </p>

      <div className="space-y-4">
        {isSignUp && (
          <div>
            <label className="block text-gray-700 mb-2 font-medium">
              Никнейм
            </label>
            <input
              type="text"
              placeholder="Придумайте никнейм (3-50 символов)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              minLength={3}
              maxLength={50}
            />
            <p className="text-sm text-gray-500 mt-1">
              Этот никнейм будет отображаться в ваших отзывах
            </p>
          </div>
        )}

        <div>
          <label className="block text-gray-700 mb-2 font-medium">
            Email
          </label>
          <input
            type="email"
            placeholder="example@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2 font-medium">
            Пароль
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
            minLength={6}
            required
          />
          {isSignUp && (
            <p className="text-sm text-gray-500 mt-1">
              Минимум 6 символов
            </p>
          )}
        </div>

        <div className="pt-2">
          {isSignUp ? (
            <button
              onClick={handleSignUp}
              disabled={loading || !username.trim() || username.length < 3}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Регистрация...
                </span>
              ) : "Зарегистрироваться"}
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={loading || !email || !password}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Вход...
                </span>
              ) : "Войти"}
            </button>
          )}
        </div>

        <div className="text-center pt-4 border-t">
          <p className="text-gray-600">
            {isSignUp ? "Уже есть аккаунт?" : "Еще нет аккаунта?"}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setUsername("");
              }}
              className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              {isSignUp ? "Войти" : "Зарегистрироваться"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

