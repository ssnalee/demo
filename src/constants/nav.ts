/** 사이드바 메뉴 = 라우트 구조. 화면을 추가하면 여기와 app/(site)/<slug>/page.tsx 를 함께 추가 */
export interface NavItem {
  href: string;
  label: string;
  /** 화면 제목 (브라우저 탭) */
  title: string;
}

export interface NavGroup {
  id: "ops" | "safety" | "after" | "admin";
  label: string;
  icon: "home" | "shield" | "calendar" | "settings";
  items: NavItem[];
  /** 관리자에게만 보이는 메뉴 */
  adminOnly?: boolean;
}

export const NAV: NavGroup[] = [
  {
    id: "ops",
    label: "현장 운영",
    icon: "home",
    items: [
      { href: "/dashboard", label: "종합 대시보드", title: "현장 대시보드" },
      { href: "/process", label: "공정표", title: "공정표" },
      { href: "/workplan", label: "작업계획서 관리", title: "작업계획서 관리" },
      { href: "/workdiary", label: "작업일보 관리", title: "작업일보 관리" },
      { href: "/workforce", label: "근로자·출역 관리", title: "근로자·일일 출역 관리" },
      { href: "/floors", label: "층별·공종 관리", title: "층별·공종 관리" },
      { href: "/estimate", label: "견적·실행 관리", title: "견적·실행 관리" },
    ],
  },
  {
    id: "safety",
    label: "안전관리",
    icon: "shield",
    items: [
      { href: "/permit", label: "작업허가", title: "작업허가 관리" },
      { href: "/training", label: "안전교육", title: "안전교육 기록" },
      { href: "/inspection", label: "안전점검", title: "안전점검 등록" },
      { href: "/risk", label: "위험성평가", title: "위험성평가 등록" },
      { href: "/incident", label: "사고·아차사고", title: "사고·아차사고 등록" },
      { href: "/actions", label: "개선조치 관리", title: "개선조치 관리" },
    ],
  },
  {
    id: "after",
    label: "일정·사후관리",
    icon: "calendar",
    items: [
      { href: "/defects", label: "하자보수 관리", title: "준공 후 하자보수 관리" },
      { href: "/schedule", label: "일정관리·중요일정", title: "일정관리 및 중요일정" },
      { href: "/reports", label: "보고서 출력", title: "안전관리 보고서" },
    ],
  },
  {
    id: "admin",
    label: "관리",
    icon: "settings",
    adminOnly: true,
    items: [{ href: "/admin/users", label: "계정 관리", title: "계정 관리" }],
  },
];

/** 메뉴 항목이 현재 경로를 포함하는지 (하위 화면 /process/new 등도 해당 메뉴로) */
export const isNavActive = (href: string, pathname: string) => pathname === href || pathname.startsWith(href + "/");

export const pageTitle = (href: string) =>
  NAV.flatMap((g) => g.items).find((i) => i.href === href)?.title ?? "현장 안전관리";
