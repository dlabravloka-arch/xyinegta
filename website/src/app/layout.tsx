import './globals.css';
import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Minecraft Server',
  description: 'Fabric 1.21 сервер с модами оптимизации',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">{children}</main>
        <footer className="border-t border-white/10 py-6 text-center text-sm text-white/40">
          © {new Date().getFullYear()} Minecraft Server · Fabric 1.21 · Не аффилирован с Mojang
        </footer>
      </body>
    </html>
  );
}
