// src/shared/email/transport.ts
import nodemailer from 'nodemailer';

// Cria uma conta de teste no Ethereal (para desenvolvimento)
const createTestAccount = async () => {
  const testAccount = await nodemailer.createTestAccount();
  return testAccount;
};

export const createTransport = async () => {
  if (process.env.NODE_ENV === 'production') {
    // Use SMTP real (ex: SendGrid, Mailgun, Gmail)
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Desenvolvimento: usa Ethereal (visualize os e-mails no console)
  const testAccount = await createTestAccount();
  console.info('📧 Conta de teste Ethereal criada:', testAccount.user);
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};
