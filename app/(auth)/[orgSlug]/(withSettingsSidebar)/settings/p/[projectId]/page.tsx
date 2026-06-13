import { ProjectSettingsPage } from '@/components/settings/project-settings-page'

export default async function SettingsProjectPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-6">
      <ProjectSettingsPage />
    </div>
  )
}
