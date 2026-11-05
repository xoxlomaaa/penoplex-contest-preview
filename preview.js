"use strict";
for (const form of document.querySelectorAll(".pcx-gallery-filter")) {
  form.addEventListener("submit", event => {
    event.preventDefault();
    const contest = form.elements.contest.value;
    location.assign(contest ? "./gallery-contest-" + encodeURIComponent(contest) + ".html" : "./gallery.html");
  });
}