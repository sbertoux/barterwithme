const FROM = 'BarterWithMe <noreply@barterwithme.org>'
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://barterwithme.org'

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
    `New offer on "${listingTitle}"`,
    `<p><strong>@${fromUsername}</strong> made an offer on your listing <em>${listingTitle}</em>:</p>
     <blockquote style="border-left:3px solid #e3731c;padding-left:12px;margin:12px 0">${offerDescription}</blockquote>
     <p><a href="${BASE}/offers/${offerId}">Review offer →</a></p>`
  )
}

export function notifyOfferAccepted(
  traderEmail: string,
  { listingTitle, offerId }: { listingTitle: string; offerId: string }
) {
  return send(
    traderEmail,
    `Your offer on "${listingTitle}" was accepted!`,
    `<p>Great news — your offer on <strong>${listingTitle}</strong> was accepted.</p>
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
    `New message from @${fromUsername}`,
    `<p><strong>@${fromUsername}</strong> sent you a message about <em>${listingTitle}</em>.</p>
     <p><a href="${BASE}/offers/${offerId}">Reply →</a></p>`
  )
}
