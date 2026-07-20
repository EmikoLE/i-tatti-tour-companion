const SEEN_KEY_PREFIX = "hintSeen_";

export function showHintOnce(key, container, message) {
  if (!container) return;
  if (localStorage.getItem(SEEN_KEY_PREFIX + key) === "1") return;
  if (container.querySelector(`[data-hint-key="${key}"]`)) return;

  const hint = document.createElement("div");
  hint.className = "inlineHint";
  hint.dataset.hintKey = key;
  hint.innerHTML = `
    <p>${message}</p>
    <button class="inlineHintDismiss">Got it</button>
  `;

  container.prepend(hint);

  hint.querySelector(".inlineHintDismiss").addEventListener("click", event => {
    event.stopPropagation();
    localStorage.setItem(SEEN_KEY_PREFIX + key, "1");
    hint.remove();
  });
}
