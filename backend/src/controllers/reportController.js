import { Op } from 'sequelize';
import dayjs from 'dayjs';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Transaction, Account, Category } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { toNumber } from '../services/financeService.js';

const groupByMonth = (txs) => {
  const map = {};
  txs.forEach(t => {
    const m = String(t.transactionDate).slice(0, 7);
    if (!map[m]) map[m] = { month: m, income: 0, expense: 0 };
    if (['Income', 'TransferIn'].includes(t.type)) map[m].income += toNumber(t.amount);
    else if (['Expense', 'TransferOut'].includes(t.type)) map[m].expense += toNumber(t.amount);
  });
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
};

export const monthlyReport = asyncHandler(async (req, res) => {
  const month = req.query.month || dayjs().format('YYYY-MM');
  const from = `${month}-01`;
  const to = `${month}-31`;
  const txs = await Transaction.findAll({ where: { userId: req.user.id, status: 'Posted', transactionDate: { [Op.between]: [from, to] } }, include: [{ model: Account, attributes: ['bankName'] }, { model: Category, attributes: ['name'] }], order: [['transactionDate', 'ASC']] });
  const income = txs.filter(t => t.type === 'Income').reduce((s, t) => s + toNumber(t.amount), 0);
  const expense = txs.filter(t => t.type === 'Expense').reduce((s, t) => s + toNumber(t.amount), 0);
  sendSuccess(res, 200, `Monthly report for ${month}`, { month, income, expense, savings: income - expense, transactions: txs });
});

export const yearlyReport = asyncHandler(async (req, res) => {
  const year = req.query.year || String(dayjs().year());
  const txs = await Transaction.findAll({ where: { userId: req.user.id, status: 'Posted', transactionDate: { [Op.between]: [`${year}-01-01`, `${year}-12-31`] } }, raw: true });
  sendSuccess(res, 200, `Yearly report for ${year}`, groupByMonth(txs));
});

export const bankWiseReport = asyncHandler(async (req, res) => {
  const accounts = await Account.findAll({ where: { userId: req.user.id } });
  const out = [];
  for (const a of accounts) {
    const txs = await Transaction.findAll({ where: { accountId: a.id, status: 'Posted' }, raw: true });
    out.push({ bankName: a.bankName, accountId: a.id, count: txs.length, income: txs.filter(t => t.type === 'Income').reduce((s, t) => s + toNumber(t.amount), 0), expense: txs.filter(t => t.type === 'Expense').reduce((s, t) => s + toNumber(t.amount), 0) });
  }
  sendSuccess(res, 200, 'Bank-wise report', out);
});

export const categoryWiseReport = asyncHandler(async (req, res) => {
  const { sequelize } = await import('../config/database.js');
  const rows = await sequelize.query(`SELECT c.name category, c.type, SUM(t.amount) total FROM Transactions t JOIN Categories c ON t.categoryId=c.id WHERE t.userId=? AND t.status='Posted' GROUP BY c.id ORDER BY total DESC`, { replacements: [req.user.id], type: sequelize.QueryTypes.SELECT });
  sendSuccess(res, 200, 'Category-wise report', rows.map(r => ({ ...r, total: Number(r.total) })));
});

export const exportPdf = asyncHandler(async (req, res) => {
  const txs = await Transaction.findAll({ where: { userId: req.user.id, status: 'Posted' }, include: [Account], order: [['transactionDate', 'ASC']], limit: 500 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=moneyflow-report.pdf');
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);
  doc.fontSize(20).text('MoneyFlow Report', { underline: true });
  doc.fontSize(10).text(`Generated ${new Date().toLocaleString()}`);
  doc.moveDown();
  txs.slice(0, 200).forEach(t => { doc.fontSize(9).text(`${String(t.transactionDate).slice(0, 10)} | ${t.Account?.bankName || ''} | ${t.type} | ₹${t.amount} | ${t.description || ''}`); });
  doc.end();
});

export const exportExcel = asyncHandler(async (req, res) => {
  const txs = await Transaction.findAll({ where: { userId: req.user.id, status: 'Posted' }, include: [Account, Category], order: [['transactionDate', 'ASC']] });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Transactions');
  ws.columns = [{ header: 'Date', key: 'date' }, { header: 'Bank', key: 'bank' }, { header: 'Category', key: 'cat' }, { header: 'Type', key: 'type' }, { header: 'Amount', key: 'amt' }, { header: 'Description', key: 'desc' }];
  txs.forEach(t => ws.addRow({ date: String(t.transactionDate).slice(0, 10), bank: t.Account?.bankName, cat: t.Category?.name, type: t.type, amt: Number(t.amount), desc: t.description }));
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=moneyflow-report.xlsx');
  await wb.xlsx.write(res);
  res.end();
});
