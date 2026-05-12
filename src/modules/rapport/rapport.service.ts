import { Injectable } from '@nestjs/common';
import { BulletinService } from '../bulletin/bulletin.service';
import * as ExcelJS from 'exceljs';
import * as express from 'express';

@Injectable()
export class RapportService {
  constructor(private readonly bulletinService: BulletinService) {}

  async exportMasseSalariale(res: express.Response, periodeUuid?: string) {
    const bulletins = periodeUuid
      ? await this.bulletinService.findByPeriode(periodeUuid)
      : await this.bulletinService.findAll();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Masse Salariale');

    // Headers
    worksheet.columns = [
      { header: 'Matricule', key: 'matricule', width: 15 },
      { header: 'Nom', key: 'nom', width: 20 },
      { header: 'Prénom', key: 'prenom', width: 20 },
      { header: 'Période', key: 'periode', width: 15 },
      { header: 'Salaire Brut', key: 'brut', width: 15 },
      { header: 'Cotisations Salariales', key: 'retenues', width: 20 },
      { header: 'Salaire Net', key: 'net', width: 15 },
      { header: 'Charges Patronales', key: 'patronal', width: 20 },
      { header: 'Coût Total', key: 'total', width: 15 },
    ];

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    // Data
    bulletins.forEach((b) => {
      worksheet.addRow({
        matricule: b.employe?.matriculeInterne || '-',
        nom: b.employe?.nom || '-',
        prenom: b.employe?.prenom || '-',
        periode: b.periode ? `${b.periode.mois}/${b.periode.annee}` : '-',
        brut: Number(b.salaireBrut || 0),
        retenues: Number(b.totalRetenues || 0),
        net: Number(b.netAPayer || 0),
        patronal: Number(b.totalCotisationsPatronales || 0),
        total:
          Number(b.salaireBrut || 0) +
          Number(b.totalCotisationsPatronales || 0),
      });
    });

    // Formatting numbers
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        [5, 6, 7, 8, 9].forEach((col) => {
          row.getCell(col).numFmt = '#,##0.00 "Ar"';
        });
      }
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'rapport_paie.xlsx',
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
