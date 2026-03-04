import { payrollService } from '../core/payroll.js';

export function renderPayslipDocument(payslipId) {
  const container = document.createElement('div');
  container.innerHTML = '<div class="text-muted text-center py-8">Loading payslip...</div>';
  loadPayslipDocument(container, payslipId);
  return container;
}

async function loadPayslipDocument(container, payslipId) {
  const payslip = await payrollService.getPayslip(payslipId);

  if (!payslip) {
    container.innerHTML = '<div class="text-center p-8"><h3>Payslip not found</h3></div>';
    return;
  }

  container.className = 'payslip-document';

  container.innerHTML = `
    <style>
      @media print {
        body * {
          visibility: hidden;
        }
        .payslip-document, .payslip-document * {
          visibility: visible;
        }
        .payslip-document {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
        .page-break {
          page-break-after: always;
        }
      }

      .payslip-document {
        max-width: 210mm;
        margin: 0 auto;
        background: white;
        padding: 20mm;
        font-family: 'Arial', sans-serif;
        font-size: 12pt;
        line-height: 1.6;
        color: #000;
      }

      .payslip-header {
        border-bottom: 3px solid #111111;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }

      .company-logo {
        font-size: 28pt;
        font-weight: bold;
        color: #111111;
        margin-bottom: 5px;
      }

      .payslip-title {
        font-size: 20pt;
        font-weight: bold;
        text-align: center;
        margin: 20px 0;
        text-transform: uppercase;
        letter-spacing: 2px;
      }

      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 30px;
      }

      .info-item {
        display: flex;
        padding: 8px 0;
      }

      .info-label {
        font-weight: bold;
        width: 150px;
        color: #666;
      }

      .info-value {
        color: #000;
      }

      .section-title {
        background: #f0f4f8;
        padding: 10px 15px;
        font-weight: bold;
        font-size: 14pt;
        margin: 25px 0 15px 0;
        border-left: 4px solid #ccff00;
      }

      .payslip-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }

      .payslip-table th {
        background: #f8fafc;
        padding: 12px;
        text-align: left;
        font-weight: bold;
        border-bottom: 2px solid #e2e8f0;
      }

      .payslip-table td {
        padding: 10px 12px;
        border-bottom: 1px solid #f1f5f9;
      }

      .payslip-table tr:last-child td {
        border-bottom: none;
      }

      .amount {
        text-align: right;
        font-family: 'Courier New', monospace;
      }

      .total-row {
        background: #f8fafc;
        font-weight: bold;
        font-size: 13pt;
      }

      .net-salary-box {
        background: #111111;
        color: white;
        padding: 20px;
        border-radius: 8px;
        margin: 30px 0;
        text-align: center;
      }

      .net-salary-label {
        font-size: 16pt;
        margin-bottom: 10px;
        opacity: 0.9;
      }

      .net-salary-amount {
        font-size: 32pt;
        font-weight: bold;
        font-family: 'Courier New', monospace;
      }

      .net-salary-words {
        font-size: 11pt;
        margin-top: 10px;
        opacity: 0.9;
        font-style: italic;
      }

      .footer {
        margin-top: 50px;
        padding-top: 20px;
        border-top: 2px solid #e2e8f0;
        font-size: 10pt;
        color: #666;
      }

      .signature-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 50px;
        margin-top: 60px;
      }

      .signature-box {
        text-align: center;
      }

      .signature-line {
        border-top: 2px solid #000;
        margin-top: 50px;
        padding-top: 10px;
      }

      .watermark {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 100pt;
        color: rgba(59, 130, 246, 0.05);
        font-weight: bold;
        z-index: -1;
        pointer-events: none;
      }
    </style>

    <div class="no-print" style="margin-bottom: 20px; text-align: right;">
      <button class="btn btn-primary" onclick="window.print()">🖨️ Print Payslip</button>
      <button class="btn btn-secondary" onclick="window.history.back()">← Back</button>
    </div>

    <div style="position: relative;">
      <div class="watermark">${payslip.status.toUpperCase()}</div>

      <!-- Header -->
      <div class="payslip-header">
        <div class="company-logo">Subix HRMS</div>
        <div style="color: #666; font-size: 11pt;">Human Resource Management System</div>
        <div style="color: #666; font-size: 10pt; margin-top: 5px;">
          Corporate Office | HR Department<br/>
          Email: hr@subix.io | Phone: +91-XXXXXXXXXX
        </div>
      </div>

      <!-- Title -->
      <div class="payslip-title">
        Salary Slip for ${getMonthName(payslip.month)} ${payslip.year}
      </div>

      <!-- Employee Info -->
      <div class="info-grid">
        <div>
          <div class="info-item">
            <div class="info-label">Employee Name:</div>
            <div class="info-value">${payslip.employeeName}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Employee ID:</div>
            <div class="info-value">${payslip.employeeCode}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Designation:</div>
            <div class="info-value">${payslip.designation}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Department:</div>
            <div class="info-value">${payslip.department}</div>
          </div>
        </div>
        <div>
          <div class="info-item">
            <div class="info-label">Pay Period:</div>
            <div class="info-value">${getMonthName(payslip.month)} ${payslip.year}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Working Days:</div>
            <div class="info-value">${payslip.attendance.workingDays}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Days Worked:</div>
            <div class="info-value">${payslip.attendance.effectiveWorkingDays}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Payment Date:</div>
            <div class="info-value">${payslip.paidOn ? new Date(payslip.paidOn).toLocaleDateString() : 'Pending'}</div>
          </div>
        </div>
      </div>

      <!-- Attendance Details -->
      <div class="section-title">📊 Attendance Summary</div>
      <table class="payslip-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="amount">Days/Hours</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Present Days</td>
            <td class="amount">${payslip.attendance.presentDays}</td>
          </tr>
          <tr>
            <td>Paid Leave Days</td>
            <td class="amount">${payslip.attendance.paidLeaveDays}</td>
          </tr>
          <tr>
            <td>Unpaid Leave Days</td>
            <td class="amount">${payslip.attendance.unpaidLeaveDays}</td>
          </tr>
          <tr>
            <td>Absent Days</td>
            <td class="amount">${payslip.attendance.absentDays}</td>
          </tr>
          <tr>
            <td>Overtime Hours</td>
            <td class="amount">${payslip.attendance.overtimeHours}</td>
          </tr>
          <tr>
            <td>Late Marks</td>
            <td class="amount">${payslip.attendance.lateMarks}</td>
          </tr>
        </tbody>
      </table>

      <!-- Earnings & Deductions -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
        <!-- Earnings -->
        <div>
          <div class="section-title">💰 Earnings</div>
          <table class="payslip-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="amount">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Basic Salary</td>
                <td class="amount">${payslip.earnings.basic.toLocaleString()}</td>
              </tr>
              <tr>
                <td>House Rent Allowance</td>
                <td class="amount">${payslip.earnings.hra.toLocaleString()}</td>
              </tr>
              ${payslip.earnings.conveyance ? `
              <tr>
                <td>Conveyance Allowance</td>
                <td class="amount">${payslip.earnings.conveyance.toLocaleString()}</td>
              </tr>` : ''}
              ${payslip.earnings.medicalAllowance ? `
              <tr>
                <td>Medical Allowance</td>
                <td class="amount">${payslip.earnings.medicalAllowance.toLocaleString()}</td>
              </tr>` : ''}
              ${payslip.earnings.specialAllowance ? `
              <tr>
                <td>Special Allowance</td>
                <td class="amount">${payslip.earnings.specialAllowance.toLocaleString()}</td>
              </tr>` : ''}
              ${payslip.earnings.overtime ? `
              <tr>
                <td>Overtime Pay</td>
                <td class="amount">${payslip.earnings.overtime.toLocaleString()}</td>
              </tr>` : ''}
              <tr class="total-row">
                <td>GROSS EARNINGS</td>
                <td class="amount">₹ ${payslip.grossEarnings.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Deductions -->
        <div>
          <div class="section-title">➖ Deductions</div>
          <table class="payslip-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="amount">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Provident Fund (PF)</td>
                <td class="amount">${payslip.deductions.pf.toLocaleString()}</td>
              </tr>
              ${payslip.deductions.esi ? `
              <tr>
                <td>Employee State Insurance</td>
                <td class="amount">${payslip.deductions.esi.toLocaleString()}</td>
              </tr>` : ''}
              <tr>
                <td>Professional Tax</td>
                <td class="amount">${payslip.deductions.professionalTax.toLocaleString()}</td>
              </tr>
              ${payslip.deductions.absence ? `
              <tr>
                <td>Absence Deduction</td>
                <td class="amount">${payslip.deductions.absence.toLocaleString()}</td>
              </tr>` : ''}
              ${payslip.deductions.lateMark ? `
              <tr>
                <td>Late Mark Penalty</td>
                <td class="amount">${payslip.deductions.lateMark.toLocaleString()}</td>
              </tr>` : ''}
              ${payslip.deductions.tds ? `
              <tr>
                <td>Tax Deducted at Source</td>
                <td class="amount">${payslip.deductions.tds.toLocaleString()}</td>
              </tr>` : ''}
              <tr class="total-row">
                <td>TOTAL DEDUCTIONS</td>
                <td class="amount">₹ ${payslip.totalDeductions.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Net Salary -->
      <div class="net-salary-box">
        <div class="net-salary-label">NET SALARY (TAKE HOME)</div>
        <div class="net-salary-amount">₹ ${payslip.netSalary.toLocaleString()}</div>
        <div class="net-salary-words">(${numberToWords(payslip.netSalary)} Rupees Only)</div>
      </div>

      <!-- Signature Section -->
      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">Employee Signature</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Authorized Signatory</div>
          <div style="margin-top: 10px; font-size: 10pt; color: #666;">
            For Subix HRMS Company
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div style="text-align: center; margin-bottom: 10px;">
          <strong>Note:</strong> This is a system-generated payslip and does not require a physical signature.
        </div>
        <div style="text-align: center; font-size: 9pt; color: #999;">
          Generated on: ${new Date().toLocaleString()} | 
          Payslip ID: ${payslip.id} | 
          Status: ${payslip.status.toUpperCase()}
        </div>
        <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
          <strong>Subix HRMS</strong> - Complete Transparency in HR Management<br/>
          <span style="font-size: 9pt;">This document is confidential and intended for the addressee only.</span>
        </div>
      </div>
    </div>
  `;

  return container;
}

function getMonthName(month) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1];
}

function numberToWords(num) {
  if (num === 0) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  function convertHundreds(n) {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + ' ' + ones[n % 10];
    return ones[Math.floor(n / 100)] + ' Hundred ' + convertHundreds(n % 100);
  }

  if (num < 1000) return convertHundreds(num).trim();
  if (num < 100000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    return (convertHundreds(thousands) + ' Thousand ' + convertHundreds(remainder)).trim();
  }
  if (num < 10000000) {
    const lakhs = Math.floor(num / 100000);
    const remainder = num % 100000;
    const thousands = Math.floor(remainder / 1000);
    const hundreds = remainder % 1000;
    return (convertHundreds(lakhs) + ' Lakh ' + convertHundreds(thousands) + ' Thousand ' + convertHundreds(hundreds)).trim();
  }

  return 'Amount Too Large';
}
