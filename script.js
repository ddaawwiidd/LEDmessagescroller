(function start() {
  // Ensure DOM is ready even if script is loaded in <head> or without defer
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  function init() {
    const formView = document.getElementById('formView');
    const ledScreen = document.getElementById('ledScreen');
    const marquee = document.getElementById('marquee');
    const input = document.getElementById('messageInput');
    const btn = document.getElementById('displayBtn');

    if (!formView || !ledScreen || !marquee || !input || !btn) {
      console.error('LED Scroller: Missing DOM elements. Check IDs and that files are in the same folder.');
      return;
    }

    // Focus input on load for quick typing
    input.focus();

    // Enter full-screen safely
    async function enterFullscreen() {
      const el = document.documentElement;
      try {
        if (!document.fullscreenElement && el.requestFullscreen) {
          await el.requestFullscreen();
        }
      } catch {
        /* Continue even if fullscreen is blocked */
      }
    }

    // Exit full-screen if active
    async function exitFullscreen() {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch { /* ignore */ }
    }

    function computeAndRunAnimation() {
      const contentWidth = marquee.offsetWidth; // px
      const viewportWidth = window.innerWidth;

      // Duration based on total travel distance for consistent pace
      const distance = contentWidth + viewportWidth + (viewportWidth * 0.06); // ~ var(--marquee-gap)
      const pxPerSec = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--speed-px-per-sec')) || 140;
      const durationSec = Math.max(4, distance / pxPerSec); // clamp to min 4s

      marquee.style.setProperty('--content-width', contentWidth + 'px');
      marquee.style.animation = `scroll ${durationSec}s linear infinite`;
    }

    function showLED(msg) {
      const text = (msg || '').toString().trim().toUpperCase();
      if (!text) return;

      marquee.textContent = text;
      marquee.style.animation = 'none'; // reset animation

      ledScreen.classList.add('visible');
      ledScreen.setAttribute('aria-hidden', 'false');
      formView.style.display = 'none';

      requestAnimationFrame(computeAndRunAnimation);
    }

    function hideLED() {
      marquee.style.animation = 'none';
      ledScreen.classList.remove('visible');
      ledScreen.setAttribute('aria-hidden', 'true');
      formView.style.display = '';
      input.focus();
    }

    // Recompute animation on resize while visible
    window.addEventListener('resize', () => {
      if (!ledScreen.classList.contains('visible')) return;
      marquee.style.animation = 'none';
      requestAnimationFrame(computeAndRunAnimation);
    });

    // Button click
    btn.addEventListener('click', async () => {
      await enterFullscreen();
      showLED(input.value || '');
    });

    // Enter key displays; Shift+Enter ignored
    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        await enterFullscreen();
        showLED(input.value || '');
      }
    });

    // Click anywhere to return
    ledScreen.addEventListener('click', async () => {
      hideLED();
      await exitFullscreen();
    });

    // Escape to return
    document.addEventListener('keydown', async (e) => {
      if (e.key === 'Escape' && ledScreen.classList.contains('visible')) {
        hideLED();
        await exitFullscreen();
      }
    });

    // If fullscreen is exited by system, return to form
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && ledScreen.classList.contains('visible')) {
        hideLED();
      }
    });

    // Demo text fallback
    if (!input.value) {
      input.value = 'Hello, world! Type your message and press Display';
    }
  }
})();
