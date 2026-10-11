import Image from 'next/image'
import Link from 'next/link'

import logo from '@/assets/logo.jpg'
import { SITE } from '@/config/site'

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label={`${SITE.name}, home`}>
      <span className="brand-mark" aria-hidden="true">
        <Image src={logo} alt="" width={60} height={40} priority />
      </span>
      <span>
        <span className="brand-name">{SITE.name}</span>
        <span className="brand-caption">{SITE.caption}</span>
      </span>
    </Link>
  )
}
