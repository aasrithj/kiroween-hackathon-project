// Old system errors. Generic late-90s dialogs (no real OS branding) pile up as you scroll,
// the last one leaves a frozen trail across the screen, and the "system" crashes to a fatal screen.

export function createErrorLayer(host, { messages, fatal, onChime, onCrash }) {
  const dialogs = [];
  let cascaded = false;
  let fatalShown = false;
  let fatalEl = null;
  let spawnIndex = 0;

  function makeDialog(message, x, y, { trail = false } = {}) {
    const el = document.createElement('div');
    el.className = `retro-dialog${trail ? ' retro-dialog--trail' : ''}`;
    if (!trail) {
      el.setAttribute('role', 'alertdialog');
      el.setAttribute('aria-label', `${message.title}: ${message.body}`);
    } else {
      el.setAttribute('aria-hidden', 'true');
    }
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.innerHTML = `
      <div class="retro-dialog__bar"><span></span><button type="button" class="retro-dialog__x" aria-label="Close" tabindex="${trail ? -1 : 0}">×</button></div>
      <div class="retro-dialog__body"><span class="retro-dialog__icon" aria-hidden="true">✕</span><p></p></div>
      <div class="retro-dialog__actions"><button type="button" class="retro-dialog__ok" tabindex="${trail ? -1 : 0}">OK</button></div>`;
    el.querySelector('.retro-dialog__bar span').textContent = message.title;
    el.querySelector('p').textContent = message.body;
    if (!trail) {
      const dismiss = () => {
        el.remove();
        dialogs.splice(dialogs.indexOf(el), 1);
        // Closing one only makes another appear.
        spawn({ title: 'SYSTEM', body: 'Are you sure? It is still smiling.' });
      };
      el.querySelector('.retro-dialog__ok').addEventListener('click', dismiss);
      el.querySelector('.retro-dialog__x').addEventListener('click', dismiss);
    }
    host.append(el);
    return el;
  }

  function spawn(message = messages[spawnIndex % messages.length]) {
    spawnIndex += 1;
    const x = 40 + Math.random() * Math.max(10, innerWidth - 420);
    const y = 60 + Math.random() * Math.max(10, innerHeight - 260);
    const el = makeDialog(message, x, y);
    dialogs.push(el);
    onChime?.();
    return el;
  }

  async function cascade() {
    cascaded = true;
    const message = { title: 'SYSTEM', body: 'SMILE.EXE has stopped responding.' };
    const startX = innerWidth * 0.1;
    const startY = innerHeight * 0.15;
    // The classic frozen-window smear: copies drawn along a path, faster and faster.
    for (let i = 0; i < 46; i += 1) {
      const u = i / 45;
      const x = startX + u * innerWidth * 0.55 + Math.sin(u * 9) * 60;
      const y = startY + Math.sin(u * Math.PI) * innerHeight * 0.45;
      makeDialog(message, x, y, { trail: true });
      if (i % 6 === 0) onChime?.();
      await new Promise((resolve) => setTimeout(resolve, Math.max(8, 60 - i * 1.4)));
    }
  }

  function showFatal() {
    fatalShown = true;
    fatalEl = document.createElement('div');
    fatalEl.className = 'fatal-screen';
    fatalEl.setAttribute('role', 'alert');
    const pre = document.createElement('pre');
    pre.textContent = fatal.join('\n');
    const cursor = document.createElement('span');
    cursor.className = 'fatal-screen__cursor';
    cursor.textContent = '_';
    pre.append(cursor);
    fatalEl.append(pre);
    host.append(fatalEl);
    onCrash?.();
  }

  function clear() {
    host.replaceChildren();
    dialogs.length = 0;
    cascaded = false;
    fatalShown = false;
    fatalEl = null;
  }

  return {
    /** Drive by local progress through the errors beat; `count` from logic/errorCount. */
    update(q, count, active) {
      if (!active) {
        if (host.childElementCount) clear();
        return;
      }
      while (dialogs.length < count && !cascaded) spawn();
      if (q > 0.72 && !cascaded) cascade();
      if (q > 0.86 && !fatalShown) showFatal();
      if (q <= 0.86 && fatalShown) {
        fatalEl?.remove();
        fatalShown = false;
      }
    },
    clear
  };
}
