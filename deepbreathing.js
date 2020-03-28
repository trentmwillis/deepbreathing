const animations = {
  equal: [
    ['Breathe In', 'breatheIn', 5],
    ['Hold', 'holdIn', 2],
    ['Breathe Out', 'breatheOut', 5],
  ],
  half478: [
    ['Breathe In', 'breatheIn', 2],
    ['Hold', 'holdIn', 3.5],
    ['Breathe Out', 'breatheOut', 4],
  ],
  full478: [
    ['Breathe In', 'breatheIn', 4],
    ['Hold', 'holdIn', 7],
    ['Breathe Out', 'breatheOut', 8],
  ]
};

const playAnimation = (el, animation, duration) => new Promise(resolve => {
  el.style.animation = null;

  requestAnimationFrame(() => {
    const animationend = (event) => {
      el.removeEventListener('animationend', animationend);
      resolve();
    };
    el.addEventListener('animationend', animationend);
    el.style.animation = `${animation} ${duration}s forwards`;
  });
});

const instructionEl = document.getElementById('instruction');
const animatronEl = document.getElementById('animatron');
const animationStep = (step) => {
  const [instructionText, animation, duration] = step;
  instructionEl.textContent = instructionText;
  return Promise.all([
    playAnimation(instructionEl, "fadeIn", 0.5)
    .then(() => playAnimation(instructionEl, "pause", duration - 1))
    .then(() => playAnimation(instructionEl, "fadeOut", 0.5)),
    playAnimation(animatronEl, animation, duration),
  ]);
};

const startAnimation = async (steps) => {
  while (steps.length) {
    const step = steps.shift();
    await animationStep(step);
    steps.push(step);
  }
};

document.querySelector('.control-panel').addEventListener('click', (event) => {
  const { target } = event;
  const control = target.closest('.control');
  if (control) {
    const currentlyActiveControl = document.querySelector('.control.is-active');
    if (currentlyActiveControl) currentlyActiveControl.classList.remove('is-active');
    control.classList.add('is-active');
    startAnimation(animations[control.dataset.animation]);
  }
});
