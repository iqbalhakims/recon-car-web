import { useState, useEffect, useRef, useCallback } from 'react';
import './Car360Viewer.css';

/**
 * Car360Viewer — drag-to-rotate 360° photo viewer
 *
 * Props:
 *   images        {string[]}  Ordered array of image URLs (e.g. 24 frames)
 *   autoplaySpeed {number}    ms between frames during autoplay (default 70)
 *   sensitivity   {number}    px of drag needed to advance one frame (default 10)
 */
export default function Car360Viewer({
  images = [],
  autoplaySpeed = 70,
  sensitivity = 10,
}) {
  const totalFrames = images.length;
  const [frame, setFrame] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [dragging, setDragging] = useState(false);

  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const frameAtDragStart = useRef(0);
  const autoplayTimer = useRef(null);
  const frameRef = useRef(0);

  const isLoading = loadedCount < totalFrames;

  // ── Preload all frames ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!totalFrames) return;
    setLoadedCount(0);
    let count = 0;
    const imgs = images.map(src => {
      const img = new Image();
      img.onload = img.onerror = () => {
        count++;
        setLoadedCount(c => c + 1); // use functional update to avoid closure issue
      };
      img.src = src;
      return img;
    });
    return () => imgs.forEach(img => { img.onload = img.onerror = null; });
  }, [images, totalFrames]);

  // ── Autoplay ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoplay || isLoading || !totalFrames) return;
    autoplayTimer.current = setInterval(() => {
      setFrame(f => {
        const next = (f + 1) % totalFrames;
        frameRef.current = next;
        return next;
      });
    }, autoplaySpeed);
    return () => clearInterval(autoplayTimer.current);
  }, [autoplay, isLoading, totalFrames, autoplaySpeed]);

  const stopAutoplay = useCallback(() => {
    setAutoplay(false);
    clearInterval(autoplayTimer.current);
  }, []);

  const goToFrame = useCallback((f) => {
    const next = ((f % totalFrames) + totalFrames) % totalFrames;
    frameRef.current = next;
    setFrame(next);
  }, [totalFrames]);

  // ── Mouse drag ──────────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    if (isLoading) return;
    stopAutoplay();
    isDragging.current = true;
    setDragging(true);
    dragStartX.current = e.clientX;
    frameAtDragStart.current = frameRef.current;
    e.preventDefault();
  }, [isLoading, stopAutoplay]);

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    const delta = e.clientX - dragStartX.current;
    const shift = Math.round(delta / sensitivity);
    goToFrame(frameAtDragStart.current - shift);
  }, [sensitivity, goToFrame]);

  const onMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setDragging(false);
  }, []);

  // ── Touch drag ──────────────────────────────────────────────────────────────
  const onTouchStart = useCallback((e) => {
    if (isLoading) return;
    stopAutoplay();
    isDragging.current = true;
    dragStartX.current = e.touches[0].clientX;
    frameAtDragStart.current = frameRef.current;
  }, [isLoading, stopAutoplay]);

  const onTouchMove = useCallback((e) => {
    if (!isDragging.current) return;
    e.preventDefault(); // prevent page scroll while rotating
    const delta = e.touches[0].clientX - dragStartX.current;
    const shift = Math.round(delta / sensitivity);
    goToFrame(frameAtDragStart.current - shift);
  }, [sensitivity, goToFrame]);

  const onTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  if (!totalFrames) return null;

  const loadPct = Math.round((loadedCount / totalFrames) * 100);

  return (
    <div className="v360-wrap">
      {/* Stage */}
      <div
        className={`v360-stage${dragging ? ' v360-stage--grab' : ''}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="v360-loader">
            <div className="v360-spinner" />
            <span className="v360-load-pct">{loadPct}%</span>
          </div>
        )}

        {/* Frames — all preloaded, only active one visible */}
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className="v360-img"
            style={{
              display: i === frame ? 'block' : 'none',
              opacity: isLoading ? 0 : 1,
            }}
            draggable={false}
          />
        ))}

        {/* Drag hint — fades out after interaction */}
        {!isLoading && !dragging && (
          <div className="v360-hint" aria-hidden="true">
            <span className="v360-hint-icon">⟷</span>
            <span className="v360-hint-text">Drag to rotate</span>
          </div>
        )}

        {/* 360 badge */}
        <div className="v360-badge" aria-hidden="true">360°</div>
      </div>

      {/* Controls bar */}
      <div className="v360-controls">
        <button
          className={`v360-play-btn${autoplay ? ' v360-play-btn--active' : ''}`}
          onClick={() => (autoplay ? stopAutoplay() : setAutoplay(true))}
          aria-label={autoplay ? 'Pause autoplay' : 'Start autoplay'}
          disabled={isLoading}
        >
          {autoplay ? '⏸ Pause' : '▶ Autoplay'}
        </button>

        <div className="v360-scrubber-wrap">
          <input
            type="range"
            className="v360-scrubber"
            min={0}
            max={totalFrames - 1}
            value={frame}
            onChange={e => {
              stopAutoplay();
              goToFrame(Number(e.target.value));
            }}
            aria-label="Frame scrubber"
            disabled={isLoading}
          />
        </div>

        <span className="v360-counter">
          {frame + 1} / {totalFrames}
        </span>
      </div>
    </div>
  );
}
