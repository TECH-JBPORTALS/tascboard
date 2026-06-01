export type EmployeeProfileSummary = {
  firstName: string | null
  lastName: string | null
  onboardingStatus: 'pending' | 'completed'
} | null

export function isEmployeeOnboarded(
  profile: { onboardingStatus: 'pending' | 'completed' } | null,
) {
  return profile?.onboardingStatus === 'completed'
}

export function getEmployeeDisplayName(input: {
  profile: { firstName: string | null; lastName: string | null } | null
  name: string
  email: string
}) {
  const profileName = [input.profile?.firstName, input.profile?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()
  return profileName || input.name.trim() || input.email
}
