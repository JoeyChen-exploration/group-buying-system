import nodemailer from "nodemailer";
import { SignJWT, jwtVerify } from "jose";

const VERIFY_SECRET = new TextEncoder().encode(
  (process.env.JWT_SECRET ?? "change-this-secret") + "-email-verify"
);

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

// ── Verification Token ────────────────────────────────────────────────────────

export async function signVerifyToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ userId, email, purpose: "email-verify" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(VERIFY_SECRET);
}

export async function verifyEmailToken(
  token: string
): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, VERIFY_SECRET);
    if (payload.purpose !== "email-verify") return null;
    return { userId: payload.userId as string, email: payload.email as string };
  } catch {
    return null;
  }
}

// ── Send Verification Email ───────────────────────────────────────────────────

export async function sendVerificationEmail(
  toEmail: string,
  name: string,
  token: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link = `${appUrl}/api/auth/verify-email?token=${token}`;

  const transport = createTransport();
  await transport.sendMail({
    from: `"悦味 Baking Studio" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "验证你的邮箱 — 悦味 Baking Studio",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">你好，${name}</h2>
        <p style="color:#555;margin-bottom:24px;line-height:1.6">
          感谢注册悦味 Baking Studio！请点击下方按钮验证你的邮箱地址，链接有效期 1 小时。
        </p>
        <a href="${link}"
           style="display:inline-block;background:#f43f5e;color:#fff;text-decoration:none;
                  padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">
          验证邮箱
        </a>
        <p style="margin-top:24px;font-size:12px;color:#999">
          如果你没有注册过悦味，请忽略此邮件。<br/>
          或复制以下链接到浏览器：<br/>
          <a href="${link}" style="color:#f43f5e;word-break:break-all">${link}</a>
        </p>
      </div>
    `,
  });
}
