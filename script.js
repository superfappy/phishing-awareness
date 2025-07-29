// This script handles the scene navigation logic and per‑scene animations
// for the interactive phishing awareness experience. Each scene has its
// own initializer to keep concerns separated and to only run logic when
// the scene is visible.

document.addEventListener('DOMContentLoaded', () => {
  // Determine which scene to display based on the query parameter
  const scenes = Array.from(document.querySelectorAll('.scene'));
  const params = new URLSearchParams(window.location.search);
  const sceneParam = params.get('scene');
  let sceneIndex = 0;
  if (sceneParam) {
    const idx = parseInt(sceneParam, 10);
    if (!isNaN(idx) && idx >= 1 && idx <= scenes.length) {
      sceneIndex = idx - 1;
    }
  }
  scenes.forEach((scene, idx) => {
    scene.classList.toggle('active', idx === sceneIndex);
  });
  // Initialize the visible scene
  switch (sceneIndex) {
    case 0:
      initScene1();
      break;
    case 1:
      initScene2();
      break;
    case 2:
      initScene3();
      break;
    case 3:
      initScene4();
      break;
    case 4:
      initScene5();
      break;
    case 5:
      initScene6();
      break;
    case 6:
      initScene7();
      break;
    case 7:
      initScene8();
      break;
    case 8:
      initScene9();
      break;
    default:
      break;
  }

  // Set up navigation buttons across all scenes. Buttons with the classes
  // `.prev-scene-btn` or `.next-scene-btn` contain a data-target attribute
  // indicating the scene index to navigate to. When clicked, we update the
  // query parameter and reload the page. This allows Interacty to embed
  // different scenes via ?scene=X.
  const navButtons = document.querySelectorAll('.prev-scene-btn, .next-scene-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      if (target) {
        const url = new URL(window.location.href);
        url.searchParams.set('scene', target);
        window.location.href = url.toString();
      }
    });
  });
});

/*
 * Helper: typewriter effect. Takes an element and a string and gradually
 * writes the characters to the element. Returns a Promise that resolves
 * when the typing is complete. A slightly longer default speed gives
 * readers time to digest training content. Use this for all text animations
 * except static cards and email content.
 */
function typewriter(el, text, speed = 35) {
  return new Promise(resolve => {
    if (!el) { resolve(); return; }
    let i = 0;
    el.textContent = '';
    function tick() {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(tick, speed);
      } else {
        resolve();
      }
    }
    tick();
  });
}

/* Simple sleep helper returning a promise */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/*
 * Audio setup: load voice-over files used throughout the scenes.  Each
 * file corresponds to a narration for a specific slide or action. We
 * preload the audio to avoid playback delays and disable looping to
 * ensure each clip plays only once per trigger.
 */
const audioFiles = {
  welcoming: new Audio('Audio/Welcoming.wav'),
  slide1: new Audio('Audio/slide1.wav'),
  slideOutlook: new Audio('Audio/slide_outlook.wav'),
  cardsDetails: new Audio('Audio/cards_details.wav'),
  redFlags: new Audio('Audio/red_flags.wav'),
  hoverOver: new Audio('Audio/hover_over.wav'),
  BEC: new Audio('Audio/BEC.wav'),
  socialEngineering: new Audio('Audio/social_engineering.wav'),
  finalTips: new Audio('Audio/final_tips.wav'),
  ending: new Audio('Audio/ending.wav'),
};
// Configure audio objects
Object.values(audioFiles).forEach(a => {
  a.loop = false;
  a.preload = 'auto';
});

// Stop any currently playing audio and reset its playback position.
function stopAllAudio() {
  Object.values(audioFiles).forEach(a => {
    if (!a.paused) {
      a.pause();
    }
    a.currentTime = 0;
  });
}

// Play a specific audio clip by name.  This helper stops any existing
// narration before starting the requested clip. If the name is
// undefined or the file does not exist, nothing happens.
function playAudio(name) {
  stopAllAudio();
  const a = audioFiles[name];
  if (a) {
    try {
      a.currentTime = 0;
      a.play();
    } catch (err) {
      // Silently ignore playback errors (e.g., autoplay restrictions)
    }
  }
}

/* Scene 1: The Hook */
function initScene1() {
  // New cinematic intro implementation
  const lineEls = [
    document.getElementById('line1'),
    document.getElementById('line2'),
    document.getElementById('line3'),
    document.getElementById('line4'),
    document.getElementById('line5'),
    document.getElementById('line6'),
  ];
  const emailPopup = document.getElementById('emailPopup');
  const cursorEl = document.getElementById('fakeCursor');
  const flashOverlay = document.getElementById('flashOverlay');
  const domainWarning = document.getElementById('domainWarning');
  const navBtn = document.querySelector('#scene1 .next-scene-btn');
  const bg = document.querySelector('#scene1 .intro-bg');

  // New: cinematic logo element
  const introLogo = document.getElementById('introLogo');

  // Elements for new interactive intro
  const welcomeOverlay = document.getElementById('welcomeOverlay');
  const ctaPopup = document.getElementById('ctaPopup');

  // Hide narrative and prepare state
  lineEls.forEach(el => { el.textContent = ''; el.style.display = 'none'; });
  const narrationContainer = document.querySelector('#scene1 .narration');
  if (narrationContainer) narrationContainer.style.display = 'none';
  // Reset element styles
  emailPopup.style.opacity = 0;
  emailPopup.style.transform = 'translate(-50%, -50%) scale(0.7)';
  cursorEl.style.opacity = 0;
  flashOverlay.style.opacity = 0;
  domainWarning.style.opacity = 0;
  navBtn.style.opacity = 0;
  ctaPopup.style.opacity = 0;
  if (welcomeOverlay) {
    welcomeOverlay.style.opacity = 0;
    welcomeOverlay.style.pointerEvents = 'none';
  }
  // Prepare logo
  if (introLogo) {
    introLogo.style.opacity = '1';
    introLogo.style.transform = 'translate(-50%, -50%) scale(0)';
    introLogo.style.display = 'block';
  }

  // Begin playing the welcoming narration immediately when the scene starts.
  // Calling playAudio here ensures the audio begins as soon as scene1
  // loads, rather than waiting for the welcome overlay animation to
  // complete.  Autoplay policies may still require a user interaction
  // before sound plays; if so, the narration will start once the first
  // interaction occurs.
  playAudio('welcoming');

  // Function to show the call‑to‑action near the email popup
  function showCTA() {
    // Position the CTA popup above the email popup
    const containerRect = document.querySelector('.app-container').getBoundingClientRect();
    const popupRect = emailPopup.getBoundingClientRect();
    const ctaWidth = popupRect.width * 0.6;
    ctaPopup.style.width = `${ctaWidth}px`;
    ctaPopup.style.left = `${popupRect.left - containerRect.left + popupRect.width / 2}px`;
    // Position above the popup
    ctaPopup.style.top = `${popupRect.top - containerRect.top - 40}px`;
    ctaPopup.style.transform = 'translateX(-50%)';
    ctaPopup.style.opacity = 1;
  }
  // Function to hide CTA
  function hideCTA() {
    ctaPopup.style.opacity = 0;
  }

  // Flash overlay and show domain warning (same as before)
  function flashAndWarn() {
    // Flash a red overlay when the email is clicked
    anime({
      targets: flashOverlay,
      opacity: [0, 0.8, 0],
      duration: 800,
      easing: 'easeInOutCubic'
    });
    // Speed up the background spin briefly to heighten tension
    if (bg) {
      bg.classList.add('fast-spin');
      setTimeout(() => {
        bg.classList.remove('fast-spin');
      }, 1400);
    }
    // Ensure the warning card is centred before animating it in.  Without
    // explicitly resetting its transform and position here, Anime.js may
    // override our translate offsets resulting in an off‑centre card.
    domainWarning.style.left = '50%';
    domainWarning.style.top = '50%';
    domainWarning.style.transform = 'translate(-50%, -50%)';
    // Fade in the domain warning card
    anime({
      targets: domainWarning,
      opacity: [0, 1],
      duration: 800,
      easing: 'easeOutQuad'
    });
    // Dim the email popup behind the warning to draw focus
    anime({
      targets: emailPopup,
      opacity: [1, 0.5],
      duration: 800,
      easing: 'easeInOutQuad'
    });
    // After the warning appears, fade in the navigation button
    setTimeout(() => {
      anime({ targets: navBtn, opacity: [0, 1], duration: 800, easing: 'easeInOutQuad' });
    }, 1200);
  }

  // Handle click on the email preview
  function handleEmailClick() {
    // Remove click handler to prevent double triggers
    emailPopup.removeEventListener('click', handleEmailClick);
    hideCTA();
    // Hide cursor
    anime({ targets: cursorEl, opacity: [1, 0], duration: 500, easing: 'easeOutQuad' });
    // Briefly scale email to indicate click then proceed
    anime({
      targets: emailPopup,
      scale: [1, 1.05, 1],
      duration: 600,
      easing: 'easeOutQuad',
      complete: () => {
        flashAndWarn();
      }
    });
  }

  // Animate the email appearance and pointer motion
  function animateEmailAndCursor() {
    anime({
      targets: emailPopup,
      opacity: [0, 1],
      scale: [0.7, 1],
      duration: 1600,
      easing: 'easeOutBack'
    });
    // After email appears, move cursor slowly to call attention
    setTimeout(() => {
      const containerRect = document.querySelector('.app-container').getBoundingClientRect();
      const popupRect = emailPopup.getBoundingClientRect();
      const startX = 30;
      const startY = containerRect.height - 50;
      const endX = popupRect.left - containerRect.left + popupRect.width * 0.9;
      const endY = popupRect.top - containerRect.top + popupRect.height * 0.8;
      cursorEl.style.left = `${startX}px`;
      cursorEl.style.top = `${startY}px`;
      cursorEl.style.opacity = 1;
      anime({
        targets: cursorEl,
        left: endX,
        top: endY,
        duration: 2000,
        easing: 'easeInOutQuad',
        complete: () => {
          // Show CTA instructing user to click
          showCTA();
          // Attach click handler to email
          emailPopup.addEventListener('click', handleEmailClick);
          // Auto-trigger click after 12 seconds if no interaction
          setTimeout(() => {
            if (domainWarning.style.opacity === '0' || domainWarning.style.opacity === '') {
              handleEmailClick();
            }
          }, 12000);
        }
      });
    }, 1800);
  }

  // Show welcome overlay and wait for dismissal
  function showWelcome() {
    if (!welcomeOverlay) {
      startEmailSequence();
      return;
    }
    welcomeOverlay.style.pointerEvents = 'auto';
    // Immediately clear the overlay text to prevent a brief flash of static text
    const headingEl = welcomeOverlay.querySelector('h1');
    const subtitleEl = welcomeOverlay.querySelector('.skip-text');
    const originalHeading = headingEl ? headingEl.textContent : '';
    const originalSubtitle = subtitleEl ? subtitleEl.textContent : '';
    if (headingEl) headingEl.textContent = '';
    if (subtitleEl) subtitleEl.textContent = '';
    // Fade the overlay in, then type its contents
    anime({
      targets: welcomeOverlay,
      opacity: [0, 1],
      duration: 600,
      easing: 'easeOutQuad',
      complete: async () => {
        // Once the overlay is fully visible, start typing the heading and subtitle.
        // The welcoming narration is started at scene load (in initScene1), so we only handle typing here.
        await typewriter(headingEl, originalHeading, 40);
        await typewriter(subtitleEl, originalSubtitle, 40);
      }
    });
    let overlayDismissed = false;
    // Dismiss the overlay.  When triggered by a user click, the slide1
    // narration plays.  Automatic dismissal does not trigger audio.
    function dismiss(byClick = false) {
      if (overlayDismissed) return;
      overlayDismissed = true;
      welcomeOverlay.style.pointerEvents = 'none';
      if (byClick) {
        // Play the narration for slide 1 only on user interaction
        playAudio('slide1');
      }
      anime({
        targets: welcomeOverlay,
        opacity: [1, 0],
        duration: 600,
        easing: 'easeInOutQuad',
        complete: () => {
          startEmailSequence();
        }
      });
    }
    welcomeOverlay.addEventListener('click', () => dismiss(true));
    // Auto dismiss after 10 seconds (no audio played)
    setTimeout(() => dismiss(false), 10000);
  }

  function startEmailSequence() {
    animateEmailAndCursor();
  }

  // After logo spin, show welcome overlay
  if (introLogo) {
    anime({
      targets: introLogo,
      opacity: [0, 1, 0],
      scale: [0, 1.2, 1],
      rotateY: [0, 720],
      duration: 2600,
      easing: 'easeInOutCubic',
      complete: () => {
        introLogo.style.display = 'none';
        showWelcome();
      }
    });
  } else {
    showWelcome();
  }
}

/* Scene 2: What is Phishing? */
function initScene2() {
  // Play the narration for the Outlook slide when scene 2 begins.  This
  // ensures the learner hears an explanation of the inbox interface.
  playAudio('slideOutlook');
  // Automated cinematic animation replaces the original interactive logic.
  (function() {
    const scene = document.getElementById('scene2');
    const emails = document.querySelectorAll('#scene2 .outlook-email');
    const subjectEl = document.getElementById('message-subject');
    const fromEl = document.getElementById('message-from');
    const toEl = document.getElementById('message-to');
    const dateEl = document.getElementById('message-date');
    const bodyEl = document.getElementById('message-body');
    const attachmentsEl = document.getElementById('attachments');
    const actionsEl = document.getElementById('message-actions');
    const reportDropdown = document.querySelector('#scene2 .report-dropdown');
    const reportBtn = reportDropdown ? reportDropdown.querySelector('.report-btn') : null;
    const reportMenu = reportDropdown ? reportDropdown.querySelector('.report-menu') : null;
    const navContainer = document.querySelector('#scene2 .nav-buttons');
    const customCursor = document.getElementById('customCursor');
    const celebrateOverlay = document.getElementById('celebrateOverlay');
    const successFullOverlay = document.getElementById('successFullOverlay');
    const decisionOverlay = document.getElementById('decisionOverlay');
    const successOverlay = document.getElementById('successOverlay');
    const dangerOverlay = document.getElementById('dangerOverlay');
    const emailCta = document.getElementById('emailCta2');
    const reportCta = document.getElementById('reportCta');
    // Hide unused interactive elements
    if (decisionOverlay) decisionOverlay.style.display = 'none';
    if (successOverlay) successOverlay.style.display = 'none';
    if (dangerOverlay) dangerOverlay.style.display = 'none';
    if (emailCta) emailCta.style.display = 'none';
    if (reportCta) reportCta.style.display = 'none';
    if (navContainer) {
      navContainer.style.opacity = 0;
      navContainer.style.pointerEvents = 'none';
    }
    // Reset email list and message panel
    emails.forEach(e => {
      e.style.opacity = 0;
      e.style.transform = 'translateY(20px)';
    });
    subjectEl.textContent = '';
    fromEl.textContent = '';
    toEl.textContent = '';
    dateEl.textContent = '';
    bodyEl.innerHTML = '';
    attachmentsEl.innerHTML = '';
    actionsEl.style.display = 'flex';
    actionsEl.style.opacity = 0;
    // Build the suspicious email content with highlights
    const suspiciousMessage = `
      Dear Employee,<br/><br/>
      We have detected <span class="danger-highlight">unusual activity</span> on your account. To maintain security, you must <span class="danger-highlight">reset your password immediately</span>.<br/><br/>
      Please click the link below to update your password:<br/>
      <a href="#" class="phish-link">https://kitopi-reset.com/update</a><br/><br/>
      If you think you received this message in error, please report it to the security team.
    `;
    // Pointer SVGs: reference the uploaded icons directly. Using relative
    // URLs simplifies the code and avoids embedding large inline SVG
    // definitions. These files are located in the project root and will
    // automatically be served by the browser.
    const normalURI = 'mousepointer-01.svg';
    const clickURI  = 'mousepointerclick-01.svg';
    const handURI   = 'handpointer-01.svg';
    // Reveal the single email row with a gentle float
    gsap.to(emails[0], { opacity: 1, y: 0, duration: 0.6, delay: 0.2 });
    // Populate message header and body
    subjectEl.textContent = 'Important: Update your password';
    fromEl.textContent = 'From: IT Security <security@kitopi.com>';
    toEl.textContent   = 'To: You <you@kitopi.com>';
    dateEl.textContent = 'Mon 10:15 AM';
    bodyEl.innerHTML   = suspiciousMessage;
    gsap.set(actionsEl, { opacity: 0 });
    // Wait for layout to compute positions
    setTimeout(() => {
      const containerRect = document.querySelector('.app-container').getBoundingClientRect();
      const emailRect = emails[0].getBoundingClientRect();
      const linkEl = bodyEl.querySelector('a.phish-link');
      const linkRect = linkEl.getBoundingClientRect();
      const reportBtnRect = reportBtn ? reportBtn.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
      if (reportMenu) { reportMenu.style.display = 'block'; reportMenu.style.opacity = '1'; }
      const phishingItem = reportMenu ? reportMenu.querySelector('li[data-action="phishing"]') : null;
      const phishingRect = phishingItem ? phishingItem.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
      if (reportMenu) { reportMenu.style.display = 'none'; reportMenu.style.opacity = '0'; }
      const startX = containerRect.left + 40;
      const startY = containerRect.top + containerRect.height - 60;
      const emailX = emailRect.left + emailRect.width - 30;
      const emailY = emailRect.top + emailRect.height / 2;
      const linkX  = linkRect.left + linkRect.width - 5;
      const linkY  = linkRect.top + linkRect.height / 2;
      const reportX = reportBtnRect.left + reportBtnRect.width / 2;
      const reportY = reportBtnRect.top + reportBtnRect.height / 2;
      const phishX  = phishingRect.left + phishingRect.width / 2;
      const phishY  = phishingRect.top + phishingRect.height / 2;
      const tl = gsap.timeline({ defaults: { ease: 'power1.inOut' } });
      tl.set(customCursor, { left: startX, top: startY, opacity: 1, backgroundImage: `url(${normalURI})` });
      tl.to(actionsEl, { opacity: 1, duration: 0.6 }, 0.2);
      tl.to(customCursor, { left: emailX, top: emailY, duration: 1.2, delay: 0.3 });
      tl.call(() => { customCursor.style.backgroundImage = `url(${clickURI})`; });
      tl.to(customCursor, { duration: 0.2 });
      tl.call(() => { customCursor.style.backgroundImage = `url(${normalURI})`; });
      tl.to([subjectEl, fromEl, toEl, dateEl, bodyEl], { opacity: 1, stagger: 0.1, duration: 0.6 }, '-=0.8');
      const highlights = Array.from(bodyEl.querySelectorAll('.danger-highlight'));
      if (highlights.length > 0) {
        tl.to(highlights, { backgroundColor: 'rgba(217,48,37,0.8)', repeat: 1, yoyo: true, duration: 0.6, stagger: 0.5 }, '+=0.3');
      }
      tl.call(() => { customCursor.style.backgroundImage = `url(${handURI})`; }, '+=0.1');
      tl.to(customCursor, { left: linkX, top: linkY, duration: 1.3 });
      tl.to(customCursor, { duration: 0.4 });
      tl.call(() => { customCursor.style.backgroundImage = `url(${normalURI})`; });
      // Move to the report button, click and release. We omit the drop‑down
      // navigation to simplify the timeline and avoid potential layout issues.
      tl.to(customCursor, { left: reportX, top: reportY, duration: 1.2 });
      tl.call(() => { customCursor.style.backgroundImage = `url(${clickURI})`; });
      tl.to(customCursor, { duration: 0.2 });
      tl.call(() => { customCursor.style.backgroundImage = `url(${normalURI})`; });
      // Show celebration overlay: set display at the start and fade in
      tl.call(() => { if (celebrateOverlay) { celebrateOverlay.style.display = 'flex'; } });
      tl.to(celebrateOverlay, { opacity: 1, duration: 0.5 });
      // Hold the celebration on screen for a moment
      tl.to({}, { duration: 1.0 });
      // Fade out and hide celebration overlay
      tl.to(celebrateOverlay, { opacity: 0, duration: 0.5, onComplete: () => { celebrateOverlay.style.display = 'none'; } });
      // Show success overlay: set display and fade in
      tl.call(() => { if (successFullOverlay) { successFullOverlay.style.display = 'flex'; } });
      tl.to(successFullOverlay, { opacity: 1, duration: 0.5 });
      // Keep success overlay on screen briefly
      tl.to({}, { duration: 1.2 });
      // Fade out and hide success overlay
      tl.to(successFullOverlay, { opacity: 0, duration: 0.5, onComplete: () => { successFullOverlay.style.display = 'none'; } });
      tl.to(navContainer, { opacity: 1, duration: 0.6, onComplete: () => { if (navContainer) navContainer.style.pointerEvents = 'auto'; } });
      tl.to(customCursor, { opacity: 0, duration: 0.4 });
    }, 100);
  })();
  // Prevent original scene2 logic from executing
  return;

  // Grab email rows and message display elements
  const emails = document.querySelectorAll('#scene2 .outlook-email');
  const subjectEl = document.getElementById('message-subject');
  const fromEl = document.getElementById('message-from');
  const toEl = document.getElementById('message-to');
  const dateEl = document.getElementById('message-date');
  const bodyEl = document.getElementById('message-body');
  const attachmentsEl = document.getElementById('attachments');
  const externalBar = document.getElementById('external-bar');
  const actionsEl = document.getElementById('message-actions');

  // Decision overlay elements for interactive choice. The overlay remains
  // hidden until an email is opened. When shown, it prompts the viewer
  // to decide what action to take on the suspicious message.
  const decisionOverlay = document.getElementById('decisionOverlay');
  const optionOpen = document.getElementById('decision-open');
  const optionReport = document.getElementById('decision-report');
  // Grab overlays and nav for later use
  const successOverlay = document.getElementById('successOverlay');
  const dangerOverlay = document.getElementById('dangerOverlay');
  const navContainer = document.querySelector('#scene2 .nav-buttons');
  const reportCallout = document.getElementById('reportCta');

  // Helper to show the decision overlay with a layered animation.
  // The overlay fades in while the card scales up and each option
  // slides into place. This encourages the learner to pause and consider
  // their choice without immediately hinting at the correct answer.
  function showDecision() {
    if (!decisionOverlay) return;
    decisionOverlay.style.display = 'flex';
    decisionOverlay.style.pointerEvents = 'auto';
    // Prepare the card and options for animation
    const card = decisionOverlay.querySelector('.decision-card');
    const options = decisionOverlay.querySelectorAll('.decision-option');
    // Reset transforms and opacity to allow repeated show/hide
    decisionOverlay.style.opacity = 0;
    if (card) card.style.transform = 'scale(0.9)';
    options.forEach(opt => {
      opt.style.opacity = 0;
      opt.style.transform = 'translateY(20px)';
    });
    // Animate overlay fade
    anime({
      targets: decisionOverlay,
      opacity: [0, 1],
      duration: 400,
      easing: 'easeOutQuad'
    });
    // Animate card scaling
    if (card) {
      anime({
        targets: card,
        scale: [0.9, 1],
        duration: 500,
        delay: 200,
        easing: 'easeOutBack'
      });
    }
    // Animate each option with a stagger
    anime({
      targets: options,
      opacity: [0, 1],
      translateY: [20, 0],
      delay: anime.stagger(100, { start: 300 }),
      duration: 400,
      easing: 'easeOutQuad'
    });
  }
  // Helper to hide the decision overlay and optionally run a callback.
  function hideDecision(callback) {
    if (!decisionOverlay) {
      if (callback) callback();
      return;
    }
    anime({
      targets: decisionOverlay,
      opacity: [1, 0],
      duration: 500,
      easing: 'easeInQuad',
      complete: () => {
        decisionOverlay.style.display = 'none';
        decisionOverlay.style.pointerEvents = 'none';
        if (callback) callback();
      }
    });
  }

  // Handle choice selection using direct event listeners on each option.
  // When the user selects an option, fade out the decision overlay and
  // display a corresponding feedback overlay, then reveal navigation.
  if (optionOpen) {
    optionOpen.addEventListener('click', (e) => {
      e.stopPropagation();
      hideDecision(() => {
        if (reportCallout) reportCallout.style.opacity = 0;
        // Show danger overlay for incorrect choice
        dangerOverlay.style.pointerEvents = 'auto';
        anime({
          targets: dangerOverlay,
          opacity: [0, 1],
          duration: 600,
          easing: 'easeOutQuad',
          complete: () => {
            setTimeout(() => {
              anime({
                targets: dangerOverlay,
                opacity: [1, 0],
                duration: 600,
                easing: 'easeInQuad',
                complete: () => {
                  dangerOverlay.style.pointerEvents = 'none';
                  anime({ targets: navContainer, opacity: [0, 1], duration: 600, easing: 'easeOutQuad' });
                }
              });
            }, 1800);
          }
        });
      });
    });
  }
  if (optionReport) {
    optionReport.addEventListener('click', (e) => {
      e.stopPropagation();
      // When the user chooses to report, hide the decision prompt then
      // highlight the report button to draw attention. After the
      // highlight animation, automatically show success feedback and
      // navigation to progress the scenario. This flow mirrors a real
      // training scenario where the learner first decides to report
      // phishing and then takes the appropriate action.
      hideDecision(async () => {
        // Show the callout instructing the learner to use the report icon
        if (reportCallout) reportCallout.style.opacity = 1;
        // Highlight the report button and wait for the animation to complete
        await highlightReportButton();
        // Fade out the callout after highlighting
        if (reportCallout) {
          anime({ targets: reportCallout, opacity: [1, 0], duration: 400, easing: 'easeOutQuad' });
        }
        // Show success overlay and reveal navigation
        successOverlay.style.pointerEvents = 'auto';
        anime({
          targets: successOverlay,
          opacity: [0, 1],
          duration: 600,
          easing: 'easeOutQuad',
          complete: () => {
            setTimeout(() => {
              anime({
                targets: successOverlay,
                opacity: [1, 0],
                duration: 600,
                easing: 'easeInQuad',
                complete: () => {
                  successOverlay.style.pointerEvents = 'none';
                  anime({ targets: navContainer, opacity: [0, 1], duration: 600, easing: 'easeOutQuad' });
                }
              });
            }, 1500);
          }
        });
      });
    });
  }
  // Define the message content for each email (index order)
  const messages = [
    {
      // Single suspicious password update email
      from: 'IT Security <security@kitopi.com>',
      to: 'You <you@kitopi.com>',
      subject: 'Important: Update your password',
      date: 'Mon 10:15 AM',
      body:
        'Dear Employee,\n\nWe have detected unusual activity on your account. To maintain security, you must reset your password immediately.\n\nPlease click the link below to update your password:\n\nhttps://kitopi-reset.com/update\n\nIf you think you received this message in error, please report it to the security team using the flag icon above.\n\nBest regards,\n\nIT Security Team',
      domainOk: false,
      attachments: []
    }
  ];
  // Animate each email row into view and set up click handlers
  emails.forEach((email, idx) => {
    // animate row in
    setTimeout(() => {
      email.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      email.style.opacity = '1';
      email.style.transform = 'translateY(0)';
      // Show CTA instructing user to open email after animation
      if (idx === 0) {
        // Position and show callout near the email row
        const emailCta = document.getElementById('emailCta2');
        const containerRect = document.querySelector('#scene2 .outlook-list').getBoundingClientRect();
        const rowRect = email.getBoundingClientRect();
        emailCta.style.left = `${rowRect.left - containerRect.left + rowRect.width * 0.5}px`;
        emailCta.style.top = `${rowRect.top - containerRect.top - 30}px`;
        emailCta.style.transform = 'translateX(-50%)';
        emailCta.style.opacity = 1;
      }
    }, 200);
    email.addEventListener('click', () => {
      // Remove active class from all rows
      emails.forEach(el => el.classList.remove('active'));
      email.classList.add('active');
      // Hide email callout once selected
      const emailCta = document.getElementById('emailCta2');
      if (emailCta) emailCta.style.opacity = 0;
      // Populate message details from the single message
      const msg = messages[0];
      subjectEl.textContent = msg.subject;
      fromEl.textContent = `From: ${msg.from}`;
      toEl.textContent = `To: ${msg.to}`;
      dateEl.textContent = msg.date;
      bodyEl.innerHTML = msg.body.replace(/https:\/\/(\S+)/g, '<a href="$1" class="phish-link">$1</a>');
      // external bar visible for domain mismatch
      externalBar.style.display = msg.domainOk ? 'none' : 'flex';
      attachmentsEl.innerHTML = '';
      // Show actions
      actionsEl.style.display = 'flex';
      // Position the report callout but keep it hidden; our decision overlay
      // will guide the user instead of highlighting the report button directly.
      const reportBtn = actionsEl.querySelector('.report-btn');
      if (reportCallout && reportBtn) {
        const containerRect2 = actionsEl.getBoundingClientRect();
        const btnRect = reportBtn.getBoundingClientRect();
        reportCallout.style.left = `${btnRect.left - containerRect2.left + btnRect.width / 2}px`;
        reportCallout.style.top = `${btnRect.top - containerRect2.top - 40}px`;
        reportCallout.style.transform = 'translateX(-50%)';
        reportCallout.style.opacity = 0;
      }
      // Show decision overlay shortly after displaying the message
      setTimeout(() => {
        showDecision();
      }, 400);
    });
  });

  // Hide actions initially
  actionsEl.style.display = 'none';
  // Hide nav until user finishes scenario
  navContainer.style.opacity = 0;

  // Report dropdown handling. We toggle the contextual menu when the user clicks
  // the report button, and hide it when clicking outside. Selecting a menu
  // option triggers the success overlay if it corresponds to a reporting
  // action (e.g., junk, phishing, not junk).
  const reportDropdown = document.querySelector('#scene2 .report-dropdown');
  if (reportDropdown) {
    const reportBtn = reportDropdown.querySelector('.report-btn');
    const reportMenu = reportDropdown.querySelector('.report-menu');
    // Toggle menu visibility on button click
    reportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Hide report callout if present
      const reportCta = document.getElementById('reportCta');
      if (reportCta) reportCta.style.opacity = 0;
      // Toggle display
      const isOpen = reportMenu.style.display === 'block';
      reportMenu.style.display = isOpen ? 'none' : 'block';
      reportBtn.setAttribute('aria-expanded', !isOpen);
    });
    // Handle menu item selection
    reportMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      const li = e.target.closest('li');
      if (!li) return;
      const action = li.getAttribute('data-action');
      // Close the menu
      reportMenu.style.display = 'none';
      reportBtn.setAttribute('aria-expanded', 'false');
      // If the chosen option is one of the reporting categories, show success overlay
      if (action === 'junk' || action === 'phishing' || action === 'notjunk') {
        const successOverlay = document.getElementById('successOverlay');
        successOverlay.style.pointerEvents = 'auto';
        anime({
          targets: successOverlay,
          opacity: [0, 1],
          duration: 600,
          easing: 'easeOutQuad',
          complete: () => {
            setTimeout(() => {
              anime({
                targets: successOverlay,
                opacity: [1, 0],
                duration: 600,
                easing: 'easeInQuad',
                complete: () => {
                  successOverlay.style.pointerEvents = 'none';
                  // Reveal navigation
                  anime({ targets: navContainer, opacity: [0, 1], duration: 600, easing: 'easeOutQuad' });
                }
              });
            }, 1500);
          }
        });
      }
    });
    // Close the menu when clicking outside
    document.addEventListener('click', () => {
      if (reportMenu.style.display === 'block') {
        reportMenu.style.display = 'none';
        reportBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Event listener for phishing link click
  // We delegate to message body
  bodyEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('phish-link')) {
      e.preventDefault();
      // Hide report callout
      const reportCta = document.getElementById('reportCta');
      if (reportCta) reportCta.style.opacity = 0;
      // Show danger overlay
      const dangerOverlay = document.getElementById('dangerOverlay');
      dangerOverlay.style.pointerEvents = 'auto';
      anime({
        targets: dangerOverlay,
        opacity: [0, 1],
        duration: 600,
        easing: 'easeOutQuad',
        complete: () => {
          setTimeout(() => {
            anime({
              targets: dangerOverlay,
              opacity: [1, 0],
              duration: 600,
              easing: 'easeInQuad',
              complete: () => {
                dangerOverlay.style.pointerEvents = 'none';
                // Show nav
                anime({ targets: navContainer, opacity: [0, 1], duration: 600, easing: 'easeOutQuad' });
              }
            });
          }, 1800);
        }
      });
    }
  });

  /**
   * Highlight the report button with a green flashing outline. This helper
   * creates (if necessary) an overlay element positioned over the report
   * button. Using Anime.js, it animates the overlay’s opacity through a
   * series of pulses to draw the learner’s attention. The function
   * returns a promise that resolves when the animation completes.
   */
  function highlightReportButton() {
    return new Promise(resolve => {
      const reportBtn = document.querySelector('#scene2 .report-dropdown .report-btn');
      if (!reportBtn) {
        resolve();
        return;
      }
      // Add a CSS class to trigger a flashing animation defined in the
      // stylesheet. The animation will run once and then remove the
      // class to reset the button.  This avoids manual manipulation of
      // overlay elements and ensures consistent timing.
      reportBtn.classList.add('highlighting');
      // Remove the highlighting class after the animation completes.
      setTimeout(() => {
        reportBtn.classList.remove('highlighting');
        resolve();
      }, 1400);
    });
  }
}

/* Scene 3: Social Engineering */
function initScene3() {
  // Play the narration that describes the card details when this scene starts.
  // This audio explains how social engineering works before the slideshow begins.
  playAudio('cardsDetails');

  // Automatically cycle through social engineering examples. We avoid
  // user‑controlled sliders here to ensure a guided demonstration.
  const data = [
    {
      icon: 'fa-phone-volume',
      title: 'Caller ID spoof',
      text: 'Attackers impersonate trusted contacts by spoofing caller IDs.'
    },
    {
      icon: 'fa-comments',
      title: 'Fake IT chat',
      text: 'Pretend support chats ask for credentials or share malicious links.'
    },
    {
      icon: 'fa-truck',
      title: 'Delivery badge zoom',
      text: 'Scammers pose as couriers to gain physical access or deliver malware.'
    }
  ];
  const slideEl = document.getElementById('se-slide');
  const indicatorsContainer = document.getElementById('se-indicators');
  // Create indicator dots
  indicatorsContainer.innerHTML = '';
  data.forEach((_, idx) => {
    const bullet = document.createElement('div');
    bullet.classList.add('bullet');
    if (idx === 0) bullet.classList.add('active');
    indicatorsContainer.appendChild(bullet);
  });
  const bullets = indicatorsContainer.querySelectorAll('.bullet');
  let current = 0;
  async function showSlide(index) {
    const item = data[index];
    // Update indicator state
    bullets.forEach((b, i) => {
      b.classList.toggle('active', i === index);
    });
    // Fade out current content
    await anime({
      targets: slideEl,
      opacity: [1, 0],
      duration: 300,
      easing: 'easeInQuad'
    }).finished;
    // Update icon and clear title/text
    const iconContainer = slideEl.querySelector('.se-icon');
    iconContainer.innerHTML = `<i class="fas ${item.icon}"></i>`;
    const titleEl = slideEl.querySelector('.se-title');
    const textEl = slideEl.querySelector('.se-text');
    const titleText = item.title;
    const bodyText = item.text;
    titleEl.textContent = '';
    textEl.textContent = '';
    // Fade the slide back in while typing
    anime({
      targets: slideEl,
      opacity: [0, 1],
      duration: 500,
      easing: 'easeOutQuad'
    });
    await typewriter(titleEl, titleText, 35);
    await typewriter(textEl, bodyText, 30);
  }
  // Hide the slide initially to prevent a flash before the first fade/typing
  slideEl.style.opacity = '0';
  // Show the first slide and type its content
  showSlide(0);
  // Start cycling through slides every 8 seconds to allow typing to finish
  setInterval(() => {
    current = (current + 1) % data.length;
    showSlide(current);
  }, 8000);
}

/* Scene 4: Red Flags */
function initScene4() {
  // Play the narration describing common red flags.  This audio sets up
  // the context for the sequential animations below.
  playAudio('redFlags');

  // Animate each red flag sequentially. Each item slides in and its text
  // is typed using the typewriter helper. This new implementation
  // targets .flag-item and .flag-text instead of email lines.
  const items = Array.from(document.querySelectorAll('#scene4 .flag-item'));
  // Animate each red flag sequentially using timeouts. Each item slides in and
  // then types its text. Using timeouts avoids issues with anime promises
  // sometimes not resolving on static pages.
  items.forEach((item, idx) => {
    const textEl = item.querySelector('.flag-text');
    const original = textEl ? textEl.textContent.trim() : '';
    if (textEl) textEl.textContent = '';
    const delay = idx * 1600; // delay between items
    setTimeout(() => {
      // slide in the item
      anime({
        targets: item,
        opacity: [0, 1],
        translateX: [-20, 0],
        duration: 600,
        easing: 'easeOutQuad'
      });
      // type the text after a brief moment so the slide is visible
      setTimeout(() => {
        typewriter(textEl, original, 35);
      }, 300);
    }, delay);
  });
}

/* Scene 5: What to Do When It Feels Off */
function initScene5() {
  // Play the narration explaining what to do when something feels off.  It
  // accompanies the animated demonstration of hovering over a suspicious link.
  playAudio('hoverOver');

  // Scene 5 demonstrates what to do when you encounter a suspicious link.
  // We hide the real cursor and animate a fake cursor to hover over the link,
  // display the tooltip, then cascade in the recommended actions.
  const scene5 = document.getElementById('scene5');
  const customCursor = scene5.querySelector('.custom-cursor');
  const tooltip = document.getElementById('action-tooltip');
  const understoodBtn = document.getElementById('understoodBtn');
  const linkEl = scene5.querySelector('.suspicious-link');
  const actionCards = scene5.querySelectorAll('.action-card');
  // Position fake cursor initially at bottom left of the mouse area
  const mouseArea = scene5.querySelector('.mouse-area');
  const areaRect = mouseArea.getBoundingClientRect();
  customCursor.style.left = '20px';
  customCursor.style.top = `${areaRect.height - 40}px`;
  // Compute target coordinates relative to the mouse area when layout is ready
  requestAnimationFrame(() => {
    const linkRect = linkEl.getBoundingClientRect();
    const areaRect2 = mouseArea.getBoundingClientRect();
    const targetX = linkRect.left - areaRect2.left + linkRect.width / 2;
    const targetY = linkRect.top - areaRect2.top + linkRect.height / 2;
    // Move cursor slowly to the link, giving the viewer time to read the instructions
    anime({
      targets: customCursor,
      left: targetX,
      top: targetY,
      // Move more slowly so viewers can follow the pointer across the screen
      duration: 2500,
      easing: 'easeInOutQuad',
      // Wait longer before starting to move so the instruction text can be read
      delay: 2000,
      complete: () => {
        // After the cursor arrives, wait a bit before revealing the tooltip
        setTimeout(() => {
          anime({ targets: customCursor, opacity: [1, 0], duration: 500, easing: 'easeOutQuad' });
          tooltip.style.opacity = '1';
          tooltip.style.visibility = 'visible';
        }, 1000);
      }
    });
  });
  // When Understood button is clicked, hide tooltip and cursor and show action cards with typing
  if (understoodBtn) {
    understoodBtn.addEventListener('click', () => {
      // Hide tooltip
      tooltip.style.opacity = '0';
      tooltip.style.visibility = 'hidden';
      // Fade out fake cursor
      anime({ targets: customCursor, opacity: [1, 0], duration: 500, easing: 'easeOutQuad' });
      // Cascade action cards with typewriter effect on labels
      actionCards.forEach((card, idx) => {
        const labelEl = card.querySelector('.card-text');
        const originalText = labelEl ? labelEl.textContent.trim() : '';
        if (labelEl) labelEl.textContent = '';
        setTimeout(() => {
          // animate card appearance
          card.style.animation = `floatIn 0.8s forwards`;
          // type the label once animation begins
          typewriter(labelEl, originalText, 35);
        }, idx * 700 + 300);
      });
    });
  }
}

/* Scene 6: BEC Scenario */
function initScene6() {
  // Play the narration for the BEC (Business Email Compromise) scenario when
  // this scene begins.  This helps frame the content as the learner
  // interacts with the flip card.
  playAudio('BEC');

  const card = document.getElementById('bec-card');
  const buttons = card.querySelectorAll('.flip-btn');
  // No automatic flipping – user must click the button to view headers.
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });
  });
}

/* Scene 7: Social Engineering Examples */
function initScene7() {
  // Play the narration for the social engineering module.  This audio
  // introduces the different examples that appear in the grid below.
  playAudio('socialEngineering');

  const tiles = document.querySelectorAll('#scene7 .tile');
  const modal = document.getElementById('tile-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalRisk = document.getElementById('modal-risk');
  const closeModal = document.querySelector('.close-modal');
  // Define risk scores for each type
  const riskMap = {
    'Wire Fraud': 'High risk (85%)',
    'Fake IT Support': 'Medium risk (65%)',
    'Malware Link': 'High risk (80%)',
    'HR Impersonation': 'Medium risk (70%)'
  };
  // Fade in the instruction note using typewriter
  const noteEl = document.querySelector('#scene7 .scene7-note');
  if (noteEl) {
    // Ensure the note is visible before typing; initially it may be hidden via CSS
    noteEl.style.opacity = '1';
    const text = noteEl.textContent.trim();
    noteEl.textContent = '';
    typewriter(noteEl, text, 35);
  }
  tiles.forEach((tile, idx) => {
    // Animate tile float in
    tile.style.animation = `floatIn 0.8s forwards`;
    tile.style.animationDelay = `${idx * 0.2 + 0.6}s`;
    // Type the label text after the tile has started to appear
    const labelEl = tile.querySelector('span');
    const original = labelEl ? labelEl.textContent.trim() : '';
    if (labelEl) labelEl.textContent = '';
    setTimeout(() => {
      typewriter(labelEl, original, 35);
    }, (idx * 0.2 + 0.6) * 1000 + 400);
    // Click handler remains so users can explore on their own
    tile.addEventListener('click', () => {
      const title = original;
      const info = tile.getAttribute('data-info');
      modalTitle.textContent = title;
      modalDesc.textContent = info;
      modalRisk.textContent = riskMap[title] || 'Risk not assessed';
      modal.style.display = 'flex';
    });
  });
  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}

/* Scene 8: Final Tips */
function initScene8() {
  // Play the narration for the final tips when this scene begins.  The
  // accompanying audio reinforces the key takeaways as each tip appears.
  playAudio('finalTips');

  // Animate each tip item in the final checklist. Each tip slides in and
  // the text is typed; once finished, the checkmark is marked as checked.
  const items = document.querySelectorAll('#scene8 .tip-item');
  items.forEach((item, idx) => {
    const textEl = item.querySelector('.tip-text');
    const checkEl = item.querySelector('.checkmark');
    const original = textEl ? textEl.textContent.trim() : '';
    if (textEl) textEl.textContent = '';
    setTimeout(() => {
      // Animate the container into view
      anime({
        targets: item,
        opacity: [0, 1],
        translateX: [-20, 0],
        duration: 600,
        easing: 'easeOutQuad'
      });
      // Type the tip text
      typewriter(textEl, original, 35).then(() => {
        if (checkEl) checkEl.classList.add('checked');
      });
    }, 600 + idx * 2000);
  });
}

/* Scene 9: Closing Scene */
function initScene9() {
  // Play the ending narration as the closing scene begins.  This final
  // audio thanks the learner and provides closing remarks.
  playAudio('ending');

  // Animate mask to shield crossfade with a slight delay to allow viewers to notice the mask first
  const maskSvg = document.getElementById('maskSvg');
  const shieldSvg = document.getElementById('shieldSvg');
  if (maskSvg && shieldSvg) {
    // Keep the mask visible for 4 seconds before morphing to the shield
    anime({
      targets: maskSvg,
      opacity: [1, 0],
      scale: [1, 0.5],
      duration: 1800,
      easing: 'easeInOutQuad',
      delay: 4000
    });
    anime({
      targets: shieldSvg,
      opacity: [0, 1],
      scale: [0.5, 1],
      duration: 1800,
      easing: 'easeInOutQuad',
      delay: 4000
    });
  }
  // Animate CTA buttons sequentially: fade them in and type their labels after the morph
  const buttons = document.querySelectorAll('#scene9 .cta-btn');
  buttons.forEach((btn, idx) => {
    const textEl = btn.querySelector('.cta-text');
    const original = textEl ? textEl.textContent.trim() : '';
    if (textEl) textEl.textContent = '';
    setTimeout(() => {
      anime({
        targets: btn,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800,
        easing: 'easeOutQuad'
      });
      typewriter(textEl, original, 35);
    }, 6000 + idx * 1400);
  });
}
