'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

import { SiteImage } from '@/components/content'
import type { SiteContent } from '@/config/content'

type Album = SiteContent['gallery']['albums']['items'][number]

/** The gallery page's albums: a grid of photos per album, each opening a full-size viewer with previous/next. `ids` are the albums' anchors. */
export function GalleryAlbums({ albums, ids }: { albums: Album[]; ids: string[] }) {
  const photos = albums.flatMap((album) => album.photos.map((photo) => ({ ...photo, album: album.title })))
  const [open, setOpen] = useState<number>()
  const dialog = useRef<HTMLDialogElement>(null)

  const step = useCallback((by: number) => setOpen((index) => (index === undefined ? index : (index + by + photos.length) % photos.length)), [photos.length])

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open !== undefined && !element.open) element.showModal()
    if (open === undefined && element.open) element.close()
  }, [open])

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') step(-1)
    if (event.key === 'ArrowRight') step(1)
  }

  let offset = 0
  const current = open === undefined ? undefined : photos[open]
  return (
    <>
      {albums.map((album, index) => {
        const start = offset
        offset += album.photos.length
        return (
          <section key={index} id={ids[index]} className="album" aria-labelledby={`${ids[index]}-title`}>
            <div className="album-head">
              <h2 id={`${ids[index]}-title`}>{album.title}</h2>
              {album.text && <p>{album.text}</p>}
            </div>
            <ul className="album-grid">
              {album.photos.map((photo, n) => (
                <li key={n}>
                  <button type="button" className="album-photo" onClick={() => setOpen(start + n)} aria-label={`View larger: ${photo.caption || photo.image.alt}`}>
                    <SiteImage image={photo.image} sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 360px" />
                  </button>
                  {photo.caption && <span className="album-caption">{photo.caption}</span>}
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      <dialog ref={dialog} className="lightbox" aria-label="Photo viewer" onClose={() => setOpen(undefined)} onKeyDown={onKeyDown}
        onClick={(event) => { if (event.target === event.currentTarget) setOpen(undefined) }}>
        {current && (
          <figure>
            <div className="lightbox-frame"><SiteImage image={current.image} sizes="100vw" /></div>
            <figcaption>
              <span className="eyebrow">{current.album} · {open! + 1} of {photos.length}</span>
              {current.caption && <span>{current.caption}</span>}
            </figcaption>
          </figure>
        )}
        <button type="button" className="lightbox-close" onClick={() => setOpen(undefined)} aria-label="Close"><X size={20} /></button>
        {photos.length > 1 && (
          <>
            <button type="button" className="lightbox-prev" onClick={() => step(-1)} aria-label="Previous photo"><ChevronLeft size={24} /></button>
            <button type="button" className="lightbox-next" onClick={() => step(1)} aria-label="Next photo"><ChevronRight size={24} /></button>
          </>
        )}
      </dialog>
    </>
  )
}
