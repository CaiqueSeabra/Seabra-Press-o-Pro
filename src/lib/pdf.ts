import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Measurement } from '../types';
import { classifyBloodPressure } from './bloodPressure';

interface ReportData {
  patientName: string;
  patientAge: string;
  doctorName: string;
  hospitalName: string;
  measurements: Measurement[];
}

export const createPDFDocument = (data: ReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // --- Background & Borders ---
  // Subtle light gray background for the whole page
  doc.setFillColor(252, 252, 252);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Elegant side accent line
  doc.setFillColor(24, 24, 27); // Zinc-900
  doc.rect(0, 0, 5, pageHeight, 'F');

  // --- Header Section ---
  // Dark header block
  doc.setFillColor(24, 24, 27);
  doc.rect(5, 0, pageWidth - 5, 50, 'F');
  
  // Logo/App Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('SEABRA PRESSÃO PRO', 20, 28);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(161, 161, 170); // Zinc-400
  doc.text('SISTEMA INTELIGENTE DE MONITORAMENTO CARDIOVASCULAR', 20, 36);

  // Report Date Badge (Right Aligned)
  doc.setFillColor(39, 39, 42); // Zinc-800
  doc.roundedRect(pageWidth - 75, 18, 55, 15, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DATA DO RELATÓRIO', pageWidth - 70, 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(format(new Date(), "dd/MM/yyyy", { locale: ptBR }), pageWidth - 70, 30);

  // --- Patient & Clinic Info Grid ---
  let currentY = 70;
  
  // Section Title
  doc.setTextColor(24, 24, 27);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS CLÍNICOS E IDENTIFICAÇÃO', 20, currentY);
  
  doc.setDrawColor(228, 228, 231); // Zinc-200
  doc.setLineWidth(0.5);
  doc.line(20, currentY + 3, pageWidth - 20, currentY + 3);
  
  currentY += 15;

  // Info Grid Layout
  const drawInfoBox = (label: string, value: string, x: number, y: number, width: number) => {
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122); // Zinc-500
    doc.setFont('helvetica', 'bold');
    doc.text(label.toUpperCase(), x, y);
    
    doc.setFontSize(11);
    doc.setTextColor(24, 24, 27); // Zinc-900
    doc.setFont('helvetica', 'normal');
    doc.text(value || '---', x, y + 6);
  };

  drawInfoBox('Paciente', data.patientName, 20, currentY, 80);
  drawInfoBox('Idade', `${data.patientAge} anos`, 110, currentY, 40);
  
  currentY += 18;
  drawInfoBox('Médico Responsável', data.doctorName, 20, currentY, 80);
  drawInfoBox('Instituição / Hospital', data.hospitalName, 110, currentY, 80);

  currentY += 25;

  // --- Measurements Table ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 24, 27);
  doc.text('HISTÓRICO DE AFERIÇÕES', 20, currentY);
  
  const tableData = data.measurements.map(m => {
    const classification = classifyBloodPressure(m.systolic, m.diastolic);
    const periodLabel = m.period === 'morning' ? 'Manhã' : m.period === 'afternoon' ? 'Tarde' : 'Noite';
    return [
      format(m.timestamp, 'dd/MM/yyyy', { locale: ptBR }),
      format(m.timestamp, 'HH:mm', { locale: ptBR }),
      periodLabel,
      `${m.systolic} / ${m.diastolic}`,
      m.pulse ? `${m.pulse} bpm` : '-',
      `${classification.label}\n(${classification.status})`
    ];
  });

  autoTable(doc, {
    startY: currentY + 5,
    head: [['DATA', 'HORA', 'PERÍODO', 'PRESSÃO (mmHg)', 'PULSO', 'CLASSIFICAÇÃO / STATUS']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      cellPadding: 4
    },
    bodyStyles: {
      fontSize: 9,
      halign: 'center',
      valign: 'middle',
      textColor: [63, 63, 70], // Zinc-700
      cellPadding: 4
    },
    columnStyles: {
      3: { fontStyle: 'bold', textColor: [24, 24, 27] },
      5: { fontSize: 8 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 20, right: 20 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const value = data.cell.raw as string;
        if (value.includes('Emergência') || value.includes('Grave') || value.includes('Moderada')) {
          data.cell.styles.textColor = [185, 28, 28]; // red-700
          data.cell.styles.fontStyle = 'bold';
        } else if (value.includes('Alerta') || value.includes('Hipertensão')) {
          data.cell.styles.textColor = [161, 98, 7]; // yellow-700
        } else if (value.includes('Saudável')) {
          data.cell.styles.textColor = [21, 128, 61]; // green-700
        }
      }
    }
  });

  // --- Summary & Footer ---
  const finalY = (doc as any).lastAutoTable.finalY || 200;
  
  // Professional Signature Line
  if (finalY < pageHeight - 60) {
    doc.setDrawColor(212, 212, 216); // Zinc-300
    doc.line(pageWidth / 2 - 40, pageHeight - 45, pageWidth / 2 + 40, pageHeight - 45);
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122);
    doc.text('Assinatura / Carimbo do Profissional', pageWidth / 2, pageHeight - 40, { align: 'center' });
  }

  // Final Disclaimer
  doc.setFillColor(244, 244, 245); // Zinc-100
  doc.rect(5, pageHeight - 25, pageWidth - 5, 25, 'F');
  
  doc.setFontSize(7);
  doc.setTextColor(161, 161, 170);
  const footerText = 'Este documento é um relatório técnico gerado pelo sistema Seabra Pressão Pro. Os dados aqui contidos devem ser interpretados exclusivamente por um profissional de saúde qualificado. Este relatório não constitui diagnóstico médico isolado.';
  doc.text(footerText, pageWidth / 2, pageHeight - 12, { align: 'center', maxWidth: pageWidth - 40 });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(113, 113, 122);
  doc.text(`Página 1 de 1`, pageWidth - 25, pageHeight - 12, { align: 'right' });

  return doc;
};

export const generateProfessionalPDF = (data: ReportData) => {
  const doc = createPDFDocument(data);
  doc.save(`Relatorio_Pressao_${data.patientName.replace(/\s+/g, '_')}_${format(new Date(), 'ddMMyyyy')}.pdf`);
};

export const shareProfessionalPDF = async (data: ReportData) => {
  const doc = createPDFDocument(data);
  const filename = `Relatorio_Pressao_${data.patientName.replace(/\s+/g, '_')}_${format(new Date(), 'ddMMyyyy')}.pdf`;
  
  try {
    const blob = doc.output('blob');
    const file = new File([blob], filename, { type: 'application/pdf' });
    
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Relatório de Pressão Arterial',
        text: `Segue o relatório detalhado de pressão arterial de ${data.patientName}.`,
      });
    } else {
      doc.save(filename);
    }
  } catch (error) {
    console.error('Error sharing PDF:', error);
    doc.save(filename);
  }
};


