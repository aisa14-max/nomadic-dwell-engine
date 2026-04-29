import dayImg from "@/assets/scene-day.jpg";
import nightImg from "@/assets/scene-night.jpg";

type Props = {
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Day → Night crossfade scene — exact port of reference.
 * 6s alternating loop with sky shift, DAY/NIGHT label swap,
 * and a gradient progress bar beneath the scene.
 */
export default function DayNightScene({ className = "", style }: Props) {
  return (
    <div className={`dn-wrap ${className}`} style={style} aria-hidden>
      <div className="dn-scene">
        <img src={dayImg} alt="" className="dn-img dn-day" />
        <img src={nightImg} alt="" className="dn-img dn-night" />
        <div className="dn-sky" />
        <span className="dn-label dn-label-day">Day</span>
        <span className="dn-label dn-label-night">Night</span>
      </div>

      <div className="dn-progress-wrap">
        <span className="dn-prog-label left">Day</span>
        <div className="dn-progress-track">
          <div className="dn-progress-fill" />
        </div>
        <span className="dn-prog-label right">Night</span>
      </div>
    </div>
  );
}
