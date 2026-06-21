import type { MetadataRoute } from 'next'

const BASE = 'https://barterwithme.org'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`,                      changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/browse`,                changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/stories`,               changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/why`,                   changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/terms`,                 changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/community-guidelines`,  changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/safety`,                changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/donate`,                changeFrequency: 'monthly', priority: 0.5 },
  ]
}
