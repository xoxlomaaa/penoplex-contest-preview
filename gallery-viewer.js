"use strict";

for (const photos of document.querySelectorAll(".pcx-feed .pcx-work-photos")) {
  const slides = Array.from(photos.querySelectorAll(".pcx-photo-link"));
  if (slides.length < 2) continue;

  const controls = document.createElement("div");
  controls.className = "pcx-album-toolbar";
  controls.setAttribute("role", "group");
  controls.setAttribute("aria-label", "Фотографии работы");
  const previous = document.createElement("button");
  const next = document.createElement("button");
  const count = document.createElement("span");
  count.setAttribute("aria-live", "polite");

  for (const [button, direction, label] of [[previous, -1, "Предыдущее фото в работе"], [next, 1, "Следующее фото в работе"]]) {
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="' +
      (direction < 0 ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6") +
      '" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    button.addEventListener("click", event => {
      const animate = event.detail > 0 && !matchMedia("(prefers-reduced-motion: reduce)").matches;
      photos.scrollBy({left: photos.clientWidth * direction, behavior: animate ? "smooth" : "instant"});
    });
  }

  function updateControls() {
    const index = Math.max(0, Math.min(slides.length - 1, Math.round(photos.scrollLeft / photos.clientWidth)));
    count.textContent = (index + 1) + " / " + slides.length;
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
  }
  controls.append(previous, count, next);
  photos.after(controls);
  photos.addEventListener("scroll", updateControls, {passive: true});
  updateControls();
}

for (const player of document.querySelectorAll(".pcx-video-player")) {
  const slot = player.querySelector(".pcx-video-frame");
  const template = slot.querySelector("template");
  function syncPlayer() {
    const frame = slot.querySelector("iframe");
    if (player.open && !frame) slot.append(template.content.cloneNode(true));
    if (!player.open && frame) frame.remove();
  }
  player.addEventListener("toggle", syncPlayer);
  syncPlayer();
}

for (const gallery of document.querySelectorAll(".pcx-gallery")) {
  const viewer = gallery.querySelector(".pcx-photo-viewer");
  if (!viewer || typeof viewer.showModal !== "function") continue;

  const title = viewer.querySelector(".pcx-photo-viewer-title");
  const status = viewer.querySelector(".pcx-photo-viewer-status");
  const controls = viewer.querySelector(".pcx-photo-viewer-controls");
  const count = viewer.querySelector(".pcx-photo-viewer-count");
  const closeButton = viewer.querySelector("[data-photo-close]");
  let photos = [];
  let index = 0;
  let trigger = null;
  let image = viewer.querySelector(".pcx-photo-viewer-image");

  function showPhoto(nextIndex) {
    index = (nextIndex + photos.length) % photos.length;
    const link = photos[index];
    const next = new Image();
    next.className = "pcx-photo-viewer-image";
    next.alt = link.querySelector("img").alt;
    next.hidden = true;
    next.addEventListener("load", () => {
      if (image !== next) return;
      status.textContent = "";
      next.hidden = false;
    });
    next.addEventListener("error", () => {
      if (image !== next) return;
      status.textContent = "Не удалось загрузить фото. Попробуйте открыть его ещё раз.";
    });
    status.textContent = "Загрузка фото…";
    image.replaceWith(next);
    image = next;
    count.textContent = (index + 1) + " из " + photos.length;
    next.src = link.href;
  }

  gallery.addEventListener("click", event => {
    const link = event.target.closest(".pcx-photo-link");
    if (!link || event.defaultPrevented || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const work = link.closest("article");
    if (!work) return;
    photos = Array.from(work.querySelectorAll(".pcx-photo-link"));
    event.preventDefault();
    trigger = link;
    title.textContent = work.querySelector("h2").textContent;
    controls.hidden = photos.length < 2;
    viewer.showModal();
    showPhoto(photos.indexOf(link));
  });

  for (const button of controls.querySelectorAll("[data-photo-step]")) {
    button.addEventListener("click", () => showPhoto(index + Number(button.dataset.photoStep)));
  }

  viewer.addEventListener("keydown", event => {
    if (photos.length < 2 || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    event.preventDefault();
    showPhoto(index + (event.key === "ArrowRight" ? 1 : -1));
  });

  closeButton.addEventListener("click", () => viewer.close());
  viewer.addEventListener("click", event => {
    if (event.target === viewer) {
      const box = viewer.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right ||
          event.clientY < box.top || event.clientY > box.bottom) viewer.close();
    }
  });
  viewer.addEventListener("close", () => {
    trigger?.focus({preventScroll: true});
    trigger = null;
  });
}
