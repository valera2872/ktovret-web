(() => {
  const script = document.currentScript;
  const hero = document.querySelector('.guided-intro__image');
  if (!script || !hero) return;

  const base = new URL('./ml0512/hero-approved-v2/', script.src);
  const parts = ['00.txt', '01.txt', '02.txt', '03.txt', '04.txt'];

  Promise.all(parts.map(async (name) => {
    const response = await fetch(new URL(name, base), { cache: 'force-cache' });
    if (!response.ok) throw new Error(`hero part ${name}: ${response.status}`);
    return (await response.text()).trim();
  }))
    .then((chunks) => {
      const encoded = chunks.join('');
      if (encoded.length !== 56084) {
        throw new Error(`hero payload length mismatch: ${encoded.length}`);
      }
      if (!encoded.startsWith('UklG') || !encoded.endsWith('AAA=')) {
        throw new Error('hero payload signature mismatch');
      }
      hero.style.backgroundImage = `url("data:image/webp;base64,${encoded}")`;
      hero.style.backgroundPosition = 'center';
      hero.style.backgroundSize = 'cover';
      hero.dataset.hero = 'approved-v2';
    })
    .catch((error) => {
      console.error('[Thirteenth Minute hero]', error);
    });
})();
