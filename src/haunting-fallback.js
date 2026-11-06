(() => {
  function startFallback() {
    const root = document.documentElement;
    if (root.dataset.appReady === 'true') return;

    const nameInput = document.querySelector('#full-name');
    const emailInput = document.querySelector('#email');
    const scoreElement = document.querySelector('#haunting-value');
    const globalScoreElement = document.querySelector('#haunting-global');
    const meterElement = document.querySelector('#haunting-meter');
    const meterTrack = document.querySelector('.candle-meter');
    const nameCandle = document.querySelector('#name-candle');
    const emailCandle = document.querySelector('#email-candle');
    const caption = document.querySelector('.candles__caption');
    const secretButton = document.querySelector('#secret-button');
    const secretMessage = document.querySelector('#secret-message');
    const secretCopy = document.querySelector('#secret-copy');
    const dialog = document.querySelector('#secret-dialog');
    const dialogMessage = document.querySelector('#dialog-message');
    const dialogCloseButton = document.querySelector('#dialog-close');
    const dialogDoneButton = document.querySelector('#dialog-done');
    const secretToggleIcon = secretButton?.querySelector('span');
    const navToggle = document.querySelector('#nav-toggle');
    const navbar = document.querySelector('.navbar-parent');
    const siteNavigation = document.querySelector('#site-navigation');
    const navigationLinks = document.querySelectorAll('#site-navigation a');
    let navCloseTimeout;

    function setNavigationOpen(isOpen, immediate = false) {
      if (!navToggle || !navbar) return;

      window.clearTimeout(navCloseTimeout);
      navbar.classList.remove('is-menu-closing');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');

      if (isOpen) {
        navbar.classList.add('is-menu-open');
        return;
      }

      navbar.classList.remove('is-menu-open');

      if (immediate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      navbar.classList.add('is-menu-closing');
      navCloseTimeout = window.setTimeout(() => {
        navbar.classList.remove('is-menu-closing');
      }, 180);
    }

    navToggle?.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      setNavigationOpen(!isOpen);
    });

    navigationLinks.forEach((link) => {
      link.addEventListener('click', () => setNavigationOpen(false));
    });

    document.addEventListener('pointerdown', (event) => {
      if (
        navToggle?.getAttribute('aria-expanded') === 'true'
        && !siteNavigation?.contains(event.target)
        && !navToggle.contains(event.target)
      ) {
        setNavigationOpen(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navToggle?.getAttribute('aria-expanded') === 'true') {
        setNavigationOpen(false);
        navToggle.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 500 && navToggle?.getAttribute('aria-expanded') === 'true') {
        setNavigationOpen(false, true);
      }
    });

    if (!nameInput || !emailInput || !scoreElement || !meterElement) return;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{3,}$/;

    function update(progressOverride) {
      const scroller = document.scrollingElement || root;
      const maxScroll = Math.max(0, scroller.scrollHeight - window.innerHeight);
      const progress = progressOverride ?? (maxScroll ? scroller.scrollTop / maxScroll : 0);
      const nameValid = nameInput.value.trim().length > 0 && nameInput.value.trim().length <= 100;
      const email = emailInput.value.trim();
      const emailValid = email.length <= 254 && emailPattern.test(email);
      const validFields = Number(nameValid) + Number(emailValid);
      const level = Math.max(0, Math.min(100, Math.round(60 * progress + 40 * validFields / 2)));

      scoreElement.textContent = String(level);
      if (globalScoreElement) globalScoreElement.textContent = String(level);
      meterElement.style.width = `${level}%`;
      meterTrack?.setAttribute('aria-label', `${level} of 100 haunting level`);
      nameCandle?.classList.toggle('is-lit', nameValid);
      emailCandle?.classList.toggle('is-lit', emailValid);
      nameCandle?.setAttribute('aria-label', `Name ${nameValid ? 'valid' : 'not yet valid'}`);
      emailCandle?.setAttribute('aria-label', `Email ${emailValid ? 'valid' : 'not yet valid'}`);
      document.body.classList.toggle('is-haunted', level > 75);
      root.style.setProperty('--haunt', String(level));

      if (caption) {
        if (nameValid && emailValid) {
          caption.textContent = 'Both candles are lit. It knows you’re here.';
        } else if (nameValid && email.length > 0) {
          caption.textContent = 'Something is coming closer…';
        } else if (nameValid) {
          caption.textContent = 'One name is in the book.';
        } else if (level > 75) {
          caption.textContent = 'The house is listening closely';
        } else {
          caption.textContent = 'Two names to light the way';
        }
      }
    }

    let frame = 0;
    function scheduleUpdate(progressOverride) {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        update(progressOverride);
        frame = 0;
      });
    }

    nameInput.addEventListener('input', () => scheduleUpdate());
    emailInput.addEventListener('input', () => scheduleUpdate());
    window.addEventListener('scroll', () => scheduleUpdate(), { passive: true });
    window.addEventListener('resize', () => scheduleUpdate(), { passive: true });

    const houseMessage = 'If the candles flicker <b>twice</b>, someone at the house is <b>thinking</b> of you. They may even save you the <b>last</b> slice of cake.';

    function closeSecret() {
      if (dialog?.open) dialog.close();

      if (secretMessage) secretMessage.hidden = true;
      secretButton?.setAttribute('aria-expanded', 'false');
      if (secretToggleIcon) secretToggleIcon.textContent = '+';
      secretButton?.focus();
    }

    if (secretButton && secretMessage) {
      secretCopy.innerHTML = houseMessage;

      secretButton.addEventListener('click', () => {
        const isOpen = secretButton.getAttribute('aria-expanded') === 'true';

        if (isOpen) {
          closeSecret();
          return;
        }

        secretButton.setAttribute('aria-expanded', 'true');
        if (secretToggleIcon) secretToggleIcon.textContent = '−';

        if (typeof dialog?.showModal === 'function') {
          dialogMessage.innerHTML = houseMessage;
          dialog.showModal();
          dialogDoneButton?.focus();
        } else {
          secretMessage.hidden = false;
        }
      });

      dialogCloseButton?.addEventListener('click', closeSecret);
      dialogDoneButton?.addEventListener('click', closeSecret);
      dialog?.addEventListener('cancel', () => {
        secretMessage.hidden = true;
        secretButton.setAttribute('aria-expanded', 'false');
        if (secretToggleIcon) secretToggleIcon.textContent = '+';
        secretButton.focus();
      });

      document.addEventListener('keydown', (event) => {
        const isExpanded = secretButton.getAttribute('aria-expanded') === 'true';

        if (event.key === 'Escape' && !dialog?.open && isExpanded) {
          closeSecret();
        }
      });
    }

    if (window.Lenis) {
      const lenis = new window.Lenis({
        duration: 1.1,
        easing: (time) => Math.min(1, 1.001 - Math.pow(2, -10 * time)),
        smoothWheel: true,
        anchors: true
      });

      root.classList.add('has-lenis');
      lenis.on('scroll', ({ scroll, limit }) => {
        scheduleUpdate(limit > 0 ? scroll / limit : 0);
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);
    }

    update();
  }

  window.addEventListener('load', () => {
    if (document.documentElement.dataset.appReady !== 'true') startFallback();
  }, { once: true });
})();
