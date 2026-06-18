import React, { useEffect, useRef } from 'react';

const VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260616_212935_bbf608da-62d1-4f25-9be4-c346e4d09cc8.mp4';

function BackgroundEffects() {
  const videoCanvasRef = useRef(null);
  const videoFallbackRef = useRef(null);
  const particlesCanvasRef = useRef(null);

  useEffect(() => {
    // ===================== HIGH-PERFORMANCE CANVAS SCROLL ANIMATOR =====================
    const canvas = videoCanvasRef.current;
    const videoEl = videoFallbackRef.current;
    const ctx = canvas.getContext('2d');
    
    let frames = [];
    let framesReady = false;
    let lastFrameIndex = -1;
    let videoSeeking = false;
    let animationFrameId;

    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      lastFrameIndex = -1;
    }

    async function extractFrames() {
      try {
        const response = await fetch(VIDEO_URL, { mode: 'cors' });
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';
        video.preload = 'auto';
        video.src = objectUrl;

        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => resolve();
          video.onerror = () => reject();
          setTimeout(() => reject(), 15000);
        });

        const scale = Math.min(1, 1280 / video.videoWidth);
        const scaledWidth = Math.round(video.videoWidth * scale);
        const scaledHeight = Math.round(video.videoHeight * scale);
        const frameCount = Math.max(30, Math.min(120, Math.round(video.duration * 24)));

        for (let i = 0; i < frameCount; i++) {
          const time = (i / (frameCount - 1)) * (video.duration - 0.05);
          video.currentTime = time;
          await new Promise((resolve, reject) => {
            const onSeeked = () => { video.removeEventListener('seeked', onSeeked); resolve(); };
            video.addEventListener('seeked', onSeeked);
            setTimeout(() => { video.removeEventListener('seeked', onSeeked); reject(); }, 3000);
          });
          const bitmap = await createImageBitmap(video, { resizeWidth: scaledWidth, resizeHeight: scaledHeight });
          frames.push(bitmap);
        }

        if (frames.length > 0) {
          framesReady = true;
          canvas.style.visibility = 'visible';
          if (videoEl) videoEl.style.display = 'none';
        }
        URL.revokeObjectURL(objectUrl);
      } catch (e) { 
        console.warn("Failed to extract frames, falling back to standard scrubbing", e); 
      }
    }

    function getScrollBounds() {
      const vh = window.innerHeight;
      return { start: vh * 0.2, end: document.documentElement.scrollHeight - vh };
    }

    function getProgress() {
      const { start, end } = getScrollBounds();
      const range = end - start;
      if (range <= 0) return 0;
      return Math.max(0, Math.min(1, (window.scrollY - start) / range));
    }

    function drawFrame(frame) {
      const cw = canvas.width, ch = canvas.height;
      const s = Math.max(cw / frame.width, ch / frame.height);
      const dw = frame.width * s, dh = frame.height * s;
      ctx.drawImage(frame, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    }

    function videoTick() {
      const progress = getProgress();
      if (framesReady && frames.length > 0) {
        const idx = Math.round(progress * (frames.length - 1));
        if (idx !== lastFrameIndex) {
          lastFrameIndex = idx;
          if (frames[idx]) drawFrame(frames[idx]);
        }
      } else if (videoEl && videoEl.duration && isFinite(videoEl.duration) && videoEl.readyState >= 1) {
        const target = progress * videoEl.duration;
        if (!videoSeeking && Math.abs(videoEl.currentTime - target) > 0.001) {
          videoSeeking = true;
          videoEl.currentTime = target;
        }
      }
      animationFrameId = requestAnimationFrame(videoTick);
    }

    const handleSeeked = () => { videoSeeking = false; };
    const handleStalled = () => { videoSeeking = false; };
    const handleLoadedData = () => { videoEl.currentTime = 0; };

    if (videoEl) {
      videoEl.addEventListener('seeked', handleSeeked);
      videoEl.addEventListener('stalled', handleStalled);
      videoEl.addEventListener('loadeddata', handleLoadedData);
    }
    canvas.style.visibility = 'hidden';

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animationFrameId = requestAnimationFrame(videoTick);
    extractFrames();

    // ===================== AMBIENT BACKGROUND PARTICLES ENGINE =====================
    const pCanvas = particlesCanvasRef.current;
    const pCtx = pCanvas.getContext('2d');
    let particles = [];
    let particleAnimId;

    function resizeParticles() {
      pCanvas.width = window.innerWidth;
      pCanvas.height = window.innerHeight;
      createParticles();
    }

    function createParticles() {
      particles = [];
      const count = Math.floor((pCanvas.width * pCanvas.height) / 14000);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * pCanvas.width,
          y: Math.random() * pCanvas.height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          size: Math.random() * 1.2 + 0.4,
          opacity: Math.random() * 0.4 + 0.1
        });
      }
    }

    function animateParticles() {
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = pCanvas.width;
        if (p.x > pCanvas.width) p.x = 0;
        if (p.y < 0) p.y = pCanvas.height;
        if (p.y > pCanvas.height) p.y = 0;
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        pCtx.fillStyle = `rgba(16, 185, 129, ${p.opacity})`; // Emerald micro-glimmers
        pCtx.fill();
      }
      particleAnimId = requestAnimationFrame(animateParticles);
    }

    resizeParticles();
    window.addEventListener('resize', resizeParticles);
    animateParticles();

    // Cleanup logic
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('resize', resizeParticles);
      cancelAnimationFrame(animationFrameId);
      cancelAnimationFrame(particleAnimId);

      if (videoEl) {
        videoEl.removeEventListener('seeked', handleSeeked);
        videoEl.removeEventListener('stalled', handleStalled);
        videoEl.removeEventListener('loadeddata', handleLoadedData);
      }
    };
  }, []);

  return (
    <>
      <div id="scroll-video-container">
        <canvas id="video-canvas" ref={videoCanvasRef}></canvas>
        <video 
          id="video-fallback" 
          ref={videoFallbackRef}
          muted 
          playsInline 
          preload="auto" 
          crossOrigin="anonymous"
          src={VIDEO_URL}
        ></video>
        <div className="overlay"></div>
      </div>
      <canvas id="particles-canvas" ref={particlesCanvasRef}></canvas>
    </>
  );
}

export default BackgroundEffects;
