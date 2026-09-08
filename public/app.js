document.documentElement.classList.add('js');

const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const robot = document.querySelector('#robot');
const command = document.querySelector('#missing-command');
const feedback = document.querySelector('#mission-feedback');

if (robot && command && feedback) {
  document.querySelectorAll('[data-command]').forEach((button) => {
    button.addEventListener('click', () => {
      robot.classList.remove('success', 'wrong');
      feedback.classList.remove('good', 'bad');
      command.textContent = button.textContent;

      window.setTimeout(() => {
        if (button.dataset.command === 'jump') {
          robot.classList.add('success');
          feedback.textContent = 'That worked. You chose the instruction that handles the obstacle.';
          feedback.classList.add('good');
        } else {
          robot.classList.add('wrong');
          feedback.textContent = 'Kito is still stuck. Now you know more than you did before. Try the command that handles the rock.';
          feedback.classList.add('bad');
        }
      }, 40);
    });
  });
}
