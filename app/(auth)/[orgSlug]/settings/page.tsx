import { DeleteOrganizationSection } from '@/components/organization/DeleteOrganizationSection'
import { OrganizationSettingsForm } from '@/components/organization/OrganizationSettingsForm'

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col py-6 gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your organization and workspace preferences.
        </p>
      </div>
      <OrganizationSettingsForm />
      <DeleteOrganizationSection />
    </div>
  )
}
