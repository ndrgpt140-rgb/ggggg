import type { Config } from 'next'

const config: Config = {
  reactStrictMode: true,
  i18n: {
    locales: ['ar', 'en'],
    defaultLocale: 'ar',
  },
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
}

export default config
