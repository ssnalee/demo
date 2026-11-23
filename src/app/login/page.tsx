import { LoginForm } from "@/features/auth/login-form";

export const metadata = { title: "로그인" };

export default function Page() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <LoginForm />
    </main>
  );
}
