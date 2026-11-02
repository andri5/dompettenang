/**
 * Email / SMTP service (Nodemailer)
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { config } from '../config/index.js';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!config.smtp.enabled) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }

  return transporter;
}

export function isSmtpConfigured(): boolean {
  return Boolean(
    config.smtp.enabled &&
      config.smtp.host &&
      config.smtp.user &&
      config.smtp.pass
  );
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  const tx = getTransporter();
  if (!tx) {
    throw new Error('SMTP is not configured');
  }

  const { to, name, resetUrl } = params;
  const safeName = name || 'Pengguna';

  const text = [
    `Halo ${safeName},`,
    '',
    'Kami menerima permintaan reset password untuk akun Dompet Tenang kamu.',
    'Buka tautan berikut (berlaku 1 jam):',
    resetUrl,
    '',
    'Jika kamu tidak meminta reset, abaikan email ini.',
    '',
    '— Tim Dompet Tenang',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border:1px solid #d7e0ea;border-radius:20px;padding:28px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">Dompet Tenang</p>
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">Reset password</h1>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#475569;">
                Halo <strong>${escapeHtml(safeName)}</strong>, kami menerima permintaan untuk mengatur ulang password akunmu.
              </p>
              <p style="margin:0 0 20px;">
                <a href="${escapeHtml(resetUrl)}"
                   style="display:inline-block;background:#0f9b8e;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:600;font-size:14px;">
                  Atur password baru
                </a>
              </p>
              <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#64748b;">
                Tautan berlaku 1 jam. Jika tombol tidak berfungsi, salin URL ini:
              </p>
              <p style="margin:0 0 16px;font-size:12px;word-break:break-all;color:#0f9b8e;">${escapeHtml(resetUrl)}</p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                Jika kamu tidak meminta ini, abaikan email ini. Password tidak akan berubah.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const info = await tx.sendMail({
    from: config.smtp.from,
    to,
    subject: 'Reset password Dompet Tenang',
    text,
    html,
  });

  console.log(
    `[password-reset] email accepted by SMTP host=${config.smtp.host} messageId=${info.messageId || '-'}`
  );
}

export async function sendProProofSubmittedEmail(params: {
  to: string[];
  buyerName: string;
  buyerEmail: string;
  amount: number;
  transferNote: string;
  reviewUrl: string;
}): Promise<void> {
  const recipients = params.to.map((address) => address.trim()).filter(Boolean);
  if (recipients.length === 0) return;

  const amountLabel = formatIdr(params.amount);
  const text = [
    'Ada bukti transfer Pro baru.',
    '',
    `Nama: ${params.buyerName}`,
    `Email: ${params.buyerEmail}`,
    `Nominal: ${amountLabel}`,
    `Kode: ${params.transferNote}`,
    '',
    `Periksa di: ${params.reviewUrl}`,
  ].join('\n');

  const html = layoutEmail({
    title: 'Bukti transfer Pro baru',
    body: `
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#475569;">
        Seorang pengguna mengunggah bukti transfer. Cocokkan nominal dan kode di mutasi rekening.
      </p>
      ${detailRow('Nama', params.buyerName)}
      ${detailRow('Email', params.buyerEmail)}
      ${detailRow('Nominal', amountLabel)}
      ${detailRow('Kode', params.transferNote)}
      <p style="margin:20px 0 0;">
        <a href="${escapeHtml(params.reviewUrl)}"
           style="display:inline-block;background:#0f9b8e;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:600;font-size:14px;">
          Buka antrian Pro
        </a>
      </p>`,
  });

  await deliver({
    to: recipients,
    subject: `Bukti transfer Pro — ${params.transferNote}`,
    text,
    html,
    logLabel: 'proof-submitted',
  });
}

export async function sendProApprovedEmail(params: {
  to: string;
  name: string;
  amount: number;
  transferNote: string;
  appUrl: string;
}): Promise<void> {
  const safeName = params.name || 'Pengguna';
  const amountLabel = formatIdr(params.amount);
  const text = [
    `Halo ${safeName},`,
    '',
    `Pembayaran Pro Lifetime ${amountLabel} dengan kode ${params.transferNote} sudah disetujui.`,
    'Akunmu sekarang Pro.',
    '',
    params.appUrl,
  ].join('\n');

  const html = layoutEmail({
    title: 'Pro sudah aktif',
    body: `
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#475569;">
        Halo <strong>${escapeHtml(safeName)}</strong>, pembayaran Pro Lifetime
        <strong>${escapeHtml(amountLabel)}</strong> dengan kode
        <strong>${escapeHtml(params.transferNote)}</strong> sudah disetujui.
        Akunmu sekarang Pro.
      </p>
      <p style="margin:0;">
        <a href="${escapeHtml(params.appUrl)}"
           style="display:inline-block;background:#0f9b8e;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:600;font-size:14px;">
          Buka Dompet Tenang
        </a>
      </p>`,
  });

  await deliver({
    to: params.to,
    subject: 'Pro Dompet Tenang sudah aktif',
    text,
    html,
    logLabel: 'pro-approved',
  });
}

export async function sendProRejectedEmail(params: {
  to: string;
  name: string;
  amount: number;
  transferNote: string;
  adminNote: string;
  appUrl: string;
}): Promise<void> {
  const safeName = params.name || 'Pengguna';
  const amountLabel = formatIdr(params.amount);
  const text = [
    `Halo ${safeName},`,
    '',
    `Permintaan Pro Lifetime ${amountLabel} dengan kode ${params.transferNote} ditolak.`,
    `Alasan: ${params.adminNote}`,
    '',
    'Kamu bisa mengajukan lagi dari halaman upgrade.',
    params.appUrl,
  ].join('\n');

  const html = layoutEmail({
    title: 'Pembayaran Pro ditolak',
    body: `
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#475569;">
        Halo <strong>${escapeHtml(safeName)}</strong>, permintaan Pro Lifetime
        <strong>${escapeHtml(amountLabel)}</strong> dengan kode
        <strong>${escapeHtml(params.transferNote)}</strong> ditolak.
      </p>
      ${detailRow('Alasan', params.adminNote)}
      <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#475569;">
        Kamu bisa mengajukan lagi dari halaman upgrade.
      </p>`,
  });

  await deliver({
    to: params.to,
    subject: 'Pembayaran Pro Dompet Tenang ditolak',
    text,
    html,
    logLabel: 'pro-rejected',
  });
}

async function deliver(params: {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  logLabel: string;
}): Promise<void> {
  const tx = getTransporter();
  if (!tx) {
    throw new Error('SMTP is not configured');
  }

  const info = await tx.sendMail({
    from: config.smtp.from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
  });

  console.log(`[billing-email] ${params.logLabel} messageId=${info.messageId || '-'}`);
}

function formatIdr(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function layoutEmail(params: { title: string; body: string }): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border:1px solid #d7e0ea;border-radius:20px;padding:28px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;">Dompet Tenang</p>
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">${escapeHtml(params.title)}</h1>
              ${params.body}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailRow(label: string, value: string): string {
  return `<p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:#334155;"><span style="color:#64748b;">${escapeHtml(label)}</span><br><strong>${escapeHtml(value)}</strong></p>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
