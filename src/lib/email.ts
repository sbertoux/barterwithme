const FROM = 'BarterWithMe <noreply@barterwithme.org>'
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://barterwithme.org'

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function send(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return // not configured — skip silently
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  }).catch(() => {}) // never block the response
}

export function notifyOfferReceived(
  ownerEmail: string,
  { fromUsername, listingTitle, offerDescription, offerId }: {
    fromUsername: string; listingTitle: string; offerDescription: string; offerId: string
  }
) {
  return send(
    ownerEmail,
    `New offer on "${esc(listingTitle)}"`,
    `<p><strong>@${esc(fromUsername)}</strong> made an offer on your listing <em>${esc(listingTitle)}</em>:</p>
     <blockquote style="border-left:3px solid #e3731c;padding-left:12px;margin:12px 0">${esc(offerDescription)}</blockquote>
     <p><a href="${BASE}/offers/${offerId}">Review offer →</a></p>`
  )
}

export function notifyOfferAccepted(
  traderEmail: string,
  { listingTitle, offerId }: { listingTitle: string; offerId: string }
) {
  return send(
    traderEmail,
    `Your offer on "${esc(listingTitle)}" was accepted!`,
    `<p>Great news — your offer on <strong>${esc(listingTitle)}</strong> was accepted.</p>
     <p>Message the other person to arrange your trade.</p>
     <p><a href="${BASE}/offers/${offerId}">Open thread →</a></p>`
  )
}

export function notifyNewMessage(
  toEmail: string,
  { fromUsername, offerId, listingTitle }: { fromUsername: string; offerId: string; listingTitle: string }
) {
  return send(
    toEmail,
    `New message from @${esc(fromUsername)}`,
    `<p><strong>@${esc(fromUsername)}</strong> sent you a message about <em>${esc(listingTitle)}</em>.</p>
     <p><a href="${BASE}/offers/${offerId}">Reply →</a></p>`
  )
}

export function notifyTradeConfirmed(
  toEmail: string,
  { fromUsername, offerId, isComplete }: { fromUsername: string; offerId: string; isComplete: boolean }
) {
  if (isComplete) {
    return send(
      toEmail,
      'Your trade is complete! 🎉',
      `<p>Both parties confirmed — your trade is officially complete!</p>
       <p><a href="${BASE}/offers/${offerId}">View trade →</a></p>`
    )
  }
  return send(
    toEmail,
    `@${esc(fromUsername)} confirmed their side of the trade`,
    `<p><strong>@${esc(fromUsername)}</strong> confirmed their side of the trade.</p>
     <p>Once you confirm too, the trade will be officially complete.</p>
     <p><a href="${BASE}/offers/${offerId}">Confirm your side →</a></p>`
  )
}
