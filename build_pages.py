#!/usr/bin/env python3
"""Generate multi-page HTML from the original monolithic index.html."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "_monolith_source.html"
lines = SOURCE.read_text(encoding="utf-8").splitlines(True)

FONT_LINKS = """    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/site.css">
"""

SCRIPTS = """    <script src="js/app.js" defer></script>
    <script async src="https://iframely.net/embed.js"></script>
"""


def nav(active: str) -> str:
    items = [
        ("index.html", "nav-dashboard", "Dashboard"),
        ("cameras.html", "nav-cameras", "Live Cameras"),
        ("news.html", "nav-news", "News"),
        ("weather.html", "nav-weather", "Weather"),
        ("chat.html", "nav-chat", "Community Chat"),
        ("about.html", "nav-about", "About"),
    ]
    out = ['            <nav class="site-nav" aria-label="Main navigation">\n']
    for href, eid, label in items:
        cls = "nav-link active" if href == active else "nav-link"
        out.append(f'                <a href="{href}" class="{cls}" id="{eid}">{label}</a>\n')
    out.append("            </nav>\n")
    return "".join(out)


def build_head(title: str) -> str:
    return (
        lines[0]
        + lines[1]
        + lines[2]
        + lines[3]
        + lines[4]
        + f"    <title>{title}</title>\n"
        + lines[6]
        + lines[7]
        + "\n"
        + FONT_LINKS
        + "".join(lines[9:43])
        + "</head>\n"
    )


def body_prefix(data_page: str, active_nav: str) -> str:
    top = "".join(lines[1467:1506])
    return f'<body data-page="{data_page}">\n' + top + nav(active_nav)


def footer_block(include_popup: bool) -> str:
    if include_popup:
        return "".join(lines[1890:1911])
    return "".join(lines[1900:1911])


def write_page(
    filename: str,
    title: str,
    data_page: str,
    active_nav: str,
    main_inner: str,
    include_popup: bool,
):
    html = (
        build_head(title)
        + body_prefix(data_page, active_nav)
        + main_inner
        + footer_block(include_popup)
        + "\n"
        + SCRIPTS
        + "</body>\n</html>\n"
    )
    (ROOT / filename).write_text(html, encoding="utf-8")


# --- Main slices (0-based indices; end exclusive) ---
cameras_inner = (
    '        <main class="main-area">\n'
    + "".join(lines[1710:1733])
    + "        </main>\n"
)

news_inner = (
    '        <main class="main-area">\n'
    + "".join(lines[1737:1742])
    + "        </main>\n"
)

chat_inner = (
    '        <main class="main-area">\n'
    + "".join(lines[1746:1816])
    + "        </main>\n"
)

about_inner = (
    '        <main class="main-area">\n'
    + "".join(lines[1821:1888])
    + "        </main>\n"
)

dashboard_inner = (
    '        <main class="main-area">\n'
    + "".join(lines[1516:1702])
    + "        </main>\n"
)

weather_inner = """
        <main class="main-area weather-page">
            <div class="weather-hero">
                <h2 id="weather-page-title">SMG weather</h2>
                <p class="lead" id="weather-page-desc">
                    Official weather warnings and daily conditions from the Meteorological and Geophysical Bureau (SMG) RSS feeds at rss.smg.gov.mo.
                </p>
                <div class="weather-toolbar">
                    <button type="button" class="btn-refresh" id="btn-refresh-feeds" aria-label="Refresh feeds">
                        <i class="fas fa-rotate"></i> <span id="refresh-label">Refresh feeds</span>
                    </button>
                    <span class="feed-meta" id="feed-last-updated"></span>
                </div>
            </div>
            <div class="weather-grid">
                <section class="weather-card" aria-labelledby="alerts-heading">
                    <h3 id="alerts-heading"><i class="fas fa-triangle-exclamation"></i> <span id="alerts-title-text">Weather warnings</span></h3>
                    <div class="loading" id="alerts-loading"><div class="spinner"></div><span>Loading…</span></div>
                    <div id="smg-alerts-host" class="rss-html" hidden></div>
                </section>
                <section class="weather-card" aria-labelledby="report-heading">
                    <h3 id="report-heading"><i class="fas fa-cloud-sun"></i> <span id="report-title-text">Daily weather report</span></h3>
                    <div class="loading" id="report-loading"><div class="spinner"></div><span>Loading…</span></div>
                    <div id="smg-report-host" class="rss-html" hidden></div>
                </section>
                <section class="weather-card" aria-labelledby="forecast-heading" style="grid-column: 1 / -1;">
                    <h3 id="forecast-heading"><i class="fas fa-calendar-days"></i> <span id="forecast-title-text">Weather forecast</span></h3>
                    <div class="loading" id="forecast-loading"><div class="spinner"></div><span>Loading…</span></div>
                    <div id="smg-forecast-host" class="rss-html" hidden></div>
                </section>
            </div>
            <p class="smg-attribution" id="smg-attribution">
                Data source: <a href="https://rss.smg.gov.mo/" rel="noopener noreferrer" target="_blank">Macao Meteorological and Geophysical Bureau (SMG) RSS</a>.
                Feeds used: weather warnings (c_WSignal_rss.xml), daily report (c_ActualWeather_rss.xml), forecast (c_WForecast_rss.xml).
            </p>
        </main>
"""

if __name__ == "__main__":
    write_page(
        "index.html",
        "Macau Traffic Monitor",
        "dashboard",
        "index.html",
        dashboard_inner,
        include_popup=True,
    )
    write_page(
        "cameras.html",
        "Live cameras · Macau Traffic Monitor",
        "cameras",
        "cameras.html",
        cameras_inner,
        include_popup=False,
    )
    write_page(
        "news.html",
        "News · Macau Traffic Monitor",
        "news",
        "news.html",
        news_inner,
        include_popup=False,
    )
    write_page(
        "chat.html",
        "Community chat · Macau Traffic Monitor",
        "chat",
        "chat.html",
        chat_inner,
        include_popup=False,
    )
    write_page(
        "about.html",
        "About · Macau Traffic Monitor",
        "about",
        "about.html",
        about_inner,
        include_popup=False,
    )
    write_page(
        "weather.html",
        "Weather · Macau Traffic Monitor",
        "weather",
        "weather.html",
        weather_inner,
        include_popup=False,
    )
    print("Generated pages OK.")
