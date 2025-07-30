// Kitopi Phishing Awareness Slideshow Animations
// This script orchestrates the playback of nine interactive slides using GSAP.
// Each slide has its own timeline aligned roughly to the voice‑over durations
// provided by the user. Audio files are preloaded and played in sync with
// animations. When an audio track finishes, the next slide automatically
// begins. Timelines leverage subtle movements and fades to stay aligned with
// micro‑interaction best practices, ensuring animations delight but never
// distract【743934123290313†L79-L97】【743934123290313†L171-L176】.

document.addEventListener('DOMContentLoaded', () => {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const audios = [];
  for (let i = 1; i <= 9; i++) {
    audios.push(document.getElementById(`audio${i}`));
  }

  // Initialise tsParticles background.  The configuration defines a subtle
  // constellation of circles connected by faint lines. Colours are drawn
  // from the brand palette.  Interactivity is disabled so the particles
  // remain a passive background effect.  See
  // https://particles.js.org/docs/interfaces/Options.html for details.
  tsParticles.load('tsparticles', {
    fullScreen: { enable: false },
    detectRetina: true,
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 60, density: { enable: true, area: 600 } },
      color: { value: ['#96C78C', '#B98ACF'] },
      shape: { type: 'circle' },
      opacity: { value: 0.3 },
      size: { value: { min: 1, max: 4 } },
      links: {
        enable: true,
        distance: 120,
        color: '#ffffff',
        opacity: 0.15,
        width: 1,
      },
      move: {
        enable: true,
        speed: 0.5,
        direction: 'none',
        outMode: 'out',
      },
    },
    interactivity: {
      detectsOn: 'canvas',
      events: {
        onHover: { enable: false, mode: '' },
        onClick: { enable: false, mode: '' },
        resize: true,
      },
    },
    retina_detect: true,
  });

  // Prepare timelines for each slide
  const timelines = [];

  // Respect user preference for reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const repeatSmall = prefersReducedMotion ? 1 : 3;
  const repeatMedium = prefersReducedMotion ? 1 : 2;
  const repeatLarge = prefersReducedMotion ? 2 : 4;

  // Progress bar element and tween
  const progressBar = document.getElementById('progressBar');
  let progressTween;

  // Helper: deactivate all slides
  function hideAllSlides() {
    slides.forEach(slide => slide.classList.remove('active'));
  }

  // Slide 1: Opening Scene
  function createSlide1Timeline() {
    const tl = gsap.timeline({ paused: true });
    // Set initial states
    tl.set('#slide1 .background', { opacity: 0 });
    tl.set('#slide1 .logo', { opacity: 0, scale: 0.6 });
    tl.set('#slide1 .icon.envelope', { opacity: 0, scale: 0.6 });
    tl.set('#slide1 .icon.exclamation', { opacity: 0, scale: 0.6 });
    tl.set('#slide1 .urgent-text', { opacity: 0, scale: 0.9 });
    // Fade in gradient background (0–3 sec)
    tl.to('#slide1 .background', { opacity: 1, duration: 3 });
    // Kitopi logo enters (3–7 sec)
    tl.to('#slide1 .logo', { opacity: 1, scale: 1, duration: 1.5, ease: 'back.out(1.7)' }, '+=0.5');
    // Envelope and urgent text appear and pulse (7–13 sec)
    tl.to('#slide1 .icon.envelope', { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)' });
    tl.to('#slide1 .urgent-text', { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)' }, '<');
    // Pulse urgent text; repeat less if reduced motion is preferred
    tl.to('#slide1 .urgent-text', { scale: 1.1, duration: 0.5, yoyo: true, repeat: repeatSmall, ease: 'power1.inOut' });
    // Morph to exclamation mark (13–18 sec)
    tl.to('#slide1 .icon.envelope', { opacity: 0, scale: 0.6, duration: 0.5 });
    tl.to('#slide1 .icon.exclamation', { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)' });
    // Hold for a beat, then fade out everything (18–22 sec)
    tl.to('#slide1', { opacity: 0, duration: 1.5 }, '+=2');
    return tl;
  }

  // Slide 2: What is Phishing?
  function createSlide2Timeline() {
    const tl = gsap.timeline({ paused: true });
    // Define references to elements used in the timeline
    const phishingItem = document.querySelector('#slide2 .email-item.phishing');
    const preview = document.querySelector('#slide2 .email-preview');
    const dropdown = document.querySelector('#slide2 .report-dropdown');
    const dropdownOptions = dropdown.querySelectorAll('.option');
    const reportIcon = document.querySelector('#slide2 .report-icon');
    const cursorEl = document.querySelector('#slide2 .outlook-cursor');
    // Initial state: hide elements and prepare transforms
    tl.set('#slide2 .outlook-demo', { opacity: 0, y: 80, scale: 0.95, rotateX: -5 });
    tl.set('#slide2 .email-item', { opacity: 0, x: -40 });
    tl.set(preview, { opacity: 0, x: 20 });
    tl.set(cursorEl, { opacity: 0, x: -80, y: -40 });
    tl.set(dropdown, { opacity: 0, scale: 0.9, rotateX: -10, pointerEvents: 'none' });
    tl.set(dropdownOptions, { opacity: 0, y: -10 });
    // Accent colour for highlights
    const accent2 = varToRgb('--color-accent2');
    // Step 1: Outlook panel enters with a smooth rise and un-flip (0–2 sec)
    tl.to('#slide2 .outlook-demo', { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 1.5, ease: 'power3.out' });
    // Step 2: List items fly in from left with stagger (2–4.5 sec)
    tl.to('#slide2 .email-item', { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out', stagger: 0.3 }, '>-0.5');
    // Step 3: Cursor appears and glides to the phishing email (4.5–7 sec)
    tl.to(cursorEl, { opacity: 1, duration: 0.3 }, '>-0.3');
    tl.to(cursorEl, { x: 20, y: 90, duration: 2.0, ease: 'power3.inOut' });
    // Highlight the phishing email with a glow as the cursor approaches
    tl.add(() => { phishingItem.classList.add('glow'); });
    // Step 4: Select the phishing email, reveal preview, animate preview in (7–9.5 sec)
    tl.add(() => { phishingItem.classList.remove('glow'); phishingItem.classList.add('selected'); preview.classList.add('show'); }, '+=0.3');
    tl.to(preview, { opacity: 1, x: 0, duration: 1.2, ease: 'power2.out' });
    // Step 5: Sequentially highlight flagged text with cinematic emphasis (9.5–13 sec)
    tl.add(() => { document.querySelector('#slide2 .flag-email').classList.add('flag-highlight'); }, '+=0.5');
    tl.add(() => { document.querySelector('#slide2 .flag-urgent').classList.add('flag-highlight'); }, '+=0.5');
    tl.add(() => { document.querySelector('#slide2 .flag-link').classList.add('flag-highlight'); }, '+=0.5');
    // Brief pulse on all highlighted spans
    tl.to(['#slide2 .flag-email', '#slide2 .flag-urgent', '#slide2 .flag-link'], { scale: 1.07, duration: 0.6, yoyo: true, repeat: prefersReducedMotion ? 0 : 1, transformOrigin: '50% 50%', ease: 'power1.inOut' });
    // Step 6: Move cursor to report icon with an elegant curve; icon pulses on hover (13–15.5 sec)
    tl.to(cursorEl, { x: 250, y: -20, duration: 2.0, ease: 'power3.inOut' });
    tl.to(reportIcon, { scale: 1.2, duration: 0.4, yoyo: true, repeat: 1, ease: 'power1.inOut' }, '<0.5');
    // Step 7: Dropdown opens with 3D unfold; options appear with stagger (15.5–18 sec)
    tl.add(() => { dropdown.style.pointerEvents = 'auto'; });
    tl.to(dropdown, { opacity: 1, scale: 1, rotateX: 0, duration: 0.6, ease: 'back.out(1.7)' });
    tl.to(dropdownOptions, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.15 });
    // Step 8: Cursor moves down to the Phishing option and highlights it (18–20 sec)
    tl.to(cursorEl, { x: 220, y: 60, duration: 1.2, ease: 'power2.out' });
    tl.add(() => {
      if (dropdownOptions[1]) dropdownOptions[1].style.background = 'rgba(255, 255, 255, 0.12)';
    });
    // Step 9: Hold briefly then fade out the entire slide (20–21 sec)
    tl.to('#slide2', { opacity: 0, duration: 1.0 }, '+=0.5');
    return tl;
  }

  // Slide 3: Social Engineering Overview
  function createSlide3Timeline() {
    const tl = gsap.timeline({ paused: true });
    tl.set('#slide3 .title', { opacity: 0, y: -30 });
    tl.set('#slide3 .scenario-item', { opacity: 0, scale: 0.8, rotateY: 90 });
    tl.set('#slide3 .email-example', { opacity: 0, y: 30 });
    tl.set('#slide3 .note', { opacity: 0, scale: 0.9 });
    // Title fade in (0–4 sec)
    tl.to('#slide3 .title', { opacity: 1, y: 0, duration: 1.5 });
    // Scenarios pop in sequentially (4–10 sec)
    const scenarios = document.querySelectorAll('#slide3 .scenario-item');
    scenarios.forEach((item, index) => {
      tl.to(item, { opacity: 1, scale: 1, rotateY: 0, duration: 0.8, ease: 'back.out(1.7)' }, 3 + index * 1.5);
    });
    // Email examples slide upward and highlight suspicious text (10–17 sec)
    const emails = document.querySelectorAll('#slide3 .email-example');
    emails.forEach((el, index) => {
      tl.to(el, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 9 + index * 1.5);
    });
    // Note fades in and pulses (17–25 sec)
    tl.to('#slide3 .note', { opacity: 1, scale: 1, duration: 1 }, '+=1');
    tl.to('#slide3 .note', { scale: 1.05, duration: 0.6, yoyo: true, repeat: repeatSmall, ease: 'power1.inOut' });
    tl.to('#slide3', { opacity: 0, duration: 1.2 }, '+=0.5');
    return tl;
  }

  // Slide 4: Common Red Flags
  function createSlide4Timeline() {
    const tl = gsap.timeline({ paused: true });
    tl.set('#slide4 .email-card-large', { scale: 0.8, opacity: 0 });
    tl.set('#slide4 .flag-item', { y: 20, opacity: 0, rotateX: -90 });
    // Email zoom in (0–5 sec)
    tl.to('#slide4 .email-card-large', { scale: 1, opacity: 1, duration: 2, ease: 'power2.out' });
    // Flags appear sequentially with slight bounce (5–25 sec)
    const flags = document.querySelectorAll('#slide4 .flag-item');
    flags.forEach((flag, index) => {
      tl.to(flag, { y: 0, opacity: 1, rotateX: 0, duration: 0.8, ease: 'back.out(1.5)' }, 4 + index * 2);
    });
    // Fade out slide
    tl.to('#slide4', { opacity: 0, duration: 1.2 }, '+=1');
    return tl;
  }

  // Slide 5: What To Do
  function createSlide5Timeline() {
    const tl = gsap.timeline({ paused: true });
    // Set initial positions
    tl.set('#slide5 .cursor', { x: -100, y: -50, opacity: 1 });
    tl.set('#slide5 .steps .step', { opacity: 0 });
    // Cursor hovers over link (0–3 sec)
    // Move cursor towards the link-area
    const linkArea = document.querySelector('#slide5 .link-area');
    const linkRect = linkArea.getBoundingClientRect();
    // We'll approximate the movement using relative positions with percentages
    tl.to('#slide5 .cursor', { x: 50, y: 0, duration: 2, ease: 'power2.inOut' });
    tl.to('#slide5 .cursor', { x: 0, y: 0, duration: 1, ease: 'power2.inOut' });
    // Steps appear (3–19 sec)
    const steps = document.querySelectorAll('#slide5 .steps .step');
    steps.forEach((step, index) => {
      tl.to(step, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 3 + index * 2);
    });
    // Final idle pulse (19–22 sec)
    tl.to('#slide5 .steps .step:last-child', { scale: 1.05, duration: 0.6, yoyo: true, repeat: repeatMedium, ease: 'power1.inOut' }, '+=0.5');
    tl.to('#slide5', { opacity: 0, duration: 1.2 }, '+=0.5');
    return tl;
  }

  // Slide 6: Business Email Compromise
  function createSlide6Timeline() {
    const tl = gsap.timeline({ paused: true });
    tl.set('#slide6 .email-bec', { opacity: 0, y: 30 });
    tl.set('#slide6 .verify-msg', { opacity: 0 });
    // Email fades in (0–4 sec)
    tl.to('#slide6 .email-bec', { opacity: 1, y: 0, duration: 2, ease: 'power2.out' });
    // Highlight mismatch (4–10 sec) by pulsing the from-email
    tl.to('#slide6 .from-email', { scale: 1.1, duration: 0.6, yoyo: true, repeat: repeatLarge, ease: 'power1.inOut' }, '+=1');
    // Zoom on vendor payment line (10–15 sec)
    tl.to('#slide6 .email-bec p:nth-child(2)', { scale: 1.05, duration: 0.8, yoyo: true, repeat: repeatMedium, ease: 'power1.inOut' });
    // Verify message appears (15–20 sec)
    tl.to('#slide6 .verify-msg', { opacity: 1, duration: 1, ease: 'power2.out' });
    tl.to('#slide6 .verify-msg', { scale: 1.05, duration: 0.6, yoyo: true, repeat: prefersReducedMotion ? 0 : 1, ease: 'power1.inOut' });
    // Fade out
    tl.to('#slide6', { opacity: 0, duration: 1.2 }, '+=1');
    return tl;
  }

  // Slide 7: Social Engineering Examples
  function createSlide7Timeline() {
    const tl = gsap.timeline({ paused: true });
    tl.set('#slide7 .tile', { opacity: 0, y: 20, rotateY: -90 });
    tl.set('#slide7 .trust-text', { opacity: 0 });
    // Grid fades in (0–3 sec)
    tl.to('#slide7 .grid', { opacity: 1, duration: 1.5 });
    // Tiles animate sequentially (3–15 sec)
    const tiles = document.querySelectorAll('#slide7 .tile');
    tiles.forEach((tile, index) => {
      tl.to(tile, { opacity: 1, y: 0, rotateY: 0, duration: 0.8, ease: 'back.out(1.5)' }, 2 + index * 1.5);
    });
    // Trust text appears and pulses (15–20 sec)
    tl.to('#slide7 .trust-text', { opacity: 1, duration: 1 }, '+=0.5');
    tl.to('#slide7 .trust-text', { scale: 1.05, duration: 0.6, yoyo: true, repeat: repeatMedium, ease: 'power1.inOut' });
    tl.to('#slide7', { opacity: 0, duration: 1.2 }, '+=0.5');
    return tl;
  }

  // Slide 8: Final Tips
  function createSlide8Timeline() {
    const tl = gsap.timeline({ paused: true });
    tl.set('#slide8 .tips-list li', { opacity: 0, x: -40 });
    // Title fades in (0–3 sec)
    tl.fromTo('#slide8 .title', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 1.5 });
    // Tips appear sequentially (3–15 sec)
    const tips = document.querySelectorAll('#slide8 .tips-list li');
    tips.forEach((tip, index) => {
      tl.to(tip, { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' }, 2.5 + index * 2);
    });
    // Last tip pulses (15–20 sec)
    tl.to('#slide8 .tips-list li:last-child', { scale: 1.05, duration: 0.6, yoyo: true, repeat: repeatMedium, ease: 'power1.inOut' }, '+=0.5');
    tl.to('#slide8', { opacity: 0, duration: 1.2 }, '+=0.5');
    return tl;
  }

  // Slide 9: Closing Scene
  function createSlide9Timeline() {
    const tl = gsap.timeline({ paused: true });
    tl.set('#slide9 .employee-illustration', { scale: 0.8, opacity: 0 });
    tl.set('#slide9 .logo', { opacity: 0, scale: 0.8 });
    tl.set('#slide9 .cta-button', { opacity: 0, scale: 0.9 });
    // Illustration fades in (0–4 sec)
    tl.to('#slide9 .employee-illustration', { opacity: 1, scale: 1, duration: 2, ease: 'power2.out' });
    // Logo appears (4–8 sec)
    tl.to('#slide9 .logo', { opacity: 1, scale: 1, duration: 1.5, ease: 'back.out(1.7)' }, '+=0.5');
    // CTA buttons appear sequentially (8–12 sec)
    const buttons = document.querySelectorAll('#slide9 .cta-button');
    // CTA buttons stagger into view
    tl.to(buttons, { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)', stagger: 0.6 }, 7);
    // Pulse buttons (12–20 sec)
    tl.to('#slide9 .cta-button', { scale: 1.05, duration: 0.6, yoyo: true, repeat: repeatSmall, ease: 'power1.inOut' }, '+=1');
    // End: no fade-out, remain visible
    return tl;
  }

  // Utility to convert CSS variable color to actual value (for GSAP)
  function varToRgb(varName) {
    const fake = document.createElement('div');
    fake.style.color = `var(${varName})`;
    document.body.appendChild(fake);
    const cs = getComputedStyle(fake);
    const value = cs.color;
    fake.remove();
    return value;
  }

  // Build all timelines
  timelines[0] = createSlide1Timeline();
  timelines[1] = createSlide2Timeline();
  timelines[2] = createSlide3Timeline();
  timelines[3] = createSlide4Timeline();
  timelines[4] = createSlide5Timeline();
  timelines[5] = createSlide6Timeline();
  timelines[6] = createSlide7Timeline();
  timelines[7] = createSlide8Timeline();
  timelines[8] = createSlide9Timeline();

  let currentSlide = 0;

  function playSlide(index) {
    if (index >= slides.length) return;
    hideAllSlides();
    currentSlide = index;
    const slide = slides[index];
    slide.classList.add('active');
    const audio = audios[index];
    const tl = timelines[index];
    // Restart timeline
    // Adjust timeline speed to match audio duration if available. If we know
    // approximate durations (computed with Python), we can scale the timeline so
    // that the animations end when the narration does. This ensures the
    // presentation feels synchronised regardless of minor discrepancies in
    // recorded length.
    const audioDurations = [26.7, 23.95, 31.95, 21.95, 22.8, 22.15, 20.59, 22.99, 23.86];
    const timelineDuration = tl.duration();
    const targetDuration = audioDurations[index] || timelineDuration;
    tl.timeScale(timelineDuration / targetDuration);
    tl.restart();
    // Reset audio to start
    audio.currentTime = 0;
    // Attempt to play audio. Autoplay may fail in some browsers when the file
    // is loaded directly from disk. In that case we still run the timeline
    // and advance to the next slide after the targetDuration has elapsed.
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Audio started successfully; set up callback for end
          audio.onended = () => {
            playSlide(index + 1);
          };
        })
        .catch(() => {
          // Autoplay failed. Fallback to timer based on targetDuration
          audio.onended = null;
          setTimeout(() => {
            playSlide(index + 1);
          }, targetDuration * 1000);
        });
    } else {
      // Should not happen, but fallback to timer as well
      setTimeout(() => {
        playSlide(index + 1);
      }, targetDuration * 1000);
    }

    // Animate progress bar from current slide to next
    if (progressTween) progressTween.kill();
    const totalSlides = slides.length;
    const startPercent = (index / totalSlides) * 100;
    const endPercent = ((index + 1) / totalSlides) * 100;
    progressBar.style.width = `${startPercent}%`;
    progressTween = gsap.to(progressBar, {
      width: `${endPercent}%`,
      duration: targetDuration,
      ease: 'none',
    });
  }

  // Kick off the show after a brief delay to ensure assets are loaded
  setTimeout(() => playSlide(0), 500);
});