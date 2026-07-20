import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate and download a PDF report for a student's health prediction results & AI advice.
 */
export async function generateStudentPdfReport({ student, prediction, aiSuggestion, habitData }) {
  const reportContainer = document.createElement('div');
  reportContainer.id = 'pdf-report-template';
  reportContainer.style.position = 'fixed';
  reportContainer.style.left = '-9999px';
  reportContainer.style.top = '0';
  reportContainer.style.width = '800px';
  reportContainer.style.backgroundColor = '#ffffff';
  reportContainer.style.padding = '40px';
  reportContainer.style.fontFamily = 'Helvetica, Arial, sans-serif';
  reportContainer.style.color = '#1e293b';

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const statusColor =
    prediction?.result === 'Fit'
      ? '#16a34a'
      : prediction?.result === 'Unhealthy'
      ? '#d97706'
      : '#dc2626';

  const statusBg =
    prediction?.result === 'Fit'
      ? '#f0fdf4'
      : prediction?.result === 'Unhealthy'
      ? '#fffbeb'
      : '#fef2f2';

  reportContainer.innerHTML = `
    <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 style="font-size: 26px; font-weight: 800; color: #4f46e5; margin: 0; letter-spacing: -0.5px;">HealthPredict</h1>
        <p style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin: 4px 0 0 0; letter-spacing: 1px;">Medical Student Wellness Report</p>
      </div>
      <div style="text-align: right;">
        <p style="font-size: 12px; color: #64748b; margin: 0;">Date: <strong>${dateStr}</strong></p>
        <p style="font-size: 11px; color: #94a3b8; margin: 4px 0 0 0;">Confidential Medical Record</p>
      </div>
    </div>

    <!-- Student Profile -->
    <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
      <h3 style="font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; margin: 0 0 12px 0; letter-spacing: 0.5px;">Student Profile</h3>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; font-size: 14px;">
        <div><span style="color: #64748b; font-size: 12px;">Full Name:</span><br/><strong style="color: #0f172a; font-size: 16px;">${student.name}</strong></div>
        <div><span style="color: #64748b; font-size: 12px;">Age:</span><br/><strong style="color: #0f172a;">${student.age ? `${student.age} years` : 'N/A'}</strong></div>
        <div><span style="color: #64748b; font-size: 12px;">Gender:</span><br/><strong style="color: #0f172a;">${student.gender || 'N/A'}</strong></div>
      </div>
    </div>

    <!-- Health Habits & Metrics -->
    <div style="margin-bottom: 25px;">
      <h3 style="font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; margin: 0 0 12px 0; letter-spacing: 0.5px;">Assessed Health Habits</h3>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
        <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; text-align: center;">
          <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Sleep Duration</span>
          <p style="font-size: 20px; font-weight: 800; color: #4f46e5; margin: 8px 0 0 0;">${habitData.sleepDuration} <span style="font-size: 12px; font-weight: 500; color: #64748b;">hrs/night</span></p>
        </div>
        <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; text-align: center;">
          <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Daily Steps</span>
          <p style="font-size: 20px; font-weight: 800; color: #4f46e5; margin: 8px 0 0 0;">${Number(habitData.dailySteps).toLocaleString()} <span style="font-size: 12px; font-weight: 500; color: #64748b;">steps</span></p>
        </div>
        <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; text-align: center;">
          <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Diet Quality</span>
          <p style="font-size: 20px; font-weight: 800; color: #4f46e5; margin: 8px 0 0 0;">${habitData.dietQuality}</p>
        </div>
      </div>
    </div>

    <!-- ML Prediction Outcome -->
    <div style="background: ${statusBg}; border: 1.5px solid ${statusColor}; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <div>
          <span style="font-size: 11px; font-weight: 700; color: ${statusColor}; text-transform: uppercase; letter-spacing: 0.5px;">ML Health Prediction Result</span>
          <h2 style="font-size: 24px; font-weight: 800; color: ${statusColor}; margin: 4px 0 0 0;">${prediction?.result || 'N/A'}</h2>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 11px; color: #64748b;">Model Confidence</span>
          <p style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 2px 0 0 0;">${prediction?.confidence ? prediction.confidence.toFixed(1) : '0'}%</p>
        </div>
      </div>
      ${
        prediction?.probabilities
          ? `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; border-top: 1px solid rgba(0,0,0,0.08); padding-top: 15px; font-size: 12px;">
          <div><span style="color: #64748b;">Fit:</span> <strong>${prediction.probabilities.Fit || 0}%</strong></div>
          <div><span style="color: #64748b;">Unhealthy:</span> <strong>${prediction.probabilities.Unhealthy || 0}%</strong></div>
          <div><span style="color: #64748b;">At-Risk:</span> <strong>${prediction.probabilities['At-Risk'] || 0}%</strong></div>
        </div>
      `
          : ''
      }
    </div>

    <!-- AI Suggestions (Gemini AI) -->
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
      <h3 style="font-size: 13px; font-weight: 700; color: #4f46e5; text-transform: uppercase; margin: 0 0 10px 0; letter-spacing: 0.5px;">AI Clinical Health Recommendations (Gemini AI)</h3>
      <p style="font-size: 13px; color: #334155; line-height: 1.6; margin: 0; background: #f8fafc; padding: 15px; border-left: 4px solid #6366f1; border-radius: 6px;">
        ${aiSuggestion || 'No specific AI recommendations generated for this session.'}
      </p>
    </div>

    <!-- Sign-off Footer -->
    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #94a3b8;">
      <div>
        <p style="margin: 0;">Report Generated by HealthPredict System</p>
        <p style="margin: 3px 0 0 0;">Authorized Medical Officer Access</p>
      </div>
      <div style="border-top: 1px dashed #cbd5e1; width: 200px; text-align: center; padding-top: 5px;">
        <span style="color: #64748b; font-weight: 600;">Medical Officer Signature</span>
      </div>
    </div>
  `;

  document.body.appendChild(reportContainer);

  try {
    const canvas = await html2canvas(reportContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    const fileName = `${student.name.replace(/\s+/g, '_')}_Health_Report.pdf`;
    pdf.save(fileName);
  } finally {
    document.body.removeChild(reportContainer);
  }
}
