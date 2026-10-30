// src/shared/auth/auth.ts
import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db } from '../db/index.js';
import * as schema from '../db/schema/auth.js';
import { createTransport } from '../email/transport.js';

const transport = await createTransport();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({
      user,
      url,
    }: {
      user: { email: string; name: string };
      url: string;
    }) => {
      await transport.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@luanarohr.art',
        to: user.email,
        subject: 'Redefinir senha - Luana Rohr Art',
        html: `<p>Olá ${user.name}, clique <a href="${url}">aqui</a> para redefinir sua senha.</p>`,
      });
    },
  },
  trustedOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    'http://localhost:4173', // ✅ Vite preview
    'http://127.0.0.1:41705', // ✅ Browser proxy
  ],
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 dias
    updateAge: 15 * 24 * 60 * 60, // 15 dias
    cookie: {
      attributes: {
        sameSite: 'none',
        secure: true,
        httpOnly: true,
        domain: undefined, // deixa o Better Auth decidir
      },
    },
  },
  plugins: [
    bearer({
      // Opcional: requerer assinatura do token (mais seguro)
      requireSignature: false,
    }),
  ],
  logger: {
    disabled: false,
    disableColors: false,
    level: 'debug',
    log: (level, message, ...args) => {
      console.info(`[${level}] ${message}`, ...args);
    },
  },
});
