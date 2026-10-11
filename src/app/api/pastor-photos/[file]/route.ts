import { HttpError, route } from '@/lib/server/api'
import { readPastorPhoto } from '@/lib/server/pastors'

/** Pastor photos are public, unlike member photos. A replaced photo gets a new file name, so it can be cached for long. */
export const GET = route<{ file: string }>(async (_request, { params }) => {
  const photo = await readPastorPhoto((await params).file)
  if (!photo) throw new HttpError(404, 'Not found.')
  return new Response(photo.bytes, {
    headers: { 'Content-Type': photo.type, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
  })
})
