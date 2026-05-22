import { useState, useEffect, useCallback, useRef } from 'react';
import './carga.css';

const LABELS = [
  'Preparando el estadio…',
  'Cargando equipos…',
  'Calentando motores…',
  'El árbitro está listo…',
  '¡El partido está por comenzar!',
];

const FLAGS  = ['🇧🇷','🇦🇷','🇩🇪','🇫🇷','🇪🇸','🇵🇹','🇮🇹','🇳🇱','🇯🇵','🇲🇽'];
const COLORS = ['#3b82f6','#06b6d4','#22c55e','#f59e0b','#ef4444','#ffffff'];
const DOTS   = Array.from({ length: 22 }, (_, i) => ({
  id:     i,
  left:   `${Math.random() * 100}%`,
  color:  COLORS[i % COLORS.length],
  dur:    `${(3 + Math.random() * 4).toFixed(2)}s`,
  delay:  `${(Math.random() * 5).toFixed(2)}s`,
  width:  `${(3 + Math.random() * 5).toFixed(1)}px`,
  height: `${(3 + Math.random() * 5).toFixed(1)}px`,
  radius: Math.random() > 0.5 ? '50%' : '2px',
}));

function BallSVG() {
  return (
    <svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="wc-ball-grad" cx="38%" cy="35%" r="60%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="100%" stopColor="#c8c8c8" />
        </radialGradient>
      </defs>
      <circle cx="48" cy="48" r="44" fill="url(#wc-ball-grad)" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
      <polygon points="48,22 64,34 58,52 38,52 32,34" fill="#1a1a1a" opacity=".88" />
      <polygon points="48,22 32,34 20,22 28,8 48,6"   fill="#1a1a1a" opacity=".75" />
      <polygon points="64,34 76,22 84,36 72,50 58,52" fill="#1a1a1a" opacity=".75" />
      <polygon points="58,52 72,50 68,66 54,72 46,64" fill="#1a1a1a" opacity=".75" />
      <polygon points="38,52 46,64 32,72 20,62 24,50" fill="#1a1a1a" opacity=".75" />
      <polygon points="32,34 20,22 8,34 14,50 24,50"  fill="#1a1a1a" opacity=".75" />
      <ellipse cx="36" cy="32" rx="10" ry="6" fill="white" opacity=".4" transform="rotate(-20 36 32)" />
    </svg>
  );
}

// ✅ Mayúscula en el nombre — obligatorio en React
export default function Carga({ visible = true, onHidden, minDuration = 2800 }) {
  const [labelIdx, setLabelIdx] = useState(0);
  const [gone,     setGone]     = useState(false);   // desmonta el nodo tras la transición
  const startTime = useRef(Date.now());

  // Rotación de etiquetas
  useEffect(() => {
    const id = setInterval(() => {
      setLabelIdx(i => (i + 1) % LABELS.length);
    }, 620);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
  if (visible) {
    setGone(false);
    startTime.current = Date.now();
  }
}, [visible]);

  // Cuando visible pasa a false, esperamos minDuration antes de añadir la clase de salida
  const [readyToHide, setReadyToHide] = useState(false);
  useEffect(() => {
    if (!visible) {
      const elapsed   = Date.now() - startTime.current;
      const remaining = Math.max(0, minDuration - elapsed);
      const id = setTimeout(() => setReadyToHide(true), remaining);
      return () => clearTimeout(id);
    } else {
      setReadyToHide(false);
    }
  }, [visible, minDuration]);

  // Al terminar la transición CSS, desmontamos y avisamos al padre
  const handleTransitionEnd = useCallback(() => {
    if (readyToHide) {
      setGone(true);
      onHidden?.();
    }
  }, [readyToHide, onHidden]);

  // Solo desmontamos DESPUÉS de que terminó la transición
  if (gone) return null;

  return (
    <div
      className={`wc-loader__overlay${readyToHide ? ' wc-loader--hidden' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Cargando"
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="wc-loader__field"         aria-hidden="true" />
      <div className="wc-loader__arc"           aria-hidden="true" />
      <div className="wc-loader__center-circle" aria-hidden="true" />

      <div className="wc-loader__confetti" aria-hidden="true">
        {DOTS.map(dot => (
          <div
            key={dot.id}
            className="wc-loader__dot"
            style={{
              left:         dot.left,
              background:   dot.color,
              '--wc-dur':   dot.dur,
              '--wc-delay': dot.delay,
              width:        dot.width,
              height:       dot.height,
              borderRadius: dot.radius,
            }}
          />
        ))}
      </div>

      <div className="wc-loader__body">
        <div className="wc-loader__stars" aria-hidden="true">
          {[0,1,2,3].map(i => <span key={i} className="wc-loader__star">★</span>)}
        </div>

        <div className="wc-loader__ball-wrap" aria-hidden="true">
          <div className="wc-loader__ball"><BallSVG /></div>
          <div className="wc-loader__ball-shadow" />
        </div>

        <div className="wc-loader__title">
          <span className="wc-loader__title-top">Copa del Mundo</span>
          <span className="wc-loader__title-main">
            <span className="wc-loader__title-accent">FIFA</span> World Cup
          </span>
        </div>

        <div className="wc-loader__progress-wrap">
          <div className="wc-loader__progress-track">
            <div className="wc-loader__progress-bar" />
          </div>
          <span className="wc-loader__progress-label">{LABELS[labelIdx]}</span>
        </div>

        <div className="wc-loader__flags" aria-hidden="true">
          {FLAGS.slice(0, 8).map(f => (
            <span key={f} className="wc-loader__flag">{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}