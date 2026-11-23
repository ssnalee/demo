import type { SVGProps } from "react";

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export const MenuIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} width={18} height={18} {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
export const HomeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} width={16} height={16} {...p}>
    <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z" />
  </svg>
);
export const ShieldIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} width={16} height={16} {...p}>
    <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
export const CalendarIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} width={16} height={16} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
  </svg>
);
export const ChevronIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} width={14} height={14} {...p}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/** 사이드바 메뉴별 아이콘 (경로 → SVG path) */
const NAV_PATHS: Record<string, string> = {
  "/dashboard": "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z",
  "/process": "M4 6h9M4 12h13M4 18h6M16 6h4M20 12h0M13 18h7",
  "/workplan": "M9 4h6v3H9zM7 5.5H5v15h14v-15h-2M8.5 12h7M8.5 16h5",
  "/workdiary": "M5 4h11l3 3v13H5zM9 9h6M9 13h6M9 17h4",
  "/workforce": "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16 4.5a3.5 3.5 0 010 6.5M18.5 14.8c1.7.8 2.8 2.6 3 5.2",
  "/floors": "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
  "/estimate": "M6 3h12v18H6zM9 7h6M9 11h1M12 11h1M15 11h0M9 15h1M12 15h1M9 18h6",
  "/permit": "M5 4h14v16H5zM9 12l2 2 4-4",
  "/training": "M3 9l9-5 9 5-9 5zM7 11.5V16c1.5 1.5 3 2 5 2s3.5-.5 5-2v-4.5M21 9v5",
  "/inspection": "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4M8 11l2 2 4-4",
  "/risk": "M12 4l9.5 16h-19zM12 10v4M12 17h0",
  "/incident": "M12 3a9 9 0 100 18 9 9 0 000-18zM12 8v5M12 16h0",
  "/actions": "M14.7 6.3a4 4 0 00-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 005.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z",
  "/defects": "M4 20h16M6 20V10l6-5 6 5v10M10 20v-5h4v5",
  "/schedule": "M3 5h18v16H3zM16 3v4M8 3v4M3 10h18M8 14h2M14 14h2M8 17h2",
  "/reports": "M6 3h9l4 4v14H6zM9 17v-3M12 17v-6M15 17v-4",
  "/admin/users": "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c.6-3.4 3.2-5.5 6.5-5.5 1.3 0 2.5.3 3.5.9M18 14v6M15 17h6",
};

export const NavIcon = ({ href, ...p }: SVGProps<SVGSVGElement> & { href: string }) => (
  <svg {...base} width={16} height={16} {...p}>
    <path d={NAV_PATHS[href] ?? "M5 12h14"} />
  </svg>
);

/** 앱 로고: 연한 하늘색 타일 위 하늘색 방패 */
export const LogoMark = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 32 32" width={32} height={32} {...p}>
    <defs>
      <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#38bdf8" />
        <stop offset="1" stopColor="#0284c7" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="10" fill="#e0f2fe" />
    <path d="M16 6.5l8 3v6c0 4.9-3.4 8.9-8 10-4.6-1.1-8-5.1-8-10v-6z" fill="url(#logo-g)" />
    <path d="M12.3 15.8l2.6 2.6 4.8-4.8" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
