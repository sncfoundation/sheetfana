<p align="center"><img src="https://sncfoundation.github.io/logos/sheetfana.svg" width="96" alt="Sheetfana logo"></p>

# Sheetfana

**The dashboards layer for [Sheeternetes](https://github.com/sncfoundation/sheeternetes). Our Grafana.**

Sheeternetes runs your containers off a Google Sheet. Sheetfana *observes* it —
turning the Sheeternetes apiserver (and, when present, the
[Sheetheus](https://github.com/sncfoundation) metrics TSDB) into dashboards you
can actually look at:

- a **browser dashboard** (`dashboard.html`) — a self-contained, dark, Grafana-style
  page: stat tiles, a replicas-per-deployment bar chart, and a pod-phase breakdown.
  No build step, no CDNs, one file. Auto-refreshes every 15s.
- a **terminal dashboard** (`sheetfana render`) — an ASCII cluster overview read
  live from the apiserver, for when you live in the shell.
- an **in-Sheet dashboard** (`Dashboard.gs`) — Apps Script that builds a beautiful
  "Dashboard" tab *inside the spreadsheet itself*, with summary cells and embedded
  column + pie charts. The dashboard lives where the cluster lives: cell A1.

All three read the same apiserver the rest of Sheeternetes uses:

```
GET $WEBAPP_URL?token=$TOKEN&kind=nodes|deployments|pods|events  ->  { "items": [ ... ] }
```

## Usage

### Configure

Sheetfana reads `WEBAPP_URL` and `TOKEN` from the environment, or from a
`.skctl.env` (shared with `skctl`) / `.sheetfana.env` file next to the CLI:

```bash
export WEBAPP_URL="https://script.google.com/macros/s/XXXX/exec"
export TOKEN="your-shared-secret"
```

### `sheetfana render` — terminal dashboard

```bash
./sheetfana render
```

Prints node count, ready nodes, a replicas-per-deployment bar chart, and a
pod-phase breakdown — live from the apiserver. If the `sheetheus` CLI is on your
`PATH`, a latest-metrics summary is appended from `sheetheus export`.

### `sheetfana open` — browser dashboard

```bash
./sheetfana open        # opens dashboard.html via `open` / `xdg-open`
```

Or just double-click `dashboard.html`. Paste your `WEBAPP_URL` + `TOKEN` into the
connection bar and hit **Connect** — the values are remembered locally and the page
refreshes itself every 15 seconds.

### `sheetfana sheets` — in-Sheet dashboard

```bash
./sheetfana sheets      # prints Dashboard.gs to paste into Apps Script
```

Copy the output (or the `Dashboard.gs` file) into your Sheeternetes spreadsheet's
Apps Script editor (**Extensions → Apps Script**), then run `buildDashboard()`. It
creates/refreshes a **Dashboard** tab with count tiles and two embedded charts
(replicas per deployment, pod phases). Optionally run `installDashboardMenu()` to
add a **Sheetfana → Refresh dashboard** menu.

## Requirements

- `sheetfana` CLI: `bash`, `curl`, `jq` (`open`/`xdg-open` for `sheetfana open`).
- `dashboard.html`: any modern browser. No dependencies.
- `Dashboard.gs`: Google Apps Script (built in).

## How it fits the ecosystem

| Project | Role | Analogue |
|---|---|---|
| **Sheeternetes** | orchestrator / control plane | Kubernetes |
| **Sheetheus** | metrics TSDB | Prometheus |
| **Sheetfana** | dashboards | Grafana |

## License

Apache License 2.0 — see [LICENSE](LICENSE).
