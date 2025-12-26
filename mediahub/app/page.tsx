// app/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Media {
  id: string;
  title: string;
  cover_url: string;
  avgRating?: number;
  year?: number;
  genre?: string;
  artist?: string;
  members?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [featuredMusic, setFeaturedMusic] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedMusic() {
      try {
        setLoading(true);
        // Загружаем 10 лучших групп для главной страницы
        const res = await fetch("/api/media/list?limit=10");
        const data = await res.json();
        setFeaturedMusic(data);
      } catch (error) {
        console.error("Error fetching featured music:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedMusic();
  }, []);

  const formatRating = (rating?: number) => {
    if (rating === undefined || rating === null) return "—";
    return rating.toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Герой секция */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              🎵 MusicHub
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto">
              Платформа для оценки музыкальных групп и исполнителей. Оценивайте, делитесь мнениями, находите новую музыку!
            </p>
            <button
              onClick={() => router.push("/music")}
              className="bg-white text-purple-600 hover:bg-purple-50 font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              👉 Смотреть все
            </button>
          </div>
        </div>
      </div>

      {/* Популярные группы (Топ-10) */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Заголовок в овале */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 rounded-full font-semibold text-lg mb-4">
            <span className="mr-3">🔥</span>
            Популярные группы
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Топ-10 групп и исплнителей с высокими оценками пользователей
          </h2>
          <p className="text-gray-600">
            Самые обсуждаемые и любимые музыкальные коллективы
          </p>
        </div>

        {featuredMusic.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Группы не найдены
            </h3>
            <p className="text-gray-500">
              В базе данных пока нет музыкальных групп
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {featuredMusic.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer group"
                  onClick={() => router.push(`/media/${item.id}`)}
                >
                  <div className="relative h-48 overflow-hidden">
                    {item.cover_url ? (
                      <img
                        src={item.cover_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-200 to-blue-200 flex items-center justify-center">
                        <span className="text-gray-400 text-4xl">🎸</span>
                      </div>
                    )}
                    
                    {/* Место в топе */}
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    
                    {/* Рейтинг */}
                    <div className="absolute top-3 right-3 bg-black/80 text-white px-3 py-1 rounded-full flex items-center">
                      <span className="text-yellow-400 mr-1">★</span>
                      <span className="font-bold">{formatRating(item.avgRating)}</span>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1 mb-1">
                      {item.title}
                    </h3>
                    
                    {item.artist && (
                      <p className="text-gray-600 text-sm mb-2">
                        🎤 Основана: {item.artist}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center text-gray-500 text-sm">
                        {item.year && (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {item.year}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center font-bold text-purple-600">
                        <span className="mr-1">★</span>
                        <span>{formatRating(item.avgRating)}</span>
                        <span className="text-gray-400 ml-1">/5</span>
                      </div>
                    </div>
                    
                    {item.genre && (
                      <div className="mt-3">
                        <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                          {item.genre}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Призыв к действию */}
            <div className="mt-12 text-center">
              <div className="inline-block px-8 py-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {featuredMusic.length < 10 ? (
                    <>
                      Хотите видеть здесь свою любимую группу?
                    </>
                  ) : (
                    <>
                      Не нашли свою любимую группу в топе?
                    </>
                  )}
                </h3>
                <p className="text-gray-600 mb-4 max-w-2xl mx-auto">
                  Оцените своих фаворитов и помогите другим открыть для себя новую музыку!
                </p>
                <button
                  onClick={() => router.push("/music")}
                  className="inline-flex items-center bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-8 rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <span className="mr-2">⭐</span>
                  Оценить любимые группы
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}