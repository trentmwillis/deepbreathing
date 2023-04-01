import { BrownNoise } from './src/brown-noise.js';

window.addEventListener('DOMContentLoaded', async () => {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js');

  const instructionEl = document.getElementById('instruction');
  const animatronEl = document.getElementById('animatron');

  const sound = new BrownNoise();
  await sound.init();

  const animations = {
    equal: {
      intro: [
        ['equal breathing will focus on inhaling and exhaling for the same length of time', 'holdOut', 5],
        ['find a comfortable position to sit or stand', 'holdOut', 4],
        ['breathe in and out through your nose and feel your belly expand', 'holdOut', 5],
        ['ready?', 'holdOut', 3],
      ],
      loop: [
        ['Breathe In', 'breatheIn', 4],
        ['Hold', 'holdIn', 2],
        ['Breathe Out', 'breatheOut', 4],
      ],
      times: 10
    },
    half478: {
      intro: [
        ['4/7/8 breathing involves inhaling for 4 seconds, holding for 7 seconds, and exhaling for 8 seconds', 'holdOut', 6],
        ['this version is for half that amount of time', 'holdOut', 4],
        ['find a comfortable position to sit or stand', 'holdOut', 4],
        ['breathe in through your nose and out through your mouth', 'holdOut', 5],
        ['ready?', 'holdOut', 3],
      ],
      loop: [
        ['Breathe In', 'breatheIn', 2],
        ['Hold', 'holdIn', 3.5],
        ['Breathe Out', 'breatheOut', 4],
      ],
      times: 10
    },
    full478: {
      intro: [
        ['4/7/8 breathing involves inhaling for 4 seconds, holding for 7 seconds, and exhaling for 8 seconds', 'holdOut', 6],
        ['if that is too long, try the half version', 'holdOut', 4],
        ['find a comfortable position to sit or stand', 'holdOut', 4],
        ['breathe in through your nose and out through your mouth', 'holdOut', 5],
        ['ready?', 'holdOut', 3],
      ],
      loop: [
        ['Breathe In', 'breatheIn', 4],
        ['Hold', 'holdIn', 7],
        ['Breathe Out', 'breatheOut', 8],
      ],
      times: 7
    }
  };

  const playAnimation = (el, animation, duration) => new Promise(resolve => {
    el.style.animation = null;
    void el.offsetWidth;

    requestAnimationFrame(() => {
      const animationend = () => {
        el.removeEventListener('animationend', animationend);
        resolve();
      };
      el.addEventListener('animationend', animationend);
      el.style.animation = `${animation} ${duration}s ease-in-out forwards`;
    });
  });

  const animationStep = (step, skipFadeOut = false) => {
    const [instructionText, animation, duration] = step;
    instructionEl.textContent = instructionText;
    return Promise.all([
      playAnimation(instructionEl, "fadeIn", 0.5)
        .then(() => playAnimation(instructionEl, "pause", duration - 1))
        .then(() => skipFadeOut || playAnimation(instructionEl, "fadeOut", 0.5)),
      playAnimation(animatronEl, animation, duration),
    ]);
  };

  const startAnimation = async (animation) => {
    sound.play();

    await playAnimation(instructionEl, "fadeOut", 0.5);

    for (let i = 0; i < animation.intro.length; i++) {
      await animationStep(animation.intro[i]);
    }

    const steps = animation.loop.slice();
    for (let i = 0; i < animation.times; i++) {
      for (let j = 0; j < steps.length; j++) {
        await animationStep(steps[j]);
      }
    }

    await animationStep(['All done, good job! Feel free to start another pattern if you want', 'holdOut', 2], true);
    sound.stop();
  };

  const disableControls = (disable) => {
    document.querySelectorAll('.control').forEach(control => {
      if (disable) {
        control.setAttribute('disabled', true);
      } else {
        control.removeAttribute('disabled');
      }
    });
  };

  const clickControl = async (control) => {
    if (control.getAttribute('disabled') || control.classList.contains('is-active')) return;

    disableControls(true);
    control.removeAttribute('disabled');
    control.classList.add('is-active');
    await startAnimation(animations[control.dataset.animation]);
    control.classList.remove('is-active');
    disableControls(false);
  };

  const handleClick = (click) => {
      const control = click.target.closest('.control');
      if (control) clickControl(control);
  };

  document.querySelector('.control-panel').addEventListener('click', handleClick);
});
