import React from "react";
import { cn } from "../../lib/utils";

export const Table = ({ className, ...props }) => (
  <div className="w-full overflow-auto rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
    <table className={cn("w-full caption-bottom text-left text-xs", className)} {...props} />
  </div>
);

export const TableHeader = ({ className, ...props }) => (
  <thead className={cn("border-b border-slate-800 bg-slate-950/60 text-slate-400 font-extrabold uppercase tracking-wider", className)} {...props} />
);

export const TableRow = ({ className, ...props }) => (
  <tr className={cn("border-b border-slate-800/60 transition-colors hover:bg-slate-800/30", className)} {...props} />
);

export const TableHead = ({ className, ...props }) => (
  <th className={cn("h-10 px-4 align-middle font-bold text-slate-400", className)} {...props} />
);

export const TableCell = ({ className, ...props }) => (
  <td className={cn("p-4 align-middle text-slate-200", className)} {...props} />
);
