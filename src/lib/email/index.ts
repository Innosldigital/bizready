// src/lib/email/index.ts
import { Resend } from 'resend'
import type { LendabilityResult, BankTheme, Business } from '@/types'
import {
  classificationLabel,
  classificationColour,
  getBankRecommendationText,
  getSMEFeedbackText,
} from '@/lib/scoring/engine'

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not defined in environment variables')
  return new Resend(process.env.RESEND_API_KEY)
}
const FROM     = process.env.RESEND_FROM_EMAIL || 'diagnostics@bizready.io'
const REPLY_TO = process.env.RESEND_REPLY_TO   || 'support@bizready.io'

// ── DIAGNOSTIC RESULT EMAIL (to SME) ─────────────────────
export async function sendDiagnosticResultEmail(params: {
  business: any // Use any to avoid Mongoose document conflicts in API routes
  result:   LendabilityResult
  theme:    BankTheme
  period:   string
}) {
  const { business, result, theme, period } = params
  const cls     = classificationLabel(result.classification)
  const colour  = classificationColour(result.classification)
  const colBg   = result.classification === 'investment_ready' ? '#E1F5EE'
                : result.classification === 'conditionally_lendable' ? '#FAEEDA' : '#FCEBEB'

  const taItems = result.taRecommendations.slice(0, 4).map(ta => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0">
        <div style="font-size:13px;font-weight:500;color:#1A1A2E;margin-bottom:4px">${ta.area}</div>
        <div style="font-size:12px;color:#666;line-height:1.6">${ta.recommendation}</div>
        <div style="font-size:11px;color:#999;margin-top:4px">
          Tools: ${ta.tools.join(', ')} &nbsp;|&nbsp; Timeframe: ${ta.timeframeWeeks} weeks
        </div>
      </td>
    </tr>
  `).join('')

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Your BizReady Diagnostic Results</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

  <!-- Header -->
  <tr><td style="background:${theme.primary};border-radius:12px 12px 0 0;padding:28px 32px;text-align:center">
    <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.8px">Investment readiness diagnostic results</p>
    <h1 style="margin:0;font-size:22px;font-weight:500;color:#ffffff">${business.name}</h1>
    <p style="margin:8px 0 0;font-size:12px;color:rgba(255,255,255,0.65)">Period: ${period} &nbsp;·&nbsp; Powered by BizReady · ${theme.bankName}</p>
  </td></tr>

  <!-- Score banner -->
  <tr><td style="background:${colBg};padding:28px 32px;text-align:center;border-bottom:3px solid ${colour}">
    <p style="margin:0 0 6px;font-size:12px;color:${colour};font-weight:500;text-transform:uppercase">Your investment readiness index score</p>
    <p style="margin:0;font-size:56px;font-weight:bold;color:${colour};line-height:1">${result.lendabilityIndex}%</p>
    <p style="margin:8px 0 0;font-size:18px;font-weight:500;color:${colour}">${cls}</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#ffffff;padding:28px 32px">
    <p style="font-size:14px;color:#444;line-height:1.7;margin:0 0 20px">${getSMEFeedbackText(result.lendabilityIndex, result.bottleneck)}</p>

    <!-- Capacity breakdown -->
    <h3 style="font-size:14px;font-weight:500;color:#1A1A2E;margin:0 0 12px">Your capacity breakdown</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #f0f0f0;border-radius:8px;overflow:hidden">
      <tr style="background:#1A1A2E">
        <td style="padding:10px 14px;font-size:12px;font-weight:500;color:#fff">Capacity level</td>
        <td style="padding:10px 14px;font-size:12px;font-weight:500;color:#fff;text-align:center">Weight</td>
        <td style="padding:10px 14px;font-size:12px;font-weight:500;color:#fff;text-align:center">Your score</td>
      </tr>
      ${[
        { label: 'Strategic capacity', w: '30%', s: result.strategic.percentage },
        { label: 'Process capacity',   w: '45%', s: (result.process ?? result.operational)?.percentage ?? 0 },
        { label: 'Support capacity',   w: '25%', s: result.support.percentage },
      ].map((row, i) => {
        const c = row.s >= 80 ? '#0F6E56' : row.s >= 60 ? '#BA7517' : '#A32D2D'
        const bg = i % 2 === 0 ? '#fff' : '#fafafa'
        return `<tr style="background:${bg}">
          <td style="padding:10px 14px;font-size:13px;color:#333;font-weight:500">${row.label}</td>
          <td style="padding:10px 14px;font-size:13px;color:#666;text-align:center">${row.w}</td>
          <td style="padding:10px 14px;font-size:16px;font-weight:bold;color:${c};text-align:center">${row.s}%</td>
        </tr>`
      }).join('')}
    </table>

    <!-- TA Recommendations -->
    ${result.taRecommendations.length > 0 ? `
    <h3 style="font-size:14px;font-weight:500;color:#1A1A2E;margin:0 0 6px">Technical assistance recommendations</h3>
    <p style="font-size:13px;color:#666;margin:0 0 12px">Based on your scores, these are the priority areas for improvement:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:8px;overflow:hidden;margin-bottom:24px">
      ${taItems}
    </table>` : `
    <div style="background:#E1F5EE;border-radius:8px;padding:16px;margin-bottom:24px">
      <p style="font-size:14px;color:#0F6E56;font-weight:500;margin:0">No critical gaps identified. Your business scores at ideal performance across all assessed areas.</p>
    </div>`}

    <!-- Next steps -->
    <div style="background:#f8f8f8;border-radius:8px;padding:20px">
      <h3 style="font-size:14px;font-weight:500;color:#1A1A2E;margin:0 0 12px">Next steps</h3>
      <p style="font-size:13px;color:#555;line-height:1.7;margin:0 0 8px">1. A relationship manager from <strong>${theme.bankName}</strong> will contact you within 3 business days.</p>
      <p style="font-size:13px;color:#555;line-height:1.7;margin:0 0 8px">2. An InnovationSL TA advisor will reach out to discuss your personalised support plan.</p>
      <p style="font-size:13px;color:#555;line-height:1.7;margin:0 0 8px">3. Log in to your SME dashboard to track your progress across all diagnostic periods.</p>
      <p style="font-size:13px;color:#555;line-height:1.7;margin:0">4. Your next quarterly diagnostic is scheduled in 3 months. Completing your TA programme before then will significantly improve your score.</p>
    </div>
  </td></tr>

  <!-- Projected score -->
  <tr><td style="background:#1A1A2E;padding:20px 32px;text-align:center">
    <p style="font-size:12px;color:rgba(255,255,255,0.6);margin:0 0 6px">Projected score after completing all TA programmes</p>
    <p style="font-size:28px;font-weight:bold;color:#9FE1CB;margin:0">${result.projectedIndexAfterTA}% - Investment Ready</p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f4f5f7;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center">
    <p style="font-size:12px;color:#888;margin:0 0 4px;font-weight:500">${theme.bankName} · Powered by BizReady · Innovation SL</p>
    <p style="font-size:11px;color:#aaa;margin:0">This report is confidential and intended only for ${business.name}. Questions? Contact us at ${REPLY_TO}</p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`

  return getResend().emails.send({
    from:    FROM,
    to:      business.email,
    reply_to: REPLY_TO,
    subject: `Your BizReady Score: ${result.lendabilityIndex}% - ${cls} | ${theme.bankName}`,
    html,
  })
}

// ── BANK STAFF NOTIFICATION ───────────────────────────────
export async function sendBankNotificationEmail(params: {
  bankEmail:  string
  business:   any // Use any to avoid Mongoose document conflicts in API routes
  result:     LendabilityResult
  theme:      BankTheme
  period:     string
}) {
  const { bankEmail, business, result, theme, period } = params

  return getResend().emails.send({
    from:    FROM,
    to:      bankEmail,
    subject: `New diagnostic: ${business.name} scored ${result.lendabilityIndex}% (${classificationLabel(result.classification)})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;padding:24px">
        <h2 style="color:${theme.primary}">New diagnostic submission</h2>
        <p><strong>Business:</strong> ${business.name}</p>
        <p><strong>CEO:</strong> ${business.ceoName}</p>
        <p><strong>Sector:</strong> ${business.sector}</p>
        <p><strong>Period:</strong> ${period}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
        <p><strong>Investment readiness index:</strong> <span style="font-size:20px;font-weight:bold;color:${classificationColour(result.classification)}">${result.lendabilityIndex}%</span></p>
        <p><strong>Classification:</strong> ${classificationLabel(result.classification)}</p>
        <p><strong>Strategic:</strong> ${result.strategic.percentage}% &nbsp;|&nbsp; <strong>Process:</strong> ${(result.process ?? result.operational)?.percentage ?? 0}% &nbsp;|&nbsp; <strong>Support:</strong> ${result.support.percentage}%</p>
        <p><strong>Bottleneck:</strong> ${result.bottleneck}</p>
        <p><strong>Bank recommendation:</strong> ${getBankRecommendationText(result.lendabilityIndex)}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
        <p style="font-size:12px;color:#999">Log in to your BizReady dashboard to view the full diagnostic report and activate a TA programme for this business.</p>
      </div>
    `,
  })
}

// ── WELCOME EMAIL (new SME registration) ─────────────────
export async function sendWelcomeEmail(params: {
  business: any // Use any to avoid Mongoose document conflicts in API routes
  theme:    BankTheme
  formUrl:  string
}) {
  const { business, theme, formUrl } = params

  return getResend().emails.send({
    from:    FROM,
    to:      business.email,
    subject: `Welcome to the ${theme.bankName} SME Investment Readiness Programme`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px">
        <div style="background:${theme.primary};padding:28px 32px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px">${theme.bankName}</h1>
          <p style="color:rgba(255,255,255,0.75);margin:8px 0 0;font-size:13px">SME Investment Readiness Diagnostic Programme</p>
        </div>
        <div style="background:#fff;padding:28px 32px;border-radius:0 0 12px 12px">
          <p style="font-size:15px;color:#333">Dear ${business.ceoName},</p>
          <p style="font-size:14px;color:#555;line-height:1.7">Welcome to the ${theme.bankName} SME Investment Readiness Diagnostic Programme, powered by Innovation SL. You have been enrolled by your relationship manager to assess your business's readiness for a loan facility.</p>
          <p style="font-size:14px;color:#555;line-height:1.7">Your diagnostic takes approximately 8–10 minutes to complete. Your answers will determine your <strong>Investment Readiness Index</strong> - a score that reflects your business's credit readiness - and generate a personalised Technical Assistance plan to help you grow.</p>
          <div style="text-align:center;margin:28px 0">
            <a href="${formUrl}" style="background:${theme.primary};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:500">Start my diagnostic →</a>
          </div>
          <p style="font-size:12px;color:#999">If the button doesn't work, copy this link: ${formUrl}</p>
          <p style="font-size:13px;color:#555">Your results and TA recommendations will be emailed to you immediately after submission. All information is treated confidentially.</p>
        </div>
      </div>
    `,
  })
}
