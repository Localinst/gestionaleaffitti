import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile or not
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* MobileNav contiene sia la navbar superiore che la nav bar in basso e il pulsante per la sidebar */}
      <MobileNav />
      
      {/* Visibile solo su desktop */}
      
      
      <main className="flex-1 pl-0 md:pl-64 transition-all">
        <div className="container pt-0 md:pt-1 pb-20 md:pb-8 px-0 sm:px-4 md:px-8 mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}

export function PageHeader({ 
  title, 
  description 
}: { 
  title: string; 
  description?: string;
}) {
  return (
    <div className="mb-1 md:mb-8 px-3 sm:px-0 mt-0 md:mt-1">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}

export function CardContainer({ 
  children, 
  className,
  onClick 
}: { 
  children: React.ReactNode; 
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div 
      className={cn(
        "bg-card border rounded-lg shadow-sm p-3 sm:p-5",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function Grid({ 
  children, 
  cols = 1,
  className 
}: { 
  children: React.ReactNode; 
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const getGridCols = () => {
    switch (cols) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 sm:grid-cols-2";
      case 3:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      case 4:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
      default:
        return "grid-cols-1";
    }
  };

  return (
    <div className={cn("grid gap-2 sm:gap-4", getGridCols(), className)}>
      {children}
    </div>
  );
}

export function SectionHeader({ 
  title, 
  description 
}: { 
  title: string; 
  description?: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}
