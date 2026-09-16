"use client";

import { useEffect, useId, useRef } from "react";

// Minimal shape of the YouTube IFrame API this component uses — enough
// to stay type-safe without pulling in the full @types/youtube package.
interface YTPlayer {
  getCurrentTime(): number;
  destroy(): void;
}
interface YTPlayerEvent {
  target: YTPlayer;
}
interface YTOnStateChangeEvent {
  data: number;
  target: YTPlayer;
}

const YT_PLAYER_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2 } as const;

interface YTPlayerConstructor {
  new (
    elementId: string,
    options: {
      videoId: string;
      events?: {
        onReady?: (event: YTPlayerEvent) => void;
        onStateChange?: (event: YTOnStateChangeEvent) => void;
      };
    }
  ): YTPlayer;
}

declare global {
  interface Window {
    YT: { Player: YTPlayerConstructor };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (apiLoadPromise) return apiLoadPromise;
  apiLoadPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
    window.onYouTubeIframeAPIReady = () => resolve();
  });
  return apiLoadPromise;
}

const REPORT_INTERVAL_MS = 10_000;

export function YouTubePlayer({
  youtubeVideoId,
  onProgress,
}: {
  youtubeVideoId: string;
  /** Called periodically (and on pause/end) with the current watched seconds. */
  onProgress: (seconds: number) => void;
}) {
  const reactId = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const elementId = `yt-player-${reactId}`;
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled) return;
      playerRef.current = new window.YT.Player(elementId, {
        videoId: youtubeVideoId,
        events: {
          onStateChange: (event) => {
            if (event.data === YT_PLAYER_STATE.PLAYING) {
              intervalRef.current = setInterval(() => {
                onProgress(Math.floor(event.target.getCurrentTime()));
              }, REPORT_INTERVAL_MS);
            } else {
              if (intervalRef.current) clearInterval(intervalRef.current);
              onProgress(Math.floor(event.target.getCurrentTime()));
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      playerRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeVideoId, elementId]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <div id={elementId} className="h-full w-full" />
    </div>
  );
}
