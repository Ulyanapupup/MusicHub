// app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import HeaderClient from "../components/HeaderClient";

export const metadata: Metadata = {
  title: "MusicHub - Отзывы о музыкальных группах",
  description: "Платформа для обмена мнениями о музыкальных группах",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="antialiased bg-gray-100 text-gray-900">
        <HeaderClient />
        <main className="min-h-screen">
          {children}
        </main>
        
        {/* Футер */}
        <footer className="bg-gray-800 text-white py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-2">🎵 MusicHub</h2>
            <p className="text-gray-300 mb-4">
              © {new Date().getFullYear()} Поздняк Ульяна
            </p>
            <div className="text-sm text-gray-400">
              Платформа для обмена мнениями о музыке
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
