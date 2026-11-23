# 현장 안전관리 (Next.js)

건설현장 안전관리 시스템. 원본 단일 HTML(V18.2.3)을 Next.js App Router + Tailwind CSS로 다시 작성했습니다.
현재는 **프론트엔드만** 있고, 데이터는 브라우저 localStorage/IndexedDB에 저장됩니다(원본과 같은 키 → 기존 백업 파일 복원 가능).

```bash
npm run dev     # http://localhost:3000
npm run build
```

## 폴더 구조

```
src/
├─ app/
│  ├─ layout.tsx              # html/폰트/메타데이터
│  ├─ page.tsx                # / → /dashboard
│  └─ (site)/                 # 현장 화면 공통 레이아웃(상단바+사이드바)
│     ├─ layout.tsx
│     └─ <slug>/page.tsx      # 16개 화면 라우트 (얇은 껍데기 → features 렌더링)
├─ features/<slug>/           # 화면별 기능 모듈
│  ├─ types.ts                # 엔티티 타입·선택지 (저장 필드명 = 원본)
│  ├─ lib.ts | lib/           # 순수 계산·파싱 함수
│  ├─ components/             # 폼·표·모달
│  ├─ <slug>-page.tsx         # 화면 조립
│  └─ index.ts                # 공개 API (다른 화면은 여기서만 import)
├─ components/
│  ├─ ui/                     # Tailwind UI 키트 (Button, Field, Panel, DataTable, Modal, toast…)
│  ├─ data/                   # 일괄수정 바, 표로 수정 모달, 여러 건 등록 표
│  └─ layout/                 # AppShell, Sidebar, Topbar
├─ constants/                 # 메뉴(nav.ts), 층·공종 카탈로그, 공통 선택지
└─ lib/
   ├─ storage/                # 저장소 계층 (store, hooks, masters, site-info, file-db, keys)
   └─ *.ts                    # date, format, download, print, image, use-draft
```

| 메뉴 | 라우트 | feature |
|---|---|---|
| 종합 대시보드 | /dashboard | dashboard |
| 공정표 | /process | process |
| 작업계획서 관리 | /workplan | workplan |
| 작업일보 관리 | /workdiary | workdiary |
| 근로자·출역 관리 | /workforce | workforce |
| 층별·공종 관리 | /floors | floors |
| 견적·실행 관리 | /estimate | estimate |
| 작업허가 | /permit | permit |
| 안전교육 | /training | training |
| 안전점검 | /inspection | inspection |
| 위험성평가 | /risk | risk |
| 사고·아차사고 | /incident | incident |
| 개선조치 관리 | /actions | actions |
| 하자보수 관리 | /defects | defects |
| 일정관리·중요일정 | /schedule | schedule |
| 보고서 출력 | /reports | reports |
| (현장 관리·백업) | 상단바 현장명 클릭 | site |

## 백엔드를 붙일 때

모든 화면은 `src/lib/storage/hooks.ts`의 `useCollection` / `useList`와 `store.ts`의 `read` / `write`로만 데이터에 접근합니다.
이 계층을 API 호출(예: `app/api/<collection>/route.ts` + DB)로 바꾸면 화면 코드는 대부분 그대로 둘 수 있습니다.
컬렉션 이름은 `src/lib/storage/keys.ts`에 정리되어 있습니다.
