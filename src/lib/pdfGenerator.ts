import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Measurement } from '../types';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { classifyBloodPressure, analyzeRisk } from './bloodPressure';

export function generatePDFDocument(measurements: Measurement[], userName: string = 'Paciente') {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Relatório de Pressão Arterial (MAPA)', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`Paciente: ${userName}`, 14, 30);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, 14, 36);
  
  let currentY = 46;

  // Status and Risk Analysis
  const riskAlert = analyzeRisk(measurements);
  if (riskAlert) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    if (riskAlert.level === 'critical') doc.setTextColor(220, 53, 69);
    else if (riskAlert.level === 'danger') doc.setTextColor(253, 126, 20);
    else doc.setTextColor(255, 193, 7);
    
    doc.text(`Status Atual: ${riskAlert.title}`, 14, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(riskAlert.message, 14, currentY + 6, { maxWidth: 180 });
    currentY += 16;
  } else {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 167, 69);
    doc.text(`Status Atual: Normal`, 14, currentY);
    doc.setFont("helvetica", "normal");
    currentY += 10;
  }

  // Calculate averages
  if (measurements.length > 0) {
    const todaysMeasurements = measurements.filter(m => isToday(m.timestamp));
    
    const avgSysTotal = Math.round(measurements.reduce((acc, m) => acc + m.systolic, 0) / measurements.length);
    const avgDiaTotal = Math.round(measurements.reduce((acc, m) => acc + m.diastolic, 0) / measurements.length);
    
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`Média Geral: ${avgSysTotal} / ${avgDiaTotal} mmHg`, 14, currentY);
    
    if (todaysMeasurements.length > 0) {
      const avgSysToday = Math.round(todaysMeasurements.reduce((acc, m) => acc + m.systolic, 0) / todaysMeasurements.length);
      const avgDiaToday = Math.round(todaysMeasurements.reduce((acc, m) => acc + m.diastolic, 0) / todaysMeasurements.length);
      doc.text(`Média de Hoje: ${avgSysToday} / ${avgDiaToday} mmHg`, 100, currentY);
    }
    currentY += 10;
  }

  // Table Data
  const tableData = measurements.map(m => {
    const classification = classifyBloodPressure(m.systolic, m.diastolic);
    const periodLabel = m.period === 'morning' ? 'Manhã' : m.period === 'afternoon' ? 'Tarde' : 'Noite';
    
    return [
      format(m.timestamp, "dd/MM/yyyy HH:mm"),
      periodLabel,
      `${m.systolic} / ${m.diastolic}`,
      m.pulse ? m.pulse.toString() : '--',
      classification.label
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Data/Hora', 'Período', 'PA (mmHg)', 'Pulso (bpm)', 'Classificação']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 10, cellPadding: 3 },
    didParseCell: function(data) {
      // Highlight high blood pressure rows
      if (data.section === 'body' && data.column.index === 4) {
        const text = data.cell.text[0];
        if (text.includes('Hipertensão')) {
          data.cell.styles.textColor = [220, 53, 69]; // Red
          data.cell.styles.fontStyle = 'bold';
        } else if (text === 'Elevada') {
          data.cell.styles.textColor = [253, 126, 20]; // Orange
        } else {
          data.cell.styles.textColor = [40, 167, 69]; // Green
        }
      }
    }
  });

  return doc;
}

export function generatePDF(measurements: Measurement[], userName: string = 'Paciente') {
  const doc = generatePDFDocument(measurements, userName);
  doc.save(`relatorio_pressao_${format(new Date(), "yyyyMMdd")}.pdf`);
}

export function viewPDF(measurements: Measurement[], userName: string = 'Paciente') {
  const doc = generatePDFDocument(measurements, userName);
  const dataUri = doc.output('datauristring');
  
  try {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`<iframe src="${dataUri}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    } else {
      // Fallback for WebViews (like Kodular) that block popups
      window.location.href = dataUri;
    }
  } catch (error) {
    window.location.href = dataUri;
  }
}

export async function sharePDF(measurements: Measurement[], userName: string = 'Paciente') {
  const doc = generatePDFDocument(measurements, userName);
  const filename = `relatorio_pressao_${format(new Date(), "yyyyMMdd")}.pdf`;
  
  try {
    const blob = doc.output('blob');
    const file = new File([blob], filename, { type: 'application/pdf' });
    
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Relatório de Pressão Arterial',
        text: `Segue o relatório detalhado de pressão arterial de ${userName}.`,
      });
    } else {
      // Fallback to download if sharing is not supported
      doc.save(filename);
    }
  } catch (error) {
    console.error('Error sharing PDF:', error);
    // Fallback to download on error (e.g. user cancelled share, or other failure)
    doc.save(filename);
  }
}
