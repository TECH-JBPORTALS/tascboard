import { v } from 'convex/values'
import { components, internal } from './_generated/api'
import { action, internalMutation } from './_generated/server'

export const SEED_DEV_PASSWORD = 'Test@1234'

const SEED_USERS = [
  {
    name: 'Arjun Mehta',
    email: 'arjun.mehta+test@resend.dev',
    firstName: 'Arjun',
    lastName: 'Mehta',
    sex: 'male' as const,
    dateOfBirth: '1990-03-15',
    address: '42 MG Road, Bengaluru, Karnataka 560001',
    aadharNumber: '2345-6789-0123',
    panNumber: 'ABCPM1234A',
    bankAccountNumber: '50123456789012',
    bankName: 'HDFC Bank',
    ifscCode: 'HDFC0001234',
    branchName: 'MG Road Branch',
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma+test@resend.dev',
    firstName: 'Priya',
    lastName: 'Sharma',
    sex: 'female' as const,
    dateOfBirth: '1992-07-22',
    address: '18 Connaught Place, New Delhi, Delhi 110001',
    aadharNumber: '3456-7890-1234',
    panNumber: 'BDKPS5678B',
    bankAccountNumber: '60234567890123',
    bankName: 'ICICI Bank',
    ifscCode: 'ICIC0002345',
    branchName: 'Connaught Place Branch',
  },
  {
    name: 'Rahul Gupta',
    email: 'rahul.gupta+test@resend.dev',
    firstName: 'Rahul',
    lastName: 'Gupta',
    sex: 'male' as const,
    dateOfBirth: '1988-11-08',
    address: '7 Park Street, Kolkata, West Bengal 700016',
    aadharNumber: '4567-8901-2345',
    panNumber: 'CFGPG9012C',
    bankAccountNumber: '70345678901234',
    bankName: 'State Bank of India',
    ifscCode: 'SBIN0003456',
    branchName: 'Park Street Branch',
  },
  {
    name: 'Ananya Reddy',
    email: 'ananya.reddy+test@resend.dev',
    firstName: 'Ananya',
    lastName: 'Reddy',
    sex: 'female' as const,
    dateOfBirth: '1995-01-30',
    address: '23 Banjara Hills, Hyderabad, Telangana 500034',
    aadharNumber: '5678-9012-3456',
    panNumber: 'DHKPR3456D',
    bankAccountNumber: '80456789012345',
    bankName: 'Axis Bank',
    ifscCode: 'UTIB0004567',
    branchName: 'Banjara Hills Branch',
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh+test@resend.dev',
    firstName: 'Vikram',
    lastName: 'Singh',
    sex: 'male' as const,
    dateOfBirth: '1987-05-18',
    address: '56 Civil Lines, Jaipur, Rajasthan 302006',
    aadharNumber: '6789-0123-4567',
    panNumber: 'EJLVS7890E',
    bankAccountNumber: '90567890123456',
    bankName: 'Punjab National Bank',
    ifscCode: 'PUNB0005678',
    branchName: 'Civil Lines Branch',
  },
  {
    name: 'Kavita Nair',
    email: 'kavita.nair+test@resend.dev',
    firstName: 'Kavita',
    lastName: 'Nair',
    sex: 'female' as const,
    dateOfBirth: '1993-09-12',
    address: '12 Marine Drive, Kochi, Kerala 682031',
    aadharNumber: '7890-1234-5678',
    panNumber: 'FKMPN2345F',
    bankAccountNumber: '10678901234567',
    bankName: 'Federal Bank',
    ifscCode: 'FDRL0006789',
    branchName: 'Marine Drive Branch',
  },
  {
    name: 'Rohan Desai',
    email: 'rohan.desai+test@resend.dev',
    firstName: 'Rohan',
    lastName: 'Desai',
    sex: 'male' as const,
    dateOfBirth: '1991-12-03',
    address: '89 FC Road, Pune, Maharashtra 411004',
    aadharNumber: '8901-2345-6789',
    panNumber: 'GLQRD6789G',
    bankAccountNumber: '20789012345678',
    bankName: 'Kotak Mahindra Bank',
    ifscCode: 'KKBK0007890',
    branchName: 'FC Road Branch',
  },
  {
    name: 'Meera Iyer',
    email: 'meera.iyer+test@resend.dev',
    firstName: 'Meera',
    lastName: 'Iyer',
    sex: 'female' as const,
    dateOfBirth: '1994-04-27',
    address: '34 Adyar, Chennai, Tamil Nadu 600020',
    aadharNumber: '9012-3456-7890',
    panNumber: 'HMNSI0123H',
    bankAccountNumber: '30890123456789',
    bankName: 'Indian Bank',
    ifscCode: 'IDIB0008901',
    branchName: 'Adyar Branch',
  },
  {
    name: 'Sanjay Patel',
    email: 'sanjay.patel+test@resend.dev',
    firstName: 'Sanjay',
    lastName: 'Patel',
    sex: 'male' as const,
    dateOfBirth: '1989-08-14',
    address: '61 CG Road, Ahmedabad, Gujarat 380009',
    aadharNumber: '0123-4567-8901',
    panNumber: 'IJLTP4567I',
    bankAccountNumber: '40901234567890',
    bankName: 'Bank of Baroda',
    ifscCode: 'BARB0009012',
    branchName: 'CG Road Branch',
  },
  {
    name: 'Divya Krishnan',
    email: 'divya.krishnan+test@resend.dev',
    firstName: 'Divya',
    lastName: 'Krishnan',
    sex: 'female' as const,
    dateOfBirth: '1996-06-09',
    address: '5 Anna Salai, Chennai, Tamil Nadu 600002',
    aadharNumber: '1234-5678-9012',
    panNumber: 'JKMND8901J',
    bankAccountNumber: '51012345678901',
    bankName: 'Canara Bank',
    ifscCode: 'CNRB0010123',
    branchName: 'Anna Salai Branch',
  },
] as const

const SEED_ORGANIZATIONS = [
  { name: 'Tascboard India', slug: 'tascboard-india', ownerIndex: 0 },
  { name: 'NexGen Works', slug: 'nexgen-works', ownerIndex: 1 },
] as const

export const organization = internalMutation({
  args: { userIds: v.array(v.string()), orgIds: v.array(v.string()) },
  returns: v.object({ profileCount: v.number(), employeeCount: v.number() }),
  async handler(ctx, { userIds, orgIds }) {
    let employeeCount = 0
    let profileCount = 0

    // Add employees to the organization
    for (let orgIndex = 0; orgIndex < SEED_ORGANIZATIONS.length; orgIndex++) {
      const org = SEED_ORGANIZATIONS[orgIndex]

      const organizationId = orgIds[orgIndex]

      if (!organizationId) throw new Error('Organization seed failed')

      for (let userIndex = 0; userIndex < userIds.length; userIndex++) {
        const userId = userIds[userIndex]
        const seedUser = SEED_USERS[userIndex]
        if (!userId || !seedUser) throw new Error('User seed failed')

        const role = userIndex === org.ownerIndex ? 'owner' : 'employee'
        const employeeId = await ctx.runMutation(
          components.betterAuth.employees.create,
          {
            organizationId,
            userId,
            role,
          },
        )

        employeeCount += 1

        const existing = await ctx.db
          .query('employeeProfiles')
          .withIndex('by_employee', (q) => q.eq('employeeId', employeeId))
          .unique()

        if (!existing) {
          await ctx.db.insert('employeeProfiles', {
            employeeId,
            firstName: seedUser.firstName,
            lastName: seedUser.lastName,
            dateOfBirth: seedUser.dateOfBirth,
            address: seedUser.address,
            aadharNumber: seedUser.aadharNumber,
            panNumber: seedUser.panNumber,
            bankAccountNumber: seedUser.bankAccountNumber,
            bankName: seedUser.bankName,
            ifscCode: seedUser.ifscCode,
            branchName: seedUser.branchName,
            onboardingStatus: 'completed',
            onboardingStep: 4,
          })
          profileCount += 1
        }
      }
    }

    return {
      profileCount,
      employeeCount,
    }
  },
})

export const organizationUsers = action({
  args: {},
  returns: v.object({
    organizations: v.array(
      v.object({ id: v.string(), name: v.string(), slug: v.string() }),
    ),
    users: v.array(
      v.object({ id: v.string(), name: v.string(), email: v.string() }),
    ),
  }),
  handler: async (ctx) => {
    await ctx.runMutation(components.betterAuth.users.resetAuthData, {})

    const users: Array<{ id: string; name: string; email: string }> = []
    const userIds: string[] = []

    for (const seedUser of SEED_USERS) {
      const account = await ctx.runAction(internal.auth.createAccount, {
        email: seedUser.email,
        password: SEED_DEV_PASSWORD,
        name: seedUser.name,
      })

      userIds.push(account.user.id)

      users.push({
        id: account.user.id,
        name: seedUser.name,
        email: seedUser.email,
      })
    }

    const organizations: Array<{ id: string; name: string; slug: string }> = []
    const orgIds: string[] = []

    for (const org of SEED_ORGANIZATIONS) {
      const orgId = await ctx.runMutation(
        components.betterAuth.users.createOrganization,
        {
          name: org.name,
          slug: org.slug,
        },
      )
      orgIds.push(orgId)
      organizations.push({ id: orgId, name: org.name, slug: org.slug })
    }

    await ctx.runMutation(internal.seed.organization, {
      userIds,
      orgIds,
    })

    return {
      organizations,
      users,
    }
  },
})
