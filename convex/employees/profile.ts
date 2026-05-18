/**
 * App-facing API for employee profile & certificate side entities.
 * Implementation lives in `convex/employeeProfiles.ts`.
 */
export {
  addCertificate,
  completeOnboarding,
  getMyOnboardingStatus,
  getMyProfile,
  removeCertificate,
  saveBankDetails,
  saveGeneralInfo,
  saveGovernmentId,
} from "../employeeProfiles";
