import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "현장 안전관리", template: "%s · 현장 안전관리" },
  description: "건설현장 통합 안전관리 시스템",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
