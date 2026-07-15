"use client";
import { Clock } from "lucide-react";
import { parseOpenStatus } from "@/utils/umkmUtils";

interface OpenStatusBadgeProps {
  jam_operasional: string | null;
}

export default function OpenStatusBadge({ jam_operasional }: OpenStatusBadgeProps) {
  const status = parseOpenStatus(jam_operasional);

  const dotColor =
    status.status === "OPEN"
      ? "bg-emerald-500"
      : status.status === "CLOSED"
        ? "bg-rose-500"
        : "bg-slate-400";

  const badgeBg =
    status.status === "OPEN"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status.status === "CLOSED"
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : "bg-slate-50 text-slate-600 border-slate-200";

  const statusLabel =
    status.status === "OPEN"
      ? "Buka"
      : status.status === "CLOSED"
        ? "Tutup"
        : "Tidak diketahui";

  return (
    <div className="flex gap-4 items-start flex-col w-full">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600 border border-emerald-100/50">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-900">Jam Operasional</h4>

          {/* Status badge */}
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mt-1.5 border ${badgeBg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${status.status === "OPEN" ? "animate-pulse" : ""}`}></span>
            {statusLabel}
          </span>

          {/* Contextual label */}
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {status.label}
          </p>

          {/* Raw jam operasional */}
          {jam_operasional && status.status !== "UNKNOWN" && (
            <p className="text-[10px] text-slate-400 mt-1">
              {jam_operasional}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
