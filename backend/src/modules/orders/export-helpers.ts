// src/modules/orders/export-helpers.ts
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

// Linha achatada de pedido para exportação (ver orders.service.getExportData).
export interface OrderExportRow {
  numero: string;
  status: string;
  cliente: string;
  email: string;
  telefone: string;
  subtotal: number;
  frete: number;
  total: number;
  criado_em: string;
  pago_em: string;
  enviado_em: string;
}

const brl = (v: number): string =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function generatePdf(data: OrderExportRow[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30 });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(16).text('Relatório de Pedidos — Luana Rohr Art', { align: 'center' });
    doc.moveDown();

    const totalFaturado = data.reduce((sum, r) => sum + r.total, 0);
    doc
      .fontSize(10)
      .text(`Total de pedidos: ${data.length}  -  Faturamento: ${brl(totalFaturado)}`);
    doc.moveDown();

    data.forEach((row) => {
      doc.fontSize(11).text(`Pedido ${row.numero} — ${row.status}`);
      doc
        .fontSize(9)
        .text(
          `Cliente: ${row.cliente} (${row.email})  -  Total: ${brl(row.total)}  -  Criado: ${row.criado_em}`
        );
      doc.moveDown(0.5);
    });

    doc.end();
  });
}

export async function generateXlsx(data: OrderExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Pedidos');

  sheet.columns = [
    { header: 'Número', key: 'numero', width: 22 },
    { header: 'Status', key: 'status', width: 20 },
    { header: 'Cliente', key: 'cliente', width: 28 },
    { header: 'E-mail', key: 'email', width: 28 },
    { header: 'Telefone', key: 'telefone', width: 16 },
    { header: 'Subtotal', key: 'subtotal', width: 14 },
    { header: 'Frete', key: 'frete', width: 12 },
    { header: 'Total', key: 'total', width: 14 },
    { header: 'Criado em', key: 'criado_em', width: 24 },
    { header: 'Pago em', key: 'pago_em', width: 24 },
    { header: 'Enviado em', key: 'enviado_em', width: 24 },
  ];

  data.forEach((row) => sheet.addRow(row));

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
}
