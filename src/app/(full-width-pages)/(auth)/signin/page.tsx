import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Abidii Admin Dashboard",
  description: "Sign in to the Abidii Language Learning admin dashboard.",
};

export default function SignIn() {
  return <SignInForm />;
}
