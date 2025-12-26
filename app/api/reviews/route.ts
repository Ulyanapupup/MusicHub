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

    // 2. Проверяем, существует ли пользователь в profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user_id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // 3. Создаем отзыв (только с user_id, без email и username)
    console.log("📝 Создаем отзыв:", {
      media_id,
      user_id,
      rating,
      text_length: text.length
    });

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        media_id,
        user_id,
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
