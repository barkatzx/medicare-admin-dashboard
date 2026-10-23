import type { ReactNode } from "react";

interface TableProps {
  view: "desktop" | "mobile";
  children: ReactNode;
}

export default function Table({ view, children }: TableProps) {
  if (view === "mobile") {
    return <div className="md:hidden">{children}</div>;
  }

  return (
    <div className="hidden overflow-x-auto overscroll-x-contain md:block [scrollbar-color:theme(colors.gray.300)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-track]:bg-transparent">
      {children}
    </div>
  );
}
