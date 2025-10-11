// Project page - COMMENTED OUT to disable project feature
/*
import { ProjectView } from "@/app/p/[projectId]/project-view"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

type ProjectPageProps = {
  params: Promise<{ projectId: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params
  const supabase = await createClient()

  if (!supabase) {
    redirect("/auth")
  }

  const { data: authData } = await supabase.auth.getUser()

  if (!authData?.user?.id) {
    redirect("/auth")
  }

  // Verify the project belongs to the user
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", authData.user.id)
    .single()

  if (projectError || !project) {
    redirect("/")
  }

  return (
    <div className="flex h-screen w-full flex-col">
      <ProjectView projectId={projectId} key={projectId} />
    </div>
  )
}
*/

import { notFound } from "next/navigation"

export default function ProjectPage() {
  // Project feature is disabled
  notFound()
}
