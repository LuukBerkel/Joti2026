document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-wikipedia-search]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const input = form.querySelector('input[name="search"]');
      const language = form.querySelector('select[name="language"]').value;
      const status = form.querySelector(".wikipedia-search__status");
      const resultsList = form.querySelector(".wikipedia-search__results");
      const search = input.value.trim();
      if (!search) {
        input.focus();
        return;
      }

      status.textContent = "Wikipedia doorzoeken...";
      resultsList.replaceChildren();

      const params = new URLSearchParams({
        action: "query",
        generator: "search",
        gsrsearch: search,
        gsrlimit: "5",
        prop: "extracts|info",
        exintro: "1",
        explaintext: "1",
        inprop: "url",
        format: "json",
        origin: "*",
      });

      try {
        const response = await fetch(`https://${language}.wikipedia.org/w/api.php?${params}`);
        if (!response.ok) {
          throw new Error(`Wikipedia gaf HTTP-status ${response.status}`);
        }

        const data = await response.json();
        const pages = Object.values(data.query?.pages ?? {});
        if (pages.length === 0) {
          status.textContent = "Geen artikelen gevonden. Probeer andere zoekwoorden of zoek rechtstreeks op Wikipedia.";
          return;
        }

        pages
          .sort((a, b) => a.index - b.index)
          .forEach((page) => {
            const item = document.createElement("li");
            const link = document.createElement("a");
            link.href = page.fullurl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = page.title;

            const extract = document.createElement("p");
            extract.textContent = page.extract || "Open het artikel om de inhoud te lezen.";
            item.append(link, extract);
            resultsList.append(item);
          });

        status.textContent = `Wikipedia-artikelen gevonden: ${pages.length}. Open een artikel en controleer daar zelf je antwoord.`;
      } catch (error) {
        console.error("Wikipedia zoeken is mislukt:", error);
        status.textContent = "Zoeken op de website is nu niet gelukt. Gebruik de Wikipedia-zoekpagina om verder te zoeken.";
        const link = document.createElement("a");
        link.href = `https://${language}.wikipedia.org/w/index.php?search=${encodeURIComponent(search)}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = `Zoek '${search}' rechtstreeks op Wikipedia`;
        resultsList.append(link);
      }
    });
  });
});
