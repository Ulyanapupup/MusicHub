import { supabase } from "../../../../lib/supabaseClient";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit");

  try {
    // Сначала получаем ВСЕ медиа без лимита для правильной сортировки
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

    // Получаем отзывы и рассчитываем средний рейтинг для каждого медиа
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("media_id, rating")
      .in("media_id", mediaIds);

    if (reviewsError) {
      console.warn("Error fetching reviews for ratings:", reviewsError);
      // Возвращаем медиа без рейтингов
      const sortedMedia = mediaList.sort((a, b) => a.title.localeCompare(b.title));
      return NextResponse.json(limit ? sortedMedia.slice(0, parseInt(limit)) : sortedMedia);
    }

    // Создаем объект для быстрого доступа: media_id -> средний рейтинг
    const ratingsMap: Record<string, { sum: number, count: number }> = {};

    // Инициализируем для каждого медиа
    mediaIds.forEach(id => {
      ratingsMap[id] = { sum: 0, count: 0 };
    });

    // Суммируем рейтинги
    reviews?.forEach(review => {
      if (ratingsMap[review.media_id]) {
        ratingsMap[review.media_id].sum += review.rating;
        ratingsMap[review.media_id].count += 1;
      }
    });

    // Добавляем средний рейтинг к каждому медиа и СОРТИРУЕМ по рейтингу
    let mediaWithRatings = mediaList
      .map(media => {
        const ratingData = ratingsMap[media.id];
        const avgRating = ratingData.count > 0 
          ? Number((ratingData.sum / ratingData.count).toFixed(1))
          : 0; // Изменено: если нет оценок, ставим 0 вместо undefined

        return {
          ...media,
          avgRating
        };
      })
      // СОРТИРОВКА: по убыванию рейтинга
      .sort((a, b) => {
        const ratingA = a.avgRating;
        const ratingB = b.avgRating;
        return ratingB - ratingA; // от большего к меньшему
      });

    // Применяем лимит ПОСЛЕ сортировки
    if (limit) {
      mediaWithRatings = mediaWithRatings.slice(0, parseInt(limit));
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