import { supabase } from "../../../../lib/supabaseClient";
import { NextResponse } from "next/server";

// app/api/media/list/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit");

  try {
    // Сначала получаем ВСЕ медиа без лимита
    let query = supabase.from("media").select("*");
    
    const { data: mediaList, error: mediaError } = await query;

    if (mediaError) {
      console.error("Supabase error fetching media:", mediaError);
      return NextResponse.json({ error: mediaError.message }, { status: 500 });
    }

    if (!mediaList || mediaList.length === 0) {
      return NextResponse.json([]);
    }

    // Получаем ID всех медиа для запроса отзывов
    const mediaIds = mediaList.map(media => media.id);

    // Получаем ВСЕ отзывы для расчета средних рейтингов
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("media_id, rating")
      .in("media_id", mediaIds);

    // Создаем мапу для расчета средних рейтингов
    const ratingsMap: Record<string, { sum: number, count: number }> = {};

    // Инициализируем для каждого медиа
    mediaIds.forEach(id => {
      ratingsMap[id] = { sum: 0, count: 0 };
    });

    // Суммируем рейтинги, если есть отзывы
    if (reviews && !reviewsError) {
      reviews.forEach(review => {
        if (ratingsMap[review.media_id]) {
          ratingsMap[review.media_id].sum += review.rating;
          ratingsMap[review.media_id].count += 1;
        }
      });
    }

    // Добавляем средний рейтинг к каждому медиа
    let mediaWithRatings = mediaList.map(media => {
      const ratingData = ratingsMap[media.id];
      let avgRating = 0;
      
      if (ratingData && ratingData.count > 0) {
        // Рассчитываем средний рейтинг с точностью до 1 знака
        avgRating = Number((ratingData.sum / ratingData.count).toFixed(1));
      }
      
      return {
        ...media,
        avgRating
      };
    });

    // ВАЖНО: СОРТИРОВКА ПО УБЫВАНИЮ РЕЙТИНГА
    mediaWithRatings.sort((a, b) => {
      // Сначала сортируем по рейтингу (от большего к меньшему)
      if (b.avgRating !== a.avgRating) {
        return b.avgRating - a.avgRating;
      }
      // Если рейтинги равны, сортируем по названию
      return a.title.localeCompare(b.title);
    });

    // Применяем лимит ПОСЛЕ сортировки
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        mediaWithRatings = mediaWithRatings.slice(0, limitNum);
      }
    }

    return NextResponse.json(mediaWithRatings);

  } catch (error: any) {
    console.error("Server error in media/list route:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
