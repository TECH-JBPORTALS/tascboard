import { GeneralSettingsPage } from '@/components/settings/general-settings-page'

export default async function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-6">
      <GeneralSettingsPage />
    </div>
  )
}
