import { cn } from "@/lib/cn";
import type { OptionGroup } from "@/lib/storage/masters";
import type { ComponentProps, ReactNode } from "react";
import { CascadeSelect, FloorSelect } from "./cascade-select";

export const controlClass =
  "w-full rounded-[10px] border border-line bg-white px-[13px] py-[10px] text-sm text-fg shadow-xs transition placeholder:text-[#98a2b3] hover:border-[#d0d5dd] focus:border-brand focus:shadow-[0_0_0_2px_var(--color-brand-ring)] focus:outline-none disabled:bg-fill disabled:opacity-60";

export const compactControlClass =
  "w-full rounded-lg border border-line bg-white px-2.5 py-2 text-[13px] text-fg shadow-xs transition hover:border-[#d0d5dd] focus:border-brand focus:shadow-[0_0_0_2px_var(--color-brand-ring)] focus:outline-none";

export function Label({ children, required, className }: { children: ReactNode; required?: boolean; className?: string }) {
  return (
    <span className={cn("text-[13px] font-semibold text-fg-2", className)}>
      {children}
      {required && <span className="ml-0.5 text-danger">*</span>}
    </span>
  );
}

/** 라벨 + 입력 + 도움말 */
export function Field({
  label,
  required,
  hint,
  className,
  children,
}: {
  label?: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("mb-4 flex flex-col gap-1.5", className)}>
      {label && <Label required={required}>{label}</Label>}
      {children}
      {hint && <span className="text-xs text-sub">{hint}</span>}
    </label>
  );
}

export function Input({ className, compact, ...props }: ComponentProps<"input"> & { compact?: boolean }) {
  return <input className={cn(compact ? compactControlClass : controlClass, className)} {...props} />;
}

export function Textarea({ className, rows = 3, ...props }: ComponentProps<"textarea">) {
  return <textarea rows={rows} className={cn(controlClass, "resize-y", className)} {...props} />;
}

type SelectProps = ComponentProps<"select"> & {
  compact?: boolean;
  /** 단순 선택지 */
  options?: (string | { value: string; label: string })[];
  /** 그룹 선택지 (층·공종 등) */
  groups?: OptionGroup[];
  /** 맨 앞 빈 선택지 (예: "전체 공종") */
  placeholder?: string;
};

export function Select({ className, compact, options, groups, placeholder, children, ...props }: SelectProps) {
  // 묶음 선택지는 2단 선택(분류 → 항목). 표 안의 작은(compact) 선택 상자는 한 줄 그대로
  if (groups?.length && !compact && !options && !children) {
    // 층·구역은 지하/지상 층수를 숫자로 입력
    const Cascade = groups[0]?.kind === "floor" ? FloorSelect : CascadeSelect;
    return (
      <Cascade
        groups={groups}
        placeholder={placeholder}
        controlClassName={controlClass}
        className={className}
        {...(props as Omit<ComponentProps<"select">, "value" | "onChange">)}
        value={props.value as string | number | undefined}
        onChange={props.onChange}
      />
    );
  }
  const opt = (o: string | { value: string; label: string }) =>
    typeof o === "string" ? (
      <option key={o} value={o}>
        {o}
      </option>
    ) : (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    );
  return (
    <select className={cn(compact ? compactControlClass : controlClass, "cursor-pointer", className)} {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options?.map(opt)}
      {groups?.map((g) => (
        <optgroup key={g.label} label={g.label}>
          {g.options.map(opt)}
        </optgroup>
      ))}
      {groups && !groups.length && placeholder === undefined && (
        <option value="">층별·공종 관리에서 먼저 선택해 주세요</option>
      )}
      {children}
    </select>
  );
}

export function Checkbox({ label, className, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-fg-2", className)}>
      <input type="checkbox" className="size-4" {...props} />
      {label}
    </label>
  );
}

/** 2열 입력 그리드 (모바일 1열) */
export function FormGrid({ children, cols = 2, className }: { children: ReactNode; cols?: 2 | 3 | 4; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-4",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
