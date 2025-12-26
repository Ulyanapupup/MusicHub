// app/api/reviews/route.ts

import { supabase } from "../../../lib/supabaseClient";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { media_id, user_id, rating, text } = body;

    console.log("📥 Получены данные для отзыва:", { 
      media_id, 
      user_id, 
      rating, 
      text_length: text?.length 
    });

    // Базовые проверки
    if (!media_id || !user_id || !rating || !text) {
      return NextResponse.json(
        { error: "Необходимы media_id, user_id, rating и text" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Рейтинг должен быть от 1 до 5" },
        { status: 400 }
      );
    }

    // 1. Проверяем существующий отзыв
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("media_id", media_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (existingReview) {
      return NextResponse.json(
        { error: "Вы уже оставляли отзыв на этот контент" },
        { status: 400 }
      );
    }

    // 2. Получаем данные пользователя
    let user_email = '';
    let username = '';

    // Сначала пробуем получить из profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, username")
      .eq("id", user_id)
      .maybeSingle();

    if (profile) {
      user_email = profile.email || '';
      username = profile.username || '';
      console.log("✅ Данные из profiles:", { user_email, username });
    } else {
      console.warn("⚠️ Профиль не найден для user_id:", user_id);
      
      // Если профиля нет, создаем его
      try {
        // Получаем email из auth
        const { data: authUser } = await supabase.auth.admin.getUserById(user_id);
        const authEmail = authUser?.user?.email || '';
        
        if (authEmail) {
          // Создаем профиль с username из email
          const generatedUsername = authEmail.split('@')[0];
          
          const { error: createProfileError } = await supabase
            .from("profiles")
            .upsert({
              id: user_id,
              email: authEmail,
              username: generatedUsername,
              created_at: new Date().toISOString()
            });

          if (!createProfileError) {
            user_email = authEmail;
            username = generatedUsername;
            console.log("✅ Профиль создан автоматически:", { user_email, username });
          }
        }
      } catch (profileCreateError) {
        console.warn("⚠️ Не удалось создать профиль:", profileCreateError);
      }
    }

    // 3. Fallback
    if (!user_email) {
      user_email = body.user_email || `user_${user_id.substring(0, 8)}`;
    }
    
    if (!username) {
      username = user_email.split('@')[0] || `user_${user_id.substring(0, 8)}`;
    }

    // 4. Создаем отзыв
    console.log("📝 Создаем отзыв:", {
      media_id,
      user_id,
      user_email: user_email.substring(0, 20) + '...',
      username,
      rating,
      text_length: text.length
    });

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        media_id,
        user_id,
        user_email,
        username,
        rating,
        text,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Ошибка при создании отзыва:", error);
      return NextResponse.json({ 
        error: "Ошибка при создании отзыва",
        details: error.message
      }, { status: 500 });
    }

    console.log("✅ Отзыв успешно создан, ID:", data.id);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("💥 Server error:", error);
    return NextResponse.json(
      { 
        error: "Внутренняя ошибка сервера", 
        details: error.message
      },
      { status: 500 }
    );
  }
}