import Link from 'next/link'

import { ContentEditor } from '@/components/portal/content-editor'
import { PortalHeading } from '@/components/portal/ui'
import { contentForm, contentGroups, type ContentGroup } from '@/config/content'
import { routes } from '@/config/routes'
import { getRawContent } from '@/lib/server/content'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.adminContent)

type Props = { searchParams: Promise<{ page?: string }> }

export default async function AdminContentPage({ searchParams }: Props) {
  const requested = (await searchParams).page as ContentGroup
  const group = contentGroups.includes(requested) ? requested : 'home'
  const content = await getRawContent()

  return (
    <>
      <PortalHeading
        eyebrow="Super Admin"
        title="Site content"
        text="Every heading, paragraph, button label and photo on the public website. Choose a page, edit it, and save; the site updates straight away."
      />
      <nav className="content-tabs" aria-label="Pages">
        {contentGroups.map((key) => (
          <Link key={key} href={`${routes.adminContent.path}/?page=${key}`} aria-current={key === group ? 'page' : undefined}>
            {contentForm[key].label}
          </Link>
        ))}
      </nav>
      {/* Keyed by group, so switching pages starts the editor fresh. */}
      <ContentEditor key={group} group={group} initial={content[group]} />
    </>
  )
}
