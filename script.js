(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const popmotion = window.popmotion;
    const scenes = Array.from(document.querySelectorAll('.scene'));
    let currentScene = 0;
    (function determineStartScene() {
      const search = window.location.search.replace(/^\?/, '').toLowerCase();
      if (!search) return;
      const params = new URLSearchParams(window.location.search);
      let sceneParam = params.get('scene');
      if (!sceneParam) {
        const token = search.replace(/^=/, '').split('&')[0];
        if (token.startsWith('scene')) {
          sceneParam = token.replace('scene', '');
        } else {
          sceneParam = token;
        }
      }
      if (!sceneParam) return;
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
        currentScene = sceneIndex;
      }
    })();
    let typedIntro = null;
    let typedEmail = null;
    let typedFinal = null;
    let carouselInterval = null;
    let sceneTimers = [];
    const sceneAudios = [];
    const audioFiles = [
      'Welcoming.wav',
      'slide1.wav',
      'slide2.wav',
      'slide3.wav',
      'slide4.wav',
      'slide5.wav',
      'slide6.wav',
      'slide7.wav',
      'slide8.wav',
      'slide9.wav'
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
    const rootStyles = getComputedStyle(document.documentElement);
    const colorAccent = rootStyles.getPropertyValue('--accent').trim() || '#3bb273';
    const colorWarning = rootStyles.getPropertyValue('--warning').trim() || '#f39c12';
    const colorDanger = rootStyles.getPropertyValue('--danger').trim() || '#e74c3c';
        function showScene(idx, noAnim = false) {
      idx = Math.max(0, Math.min(idx, scenes.length - 1));
      const prev = scenes[currentScene];
      const next = scenes[idx];
      if (prev && prev !== next) {
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
      cleanupScenes();
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
    document.querySelectorAll('.next-btn').forEach(btn => {
      btn.onclick = () => showScene(currentScene + 1);
    });
    document.querySelectorAll('.prev-btn').forEach(btn => {
      btn.onclick = () => showScene(currentScene - 1);
    });
        function cleanupScenes() {
      sceneTimers.forEach(t => clearTimeout(t));
      sceneTimers = [];
      if (typedIntro) {
        typedIntro.destroy();
        typedIntro = null;
      }
      if (typedEmail) {
        typedEmail.destroy();
        typedEmail = null;
      }
      if (typeof typedFinal !== 'undefined' && typedFinal) {
        try {
          typedFinal.destroy();
        } catch (e) {}
        typedFinal = null;
      }
      if (typeof carouselInterval !== 'undefined' && carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
      }
      const envelopeTop = document.getElementById('envelopeTop');
      if (envelopeTop) {
        gsap.set(envelopeTop, { rotationX: 0 });
      }
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
      const phishSamples = document.getElementById('phishSamples');
      if (phishSamples) {
        phishSamples.innerHTML = '';
      }
      const seCarousel = document.getElementById('seCarousel');
      const carouselIndicators = document.getElementById('carouselIndicators');
      if (seCarousel) seCarousel.innerHTML = '';
      if (carouselIndicators) carouselIndicators.innerHTML = '';
      const stepsContainer = document.getElementById('stepsContainer');
      if (stepsContainer) stepsContainer.innerHTML = '';
      const becContainer = document.getElementById('becContainer');
      if (becContainer) becContainer.innerHTML = '';
      const examplesContainer = document.getElementById('examplesContainer');
      if (examplesContainer) examplesContainer.innerHTML = '';
      const redFlagsContainer = document.getElementById('redFlagsContainer');
      if (redFlagsContainer) redFlagsContainer.innerHTML = '';
      const tipsContainer = document.getElementById('tipsContainer');
      if (tipsContainer) tipsContainer.innerHTML = '';
      const closingContainer = document.getElementById('closingContainer');
      if (closingContainer) closingContainer.innerHTML = '';
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
        function typeEffect(el, lines, speed = 40, lineDelay = 800, callback) {
      let lineIndex = 0;
      el.innerHTML = '';
      function typeLine() {
        const line = lines[lineIndex];
        const span = document.createElement('span');
        el.appendChild(span);
        let charIndex = 0;
        function typeChar() {
          span.innerHTML = line.slice(0, charIndex + 1);
          charIndex++;
          if (charIndex < line.length) {
            setTimeout(typeChar, speed);
          } else {
            lineIndex++;
            if (lineIndex < lines.length) {
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
                try {
      if (window.VANTA && window.VANTA.DOTS) {
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
    function runScene(idx) {
      switch (idx) {
        case 0: runScene1(); break;
        case 1: runScene2(); break;
        case 2: runSceneXRay(); break;
        case 3: runScene3(); break;
        case 4: runScene4(); break;
        case 5: runCommonRedFlags(); break;
        case 6: runScene5(); break;
        case 7: runScene6(); break;
        case 8: runScene7(); break;
        case 9: runScene8(); break;
        case 10: runScene9(); break;
      }
    }
        function runScene1() {
      const sceneEl = scenes[0];
      const title = sceneEl.querySelector('.main-title');
      const words = sceneEl.querySelectorAll('.link-text');
      const startBtn = sceneEl.querySelector('.start-btn');
      if (!title || !words || !startBtn) return;
      try {
        const welcomeAudio = sceneAudios && sceneAudios[0];
        if (welcomeAudio && welcomeAudio.paused) {
          welcomeAudio.muted = true;
          const playPromise = welcomeAudio.play();
          if (playPromise && typeof playPromise.then === 'function') {
            playPromise.catch(() => {});
          }
          setTimeout(() => {
            welcomeAudio.muted = false;
          }, 200);
        }
      } catch (e) {
      }
      gsap.set(title, { opacity: 0, y: 20 });
      gsap.set(words, { opacity: 0, y: 20, scale: 1, fontSize: '130px' });
      gsap.set(startBtn, { opacity: 0, y: 20 });
      const tl = gsap.timeline();
      tl.to(title, { opacity: 1, y: 0, duration: 1.8, ease: 'power2.out' });
      tl.to(title, { opacity: 1, duration: 1.2 });
      tl.to(title, { opacity: 0, y: -40, duration: 1.2, ease: 'power2.inOut' });
      tl.set(title, { display: 'none' });
      tl.to(words, { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out', stagger: 0.4 }, '-=0.8');
      tl.to(startBtn, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '+=0.8');
    }
        function runScene2() {
      const card = document.getElementById('emailCard');
      const emailContent = document.getElementById('emailContent');
      if (!card || !emailContent) return;
      const inner = card.querySelector('.card-inner') || card;
      gsap.set(inner, { rotationY: 0 });
      if (emailContent) {
        emailContent.style.opacity = '1';
      }
      const emailElReset = document.getElementById('emailTyped');
      if (emailElReset) emailElReset.innerHTML = '';
      const scribbleSvgReset = document.getElementById('emailScribble');
      if (scribbleSvgReset) scribbleSvgReset.innerHTML = '';
      gsap.fromTo(card, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, ease: 'back.out(1.7)' });
      gsap.fromTo(emailContent, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out', delay: 0.6 });
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
        sceneTimers.push(setTimeout(() => {
          flipEmailCard();
        }, 3200));
      });
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
        function flipEmailCard() {
      const card = document.getElementById('emailCard');
      if (!card) return;
      const inner = card.querySelector('.card-inner') || card;
      gsap.to(inner, {
        rotationY: 180,
        duration: 1.0,
        ease: 'power2.inOut'
      });
    }
        function highlightSuspiciousDomain() {
      const domainSpan = document.querySelector('#emailContent .email-domain');
      const emailContent = document.getElementById('emailContent');
      const scribbleSvg = document.getElementById('emailScribble');
      if (!domainSpan || !emailContent || !scribbleSvg) return;
      setTimeout(() => {
        const domainRect = domainSpan.getBoundingClientRect();
        const containerRect = emailContent.getBoundingClientRect();
        const x = domainRect.left - containerRect.left;
        const y = domainRect.top - containerRect.top;
        const width = domainRect.width;
        const height = domainRect.height;
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
        gsap.fromTo(group, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)' });
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
        function runScene3() {
      const container = document.getElementById('phishSamples');
      if (!container) return;
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
        card.style.opacity = '0';
        card.style.transform = 'translateY(-40px) scale(0.95)';
        container.appendChild(card);
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
    }
        function runScene4() {
      const slider = document.getElementById('seBlogSlider');
      if (!slider) return;
      const wrapper = slider.querySelector('.blog-slider__wrp');
      const slides = Array.from(wrapper.children);
      const pagination = slider.querySelector('.blog-slider__pagination');
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
        if (i < 0) i = slides.length - 1;
        if (i >= slides.length) i = 0;
        slides[currentIndex].classList.remove('active');
        bullets[currentIndex].classList.remove('active');
        currentIndex = i;
        slides[currentIndex].classList.add('active');
        bullets[currentIndex].classList.add('active');
      }
      show(0);
      carouselInterval = setInterval(() => {
        show(currentIndex + 1);
      }, 4000);
    }
        function runCommonRedFlags() {
      const container = document.getElementById('redFlagsContainer');
      if (!container) return;
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
        textSpan.innerHTML = flag.text;
        item.appendChild(iconSpan);
        item.appendChild(textSpan);
        item.style.opacity = '0';
        container.appendChild(item);
        sceneTimers.push(setTimeout(() => {
          gsap.fromTo(item, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power2.out' });
        }, 600 + idx * 1600));
      });
    }
        function runScene5() {
      const container = document.getElementById('stepsContainer');
      if (!container) return;
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
      const linkEl = demoWrapper.querySelector('.demo-link');
      sceneTimers.push(setTimeout(() => {
        if (!linkEl) return;
        const pointerW = pointer.offsetWidth || 32;
        const pointerH = pointer.offsetHeight || 32;
        const linkRect = linkEl.getBoundingClientRect();
        const wrapRect = demoWrapper.getBoundingClientRect();
        const endX = linkRect.left - wrapRect.left + (linkRect.width - pointerW) / 2;
        const endY = linkRect.top - wrapRect.top - pointerH * 0.5 - 4;
        gsap.to(pointer, {
          opacity: 1,
          x: endX,
          y: endY,
          duration: 1.5,
          ease: 'power2.out',
          onComplete: () => {
            gsap.to(pointer, {
              scale: 0.9,
              duration: 0.3,
              yoyo: true,
              repeat: 1,
              onComplete: () => {
                try {
                  pointer.style.display = 'none';
                  demoText.style.opacity = '0';
                  demoWrapper.style.filter = 'grayscale(1)';
                  demoWrapper.style.position = 'relative';
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
                  overlay.style.background = 'rgba(0, 0, 0, 0.75)';
                  overlay.style.borderRadius = getComputedStyle(demoWrapper).borderRadius;
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
                  const textContainer = document.createElement('div');
                  textContainer.style.display = 'flex';
                  textContainer.style.flexDirection = 'column';
                  textContainer.style.lineHeight = '1.2';
                  const headingEl = document.createElement('span');
                  headingEl.textContent = 'PAUSE';
                  headingEl.style.fontFamily = 'Montserrat, sans-serif';
                  headingEl.style.fontWeight = '800';
                  headingEl.style.fontSize = '20px';
                  headingEl.style.color = '#ffffff';
                  headingEl.style.marginBottom = '2px';
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
                  if (window.Typed) {
                    new Typed('#' + typedEl.id, {
                      strings: ['Never trust any link until you verify its legitimacy.'],
                      typeSpeed: 40,
                      showCursor: false
                    });
                  } else if (window.typed) {
                    new window.typed('#' + typedEl.id, {
                      strings: ['Never trust any link until you verify its legitimacy.'],
                      typeSpeed: 40,
                      showCursor: false
                    });
                  } else {
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
        sceneTimers.push(setTimeout(() => {
          gsap.fromTo(item, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power2.out' });
        }, 3000 + idx * 2000));
      });
    }
        function runScene6() {
      const container = document.getElementById('becContainer');
      if (!container) return;
      container.style.position = 'relative';
      const layout = document.createElement('div');
      layout.style.display = 'flex';
      layout.style.width = '100%';
      layout.style.height = '100%';
      const list = document.createElement('div');
      list.style.flex = '0 0 30%';
      list.style.borderRight = '1px solid rgba(255,255,255,0.1)';
      list.style.padding = '8px';
      list.style.overflow = 'hidden';
      const panel = document.createElement('div');
      panel.style.flex = '1';
      panel.style.position = 'relative';
      panel.style.display = 'flex';
      panel.style.flexDirection = 'column';
      panel.style.overflow = 'hidden';
      layout.appendChild(list);
      layout.appendChild(panel);
      container.appendChild(layout);
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
      sceneTimers.push(setTimeout(() => {
        const becMail = { from: 'Manager', subject: 'Urgent Vendor Payment Request', time: 'Now' };
        const item = createMailItem(becMail);
        item.style.background = 'rgba(255,0,0,0.15)';
        list.insertBefore(item, list.firstChild);
        gsap.fromTo(item, { opacity: 0 }, { opacity: 1, duration: 1.0, ease: 'power2.out' });
        const pointer = document.createElement('div');
        pointer.classList.add('bec-pointer-img');
        pointer.style.backgroundImage = "url('Images/cursor.png')";
        pointer.style.backgroundSize = 'contain';
        pointer.style.backgroundRepeat = 'no-repeat';
        pointer.style.left = '8px';
        pointer.style.top = '8px';
        container.appendChild(pointer);
        animateBecSequence({ pointer, panel, container, list, item });
      }, 4000));
    }
        async function animateBecSequence({ pointer, panel, container, list, item }) {
      if (container.dataset.becAnimating === 'true') return;
      container.dataset.becAnimating = 'true';
      try {
        await movePointer(pointer, item, 1.5);
      } catch (e) {
      }
      createClickRingAtPointer(pointer);
      await new Promise(r => setTimeout(r, 700));
      item.classList.add('bec-selected');
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
      await new Promise(r => setTimeout(r, 1400));
      displayBecMessage(panel);
      await new Promise(r => setTimeout(r, 600));
      const highlightEls = Array.from(panel.querySelectorAll('.highlight-target'));
      const reportBtnElm = panel.querySelector('.report-btn');
      if (!reportBtnElm || highlightEls.length === 0) {
        const sceneContainer = container.closest('.scene') || container;
        showSuccessOverlay(sceneContainer);
        container.dataset.becAnimating = 'false';
        return;
      }
      for (const h of highlightEls) {
          try {
            await movePointer(pointer, h, 1.5);
          } catch (e) {
          }
          await new Promise(r => setTimeout(r, 1300));
      }
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
      const menuData = createReportMenu(reportBtnElm, panel);
      const phishingRow = menuData && menuData.phishingRow;
      if (!phishingRow) {
        const sceneContainer3 = container.closest('.scene') || container;
        showSuccessOverlay(sceneContainer3);
        container.dataset.becAnimating = 'false';
        return;
      }
      await new Promise(r => setTimeout(r, 1100));
      try {
        await movePointer(pointer, phishingRow, 1.4);
        createClickRingAtPointer(pointer);
      } catch (e) {
      }
      phishingRow.classList.add('highlight');
      await new Promise(r => setTimeout(r, 900));
      const sceneContainer4 = container.closest('.scene') || container;
      showSuccessOverlay(sceneContainer4);
      container.dataset.becAnimating = 'false';
    }
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
    }
        function runScene8() {
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
        function runScene9() {
      const container = document.getElementById('closingContainer');
      if (!container) return;
      container.innerHTML = '';
      container.classList.add('closing-new');
      const defaultHeading = document.querySelector('#scene9 .scene-heading');
      if (defaultHeading) {
        defaultHeading.style.display = 'none';
      }
      const heroDiv = document.createElement('div');
      heroDiv.className = 'closing-icon';
      heroDiv.innerHTML = `
        <svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg">
          <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c1.8 0 3.5-.2 5.3-.5c-76.3-55.1-99.8-141-103.1-200.2c-16.1-4.8-33.1-7.3-50.7-7.3l-91.4 0zm308.8-78.3l-120 48C358 277.4 352 286.2 352 296c0 63.3 25.9 168.8 134.8 214.2c5.9 2.5 12.6 2.5 18.5 0C614.1 464.8 640 359.3 640 296c0-9.8-6-18.6-15.1-22.3l-120-48c-5.7-2.3-12.1-2.3-17.8 0zM591.4 312c-3.9 50.7-27.2 116.7-95.4 149.7l0-187.8L591.4 312z"/>
        </svg>
      `;
      container.appendChild(heroDiv);
      const heroWrapper = document.createElement('div');
      heroWrapper.className = 'hero-wrapper';
      heroWrapper.appendChild(heroDiv);
      container.appendChild(heroWrapper);
      const clones = [];
      const cloneCount = 3;
      for (let i = 0; i < cloneCount; i++) {
        const clone = heroDiv.cloneNode(true);
        clone.classList.add('clone-icon');
        heroWrapper.appendChild(clone);
        clones.push(clone);
      }
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
      const scene9El = document.getElementById('scene9');
      if (scene9El) {
        const backBtn = scene9El.querySelector('.prev-btn');
        const finishBtn = scene9El.querySelector('.next-btn');
        if (backBtn) backBtn.style.display = 'none';
        if (finishBtn) finishBtn.style.display = 'none';
      }
      const quizBtn = document.createElement('button');
      quizBtn.className = 'quiz-btn';
      quizBtn.textContent = 'Start Quiz!';
      quizBtn.setAttribute('tabindex', '-1');
      quizBtn.addEventListener('click', () => {
        window.location.href = 'quiz.html';
      });
      if (scene9El) scene9El.appendChild(quizBtn);
      const tl = gsap.timeline();
      tl.from(heroDiv, { scale: 0, opacity: 0, duration: 1.5, ease: 'back.out(1.7)' });
      tl.to(heroDiv, { scale: 1.05, duration: 3.0, ease: 'sine.inOut', yoyo: true, repeat: -1 }, '<');
      const clonePositions = [
        { x: -80, y: -40 },
        { x: 80, y: -40 },
        { x: 0, y: 80 }
      ];
      tl.to(clones, {
        x: i => clonePositions[i].x,
        y: i => clonePositions[i].y,
        opacity: 1,
        scale: 0.8,
        duration: 2.0,
        ease: 'back.out(1.7)',
        stagger: 0.3
      }, '-=0.5');
      tl.to({}, { duration: 1.5 });
      tl.to(clones, { autoAlpha: 0, scale: 0.4, duration: 1.2, ease: 'power1.in' });
      tl.to({}, { duration: 0.5 });
      tl.from(instructionsRow.children, {
        opacity: 0,
        scale: 0.2,
        y: 30,
        duration: 1.5,
        ease: 'back.out(1.7)',
        stagger: 0.7
      });
      tl.to({}, { duration: 1.0 });
      tl.from(actionsRow.children, {
        opacity: 0,
        y: 30,
        scale: 0.8,
        duration: 2.0,
        ease: 'back.out(1.6)',
        stagger: 1.0
      });
      tl.to({}, { duration: 1.0 });
      tl.from(finalDiv, { opacity: 0, y: 30, duration: 2.0, ease: 'power2.out' });
      tl.to({}, { duration: 4.0 });
      tl.call(() => {
        gsap.fromTo(quizBtn, { opacity: 0, scale: 0.6 }, {
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: 'back.out(1.7)',
          onComplete: () => {
            quizBtn.classList.add('pulsing');
          }
        });
      });
    }
            function displayBecMessage(panel) {
      panel.innerHTML = '';
      panel.classList.add('bec-message');
      const refs = { reportBtn: null, highlights: [] };
      const subject = document.createElement('div');
      subject.classList.add('subject-line');
      subject.textContent = 'Urgent Vendor Payment Request';
      panel.appendChild(subject);
      const senderRow = document.createElement('div');
      senderRow.classList.add('sender-row');
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
      const iconsRow = document.createElement('div');
      iconsRow.classList.add('icons-row');
      const sun = document.createElement('span');
      sun.textContent = '☀️';
      iconsRow.appendChild(sun);
      const smile = document.createElement('span');
      smile.textContent = '😊';
      iconsRow.appendChild(smile);
      const reply = document.createElement('span');
      reply.textContent = '↩️';
      iconsRow.appendChild(reply);
      const replyAll = document.createElement('span');
      replyAll.textContent = '⤴️';
      iconsRow.appendChild(replyAll);
      const forward = document.createElement('span');
      forward.textContent = '➡️';
      iconsRow.appendChild(forward);
      const divider1 = document.createElement('div');
      divider1.classList.add('divider');
      iconsRow.appendChild(divider1);
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
      const divider2 = document.createElement('div');
      divider2.classList.add('divider');
      iconsRow.appendChild(divider2);
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '…';
      iconsRow.appendChild(ellipsis);
      senderRow.appendChild(iconsRow);
      panel.appendChild(senderRow);
      const dateRow = document.createElement('div');
      dateRow.classList.add('date-row');
      dateRow.textContent = 'Thu 7/17/2025 7:00 PM';
      panel.appendChild(dateRow);
      const body = document.createElement('div');
      body.classList.add('body');
      body.innerHTML = `Hi,<br><br>I need you to <span class="highlight-target">urgently</span> process a <span class="highlight-target">vendor payment</span> today. I will explain later.<br><br>Vendor: <strong>ABC Supplies</strong><br>Amount: <strong>50,000 AED</strong><br><br>Regards,<br>Manager`;
      panel.appendChild(body);
      refs.reportBtn = reportBtn;
      refs.highlights = Array.from(body.querySelectorAll('.highlight-target'));
      return refs;
    }
        function movePointer(pointer, target, duration = 1.4) {
      return new Promise(resolve => {
        if (!pointer || !target) {
          resolve();
          return;
        }
        let parent = pointer.parentElement;
        if (!parent) parent = document.body;
        const parentRect = parent.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const pointerW = pointer.naturalWidth || pointer.offsetWidth || 32;
        const pointerH = pointer.naturalHeight || pointer.offsetHeight || 32;
        const destX = targetRect.left - parentRect.left + (targetRect.width - pointerW) / 2;
        let destY = targetRect.top - parentRect.top + (targetRect.height - pointerH) / 2;
        destY -= pointerH * 0.6;
        gsap.to(pointer, {
          left: `${destX}px`,
          top: `${destY + 23}px`,
          duration: duration,
          ease: 'power2.out',
          onComplete: () => resolve()
        });
      });
    }
        function createReportMenu(reportBtn, panel) {
      const menu = document.createElement('div');
      menu.classList.add('report-menu');
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
      panel.appendChild(menu);
      const btnRect = reportBtn.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      let left = btnRect.left - panelRect.left;
      let top = btnRect.top - panelRect.top + btnRect.height + 6;
      if (left + menuRect.width > panelRect.width) {
        left = Math.max(0, panelRect.width - menuRect.width - 6);
      }
      if (top + menuRect.height > panelRect.height) {
        top = btnRect.top - panelRect.top - menuRect.height - 6;
        if (top < 0) top = 0;
      }
      menu.style.left = `${left}px`;
      menu.style.top = `${top}px`;
      return { menu, phishingRow };
    }
        function showSuccessOverlay(container) {
      if (container.querySelector('.success-check-overlay')) return;
      const overlay = document.createElement('div');
      overlay.classList.add('success-check-overlay');
      const checkContainer = document.createElement('div');
      checkContainer.classList.add('check-container');
      const checkBg = document.createElement('div');
      checkBg.classList.add('check-background');
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
      const checkShadow = document.createElement('div');
      checkShadow.classList.add('check-shadow');
      checkContainer.appendChild(checkBg);
      checkContainer.appendChild(checkShadow);
      overlay.appendChild(checkContainer);
      const msg = document.createElement('div');
      msg.classList.add('success-cmd-text');
      overlay.appendChild(msg);
      container.appendChild(overlay);
      gsap.fromTo(checkContainer, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' });
      const fullText = 'Good Job!\nYou successfully prevented a phishing attempt.';
      let idx = 0;
      function typeChars() {
        if (idx < fullText.length) {
          msg.textContent += fullText.charAt(idx);
          idx++;
          setTimeout(typeChars, 45);
        } else {
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
      setTimeout(typeChars, 800);
    }
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
        iconContainer.style.position = 'relative';
        iconContainer.appendChild(svg);
        iconContainer.appendChild(emoji);
        const p = document.createElement('p');
        p.classList.add('flag-text');
        p.innerHTML = flag.text;
        li.appendChild(iconContainer);
        li.appendChild(p);
        flagList.appendChild(li);
        gsap.fromTo(li, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.8, delay: idx * 0.3, ease: 'power2.out' });
      });
    }
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
          const opacity = pathEl.getAttribute('fill-opacity') || '0.4';
          pathEl.setAttribute('fill', to);
          pathEl.setAttribute('fill-opacity', opacity);
          setTimeout(next, 3000);
        }
      }
      next();
    }
        function runSceneXRay() {
        const container = document.getElementById('xrayContainer');
        const dangerLayer = document.getElementById('xrayDangerLayer');
        const lens = document.getElementById('xrayLens');
        if (!container || !dangerLayer || !lens) return;
        dangerLayer.style.clipPath = `circle(0px at 50% 50%)`;
        lens.style.display = 'none';
        gsap.fromTo(container, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' });
        container.onmousemove = (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            lens.style.display = 'block';
            gsap.set(lens, { left: x, top: y });
            dangerLayer.style.clipPath = `circle(60px at ${x}px ${y}px)`;
        };
        container.onmouseleave = () => {
            lens.style.display = 'none';
            dangerLayer.style.clipPath = `circle(0px at 50% 50%)`;
        };
    }
    (function initPreIntro() {
      const preIntro = document.getElementById('preIntro');
      const appContainer = document.querySelector('.app-container');
      if (preIntro && appContainer) {
        appContainer.style.display = 'none';
        const preTyped = document.getElementById('preTyped');
        if (preTyped) {
          setTimeout(() => {
            try {
            typeEffect(preTyped, ['>>> INSERT AUTHORIZATION KEY'], 80, 1000);
            } catch (e) {
              preTyped.textContent = '>>> INSERT AUTHORIZATION KEY';
            }
          }, 1000);
        }
        let authStarted = false;
        let spinnerInterval1;
                function startAuth() {
          if (authStarted) return;
          authStarted = true;
          preIntro.classList.add('shake');
          const kInner = preIntro.querySelector('.k-inner');
          if (kInner) {
            kInner.classList.add('auth-flipped');
          }
          const kWrapperEl = preIntro.querySelector('.k-wrapper');
          if (kWrapperEl) {
            setTimeout(() => {
              kWrapperEl.style.opacity = '0';
            }, 500);
          }
          const subtext = preIntro.querySelector('.pre-subtext');
          if (subtext) {
            subtext.classList.remove('multi');
            subtext.innerHTML = '<span class="auth-text">AUTHENTICATING</span><span id="spinnerChar"></span>';
            const spinnerEl = document.getElementById('spinnerChar');
            const seq = ['|','/','-','\\'];
            let idx = 0;
            spinnerInterval1 = setInterval(() => {
              if (spinnerEl) spinnerEl.textContent = seq[idx % seq.length];
              idx++;
            }, 150);
          }
          setTimeout(() => {
            if (spinnerInterval1) clearInterval(spinnerInterval1);
            showAccess();
          }, 2000);
        }
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
              setTimeout(() => {
                clearInterval(spinnerInterval2);
                spinnerEl.textContent = '';
                glitchAndProceed();
              }, 2000);
            });
          } catch (e) {
            subtext.innerHTML = lines.join('<br>');
            glitchAndProceed();
          }
        }
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
        preIntro.addEventListener('click', startAuth);
        window.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
            startAuth();
          }
        });
      } else {
        showScene(currentScene, true);
      }
    })();
  });
})();
