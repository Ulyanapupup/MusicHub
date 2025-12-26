// app/api/media/[id]/route.ts
import { supabase } from "../../../../lib/supabaseClient";
import { NextResponse } from "next/server";

// Интерфейсы для данных
interface ReviewForResponse {
  id: string;
  user_id: string;
  username: string | null;
  email: string | null;
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

    // Получаем отзывы с данными пользователей через JOIN
    let reviews: ReviewForResponse[] = [];
    try {
      // 1. Сначала получаем отзывы
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("id, user_id, rating, text, created_at")
        .eq("media_id", id)
        .order("created_at", { ascending: false });

      if (reviewsError) {
        console.error("Error fetching reviews:", reviewsError);
        reviews = [];
      } else {
        // 2. Получаем ID всех пользователей
        const userIds = [...new Set(reviewsData?.map(r => r.user_id) || [])];
        
        // 3. Получаем данные профилей отдельно
        let profilesMap = {};
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, username, email")
            .in("id", userIds);
          
          if (profilesData) {
            profilesMap = profilesData.reduce((acc, profile) => {
              acc[profile.id] = profile;
              return acc;
            }, {});
          }
        }

        // 4. Объединяем данные
        reviews = (reviewsData || []).map((review: any) => ({
          id: review.id,
          user_id: review.user_id,
          username: profilesMap[review.user_id]?.username || null,
          email: profilesMap[review.user_id]?.email || null,
          rating: review.rating,
          text: review.text,
          created_at: review.created_at
        })) as ReviewForResponse[];
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
