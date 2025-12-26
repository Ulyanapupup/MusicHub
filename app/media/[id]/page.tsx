//app/media/[id]/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Review {
  id: string;
  user_id: string;
  user_email?: string;
  username?: string;
  rating: number;
  text: string;
  created_at: string;
}

interface Media {
  id: string;
  title: string;
  description: string;
  year: number;
  cover_url?: string;
  genre?: string;
  duration?: number;
  director?: string;
  reviews?: Review[];
  avgRating?: number;
  members?: string;
}

export default function MediaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [media, setMedia] = useState<Media | null>(null);
  const [user, setUser] = useState<any>(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Получаем текущего пользователя
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

  // Загружаем данные медиа
  useEffect(() => {
    if (!id) return;

    async function fetchMedia() {
      setLoading(true);
      try {
        const res = await fetch(`/api/media/${id}`);
        if (!res.ok) throw new Error("Failed to fetch media");
        const data = await res.json();
        setMedia(data);
      } catch (error) {
        console.error("Error fetching media:", error);
        alert("Не удалось загрузить данные. Пожалуйста, обновите страницу.");
      } finally {
        setLoading(false);
      }
    }

    fetchMedia();
  }, [id]);

  // Проверяем, оставлял ли уже пользователь отзыв
  const hasUserReviewed = media?.reviews?.some(
    (review) => review.user_id === user?.id
  );

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    
    if (!user) {
      alert("Пожалуйста, войдите в систему, чтобы оставить отзыв");
      router.push("/login");
      return;
    }

    if (!reviewText.trim()) {
      alert("Пожалуйста, напишите текст отзыва");
      return;
    }

    setIsSubmitting(true);
    try {
      let username = "";
      let user_email = user.email || "";
      
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, email")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profileData) {
          username = profileData.username || "";
          user_email = profileData.email || user_email;
        }
      } catch (profileError) {
        console.warn("Ошибка при получении профиля:", profileError);
      }

      if (!username && user_email) {
        username = user_email.split('@')[0];
      }

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          media_id: id,
          user_id: user.id,
          user_email: user_email,
          username: username,
          rating: reviewRating,
          text: reviewText.trim(),
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Ошибка при добавлении отзыва");
      }

      // Обновляем данные на странице
      const res = await fetch(`/api/media/${id}`);
      const updatedMedia = await res.json();
      setMedia(updatedMedia);
      
      // Сбрасываем форму
      setReviewText("");
      setReviewRating(5);
      
      alert("Отзыв успешно добавлен!");
      
    } catch (error: any) {
      console.error("Error submitting review:", error);
      alert("Ошибка при добавлении отзыва: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteReview(reviewId: string) {
    if (!user || !confirm("Удалить этот отзыв?")) return;

    try {
      // Сразу обновляем UI
      if (media) {
        const updatedReviews = media.reviews?.filter(review => review.id !== reviewId) || [];
        
        const newAvgRating = updatedReviews.length > 0
          ? updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length
          : undefined;

        setMedia({
          ...media,
          reviews: updatedReviews,
          avgRating: newAvgRating
        });
      }

      // Отправляем запрос на удаление
      const response = await fetch(`/api/reviews/${reviewId}?user_id=${user.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при удалении отзыва");
      }

      // Обновляем данные с сервера
      setTimeout(async () => {
        try {
          const res = await fetch(`/api/media/${id}`);
          if (res.ok) {
            const updatedMedia = await res.json();
            setMedia(updatedMedia);
          }
        } catch (fetchError) {
          console.error("Не удалось обновить данные после удаления:", fetchError);
        }
      }, 500);

    } catch (error: any) {
      console.error("Error deleting review:", error);
      alert("Ошибка при удалении отзыва: " + error.message);
    }
  }

  async function refreshData() {
    try {
      const res = await fetch(`/api/media/${id}`);
      if (res.ok) {
        const updatedMedia = await res.json();
        setMedia(updatedMedia);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  }

  const getDisplayName = (review: Review) => {
    if (review.username) return review.username;
    if (review.user_email) return review.user_email.split('@')[0];
    return "Анонимный пользователь";
  };

  if (loading) return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Загрузка информации...</p>
    </div>
  );
  
  if (!media) return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Медиа не найдено</h2>
      <button 
        onClick={() => router.back()}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Вернуться назад
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
    {/* Минималистичная кнопка назад */}
    <div className="max-w-6xl mx-auto px-4 pt-8">
      <button 
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors duration-200 group"
      >
        <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="font-medium">Вернуться к группам</span>
      </button>
    </div>

      <div className="container mx-auto px-4 py-8">
        {/* Карточка медиа */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="md:flex">
            {/* Обложка - компактный квадрат */}
            <div className="md:w-1/3 lg:w-1/4">
              <div className="p-4 md:p-6">
                <div className="relative aspect-square rounded-lg overflow-hidden shadow-sm border border-gray-100">
                  {media.cover_url ? (
                    <img
                      src={media.cover_url}
                      alt={media.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-4xl">🎸</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
    
            {/* Информация о медиа */}
            <div className="md:w-2/3 lg:w-3/4 p-4 md:p-6">
              <div className="mb-3">
                <span className="text-gray-500 text-sm">Основана в {media.year}</span>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {media.title}
              </h1>
              
              {/* Участники группы */}
              {media.members && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-1">👥 Участники группы</h3>
                  <p className="text-gray-700">
                    {media.members}
                  </p>
                </div>
              )}
              
              {/* Жанр */}
              {media.genre && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Жанр</p>
                  <p className="font-medium">{media.genre}</p>
                </div>
              )}
      
              {/* Описание - теперь над рейтингом */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Описание</h3>
                <p className="text-gray-700 leading-relaxed">
                  {media.description}
                </p>
              </div>
              
              {/* Рейтинг - теперь ниже описания и на всю ширину */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">⭐ Средний рейтинг</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-gray-900">
                      {media.avgRating?.toFixed(1) || "—"}
                    </span>
                    <span className="text-gray-500 ml-2">/ 5</span>
                  </div>
                  <div>
                    <p className="text-gray-600">
                      На основе <span className="font-bold">{media.reviews?.length || 0}</span> отзывов
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        

        {/* Секция отзывов */}
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              💬 Отзывы пользователей
              <span className="ml-2 text-gray-600">
                ({media.reviews?.length || 0})
              </span>
            </h2>
            
            <button
              onClick={refreshData}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              title="Обновить список отзывов"
            >
              ⟳ Обновить
            </button>
          </div>

          {/* Форма для добавления отзыва */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {user ? "Оставить свой отзыв" : "Хотите оставить отзыв?"}
            </h3>
            
            {user ? (
              hasUserReviewed ? (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-blue-700">
                    Вы уже оставили отзыв на этот контент. Спасибо за ваше мнение! ✨
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Ваша оценка</label>
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`text-2xl ${star <= reviewRating ? "text-yellow-500" : "text-gray-300"}`}
                          aria-label={`Оценить на ${star} звезд`}
                        >
                          ★
                        </button>
                      ))}
                      <span className="ml-3 font-bold">{reviewRating}.0</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Текст отзыва</label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Поделитесь вашим мнением о этом контенте..."
                      className="w-full border border-gray-300 rounded p-3 min-h-[100px] focus:border-blue-500 focus:outline-none"
                      rows={4}
                      maxLength={1000}
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-sm text-gray-500">Максимум 1000 символов</p>
                      <p className="text-sm text-gray-500">{reviewText.length}/1000</p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !reviewText.trim()}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Отправка..." : "Опубликовать отзыв"}
                  </button>
                </form>
              )
            ) : (
              <div className="p-6 border border-gray-300 rounded-lg bg-gray-50">
                <div className="text-center">
                  <div className="text-gray-400 mb-3">
                    <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">
                    Только для авторизованных пользователей
                  </h4>
                  <p className="text-gray-500 mb-4">
                    Войдите в систему, чтобы поделиться своим мнением
                  </p>
                  <button
                    onClick={() => router.push("/login")}
                    className="px-5 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700"
                  >
                    Войти / Зарегистрироваться
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Список отзывов */}
          <div>
            {!media.reviews || media.reviews.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-3">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Пока нет отзывов
                </h3>
                <p className="text-gray-500">
                  Будьте первым, кто поделится своим мнением!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {media.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border border-gray-200 rounded p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {getDisplayName(review)[0]?.toUpperCase() || "A"}
                        </div>
                        <div className="ml-2">
                          <p className="font-medium text-gray-900">
                            {getDisplayName(review)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString("ru-RU", {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-yellow-50 px-2 py-1 rounded">
                          <span className="text-yellow-500 mr-1">★</span>
                          <span className="font-bold text-gray-900">{review.rating}.0</span>
                        </div>
                        
                        {user?.id === review.user_id && (
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                            title="Удалить отзыв"
                          >
                            Удалить
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 pl-10">
                      {review.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}