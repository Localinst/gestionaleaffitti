import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  return (
    <nav className="w-full py-4 px-6 md:px-8 flex items-center justify-between bg-background border-b">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Gestionale Affitti</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <Link to="/login">
          <Button variant="ghost" size="sm">Accedi</Button>
        </Link>
        <Link to="/register">
          <Button size="sm">Registrati</Button>
        </Link>
      </div>
    </nav>
  );
} 