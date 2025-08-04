// Modern Quiz Implementation
//
// This script implements a high‑end phishing awareness quiz using
// vanilla JavaScript and several modern animation libraries. The
// interactive experience lives inside a 600×600 container where
// questions are presented on the faces of a 3D rotating prism. A
// dynamic particle background and a typed title create a sleek
// introduction, while progress dots, animated gradient buttons and
// polished overlays round out the experience. The logic is kept
// straightforward: users answer each question, navigate with Back
// and Next, then view results with an animated gauge and the
// option to review wrong answers.

(() => {
  // Define quiz questions. Each object contains the question text,
  // answer options and the index of the correct answer.
  const questions = [
    {
      id: 0,
      text: 'You get an email from “IT Support” asking for your MFA code because of a login error. What should you do?',
      answers: [
        'Reply with the MFA code to help them',
        'Click the link to verify the issue',
        'Report the email using the Phishing Report button',
        'Forward the email to your team'
      ],
      correct: 2
    },
    {
      id: 1,
      text: 'Which of these is a red flag in a phishing email?',
      answers: [
        'You weren’t expecting the attachment',
        'The email creates a sense of urgency',
        'The sender’s address doesn’t match the display name',
        'All of the above'
      ],
      correct: 3
    },
    {
      id: 2,
      text: 'A colleague messages you on Teams asking for internal pricing info urgently. How do you respond?',
      answers: [
        'Share the file since you know the person',
        'Ask them to email you the request',
        'Verify by calling or checking in person',
        'Ignore the message'
      ],
      correct: 2
    },
    {
      id: 3,
      text: 'What is Business Email Compromise (BEC)?',
      answers: [
        'A virus on your laptop',
        'An attacker sending fake emails using someone’s identity',
        'IT forgetting your password',
        'A software update that breaks email access'
      ],
      correct: 1
    },
    {
      id: 4,
      text: 'Which of these situations could be a social engineering attack?',
      answers: [
        'Someone calls claiming they’re from HR and asks for personal data',
        'A fake delivery person tries to enter your office',
        'You receive an email asking you to download a revised org chart',
        'All of the above'
      ],
      correct: 3
    },
    {
      id: 5,
      text: 'How should you report a suspicious email?',
      answers: [
        'Forward it to your manager',
        'Delete it immediately',
        'Reply to the sender asking for more info',
        'Use the Phishing Report button in Outlook or email infosec@kitopi.com'
      ],
      correct: 3
    }
  ];

  // Wait until the DOM is fully constructed before running setup.
  document.addEventListener('DOMContentLoaded', () => {
    const total = questions.length;
    let current = 0;
    let userAnswers = new Array(total).fill(null);
    let wrongIndices = [];

    // Hide the intro overlay after a short delay to reveal the quiz
    const intro = document.getElementById('introOverlay');
    if (intro) {
      setTimeout(() => {
        intro.classList.add('hide');
      }, 2000);
    }

    // Removed typed heading initialization. The quiz now shows an intro overlay only.

    // Setup the particle background using tsParticles. If the library
    // isn't loaded, silently skip this feature.
    if (window.tsParticles) {
      tsParticles.load('particles', {
        fpsLimit: 60,
        fullScreen: { enable: false },
        particles: {
          number: { value: 60, density: { enable: true, area: 800 } },
          color: { value: ['#00ff9c', '#00d0ff', '#ff6bcb'] },
          shape: { type: 'circle' },
          opacity: { value: { min: 0.4, max: 0.8 } },
          size: { value: { min: 1, max: 4 } },
          links: {
            enable: true,
            distance: 150,
            color: '#ffffff',
            opacity: 0.2,
            width: 1
          },
          move: {
            enable: true,
            speed: 1.5,
            direction: 'none',
            random: false,
            straight: false,
            outModes: { default: 'out' }
          }
        },
        interactivity: {
          events: {
            onHover: { enable: true, mode: 'grab' },
            onClick: { enable: true, mode: 'push' },
            resize: true
          },
          modes: {
            grab: { distance: 200, links: { opacity: 0.35 } },
            push: { quantity: 4 }
          }
        },
        detectRetina: true,
        background: { color: { value: 'transparent' } }
      });
    }

    // Build progress indicator dots
    const progressContainer = document.getElementById('progress');
    const dots = [];
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('div');
      dot.className = 'dot';
      progressContainer.appendChild(dot);
      dots.push(dot);
    }

    // Build sliding cards for each question
    const scene = document.getElementById('scene');
    const cards = [];
    questions.forEach((q, idx) => {
      // Create card element
      const card = document.createElement('div');
      card.className = 'card';

      // Question text
      const questionEl = document.createElement('h2');
      questionEl.className = 'question-text';
      questionEl.textContent = q.text;
      card.appendChild(questionEl);

      // Answers container
      const answersEl = document.createElement('div');
      answersEl.className = 'answers';
      const answerButtons = [];
      q.answers.forEach((ans, aIdx) => {
        const btn = document.createElement('button');
        btn.className = 'answer-button';
        btn.textContent = ans;
        btn.addEventListener('click', () => {
          selectAnswer(idx, aIdx);
        });
        answersEl.appendChild(btn);
        answerButtons.push(btn);
      });
      card.appendChild(answersEl);

      // Navigation container
      const navEl = document.createElement('div');
      navEl.className = 'nav';
      const backBtn = document.createElement('button');
      backBtn.textContent = 'Back';
      backBtn.addEventListener('click', () => back());
      navEl.appendChild(backBtn);
      const nextBtn = document.createElement('button');
      nextBtn.textContent = idx < total - 1 ? 'Next' : 'Submit';
      nextBtn.addEventListener('click', () => next());
      navEl.appendChild(nextBtn);
      card.appendChild(navEl);

      // Cards will be positioned via updateCards(); no initial transform needed

      // Set initial horizontal position using xPercent to avoid overlapping on load
      if (window.gsap) {
        gsap.set(card, { xPercent: idx * 100 });
      } else {
        card.style.transform = `translateX(${idx * 100}%)`;
      }

      // Append card to scene and store references
      scene.appendChild(card);
      cards.push({ card, answerButtons, nextBtn, backBtn });
    });

    // Helper to update progress dots based on current index
    function updateProgress() {
      dots.forEach((dot, idx) => {
        dot.classList.remove('active', 'completed');
        if (idx < current) {
          dot.classList.add('completed');
        } else if (idx === current) {
          dot.classList.add('active');
        }
      });
    }

    // Update navigation button states for the active card
    function updateNavButtons() {
      cards.forEach((c, idx) => {
        if (idx === current) {
          c.backBtn.disabled = idx === 0;
          c.nextBtn.disabled = userAnswers[idx] === null;
          c.nextBtn.textContent = idx < total - 1 ? 'Next' : 'Submit';
        }
      });
    }

    // Highlight selected answer for a question
    function highlightSelection(idx) {
      const selected = userAnswers[idx];
      const buttons = cards[idx].answerButtons;
      buttons.forEach((btn, i) => {
        if (i === selected) {
          btn.classList.add('selected');
        } else {
          btn.classList.remove('selected');
        }
      });
    }

    // Called when an answer is selected
    function selectAnswer(qIdx, aIdx) {
      userAnswers[qIdx] = aIdx;
      highlightSelection(qIdx);
      updateNavButtons();
    }

    // Advance to the next question or show results on final question
    function next() {
      if (current < total - 1) {
        current++;
        updateCards();
      } else {
        showResults();
      }
    }

    // Return to the previous question
    function back() {
      if (current > 0) {
        current--;
        updateCards();
      }
    }

    // Slide cards horizontally to show the current question
    function updateCards() {
      cards.forEach((c, idx) => {
        const offset = (idx - current) * 100;
        if (window.gsap) {
          gsap.to(c.card, { duration: 0.8, xPercent: offset, ease: 'power2.inOut' });
        } else {
          c.card.style.transform = `translateX(${offset}%)`;
        }
      });
      updateProgress();
      updateNavButtons();
      highlightSelection(current);
    }

    // Initial UI state
    updateCards();

    // Display the results overlay with animated gauge and summary
    function showResults() {
      // Compute correct and wrong counts and store wrong question indices
      let correctCount = 0;
      wrongIndices = [];
      questions.forEach((q, idx) => {
        if (userAnswers[idx] === q.correct) {
          correctCount++;
        } else {
          wrongIndices.push(idx);
        }
      });
      const wrongCount = total - correctCount;

      const overlay = document.getElementById('resultsOverlay');
      overlay.innerHTML = '';

      // Result title conveys performance
      const title = document.createElement('div');
      title.className = 'result-title';
      if (correctCount === total) {
        title.textContent = 'Excellent!';
      } else if (correctCount >= total - 1) {
        title.textContent = 'Great Job!';
      } else if (correctCount >= Math.ceil(total / 2)) {
        title.textContent = 'Good Job!';
      } else {
        title.textContent = 'You can do better...';
      }
      overlay.appendChild(title);

      // Gauge container; uses CSS custom property to animate fill
      const gauge = document.createElement('div');
      gauge.className = 'result-gauge';
      const valueEl = document.createElement('div');
      valueEl.className = 'value';
      valueEl.textContent = '0';
      gauge.appendChild(valueEl);
      overlay.appendChild(gauge);
      const labelEl = document.createElement('div');
      labelEl.className = 'label';
      labelEl.textContent = 'Correct';
      gauge.appendChild(labelEl);

      // Primary finish button container
      const finishContainer = document.createElement('div');
      finishContainer.id = 'finishContainer';
      const finishBtn = document.createElement('button');
      finishBtn.className = 'finish-btn';
      finishBtn.textContent = 'Finish';
      finishBtn.addEventListener('click', finishQuiz);
      finishContainer.appendChild(finishBtn);
      overlay.appendChild(finishContainer);

      // Secondary buttons (try again, restart, review) positioned at bottom left
      const secondary = document.createElement('div');
      secondary.id = 'secondaryButtons';
      let secondaryCount = 0;
      if (correctCount <= Math.floor(total / 2)) {
        const tryAgain = document.createElement('button');
        tryAgain.textContent = 'Try Again';
        tryAgain.addEventListener('click', restartQuiz);
        secondary.appendChild(tryAgain);
        secondaryCount++;
      }
      if (correctCount < total) {
        const restart = document.createElement('button');
        restart.textContent = 'Restart Quiz';
        restart.addEventListener('click', restartQuiz);
        secondary.appendChild(restart);
        secondaryCount++;
      }
      if (wrongCount > 0) {
        const review = document.createElement('button');
        review.textContent = 'Review Wrong Answers';
        review.addEventListener('click', () => openWrongViewer());
        secondary.appendChild(review);
        secondaryCount++;
      }
      if (secondaryCount > 0) {
        overlay.appendChild(secondary);
      }

      // Reveal the overlay
      overlay.classList.add('show');

      // Animate gauge fill and number increment
      const ratio = correctCount / total;
      const targetPercent = ratio * 100;
      let startTime;
      function animateGauge(time) {
        if (!startTime) startTime = time;
        const elapsed = time - startTime;
        const duration = 1500; // ms
        const progress = Math.min(elapsed / duration, 1);
        const currentPercent = targetPercent * progress;
        const displayNum = Math.round(correctCount * progress);
        valueEl.textContent = displayNum;
        gauge.style.setProperty('--percent', currentPercent + '%');
        if (progress < 1) {
          requestAnimationFrame(animateGauge);
        } else {
          valueEl.textContent = correctCount;
          gauge.style.setProperty('--percent', targetPercent + '%');
        }
      }
      requestAnimationFrame(animateGauge);
    }

    // Reset the quiz state and hide overlays
    function restartQuiz() {
      current = 0;
      userAnswers = new Array(total).fill(null);
      // Remove selected classes
      cards.forEach(({ answerButtons }) => {
        answerButtons.forEach(btn => btn.classList.remove('selected'));
      });
      updateCards();
      document.getElementById('resultsOverlay').classList.remove('show');
      document.getElementById('wrongViewer').classList.remove('show');
    }

    // End the quiz session and reset state
    function finishQuiz() {
      // Navigate to the final page when the quiz is finished
      window.location.href = 'Final.html';
    }

    // Display wrong answers in a scrollable overlay
    function openWrongViewer() {
      buildWrongViewer();
      document.getElementById('resultsOverlay').classList.remove('show');
      document.getElementById('wrongViewer').classList.add('show');
    }

    // Construct the wrong answers viewer
    function buildWrongViewer() {
      const viewer = document.getElementById('wrongViewer');
      viewer.innerHTML = '';
      const title = document.createElement('div');
      title.className = 'result-title';
      title.textContent = 'Review Wrong Answers';
      viewer.appendChild(title);
      const content = document.createElement('div');
      content.className = 'viewer-content';
      viewer.appendChild(content);
      wrongIndices.forEach(qIdx => {
        const q = questions[qIdx];
        const wrapper = document.createElement('div');
        wrapper.className = 'wrong-question';
        const qTitle = document.createElement('h3');
        qTitle.textContent = `${qIdx + 1}. ${q.text}`;
        wrapper.appendChild(qTitle);
        const list = document.createElement('ul');
        q.answers.forEach((ans, aIdx) => {
          const li = document.createElement('li');
          if (aIdx === q.correct) {
            li.className = 'correct';
          }
          if (aIdx === userAnswers[qIdx] && aIdx !== q.correct) {
            li.className = 'wrong';
          }
          li.textContent = ans;
          list.appendChild(li);
        });
        wrapper.appendChild(list);
        content.appendChild(wrapper);
      });
      // Navigation buttons for the viewer (only close needed here)
      const nav = document.createElement('div');
      nav.className = 'viewer-nav-buttons';
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Close';
      closeBtn.addEventListener('click', () => {
        document.getElementById('wrongViewer').classList.remove('show');
      });
      nav.appendChild(closeBtn);
      viewer.appendChild(nav);
    }
  });
})();