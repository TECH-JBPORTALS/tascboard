import { BackToProjectButton } from '@/components/settings/back-to-project-button'
import { ProjectGeneralSettingsPage } from '@/components/settings/project-general-settings-page'

export default async function SettingsProjectGeneralPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-6">
      <BackToProjectButton projectId={projectId} />
      <ProjectGeneralSettingsPage />
    </div>
  )
}
