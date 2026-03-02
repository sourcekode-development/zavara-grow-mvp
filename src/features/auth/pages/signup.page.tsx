import { SignupForm } from "../components/signup-form.component";

export const SignupPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] dark:bg-[#11181C] p-4">
      <div className="w-full max-w-md">
        <SignupForm />
      </div>
    </div>
  );
};
