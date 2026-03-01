import NextAuth from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: { host: 'smtp.resend.com', port: 465, auth: { user: 'resend', pass: process.env.RESEND_API_KEY! } },
      from: process.env.EMAIL_FROM || 'Just Add Water <noreply@jaw.wearesmc.co.uk>',
      sendVerificationRequest: async ({ identifier: email, url }) => {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'Just Add Water <noreply@jaw.wearesmc.co.uk>',
          to: email,
          subject: 'Sign in to Just Add Water 🛶',
          html: `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #0C4A6E; font-size: 24px; margin: 0;">Just Add Water</h1>
                <p style="color: #78716C; font-size: 14px; margin: 8px 0 0;">Your paddling group companion</p>
              </div>
              <div style="background: #FAFAF9; border-radius: 14px; padding: 32px; text-align: center;">
                <p style="color: #475569; font-size: 16px; margin: 0 0 24px;">
                  Click the button below to sign in. This link expires in 24 hours.
                </p>
                <a href="${url}" style="display: inline-block; background: #0C4A6E; color: #fff; font-weight: 600; font-size: 16px; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
                  Sign In
                </a>
              </div>
              <p style="color: #78716C; font-size: 12px; text-align: center; margin-top: 24px;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </div>
          `,
        })
      },
    }),
  ],
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/login/check-email',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
})
