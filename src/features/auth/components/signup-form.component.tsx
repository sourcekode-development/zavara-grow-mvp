import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useSignupFlow } from "../hooks/useSignupFlow"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { UserRole } from "@/shared/types"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const navigate = useNavigate()
  const {
    currentStep,
    signupForm,
    companyForm,
    isSubmitting,
    error,
    signupCheckResult,
    checkEmail,
    acceptInviteAndSignup,
    createCompanyAndSignup,
    resetFlow,
  } = useSignupFlow()

  // Step 1: Email check
  const handleEmailSubmit = signupForm.handleSubmit(async (data) => {
    await checkEmail(data.email)
  })

  // Step 2a: Accept invite flow
  const handleAcceptInvite = signupForm.handleSubmit(async (data) => {
    const success = await acceptInviteAndSignup(data)
    if (success) {
      toast.success("Account created successfully!")
      navigate("/dashboard")
    } else {
      // Check if it's an email confirmation message
      if (error?.includes("check your email")) {
        toast.info(error, { duration: 6000 })
        setTimeout(() => navigate("/login"), 3000)
      } else {
        toast.error(error || "Failed to create account")
      }
    }
  })

  // Step 2b: Create company flow
  const handleCreateCompany = async () => {
    const userData = signupForm.getValues()
    const companyData = companyForm.getValues()

    const success = await createCompanyAndSignup({
      company_name: companyData.company_name,
      user_data: userData,
    })

    if (success) {
      toast.success("Company and account created successfully!")
      navigate("/dashboard")
    } else {
      // Check if it's an email confirmation message
      if (error?.includes("check your email")) {
        toast.info(error, { duration: 6000 })
        // Show a confirmation message screen
        setTimeout(() => navigate("/login"), 3000)
      } else {
        toast.error(error || "Failed to create company")
      }
    }
  }

  // Render: User already has account
  if (currentStep === "has_account") {
    return (
      <Card {...props}>
        <CardHeader>
          <CardTitle>Account Already Exists</CardTitle>
          <CardDescription>
            You already have an account with this email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="rounded-lg border border-yellow-500 bg-yellow-500/10 p-4 text-sm">
              <p className="font-medium">Email: {signupForm.getValues("email")}</p>
              <p className="mt-2 text-muted-foreground">
                Please use the login page to access your account.
              </p>
            </div>
            <Field>
              <Button onClick={() => navigate("/login")} className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90">
                Go to Login
              </Button>
              <Button variant="outline" onClick={resetFlow}>
                Try Different Email
              </Button>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    )
  }

  // Render: User has invite
  if (currentStep === "has_invite" && signupCheckResult?.invite) {
    const invite = signupCheckResult.invite
    const roleLabel = invite.role === UserRole.COMPANY_ADMIN ? "Company Admin" : 
                      invite.role === UserRole.TEAM_LEAD ? "Team Lead" : "Developer"

    return (
      <Card {...props}>
        <CardHeader>
          <CardTitle>You&apos;ve Been Invited!</CardTitle>
          <CardDescription>
            Complete your account to join the team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAcceptInvite}>
            <FieldGroup>
              <div className="rounded-lg border border-[#3DCF8E] bg-[#3DCF8E]/10 p-4">
                <p className="font-medium">Invitation Details</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Company: <span className="font-medium text-foreground">{invite.company?.name}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Role: <span className="font-medium text-foreground">{roleLabel}</span>
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="John Doe"
                  {...signupForm.register("full_name")}
                />
                {signupForm.formState.errors.full_name && (
                  <p className="text-sm text-red-500">
                    {signupForm.formState.errors.full_name.message}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  {...signupForm.register("password")}
                />
                {signupForm.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {signupForm.formState.errors.password.message}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="confirm_password">Confirm Password</FieldLabel>
                <Input
                  id="confirm_password"
                  type="password"
                  {...signupForm.register("confirm_password")}
                />
                {signupForm.formState.errors.confirm_password && (
                  <p className="text-sm text-red-500">
                    {signupForm.formState.errors.confirm_password.message}
                  </p>
                )}
              </Field>

              <Field>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
                >
                  {isSubmitting ? "Creating Account..." : "Accept Invitation & Create Account"}
                </Button>
                <Button variant="outline" type="button" onClick={resetFlow}>
                  Cancel
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    )
  }

  // Render: Create company
  if (currentStep === "create_company") {
    return (
      <Card {...props}>
        <CardHeader>
          <CardTitle>Create Your Company</CardTitle>
          <CardDescription>
            Set up your company and admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="company_name">Company Name</FieldLabel>
              <Input
                id="company_name"
                type="text"
                placeholder="Acme Inc."
                {...companyForm.register("company_name")}
              />
              {companyForm.formState.errors.company_name && (
                <p className="text-sm text-red-500">
                  {companyForm.formState.errors.company_name.message}
                </p>
              )}
            </Field>

            <div className="rounded-lg border bg-muted p-4">
              <p className="text-sm font-medium">Your Account Details</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Name: {signupForm.getValues("full_name")}
              </p>
              <p className="text-sm text-muted-foreground">
                Email: {signupForm.getValues("email")}
              </p>
              <p className="text-sm text-muted-foreground">
                Role: Company Admin
              </p>
            </div>

            <Field>
              <Button
                onClick={handleCreateCompany}
                disabled={isSubmitting || !companyForm.formState.isValid}
                className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
              >
                {isSubmitting ? "Creating..." : "Create Company & Account"}
              </Button>
              <Button variant="outline" onClick={resetFlow}>
                Back
              </Button>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    )
  }

  // Render: Initial signup form (email check)
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEmailSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...signupForm.register("full_name")}
              />
              {signupForm.formState.errors.full_name && (
                <p className="text-sm text-red-500">
                  {signupForm.formState.errors.full_name.message}
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...signupForm.register("email")}
              />
              {signupForm.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {signupForm.formState.errors.email.message}
                </p>
              )}
              <FieldDescription>
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                {...signupForm.register("password")}
              />
              {signupForm.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {signupForm.formState.errors.password.message}
                </p>
              )}
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                {...signupForm.register("confirm_password")}
              />
              {signupForm.formState.errors.confirm_password && (
                <p className="text-sm text-red-500">
                  {signupForm.formState.errors.confirm_password.message}
                </p>
              )}
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
                >
                  {isSubmitting ? "Checking..." : "Continue"}
                </Button>
                <Button variant="outline" type="button" disabled>
                  Sign up with Google (Coming Soon)
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="underline underline-offset-4"
                  >
                    Sign in
                  </button>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
