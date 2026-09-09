"use strict";

(function() {
  const toggle = document.getElementById("menu-toggle");
  const navigation = document.getElementById("nav-links");
  const archive = navigation.querySelector(".archive");
  const mapLink = document.getElementById("map-link");
  const mapDialog = document.getElementById("venue-map");

  function closeNavigation() {
    toggle.setAttribute("aria-expanded", "false");
    navigation.classList.remove("open");
    archive.open = false;
  }

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    navigation.classList.toggle("open", !expanded);
  });

  navigation.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", closeNavigation);
  });

  navigation.addEventListener("keydown", event => {
    if (event.key !== "Escape") {
      return;
    }

    if (archive.open) {
      archive.open = false;
      archive.querySelector("summary").focus();
    } else if (toggle.getAttribute("aria-expanded") === "true") {
      closeNavigation();
      toggle.focus();
    }
  });

  window.matchMedia("(max-width: 1050px)").addEventListener("change", closeNavigation);
  document.documentElement.classList.add("has-menu-js");

  // The image link remains usable without JavaScript or native dialog support.
  if (mapLink && mapDialog && typeof mapDialog.showModal === "function") {
    mapLink.addEventListener("click", event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        return;
      }

      event.preventDefault();
      mapDialog.showModal();
    });
  }

  document.querySelectorAll(".info-page table").forEach(table => {
    table.tabIndex = 0;
  });
})();
