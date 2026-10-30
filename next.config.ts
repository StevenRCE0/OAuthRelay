import type { NextConfig } from 'next'

const config: NextConfig = {
  // /og/invite renders per request and reads its fonts from public/ at runtime.
  outputFileTracingIncludes: { '/og/invite': ['./public/fonts/*.woff'] },
}

export default config
