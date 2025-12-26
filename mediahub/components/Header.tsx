import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white shadow mb-6">
      <nav className="max-w-6xl mx-auto px-6 py-4 flex gap-6">
        <Link href="/" className="font-bold text-xl">
          MediaHub
        </Link>

        <Link href="/movies" className="hover:text-blue-600">
          Фильмы
        </Link>

        <Link href="/music" className="hover:text-blue-600">
          Музыка
        </Link>

        <Link href="/games" className="hover:text-blue-600">
          Игры
        </Link>
      </nav>
    </header>
  );
}
