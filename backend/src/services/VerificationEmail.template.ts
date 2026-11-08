import { appConfig } from "../config/index.config";

export const clientVerificationEmail = (name: string, token: string) => {
  const verifyUrl = `${appConfig.app.clientUrl}/verify/${token}`;
  const currentYear = new Date().getFullYear();

  const subject = "Confirm your email for DripForgeAI";

  const text = `Hey ${name},

Welcome to DripForgeAI.

Please confirm your email address to activate your account:
${verifyUrl}

If you didn’t create a DripForgeAI account, you can ignore this email.

— Richard from DripForgeAI
© ${currentYear} DripForgeAI
`;

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Confirm your email</title>
  </head>
  <body style="margin:0; padding:0; background:#ffffff;">
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="margin:0 0 12px; color:#111;">Hey ${name},</h2>

      <p style="margin:0 0 12px; color:#333;">Welcome to DripForgeAI.</p>

      <p style="margin:0 0 16px; color:#333;">
        Please confirm your email address to activate your account:
      </p>

      <p style="margin:0 0 18px;">
        <a
          href="${verifyUrl}"
          style="display:inline-block; padding:10px 16px; background:#007BFF; color:#fff; text-decoration:none; border-radius:4px; font-weight:600;"
          target="_blank"
          rel="noopener"
        >
          Confirm email
        </a>
      </p>

      <p style="margin:0 0 6px; color:#555; font-size:13px;">
        If the button doesn’t work, copy and paste this link into your browser:
      </p>
      <p style="margin:0 0 16px; color:#007BFF; font-size:13px; word-break:break-all;">
        <a href="${verifyUrl}" target="_blank" rel="noopener" style="color:#007BFF;">${verifyUrl}</a>
      </p>

      <p style="margin:0 0 16px; color:#666; font-size:13px;">
        If you didn’t create a DripForgeAI account, you can ignore this email.
      </p>

      <p style="margin:0; color:#333;">
        — Richard from DripForgeAI
      </p>

      <p style="margin:12px 0 0; color:#999; font-size:12px;">
        © ${currentYear} DripForgeAI • Copenhagen, Denmark
      </p>
    </div>
  </body>
</html>`;

  return { subject, html, text };
};
