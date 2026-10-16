document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".gpx-demo-map").forEach(async (element) => {
    if (typeof L === "undefined") {
      element.textContent = "De kaart kan niet worden geladen. Controleer de internetverbinding.";
      element.classList.add("gpx-map-error");
      return;
    }

    const map = L.map(element);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    try {
      const response = await fetch(element.dataset.gpx);
      if (!response.ok) {
        throw new Error(`GPX laden mislukt (${response.status})`);
      }

      const xml = new DOMParser().parseFromString(await response.text(), "application/xml");
      if (xml.querySelector("parsererror")) {
        throw new Error("Het GPX-bestand bevat ongeldige XML");
      }

      const points = [...xml.querySelectorAll("trkpt")].map((point) => [
        Number(point.getAttribute("lat")),
        Number(point.getAttribute("lon")),
      ]);
      if (points.length < 2 || points.some((point) => point.some((coordinate) => !Number.isFinite(coordinate)))) {
        throw new Error("Het GPX-bestand bevat geen geldige track");
      }

      const track = L.polyline(points, { color: "#1565c0", weight: 5 }).addTo(map);
      xml.querySelectorAll("wpt").forEach((waypoint) => {
        const position = [
          Number(waypoint.getAttribute("lat")),
          Number(waypoint.getAttribute("lon")),
        ];
        if (position.some((coordinate) => !Number.isFinite(coordinate))) {
          return;
        }

        const name = waypoint.querySelector("name")?.textContent ?? "Vraag";
        const description = waypoint.querySelector("desc")?.textContent ?? "";
        L.marker(position).addTo(map).bindPopup(
          `<strong>${escapeHtml(name)}</strong><br>${escapeHtml(description)}`,
        );
      });
      map.fitBounds(track.getBounds(), { padding: [24, 24] });
    } catch (error) {
      console.error("Demo-GPX-kaart kon niet worden weergegeven:", error);
      element.innerHTML = '<p class="gpx-map-error">De demo-route kon niet worden geladen. Je kunt het <a href="assets/demo-communication-route.gpx">GPX-bestand hier downloaden</a>.</p>';
    }
  });
});

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}
