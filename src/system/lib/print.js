// Open a clean print window containing the given HTML and trigger the browser's
// print dialog. The user can "Save as PDF" from there - no extra library needed.
export function printHtml(title, bodyHtml) {
  const win = window.open('', '_blank', 'width=800,height=900')
  if (!win) return
  win.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Poppins', Arial, sans-serif; color: #2b2018; margin: 0; padding: 32px; }
    .brand { display:flex; align-items:center; gap:10px; margin-bottom: 4px; }
    .brand h1 { font-size: 22px; margin: 0; color:#6f4a29; }
    .brand .gold { color:#c9a24b; }
    .muted { color:#7a6a5a; font-size: 12px; }
    .box { border:1px solid #e5ddd0; border-radius:10px; padding:16px; margin-top:16px; }
    .row { display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap; }
    table { width:100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th, td { text-align:left; padding:8px 6px; border-bottom:1px solid #eee; }
    th { color:#7a6a5a; font-weight:600; }
    td.num, th.num { text-align:right; }
    .total { font-size: 18px; font-weight: 700; color:#6f4a29; }
    .footer { margin-top: 28px; font-size: 11px; color:#9a8a7a; }
    @media print { body { padding: 0; } .noprint { display:none; } }
  </style>
</head>
<body>${bodyHtml}
  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`)
  win.document.close()
}

export function formatMoney(n) {
  return `RM ${Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
