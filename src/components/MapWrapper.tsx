"use client";
import dynamic from "next/dynamic";

interface MapMarker {
  id: number;
  slug: string;
  nama: string;
  kategori: string;
  latitude: number;
  longitude: number;
}

interface MapWrapperProps {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  singleMode?: boolean;
}

const DynamicMap = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 border border-slate-200">
      Memuat Peta...
    </div>
  ),
});

export default function MapWrapper(props: MapWrapperProps) {
  return <DynamicMap {...props} />;
}
