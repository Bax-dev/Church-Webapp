import { HttpError, ok, requireAdmin, route } from '@/lib/server/api'
import { savePastorPhoto } from '@/lib/server/pastors'

/**
 * Uploads a pastor photo (multipart field "photo", JPG or PNG up to 2 MB) and returns its URL.
 * The photo goes live when the list is saved; files left unsaved are not linked from anywhere.
 */
export const POST = route(async (request) => {
  await requireAdmin(request)
  const form = await request.formData().catch(() => undefined)
  const file = form?.get('photo')
  if (!(file instanceof File)) throw new HttpError(422, 'Choose a photo to upload.', { photo: 'Choose a photo to upload.' })
  const saved = await savePastorPhoto(file)
  if ('error' in saved) throw new HttpError(422, saved.error!, { photo: saved.error! })
  return ok({ photoUrl: saved.url })
})
