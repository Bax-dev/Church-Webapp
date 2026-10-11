/** Member exports (PRD A-08): CSV, Excel and PDF of the currently filtered list. */
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'

import { SITE } from '@/config/site'
import { formatDate, lookupName, maritalStatusLabels, statusLabels, type Lookup, type Member } from '@/config/portal'

const columns = [
  ['First name', 18], ['Last name', 18], ['Email', 30], ['Phone', 18], ['Date of birth', 14], ['Marital status', 14],
  ['Address', 30], ['City', 16], ['State', 12], ['Department', 20], ['District', 18], ['Status', 10], ['Joined', 12],
] as const

function rows(members: Member[], departments: Lookup[], districts: Lookup[]) {
  return members.map((m) => [
    m.firstName, m.lastName, m.email, m.phone ?? '', m.dateOfBirth ?? '', m.maritalStatus ? maritalStatusLabels[m.maritalStatus] : '',
    m.addressLine ?? '', m.city ?? '', m.state ?? '', m.departmentId ? lookupName(departments, m.departmentId) : '',
    m.districtId ? lookupName(districts, m.districtId) : '', statusLabels[m.status], m.createdAt.slice(0, 10),
  ])
}

export function toCsv(members: Member[], departments: Lookup[], districts: Lookup[]) {
  // A leading = + - @ would be run as a formula by spreadsheet apps, so such cells are prefixed with a quote.
  const cell = (value: string) => {
    const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
  }
  const lines = [columns.map(([name]) => name), ...rows(members, departments, districts)].map((row) => row.map(cell).join(','))
  // The byte-order mark makes Excel read the file as UTF-8, so names with accents survive.
  return `﻿${lines.join('\r\n')}\r\n`
}

export async function toXlsx(members: Member[], departments: Lookup[], districts: Lookup[]) {
  const book = new ExcelJS.Workbook()
  book.creator = SITE.name
  const sheet = book.addWorksheet('Members', { views: [{ state: 'frozen', ySplit: 1 }] })
  sheet.columns = columns.map(([header, width]) => ({ header, width }))
  sheet.getRow(1).font = { bold: true }
  sheet.addRows(rows(members, departments, districts))
  sheet.autoFilter = { from: 'A1', to: { row: 1, column: columns.length } }
  return Buffer.from(await book.xlsx.writeBuffer())
}

export function toPdf(members: Member[], departments: Lookup[], districts: Lookup[], filterText: string) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 })
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.font('Helvetica-Bold').fontSize(15).text(`${SITE.name} — member list`)
    doc.font('Helvetica').fontSize(9).fillColor('#555')
      .text(`${members.length} ${members.length === 1 ? 'member' : 'members'} · ${filterText} · exported ${formatDate(new Date().toISOString())}`)
    doc.moveDown(0.8).fillColor('#000')

    const cols = [
      { title: 'Name', width: 140, get: (m: Member) => `${m.lastName}, ${m.firstName}` },
      { title: 'Email', width: 170, get: (m: Member) => m.email },
      { title: 'Phone', width: 95, get: (m: Member) => m.phone ?? '' },
      { title: 'Birthday', width: 55, get: (m: Member) => (m.dateOfBirth ? formatDate(m.dateOfBirth, false) : '') },
      { title: 'Department', width: 105, get: (m: Member) => (m.departmentId ? lookupName(departments, m.departmentId) : '') },
      { title: 'District', width: 95, get: (m: Member) => (m.districtId ? lookupName(districts, m.districtId) : '') },
      { title: 'Status', width: 50, get: (m: Member) => statusLabels[m.status] },
    ]
    const left = doc.page.margins.left
    const drawRow = (cells: string[], bold = false) => {
      if (doc.y > doc.page.height - doc.page.margins.bottom - 20) doc.addPage()
      const y = doc.y
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5)
      let x = left
      cells.forEach((text, i) => {
        doc.text(text, x, y, { width: cols[i].width - 6, ellipsis: true, lineBreak: false })
        x += cols[i].width
      })
      doc.moveTo(left, y + 13).lineTo(x, y + 13).strokeColor('#ddd').lineWidth(0.5).stroke()
      doc.x = left
      doc.y = y + 17
    }
    drawRow(cols.map((c) => c.title), true)
    members.forEach((m) => drawRow(cols.map((c) => c.get(m))))
    doc.end()
  })
}
