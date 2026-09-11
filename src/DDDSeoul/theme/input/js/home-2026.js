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

  const now = new Date();
  const koreaDateParts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const koreaDate = Object.fromEntries(koreaDateParts.map(part => [part.type, part.value]));
  const today = `${koreaDate.year}-${koreaDate.month}-${koreaDate.day}`;

  document.querySelectorAll("[data-ticket-start][data-ticket-end]").forEach(row => {
    const start = row.dataset.ticketStart;
    const end = row.dataset.ticketEnd;
    const status = row.querySelector(".ticket-status");

    if (!status) {
      return;
    }

    if (today < start) {
      status.textContent = "판매 예정";
    } else if (today > end) {
      status.textContent = "판매 종료";
    } else {
      row.classList.add("is-active");
      status.textContent = "현재 판매 중";
    }
  });
})();
