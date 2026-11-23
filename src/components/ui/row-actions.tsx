import { Button } from "./button";

/** 표 마지막 열의 수정 / 출력 / 삭제 버튼 */
export function RowActions({
  onEdit,
  onPrint,
  onDelete,
  children,
  nowrap,
}: {
  onEdit?: () => void;
  onPrint?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
  /** 버튼을 한 줄로 유지 (줄바꿈 없음) */
  nowrap?: boolean;
}) {
  return (
    <div className={nowrap ? "no-print flex flex-nowrap gap-1 whitespace-nowrap" : "no-print flex flex-wrap gap-1"}>
      {onEdit && (
        <Button size="sm" onClick={onEdit}>
          수정
        </Button>
      )}
      {onPrint && (
        <Button size="sm" onClick={onPrint}>
          출력
        </Button>
      )}
      {children}
      {onDelete && (
        <Button size="sm" variant="danger" onClick={onDelete}>
          삭제
        </Button>
      )}
    </div>
  );
}

/** 폼으로 부드럽게 스크롤 */
export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
