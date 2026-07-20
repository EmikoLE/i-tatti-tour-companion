const ONBOARDING_SEEN_KEY = "onboardingSeen";

const STEPS = [
  {
    eyebrow: "Welcome",
    title: "The I Tatti Tour Companion",
    body: "A short guide to exploring the Berensons’ home and gardens. Here’s how to get around."
  },
  {
    eyebrow: "Moving through a chapter",
    title: "Tap or swipe to continue",
    body: "Tap the right side of the screen, swipe, or use the arrow keys to move between images."
  },
  {
    eyebrow: "Some photos are tall",
    title: "Rotate your phone when asked",
    body: "A small icon appears when a photo looks best in portrait. Turn your phone to see it full-screen."
  },
  {
    eyebrow: "Make it your own",
    title: "Drag to reorder slides",
    body: "Open the slide tray and drag any thumbnail to rearrange the chapter your way."
  },
  {
    eyebrow: "Before you save anything",
    title: "Dragging alone doesn’t stick",
    body: "Rearranging slides changes what you see right now, but it resets the next time this chapter loads. To make an arrangement permanent, save it inside a tour."
  },
  {
    eyebrow: "Curating tours",
    title: "Tours hold an order for each chapter",
    body: "Open Tours from the directory screen to create or edit one. Inside a tour, pick a chapter, drag to rearrange, then press Save — that becomes what everyone sees. Reset removes a chapter's custom order, and whichever tour you last saved into is always the one that loads."
  },
  {
    eyebrow: "Finding your way",
    title: "The logo and menu are always there",
    body: "Tap the I Tatti logo to return to the directory, or the menu to jump between slides."
  },
  {
    eyebrow: "Ready",
    title: "Start exploring",
    body: "You can revisit this guide anytime from “How it works” on the directory screen."
  }
];

export class Onboarding {
  constructor({ onFinish }) {
    this.onFinish = onFinish;
    this.current = 0;

    this.section = document.getElementById("onboarding");
    this.eyebrow = document.getElementById("onboardingEyebrow");
    this.title = document.getElementById("onboardingTitle");
    this.body = document.getElementById("onboardingBody");
    this.dots = document.getElementById("onboardingDots");
    this.backButton = document.getElementById("onboardingBack");
    this.nextButton = document.getElementById("onboardingNext");
    this.skipButton = document.getElementById("onboardingSkip");
    this.visualSteps = Array.from(document.querySelectorAll(".onboardingVisualStep"));

    this.backButton.addEventListener("click", event => {
      event.stopPropagation();
      this.back();
    });

    this.nextButton.addEventListener("click", event => {
      event.stopPropagation();
      this.next();
    });

    this.skipButton.addEventListener("click", event => {
      event.stopPropagation();
      this.close();
    });
  }

  static hasBeenSeen() {
    return Boolean(localStorage.getItem(ONBOARDING_SEEN_KEY));
  }

  get isOpen() {
    return this.section.classList.contains("visible");
  }

  open() {
    this.current = 0;
    this.render();

    this.section.classList.add("visible");
    document.body.classList.add("onboardingOpen");
  }

  close() {
    localStorage.setItem(ONBOARDING_SEEN_KEY, "1");

    this.section.classList.remove("visible");
    document.body.classList.remove("onboardingOpen");

    this.onFinish();
  }

  next() {
    if (this.current === STEPS.length - 1) {
      this.close();
      return;
    }

    this.current++;
    this.render();
  }

  back() {
    if (this.current === 0) return;

    this.current--;
    this.render();
  }

  render() {
    const step = STEPS[this.current];

    this.eyebrow.textContent = step.eyebrow;
    this.title.textContent = step.title;
    this.body.textContent = step.body;

    this.visualSteps.forEach(visual => {
      visual.classList.toggle("active", Number(visual.dataset.step) === this.current);
    });

    this.dots.innerHTML = STEPS.map((_, index) => `
      <button class="onboardingDot ${index === this.current ? "active" : ""}" data-index="${index}"></button>
    `).join("");

    Array.from(this.dots.querySelectorAll(".onboardingDot")).forEach(dot => {
      dot.addEventListener("click", event => {
        event.stopPropagation();

        this.current = Number(dot.dataset.index);
        this.render();
      });
    });

    this.backButton.classList.toggle("hidden", this.current === 0);
    this.nextButton.textContent = this.current === STEPS.length - 1 ? "Start exploring" : "Next";
  }
}
