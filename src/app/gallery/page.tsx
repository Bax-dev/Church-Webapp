import { GalleryAlbums } from '@/components/gallery'
import { Pastors } from '@/components/pastors'
import { CTA, PageIntro } from '@/components/site-shell'
import { routes } from '@/config/routes'
import { getContent } from '@/lib/server/content'
import { pageMetadata } from '@/lib/server/metadata'

export const generateMetadata = pageMetadata(routes.gallery)

export default async function GalleryPage() {
  const { gallery, shared } = await getContent()
  const { items, note } = gallery.albums
  const ids = items.map((_, index) => `album-${index + 1}`)
  return (
    <>
      <PageIntro {...gallery.intro} />
      <section className="section gallery-page" aria-label="Photo albums">
        <div className="container">
          {items.length > 1 && (
            <nav className="album-nav" aria-label="Albums">
              {items.map((album, index) => <a key={index} href={`#${ids[index]}`}>{album.title}</a>)}
            </nav>
          )}
          <GalleryAlbums albums={items} ids={ids} />
          {note && <p className="image-note">{note}</p>}
        </div>
      </section>
      <Pastors content={gallery.pastors} />
      <CTA content={shared.cta} />
    </>
  )
}
