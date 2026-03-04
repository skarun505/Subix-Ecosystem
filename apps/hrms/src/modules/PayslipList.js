import { authService } from '../core/auth.js';
import { payrollService } from '../core/payroll.js';
import { employeeService } from '../core/employee.js';

export function renderPayslipList() {
  const container = document.createElement('div');
  const currentUser = authService.getCurrentUser();

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Salary & Payslips</h1>
      <p class="page-subtitle">View your salary breakdown and download payslips</p>
    </div>

    <div class="grid grid-3 mb-6">
      <div class="card stat-card">
        <div class="stat-value">₹45,000</div>
        <div class="stat-label">Gross Salary</div>
      </div>

      <div class="card stat-card">
        <div class="stat-value">₹5,200</div>
        <div class="stat-label">Total Deductions</div>
      </div>

      <div class="card stat-card">
        <div class="stat-value" style="color: var(--success);">₹39,800</div>
        <div class="stat-label">Net Pay (Take Home)</div>
      </div>
    </div>

    <div class="card mb-4">
      <h3 class="mb-4">Salary Breakdown</h3>
      
      <div class="grid grid-2">
        <div>
          <h4 style="color: var(--success); margin-bottom: 1rem;">Earnings</h4>
          <table style="width: 100%;">
            <tr>
              <td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">Basic Salary</td>
              <td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border); text-align: right; font-weight: 600;">₹25,000</td>
            </tr>
            <tr>
              <td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">HRA</td>
              <td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border); text-align: right; font-weight: 600;">₹10,000</td>
            </tr>
            <tr>
              <td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">Special Allowance</td>
              <td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border); text-align: right; font-weight: 600;">₹8,000</td>
            </tr>
            <tr>
              <td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">Bonus</td>
              <td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border); text-align: right; font-weight: 600;">₹2,000</td>
            </tr>
            <tr>
              <td style="padding: 0.75rem 0; font-weight: 700; font-size: 1rem;">Total Earnings</td>
              <td style="padding: 0.75rem 0; text-align: right; font-weight: 700; font-size: 1rem; color: var(--success);">₹45,000</td>
            </tr>
          </table>
        </div>

        <div>
          <h4 style="color: var(--danger); margin-bottom: 1rem;">Deductions</h4>
          <table style="width: 100%;">
            <tr>
              <td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">EPF (Employee)</td>
              <td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border); text-align: right; font-weight: 600;">₹3,000</td>
            </tr>
            <tr>
              <td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">Professional Tax</td>
              <td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border); text-align: right; font-weight: 600;">₹200</td>
            </tr>
            <tr>
              <td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">TDS</td>
              <td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border); text-align: right; font-weight: 600;">₹2,000</td>
            </tr>
            <tr>
              <td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);"></td>
              <td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);"></td>
            </tr>
            <tr>
              <td style="padding: 0.75rem 0; font-weight: 700; font-size: 1rem;">Total Deductions</td>
              <td style="padding: 0.75rem 0; text-align: right; font-weight: 700; font-size: 1rem; color: var(--danger);">₹5,200</td>
            </tr>
          </table>
        </div>
      </div>

      <div style="margin-top: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div class="text-sm text-muted">Net Pay (Take Home)</div>
            <div style="font-size: 2rem; font-weight: 700; color: var(--success); margin-top: 0.5rem;">₹39,800</div>
          </div>
          <div class="text-sm text-muted" style="text-align: right;">
            After all deductions<br/>
            Credited on 1st of every month
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h3>Payslip History</h3>
      </div>

      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Gross Amount</th>
            <th>Deductions</th>
            <th>Net Pay</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="payslip-table-body">
          <!-- Payslips will be dynamically loaded -->
        </tbody>
      </table>
    </div>
  `;

  // Load payslips
  loadPayslips(container);

  return container;
}

async function loadPayslips(container) {
  const currentUser = authService.getCurrentUser();
  const payslips = await payrollService.getPayslips(currentUser.userId);

  const userPayslips = (payslips || [])
    .sort((a, b) => new Date(b.processedOn || b.date) - new Date(a.processedOn || a.date))
    .slice(0, 12);

  const tbody = container.querySelector('#payslip-table-body');

  if (userPayslips.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          No payslips available yet. Payslips will be generated after payroll processing.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = userPayslips.map(payslip => {
    const grossPay = payslip.grossEarnings || payslip.grossPay || 0;
    const totalDeductions = payslip.totalDeductions || 0;
    const netPay = payslip.netSalary || payslip.netPay || (grossPay - totalDeductions);
    const monthName = typeof payslip.month === 'number' ? new Date(2000, payslip.month - 1).toLocaleString('default', { month: 'long' }) : payslip.month;

    return `
      <tr>
        <td style="font-weight: 500;">${monthName} ${payslip.year}</td>
        <td>₹${grossPay.toLocaleString()}</td>
        <td style="color: var(--danger);">₹${totalDeductions.toLocaleString()}</td>
        <td style="color: var(--success); font-weight: 600;">₹${netPay.toLocaleString()}</td>
        <td>
          <span class="badge badge-${payslip.status === 'Paid' ? 'success' : 'warning'}">
            ${payslip.status || 'Processing'}
          </span>
        </td>
        <td>
          <button 
            class="btn btn-secondary" 
            style="padding: 0.375rem 0.75rem; font-size: 0.75rem;"
            onclick="window.viewPayslipFromList('${payslip.id}')"
          >
            View
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Global handler to view/download payslip as PDF
window.viewPayslipFromList = async function (payslipId) {
  const payslip = await payrollService.getPayslip(payslipId);

  if (!payslip) {
    alert('Payslip not found. Please try again.');
    return;
  }

  const currentUser = authService.getCurrentUser();
  const employee = await employeeService.getEmployee(payslip.employeeId) || {};

  // Calculate values
  const grossPay = payslip.grossPay || (payslip.earnings || []).reduce((sum, e) => sum + e.amount, 0);
  const totalDeductions = payslip.totalDeductions || (payslip.deductions || []).reduce((sum, d) => sum + d.amount, 0);
  const netPay = payslip.netPay || (grossPay - totalDeductions);

  // Get earnings and deductions
  const earnings = payslip.earnings || [
    { label: 'Basic Salary', amount: Math.round(grossPay * 0.55) },
    { label: 'HRA', amount: Math.round(grossPay * 0.25) },
    { label: 'Special Allowance', amount: Math.round(grossPay * 0.20) }
  ];

  const deductions = payslip.deductions || [
    { label: 'EPF', amount: Math.round(grossPay * 0.12 * 0.55) },
    { label: 'Professional Tax', amount: 200 },
    { label: 'TDS', amount: Math.max(0, Math.round(grossPay * 0.05)) }
  ];

  // Create printable HTML
  const printContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Payslip - ${payslip.month} ${payslip.year}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 20px;
            background: white;
            color: #333;
        }
        .container { max-width: 800px; margin: 0 auto; }
        .header { 
            text-align: center; 
            padding-bottom: 20px; 
            border-bottom: 3px solid #111111; 
            margin-bottom: 20px;
        }
        .company-name { 
            font-size: 28px; 
            font-weight: bold; 
            color: #111111; 
            margin-bottom: 5px;
        }
        .payslip-title { 
            font-size: 18px; 
            color: #666; 
            margin-top: 15px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .info-section { 
            display: flex; 
            justify-content: space-between; 
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .info-group { }
        .info-row { margin-bottom: 8px; }
        .info-label { color: #666; font-size: 12px; }
        .info-value { font-weight: 600; font-size: 14px; }
        .section-title {
            background: #f0f4f8;
            padding: 10px 15px;
            font-weight: bold;
            margin: 20px 0 10px;
            border-left: 4px solid #ccff00;
        }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; }
        .amount { text-align: right; font-family: 'Courier New', monospace; }
        .total-row { background: #f8fafc; font-weight: bold; }
        .net-salary-box {
            background: #111111;
            color: white;
            padding: 25px;
            border-radius: 8px;
            text-align: center;
            margin: 25px 0;
        }
        .net-salary-label { font-size: 14px; opacity: 0.9; }
        .net-salary-amount { font-size: 36px; font-weight: bold; margin: 10px 0; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .footer { 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 2px solid #e2e8f0; 
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .signature-section { 
            display: flex; 
            justify-content: space-between; 
            margin-top: 50px;
        }
        .signature-box { text-align: center; }
        .signature-line { 
            border-top: 2px solid #333; 
            width: 200px; 
            margin: 40px auto 10px;
            padding-top: 10px;
        }
        .download-btn {
            background: #ccff00;
            color: black;
            border: none;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
            margin: 20px 10px 20px 0;
        }
        .download-btn:hover { background: #b3e600; }
        .close-btn {
            background: #64748b;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
        }
        @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="text-align: center; margin-bottom: 20px;">
        <button class="download-btn" onclick="window.print()">📥 Download as PDF</button>
        <button class="close-btn" onclick="window.close()">✕ Close</button>
        <p style="color: #666; font-size: 12px; margin-top: 10px;">Click "Download as PDF" and select "Save as PDF" as the destination</p>
    </div>

    <div class="container">
        <div class="header">
            <div class="company-name">Subix HRMS</div>
            <div style="color: #666; font-size: 12px;">Human Resource Management System</div>
            <div class="payslip-title">Salary Slip for ${payslip.month} ${payslip.year}</div>
        </div>

        <div class="info-section">
            <div class="info-group">
                <div class="info-row">
                    <div class="info-label">Employee Name</div>
                    <div class="info-value">${payslip.employeeName || employee.name || 'Employee'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Employee ID</div>
                    <div class="info-value">${payslip.employeeId || payslip.userId}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Department</div>
                    <div class="info-value">${payslip.department || employee.department || 'N/A'}</div>
                </div>
            </div>
            <div class="info-group">
                <div class="info-row">
                    <div class="info-label">Pay Period</div>
                    <div class="info-value">${payslip.month} ${payslip.year}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Designation</div>
                    <div class="info-value">${payslip.designation || employee.designation || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Payment Date</div>
                    <div class="info-value">${payslip.paidOn ? new Date(payslip.paidOn).toLocaleDateString() : 'Pending'}</div>
                </div>
            </div>
        </div>

        <div class="grid-2">
            <div>
                <div class="section-title">💰 Earnings</div>
                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th class="amount">Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${earnings.map(e => `
                            <tr>
                                <td>${e.label}</td>
                                <td class="amount">${e.amount.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                        <tr class="total-row">
                            <td><strong>GROSS EARNINGS</strong></td>
                            <td class="amount"><strong>₹ ${grossPay.toLocaleString()}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div>
                <div class="section-title">➖ Deductions</div>
                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th class="amount">Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${deductions.map(d => `
                            <tr>
                                <td>${d.label}</td>
                                <td class="amount">${d.amount.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                        <tr class="total-row">
                            <td><strong>TOTAL DEDUCTIONS</strong></td>
                            <td class="amount"><strong>₹ ${totalDeductions.toLocaleString()}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="net-salary-box">
            <div class="net-salary-label">NET SALARY (TAKE HOME)</div>
            <div class="net-salary-amount">₹ ${netPay.toLocaleString()}</div>
        </div>

        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line">Employee Signature</div>
            </div>
            <div class="signature-box">
                <div class="signature-line">Authorized Signatory</div>
                <div style="font-size: 11px; color: #666;">For Subix HRMS Company</div>
            </div>
        </div>

        <div class="footer">
            <p><strong>Note:</strong> This is a system-generated payslip and does not require a physical signature.</p>
            <p style="margin-top: 10px;">Generated on: ${new Date().toLocaleString()} | Payslip ID: ${payslip.id}</p>
            <p style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
                <strong>Subix HRMS</strong> - Complete Transparency in HR Management
            </p>
        </div>
    </div>
</body>
</html>
    `;

  // Open in new window for print/download
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  printWindow.document.write(printContent);
  printWindow.document.close();
};
