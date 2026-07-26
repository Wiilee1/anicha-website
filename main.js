/**
 * ANICHA — 5-Stage Impermanence & Multi-Video Morphing Engine
 * Full Section Snap & 5 Environment Web Audio Synthesizer
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const container = document.getElementById('scroll-container');
  const videoElements = Array.from(document.querySelectorAll('.bg-video'));
  
  const navBtns = document.querySelectorAll('.nav-btn');
  const progressFill = document.getElementById('progress-fill');
  const progressThumb = document.getElementById('progress-thumb');
  const progressTrack = document.getElementById('progress-track');
  const currentSecEl = document.getElementById('current-section');
  
  const morphBadge = document.getElementById('morph-percentage');
  const blendBtns = document.querySelectorAll('.blend-btn');
  const soundToggleBtn = document.getElementById('sound-toggle');

  // State
  let blendMode = 'crossfade';
  let activeSectionIndex = 0;
  let isSectionAnimating = false;
  let lastGestureTime = 0;
  let audioCtx = null;
  let isAudioPlaying = false;
  let osc1 = null;
  let osc2 = null;
  let masterGain = null;
  let biquadFilter = null;

  // Environment Soundscape Presets
  const environmentPresets = [
    { name: "Fabric Flow", freq1: 110, freq2: 164.81, type1: "sine", type2: "triangle", cutoff: 600 },
    { name: "Desert Dunes", freq1: 82.41, freq2: 123.47, type1: "triangle", type2: "sine", cutoff: 380 },
    { name: "Ocean Waves", freq1: 65.41, freq2: 98.00, type1: "sine", type2: "triangle", cutoff: 450 },
    { name: "Clouds", freq1: 220.00, freq2: 329.63, type1: "sine", type2: "sine", cutoff: 1200 },
    { name: "Still Lake", freq1: 136.10, freq2: 272.20, type1: "sine", type2: "triangle", cutoff: 800 }
  ];

  // Ensure continuous playback across all 5 video layers
  function initVideos() {
    videoElements.forEach((v) => {
      v.muted = true;
      v.defaultMuted = true;
      v.loop = true;
      v.playsInline = true;
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');

      const p = v.play();
      if (p !== undefined) {
        p.catch(err => console.log('Autoplay deferred until user interaction:', err));
      }
    });
  }
  initVideos();

  // User interaction fallback to guarantee video playback across all browsers
  const forcePlayAll = () => {
    videoElements.forEach(v => {
      if (v.paused) {
        v.play().catch(() => {});
      }
    });
  };

  ['click', 'wheel', 'touchstart', 'keydown', 'scroll'].forEach(evt => {
    window.addEventListener(evt, forcePlayAll, { passive: true });
  });

  // Main Render Loop for Video Morphing & Crossfade
  function renderMorph() {
    // Horizontal ratio (0.0 to 3.0)
    const horizIndex = Math.max(0, Math.min(3, container.scrollLeft / window.innerWidth));
    
    // Vertical scroll ratio (0.0 to 1.0) into Section 5 Stillness / Clear Sky
    const stillnessEl = document.getElementById('section-stillness');
    let vertRatio = 0;
    if (stillnessEl) {
      const rect = stillnessEl.getBoundingClientRect();
      vertRatio = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / window.innerHeight));
    }

    // Combined exactIndex: 0.0 -> Silk, 1.0 -> Desert, 2.0 -> Waves, 3.0 -> Clouds, 4.0 -> Stillness Lake
    const exactIndex = vertRatio > 0.05 ? 3 + vertRatio : horizIndex;

    // Piecewise opacity calculation for all 5 video layers
    videoElements.forEach((vid, idx) => {
      const dist = Math.abs(exactIndex - idx);
      const op = Math.max(0, 1 - dist);

      if (blendMode === 'additive') {
        vid.style.mixBlendMode = 'lighter';
        vid.style.opacity = op > 0 ? '1' : '0';
      } else if (blendMode === 'difference') {
        vid.style.mixBlendMode = 'difference';
        vid.style.opacity = op.toFixed(3);
      } else {
        // Default smooth crossfade dissolve
        vid.style.mixBlendMode = 'normal';
        vid.style.opacity = op.toFixed(3);
      }
    });

    if (morphBadge) {
      morphBadge.textContent = `STAGE 0${Math.min(5, Math.floor(exactIndex) + 1)} / 05`;
    }

    requestAnimationFrame(renderMorph);
  }

  requestAnimationFrame(renderMorph);

  // ==========================================================================
  // Section Navigation Engine (4 Horizontal + 1 Vertical Downward)
  // ==========================================================================

  let isTransitioning = false;

  function goToSection(index) {
    const targetIdx = Math.max(0, Math.min(4, index));

    if (targetIdx !== activeSectionIndex) {
      playTransitionSwoosh();
      updateEnvironmentSoundscape(targetIdx);
    }

    activeSectionIndex = targetIdx;
    forcePlayAll();

    if (targetIdx <= 3) {
      // Scroll window back to top if scrolled down
      if (window.scrollY > 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      container.scrollTo({ left: targetIdx * window.innerWidth, behavior: 'smooth' });
    } else {
      // Section 5 (Stillness): Position container at Screen 4 (Purpose) & scroll down
      container.scrollTo({ left: 3 * window.innerWidth, behavior: 'smooth' });
      const stillnessEl = document.getElementById('section-stillness');
      if (stillnessEl) {
        stillnessEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  // HARD SCROLL LOCK: Prevent window vertical scroll on Screens 01, 02, and 03
  window.addEventListener('scroll', () => {
    if (activeSectionIndex < 3 && window.scrollY > 0) {
      window.scrollTo(0, 0);
    }
  });

  // Intercept Mouse Wheel / Trackpad Scroll Gesture
  window.addEventListener('wheel', (e) => {
    // If activeSectionIndex === 4 (Section 5 Stillness) and scrolled down (scrollY > 40), allow natural vertical scroll
    if (activeSectionIndex === 4 && window.scrollY > 40 && e.deltaY > 0) {
      return;
    }

    // If in Section 5 and scrolling UP near section top (0 < scrollY <= 40), return smoothly to Screen 4 (Purpose)
    if (activeSectionIndex === 4 && window.scrollY > 0 && window.scrollY <= 40 && e.deltaY < 0) {
      e.preventDefault();
      if (!isTransitioning) {
        isTransitioning = true;
        goToSection(3);
        setTimeout(() => { isTransitioning = false; }, 600);
      }
      return;
    }

    // If on horizontal statement screens (activeSectionIndex <= 3)
    if (activeSectionIndex <= 3 || window.scrollY <= 10) {
      e.preventDefault();

      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

      if (Math.abs(delta) > 5) {
        if (!isTransitioning) {
          isTransitioning = true;

          if (delta > 0) {
            // Scrolling DOWN / RIGHT
            if (activeSectionIndex < 3) {
              // Advance horizontally across Screens 1 -> 2 -> 3 -> 4
              goToSection(activeSectionIndex + 1);
            } else if (activeSectionIndex === 3) {
              // ONLY from Screen 4 (Purpose) can you scroll DOWN into Section 5 (Stillness)!
              goToSection(4);
            }
          } else if (delta < 0) {
            // Scrolling UP / LEFT
            if (activeSectionIndex > 0 && activeSectionIndex <= 3) {
              goToSection(activeSectionIndex - 1);
            }
          }

          setTimeout(() => { isTransitioning = false; }, 600);
        }
      }
    }
  }, { passive: false });

  // Touch Swipe Gesture Handler
  let touchStartY = 0;

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (e.changedTouches.length === 0 || isTransitioning) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY - touchEndY;
    
    if (Math.abs(diffY) > 35) {
      if (diffY < 0 && window.scrollY <= 40 && activeSectionIndex === 4) {
        isTransitioning = true;
        goToSection(3);
        setTimeout(() => { isTransitioning = false; }, 600);
      } else if (window.scrollY <= 10) {
        if (diffY > 0) {
          // Swiping UP / Scrolling DOWN
          if (activeSectionIndex < 3) {
            isTransitioning = true;
            goToSection(activeSectionIndex + 1);
            setTimeout(() => { isTransitioning = false; }, 600);
          } else if (activeSectionIndex === 3) {
            // ONLY from Screen 4 (Purpose) can you scroll DOWN into Section 5!
            isTransitioning = true;
            goToSection(4);
            setTimeout(() => { isTransitioning = false; }, 600);
          }
        } else if (diffY < 0 && activeSectionIndex > 0) {
          // Swiping DOWN / Scrolling UP
          isTransitioning = true;
          goToSection(activeSectionIndex - 1);
          setTimeout(() => { isTransitioning = false; }, 600);
        }
      }
    }
  }, { passive: true });

  // Update UI on Scroll
  function updateScrollUI() {
    let sectionIndex = 0;
    if (window.scrollY > window.innerHeight * 0.35) {
      sectionIndex = 4;
    } else {
      sectionIndex = Math.min(3, Math.floor((container.scrollLeft + window.innerWidth / 2) / window.innerWidth));
    }
    
    activeSectionIndex = sectionIndex;
    currentSecEl.textContent = `0${sectionIndex + 1}`;

    const progressPercent = (sectionIndex / 4) * 100;
    progressFill.style.width = `${progressPercent}%`;
    progressThumb.style.left = `${progressPercent}%`;

    navBtns.forEach((btn, idx) => {
      btn.classList.toggle('active', idx === sectionIndex);
    });
  }

  container.addEventListener('scroll', updateScrollUI);
  window.addEventListener('scroll', updateScrollUI);
  updateScrollUI();

  // Navigation Click Scrolling
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const secIdx = parseInt(btn.getAttribute('data-section'), 10);
      goToSection(secIdx);
    });
  });

  // Progress Bar Click Navigation
  progressTrack.addEventListener('click', (e) => {
    const rect = progressTrack.getBoundingClientRect();
    const clickRatio = (e.clientX - rect.left) / rect.width;
    const targetIdx = Math.round(clickRatio * 4);
    goToSection(targetIdx);
  });

  // Keyboard Arrow Navigation
  window.addEventListener('keydown', (e) => {
    if (isSectionAnimating) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      goToSection(activeSectionIndex + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      goToSection(activeSectionIndex - 1);
    }
  });

  // Blend Mode Selector
  blendBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      blendBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      blendMode = btn.dataset.blend;
    });
  });

  // ==========================================================================
  // Web Audio Environment Soundscapes & Organic Swoosh Effects
  // ==========================================================================

  function playTransitionSwoosh() {
    if (!audioCtx || !isAudioPlaying) return;
    try {
      const now = audioCtx.currentTime;
      const bufferSize = audioCtx.sampleRate * 0.45;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(220, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.22);
      filter.frequency.exponentialRampToValueAtTime(180, now + 0.45);
      filter.Q.setValueAtTime(3.0, now);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      noise.start(now);
      noise.stop(now + 0.45);
    } catch (e) {
      console.log('Swoosh sound error:', e);
    }
  }

  function updateEnvironmentSoundscape(sectionIdx) {
    if (!audioCtx || !isAudioPlaying || !osc1 || !osc2) return;
    const preset = environmentPresets[sectionIdx] || environmentPresets[0];
    const now = audioCtx.currentTime;

    osc1.frequency.exponentialRampToValueAtTime(preset.freq1, now + 1.2);
    osc2.frequency.exponentialRampToValueAtTime(preset.freq2, now + 1.2);
    if (biquadFilter) {
      biquadFilter.frequency.exponentialRampToValueAtTime(preset.cutoff, now + 1.2);
    }
  }

  function toggleAudio() {
    if (!isAudioPlaying) {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }

      const now = audioCtx.currentTime;
      const preset = environmentPresets[activeSectionIndex] || environmentPresets[0];

      osc1 = audioCtx.createOscillator();
      osc2 = audioCtx.createOscillator();
      biquadFilter = audioCtx.createBiquadFilter();
      masterGain = audioCtx.createGain();

      osc1.type = preset.type1;
      osc1.frequency.setValueAtTime(preset.freq1, now);

      osc2.type = preset.type2;
      osc2.frequency.setValueAtTime(preset.freq2, now);

      biquadFilter.type = 'lowpass';
      biquadFilter.frequency.setValueAtTime(preset.cutoff, now);

      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.10, now + 2.5);

      osc1.connect(biquadFilter);
      osc2.connect(biquadFilter);
      biquadFilter.connect(masterGain);
      masterGain.connect(audioCtx.destination);

      osc1.start(now);
      osc2.start(now);

      isAudioPlaying = true;
      soundToggleBtn.querySelector('.sound-icon').textContent = '🔊';
      soundToggleBtn.querySelector('.sound-label').textContent = 'SOUND ON';
    } else {
      if (masterGain && audioCtx) {
        masterGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
        setTimeout(() => {
          osc1?.stop();
          osc2?.stop();
          isAudioPlaying = false;
        }, 800);
      }
      soundToggleBtn.querySelector('.sound-icon').textContent = '🔈';
      soundToggleBtn.querySelector('.sound-label').textContent = 'AMBIENT SOUND';
    }
  }

  soundToggleBtn.addEventListener('click', toggleAudio);

  // ==========================================================================
  // Internationalization (i18n): English / Polish Language Switcher
  // ==========================================================================
  let currentLang = 'EN';

  const translations = {
    EN: {
      brandSub: "अनिच्च · IMPERMANENCE",
      navBtns: ["01. ANICHA", "02. CHANGE", "03. AWARENESS", "04. PURPOSE", "05. STILLNESS"],
      soundToggle: "AMBIENT SOUND",
      morphHint: "SCROLL DOWN TO MORPH",
      
      screen1: {
        tag: "01 · IMPERMANENCE",
        sub: "Derived from Pali <em>Anicca</em> (अनिच्च) · Everything is impermanent",
        tagline: "<em>A practice in presence.</em>",
        scroll: "Scroll to explore"
      },
      screen2: {
        tag: "02 · SHIFTING TRUTH",
        heading: "We believe that everything changes.",
        body: "Fighting that truth only creates suffering."
      },
      screen3: {
        tag: "03 · AWARENESS",
        heading: "Awareness begins<br>when we stop trying to hold on.",
        body: "Stillness follows."
      },
      screen4: {
        tag: "04 · PURPOSE",
        heading: "We create experiences, products, and spaces",
        body: "that help people live with presence, embrace change, and return to themselves.",
        scroll: "Scroll down into stillness"
      },
      odnowa: {
        plChip: "🇵🇱 PL · POLAND",
        eventChip: "ONE-OFF THEMED RETREAT",
        seatsChip: "🔥 ONLY 8 PLACES AVAILABLE",
        title: "🌿 Odnowa (Renewal)",
        subtitle: "Intimate Theme Retreat in Poland",
        lead: "Odnowa is an intimate, one-off themed retreat hosted in Poland under Anicha Hub. Step away from digital noise into a quiet sanctuary of somatic yoga, guided meditation, introspective workshops, and authentic offline community.",
        f1Title: "Soma Yoga",
        f1Desc: "Deep body awareness practices, grounding, and gentle tension release.",
        f2Title: "Guided Meditation",
        f2Desc: "Mindfulness training and quiet presence in an Analog Zen ethos.",
        f3Title: "Workshops & Circles",
        f3Desc: "Authentic communication, reflection, and deep self-inquiry circles.",
        f4Title: "Offline Community",
        f4Desc: "Genuine human connection in a natural sanctuary off-screen (Strictly max 8 spots).",
        ctaText: "Explore & Reserve Odnowa Retreat (PL)"
      },
      pillars: {
        tag: "05 · ECOSYSTEM",
        title: "The 4 Pillars of Anicha",
        subtitle: "Living expressions of impermanence across connection, media, body, and open-source mind.",
        p1Num: "PILLAR 01", p1Role: "THE CONNECTION", p1Desc: "A community space and platform for hosted retreats, independent facilitators, and sacred real-world gatherings off-screen.",
        p2Num: "PILLAR 02", p2Role: "THE VOICE", p2Desc: "A conscious media platform and agency centered on honest marketing, ethical growth, and respectful, non-manipulative storytelling.",
        p3Num: "PILLAR 03", p3Role: "THE BODY", p3Desc: "A conscious clothing line built for daily movement, stillness, and grounding. Minimalist cuts and sustainable organic fabrics. Gaut is Anicha Wear.",
        p4Num: "PILLAR 04", p4Role: "THE MIND (OPEN SOURCE)", p4Desc: "An open-source, gamified meditation companion app featuring the little cloud mascot Siddha, built with an Analog Zen ethos."
      },
      founder: {
        tag: "THE FOUNDER'S JOURNEY",
        title: "Living with Impermanence",
        text: "My journey with Anicha began with a profound realization of Pali impermanence (<em>Anicca</em>)—that life cannot be trapped in rigid corporate templates or digital distraction. I created Anicha to build a living ecosystem where media is honest, apparel grounds the body, mindfulness tools belong to the community, and physical retreats bring us back together off-screen.",
        qualTitle: "🎓 Why Am I Qualified?",
        qualLi1: "<strong>Decade of Mindful Practice:</strong> Deep immersive background in Pali mindfulness, Vipassana retreats, and somatic yoga.",
        qualLi2: "<strong>Conscious Entrepreneurship:</strong> Experienced in creating authentic brands, ethical media storytelling, and non-exploitative community platforms.",
        qualLi3: "<strong>Facilitation & Space Holding:</strong> Proven experience curating intimate offline gatherings, contemplative workshops, and sanctuary spaces.",
        contactTitle: "✉️ Connect & Collaborate",
        contactDesc: "Have questions about Anicha Hub, Gaut apparel, Siddha open-source app, or joining the next Odnowa retreat?",
        contactBtn: "Email Founder",
        contactLoc: "📍 Poland & Global Digital Workspace"
      },
      footer: {
        quote: "“Sabbe saṅkhārā aniccā — All conditioned things are impermanent.”",
        fcolEcosystem: "ECOSYSTEM",
        fcolRetreats: "RETREATS",
        fcolGatherings: "Upcoming Gatherings",
        fcolSocial: "SOCIAL & COMMUNITY",
        bottomText: "© 2026 ANICHA Ecosystem. Built with presence & Pali ethos."
      }
    },
    PL: {
      brandSub: "अनिच्च · NIETRWAŁOŚĆ",
      navBtns: ["01. ANICHA", "02. ZMIANA", "03. ŚWIADOMOŚĆ", "04. CEL", "05. CISZA"],
      soundToggle: "DŹWIĘK OTOCZENIA",
      morphHint: "PRZEWIŃ W DÓŁ ABY WEJŚĆ",
      
      screen1: {
        tag: "01 · NIETRWAŁOŚĆ",
        sub: "Pochodzi z Pali <em>Anicca</em> (अनिच्च) · Wszystko jest nietrwałe",
        tagline: "<em>Praktyka uważnej obecności.</em>",
        scroll: "Przewiń, aby odkryć"
      },
      screen2: {
        tag: "02 · ZMIENNA PRAWDA",
        heading: "Wierzymy, że wszystko ulega zmianie.",
        body: "Walka z tą prawdą tworzy jedynie cierpienie."
      },
      screen3: {
        tag: "03 · ŚWIADOMOŚĆ",
        heading: "Świadomość zaczyna się,<br>gdy przestajemy się chwytać.",
        body: "Wtedy przychodzi cisza."
      },
      screen4: {
        tag: "04 · CEL",
        heading: "Tworzymy doświadczenia, produkty i przestrzenie,",
        body: "które pomagają żyć uważnie, przyjmować zmianę i powracać do siebie.",
        scroll: "Przewiń w dół do ciszy"
      },
      odnowa: {
        plChip: "🇵🇱 PL · POLSKA",
        eventChip: "JEDNORAZOWE ODOSOBNIENIE TEMATYCZNE",
        seatsChip: "🔥 TYLKO 8 MIEJSC",
        title: "🌿 Odnowa",
        subtitle: "Kameralne Odosobnienie w Polsce",
        lead: "Odnowa to kameralne, jednorazowe odosobnienie tematyczne organizowane w Polsce w ramach Anicha Hub. Zrób krok w stronę ciszy, z dala od szumu ekranów, powracając do prostoty i uważnej obecności.",
        f1Title: "Soma Joga",
        f1Desc: "Głębokie praktyki świadomości ciała, uziemienia i łagodnego uwalniania napięć.",
        f2Title: "Medytacja Prowadzona",
        f2Desc: "Trening uważności i cichej obecności w duchu Analog Zen.",
        f3Title: "Warsztaty & Kręgi",
        f3Desc: "Praktyki autentycznej komunikacji, refleksji i głębokiego samoobserwowania.",
        f4Title: "Społeczność Offline",
        f4Desc: "Prawdziwe spotkanie z ludźmi w otoczeniu natury off-screen (Maksymalnie 8 miejsc).",
        ctaText: "Zobacz Stronę Odnowa (PL)"
      },
      pillars: {
        tag: "05 · EKOSYSTEM",
        title: "4 Filary Anicha",
        subtitle: "Żywotny wyraz nietrwałości poprzez relacje, media, ciało i otwarty umysł.",
        p1Num: "FILAR 01", p1Role: "POŁĄCZENIE", p1Desc: "Przestrzeń społeczności i platforma dla kameralnych odosobnień, niezależnych facylitatorów i autentycznych spotkań off-screen.",
        p2Num: "FILAR 02", p2Role: "GŁOS", p2Desc: "Świadoma platforma mediowa i agencja skupiona na uczciwym marketingu, etycznym rozwoju i szanującym odbiorcę opowiadaniu historii.",
        p3Num: "FILAR 03", p3Role: "CIAŁO", p3Desc: "Świadoma linia odzieży stworzona do codziennego ruchu, ciszy i uziemienia. Minimalistyczne kroje i ekologiczne tkaniny. Gaut to Anicha Wear.",
        p4Num: "FILAR 04", p4Role: "UMYSŁ (OPEN SOURCE)", p4Desc: "Otwartoźródłowa, zgamifikowana aplikacja medytacyjna z chmurką Siddha, stworzona w duchu Analog Zen."
      },
      founder: {
        tag: "DROGA ZAŁOŻYCIELA",
        title: "Życie z Nietrwałością",
        text: "Moja droga z Anicha rozpoczęła się od głębokiego doświadczenia nietrwałości (Pali <em>Anicca</em>)—że życia nie da się zamknąć w sztywnych korporacyjnych szablonach ani cyfrowej iluzji. Stworzyłem Anicha, aby zbudować żywy ekosystem, w którym media są uczciwe, odzież uziemia ciało, narzędzia medytacyjne należą do społeczności, a kameralne wyjazdy łączą nas w świecie realnym.",
        qualTitle: "🎓 Dlaczego Jestem Wykwalifikowany?",
        qualLi1: "<strong>Dekada Praktyki Uważności:</strong> Głębokie doświadczenie w medytacji Pali, odosobnieniach Vipassana i jodze somatycznej.",
        qualLi2: "<strong>Świadoma Przedsiębiorczość:</strong> Doświadczenie w tworzeniu autentycznych marek, etycznego marketingu i nieeksploatacyjnych społeczności.",
        qualLi3: "<strong>Facylitacja & Trzymanie Przestrzeni:</strong> Udowodnione doświadczenie w organizacji kameralnych spotkań offline, warsztatów i przestrzeni wyciszenia.",
        contactTitle: "✉️ Połącz się & Napisz",
        contactDesc: "Masz pytania dotyczące Anicha Hub, odzieży Gaut, aplikacji Siddha lub udziału w kolejnej Odnowie?",
        contactBtn: "Napisz do Założyciela",
        contactLoc: "📍 Polska & Globalna Przestrzeń Cyfrowa"
      },
      footer: {
        quote: "“Sabbe saṅkhārā aniccā — Wszystkie uwarunkowane rzeczy są nietrwałe.”",
        fcolEcosystem: "EKOSYSTEM",
        fcolRetreats: "ODOSOBNIENIA",
        fcolGatherings: "Nadchodzące Wydarzenia",
        fcolSocial: "SPOŁECZNOŚĆ & SOCIAL",
        bottomText: "© 2026 Ekosystem ANICHA. Stworzone z obecnością i duchem Pali."
      }
    }
  };

  function applyLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];

    const langBtnLabel = document.getElementById('lang-label');
    if (langBtnLabel) langBtnLabel.textContent = lang === 'EN' ? 'EN / PL' : 'PL / EN';

    const brandSub = document.getElementById('brand-sub');
    if (brandSub) brandSub.textContent = t.brandSub;

    t.navBtns.forEach((label, idx) => {
      const btn = document.getElementById(`nav-btn-${idx}`);
      if (btn) btn.textContent = label;
    });

    const soundLabel = document.getElementById('sound-label-text');
    if (soundLabel && isAudioPlaying) soundLabel.textContent = t.soundToggle;

    const morphHint = document.getElementById('morph-hint-text');
    if (morphHint) morphHint.textContent = t.morphHint;

    // Screen 1
    const s1Tag = document.getElementById('screen1-tag'); if (s1Tag) s1Tag.textContent = t.screen1.tag;
    const s1Sub = document.getElementById('screen1-sub'); if (s1Sub) s1Sub.innerHTML = t.screen1.sub;
    const s1Tagline = document.getElementById('screen1-tagline'); if (s1Tagline) s1Tagline.innerHTML = t.screen1.tagline;
    const s1Scroll = document.getElementById('screen1-scroll'); if (s1Scroll) s1Scroll.textContent = t.screen1.scroll;

    // Screen 2
    const s2Tag = document.getElementById('screen2-tag'); if (s2Tag) s2Tag.textContent = t.screen2.tag;
    const s2H = document.getElementById('screen2-heading'); if (s2H) s2H.textContent = t.screen2.heading;
    const s2B = document.getElementById('screen2-body'); if (s2B) s2B.textContent = t.screen2.body;

    // Screen 3
    const s3Tag = document.getElementById('screen3-tag'); if (s3Tag) s3Tag.textContent = t.screen3.tag;
    const s3H = document.getElementById('screen3-heading'); if (s3H) s3H.innerHTML = t.screen3.heading;
    const s3B = document.getElementById('screen3-body'); if (s3B) s3B.textContent = t.screen3.body;

    // Screen 4
    const s4Tag = document.getElementById('screen4-tag'); if (s4Tag) s4Tag.textContent = t.screen4.tag;
    const s4H = document.getElementById('screen4-heading'); if (s4H) s4H.textContent = t.screen4.heading;
    const s4B = document.getElementById('screen4-body'); if (s4B) s4B.textContent = t.screen4.body;
    const s4Scroll = document.getElementById('screen4-scroll'); if (s4Scroll) s4Scroll.textContent = t.screen4.scroll;

    // Odnowa
    const odPl = document.getElementById('odnowa-pl-chip'); if (odPl) odPl.textContent = t.odnowa.plChip;
    const odEv = document.getElementById('odnowa-event-chip'); if (odEv) odEv.textContent = t.odnowa.eventChip;
    const odSt = document.getElementById('odnowa-seats-chip'); if (odSt) odSt.textContent = t.odnowa.seatsChip;
    const odTi = document.getElementById('odnowa-title'); if (odTi) odTi.textContent = t.odnowa.title;
    const odSub = document.getElementById('odnowa-subtitle'); if (odSub) odSub.textContent = t.odnowa.subtitle;
    const odLd = document.getElementById('odnowa-lead'); if (odLd) odLd.textContent = t.odnowa.lead;

    const odF1T = document.getElementById('odnowa-feat1-title'); if (odF1T) odF1T.textContent = t.odnowa.f1Title;
    const odF1D = document.getElementById('odnowa-feat1-desc'); if (odF1D) odF1D.textContent = t.odnowa.f1Desc;
    const odF2T = document.getElementById('odnowa-feat2-title'); if (odF2T) odF2T.textContent = t.odnowa.f2Title;
    const odF2D = document.getElementById('odnowa-feat2-desc'); if (odF2D) odF2D.textContent = t.odnowa.f2Desc;
    const odF3T = document.getElementById('odnowa-feat3-title'); if (odF3T) odF3T.textContent = t.odnowa.f3Title;
    const odF3D = document.getElementById('odnowa-feat3-desc'); if (odF3D) odF3D.textContent = t.odnowa.f3Desc;
    const odF4T = document.getElementById('odnowa-feat4-title'); if (odF4T) odF4T.textContent = t.odnowa.f4Title;
    const odF4D = document.getElementById('odnowa-feat4-desc'); if (odF4D) odF4D.textContent = t.odnowa.f4Desc;
    const odCta = document.getElementById('odnowa-cta-text'); if (odCta) odCta.textContent = t.odnowa.ctaText;

    // Pillars
    const pTg = document.getElementById('pillars-tag'); if (pTg) pTg.textContent = t.pillars.tag;
    const pTi = document.getElementById('pillars-title'); if (pTi) pTi.textContent = t.pillars.title;
    const pSub = document.getElementById('pillars-subtitle'); if (pSub) pSub.textContent = t.pillars.subtitle;

    const p1N = document.getElementById('p1-num'); if (p1N) p1N.textContent = t.pillars.p1Num;
    const p1R = document.getElementById('p1-role'); if (p1R) p1R.textContent = t.pillars.p1Role;
    const p1D = document.getElementById('p1-desc'); if (p1D) p1D.textContent = t.pillars.p1Desc;

    const p2N = document.getElementById('p2-num'); if (p2N) p2N.textContent = t.pillars.p2Num;
    const p2R = document.getElementById('p2-role'); if (p2R) p2R.textContent = t.pillars.p2Role;
    const p2D = document.getElementById('p2-desc'); if (p2D) p2D.textContent = t.pillars.p2Desc;

    const p3N = document.getElementById('p3-num'); if (p3N) p3N.textContent = t.pillars.p3Num;
    const p3R = document.getElementById('p3-role'); if (p3R) p3R.textContent = t.pillars.p3Role;
    const p3D = document.getElementById('p3-desc'); if (p3D) p3D.textContent = t.pillars.p3Desc;

    const p4N = document.getElementById('p4-num'); if (p4N) p4N.textContent = t.pillars.p4Num;
    const p4R = document.getElementById('p4-role'); if (p4R) p4R.textContent = t.pillars.p4Role;
    const p4D = document.getElementById('p4-desc'); if (p4D) p4D.textContent = t.pillars.p4Desc;

    // Founder
    const fTg = document.getElementById('founder-tag'); if (fTg) fTg.textContent = t.founder.tag;
    const fTi = document.getElementById('founder-title'); if (fTi) fTi.textContent = t.founder.title;
    const fTx = document.getElementById('founder-text'); if (fTx) fTx.innerHTML = t.founder.text;
    const qTi = document.getElementById('qual-title'); if (qTi) qTi.textContent = t.founder.qualTitle;
    const qL1 = document.getElementById('qual-li1'); if (qL1) qL1.innerHTML = t.founder.qualLi1;
    const qL2 = document.getElementById('qual-li2'); if (qL2) qL2.innerHTML = t.founder.qualLi2;
    const qL3 = document.getElementById('qual-li3'); if (qL3) qL3.innerHTML = t.founder.qualLi3;
    const cTi = document.getElementById('contact-title'); if (cTi) cTi.textContent = t.founder.contactTitle;
    const cDs = document.getElementById('contact-desc'); if (cDs) cDs.textContent = t.founder.contactDesc;
    const cBt = document.getElementById('contact-btn-text'); if (cBt) cBt.textContent = t.founder.contactBtn;
    const cLc = document.getElementById('contact-location'); if (cLc) cLc.textContent = t.founder.contactLoc;

    // Footer
    const fQt = document.getElementById('footer-quote'); if (fQt) fQt.textContent = t.footer.quote;
    const fcEco = document.getElementById('fcol-ecosystem'); if (fcEco) fcEco.textContent = t.footer.fcolEcosystem;
    const fcRet = document.getElementById('fcol-retreats'); if (fcRet) fcRet.textContent = t.footer.fcolRetreats;
    const fcGat = document.getElementById('fcol-gatherings'); if (fcGat) fcGat.textContent = t.footer.fcolGatherings;
    const fcSoc = document.getElementById('fcol-social'); if (fcSoc) fcSoc.textContent = t.footer.fcolSocial;
    const fBt = document.getElementById('footer-bottom-text'); if (fBt) fBt.textContent = t.footer.bottomText;
  }

  const langToggleBtn = document.getElementById('lang-toggle');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      const nextLang = currentLang === 'EN' ? 'PL' : 'EN';
      applyLanguage(nextLang);
    });
  }
});

  // ==========================================================================
  // Odnowa Retreat Modal Interactivity
  // ==========================================================================
  const openOdnowaBtn = document.getElementById('open-odnowa-btn');
  const closeOdnowaBtn = document.getElementById('close-odnowa-btn');
  const odnowaModal = document.getElementById('odnowa-modal');
  const odnowaInquiryForm = document.getElementById('odnowa-inquiry-form');

  if (openOdnowaBtn && odnowaModal) {
    openOdnowaBtn.addEventListener('click', () => {
      odnowaModal.classList.add('active');
    });
  }

  if (closeOdnowaBtn && odnowaModal) {
    closeOdnowaBtn.addEventListener('click', () => {
      odnowaModal.classList.remove('active');
    });
  }

  if (odnowaModal) {
    odnowaModal.addEventListener('click', (e) => {
      if (e.target === odnowaModal) {
        odnowaModal.classList.remove('active');
      }
    });
  }

  if (odnowaInquiryForm) {
    odnowaInquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('🌿 Thank you for your interest in Odnowa Retreat! We will send full sanctuary details and upcoming dates directly to your inbox.');
      odnowaModal.classList.remove('active');
      odnowaInquiryForm.reset();
    });
  }
});
