import { HttpError, ok, requireAdmin, route } from '@/lib/server/api'
import { saveSiteImage } from '@/lib/server/content'

/**
 * Uploads a photo for the site content (multipart field "image", JPG or PNG up to 5 MB) and returns its src.
 * It goes live when the page that uses it is saved; unsaved uploads are not linked from anywhere.
 */
export const POST = route(async (request) => {
  await requireAdmin(request)
  const form = await request.formData().catch(() => undefined)
  const file = form?.get('image')
  if (!(file instanceof File)) throw new HttpError(422, 'Choose an image to upload.', { image: 'Choose an image to upload.' })
  const saved = await saveSiteImage(file)
  if ('error' in saved) throw new HttpError(422, saved.error!, { image: saved.error! })
  return ok({ src: saved.src })
})
