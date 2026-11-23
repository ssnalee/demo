/**
 * Supabase public 스키마 타입 (supabase/migrations 와 같은 구조).
 * Supabase CLI 를 쓰게 되면 `supabase gen types typescript --linked > src/server/database.types.ts` 로 자동 생성해 교체.
 */

export type SiteStatus = "active" | "done";
export type SystemRole = "admin" | "user";
export type UserStatus = "active" | "suspended" | "withdrawn";
/** site_manager 현장소장 · safety_manager 안전관리자 · engineer 공사담당자 · foreman 작업반장 · worker 근로자 */
export type SiteRole = "site_manager" | "safety_manager" | "engineer" | "foreman" | "worker";
export type ProcessStage =
  | "준비·자재반입"
  | "철거"
  | "먹매김"
  | "설치"
  | "1차 시공"
  | "2차 시공"
  | "마감"
  | "검측·확인"
  | "보수·정리";

export type WorkplanType = "일일 작업" | "주간 작업" | "공정 변경 작업" | "긴급·수시 작업";
export type WorkplanStatus = "작성중" | "검토요청" | "승인" | "작업완료" | "보류";

export type Database = {
  public: {
    Tables: {
      sites: {
        Row: {
          id: string;
          name: string;
          construction_type: string | null;
          manager_id: string | null;
          basement_floors: number;
          above_floors: number | null;
          start_date: string | null;
          end_date: string | null;
          address: string | null;
          status: SiteStatus;
          completed_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          construction_type?: string | null;
          manager_id?: string | null;
          basement_floors?: number;
          above_floors?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          address?: string | null;
          status?: SiteStatus;
          completed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["sites"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          username: string;
          name: string;
          phone: string | null;
          company_name: string | null;
          system_role: SystemRole;
          status: UserStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          name: string;
          phone?: string | null;
          company_name?: string | null;
          system_role?: SystemRole;
          status?: UserStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      site_members: {
        Row: {
          site_id: string;
          user_id: string;
          role: SiteRole;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          site_id: string;
          user_id: string;
          role: SiteRole;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["site_members"]["Insert"]>;
        Relationships: [];
      };
      processes: {
        Row: {
          id: string;
          site_id: string;
          trade: string;
          floor: string;
          stage: ProcessStage | null;
          /** 층 + 공종 + 작업 단계 (DB 자동 계산, 쓰기 불가) */
          title: string;
          company_name: string | null;
          start_date: string;
          end_date: string;
          progress: number;
          predecessor_process_id: string | null;
          predecessor_trade: string | null;
          note: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          trade: string;
          floor: string;
          stage?: ProcessStage | null;
          company_name?: string | null;
          start_date: string;
          end_date: string;
          progress?: number;
          predecessor_process_id?: string | null;
          predecessor_trade?: string | null;
          note?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["processes"]["Insert"]>;
        Relationships: [];
      };
      workplans: {
        Row: {
          id: string;
          site_id: string;
          work_date: string;
          work_type: WorkplanType;
          floor: string;
          trade: string;
          title: string;
          location: string | null;
          leader_name: string | null;
          worker_count: number;
          /** "HH:MM:SS" */
          start_time: string | null;
          end_time: string | null;
          equipment: string | null;
          materials: string | null;
          scope: string | null;
          sequence: string | null;
          hazards: string | null;
          safety_measures: string | null;
          emergency: string | null;
          status: WorkplanStatus;
          reviewer_name: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          work_date: string;
          work_type?: WorkplanType;
          floor: string;
          trade: string;
          title: string;
          location?: string | null;
          leader_name?: string | null;
          worker_count?: number;
          start_time?: string | null;
          end_time?: string | null;
          equipment?: string | null;
          materials?: string | null;
          scope?: string | null;
          sequence?: string | null;
          hazards?: string | null;
          safety_measures?: string | null;
          emergency?: string | null;
          status?: WorkplanStatus;
          reviewer_name?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workplans"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicTables = Database["public"]["Tables"];
export type Tables<T extends keyof PublicTables> = PublicTables[T]["Row"];
export type TablesInsert<T extends keyof PublicTables> = PublicTables[T]["Insert"];
export type TablesUpdate<T extends keyof PublicTables> = PublicTables[T]["Update"];
