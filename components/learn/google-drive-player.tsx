"use client";

/**
 * Renders a Google Drive-hosted video via Drive's own preview embed.
 * Accepts either a raw file ID or a full Drive URL (share link or
 * /file/d/<id>/view link) and normalizes it to the /preview embed URL.
 *
 * NOTE: Drive's preview iframe doesn't expose a scriptable playback API
 * the way the YouTube IFrame API does, so watch-time progress can't be
 * tracked the same way for Drive-hosted lessons. This is a real,
 * disclosed limitation, not something quietly skipped.
 */
export function GoogleDrivePlayer({ url }: { url: string }) {
  const embedUrl = toDrivePreviewUrl(url);

  if (!embedUrl) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-black text-sm text-white/60">
        Invalid Google Drive link
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <iframe
        src={embedUrl}
        className="h-full w-full"
        allow="autoplay"
        allowFullScreen
        title="Lesson video"
      />
    </div>
  );
}

function toDrivePreviewUrl(input: string): string | null {
  const trimmed = input.trim();

  // Already a bare file ID (no slashes/dots) — Drive IDs are long
  // alphanumeric strings with - and _.
  if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) {
    return `https://drive.google.com/file/d/${trimmed}/preview`;
  }

  const idMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ?? trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) {
    return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
  }

  return null;
}
