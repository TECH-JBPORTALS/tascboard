import { v } from 'convex/values'
import { authComponent, createAuth } from './auth'
import { organizationMutation, organizationQuery } from './lib/customFunctions'

type OrganizationMetadata = {
  address: string
  imageStorageId?: string
}

function parseOrganizationMetadata(metadata: unknown): OrganizationMetadata {
  if (!metadata) {
    return { address: '' }
  }

  let raw: Record<string, unknown>
  try {
    raw =
      typeof metadata === 'string'
        ? (JSON.parse(metadata) as Record<string, unknown>)
        : (metadata as Record<string, unknown>)
  } catch {
    return { address: '' }
  }

  return {
    address: typeof raw.address === 'string' ? raw.address : '',
    imageStorageId:
      typeof raw.imageStorageId === 'string' ? raw.imageStorageId : undefined,
  }
}

function buildOrganizationMetadata(data: OrganizationMetadata) {
  return {
    address: data.address.trim(),
    ...(data.imageStorageId ? { imageStorageId: data.imageStorageId } : {}),
  }
}

export const getSettings = organizationQuery({
  args: {},
  returns: v.object({
    id: v.string(),
    name: v.string(),
    slug: v.string(),
    address: v.string(),
    imageStorageId: v.optional(v.string()),
  }),
  handler: async (ctx) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)
    const organization = await auth.api.getFullOrganization({ headers })

    if (!organization) {
      throw new Error('Organization not found')
    }

    const metadata = parseOrganizationMetadata(organization.metadata)

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      address: metadata.address,
      imageStorageId: metadata.imageStorageId,
    }
  },
})

export const updateSettings = organizationMutation({
  args: {
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    imageStorageId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (ctx.session.employee.role !== 'owner') {
      throw new Error('Only organization owners can update settings')
    }

    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)
    const organization = await auth.api.getFullOrganization({ headers })

    if (!organization) {
      throw new Error('Organization not found')
    }

    const currentMetadata = parseOrganizationMetadata(organization.metadata)
    const data: {
      name?: string
      metadata: ReturnType<typeof buildOrganizationMetadata>
    } = {
      metadata: buildOrganizationMetadata({
        address: args.address ?? currentMetadata.address,
        imageStorageId: args.imageStorageId ?? currentMetadata.imageStorageId,
      }),
    }

    if (args.name !== undefined) {
      const trimmedName = args.name.trim()
      if (!trimmedName) {
        throw new Error('Organization name is required')
      }
      data.name = trimmedName
    }

    await auth.api.updateOrganization({
      headers,
      body: {
        organizationId: organization.id,
        data,
      },
    })

    return null
  },
})
