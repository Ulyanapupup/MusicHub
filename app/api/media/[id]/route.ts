//app/api/media/[id]/route.ts

import { supabase } from "../../../../lib/supabaseClient";
import { NextResponse } from "next/server";

// Интерфейсы для данных
interface ReviewForResponse {
  id: string;
  user_id: string;
  user_email: string | null;
  username: string | null;
  rating: number;
  text: string;
  created_at: string;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "No id provided" }, { status: 400 });
    }

    // Получаем данные медиа
    const { data: media, error: mediaError } = await supabase
      .from("media")
      .select("*")
      .eq("id", id)
      .single();

    if (mediaError) {
      console.error("Media error:", mediaError);
      return NextResponse.json({ error: mediaError.message }, { status: 500 });
    }

    // Получаем отзывы
    let reviews: ReviewForResponse[] = [];
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("id, user_id, user_email, username, rating, text, created_at")
        .eq("media_id", id)
        .order("created_at", { ascending: false });

      if (reviewsError) {
        console.error("Error fetching reviews:", reviewsError);
        reviews = [];
      } else {
        reviews = (reviewsData || []) as ReviewForResponse[];
      }
    } catch (reviewFetchError) {
      console.warn("Error fetching reviews:", reviewFetchError);
      reviews = [];
    }

    // Рассчитываем средний рейтинг
    let avgRating: number | null = null;
    if (reviews.length > 0) {
      avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    }

    return NextResponse.json({
      ...media,
      reviews,
      avgRating,
    });

  } catch (error: any) {
    console.error("Server error in media/[id] route:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}