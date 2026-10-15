import Link from 'next/link'

import { SiteImage } from '@/components/content'
import type { SiteContent } from '@/config/content'

/** Logo, name and caption, all from Church details in the site content. */
export function Brand({ identity }: { identity: SiteContent['site']['identity'] }) {
  return (
    <Link className="brand" href="/" aria-label={`${identity.name}, home`}>
      <span className="brand-mark" aria-hidden="true">
        <SiteImage image={identity.logo} sizes="60px" priority decorative />
      </span>
      <span>
        <span className="brand-name">{identity.name}</span>
        {identity.caption && <span className="brand-caption">{identity.caption}</span>}
      </span>
    </Link>
  )
}
