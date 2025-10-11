import { redirect } from "next/navigation"

export default function CreditsPage() {
  // Redirect to account page billing section
  redirect("/account?section=billing")
}