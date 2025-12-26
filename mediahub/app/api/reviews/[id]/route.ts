//app/api/reviews/[id]/route.ts

import { supabase } from "../../../../lib/supabaseClient";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await context.params;
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    console.log("Удаление отзыва:", { reviewId, user_id });

    if (!reviewId || !user_id) {
      return NextResponse.json(
        { error: "Необходимы review_id и user_id" },
        { status: 400 }
      );
    }

    // Сначала проверяем, существует ли отзыв и принадлежит ли пользователю
    const { data: existingReview, error: checkError } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", reviewId)
      .eq("user_id", user_id)
      .single();

    if (checkError || !existingReview) {
      console.error("Отзыв не найден или не принадлежит пользователю:", checkError);
      return NextResponse.json(
        { error: "Отзыв не найден или у вас нет прав на его удаление" },
        { status: 404 }
      );
    }

    // Удаляем отзыв
    const { error: deleteError } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId)
      .eq("user_id", user_id);

    if (deleteError) {
      console.error("Ошибка при удалении из БД:", deleteError);
      return NextResponse.json(
        { error: "Ошибка при удалении: " + deleteError.message },
        { status: 500 }
      );
    }

    console.log("Отзыв успешно удален из БД");
    return NextResponse.json(
      { success: true, message: "Отзыв удален" },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Server error in DELETE route:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера: " + error.message },
      { status: 500 }
    );
  }
}