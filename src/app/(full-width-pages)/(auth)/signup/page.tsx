import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Abidii Admin Dashboard",
  description: "Create an account on the Abidii Language Learning admin dashboard.",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
