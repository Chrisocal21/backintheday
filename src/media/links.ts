import { parseYouTubeId } from '../store'
import type { MediaItem } from './types'

// Turn a pasted link into something the TV can play.
// Supported: YouTube, Vimeo, Dailymotion, Twitch, Streamable (official embeds), archive.org pages
// (resolved to their video/audio file), and direct media files incl. HLS (.m3u8).
const FILE = /\.(mp4|webm|ogv|ogg|mov|m4v|mp3|m4a|aac|wav|flac|oga|opus|m3u8)(\?|#|$)/i

const base = (title: string, url: string, source: string, playback: MediaItem['playback'], credit: string): MediaItem => ({
  id: 'link-' + Math.abs([...url].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)).toString(36),
  title, kind: 'movie', genre: 'Your link', era: 'Now', year: '', playback, url, source, credit, note: 'Pasted by you.', verified: '',
})

export async function resolveLink(raw: string): Promise<MediaItem> {
  const text = raw.trim()
  const yt = parseYouTubeId(text)
  if (yt && /youtu|^[\w-]{11}$/.test(text)) return { ...base('YouTube video', yt, 'https://www.youtube.com/watch?v=' + yt, 'youtube', 'YouTube'), id: 'link-yt-' + yt }
  let u: URL
  try { u = new URL(/^https?:\/\//i.test(text) ? text : 'https://' + text) } catch { throw new Error("That doesn't look like a link.") }
  const host = u.hostname.replace(/^www\./, '')
  const parts = u.pathname.split('/').filter(Boolean)

  if (host.endsWith('vimeo.com')) {
    const id = parts.find((p) => /^\d+$/.test(p))
    if (id) return base('Vimeo video', `https://player.vimeo.com/video/${id}?autoplay=1`, u.href, 'iframe', 'Vimeo')
  }
  if (host.endsWith('dailymotion.com') || host === 'dai.ly') {
    const id = host === 'dai.ly' ? parts[0] : parts[parts.indexOf('video') + 1]
    if (id) return base('Dailymotion video', `https://www.dailymotion.com/embed/video/${id.split('_')[0]}?autoplay=1`, u.href, 'iframe', 'Dailymotion')
  }
  if (host.endsWith('twitch.tv')) {
    const parent = location.hostname
    if (parts[0] === 'videos' && parts[1]) return base('Twitch video', `https://player.twitch.tv/?video=v${parts[1]}&parent=${parent}`, u.href, 'iframe', 'Twitch')
    if (parts[0]) return base(`Twitch: ${parts[0]}`, `https://player.twitch.tv/?channel=${parts[0]}&parent=${parent}`, u.href, 'iframe', 'Twitch')
  }
  if (host.endsWith('streamable.com') && parts[0]) return base('Streamable video', `https://streamable.com/e/${parts[parts.length - 1]}`, u.href, 'iframe', 'Streamable')

  if (host.endsWith('archive.org') && (parts[0] === 'details' || parts[0] === 'download' || parts[0] === 'embed') && parts[1]) {
    if (parts[0] === 'download' && FILE.test(u.pathname)) return base(decodeURIComponent(parts[parts.length - 1]), u.href, `https://archive.org/details/${parts[1]}`, 'video', 'Internet Archive')
    const meta = await fetch(`https://archive.org/metadata/${parts[1]}`).then((r) => r.json()).catch(() => null)
    const files: { name: string; size?: string }[] = meta?.files ?? []
    const pick = ['.mp4', '.webm', '.ogv', '.mp3', '.ogg'].map((ext) => files.filter((f) => f.name.toLowerCase().endsWith(ext)).sort((a, b) => (/512kb/i.test(a.name) ? -1 : 0) - (/512kb/i.test(b.name) ? -1 : 0))[0]).find(Boolean)
    if (!pick) throw new Error('No playable video or audio file found on that archive.org page.')
    return base(meta?.metadata?.title || parts[1], `https://archive.org/download/${parts[1]}/${encodeURIComponent(pick.name)}`, `https://archive.org/details/${parts[1]}`, 'video', String(meta?.metadata?.creator || 'Internet Archive'))
  }

  if (FILE.test(u.pathname)) return base(decodeURIComponent(parts[parts.length - 1] || 'Video'), u.href, u.href, 'video', host)
  throw new Error("Can't play that page directly. Paste the video file link, or a YouTube / Vimeo / Dailymotion / Twitch / archive.org link.")
}
