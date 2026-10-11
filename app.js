(() => {
  /* ==========================================================================
     1. SCROLL-DRIVEN VIDEO FRAME ANIMATION (300 FRAMES)
     ========================================================================== */
  const TOTAL_FRAMES = 70;
  const canvas = document.getElementById('perfume-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });

  const frames = new Array(TOTAL_FRAMES);
  let lastRenderedIndex = -1;
  let targetFrame = 0;
  let currentFrame = 0;
  let isLoopRunning = false;

  function getFramePath(index) {
    const frameNum = String(index + 1).padStart(6, '0');
    return `frames/frame_${frameNum}.jpg`;
  }

  function preloadFrames() {
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.onload = () => {
        frames[i] = img;
        if (i === 0 && lastRenderedIndex === -1) {
          renderFrame(0);
        } else if (Math.round(currentFrame) === i) {
          renderFrame(i);
        }
      };
      img.src = getFramePath(i);

      if (img.complete && img.naturalWidth > 0) {
        frames[i] = img;
        if (i === 0 && lastRenderedIndex === -1) {
          renderFrame(0);
        }
      }
    }
  }

  function getClosestLoadedFrame(index) {
    if (frames[index] && frames[index].complete && frames[index].naturalWidth > 0) {
      return frames[index];
    }
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = index - offset;
      if (prev >= 0 && frames[prev] && frames[prev].complete && frames[prev].naturalWidth > 0) {
        return frames[prev];
      }
      const next = index + offset;
      if (next < TOTAL_FRAMES && frames[next] && frames[next].complete && frames[next].naturalWidth > 0) {
        return frames[next];
      }
    }
    return null;
  }

  function drawCoverImage(img) {
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const canvasRatio = w / h;
    const imgRatio = img.naturalWidth / img.naturalHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (canvasRatio > imgRatio) {
      drawWidth = w;
      drawHeight = w / imgRatio;
      offsetX = 0;
      offsetY = (h - drawHeight) / 2;
    } else {
      drawHeight = h;
      drawWidth = h * imgRatio;
      offsetX = (w - drawWidth) / 2;
      offsetY = 0;
    }

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();
  }

  function renderFrame(index) {
    const img = getClosestLoadedFrame(index);
    if (!img) return;
    drawCoverImage(img);
    lastRenderedIndex = index;
  }

  function handleResize() {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    if (canvas.width !== Math.floor(displayWidth * dpr) || canvas.height !== Math.floor(displayHeight * dpr)) {
      canvas.width = Math.floor(displayWidth * dpr);
      canvas.height = Math.floor(displayHeight * dpr);
    }

    const frameToRender = lastRenderedIndex >= 0 ? lastRenderedIndex : Math.round(currentFrame);
    renderFrame(frameToRender);
  }

  function updateScrollTarget() {
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const maxScroll = Math.max(1, docHeight - winHeight);
    const scrollY = Math.max(0, window.pageYOffset || document.documentElement.scrollTop);
    const progress = Math.min(1, Math.max(0, scrollY / maxScroll));
    targetFrame = progress * (TOTAL_FRAMES - 1);

    if (!isLoopRunning) {
      isLoopRunning = true;
      requestAnimationFrame(smoothAnimationLoop);
    }
  }

  function smoothAnimationLoop() {
    const diff = targetFrame - currentFrame;

    if (Math.abs(diff) < 0.005) {
      currentFrame = targetFrame;
      const finalIndex = Math.round(currentFrame);
      if (finalIndex !== lastRenderedIndex) {
        renderFrame(finalIndex);
      }
      isLoopRunning = false;
      return;
    }

    currentFrame += diff * 0.12;
    const frameIndex = Math.round(currentFrame);
    if (frameIndex !== lastRenderedIndex) {
      renderFrame(frameIndex);
    }

    requestAnimationFrame(smoothAnimationLoop);
  }

  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('scroll', updateScrollTarget, { passive: true });

  handleResize();
  preloadFrames();
  updateScrollTarget();

  /* ==========================================================================
     2. LUXURY AMBIENT BACKGROUND MUSIC ENGINE (Web Audio API)
     ========================================================================== */
  let audioCtx = null;
  let isMusicPlaying = false;
  let musicInterval = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Harmonic chord progression for oriental Arabian luxury atmosphere (D minor / Phrygian modal blend)
  const ambientNotes = [
    [146.83, 220.00, 261.63, 329.63], // D3, A3, C4, E4
    [130.81, 196.00, 261.63, 311.13], // C3, G3, C4, Eb4
    [116.54, 174.61, 233.08, 293.66], // Bb2, F3, Bb3, D4
    [110.00, 164.81, 220.00, 277.18], // A2, E3, A3, C#4
  ];
  let chordIndex = 0;

  function playAmbientChord() {
    if (!audioCtx || !isMusicPlaying) return;

    const chord = ambientNotes[chordIndex % ambientNotes.length];
    chordIndex++;
    const now = audioCtx.currentTime;

    chord.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800 + i * 200, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.025 / (i + 1), now + 1.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 5.0);
    });
  }

  function toggleMusic() {
    initAudioContext();
    isMusicPlaying = !isMusicPlaying;

    const floatingBtn = document.getElementById('floating-music-btn');
    const floatingText = document.getElementById('floating-audio-text');
    const headerLabel = document.getElementById('header-music-label');

    if (isMusicPlaying) {
      playAmbientChord();
      musicInterval = setInterval(playAmbientChord, 4500);
      floatingBtn.classList.add('playing');
      floatingText.textContent = 'Pause Ambience';
      headerLabel.textContent = 'Mute';
    } else {
      if (musicInterval) clearInterval(musicInterval);
      floatingBtn.classList.remove('playing');
      floatingText.textContent = 'Play Ambience';
      headerLabel.textContent = 'Music';
    }
  }

  document.getElementById('floating-music-btn').addEventListener('click', toggleMusic);
  document.getElementById('header-music-btn').addEventListener('click', toggleMusic);

  /* ==========================================================================
     3. TEST SPRAY MIST EFFECT & AUDIO SYNTHESIS
     ========================================================================== */
  const testSprayBtn = document.getElementById('test-spray-btn');
  const sprayStatus = document.getElementById('spray-status');
  let isSpraying = false;

  function triggerSpraySound() {
    initAudioContext();
    if (!audioCtx) return;

    try {
      const duration = 0.45;
      const bufferSize = audioCtx.sampleRate * duration;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.16));
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1800;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      noise.start();
    } catch (e) {
      console.log('Audio not allowed yet:', e);
    }
  }

  testSprayBtn.addEventListener('click', () => {
    if (isSpraying) return;
    isSpraying = true;
    triggerSpraySound();

    testSprayBtn.style.transform = 'scale(0.95)';
    sprayStatus.textContent = 'âœ¨ Atomizing Royal Arabian Oud Mist (12-micron)...';
    sprayStatus.style.color = '#ffd700';

    setTimeout(() => {
      testSprayBtn.style.transform = '';
      sprayStatus.textContent = 'Aromatic projection active: Bergamot, Coffee & Oud';
      setTimeout(() => {
        isSpraying = false;
        sprayStatus.textContent = 'Click to experience atomizer mist';
        sprayStatus.style.color = '';
      }, 2000);
    }, 1200);
  });

  /* ==========================================================================
     4. INTERACTIVE SCENT EXPLORER TABS
     ========================================================================== */
  const scentData = [
    {
      name: "Bergamot, Pink Pepper, Spices",
      phase: "Phase 1 of 3",
      character: "Fresh, Spicy & Energetic",
      duration: "0 - 30 minutes",
      description: "An invigorating, vibrant opening that sparkles with zesty Italian bergamot and warm piquant pink peppercorns.",
      image: "assets/images/top_notes_fragrance_1789968821379.jpg",
      ingredients: ["Bergamot", "Pink Pepper", "Spices"]
    },
    {
      name: "Coffee, Jasmine, Almond",
      phase: "Phase 2 of 3",
      character: "Warm, Gourmand & Sensual",
      duration: "30 mins - 4 hours",
      description: "A rich, intoxicating gourmand floral heart combining aromatic roasted coffee beans with velvety blooming star jasmine and roasted almonds.",
      image: "assets/images/middle_notes_scent_1789968833709.jpg",
      ingredients: ["Coffee", "Jasmine", "Almond"]
    },
    {
      name: "Amber, Oud, Sandalwood, Musk",
      phase: "Phase 3 of 3",
      character: "Deep, Resinous & Regal",
      duration: "4 - 24+ hours",
      description: "The royal foundation: golden liquid amber, rare wild agarwood (oud), creamy Mysore sandalwood, and clean white musk.",
      image: "assets/images/base_notes_oud_1789968847441.jpg",
      ingredients: ["Amber", "Oud", "Sandalwood", "Musk"]
    }
  ];

  const tabButtons = document.querySelectorAll('.scent-tab-btn');
  const activeScentImg = document.getElementById('active-scent-img');
  const activeScentCharacter = document.getElementById('active-scent-character');
  const activeScentPhase = document.getElementById('active-scent-phase');
  const activeScentName = document.getElementById('active-scent-name');
  const activeScentDesc = document.getElementById('active-scent-desc');
  const activeScentDuration = document.getElementById('active-scent-duration');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const index = parseInt(btn.dataset.note, 10);
      const data = scentData[index];

      activeScentImg.src = data.image;
      activeScentCharacter.textContent = data.character;
      activeScentPhase.textContent = data.phase;
      activeScentName.textContent = data.name;
      activeScentDesc.textContent = data.description;
      activeScentDuration.textContent = data.duration;
    });
  });

  /* ==========================================================================
     5. FAQ ACCORDION INTERACTION
     ========================================================================== */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question-btn');
    btn.addEventListener('click', () => {
      const wasActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!wasActive) {
        item.classList.add('active');
      }
    });
  });

  /* ==========================================================================
     6. SHOPPING CART & CHECKOUT SYSTEM
     ========================================================================== */
  const UNIT_PRICE = 1.19;
  let cartQuantity = 1;

  const heroQtyDisplay = document.getElementById('hero-qty-display');
  const claimOfferText = document.getElementById('claim-offer-text');
  const cartCountBadge = document.getElementById('cart-count-badge');
  const drawerItemsCount = document.getElementById('drawer-items-count');
  const cartQtyNum = document.getElementById('cart-qty-num');
  const cartItemPriceDisplay = document.getElementById('cart-item-price-display');
  const drawerSubtotalDisplay = document.getElementById('drawer-subtotal-display');
  const checkoutTotalBanner = document.getElementById('checkout-total-banner');
  const submitOrderPrice = document.getElementById('submit-order-price');

  const cartDrawerBackdrop = document.getElementById('cart-drawer-backdrop');
  const checkoutModalBackdrop = document.getElementById('checkout-modal-backdrop');

  function updateCartUI() {
    const totalCost = (UNIT_PRICE * cartQuantity).toFixed(2);

    heroQtyDisplay.textContent = cartQuantity;
    claimOfferText.textContent = `CLAIM SPECIAL OFFER ($${totalCost})`;
    cartCountBadge.textContent = cartQuantity;
    drawerItemsCount.textContent = `${cartQuantity} item${cartQuantity > 1 ? 's' : ''}`;
    cartQtyNum.textContent = cartQuantity;
    cartItemPriceDisplay.textContent = `$${totalCost}`;
    drawerSubtotalDisplay.textContent = `$${totalCost}`;
    checkoutTotalBanner.textContent = `$${totalCost}`;
    submitOrderPrice.textContent = `$${totalCost}`;
  }

  // Hero Quantity Buttons
  document.getElementById('qty-plus-btn').addEventListener('click', () => {
    if (cartQuantity < 3) {
      cartQuantity++;
      updateCartUI();
    }
  });

  document.getElementById('qty-minus-btn').addEventListener('click', () => {
    if (cartQuantity > 1) {
      cartQuantity--;
      updateCartUI();
    }
  });

  // Drawer Quantity Buttons
  document.getElementById('cart-plus-btn').addEventListener('click', () => {
    if (cartQuantity < 5) {
      cartQuantity++;
      updateCartUI();
    }
  });

  document.getElementById('cart-minus-btn').addEventListener('click', () => {
    if (cartQuantity > 1) {
      cartQuantity--;
      updateCartUI();
    }
  });

  // Modal Triggers
  function openCart() {
    cartDrawerBackdrop.classList.remove('hidden');
  }
  function closeCart() {
    cartDrawerBackdrop.classList.add('hidden');
  }

  function openCheckout() {
    closeCart();
    checkoutModalBackdrop.classList.remove('hidden');
    document.getElementById('checkout-form-screen').classList.remove('hidden');
    document.getElementById('checkout-success-screen').classList.add('hidden');
  }
  function closeCheckout() {
    checkoutModalBackdrop.classList.add('hidden');
  }

  document.getElementById('header-cart-btn').addEventListener('click', openCart);
  document.getElementById('claim-offer-btn').addEventListener('click', openCart);
  document.getElementById('sticky-claim-btn').addEventListener('click', openCart);
  document.getElementById('close-cart-btn').addEventListener('click', closeCart);
  cartDrawerBackdrop.addEventListener('click', (e) => {
    if (e.target === cartDrawerBackdrop) closeCart();
  });

  document.getElementById('proceed-checkout-btn').addEventListener('click', openCheckout);
  document.getElementById('close-checkout-btn').addEventListener('click', closeCheckout);
  checkoutModalBackdrop.addEventListener('click', (e) => {
    if (e.target === checkoutModalBackdrop) closeCheckout();
  });

  // Checkout Form Submission Simulator
  document.getElementById('checkout-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const orderNum = 'DXB-' + Math.floor(100000 + Math.random() * 900000);
    document.getElementById('order-id-display').textContent = `ORDER #${orderNum}`;
    document.getElementById('checkout-form-screen').classList.add('hidden');
    document.getElementById('checkout-success-screen').classList.remove('hidden');
  });

  document.getElementById('success-close-btn').addEventListener('click', closeCheckout);

  /* ==========================================================================
     7. BILINGUAL SUPPORT (ENGLISH / URDU)
     ========================================================================== */
  let currentLang = 'en';
  const langToggleBtn = document.getElementById('lang-toggle-btn');
  const langLabel = document.getElementById('lang-label');

  langToggleBtn.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'ur' : 'en';
    document.body.classList.toggle('lang-ur', currentLang === 'ur');
    langLabel.textContent = currentLang === 'en' ? 'Ø§Ø±Ø¯Ùˆ' : 'English';

    const bannerText = document.getElementById('banner-text');
    const taglinePrimary = document.getElementById('tagline-primary');
    const taglineSecondary = document.getElementById('tagline-secondary');
    const scentTitle = document.getElementById('scent-title');
    const scentSub = document.getElementById('scent-sub');
    const craftTitle = document.getElementById('craft-title');
    const craftSub = document.getElementById('craft-sub');
    const reviewsTitle = document.getElementById('reviews-title');
    const faqTitle = document.getElementById('faq-title');
    const stickyClaimText = document.getElementById('sticky-claim-text');

    if (currentLang === 'ur') {
      bannerText.textContent = 'ØµØ±Ù 14 Ø¨ÙˆØªÙ„ÛŒÚº Ø¨Ø§Ù‚ÛŒ ÛÛŒÚº! Ø®ØµÙˆØµÛŒ Ù¾Ø±ÙˆÙ…ÙˆØ´Ù†Ù„ Ù‚ÛŒÙ…Øª $1.19 | Ù…ÙØª Ø¹Ø§Ù„Ù…ÛŒ ØªØ±Ø³ÛŒÙ„';
      taglinePrimary.textContent = 'Ø¹Ø±Ø¨ÛŒÙ† Ø§ÙˆØ±ÛŒÙ†Ù¹Ù„ ÙˆÙˆÚˆÛŒ Ø®ÙˆØ´Ø¨Ùˆ';
      taglineSecondary.textContent = 'Ø·ÙˆÛŒÙ„ Ù…Ø¯ØªÛŒ Ø§ÙˆØ± Ø¯Ù„Ú©Ø´ ØªØ§Ø«Ø±';
      scentTitle.textContent = 'Ø®ÙˆØ´Ø¨Ùˆ Ú©ÛŒ ØªÛÛ Ø¯Ø± ØªÛÛ Ú©ÛØ§Ù†ÛŒ';
      scentSub.textContent = 'Ù…Ø´Ø±Ù‚ÛŒ Ø§ÙˆØ± ÛŒÙˆØ±Ù¾ÛŒ ÙÙ†Ù Ø¹Ø·Ø± Ø³Ø§Ø²ÛŒ Ú©Ø§ Ø§ÛŒÚ© Ù†Ø§Ø¯Ø± Ø´Ø§ÛÚ©Ø§Ø±ØŒ Ø¬Ùˆ ÙˆÙ‚Øª Ú©Û’ Ø³Ø§ØªÚ¾ ØªÛŒÙ† Ø¯Ù„Ú©Ø´ Ù…Ø±Ø§Ø­Ù„ Ù…ÛŒÚº Ú©Ú¾Ù„ØªØ§ ÛÛ’Û”';
      craftTitle.textContent = 'Ø¹Ø±Ø¨ÛŒ ÙÙ† Ø§ÙˆØ± Ø¬Ø¯ÛŒØ¯ ÙØ®Ø§Ù…Øª';
      craftSub.textContent = 'ÛØ± Ø¨ÙˆØªÙ„ Ø§ÙˆØ± ÛØ± Ú¯ÙÙ¹ Ø¨Ø§Ú©Ø³ Ú©Ùˆ Ø´Ø§ÛÛŒ Ù†ÙØ§Ø³Øª Ø§ÙˆØ± Ø¨Û’ Ø¯Ø§Øº ØªÙØµÛŒÙ„Ø§Øª Ú©Û’ Ø³Ø§ØªÚ¾ ØªÛŒØ§Ø± Ú©ÛŒØ§ Ú¯ÛŒØ§ ÛÛ’Û”';
      reviewsTitle.textContent = 'Ø®Ø±ÛŒØ¯Ø§Ø±ÙˆÚº Ú©Ø§ Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§ÙˆØ± ØªØ§Ø«Ø±Ø§Øª';
      faqTitle.textContent = 'Ø¹Ø§Ù… Ù¾ÙˆÚ†Ú¾Û’ Ø¬Ø§Ù†Û’ ÙˆØ§Ù„Û’ Ø³ÙˆØ§Ù„Ø§Øª';
      stickyClaimText.textContent = 'Ø§Ø¨Ú¾ÛŒ Ø¢Ø±ÚˆØ± Ú©Ø±ÛŒÚº ($1.19)';
    } else {
      bannerText.textContent = 'EXCLUSIVE DROP: Only 14 Bottles Left at $1.19 | Free Worldwide Delivery on Orders Today';
      taglinePrimary.textContent = 'ARABIAN ORIENTAL WOODY SCENT';
      taglineSecondary.textContent = 'LONG-LASTING & CAPTIVATING';
      scentTitle.textContent = 'The Olfactory Symphony';
      scentSub.textContent = 'Engineered across three distinct evaporative stages to project unmatched elegance and presence.';
      craftTitle.textContent = 'Designed to Captivate in Every Detail';
      craftSub.textContent = 'Every element from the weighted bottle cap to the gold-foiled geometric box reflects luxury fragrance standards.';
      reviewsTitle.textContent = 'Loved by Connoisseurs Worldwide';
      faqTitle.textContent = 'Frequently Asked Questions';
      stickyClaimText.textContent = 'CLAIM OFFER ($1.19)';
    }

    // Dynamic Urdu/English for Feature Titles and Descriptions
    document.querySelectorAll('[data-en]').forEach(el => {
      const en = el.getAttribute('data-en');
      const ur = el.getAttribute('data-ur');
      el.textContent = currentLang === 'ur' ? ur : en;
    });
  });

})();

