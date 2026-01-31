/*
 * Pro‑grade controller for the phishing awareness story.  This script
 * orchestrates five scenes within a 600×600 container and makes heavy
 * use of the supplied animation libraries.  The goal is to deliver a
 * polished, modern and futuristic narrative with subtle micro‑interactions
 * and robust state management.
 *
 * Libraries utilised:
 *   – GSAP: timelines and 3D transforms (envelope animation, logo)
 *   – Anime.js: smooth slide transitions and SVG morph interpolation
 *   – Typed.js: typed narrative across scenes
 *   – Flubber: morphing between two SVG paths in the finale
 *   – Popmotion: physics‑based motion for scribble jitter, domain bounce and colour cycling
 *   – Tsparticles: background particle system with interactive repulsion and click bursts
 *   – Rough.js: hand‑drawn scribbles behind the title, email highlight and list icons
 */

(() => {
  document.addEventListener('DOMContentLoaded', () => {
    // Store a reference to popmotion if loaded.  Many of the
    // physics‑driven animations rely on this library.  When
    // popmotion is undefined the code falls back to simple CSS
    // transitions.
    const popmotion = window.popmotion;
    // Grab all scenes from the DOM and set the current index.  Scenes
    // correspond to the narrative order defined in index.html.  If
    // there is a query parameter (?scene=3) in the URL we start
    // directly at that scene to facilitate linking to specific
    // portions of the experience.
    const scenes = Array.from(document.querySelectorAll('.scene'));
    let currentScene = 0;

    // Determine the starting scene from the URL.  The experience can
    // be embedded in an iFrame and launched directly into a specific
    // scene by using either `?scene=3`, `?scene3` or `?=scene3`.
    // Names are also supported (e.g. `?phishing` to jump to the
    // phishing examples).  If no recognised parameter is provided
    // the story starts from the beginning.
    (function determineStartScene() {
      const search = window.location.search.replace(/^\?/, '').toLowerCase();
      if (!search) return;
      // parse standard ?scene=NUMBER pattern
      const params = new URLSearchParams(window.location.search);
      let sceneParam = params.get('scene');
      // If a bare parameter like `?scene3` or `?=scene3` is used, extract it
      if (!sceneParam) {
        // The search string may look like 'scene3' or '=scene3' or 'phishing'
        // Remove any leading '=' and split on '&' to take the first token
        const token = search.replace(/^=/, '').split('&')[0];
        if (token.startsWith('scene')) {
          sceneParam = token.replace('scene', '');
        } else {
          sceneParam = token;
        }
      }
      if (!sceneParam) return;
      // Mapping of names or numbers to scene indices (1‑indexed)
      const nameMap = {
        '1': 1,
        '2': 2,
        '3': 3,
        '4': 4,
        '5': 5,
        '6': 6,
        '7': 7,
        '8': 8,
        '9': 9,
        'phishing-intro': 1,
        'phishing': 2,
        'social': 3,
        'redflags': 4,
        'common': 4,
        'feels-off': 5,
        'off': 5,
        'bec': 6,
        'examples': 7,
        'tips': 8,
        'closing': 9
      };
      const numeric = parseInt(sceneParam, 10);
      let sceneIndex;
      if (!isNaN(numeric)) {
        sceneIndex = numeric;
      } else if (nameMap.hasOwnProperty(sceneParam)) {
        sceneIndex = nameMap[sceneParam];
      }
      if (sceneIndex && sceneIndex > 0 && sceneIndex <= scenes.length - 1) {
        // Convert to zero‑based index.  We subtract one because
        // sceneIndex refers to post‑welcome scenes (welcome is index 0).
        currentScene = sceneIndex;
      }
    })();

    // Typed.js instances created within individual scenes.  These
    // references are stored here so that they can be cleaned up when
    // switching scenes.  Without destroying the instances the cursor
    // may linger or memory leaks can occur.
    let typedIntro = null;
    let typedEmail = null;
    // Additional typed instance for final scenes if ever used
    let typedFinal = null;
    // Handle for carousel auto cycle – defined here so cleanup can clear it
    let carouselInterval = null;
    // Additional typed instances can be added here as new scenes make
    // use of typing effects.

    // Timer handles used to ensure each scene has sufficient run time.
    // They are cleared on scene change to prevent stray animations.
    let sceneTimers = [];

    // Preload audio for every scene.  There are nine scenes plus the
    // welcome screen, so we load ten files.  Volume is set to a
    // modest level to allow the narrator’s voice to stand out.
    const sceneAudios = [];
    const audioFiles = [
      'Welcoming.wav',   // scene1
      'slide1.wav',      // scene2
      'slide2.wav',      // scene3
      'slide3.wav',      // scene4
      'slide4.wav',      // scene5
      'slide5.wav',      // scene6
      'slide6.wav',      // scene7
      'slide7.wav',      // scene8
      'slide8.wav',      // scene9
      'slide9.wav'       // scene10 (closing)
    ];
    audioFiles.forEach(f => {
      const a = new Audio(`Audio/${f}`);
      a.volume = 0.45;
      a.loop = false;
      sceneAudios.push(a);
    });
    function playSceneAudio(idx) {
      sceneAudios.forEach((a, i) => {
        if (i === idx) {
          try {
            a.currentTime = 0;
            a.play();
          } catch (e) {
            console.warn('Audio error', e);
          }
        } else {
          a.pause();
        }
      });
    }

    // Resolve CSS custom properties that inform our colour palette.  If
    // the CSS variables are missing (for example when JS loads before
    // the stylesheet) default values are provided.  These colours are
    // used throughout the animations for highlights, warnings and
    // critical messages.
    const rootStyles = getComputedStyle(document.documentElement);
    const colorAccent = rootStyles.getPropertyValue('--accent').trim() || '#3bb273';
    const colorWarning = rootStyles.getPropertyValue('--warning').trim() || '#f39c12';
    const colorDanger = rootStyles.getPropertyValue('--danger').trim() || '#e74c3c';

    /**
     * Hide all scenes except the one specified.  This function
     * gracefully fades out the previous scene while fading in the new
     * one.  Prior animations and timers are cancelled via
     * cleanupScenes() before the new scene begins.  The optional
     * 'noAnim' flag allows an immediate show (used on initial load).
     *
     * @param {number} idx – zero‑based index of the scene to show
     * @param {boolean} [noAnim] – if true, skip transitions
     */
    function showScene(idx, noAnim = false) {
      idx = Math.max(0, Math.min(idx, scenes.length - 1));
      const prev = scenes[currentScene];
      const next = scenes[idx];
      if (prev && prev !== next) {
        // When transitioning away from a scene, immediately remove the
        // `active` class and hide it.  This prevents elements from
        // bleeding into the next scene during the fade in/out.  The
        // graceful fade animation is still performed on the DOM node
        // itself but without the `active` class the CSS rules tied
        // to `.scene.active` no longer apply.  Once the fade
        // completes the inline styles are cleared.
        prev.classList.remove('active');
        if (noAnim) {
          prev.style.display = 'none';
        } else {
          gsap.to(prev, {
            opacity: 0,
            y: -20,
            duration: 0.6,
            ease: 'power1.in',
            onComplete: () => {
              prev.style.display = 'none';
              prev.style.opacity = '';
              prev.style.transform = '';
            }
          });
        }
      }
      // Cancel any lingering typed or timers
      cleanupScenes();
      // Show next scene
      next.style.display = 'block';
      next.classList.add('active');
      if (noAnim) {
        next.style.opacity = 1;
        next.style.transform = '';
      } else {
        gsap.fromTo(next, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power1.out' });
      }
      currentScene = idx;
      runScene(idx);
      playSceneAudio(idx);
    }

    // Attach navigation events to the forward/back buttons.  The
    // last scene uses the "Finish" button to simply do nothing or
    // optionally close the experience.
    // Attach listeners once to avoid duplicate handlers when the
    // script is reloaded during development.  If handlers already
    // exist they are replaced via event assignment rather than
    // addEventListener.
    document.querySelectorAll('.next-btn').forEach(btn => {
      btn.onclick = () => showScene(currentScene + 1);
    });
    document.querySelectorAll('.prev-btn').forEach(btn => {
      btn.onclick = () => showScene(currentScene - 1);
    });

    /**
     * Reset animations and DOM state from all scenes.  This function
     * should cancel timers, clear typed text, reset transforms and
     * remove any dynamically created elements such as hooks or
     * scribbles.  It is called before entering a new scene.
     */
    function cleanupScenes() {
      // Clear any scene timers
      sceneTimers.forEach(t => clearTimeout(t));
      sceneTimers = [];
      // Destroy typed instances
      if (typedIntro) {
        typedIntro.destroy();
        typedIntro = null;
      }
      if (typedEmail) {
        typedEmail.destroy();
        typedEmail = null;
      }
      // Destroy any final typed instance if used
      if (typeof typedFinal !== 'undefined' && typedFinal) {
        try {
          typedFinal.destroy();
        } catch (e) {}
        typedFinal = null;
      }
      // Clear carousel auto‑cycle
      if (typeof carouselInterval !== 'undefined' && carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
      }
      // Reset envelope
      const envelopeTop = document.getElementById('envelopeTop');
      if (envelopeTop) {
        gsap.set(envelopeTop, { rotationX: 0 });
      }
      // Reset the email card rotation so that the front face shows
      // when returning to the email scene.  Without this the card
      // may remain flipped (rotationY = 180) from a previous visit.
      const emailCardEl = document.getElementById('emailCard');
      if (emailCardEl) {
        gsap.set(emailCardEl, { rotationY: 0 });
      }
      const emailContent = document.getElementById('emailContent');
      if (emailContent) {
        emailContent.style.opacity = 0;
        emailContent.style.transform = 'translateY(20px)';
        const scribbleSvg = document.getElementById('emailScribble');
        if (scribbleSvg) scribbleSvg.innerHTML = '';
        const emailTyped = document.getElementById('emailTyped');
        if (emailTyped) emailTyped.innerHTML = '';
      }
      // Remove phishing samples
      const phishSamples = document.getElementById('phishSamples');
      if (phishSamples) {
        phishSamples.innerHTML = '';
      }
      // Reset carousel content
      const seCarousel = document.getElementById('seCarousel');
      const carouselIndicators = document.getElementById('carouselIndicators');
      if (seCarousel) seCarousel.innerHTML = '';
      if (carouselIndicators) carouselIndicators.innerHTML = '';
      // Reset steps
      const stepsContainer = document.getElementById('stepsContainer');
      if (stepsContainer) stepsContainer.innerHTML = '';
      // Reset BEC container
      const becContainer = document.getElementById('becContainer');
      if (becContainer) becContainer.innerHTML = '';
      // Reset examples
      const examplesContainer = document.getElementById('examplesContainer');
      if (examplesContainer) examplesContainer.innerHTML = '';
      // Reset red flags
      const redFlagsContainer = document.getElementById('redFlagsContainer');
      if (redFlagsContainer) redFlagsContainer.innerHTML = '';
      // Reset tips
      const tipsContainer = document.getElementById('tipsContainer');
      if (tipsContainer) tipsContainer.innerHTML = '';
      // Reset closing
      const closingContainer = document.getElementById('closingContainer');
      if (closingContainer) closingContainer.innerHTML = '';

      // Reset final morph path and stop colour cycling
      const finalPathEl = document.getElementById('finalMorphPath');
      if (finalPathEl) {
        finalPathEl.setAttribute('d', '');
        finalPathEl.removeAttribute('style');
      }
      if (typeof finalColorController !== 'undefined' && finalColorController) {
        finalColorController.stop();
        finalColorController = null;
      }
    }


    /**
     * Helper for manual typed effect when Typed.js is unavailable.  It
     * progressively reveals an array of strings line by line with a
     * configurable character speed and delay between lines.  HTML tags
     * within the lines are preserved.  A callback triggers once all
     * lines have finished.
     *
     * @param {HTMLElement} el – container whose innerHTML will be filled
     * @param {string[]} lines – array of strings (may include HTML tags)
     * @param {number} speed – milliseconds between character reveals
     * @param {number} lineDelay – delay between lines in milliseconds
     * @param {Function} [callback] – executed after the last line finishes
     */
    function typeEffect(el, lines, speed = 40, lineDelay = 800, callback) {
      let lineIndex = 0;
      el.innerHTML = '';
      function typeLine() {
        const line = lines[lineIndex];
        // Create a span to hold this line
        const span = document.createElement('span');
        el.appendChild(span);
        let charIndex = 0;
        function typeChar() {
          // Append next character to the span.  This naïvely slices the
          // string but still preserves any embedded HTML tags, which will
          // appear gradually.  For complex markup this may reveal tags
          // character by character, but for our simple usage with
          // <strong> and <br> tags it suffices.
          span.innerHTML = line.slice(0, charIndex + 1);
          charIndex++;
          if (charIndex < line.length) {
            setTimeout(typeChar, speed);
          } else {
            lineIndex++;
            if (lineIndex < lines.length) {
              // Append a line break element between lines
              el.appendChild(document.createElement('br'));
              setTimeout(typeLine, lineDelay);
            } else if (callback) {
              callback();
            }
          }
        }
        typeChar();
      }
      typeLine();
    }

    // (Removed duplicate event attachment handled earlier)

    /* (Duplicate cleanupScenes definition removed – logic merged into the primary cleanupScenes above) */

    /**
     * Initialise the background using Vanta Waves.  This provides a
     * modern, dynamic water‑like surface in 3D that reacts to mouse
     * movement.  Should Vanta fail to load, the experience gracefully
     * falls back to the default background colour defined in CSS.
     */
    /**
     * Initialise a dynamic background using one of the included Vanta
     * visualisations.  The previous implementation relied on the
     * Waves effect with a very subtle configuration which made it
     * difficult to perceive.  To increase the sense of motion and
     * depth we now attempt to initialise the Halo effect instead.  It
     * draws a rotating halo of particles that react to mouse movement
     * and better complements the dark teal palette.  Should Halo not
     * be available (for example if the script fails to load) we
     * gracefully fall back to the Waves effect with boosted values.
     */
    try {
      if (window.VANTA && window.VANTA.DOTS) {
        // Use the DOTS effect for a clear, dynamic background of moving
        // particles.  The spacing controls the density of the grid and
        // the colour palette ties into Kitopi’s green accent.
        window.VANTA.DOTS({
          el: '#tsparticles',
          mouseControls: true,
          touchControls: true,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          color: 0x3bb273,
          backgroundColor: 0x003d45,
          spacing: 30.0,
          showLines: true
        });
      } else if (window.VANTA && window.VANTA.HALO) {
        window.VANTA.HALO({
          el: '#tsparticles',
          mouseControls: true,
          touchControls: true,
          baseColor: 0x0f2d33,
          backgroundColor: 0x003d45,
          size: 1.2,
          amplitudeFactor: 0.4
        });
      } else if (window.VANTA && window.VANTA.WAVES) {
        // Fallback to Waves with more pronounced motion and colour
        window.VANTA.WAVES({
          el: '#tsparticles',
          color: 0x0d444d,
          shininess: 80,
          waveHeight: 35,
          waveSpeed: 0.8,
          zoom: 0.85
        });
      }
    } catch (e) {
      console.warn('Vanta background init error', e);
    }

    // We no longer initialise a hand‑drawn scribble for the intro.  Instead,
    // concentric rings are created in runScene1() for a cleaner, modern
    // aesthetic.  The previous scribble initialisation is removed.

    /**
     * Primary dispatcher for scene specific logic.  Each case
     * corresponds to a function that constructs the view, kicks off
     * animations and sets timers.  When adding new scenes be sure to
     * implement the corresponding runX() function and update the
     * audio file list accordingly.
     *
     * @param {number} idx – index of the scene to initialise
     */
    function runScene(idx) {
      switch (idx) {
        case 0:
          runScene1();
          break;
        case 1:
          runScene2();
          break;
        case 2:
          runScene3();
          break;
        case 3:
          runScene4();
          break;
        case 4:
          // New scene for common red flags
          runCommonRedFlags();
          break;
        case 5:
          runScene5();
          break;
        case 6:
          runScene6();
          break;
        case 7:
          runScene7();
          break;
        case 8:
          runScene8();
          break;
        case 9:
          runScene9();
          break;
        default:
          break;
      }
    }

    /**
     * Scene 1 (Welcome): Large logo, animated scribble and typed
     * introduction.  The scribble gently oscillates on the X axis.
     */
    function runScene1() {
      // New welcome animation for the redesigned intro.  Fade in the title,
      // sequentially reveal the THINK/CHECK/REPORT words and finally the
      // start button.  The previous ring and logo animations are
      // removed in favour of a cleaner presentation.
      const sceneEl = scenes[0];
      const title = sceneEl.querySelector('.main-title');
      const words = sceneEl.querySelectorAll('.link-text');
      const startBtn = sceneEl.querySelector('.start-btn');
      if (!title || !words || !startBtn) return;

      // Attempt to auto‑play the welcome narration.  Browsers often
      // block unmuted audio until a user gesture occurs, so we
      // temporarily mute the audio, trigger playback, then unmute
      // shortly afterwards.  If the audio is already playing the
      // following block will have no effect.  Wrapping in a try/catch
      // suppresses any promise rejection from failed autoplay.
      try {
        const welcomeAudio = sceneAudios && sceneAudios[0];
        if (welcomeAudio && welcomeAudio.paused) {
          welcomeAudio.muted = true;
          const playPromise = welcomeAudio.play();
          if (playPromise && typeof playPromise.then === 'function') {
            playPromise.catch(() => {});
          }
          // Unmute after a short delay.  Use setTimeout instead of
          // async/await to avoid blocking.  A 200 ms delay is
          // sufficient for most browsers to register the initial play.
          setTimeout(() => {
            welcomeAudio.muted = false;
          }, 200);
        }
      } catch (e) {
        // swallow errors silently
      }
      // Reset initial opacity, position and scale on each run.  The
      // words may have been scaled on a previous visit to this scene so
      // explicitly reset both the scale and the font size to their
      // defaults.  Without this the next entrance could inherit a
      // transformed state and render incorrectly.
      gsap.set(title, { opacity: 0, y: 20 });
      // Reset the words to their large final size immediately.  The
      // original prototype sets each word at 275px, so we specify
      // that here rather than growing them via animation.  This
      // prevents the letters from scaling out of the 600×600 frame
      // during the intro.
      gsap.set(words, { opacity: 0, y: 20, scale: 1, fontSize: '130px' });
      gsap.set(startBtn, { opacity: 0, y: 20 });
      const tl = gsap.timeline();
      // Phase 1: fade in the main title
      tl.to(title, { opacity: 1, y: 0, duration: 1.8, ease: 'power2.out' });
      // Hold the title on screen briefly before transitioning to the next phase
      tl.to(title, { opacity: 1, duration: 1.2 });
      // Fade the title out and slide it upward to make room for the big words
      tl.to(title, { opacity: 0, y: -40, duration: 1.2, ease: 'power2.inOut' });
      // After hiding the title via opacity, remove it from layout
      tl.set(title, { display: 'none' });
      // Phase 2: bring in THINK, CHECK, REPORT.  Reveal them with a stagger
      // and then increase their font size to dominate the frame.  Using
      // font‑size instead of a transform avoids distortions on the
      // outline stroke that would otherwise occur when scaling.  A
      // moderate increase to ~120px ensures the words fill the frame
      // without overflowing.
      tl.to(words, { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out', stagger: 0.4 }, '-=0.8');
      // Final phase: bring in the start button once the words have
      // faded in.  Slight delay gives viewers time to absorb the words.
      tl.to(startBtn, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '+=0.8');
    }

    /**
     * Scene 2 (Email demonstration): The user unfolds a digital
     * envelope, watches an email being typed out and then sees the
     * card flip to reveal a sender‑domain mismatch.  A hand drawn
     * rectangle highlights the dodgy link and the card flips after
     * typing finishes plus a short delay.
     */
    function runScene2() {
      const card = document.getElementById('emailCard');
      const emailContent = document.getElementById('emailContent');
      if (!card || !emailContent) return;
      // Reset any previous flip so the front face is visible on each
      // visit to this scene.  Use GSAP to remove any residual
      // rotation applied during a prior visit.  Resetting the
      // rotation explicitly avoids relying on CSS classes which may
      // conflict with inline transforms set by GSAP.
      // Reset the flip rotation on the inner wrapper.  If the inner
      // wrapper exists use it; otherwise reset the card itself.
      const inner = card.querySelector('.card-inner') || card;
      gsap.set(inner, { rotationY: 0 });

      // Ensure the front email content is visible on each run and
      // clear any previously typed text or scribbles.  With the new
      // flip design we no longer need to manually hide the back; the
      // back remains hidden by the 3D transform until the card is
      // flipped.
      if (emailContent) {
        emailContent.style.opacity = '1';
      }
      const emailElReset = document.getElementById('emailTyped');
      if (emailElReset) emailElReset.innerHTML = '';
      const scribbleSvgReset = document.getElementById('emailScribble');
      if (scribbleSvgReset) scribbleSvgReset.innerHTML = '';
      // Animate the card appearing from a small scale.  Unlike the
      // original envelope animation this directly reveals the glass
      // card in the centre of the scene.
      gsap.fromTo(card, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, ease: 'back.out(1.7)' });
      // Animate the content container from below to give a subtle rise
      // effect.  Delay slightly to follow the card pop animation.
      gsap.fromTo(emailContent, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out', delay: 0.6 });
      // Define the hook email used in the introduction.  This HR themed
      // message mirrors the narrative script, creating a sense of
      // urgency and curiosity.  The suspicious link uses an
      // off‑brand domain which will later be highlighted and the card
      // will flip to reveal the mismatch.
      const emailLines = [
        'From: <strong>hr@kitopi.com</strong>',
        'To: <strong>you@kitopi.com</strong>',
        'Subject: <strong>Your role is affected – urgent update</strong>',
        '',
        'Dear Team Member,',
        'Due to some changes, your role may be affected.',
        'Please confirm your status within 24 hours by visiting:',
        '<span class="email-domain">https://kitopi-employee-services.work</span>',
      ];
      const emailEl = document.getElementById('emailTyped');
      typeEffect(emailEl, emailLines, 25, 600, () => {
        highlightSuspiciousDomain();
        // After typing and highlighting complete, cross‑fade from the
        // front email content to the mismatch card.  This avoids
        // complex 3D transformations which can leave the card stuck
        // flipped on subsequent visits.  A slight delay allows
        // viewers to register the highlight before the transition.
        // After typing and highlighting complete, flip the card to reveal
        // the mismatch message.  A brief pause allows viewers to
        // register the suspicious domain highlight before the card
        // flips.  The flip is triggered by adding the `flipped` class
        // to the card container, which rotates the inner wrapper via
        // CSS.  No manual opacity transitions are required.
        sceneTimers.push(setTimeout(() => {
          // Flip the card using GSAP.  Combining the rotation with
          // existing scale transforms ensures that the flip occurs
          // seamlessly without being overridden by inline styles.
          flipEmailCard();
        }, 3200));
      });

      // Add a gentle tilt effect to the front face of the email card.  This
      // tilt does not interfere with the flipping animation because it is
      // applied only to the card front.  When the mouse moves over the
      // front face the card subtly rotates around its X and Y axes.
      const frontFace = card.querySelector('.card-front');
      if (frontFace && !frontFace.dataset.tiltBound) {
        frontFace.dataset.tiltBound = 'true';
        frontFace.style.transition = 'transform 0.3s ease-out';
        frontFace.addEventListener('mousemove', function (e) {
          const rect = frontFace.getBoundingClientRect();
          const xNorm = (e.clientX - rect.left) / rect.width - 0.5;
          const yNorm = (e.clientY - rect.top) / rect.height - 0.5;
          const rotateX = (-yNorm * 8).toFixed(2);
          const rotateY = (xNorm * 8).toFixed(2);
          frontFace.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        frontFace.addEventListener('mouseleave', function () {
          frontFace.style.transform = '';
        });
      }
      // No need to lock the next button; the animated email sequence
      // continues even if the user proceeds to the next slide.  We
      // intentionally avoid disabling the button to keep navigation
      // responsive.

      // Bind tilt animation to the vortex card container so the entire
      // card assembly rotates slightly in response to mouse movement.  A
      // shared easing function provides smooth easing when the pointer
      // leaves the card area.  Each container stores its own easing
      // state to avoid interference across multiple instances.
      const wrapper = document.getElementById('emailCardWrapper');
      if (wrapper && !wrapper.dataset.tiltBound) {
        wrapper.dataset.tiltBound = 'true';
        let animationFrame;
        let easingActive = false;
        const easeOutQuad = (t) => t * (2 - t);
        function animateEasing(startX, startY, endX, endY, duration) {
          const startTime = performance.now();
          function animate(time) {
            const progress = Math.min((time - startTime) / duration, 1);
            const eased = easeOutQuad(progress);
            const currentX = startX + (endX - startX) * eased;
            const currentY = startY + (endY - startY) * eased;
            wrapper.style.setProperty('--xv', currentX);
            wrapper.style.setProperty('--yv', currentY);
            if (progress < 1) {
              animationFrame = requestAnimationFrame(animate);
            } else {
              easingActive = false;
            }
          }
          easingActive = true;
          cancelAnimationFrame(animationFrame);
          animationFrame = requestAnimationFrame(animate);
        }
        wrapper.addEventListener('mousemove', function (e) {
          if (easingActive) return;
          const rect = wrapper.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          // Map cursor position to rotation values.  The range ±8
          // degrees creates a restrained but noticeable tilt.
          const rotateX = ((y / rect.height) - 0.5) * 8;
          const rotateY = ((x / rect.width) - 0.5) * 8;
          const currentX = parseFloat(getComputedStyle(wrapper).getPropertyValue('--xv')) || 0;
          const currentY = parseFloat(getComputedStyle(wrapper).getPropertyValue('--yv')) || 0;
          animateEasing(currentX, currentY, rotateX, rotateY, 120);
        });
        wrapper.addEventListener('mouseleave', () => {
          const currentX = parseFloat(getComputedStyle(wrapper).getPropertyValue('--xv')) || 0;
          const currentY = parseFloat(getComputedStyle(wrapper).getPropertyValue('--yv')) || 0;
          animateEasing(currentX, currentY, 0, 0, 200);
        });
      }
    }

    /**
     * Flip the email card to reveal the domain mismatch card.  Uses
     * GSAP to rotate the container around the Y axis and toggles
     * appropriate classes for the front/back faces.
     */
    function flipEmailCard() {
      const card = document.getElementById('emailCard');
      if (!card) return;
      // Rotate the inner wrapper rather than the outer card.  The outer
      // card receives GSAP transforms (scale) during showScene2(), so
      // applying a rotation there would be overridden.  Instead we
      // target the `card-inner` element for the flip.  If the inner
      // wrapper is missing fall back to rotating the card itself.
      const inner = card.querySelector('.card-inner') || card;
      gsap.to(inner, {
        rotationY: 180,
        duration: 1.0,
        ease: 'power2.inOut'
      });
    }

    /**
     * Draw a rough rectangle around the suspicious domain and animate it.
     * Also applies a bounce effect to the domain text.
     */
    function highlightSuspiciousDomain() {
      const domainSpan = document.querySelector('#emailContent .email-domain');
      const emailContent = document.getElementById('emailContent');
      const scribbleSvg = document.getElementById('emailScribble');
      if (!domainSpan || !emailContent || !scribbleSvg) return;
      // Delay the highlight slightly to ensure the DOM has updated and sizes are accurate
      setTimeout(() => {
        const domainRect = domainSpan.getBoundingClientRect();
        const containerRect = emailContent.getBoundingClientRect();
        const x = domainRect.left - containerRect.left;
        const y = domainRect.top - containerRect.top;
        const width = domainRect.width;
        const height = domainRect.height;
        // Prepare the rough SVG
        scribbleSvg.innerHTML = '';
        const rSvg = rough.svg(scribbleSvg);
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const rect = rSvg.rectangle(x - 4, y - 4, width + 8, height + 8, {
          stroke: colorWarning,
          strokeWidth: 2,
          roughness: 2,
          fill: 'transparent'
        });
        group.appendChild(rect);
        scribbleSvg.appendChild(group);
        // Animate the rough rectangle popping into place
        gsap.fromTo(group, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)' });
        // Bounce the domain text slightly using Popmotion if available
        if (popmotion && popmotion.styler) {
          const domainStyler = popmotion.styler(domainSpan);
          popmotion.animate({
            from: 1,
            to: 1.12,
            duration: 250,
            repeat: 1,
            yoyo: true,
            ease: popmotion.easing.easeOut,
            onUpdate: v => domainStyler.set('scale', v)
          });
        }
      }, 50);
    }

    /**
     * Scene 3 (Phishing samples): Three fake notifications appear one
     * after another, each carried by a stylised hook.  Each card
     * slides in from the top while a hook graphic drops down and
     * tilts the card slightly to emphasise manipulation.  After all
     * samples are shown they remain on screen for the remainder of
     * the scene.  The notification texts reflect real‑world
     * phishing lures described in the voiceover.
     */
    function runScene3() {
      const container = document.getElementById('phishSamples');
      if (!container) return;
      // Define the fake message previews that will appear in the inbox.  Each
      // object contains a short subject line and a one‑line snippet to
      // simulate the preview text shown in email clients.  The icon
      // indicates the type of lure and is coloured using CSS.
      const samples = [
        {
          subject: 'Your account has been locked',
          preview: 'We detected suspicious activity. Verify now to unlock.',
          icon: '🔒'
        },
        {
          subject: 'Surprise salary revision!',
          preview: 'Congrats! Review your new payslip right here.',
          icon: '💰'
        },
        {
          subject: 'Your performance review is ready',
          preview: 'Click to see your feedback and next steps.',
          icon: '📅'
        }
      ];
      // Build each sample and animate it.  We previously included a
      // phishing hook graphic that dropped down and snagged the
      // notification card.  This concept proved confusing and
      // visually awkward.  Instead we now present each message as a
      // slick card that slides gracefully into place with a slight
      // bounce.  Cards appear sequentially every two seconds.
      samples.forEach((item, index) => {
        const card = document.createElement('div');
        card.classList.add('phish-sample');
        card.innerHTML = `
          <div class="icon">${item.icon}</div>
          <div class="text-wrapper">
            <div class="phish-subject">${item.subject}</div>
            <div class="phish-preview">${item.preview}</div>
          </div>
        `;
        // Start slightly above and scaled down for entry animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(-40px) scale(0.95)';
        container.appendChild(card);
        // Stagger the entrance of each card.  Use a modest delay to keep
        // the scene lively yet digestible.
        const delay = index * 2000;
        sceneTimers.push(setTimeout(() => {
          gsap.to(card, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.0,
            ease: 'back.out(1.5)'
          });
        }, delay));
      });
      // Cards remain visible once animated.  Navigation remains
      // responsive; the animations continue even if the viewer moves
      // ahead.
    }

    /**
    /**
     * Scene 4 (Social Engineering Tactics): Presents a series of
     * panels explaining how social engineering extends beyond
     * phishing.  Six slides are created based on the narrator’s
     * script.  Each slide automatically animates in every 4 seconds
     * with a 3D flip and translation.  Indicators below allow manual
     * navigation.  The scene disables the Next button until the
     * minimum runtime has elapsed.
     */
    function runScene4() {
      // Initialise the custom blog slider for social engineering.
      const slider = document.getElementById('seBlogSlider');
      if (!slider) return;
      const wrapper = slider.querySelector('.blog-slider__wrp');
      const slides = Array.from(wrapper.children);
      const pagination = slider.querySelector('.blog-slider__pagination');
      // Clear any existing bullets (in case of revisits)
      pagination.innerHTML = '';
      const bullets = [];
      slides.forEach((slide, idx) => {
        const bullet = document.createElement('span');
        bullet.classList.add('bullet');
        bullet.addEventListener('click', () => {
          clearInterval(carouselInterval);
          show(idx);
        });
        pagination.appendChild(bullet);
        bullets.push(bullet);
      });
      let currentIndex = 0;
      function show(i) {
        // clamp index
        if (i < 0) i = slides.length - 1;
        if (i >= slides.length) i = 0;
        slides[currentIndex].classList.remove('active');
        bullets[currentIndex].classList.remove('active');
        currentIndex = i;
        slides[currentIndex].classList.add('active');
        bullets[currentIndex].classList.add('active');
      }
      // Show first slide
      show(0);
      // Auto cycle every 4 seconds to keep the narrative moving
      carouselInterval = setInterval(() => {
        show(currentIndex + 1);
      }, 4000);
    }

    /**
     * Scene 5b (Common Red Flags): Present a list of common
     * indicators that an email is malicious.  Five items appear
     * sequentially with icons and short descriptions.  This scene
     * replaces the need for long paragraphs and instead lets the
     * voiceover provide context while the viewer watches each flag
     * fade in.
     */
    function runCommonRedFlags() {
      const container = document.getElementById('redFlagsContainer');
      if (!container) return;
      // Ensure the container is empty
      container.innerHTML = '';
      const flags = [
        { icon: '🚨', text: 'Urgency – “Immediate action required”' },
        { icon: '📧', text: 'Suspicious senders – addresses that don’t match the name' },
        { icon: '🔗', text: 'Unexpected links or attachments – especially .zip or .html files' },
        { icon: '🚩', text: 'Requests for login, passwords or money – big red flag' },
        { icon: '📝', text: 'Spelling errors or strange formatting – often a giveaway' }
      ];
      flags.forEach((flag, idx) => {
        const item = document.createElement('div');
        item.classList.add('flag-item');
        const iconSpan = document.createElement('span');
        iconSpan.classList.add('flag-icon');
        iconSpan.textContent = flag.icon;
        const textSpan = document.createElement('span');
        // Use innerHTML to allow future markup in the description
        textSpan.innerHTML = flag.text;
        item.appendChild(iconSpan);
        item.appendChild(textSpan);
        item.style.opacity = '0';
        container.appendChild(item);
        // Animate each flag into view with a slight delay
        sceneTimers.push(setTimeout(() => {
          gsap.fromTo(item, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power2.out' });
        }, 600 + idx * 1600));
      });
    }

    /**
     * Scene 5 (When Something Feels Off): Demonstrate the correct
     * response when a link seems suspicious.  A pointer hovers over a
     * link and pauses.  Then a list of actionable steps fades in.
     */
    function runScene5() {
      const container = document.getElementById('stepsContainer');
      if (!container) return;
      // Build a mini demonstration: a line of text with a fake link
      const demoWrapper = document.createElement('div');
      demoWrapper.style.position = 'relative';
      demoWrapper.style.padding = '16px';
      demoWrapper.style.marginBottom = '24px';
      demoWrapper.style.background = 'rgba(255,255,255,0.05)';
      demoWrapper.style.borderRadius = '8px';
      const demoText = document.createElement('p');
      demoText.innerHTML = 'Hi, please check your <a href="#" class="demo-link">salary update</a>.';
      demoText.style.color = '#fff';
      demoWrapper.appendChild(demoText);
      // Pointer image.  Reduce its footprint and start slightly off
      // screen so the glide feels more intentional.  A smaller width
      // prevents the pointer from overpowering the text, and the
      // initial top/left positions keep it out of view until the
      // animation begins.
      const pointer = document.createElement('img');
      pointer.src = 'Images/handpointer-01.svg';
      pointer.alt = 'Pointer';
      pointer.style.position = 'absolute';
      pointer.style.width = '32px';
      pointer.style.top = '20px';
      pointer.style.left = '0px';
      pointer.style.opacity = '0';
      demoWrapper.appendChild(pointer);
      container.appendChild(demoWrapper);
      // Animate pointer approaching the link
      const linkEl = demoWrapper.querySelector('.demo-link');
      // Wait a bit before starting pointer animation
      sceneTimers.push(setTimeout(() => {
        if (!linkEl) return;
        // Compute pointer dimensions once appended
        const pointerW = pointer.offsetWidth || 32;
        const pointerH = pointer.offsetHeight || 32;
        // Measure positions relative to the wrapper so that the
        // pointer lands directly above the link and centred.
        const linkRect = linkEl.getBoundingClientRect();
        const wrapRect = demoWrapper.getBoundingClientRect();
        const endX = linkRect.left - wrapRect.left + (linkRect.width - pointerW) / 2;
        // Position the pointer slightly above the link so it does not
        // obscure the text.  Reduce the vertical offset to align
        // closer to the link underline.  Using half the pointer
        // height ensures the pointer tip appears to touch the link.
        const endY = linkRect.top - wrapRect.top - pointerH * 0.5 - 4;
        gsap.to(pointer, {
          opacity: 1,
          x: endX,
          y: endY,
          duration: 1.5,
          ease: 'power2.out',
          onComplete: () => {
            // Gently pulse the pointer to draw attention without
            // misrepresenting the user's actual cursor.  The pointer
            // scales down and back up to simulate a click or pause.
            gsap.to(pointer, {
              scale: 0.9,
              duration: 0.3,
              yoyo: true,
              repeat: 1,
              onComplete: () => {
                // After the pointer pulses, display a pause overlay
                // on the demonstration card.  This overlay greys out
                // the content, adds a darkened backdrop and shows
                // a red pause symbol with a warning message.  The
                // rest of the scene continues animating normally.
                try {
                  // Hide the pointer once the overlay appears
                  pointer.style.display = 'none';
                  // Hide the underlying message text so it does not
                  // interfere with the pause overlay.  This prevents
                  // the viewer from reading the suspicious email
                  // behind the warning.
                  demoText.style.opacity = '0';
                  // Apply grayscale to the wrapper to indicate a
                  // "paused" state.  Also blur slightly to separate it
                  // from the rest of the scene.
                  demoWrapper.style.filter = 'grayscale(1)';
                  demoWrapper.style.position = 'relative';
                  // Create overlay container to cover just the demoWrapper
                  const overlay = document.createElement('div');
                  overlay.style.position = 'absolute';
                  overlay.style.top = '0';
                  overlay.style.left = '0';
                  overlay.style.width = '100%';
                  overlay.style.height = '100%';
                  overlay.style.display = 'flex';
                  overlay.style.alignItems = 'center';
                  overlay.style.justifyContent = 'flex-start';
                  overlay.style.paddingLeft = '20px';
                  overlay.style.gap = '12px';
                  // Dark backdrop to focus attention on the pause message
                  overlay.style.background = 'rgba(0, 0, 0, 0.75)';
                  overlay.style.borderRadius = getComputedStyle(demoWrapper).borderRadius;
                  // Pause icon composed of two red bars
                  const pauseIcon = document.createElement('div');
                  pauseIcon.style.display = 'flex';
                  pauseIcon.style.flexDirection = 'row';
                  pauseIcon.style.alignItems = 'center';
                  const bar1 = document.createElement('div');
                  bar1.style.width = '10px';
                  bar1.style.height = '32px';
                  bar1.style.background = '#cc3a3a';
                  bar1.style.borderRadius = '2px';
                  bar1.style.marginRight = '4px';
                  const bar2 = document.createElement('div');
                  bar2.style.width = '10px';
                  bar2.style.height = '32px';
                  bar2.style.background = '#cc3a3a';
                  bar2.style.borderRadius = '2px';
                  pauseIcon.appendChild(bar1);
                  pauseIcon.appendChild(bar2);
                  // Text wrapper containing the heading and a typed subheading
                  const textContainer = document.createElement('div');
                  textContainer.style.display = 'flex';
                  textContainer.style.flexDirection = 'column';
                  textContainer.style.lineHeight = '1.2';
                  // Main heading "PAUSE" in bold Montserrat
                  const headingEl = document.createElement('span');
                  headingEl.textContent = 'PAUSE';
                  headingEl.style.fontFamily = 'Montserrat, sans-serif';
                  headingEl.style.fontWeight = '800';
                  headingEl.style.fontSize = '20px';
                  headingEl.style.color = '#ffffff';
                  headingEl.style.marginBottom = '2px';
                  // Container for typed subheading text
                  const typedEl = document.createElement('span');
                  typedEl.style.fontFamily = 'Monaco, Consolas, "Courier New", monospace';
                  typedEl.style.fontWeight = '400';
                  typedEl.style.fontSize = '16px';
                  typedEl.style.color = '#ffffff';
                  typedEl.id = 'typed-warning-' + Date.now();
                  textContainer.appendChild(headingEl);
                  textContainer.appendChild(typedEl);
                  overlay.appendChild(pauseIcon);
                  overlay.appendChild(textContainer);
                  demoWrapper.appendChild(overlay);
                  // Initialise typed.js on the subheading.  The text
                  // communicates that links should not be trusted
                  // unless verified.  Setting showCursor to false
                  // gives a cleaner appearance and matches a terminal feel.
                  if (window.Typed) {
                    new Typed('#' + typedEl.id, {
                      strings: ['Never trust any link until you verify its legitimacy.'],
                      typeSpeed: 40,
                      showCursor: false
                    });
                  } else if (window.typed) {
                    // fallback in case typed is loaded differently
                    new window.typed('#' + typedEl.id, {
                      strings: ['Never trust any link until you verify its legitimacy.'],
                      typeSpeed: 40,
                      showCursor: false
                    });
                  } else {
                    // If typed.js is unavailable, simply set the text
                    typedEl.textContent = 'Never trust any link until you verify its legitimacy.';
                  }
                } catch (err) {
                  console.warn('Pause overlay error', err);
                }
              }
            });
          }
        });
      }, 1000));
      // Define the steps with icons and descriptions
      const steps = [
        { icon: '✅', text: 'Check with the sender — call or message them directly.' },
        { icon: '📨', text: 'Use the Phishing Report button in Outlook.' },
        { icon: '🚫', text: 'Delete the email if it’s confirmed suspicious.' },
        { icon: '📧', text: 'Still unsure? Email infosec@kitopi.com.' }
      ];
      steps.forEach((step, idx) => {
        const item = document.createElement('div');
        item.classList.add('step-item');
        item.style.opacity = '0';
        const iconSpan = document.createElement('span');
        iconSpan.classList.add('step-icon');
        iconSpan.textContent = step.icon;
        const textSpan = document.createElement('span');
        textSpan.textContent = step.text;
        item.appendChild(iconSpan);
        item.appendChild(textSpan);
        container.appendChild(item);
        // Animate each step with a delay.  Items slide in from the left
        sceneTimers.push(setTimeout(() => {
          gsap.fromTo(item, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power2.out' });
        }, 3000 + idx * 2000));
      });
      // Maintain button responsiveness.  The pointer demonstration and
      // steps will continue to animate even if the user moves ahead.
    }

    /**
     * Scene 6 (Business Email Compromise): Simulate a dark mode
     * Outlook interface.  An empty inbox appears, then a bogus email
     * from “your manager” lands requesting an urgent vendor payment.
     * A pointer moves to open the email, highlights the suspicious
     * pieces and finally clicks the report > phishing option from the
     * toolbar.  Icons are loaded from the Images folder.  The scene
     * plays out over roughly 20 seconds.
     */
    function runScene6() {
      const container = document.getElementById('becContainer');
      if (!container) return;
      container.style.position = 'relative';
      // Build basic Outlook layout: left list and right panel
      const layout = document.createElement('div');
      layout.style.display = 'flex';
      layout.style.width = '100%';
      layout.style.height = '100%';
      // Mail list section (adjusted to 30% width so the message panel has more space)
      const list = document.createElement('div');
      list.style.flex = '0 0 30%';
      list.style.borderRight = '1px solid rgba(255,255,255,0.1)';
      list.style.padding = '8px';
      list.style.overflow = 'hidden';
      // Message panel
      const panel = document.createElement('div');
      panel.style.flex = '1';
      panel.style.position = 'relative';
      // Use a block layout so that the subject, sender details and body
      // naturally flow from top to bottom.  Flexbox would squeeze
      // elements horizontally and cause the subject to share a row with
      // the avatar row.  Overflow hidden prevents scrollbars from
      // appearing during animations.
      // Use a vertical flex layout so the subject, sender details
      // and body stack naturally.  Overflow is hidden to prevent
      // scrollbars from appearing during animation.
      panel.style.display = 'flex';
      panel.style.flexDirection = 'column';
      panel.style.overflow = 'hidden';
      // Insert into container
      layout.appendChild(list);
      layout.appendChild(panel);
      container.appendChild(layout);
      // Add placeholder message (no mail selected).  Use a wrapper
      // element so that the icon and text can be centered in both
      // directions.  This will later be removed when the message
      // content loads.
      const placeholder = document.createElement('div');
      placeholder.classList.add('no-message-container');
      const noMailImg = document.createElement('img');
      noMailImg.src = 'Images/noMailSelected.svg';
      noMailImg.classList.add('no-mail-img');
      const noMailText = document.createElement('div');
      noMailText.textContent = 'No message selected';
      noMailText.classList.add('no-message-text');
      placeholder.appendChild(noMailImg);
      placeholder.appendChild(noMailText);
      panel.appendChild(placeholder);
      // Pre‑populate list with two generic emails
      const mails = [
        { from: 'IT Support', subject: 'Weekly system maintenance', time: '1:00 PM' },
        { from: 'HR Department', subject: 'Policy update: new guidelines', time: '10:30 AM' }
      ];
      function createMailItem(mail) {
        const item = document.createElement('div');
        item.style.padding = '8px 6px';
        item.style.marginBottom = '6px';
        item.style.borderRadius = '6px';
        item.style.background = 'rgba(255,255,255,0.05)';
        item.style.cursor = 'pointer';
        const subj = document.createElement('strong');
        subj.textContent = mail.subject;
        subj.style.display = 'block';
        subj.style.fontSize = '13px';
        subj.style.color = '#fff';
        const from = document.createElement('span');
        from.textContent = mail.from;
        from.style.display = 'block';
        from.style.fontSize = '11px';
        from.style.color = 'rgba(255,255,255,0.7)';
        const time = document.createElement('span');
        time.textContent = mail.time;
        time.style.fontSize = '10px';
        time.style.color = 'rgba(255,255,255,0.5)';
        item.appendChild(subj);
        item.appendChild(from);
        item.appendChild(time);
        return item;
      }
      mails.forEach(m => list.appendChild(createMailItem(m)));
      // After 4 seconds, insert the suspicious BEC email and animate a pointer
      // that guides the viewer through the process: click the email, read the
      // suspicious content and report it as phishing.  The pointer is a
      // small white dot that moves smoothly between each step.
      sceneTimers.push(setTimeout(() => {
        // Insert the suspicious Business Email Compromise mail at the top
        const becMail = { from: 'Manager', subject: 'Urgent Vendor Payment Request', time: 'Now' };
        const item = createMailItem(becMail);
        item.style.background = 'rgba(255,0,0,0.15)';
        list.insertBefore(item, list.firstChild);
        gsap.fromTo(item, { opacity: 0 }, { opacity: 1, duration: 1.0, ease: 'power2.out' });
        // Create a custom pointer element.  Use a div with a
        // background image so the arrow remains visible even if
        // <img> loading fails.  The CSS class sets its size and
        // animation; we explicitly define the background here.
        const pointer = document.createElement('div');
        pointer.classList.add('bec-pointer-img');
        pointer.style.backgroundImage = "url('Images/cursor.png')";
        pointer.style.backgroundSize = 'contain';
        pointer.style.backgroundRepeat = 'no-repeat';
        // Position the pointer slightly away from the corner.  This
        // prevents it from appearing flush against the frame edge when
        // the sequence begins.
        pointer.style.left = '8px';
        pointer.style.top = '8px';
        container.appendChild(pointer);
        // Kick off the animation sequence directly once the email is
        // inserted.  We pass along references to the suspicious
        // list item and the mail list itself so that the sequence can
        // target the item, slide the list away and build the message.
        animateBecSequence({ pointer, panel, container, list, item });
      }, 4000));
      // Keep navigation responsive.  This BEC scenario will unfold over
      // time but users may choose to proceed sooner.
    }

    /**
     * Execute the pointer guided walk‑through for the Business Email
     * Compromise scene.  This helper uses async/await to play out
     * each step sequentially: clicking the suspicious email, opening
     * the message, highlighting suspicious phrases, moving to the
     * report button, selecting the phishing option and finally
     * displaying the success overlay.  Each pause is tuned to give
     * viewers enough time to read the content.
     *
     * @param {Object} params – collection of references
     * @param {HTMLElement} params.pointer – the moving pointer
     * @param {HTMLElement} params.panel – the message panel element
     * @param {HTMLElement} params.container – the scene container (becContainer)
     */
    async function animateBecSequence({ pointer, panel, container, list, item }) {
      // If a sequence is already in progress or overlay has been shown, do not
      // proceed.  Use a flag on the container to guard against multiple
      // activations (e.g. from fallback timers).
      if (container.dataset.becAnimating === 'true') return;
      container.dataset.becAnimating = 'true';
      // Move the pointer to the suspicious email.  Centre the pointer on
      // the list item so the click feels natural.  This initiates the
      // process of reading the email.
      try {
        await movePointer(pointer, item, 1.5);
      } catch (e) {
        // In case of failure, continue
      }
      // Simulate a click with a ring effect
      createClickRingAtPointer(pointer);
      // Brief pause for the user to register the selection
      await new Promise(r => setTimeout(r, 700));
      // Highlight the selected mail item visually
      item.classList.add('bec-selected');
      // After a short pause, slide the mail list out of view to free
      // space for the message details.  We animate the list on the X
      // axis and then hide it to allow the panel to fill the width.
      await new Promise(r => setTimeout(r, 1000));
      if (list) {
        const listWidth = list.offsetWidth;
        gsap.to(list, {
          x: -listWidth - 40,
          opacity: 0,
          duration: 1.2,
          ease: 'power2.in',
          onComplete: () => {
            list.style.display = 'none';
            list.style.visibility = 'hidden';
          }
        });
      }
      // Wait until the list has slid out before showing the message
      await new Promise(r => setTimeout(r, 1400));
      // Build the detailed message layout.  This will also remove the
      // placeholder and populate the panel with subject, sender and body.
      displayBecMessage(panel);
      // Give the viewer a moment before beginning to highlight
      await new Promise(r => setTimeout(r, 600));
      // Query for the highlighted phrases and report button
      const highlightEls = Array.from(panel.querySelectorAll('.highlight-target'));
      const reportBtnElm = panel.querySelector('.report-btn');
      if (!reportBtnElm || highlightEls.length === 0) {
        const sceneContainer = container.closest('.scene') || container;
        showSuccessOverlay(sceneContainer);
        container.dataset.becAnimating = 'false';
        return;
      }
      // Slowly move over each suspicious phrase as if reading the
      // sentence.  Pause between each move for clarity.
      for (const h of highlightEls) {
          try {
            await movePointer(pointer, h, 1.5);
          } catch (e) {
            // ignore and proceed
          }
          await new Promise(r => setTimeout(r, 1300));
      }
      // After reading, move to the report button
      await new Promise(r => setTimeout(r, 1500));
      try {
        await movePointer(pointer, reportBtnElm, 1.4);
        createClickRingAtPointer(pointer);
      } catch (e) {
        const sceneContainer2 = container.closest('.scene') || container;
        showSuccessOverlay(sceneContainer2);
        container.dataset.becAnimating = 'false';
        return;
      }
      // Create the drop-down menu anchored to the report button
      const menuData = createReportMenu(reportBtnElm, panel);
      const phishingRow = menuData && menuData.phishingRow;
      if (!phishingRow) {
        const sceneContainer3 = container.closest('.scene') || container;
        showSuccessOverlay(sceneContainer3);
        container.dataset.becAnimating = 'false';
        return;
      }
      // Wait briefly before moving to the Phishing option
      await new Promise(r => setTimeout(r, 1100));
      try {
        await movePointer(pointer, phishingRow, 1.4);
        createClickRingAtPointer(pointer);
      } catch (e) {
        // ignore
      }
      // Highlight the phishing row to indicate the selection
      phishingRow.classList.add('highlight');
      // After a moment, show the success overlay with the check mark
      await new Promise(r => setTimeout(r, 900));
      const sceneContainer4 = container.closest('.scene') || container;
      showSuccessOverlay(sceneContainer4);
      container.dataset.becAnimating = 'false';
    }

    /**
     * Helper to draw an expanding ring at the pointer's current position.
     * The ring is appended to the same container as the pointer and removed
     * automatically after its animation completes.  If the pointer is missing
     * or not attached to the DOM, no ring is drawn.
     *
     * @param {HTMLElement} pointer – the pointer element whose current position
     *   will be used to position the ring.
     */
    function createClickRingAtPointer(pointer) {
      if (!pointer || !pointer.parentElement) return;
      const parent = pointer.parentElement;
      const ring = document.createElement('div');
      ring.classList.add('click-ring');
      ring.style.left = pointer.style.left;
      ring.style.top = pointer.style.top;
      parent.appendChild(ring);
      setTimeout(() => {
        if (ring && ring.parentElement) ring.remove();
      }, 600);
    }

    /**
     * Scene 7 (Social Engineering Examples): Illustrate a few
     * impersonation scenarios that go beyond email.  Four panels
     * appear in succession, each describing a realistic attack: HR
     * updates, fake IT requests, vendor bank change and on‑site
     * intruders.  Emojis are used as simple icons for each panel.
     */
    function runScene7() {
      const container = document.getElementById('examplesContainer');
      if (!container) return;
      const examples = [
        { icon: '📄', text: 'HR update about salary or termination.' },
        { icon: '🔐', text: 'Fake IT asking for MFA codes.' },
        { icon: '🏦', text: 'Vendor requests with new bank details.' },
        { icon: '🚚', text: 'An outsider attempting to enter a restricted area.' }
      ];
      examples.forEach((ex, idx) => {
        const item = document.createElement('div');
        item.classList.add('example-item');
        item.style.opacity = '0';
        const iconSpan = document.createElement('span');
        iconSpan.classList.add('example-icon');
        iconSpan.textContent = ex.icon;
        const textSpan = document.createElement('span');
        textSpan.textContent = ex.text;
        item.appendChild(iconSpan);
        item.appendChild(textSpan);
        container.appendChild(item);
        sceneTimers.push(setTimeout(() => {
          gsap.fromTo(item, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power2.out' });
        }, idx * 3000));
      });
      // Allow immediate navigation; the example panels will continue
      // appearing sequentially but do not block progression.
    }

    /**
     * Scene 8 (Final Tips): Present a series of best practices
     * summarised from the training.  Each tip slides up into view,
     * accompanied by a check mark.  The tips encourage hovering over
     * links, verifying sources, guarding credentials, using the
     * report button and asking directly.
     */
    function runScene8() {
      // Present final tips as succinct icons and labels.  The voiceover
      // delivers detailed guidance, so we keep on‑screen text short to
      // maintain immersion.  Each card animates into view with a
      // slight delay and scale effect.
      const container = document.getElementById('tipsContainer');
      if (!container) return;
      container.innerHTML = '';
      const tips = [
        { icon: '🔍', label: 'Hover to inspect links' },
        { icon: '✅', label: 'Verify the sender' },
        { icon: '🔒', label: 'Keep credentials private' },
        { icon: '📭', label: 'Report suspicious emails' },
        { icon: '❓', label: 'Ask if unsure' }
      ];
      tips.forEach((tip, idx) => {
        const item = document.createElement('div');
        item.classList.add('tip-item');
        const iconSpan = document.createElement('span');
        iconSpan.classList.add('tip-icon');
        iconSpan.textContent = tip.icon;
        const labelSpan = document.createElement('span');
        labelSpan.classList.add('tip-label');
        labelSpan.textContent = tip.label;
        item.appendChild(iconSpan);
        item.appendChild(labelSpan);
        item.style.opacity = '0';
        item.style.transform = 'scale(0.8) translateY(20px)';
        container.appendChild(item);
        sceneTimers.push(setTimeout(() => {
          gsap.to(item, { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out(1.6)' });
        }, idx * 2000));
      });
    }

    /**
     * Scene 9 (Closing): Deliver an empowering conclusion.  A custom
     * mask shape morphs into a protective shield while a series of
     * closing lines fade in.  Colours cycle through accent, warning
     * and danger tones to emphasise vigilance.  This scene runs at
     * least 25 seconds to match the narration length.  The mask
     * shape is a simplified phantom‑like face drawn as a bezier path.
     */
    function runScene9() {
      const container = document.getElementById('closingContainer');
      if (!container) return;
      // Clear previous content and ensure consistent styling
      container.innerHTML = '';
      container.classList.add('closing-new');

      // Hide the generic scene heading defined in the HTML for this
      // closing scene.  The customised finale includes its own
      // narrative elements so the default heading is removed here.
      const defaultHeading = document.querySelector('#scene9 .scene-heading');
      if (defaultHeading) {
        defaultHeading.style.display = 'none';
      }

      /*
       * Build a modern, inspiring finale for the training.  Instead of
       * morphing an abstract shape we celebrate the human element of
       * security.  A single hero icon represents every employee
       * standing behind a shield.  Key phrases fade in one after
       * another to synchronise with the narration while calls to
       * action animate into view.  Finally the Kitopi logo and
       * closing slogan appear, underscoring our collective effort.
       */

      // Hero icon: a user with shield taken from FontAwesome.  We embed
      // the raw SVG path here to avoid any runtime dependency on
      // external modules.  The icon colour inherits from the accent
      // variable via CSS.
      const heroDiv = document.createElement('div');
      heroDiv.className = 'closing-icon';
      heroDiv.innerHTML = `
        <svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg">
          <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c1.8 0 3.5-.2 5.3-.5c-76.3-55.1-99.8-141-103.1-200.2c-16.1-4.8-33.1-7.3-50.7-7.3l-91.4 0zm308.8-78.3l-120 48C358 277.4 352 286.2 352 296c0 63.3 25.9 168.8 134.8 214.2c5.9 2.5 12.6 2.5 18.5 0C614.1 464.8 640 359.3 640 296c0-9.8-6-18.6-15.1-22.3l-120-48c-5.7-2.3-12.1-2.3-17.8 0zM591.4 312c-3.9 50.7-27.2 116.7-95.4 149.7l0-187.8L591.4 312z"/>
        </svg>
      `;
      container.appendChild(heroDiv);

      // Build a wrapper around the hero icon.  This wrapper will
      // contain the hero along with three clones that will animate
      // outward to represent "You. Me. All of us.".  The wrapper
      // ensures the cloned icons remain positioned relative to the
      // primary hero.
      const heroWrapper = document.createElement('div');
      heroWrapper.className = 'hero-wrapper';
      heroWrapper.appendChild(heroDiv);
      container.appendChild(heroWrapper);

      // Create three cloned icons based on the hero.  Each clone is
      // appended to the hero wrapper and will later be animated
      // outward to illustrate multiple people standing together.  We
      // retain a reference to each clone for the timeline animations.
      const clones = [];
      const cloneCount = 3;
      for (let i = 0; i < cloneCount; i++) {
        const clone = heroDiv.cloneNode(true);
        clone.classList.add('clone-icon');
        heroWrapper.appendChild(clone);
        clones.push(clone);
      }

      // Instructions row: use simple emojis to express key behaviours
      // instead of lengthy sentences.  A calm pose (🧘), a magnifying
      // glass (🔍) and a brain (🧠) convey staying calm, staying sharp
      // and trusting your instincts.  Optional labels are included
      // below each icon for clarity but remain subtle in size.
      const instructions = [
        { icon: '1️⃣', label: 'Calm' },
        { icon: '2️⃣', label: 'Sharp' },
        { icon: '3️⃣', label: 'Instincts' }
      ];
      const instructionsRow = document.createElement('div');
      instructionsRow.className = 'instructions-row';
      instructions.forEach(item => {
        const wrapper = document.createElement('div');
        wrapper.className = 'instruction-item';
        const iconSpan = document.createElement('span');
        iconSpan.className = 'instruction-icon';
        iconSpan.textContent = item.icon;
        wrapper.appendChild(iconSpan);
        const labelSpan = document.createElement('span');
        labelSpan.className = 'instruction-label';
        labelSpan.textContent = item.label;
        wrapper.appendChild(labelSpan);
        instructionsRow.appendChild(wrapper);
      });
      container.appendChild(instructionsRow);

      // Actions row for reporting, contacting infosec and using AskPete.
      const actions = [
        { icon: '📨', label: 'Report' },
        { icon: '📧', label: 'Contact' },
        { icon: '💬', label: 'Ask-Pete' }
      ];
      const actionsRow = document.createElement('div');
      actionsRow.className = 'closing-actions';
      actions.forEach(item => {
        const wrapper = document.createElement('div');
        wrapper.className = 'action-item';
        const iconSpan = document.createElement('span');
        iconSpan.className = 'action-icon';
        iconSpan.textContent = item.icon;
        const labelSpan = document.createElement('span');
        labelSpan.className = 'action-label';
        labelSpan.textContent = item.label;
        wrapper.appendChild(iconSpan);
        wrapper.appendChild(labelSpan);
        actionsRow.appendChild(wrapper);
      });
      container.appendChild(actionsRow);

      // Final section with Kitopi logo and closing statement.  The
      // word "Kitopi" is highlighted using the accent colour via a
      // span.  The logo is placed above the text for brand
      // recognition.
      const finalDiv = document.createElement('div');
      finalDiv.className = 'closing-final';
      const logoImg = document.createElement('img');
      logoImg.src = 'Images/WhiteKitopi-01.svg';
      logoImg.alt = 'Kitopi logo';
      finalDiv.appendChild(logoImg);
      const finalText = document.createElement('p');
      finalText.innerHTML = 'Together, we make <span class="accent">Kitopi</span> secure.';
      finalDiv.appendChild(finalText);
      container.appendChild(finalDiv);

      // Hide the default navigation buttons for the closing scene.  The
      // finale replaces the Back/Finish controls with a single quiz
      // button that appears at the very end.  It pulses gently to
      // invite users to continue the training.  Remove these buttons
      // from view so they do not overlap the new control.
      const scene9El = document.getElementById('scene9');
      if (scene9El) {
        const backBtn = scene9El.querySelector('.prev-btn');
        const finishBtn = scene9El.querySelector('.next-btn');
        if (backBtn) backBtn.style.display = 'none';
        if (finishBtn) finishBtn.style.display = 'none';
      }

      // Create a placeholder quiz button.  It will be revealed via
      // the timeline’s call() method once the animation completes.  The
      // button does not perform any action until we attach a click
      // handler.  Styling is defined in style.css under .quiz-btn.  The
      // button is initially hidden (opacity zero) and is faded in via
      // GSAP later on.
      const quizBtn = document.createElement('button');
      quizBtn.className = 'quiz-btn';
      quizBtn.textContent = 'Start Quiz!';
      // Avoid accidental focus outlines since the button is disabled
      quizBtn.setAttribute('tabindex', '-1');
      // Navigate to the quiz page when the button is clicked
      quizBtn.addEventListener('click', () => {
        // replace the current page with quiz.html, which will load its own
        // stylesheet and JavaScript automatically
        window.location.href = 'quiz.html';
      });
      if (scene9El) scene9El.appendChild(quizBtn);

      // Create the animation timeline.  The hero scales in and then
      // gently breathes.  Three cloned icons burst outward to
      // illustrate the collective "You. Me. All of us.".  They fade
      // away before the behaviour icons slide into view one by one.
      // After a pause, the action buttons animate up, followed by
      // the final logo and slogan.  Pauses introduced via empty
      // tweens stretch the overall duration to match the audio.
      const tl = gsap.timeline();
      // Animate the hero icon scaling up
      tl.from(heroDiv, { scale: 0, opacity: 0, duration: 1.5, ease: 'back.out(1.7)' });
      // After the hero appears, start a gentle breathing animation
      tl.to(heroDiv, { scale: 1.05, duration: 3.0, ease: 'sine.inOut', yoyo: true, repeat: -1 }, '<');
      // Clone positions relative to the hero: left/top, right/top and bottom
      const clonePositions = [
        { x: -80, y: -40 },
        { x: 80, y: -40 },
        { x: 0, y: 80 }
      ];
      // Animate clones outwards with a stagger
      tl.to(clones, {
        x: i => clonePositions[i].x,
        y: i => clonePositions[i].y,
        opacity: 1,
        scale: 0.8,
        duration: 2.0,
        ease: 'back.out(1.7)',
        stagger: 0.3
      }, '-=0.5');
      // Hold clones on screen longer so viewers notice the trio
      tl.to({}, { duration: 1.5 });
      // Fade out clones to shift focus back to the hero.  Use
      // autoAlpha (opacity + visibility) for a reliable hide.  They
      // shrink slightly as they fade.
      tl.to(clones, { autoAlpha: 0, scale: 0.4, duration: 1.2, ease: 'power1.in' });
      // Brief pause before showing behaviour icons
      tl.to({}, { duration: 0.5 });
      // Animate behaviour icons (instructions) sequentially
      tl.from(instructionsRow.children, {
        opacity: 0,
        scale: 0.2,
        y: 30,
        duration: 1.5,
        ease: 'back.out(1.7)',
        stagger: 0.7
      });
      // Hold the instructions momentarily
      tl.to({}, { duration: 1.0 });
      // Animate action items with a stagger
      tl.from(actionsRow.children, {
        opacity: 0,
        y: 30,
        scale: 0.8,
        duration: 2.0,
        ease: 'back.out(1.6)',
        stagger: 1.0
      });
      // Hold the action row on screen for a moment
      tl.to({}, { duration: 1.0 });
      // Reveal the closing logo and slogan
      tl.from(finalDiv, { opacity: 0, y: 30, duration: 2.0, ease: 'power2.out' });
      // Hold the final message until the end of the audio (approx 4 s)
      tl.to({}, { duration: 4.0 });

      // After the timeline completes its final hold, reveal the quiz button
      // and start the pulsing animation.  Use a GSAP call rather than
      // setTimeout so that the timing stays relative to the timeline.
      tl.call(() => {
        // Show the button by fading it in
        gsap.fromTo(quizBtn, { opacity: 0, scale: 0.6 }, {
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: 'back.out(1.7)',
          onComplete: () => {
            // Once fully visible, add the pulsing class defined in CSS
            quizBtn.classList.add('pulsing');
          }
        });
      });

      // Do not lock the finish button.  The timeline will continue
      // running even if the viewer advances early.  The gentle
      // breathing on the hero icon continues indefinitely via the
      // repeating tween above.
    }
    /**
     * Helper for Scene 6.  Displays the content of the suspicious
     * email, highlights key phrases and guides the pointer to report
     * it.  This function is called once the pointer “clicks” the
     * incoming message.  It creates a fake toolbar with report menu.
     *
     * @param {HTMLElement} panel – the right hand panel
     * @param {HTMLElement} pointer – pointer element to animate
     */
    /**
     * Build and display the Business Email Compromise message in the right
     * panel.  This function constructs a realistic Outlook‑style view with
     * a subject line, sender avatar and details, a row of action icons,
     * the message date and body.  Suspicious phrases within the body are
     * wrapped in elements with the `highlight-target` class so that the
     * pointer can visit them individually.  It returns references to
     * the report button and the array of highlighted spans for further
     * animations.  No pointer movement logic lives here – that is
     * orchestrated by runScene6.
     *
     * @param {HTMLElement} panel – the right panel to populate
     * @returns {Object} – an object with `reportBtn` and `highlights` arrays
     */
    function displayBecMessage(panel) {
      panel.innerHTML = '';
      // Apply a class to enable targeted styling
      panel.classList.add('bec-message');
      const refs = { reportBtn: null, highlights: [] };
      // Subject
      const subject = document.createElement('div');
      subject.classList.add('subject-line');
      subject.textContent = 'Urgent Vendor Payment Request';
      panel.appendChild(subject);
      // Sender row
      const senderRow = document.createElement('div');
      senderRow.classList.add('sender-row');
      // Sender info: avatar and email details
      const senderInfo = document.createElement('div');
      senderInfo.classList.add('sender-info');
      const avatar = document.createElement('div');
      avatar.classList.add('avatar');
      avatar.textContent = 'M';
      senderInfo.appendChild(avatar);
      const emailDetails = document.createElement('div');
      emailDetails.classList.add('email-details');
      const fromLine = document.createElement('div');
      fromLine.classList.add('from');
      fromLine.textContent = 'manager@kitopi.com';
      const toLine = document.createElement('div');
      toLine.classList.add('to');
      toLine.textContent = 'To: you@kitopi.com';
      emailDetails.appendChild(fromLine);
      emailDetails.appendChild(toLine);
      senderInfo.appendChild(emailDetails);
      senderRow.appendChild(senderInfo);
      // Icons row
      const iconsRow = document.createElement('div');
      iconsRow.classList.add('icons-row');
      // Sun icon
      const sun = document.createElement('span');
      sun.textContent = '☀️';
      iconsRow.appendChild(sun);
      // Smiley
      const smile = document.createElement('span');
      smile.textContent = '😊';
      iconsRow.appendChild(smile);
      // Reply
      const reply = document.createElement('span');
      reply.textContent = '↩️';
      iconsRow.appendChild(reply);
      // Reply all
      const replyAll = document.createElement('span');
      replyAll.textContent = '⤴️';
      iconsRow.appendChild(replyAll);
      // Forward
      const forward = document.createElement('span');
      forward.textContent = '➡️';
      iconsRow.appendChild(forward);
      // Divider
      const divider1 = document.createElement('div');
      divider1.classList.add('divider');
      iconsRow.appendChild(divider1);
      // Report button (icon + arrow).  Use the official report
      // message icon (64px) scaled down to 16px alongside a down
      // arrow character.  This icon is provided by the client to
      // match the Outlook ribbon.
      const reportBtn = document.createElement('div');
      reportBtn.classList.add('report-btn');
      const shieldImg = document.createElement('img');
      shieldImg.src = 'Images/ReportMessage64.png';
      shieldImg.alt = 'Report';
      shieldImg.style.width = '16px';
      shieldImg.style.height = '16px';
      const arrowDown = document.createElement('span');
      arrowDown.textContent = '▾';
      arrowDown.style.fontSize = '16px';
      reportBtn.appendChild(shieldImg);
      reportBtn.appendChild(arrowDown);
      iconsRow.appendChild(reportBtn);
      // Divider 2
      const divider2 = document.createElement('div');
      divider2.classList.add('divider');
      iconsRow.appendChild(divider2);
      // Ellipsis menu
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '…';
      iconsRow.appendChild(ellipsis);
      senderRow.appendChild(iconsRow);
      panel.appendChild(senderRow);
      // Date row
      const dateRow = document.createElement('div');
      dateRow.classList.add('date-row');
      // Use a fixed date/time for demonstration.  In a real app this
      // could be dynamic.
      dateRow.textContent = 'Thu 7/17/2025 7:00 PM';
      panel.appendChild(dateRow);
      // Message body
      const body = document.createElement('div');
      body.classList.add('body');
      // Compose the body with highlighted suspicious words separated
      // into individual spans so the pointer can visit them one by one.
      body.innerHTML = `Hi,<br><br>I need you to <span class="highlight-target">urgently</span> process a <span class="highlight-target">vendor payment</span> today. I will explain later.<br><br>Vendor: <strong>ABC Supplies</strong><br>Amount: <strong>50,000 AED</strong><br><br>Regards,<br>Manager`;
      panel.appendChild(body);
      // Collect references
      refs.reportBtn = reportBtn;
      refs.highlights = Array.from(body.querySelectorAll('.highlight-target'));
      return refs;
    }

    /**
     * Animate the pointer to move smoothly to the centre of a target
     * element.  This helper returns a Promise that resolves when the
     * movement is complete.  The duration may be customised; if not
     * provided the pointer glides at a comfortable speed.
     *
     * @param {HTMLElement} pointer – the pointer element
     * @param {HTMLElement} target – the element to move to
     * @param {Number} [duration=1.4] – time in seconds for the movement
     * @returns {Promise<void>} – resolves once the animation ends
     */
    function movePointer(pointer, target, duration = 1.4) {
      return new Promise(resolve => {
        if (!pointer || !target) {
          resolve();
          return;
        }
        // The pointer is positioned relative to its immediate parent
        // (becContainer) rather than the entire scene.  Calculate
        // coordinates relative to that parent so movement ends at
        // the centre of the target element.  If the parent is
        // missing we fall back to the scene element.
        let parent = pointer.parentElement;
        if (!parent) parent = document.body;
        const parentRect = parent.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        // Determine pointer dimensions.  If the element has not
        // finished loading (e.g. image), fall back to default size.
        const pointerW = pointer.naturalWidth || pointer.offsetWidth || 32;
        const pointerH = pointer.naturalHeight || pointer.offsetHeight || 32;
        const destX = targetRect.left - parentRect.left + (targetRect.width - pointerW) / 2;
        // Align the pointer tip over the target.  The arrow graphic used
        // in the BEC scene is triangular with its tip located towards
        // the lower edge of the image.  To compensate, move the pointer
        // further up relative to the target.  Subtracting a larger
        // fraction of the pointer height places the pointer above the
        // element, ensuring it does not sit below dropdown rows or
        // icons.  A 60% offset was empirically chosen to improve
        // alignment across varying element heights.
        let destY = targetRect.top - parentRect.top + (targetRect.height - pointerH) / 2;
        destY -= pointerH * 0.6;
        // Use left/top properties instead of x/y transforms so the
        // pointer’s absolute coordinates are updated consistently.
        gsap.to(pointer, {
          left: `${destX}px`,
          top: `${destY + 23}px`,
          duration: duration,
          ease: 'power2.out',
          onComplete: () => resolve()
        });
      });
    }

    /**
     * Create a report menu beneath the provided button and return both
     * the menu element and a reference to the Phishing row.  The
     * positioning is computed relative to the panel container to
     * ensure the menu appears correctly regardless of layout.
     *
     * @param {HTMLElement} reportBtn – the button to anchor the menu
     * @param {HTMLElement} panel – the panel on which to place the menu
     * @returns {{menu: HTMLElement, phishingRow: HTMLElement}} – menu and phishing row
     */
    function createReportMenu(reportBtn, panel) {
      const menu = document.createElement('div');
      menu.classList.add('report-menu');
      // Define menu items.  The first item is Junk; subsequent
      // ones follow the order provided by the specification.
      const items = [
        { label: 'Junk', img: 'Images/junk.png' },
        { label: 'Phishing', img: 'Images/Phishing16.png' },
        { label: 'Not Junk', img: 'Images/NotJunk16.png' },
        { label: 'Options…', img: 'Images/Options16.png' },
        { label: 'Help', img: 'Images/Help16.png' }
      ];
      let phishingRow = null;
      items.forEach((item, idx) => {
        const row = document.createElement('div');
        row.classList.add('menu-item');
        const icon = document.createElement('img');
        icon.src = item.img;
        icon.alt = '';
        row.appendChild(icon);
        const label = document.createElement('span');
        label.textContent = item.label;
        row.appendChild(label);
        menu.appendChild(row);
        if (item.label === 'Phishing') phishingRow = row;
      });
      // Append the menu to the panel first so that its dimensions can
      // be measured accurately before final positioning.
      panel.appendChild(menu);
      // Determine the optimal position for the menu relative to the
      // report button.  Attempt to place it below the button; if
      // there is insufficient space, flip it above.  Likewise keep
      // it within the horizontal bounds of the panel.
      const btnRect = reportBtn.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      // Initial placement below the button
      let left = btnRect.left - panelRect.left;
      let top = btnRect.top - panelRect.top + btnRect.height + 6;
      // Adjust horizontally if menu would overflow to the right
      if (left + menuRect.width > panelRect.width) {
        left = Math.max(0, panelRect.width - menuRect.width - 6);
      }
      // If menu extends below the panel, place it above the button
      if (top + menuRect.height > panelRect.height) {
        top = btnRect.top - panelRect.top - menuRect.height - 6;
        // Keep above placement within bounds as well
        if (top < 0) top = 0;
      }
      menu.style.left = `${left}px`;
      menu.style.top = `${top}px`;
      return { menu, phishingRow };
    }

    /**
     * Display a success overlay with a typewriter animation that
     * communicates the outcome of the exercise.  The overlay covers
     * the entire scene container to reinforce the conclusion.  When
     * finished, the overlay remains visible for a short period.
     *
     * @param {HTMLElement} container – the scene container to overlay
     */
    function showSuccessOverlay(container) {
      // Prevent multiple overlays from stacking.  If an overlay is
      // already present on this container, do nothing.
      if (container.querySelector('.success-check-overlay')) return;
      // Create the blur overlay.  This will blur and darken the
      // background.  Only one overlay can exist at a time.
      const overlay = document.createElement('div');
      overlay.classList.add('success-check-overlay');
      // Check container holds the animated circle, check and shadow
      const checkContainer = document.createElement('div');
      checkContainer.classList.add('check-container');
      // Background circle with gradient and the SVG check path
      const checkBg = document.createElement('div');
      checkBg.classList.add('check-background');
      // SVG path for the check mark.  Uses a white stroke on a
      // transparent background; the CSS animation will draw the path.
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', '0 0 65 51');
      svg.setAttribute('fill', 'none');
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', 'M7 25L27.3077 44L58.5 7');
      path.setAttribute('stroke', 'white');
      path.setAttribute('stroke-width', '13');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(path);
      checkBg.appendChild(svg);
      // Shadow element for subtle depth
      const checkShadow = document.createElement('div');
      checkShadow.classList.add('check-shadow');
      // Assemble the check container
      checkContainer.appendChild(checkBg);
      checkContainer.appendChild(checkShadow);
      overlay.appendChild(checkContainer);
      // Message container for typewriter effect.  Start empty.
      const msg = document.createElement('div');
      msg.classList.add('success-cmd-text');
      overlay.appendChild(msg);
      // Append overlay to the container (scene)
      container.appendChild(overlay);
      // Animate the check container sliding up slightly and fading in.
      gsap.fromTo(checkContainer, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' });
      // After the check animation, type the success message in a
      // terminal‑style monospace font.  Once the message is fully
      // displayed, wait briefly then fade out the overlay.
      const fullText = 'Good Job!\nYou successfully prevented a phishing attempt.';
      let idx = 0;
      function typeChars() {
        if (idx < fullText.length) {
          msg.textContent += fullText.charAt(idx);
          idx++;
          setTimeout(typeChars, 45);
        } else {
          // Wait then fade out overlay
          setTimeout(() => {
            gsap.to(overlay, {
              opacity: 0,
              duration: 1.0,
              ease: 'power1.out',
              onComplete: () => {
                if (overlay && overlay.parentElement) overlay.remove();
              }
            });
          }, 2200);
        }
      }
      // Start typing after a brief delay so the icon animation can be
      // observed first.
      setTimeout(typeChars, 800);
    }

    /**
     * Scene 4: Populate a list of red flags, each with a rough
     * illustrated icon and animated entry.  GSAP handles staggering.
     */
    function runFlags() {
      const flagList = document.getElementById('flagList');
      if (!flagList) return;
      flagList.innerHTML = '';
      const flags = [
        {
          icon: '⚠️',
          text: 'Mismatch between sender name and email domain.'
        },
        {
          icon: '🕒',
          text: 'Urgent requests demanding immediate action.'
        },
        {
          icon: '🔗',
          text: 'Links that do not match legitimate domains.'
        },
        {
          icon: '📎',
          text: 'Unexpected attachments or requests for sensitive info.'
        },
        {
          icon: '👀',
          text: 'Spelling errors or unusual language usage.'
        }
      ];
      flags.forEach((flag, idx) => {
        const li = document.createElement('li');
        li.classList.add('flag-item');
        // Build icon container with scribble circle behind an emoji
        const iconContainer = document.createElement('div');
        iconContainer.classList.add('flag-icon');
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        const rc = rough.svg(svg);
        const scribbleCircle = rc.circle(12, 12, 22, {
          stroke: colorAccent,
          strokeWidth: 1.5,
          roughness: 1.5,
          fill: 'transparent'
        });
        svg.appendChild(scribbleCircle);
        const emoji = document.createElement('span');
        emoji.textContent = flag.icon;
        emoji.style.fontSize = '24px';
        emoji.style.lineHeight = '24px';
        emoji.style.display = 'inline-block';
        emoji.style.position = 'absolute';
        emoji.style.top = '0';
        emoji.style.left = '0';
        // Wrap both into the container
        iconContainer.style.position = 'relative';
        iconContainer.appendChild(svg);
        iconContainer.appendChild(emoji);
        // Text element
        const p = document.createElement('p');
        p.classList.add('flag-text');
        p.innerHTML = flag.text;
        li.appendChild(iconContainer);
        li.appendChild(p);
        flagList.appendChild(li);
        // Animate in using GSAP with stagger
        gsap.fromTo(li, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.8, delay: idx * 0.3, ease: 'power2.out' });
      });
    }

    /**
     * Controller for animated colour cycling on the final morph shape.
     * Using Popmotion’s animate function returns a handle that can be
     * cancelled when leaving the scene.  We cycle through accent,
     * warning and danger colours indefinitely.
     */
    let finalColorController = null;
    function startFinalColourCycle(pathEl) {
      const colours = [colorAccent, colorWarning, colorDanger];
      let idx = 0;
      function next() {
        const from = colours[idx];
        const to = colours[(idx + 1) % colours.length];
        idx = (idx + 1) % colours.length;
        if (popmotion && popmotion.animate) {
          finalColorController = popmotion.animate({
            from: { colour: from },
            to: { colour: to },
            duration: 3000,
            ease: popmotion.easing.easeInOut,
            onUpdate: v => {
              // Preserve any existing opacity by reading it once
              const opacity = pathEl.getAttribute('fill-opacity') || '0.4';
              pathEl.setAttribute('fill', v.colour);
              pathEl.setAttribute('fill-opacity', opacity);
            },
            onComplete: () => {
              if (finalColorController) {
                next();
              }
            }
          });
        } else {
          // Fallback: simply set the final colour without animation
          const opacity = pathEl.getAttribute('fill-opacity') || '0.4';
          pathEl.setAttribute('fill', to);
          pathEl.setAttribute('fill-opacity', opacity);
          setTimeout(next, 3000);
        }
      }
      next();
    }


    // Activate either the pre‑intro overlay or the desired start scene on page load.
    // If the pre‑intro exists it will run first, then fade out and reveal the
    // app container before invoking showScene.  Otherwise we immediately
    // activate the selected scene.  This approach prevents the welcome
    // narration from playing behind the pre‑intro and ensures a smooth
    // transition into the main experience.
    (function initPreIntro() {
      const preIntro = document.getElementById('preIntro');
      const appContainer = document.querySelector('.app-container');
      if (preIntro && appContainer) {
        // Hide the main app until authorization is complete
        appContainer.style.display = 'none';
        // Start typing the initial prompt after a brief delay to allow the boot
        // screen to settle.  Use try/catch in case typeEffect has not been defined yet.
        const preTyped = document.getElementById('preTyped');
        if (preTyped) {
          setTimeout(() => {
            try {
            // Slow down the initial prompt slightly to suit the retro
            // aesthetic.  The third argument controls the per‑character
            // delay in milliseconds.  We increase it from 60 to 80 to
            // create a more deliberate typing cadence without feeling
            // sluggish.  The line delay is unchanged since there is
            // only one line.
            typeEffect(preTyped, ['>>> INSERT AUTHORIZATION KEY'], 80, 1000);
            } catch (e) {
              preTyped.textContent = '>>> INSERT AUTHORIZATION KEY';
            }
          }, 1000);
        }
        let authStarted = false;
        // Spinner interval for the initial AUTHENTICATING animation
        let spinnerInterval1;

        /**
         * Handler for initiating the authentication sequence.  Applies shake and
         * flip effects, displays a rotating spinner with terminal characters
         * and then transitions into the access sequence after a delay.
         */
        function startAuth() {
          if (authStarted) return;
          authStarted = true;
          // Brief shake to emphasise activation
          preIntro.classList.add('shake');
          // Flip the K to reveal the back face
          const kInner = preIntro.querySelector('.k-inner');
          if (kInner) {
            kInner.classList.add('auth-flipped');
          }
          // Fade out the entire K wrapper shortly after the flip to focus on
          // the authentication messages.  The wrapper opacity transition is
          // defined in CSS.
          const kWrapperEl = preIntro.querySelector('.k-wrapper');
          if (kWrapperEl) {
            setTimeout(() => {
              kWrapperEl.style.opacity = '0';
            }, 500);
          }
          // Show "AUTHENTICATING" with a rotating spinner
          const subtext = preIntro.querySelector('.pre-subtext');
          if (subtext) {
            // Reset any multi‑line layout from a previous run
            subtext.classList.remove('multi');
            // Insert the AUTHENTICATING label and spinner.  The spinner
            // characters rotate through | / - \ to mimic an old
            // terminal loader.
            subtext.innerHTML = '<span class="auth-text">AUTHENTICATING</span><span id="spinnerChar"></span>';
            const spinnerEl = document.getElementById('spinnerChar');
            const seq = ['|','/','-','\\'];
            let idx = 0;
            spinnerInterval1 = setInterval(() => {
              if (spinnerEl) spinnerEl.textContent = seq[idx % seq.length];
              idx++;
            }, 150);
          }
          // After 2 seconds stop the spinner and reveal access messages
          setTimeout(() => {
            if (spinnerInterval1) clearInterval(spinnerInterval1);
            showAccess();
          }, 2000);
        }

        /**
         * Display validation and access messages in a typed terminal style.  After
         * all lines are typed, a second loading spinner runs before
         * initiating the glitch effect and moving on to the main experience.
         */
        function showAccess() {
          const subtext = preIntro.querySelector('.pre-subtext');
          if (!subtext) return;
          subtext.innerHTML = '';
          subtext.classList.add('multi');
          const lines = [
            'KEY IS VALID...',
            'ACCESS: [GRANTED]',
            'USER VERIFIED: [KITOPIAN007@KITOPI.COM]',
            'LOADING: [PHISHING REMEDIAL AWARENESS]...'
          ];
          try {
          // Adjust typing speed for the access messages so each
          // character appears a bit slower than the default.  This
          // reinforces the feel of a methodical boot sequence without
          // dragging the pace.  Increase speed from 50ms to 70ms and
          // slightly bump the line delay from 800ms to 900ms.
          typeEffect(subtext, lines, 70, 900, () => {
              const spinnerEl = document.createElement('span');
              spinnerEl.id = 'loadingSpinner';
              spinnerEl.style.marginLeft = '4px';
              subtext.appendChild(spinnerEl);
              const seq2 = ['|','/','-','\\'];
              let j = 0;
              const spinnerInterval2 = setInterval(() => {
                spinnerEl.textContent = seq2[j % seq2.length];
                j++;
              }, 150);
              // After 2 seconds stop the spinner and trigger glitch transition
              setTimeout(() => {
                clearInterval(spinnerInterval2);
                spinnerEl.textContent = '';
                glitchAndProceed();
              }, 2000);
            });
          } catch (e) {
            // Fallback if typeEffect fails: display plain text then glitch
            subtext.innerHTML = lines.join('<br>');
            glitchAndProceed();
          }
        }

        /**
         * Apply a brief glitch animation to the overlay then fade it out and
         * reveal the main experience.  The glitch effect gives a digital
         * boot‑screen vibe as we transition into the story.
         */
        function glitchAndProceed() {
          preIntro.classList.add('glitch');
          setTimeout(() => {
            preIntro.classList.remove('glitch');
            gsap.to(preIntro, {
              opacity: 0,
              duration: 1,
              onComplete: () => {
                preIntro.style.display = 'none';
                appContainer.style.display = 'block';
                showScene(currentScene, false);
              }
            });
          }, 800);
        }

        // Listen for clicks on the overlay
        preIntro.addEventListener('click', startAuth);
        // Listen for keyboard activation (Enter or Space)
        window.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
            startAuth();
          }
        });
      } else {
        // No pre‑intro defined – show the current scene immediately
        showScene(currentScene, true);
      }
    })();
  });
})();
