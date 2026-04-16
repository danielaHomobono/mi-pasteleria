import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { CatalogSection } from "@/components/features/catalog-section";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navegación */}
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center font-semibold">
            <Link href={"/"}>Mi Pastelería</Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            {hasEnvVars && (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-7xl px-5">
          {/* Sección de catálogo */}
          <CatalogSection />
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-t-foreground/10 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Mi Pastelería. Todos los derechos
              reservados.
            </p>
            <p className="text-sm text-muted-foreground">
              Tortas artesanales de Río Tercero, Córdoba
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
