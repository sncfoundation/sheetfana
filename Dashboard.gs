/**
 * Sheetfana — in-Sheet dashboard for Sheeternetes.
 *
 * Run buildDashboard() inside the Sheeternetes spreadsheet (the same one that
 * holds the Nodes / Deployments / Pods / Events tabs). It creates or refreshes a
 * "Dashboard" tab with summary cells (counts) and two embedded charts:
 *   - a column chart of replicas per deployment (from the Deployments tab)
 *   - a pie chart of pod phases (from the Pods tab)
 *
 * This is the "beautiful UI in Google Sheets" — Sheetfana's native panel.
 *
 * Optional: run installDashboardMenu() once (or add it to onOpen) to get a
 * "Sheetfana" menu with a "Refresh dashboard" item.
 */

var DASH_SHEET = 'Dashboard';

/** Read a tab into an array of objects keyed by its header row. */
function sf_readTab_(name) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) return [];
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var header = values.shift();
  return values
    .filter(function (r) { return String(r[0]).trim() !== ''; })
    .map(function (row) {
      var o = {};
      header.forEach(function (h, i) { o[h] = row[i]; });
      return o;
    });
}

/** Main entry point: build/refresh the Dashboard tab. */
function buildDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1) Pull live data from the control-plane tabs.
  var nodes = sf_readTab_('Nodes');
  var deployments = sf_readTab_('Deployments');
  var pods = sf_readTab_('Pods');

  var readyNodes = nodes.filter(function (n) { return String(n.status) === 'Ready'; }).length;

  // Replicas per deployment.
  var depRows = deployments.map(function (d) {
    return [String(d.name), Number(d.replicas) || 0];
  });
  if (!depRows.length) depRows = [['(none)', 0]];

  // Pod phase counts.
  var phaseCounts = {};
  pods.forEach(function (p) {
    var ph = String(p.phase || 'Unknown');
    phaseCounts[ph] = (phaseCounts[ph] || 0) + 1;
  });
  var phaseRows = Object.keys(phaseCounts).map(function (k) { return [k, phaseCounts[k]]; });
  if (!phaseRows.length) phaseRows = [['(none)', 0]];

  // 2) Get or create the Dashboard sheet; wipe it clean each refresh.
  var sh = ss.getSheetByName(DASH_SHEET);
  if (!sh) {
    sh = ss.insertSheet(DASH_SHEET);
  } else {
    sh.clear();
    sh.getCharts().forEach(function (c) { sh.removeChart(c); });
  }
  sh.setHiddenGridlines(true);

  // 3) Title + summary stat cells.
  sh.getRange('B2').setValue('SHEETFANA — Sheeternetes Dashboard')
    .setFontSize(16).setFontWeight('bold');
  sh.getRange('B3').setValue('Refreshed: ' + new Date().toISOString())
    .setFontColor('#898781').setFontSize(9);

  var stats = [
    ['Nodes', nodes.length],
    ['Ready nodes', readyNodes],
    ['Deployments', deployments.length],
    ['Pods', pods.length]
  ];
  // Lay the four tiles across row 5 (label) / row 6 (value): B, D, F, H.
  var cols = ['B', 'D', 'F', 'H'];
  stats.forEach(function (s, i) {
    var c = cols[i];
    sh.getRange(c + '5').setValue(s[0])
      .setFontColor('#898781').setFontSize(10).setFontWeight('bold');
    sh.getRange(c + '6').setValue(s[1])
      .setFontSize(26).setFontWeight('bold');
  });

  // 4) Helper data tables (used as chart source ranges) lower on the sheet.
  var depStart = 9;
  sh.getRange(depStart, 2).setValue('Deployment').setFontWeight('bold');
  sh.getRange(depStart, 3).setValue('Replicas').setFontWeight('bold');
  sh.getRange(depStart + 1, 2, depRows.length, 2).setValues(depRows);
  var depRange = sh.getRange(depStart, 2, depRows.length + 1, 2);

  var phaseStart = depStart + depRows.length + 3;
  sh.getRange(phaseStart, 2).setValue('Phase').setFontWeight('bold');
  sh.getRange(phaseStart, 3).setValue('Count').setFontWeight('bold');
  sh.getRange(phaseStart + 1, 2, phaseRows.length, 2).setValues(phaseRows);
  var phaseRange = sh.getRange(phaseStart, 2, phaseRows.length + 1, 2);

  // 5) Embedded charts.
  var colChart = sh.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(depRange)
    .setNumHeaders(1)
    .setPosition(8, 5, 0, 0)   // anchor near row 8, column E
    .setOption('title', 'Replicas per deployment')
    .setOption('legend', { position: 'none' })
    .setOption('colors', ['#3987e5'])
    .setOption('width', 520)
    .setOption('height', 300)
    .build();
  sh.insertChart(colChart);

  var pieChart = sh.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(phaseRange)
    .setNumHeaders(1)
    .setPosition(phaseStart, 5, 0, 0)
    .setOption('title', 'Pod phases')
    .setOption('colors', ['#0ca30c', '#3987e5', '#fab219', '#ec835a', '#d03b3b', '#6b6a64'])
    .setOption('pieHole', 0.35)
    .setOption('width', 520)
    .setOption('height', 300)
    .build();
  sh.insertChart(pieChart);

  // Widen the label column a touch for readability.
  sh.setColumnWidth(2, 160);

  SpreadsheetApp.getActiveSpreadsheet().toast('Dashboard refreshed', 'Sheetfana', 3);
  return sh;
}

/** Add a "Sheetfana" menu (call from onOpen, or run once manually). */
function installDashboardMenu() {
  SpreadsheetApp.getUi()
    .createMenu('Sheetfana')
    .addItem('Refresh dashboard', 'buildDashboard')
    .addToUi();
}
