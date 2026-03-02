import { LoginForm } from "../components/login-form.component";

export const LoginPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] dark:bg-[#11181C] p-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
};
