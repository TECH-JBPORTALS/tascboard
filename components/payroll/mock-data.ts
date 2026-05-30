import type { PayrollRecord } from '@/lib/payroll-types'
import {
  MOCK_PAYROLL_FEB,
  MOCK_PAYROLL_JAN,
  MOCK_PAYROLL_MAR,
} from './mock-data-extra'

export const MOCK_PAYROLL: PayrollRecord[] = [
  ...MOCK_PAYROLL_JAN,
  ...MOCK_PAYROLL_FEB,
  ...MOCK_PAYROLL_MAR,
]
