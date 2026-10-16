document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".gpx-route-map").forEach(async (element) => {
    if (typeof L === "undefined") {
      showGpxDownload(element, "De kaart kan niet worden geladen. Je kunt het GPX-bestand downloaden.");
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

      const trackPoints = [...xml.querySelectorAll("trkpt")].map((point) => [
        Number(point.getAttribute("lat")),
        Number(point.getAttribute("lon")),
      ]).filter(isValidPosition);
      const waypoints = [...xml.querySelectorAll("wpt")].map((waypoint) => ({
        element: waypoint,
        position: [
          Number(waypoint.getAttribute("lat")),
          Number(waypoint.getAttribute("lon")),
        ],
      })).filter(({ position }) => isValidPosition(position));
      const routeLayer = L.featureGroup().addTo(map);
      if (trackPoints.length > 1) {
        L.polyline(trackPoints, { color: "#1565c0", weight: 5 }).addTo(routeLayer);
      }
      waypoints.forEach(({ element: waypoint, position }) => {
        const name = waypoint.querySelector("name")?.textContent ?? "Vraag";
        const description = waypoint.querySelector("desc")?.textContent ?? "";
        L.marker(position).addTo(routeLayer).bindPopup(
          `<strong>${escapeHtml(name)}</strong><br>${escapeHtml(description)}`,
        );
      });
      if (routeLayer.getLayers().length === 0) {
        throw new Error("Het GPX-bestand bevat geen geldige routepunten");
      }
      map.fitBounds(routeLayer.getBounds(), { padding: [24, 24] });
    } catch (error) {
      console.error("GPX-route kon niet worden weergegeven:", error);
      showGpxDownload(element, "De GPX-route kon niet op de kaart worden weergegeven.");
    }
  });
});

function isValidPosition([latitude, longitude]) {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180
    && (latitude !== 0 || longitude !== 0);
}

function showGpxDownload(element, message) {
  const paragraph = document.createElement("p");
  paragraph.className = "gpx-map-error";
  paragraph.append(`${message} `);

  const link = document.createElement("a");
  link.href = element.dataset.gpx;
  link.textContent = "Download het GPX-bestand.";
  paragraph.append(link);
  element.replaceChildren(paragraph);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}
