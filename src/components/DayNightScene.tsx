import dayImg from "@/assets/scene-day.jpg";
import nightImg from "@/assets/scene-night.jpg";

type Props = {
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Day → Night crossfade scene.
 * Two stacked images animate opacity + brightness on a 6s loop.
 * A multiply sky-shift overlay deepens the transition.
 * All animation is transform/opacity/filter-only (GPU friendly).
 */
export default function DayNightScene({ className = "", style }: Props) {
  return (
    <div
      className={`daynight-scene ${className}`}
      style={style}
      aria-hidden
    >
      <img src={dayImg} alt="" className="dn-img dn-day" />
      <img src={nightImg} alt="" className="dn-img dn-night" />
      <div className="dn-sky" />
    </div>
  );
}
