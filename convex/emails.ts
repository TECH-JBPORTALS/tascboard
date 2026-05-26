import { Resend } from '@convex-dev/resend'
import { v } from 'convex/values'
import { components, internal } from './_generated/api'
import { internalAction, internalMutation } from './_generated/server'

export const resend = new Resend(components.resend, {
  testMode: process.env.NODE_ENV === 'development',
})

export const sendInvitationEmail = internalMutation({
  args: {
    email: v.string(),
    organizationName: v.string(),
    inviterName: v.string(),
    invitationId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const siteUrl = process.env.SITE_URL ?? 'http://localhost:3000'
    const inviteLink = `${siteUrl}/accept-invitation/${args.invitationId}`
    const displayName = args.email.split('@')[0] || args.email

    await resend.sendEmail(ctx, {
      from:
        process.env.RESEND_FROM_EMAIL ?? 'Tascboard <onboarding@resend.dev>',
      to: args.email,
      subject: `You're invited to join ${args.organizationName} on Tascboard`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto;">
          <h1 style="font-size: 20px; margin-bottom: 8px;">Join ${args.organizationName}</h1>
          <p style="color: #444; line-height: 1.5;">
            Hi ${displayName}, ${args.inviterName} invited you to join <strong>${args.organizationName}</strong> on Tascboard.
          </p>
          <p style="margin: 24px 0;">
            <a href="${inviteLink}" style="background: #4f46e5; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; display: inline-block;">
              Accept invitation
            </a>
          </p>
          <p style="color: #666; font-size: 13px;">
            If the button does not work, copy this link:<br />
            <a href="${inviteLink}">${inviteLink}</a>
          </p>
        </div>
      `,
    })

    return null
  },
})

export const processInvitationEmail = internalAction({
  args: {
    organizationId: v.string(),
    email: v.string(),
    invitationId: v.string(),
    organizationName: v.string(),
    inviterName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.emails.sendInvitationEmail, {
      email: args.email,
      organizationName: args.organizationName,
      inviterName: args.inviterName,
      invitationId: args.invitationId,
    })

    return null
  },
})
