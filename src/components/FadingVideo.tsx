import { useEffect, useRef, useState } from "react";

type Props = React.VideoHTMLAttributes<HTMLVideoElement> & {
  src: string;
  loop?: boolean;
  clickToPlay?: boolean;
  playOnHover?: boolean;
};

const FADE_MS = 500;
const FADE_OUT_LEAD = 0.55;

export default function FadingVideo({
  src,
  className,
  style,
  loop = true,
  clickToPlay = false,
  playOnHover = false,
  ...rest
}: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const fadingOutRef = useRef(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.style.opacity = "0";

    const fadeTo = (target: number, duration: number) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const start = performance.now();
      const from = parseFloat(v.style.opacity || "0");
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        v.style.opacity = String(from + (target - from) * p);
        if (p < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const onLoaded = () => {
      if (clickToPlay || playOnHover) {
        v.style.opacity = "0";
        return;
      }
      v.style.opacity = "0";
      v.play().catch(() => {});
      fadeTo(1, FADE_MS);
    };

    const onTime = () => {
      if (!loop || fadingOutRef.current) return;
      const remaining = v.duration - v.currentTime;
      if (remaining > 0 && remaining <= FADE_OUT_LEAD) {
        fadingOutRef.current = true;
        fadeTo(0, FADE_MS);
      }
    };

    const onEnded = () => {
      if (!loop) return;
      v.style.opacity = "0";
      setTimeout(() => {
        v.currentTime = 0;
        v.play().catch(() => {});
        fadingOutRef.current = false;
        fadeTo(1, FADE_MS);
      }, 100);
    };

    v.addEventListener("loadeddata", onLoaded);
    if (loop) {
      v.addEventListener("timeupdate", onTime);
      v.addEventListener("ended", onEnded);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      v.removeEventListener("loadeddata", onLoaded);
      if (loop) {
        v.removeEventListener("timeupdate", onTime);
        v.removeEventListener("ended", onEnded);
      }
    };
  }, [src, loop, clickToPlay]);

  const startPlayback = () => {
    const v = ref.current;
    if (!v || hasStarted) return;
    v.play()
      .then(() => {
        setHasStarted(true);
        fadeTo(1, FADE_MS);
      })
      .catch(() => {});
  };

  const videoElement = (
    <video
      ref={ref}
      src={src}
      autoPlay={!clickToPlay && !playOnHover}
      muted
      playsInline
      preload="auto"
      loop={loop}
      className={className}
      style={{ opacity: 0, ...style }}
      {...rest}
    />
  );

  if (!clickToPlay && !playOnHover) {
    return videoElement;
  }

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={playOnHover ? startPlayback : undefined}
      onClick={clickToPlay ? startPlayback : undefined}
    >
      {videoElement}
      {clickToPlay && !hasStarted && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
            Click to play
          </span>
        </div>
      )}
    </div>
  );
}

