//Shell.tsx
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Header />
      <main className="flex-1 relative">{children}</main>
      <Footer />
    </div>
  );
}
