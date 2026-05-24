import nodemailer from "nodemailer";

// ── SMTP Transport ────────────────────────────────────────────────────────────

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ── OTP ───────────────────────────────────────────────────────────────────────

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function otpExpiresAt(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 10); // 10-minute expiry
  return d;
}

// ── Send Verification Code ────────────────────────────────────────────────────

export async function sendVerificationCode(
  toEmail: string,
  name: string,
  code: string
): Promise<void> {
  const transport = createTransport();
  await transport.sendMail({
    from: `"悦味 Baking Studio" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `${code} 是你的验证码 — 悦味 Baking Studio`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">你好，${name}</h2>
        <p style="color:#555;margin-bottom:24px;line-height:1.6">
          请使用以下验证码完成邮箱验证，验证码 <strong>10 分钟</strong>内有效。
        </p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;
                    padding:24px;text-align:center;margin-bottom:24px">
          <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#f43f5e">
            ${code}
          </span>
        </div>
        <p style="font-size:12px;color:#999">
          如果你没有注册过悦味，请忽略此邮件。
        </p>
      </div>
    `,
  });
}
