import coast from "@/assets/dest-coast.jpg";
import desert from "@/assets/dest-desert.jpg";
import forest from "@/assets/dest-forest.jpg";
import highland from "@/assets/dest-highland.jpg";

type Props = { className?: string; style?: React.CSSProperties };

const SCENES = [coast, forest, highland, desert];

/**
 * Voyage scene — photo-based crossfade through terrain destinations
 * with slow Ken Burns drift, matching the home page's cinematic photo style.
 */
export default function VoyageScene({ className = "", style }: Props) {
  return (
    <div className={`voyage-scene ${className}`} style={style} aria-hidden>
      {SCENES.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          className="voyage-img"
          style={{ animationDelay: `${i * 6}s` }}
        />
      ))}
      <div className="voyage-veil" />
      <div className="claim-fog absolute inset-0" />
    </div>
  );
}
