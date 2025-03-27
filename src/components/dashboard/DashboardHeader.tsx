import { ReactNode } from "react";

interface DashboardHeaderProps {
  heading: string;
  text?: string;
  children?: ReactNode;
  icon?: ReactNode;
}

export function DashboardHeader({
  heading,
  text,
  children,
  icon,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="grid gap-1">
        <h1 className="font-semibold text-xl md:text-2xl flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          {heading}
        </h1>
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
      {children}
    </div>
  );
} 