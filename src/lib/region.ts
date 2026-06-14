/**
 * Converts a US zip code to a general region label.
 * Zip code is never stored — only the derived region is persisted.
 */
export function zipToRegion(zip: string): string {
  const prefix = parseInt(zip.slice(0, 3), 10)
  if (isNaN(prefix)) return 'Unknown Region'

  // New England (CT, MA, ME, NH, RI, VT)
  if (prefix >= 10 && prefix <= 27) return 'New England'
  // Mid-Atlantic (NJ, NY)
  if (prefix >= 100 && prefix <= 149) return 'New York Area'
  if (prefix >= 70 && prefix <= 89) return 'Mid-Atlantic'
  // Pennsylvania, DE, MD
  if (prefix >= 155 && prefix <= 199) return 'Mid-Atlantic'
  if ((prefix >= 197 && prefix <= 199) || (prefix >= 207 && prefix <= 219)) return 'Mid-Atlantic'
  // Southeast
  if (prefix >= 220 && prefix <= 246) return 'Virginia & DC Area'
  if (prefix >= 247 && prefix <= 268) return 'Appalachia'
  if (prefix >= 270 && prefix <= 289) return 'Carolinas'
  if (prefix >= 290 && prefix <= 299) return 'South Carolina'
  if (prefix >= 300 && prefix <= 319) return 'Georgia'
  if (prefix >= 320 && prefix <= 349) return 'Florida'
  if (prefix >= 350 && prefix <= 369) return 'Alabama'
  if (prefix >= 370 && prefix <= 385) return 'Tennessee'
  if (prefix >= 386 && prefix <= 397) return 'Mississippi'
  // Midwest
  if (prefix >= 400 && prefix <= 427) return 'Kentucky & Ohio Valley'
  if (prefix >= 430 && prefix <= 459) return 'Ohio'
  if (prefix >= 460 && prefix <= 479) return 'Indiana'
  if (prefix >= 480 && prefix <= 499) return 'Michigan'
  if (prefix >= 500 && prefix <= 528) return 'Iowa & Illinois'
  if (prefix >= 530 && prefix <= 549) return 'Wisconsin'
  if (prefix >= 550 && prefix <= 567) return 'Minnesota'
  if (prefix >= 570 && prefix <= 577) return 'Dakotas'
  if (prefix >= 580 && prefix <= 588) return 'Dakotas'
  if (prefix >= 590 && prefix <= 599) return 'Montana'
  // Plains
  if (prefix >= 600 && prefix <= 620) return 'Northern Illinois'
  if (prefix >= 620 && prefix <= 658) return 'Missouri & Kansas'
  if (prefix >= 660 && prefix <= 679) return 'Kansas'
  if (prefix >= 680 && prefix <= 693) return 'Nebraska'
  // South-Central
  if (prefix >= 700 && prefix <= 729) return 'Louisiana'
  if (prefix >= 730 && prefix <= 749) return 'Oklahoma'
  if (prefix >= 750 && prefix <= 799) return 'Texas'
  if (prefix >= 800 && prefix <= 816) return 'Colorado'
  if (prefix >= 820 && prefix <= 831) return 'Wyoming'
  if (prefix >= 832 && prefix <= 838) return 'Idaho'
  if (prefix >= 840 && prefix <= 847) return 'Utah'
  if (prefix >= 850 && prefix <= 865) return 'Arizona'
  if (prefix >= 870 && prefix <= 884) return 'New Mexico'
  if (prefix >= 889 && prefix <= 898) return 'Nevada'
  if (prefix >= 900 && prefix <= 961) return 'California'
  if (prefix >= 970 && prefix <= 979) return 'Oregon'
  if (prefix >= 980 && prefix <= 994) return 'Washington State'
  if (prefix >= 995 && prefix <= 999) return 'Alaska'
  if (prefix >= 967 && prefix <= 969) return 'Hawaii'

  return 'United States'
}

export function isValidUSZip(zip: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zip.trim())
}
