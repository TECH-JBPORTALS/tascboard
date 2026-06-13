import { BackToProjectButton } from '@/components/settings/back-to-project-button'
import { ProjectLabelsSettingsPage } from '@/components/settings/project-labels-settings-page'

export default async function SettingsProjectLabelsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-6">
      <BackToProjectButton projectId={projectId} />
      <ProjectLabelsSettingsPage />
    </div>
  )
}
