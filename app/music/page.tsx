// app/music/page.tsx

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
  description?: string;
  members?: string;
}

export default function MusicPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const router = useRouter();

  useEffect(() => {
    async function fetchMusic() {
      try {
        setLoading(true);
        const res = await fetch("/api/media/list");
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        setMedia(data);
      } catch (error) {
        console.error("Error fetching music:", error);
        alert("Не удалось загрузить список групп");
      } finally {
        setLoading(false);
      }
    }

    fetchMusic();
  }, []);

  const formatRating = (rating?: number) => {
    if (rating === undefined || rating === null) return "—";
    return rating.toFixed(1);
  };

  const getRatingColor = (rating?: number) => {
    if (!rating) return "text-gray-400";
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const filteredMedia = media
    .filter(item => 
      search === "" || 
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.artist && item.artist.toLowerCase().includes(search.toLowerCase())) ||
      (item.genre && item.genre.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      switch(sortBy) {
        case "rating":
          return (b.avgRating || 0) - (a.avgRating || 0);
        case "year":
          return (b.year || 0) - (a.year || 0);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка групп...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            🎸 Музыкальные группы и исполнители
          </h1>
          <p className="text-gray-600 mb-6">
            Коллекция музыкальных групп и исполнителей с оценками пользователей
          </p>

          {/* Поиск и фильтры */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск по названию, году основания или жанру..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔍
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-xl px-4 py-3 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
              >
                <option value="rating">По рейтингу</option>
                <option value="year">По году основания</option>
                <option value="title">По названию</option>
              </select>
            </div>
          </div>
        </div>

        {filteredMedia.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {search ? "Ничего не найдено" : "Группы не найдены"}
            </h3>
            <p className="text-gray-500">
              {search ? "Попробуйте другой запрос" : "В базе данных пока нет музыкальных групп"}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-gray-600">
                Найдено <span className="font-bold">{filteredMedia.length}</span> групп
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1"
                  onClick={() => router.push(`/media/${item.id}`)}
                >
                  {/* Обложка */}
                  <div className="relative h-64 md:h-72 overflow-hidden">
                    {item.cover_url ? (
                      <img
                        src={item.cover_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-200 to-blue-200 flex items-center justify-center">
                        <span className="text-4xl text-gray-400">🎸</span>
                      </div>
                    )}
                    
                    {/* Рейтинг на карточке */}
                    <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-full flex items-center">
                      <span className="text-yellow-400 mr-1">★</span>
                      <span className="font-bold">{formatRating(item.avgRating)}</span>
                    </div>
                  </div>
                  
                  {/* Информация */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1 mb-1">
                      {item.title}
                    </h3>
                    
                    {item.artist && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                        🎤 Основана: {item.artist}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      {item.year && (
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {item.year}
                        </span>
                      )}
                      
                      <div className={`flex items-center font-semibold ${getRatingColor(item.avgRating)}`}>
                        <span className="mr-1">★</span>
                        <span>{formatRating(item.avgRating)}</span>
                        <span className="text-gray-400 ml-1">/5</span>
                      </div>
                    </div>
                    
                    {item.genre && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                          {item.genre}
                        </span>
                      </div>
                    )}
                    
                    {item.description && (
                      <p className="mt-2 text-gray-500 text-xs line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}