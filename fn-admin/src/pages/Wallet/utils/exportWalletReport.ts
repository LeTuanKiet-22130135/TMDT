import ExcelJS from 'exceljs';

export interface WalletStats {
  totalTopup: number;
  totalPayment: number;
  totalRefund: number;
  totalWithdrawal: number;
  totalInflow: number;
  totalOutflow: number;
  totalTurnover: number;
}

export interface WalletTxItem {
  id: string;
  walletId: string;
  transactionType: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  referenceId: string | null;
  createdAt: string;
  userEmail: string | null;
}

export interface WithdrawalItem {
  id: string;
  amount: number;
  referenceId: string | null;
  status: string;
  createdAt: string;
}

const TX_LABEL: Record<string, string> = {
  TOPUP: 'Nạp tiền', PAYMENT: 'Giao dịch mua', REFUND: 'Hoàn tiền', WITHDRAWAL: 'Rút tiền',
};
const STATUS_LABEL: Record<string, string> = {
  SUCCESS: 'Thành công', PENDING: 'Đang xử lý', FAILED: 'Thất bại', CANCELLED: 'Đã huỷ',
};

function fmtDate(s: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(s));
}

function maskEmail(email: string | null): string {
  if (!email) return '-';
  const [local, domain] = email.split('@');
  if (!domain) return local.slice(0, 2) + '***';
  return local.slice(0, 2) + '***@' + domain;
}

// ─── shared border style ──────────────────────────────────────────────────────
const THIN: ExcelJS.Border = { style: 'thin', color: { argb: 'FF000000' } };
const BORDERS: Partial<ExcelJS.Borders> = { top: THIN, left: THIN, bottom: THIN, right: THIN };
const MEDIUM: ExcelJS.Border = { style: 'medium', color: { argb: 'FF000000' } };
const MEDIUM_BORDERS: Partial<ExcelJS.Borders> = { top: MEDIUM, left: MEDIUM, bottom: MEDIUM, right: MEDIUM };

function setCell(
  ws: ExcelJS.Worksheet,
  address: string,
  value: ExcelJS.CellValue,
  opts: { bold?: boolean; size?: number; italic?: boolean; align?: ExcelJS.Alignment['horizontal']; border?: 'thin' | 'medium' | 'none'; wrapText?: boolean } = {}
) {
  const c = ws.getCell(address);
  c.value = value;
  c.font = { name: 'Calibri', bold: opts.bold ?? false, italic: opts.italic ?? false, size: opts.size ?? 11 };
  c.alignment = { horizontal: opts.align ?? 'left', vertical: 'middle', wrapText: opts.wrapText ?? false };
  if (opts.border === 'medium') c.border = MEDIUM_BORDERS;
  else if (opts.border !== 'none') c.border = BORDERS;
}

function mergeTitle(ws: ExcelJS.Worksheet, row: number, range: string, text: string, size = 14) {
  ws.mergeCells(range);
  const addr = range.split(':')[0];
  setCell(ws, addr, text, { bold: true, size, align: 'center', border: 'none' });
  ws.getRow(row).height = size === 14 ? 36 : 24;
}

function sectionHeader(ws: ExcelJS.Worksheet, row: number, startCol: string, endCol: string, text: string) {
  ws.mergeCells(`${startCol}${row}:${endCol}${row}`);
  setCell(ws, `${startCol}${row}`, text, { bold: true, size: 11, align: 'center', border: 'medium' });
  ws.getRow(row).height = 26;
}

function tableHeader(ws: ExcelJS.Worksheet, row: number, cols: string[], labels: string[]) {
  ws.getRow(row).height = 24;
  cols.forEach((col, i) => {
    setCell(ws, `${col}${row}`, labels[i], { bold: true, size: 10, align: 'center', border: 'medium' });
  });
}

// ─── Sheet 1: Tổng quan ───────────────────────────────────────────────────────
function buildOverviewSheet(wb: ExcelJS.Workbook, stats: WalletStats) {
  const ws = wb.addWorksheet('Tổng quan Tài chính');
  ws.columns = [
    { width: 4 },
    { width: 38 },
    { width: 26 },
    { width: 4 },
  ];

  mergeTitle(ws, 1, 'A1:D1', 'LUMINE – BÁO CÁO TÀI CHÍNH VÍ ĐIỆN TỬ', 16);
  mergeTitle(ws, 2, 'A2:D2', `Ngày xuất: ${fmtDate(new Date().toISOString())}`, 10);
  ws.getRow(3).height = 10;

  sectionHeader(ws, 4, 'A', 'D', 'CHI TIẾT TỪNG LOẠI GIAO DỊCH  (chỉ tính Thành công)');
  tableHeader(ws, 5, ['B', 'C'], ['Loại giao dịch', 'Giá trị (VND)']);

  const details: [string, number][] = [
    ['Nạp tiền (TOPUP)',          stats.totalTopup],
    ['Giao dịch mua (PAYMENT)',   stats.totalPayment],
    ['Hoàn tiền (REFUND)',        stats.totalRefund],
    ['Rút tiền (WITHDRAWAL)',     stats.totalWithdrawal],
  ];

  details.forEach(([label, value], i) => {
    const r = 6 + i;
    ws.getRow(r).height = 22;
    setCell(ws, `B${r}`, label, { border: 'thin' });
    const cv = ws.getCell(`C${r}`);
    cv.value = value;
    cv.numFmt = '#,##0 "₫"';
    cv.font = { name: 'Calibri', bold: true, size: 11 };
    cv.alignment = { horizontal: 'right', vertical: 'middle' };
    cv.border = BORDERS;
  });

  ws.getRow(10).height = 12;
  sectionHeader(ws, 11, 'A', 'D', 'CHỈ SỐ TỔNG HỢP');
  tableHeader(ws, 12, ['B', 'C'], ['Chỉ số', 'Giá trị (VND)']);

  const summary: [string, number][] = [
    ['↑  ĐẦU VÀO  (Nạp + Hoàn)',      stats.totalInflow],
    ['↓  ĐẦU RA   (Mua + Rút)',        stats.totalOutflow],
    ['⟳  VÒNG XOAY  (Tổng lưu thông)', stats.totalTurnover],
  ];

  summary.forEach(([label, value], i) => {
    const r = 13 + i;
    ws.getRow(r).height = 26;
    setCell(ws, `B${r}`, label, { bold: true, size: 11, border: 'medium' });
    const cv = ws.getCell(`C${r}`);
    cv.value = value;
    cv.numFmt = '#,##0 "₫"';
    cv.font = { name: 'Calibri', bold: true, size: 12 };
    cv.alignment = { horizontal: 'right', vertical: 'middle' };
    cv.border = MEDIUM_BORDERS;
  });

  ws.getRow(16).height = 12;
  mergeTitle(ws, 17, 'A17:D17', '* Số liệu chỉ bao gồm giao dịch có trạng thái Thành công (SUCCESS).', 9);
}

// ─── Sheet 2: Tất cả giao dịch ────────────────────────────────────────────────
function buildTransactionsSheet(wb: ExcelJS.Workbook, items: WalletTxItem[]) {
  const ws = wb.addWorksheet('Chi tiết Giao dịch');
  ws.columns = [
    { width: 38 },
    { width: 24 },
    { width: 20 },
    { width: 20 },
    { width: 16 },
    { width: 22 },
  ];

  mergeTitle(ws, 1, 'A1:F1', 'CHI TIẾT GIAO DỊCH VÍ ĐIỆN TỬ', 14);
  mergeTitle(ws, 2, 'A2:F2', `Xuất ngày ${fmtDate(new Date().toISOString())}   |   Tổng ${items.length} giao dịch`, 10);
  ws.getRow(3).height = 8;

  tableHeader(ws, 4, ['A','B','C','D','E','F'],
    ['Mã giao dịch', 'Người dùng', 'Loại giao dịch', 'Số tiền (VND)', 'Trạng thái', 'Thời gian']);

  items.forEach((tx, i) => {
    const r = 5 + i;
    ws.getRow(r).height = 20;

    setCell(ws, `A${r}`, tx.id, { size: 9, border: 'thin' });
    setCell(ws, `B${r}`, maskEmail(tx.userEmail), { size: 10, border: 'thin' });
    setCell(ws, `C${r}`, TX_LABEL[tx.transactionType] ?? tx.transactionType, { align: 'center', border: 'thin' });

    const dc = ws.getCell(`D${r}`);
    dc.value = tx.amount;
    dc.numFmt = '#,##0 "₫"';
    dc.font = { name: 'Calibri', bold: true, size: 11 };
    dc.alignment = { horizontal: 'right', vertical: 'middle' };
    dc.border = BORDERS;

    setCell(ws, `E${r}`, STATUS_LABEL[tx.status] ?? tx.status, { align: 'center', border: 'thin' });
    setCell(ws, `F${r}`, fmtDate(tx.createdAt), { size: 10, border: 'thin' });
  });

  // totals row
  const totalRow = 5 + items.length;
  ws.getRow(totalRow).height = 26;
  ws.mergeCells(`A${totalRow}:C${totalRow}`);
  setCell(ws, `A${totalRow}`, 'TỔNG CỘNG', { bold: true, size: 12, align: 'right', border: 'medium' });

  const sumCell = ws.getCell(`D${totalRow}`);
  sumCell.value = items.length > 0 ? { formula: `SUM(D5:D${totalRow - 1})` } : 0;
  sumCell.numFmt = '#,##0 "₫"';
  sumCell.font = { name: 'Calibri', bold: true, size: 12 };
  sumCell.alignment = { horizontal: 'right', vertical: 'middle' };
  sumCell.border = MEDIUM_BORDERS;

  ws.mergeCells(`E${totalRow}:F${totalRow}`);
  setCell(ws, `E${totalRow}`, '', { border: 'medium' });
}

// ─── Sheet 3: Rút tiền ────────────────────────────────────────────────────────
function buildWithdrawalsSheet(wb: ExcelJS.Workbook, items: WithdrawalItem[]) {
  const ws = wb.addWorksheet('Yêu cầu Rút tiền');
  ws.columns = [
    { width: 38 },
    { width: 22 },
    { width: 42 },
    { width: 16 },
    { width: 22 },
  ];

  mergeTitle(ws, 1, 'A1:E1', 'YÊU CẦU RÚT TIỀN', 14);
  mergeTitle(ws, 2, 'A2:E2', `Xuất ngày ${fmtDate(new Date().toISOString())}   |   Tổng ${items.length} yêu cầu`, 10);
  ws.getRow(3).height = 8;

  tableHeader(ws, 4, ['A','B','C','D','E'],
    ['Mã giao dịch', 'Số tiền (VND)', 'Thông tin nhận (Bank)', 'Trạng thái', 'Thời gian tạo']);

  items.forEach((item, i) => {
    const r = 5 + i;
    ws.getRow(r).height = 20;

    setCell(ws, `A${r}`, item.id, { size: 9, border: 'thin' });

    const dc = ws.getCell(`B${r}`);
    dc.value = item.amount;
    dc.numFmt = '#,##0 "₫"';
    dc.font = { name: 'Calibri', bold: true, size: 11 };
    dc.alignment = { horizontal: 'right', vertical: 'middle' };
    dc.border = BORDERS;

    setCell(ws, `C${r}`, item.referenceId ?? '-', { size: 9, wrapText: true, border: 'thin' });
    setCell(ws, `D${r}`, STATUS_LABEL[item.status] ?? item.status, { align: 'center', border: 'thin' });
    setCell(ws, `E${r}`, fmtDate(item.createdAt), { size: 10, border: 'thin' });
  });

  // pending summary
  const pending = items.filter(x => x.status === 'PENDING');
  if (pending.length > 0) {
    const sumRow = 5 + items.length + 1;
    const pendingSum = pending.reduce((s, x) => s + x.amount, 0);
    ws.getRow(sumRow).height = 24;
    setCell(ws, `A${sumRow}`, 'Chờ xử lý:', { bold: true, border: 'medium' });
    const sc = ws.getCell(`B${sumRow}`);
    sc.value = pendingSum;
    sc.numFmt = '#,##0 "₫"';
    sc.font = { name: 'Calibri', bold: true, size: 12 };
    sc.alignment = { horizontal: 'right', vertical: 'middle' };
    sc.border = MEDIUM_BORDERS;
    ws.mergeCells(`C${sumRow}:E${sumRow}`);
    setCell(ws, `C${sumRow}`, `${pending.length} yêu cầu đang chờ duyệt`, { italic: true, border: 'thin' });
  }
}

// ─── main export ──────────────────────────────────────────────────────────────
export async function exportWalletReport(
  stats: WalletStats,
  transactions: WalletTxItem[],
  withdrawals: WithdrawalItem[],
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Lumine Admin';
  wb.created = new Date();

  buildOverviewSheet(wb, stats);
  buildTransactionsSheet(wb, transactions);
  buildWithdrawalsSheet(wb, withdrawals);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lumine-financial-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
