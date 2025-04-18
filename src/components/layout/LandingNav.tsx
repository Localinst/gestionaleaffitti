import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  return (
    <nav className="w-full py-4 px-3 md:px-8 flex items-center justify-between bg-background border-b">
      <div className="flex items-center gap-2 min-w-0 max-w-[50%]">
        <img src="/simbolologo.png" alt="Tenoris360 Logo" className="h-7 w-auto" />
        <h1 className="text-base md:text-xl font-bold tracking-tight truncate">Tenoris360</h1>
      </div>
      
      <div className="flex items-center gap-1 sm:gap-4">
        <Link to="/login">
          <Button variant="ghost" size="sm" className="px-2 sm:px-4">Accedi</Button>
        </Link>
        <Link to="/register">
          <Button size="sm" className="px-2 sm:px-4">Registrati</Button>
        </Link>
      </div>
    </nav>
  );
} 