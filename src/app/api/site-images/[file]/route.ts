import { HttpError, route } from '@/lib/server/api'
import { readSiteImage } from '@/lib/server/content'

/** Public photos for the website. A replaced photo gets a new file name, so each file can be cached for a long time. */
export const GET = route<{ file: string }>(async (_request, { params }) => {
  const image = await readSiteImage((await params).file)
  if (!image) throw new HttpError(404, 'Not found.')
  return new Response(image.bytes, {
    headers: { 'Content-Type': image.type, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
  })
})
