import { reportService } from '../core/report.js';
import { authService } from '../core/auth.js';

export function renderReportDashboard() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="page-header flex justify-between items-center">
            <div>
                <h1 class="page-title">Reports & Analytics</h1>
                <p class="page-subtitle">Visual Insights and Data Export</p>
            </div>
            <div class="flex gap-2">
                <button class="btn btn-secondary" id="print-report-btn">🖨️ Print Report</button>
                <button class="btn btn-primary" id="export-all-btn">💾 Export All</button>
            </div>
        </div>

        <div class="grid grid-2 mb-6">
            <!-- Attendance Trends -->
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <h3>Attendance Overview (Today)</h3>
                </div>
                <div id="attendance-chart" class="chart-container" style="height: 200px; display: flex; align-items: flex-end; gap: 10px; padding-top: 20px;">
                    <div class="text-center text-muted w-full" style="display: flex; align-items: center; justify-content: center;">Loading...</div>
                </div>
            </div>

            <!-- Headcount by Department -->
            <div class="card">
                <h3 class="mb-4">Headcount by Department</h3>
                <div id="dept-distribution" style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div class="text-center text-muted">Loading...</div>
                </div>
            </div>
        </div>

        <div class="grid grid-3 mb-6">
            <!-- Payroll Summary -->
            <div class="card">
                <h3 class="mb-4">Workforce Summary</h3>
                <div id="payroll-stats">
                    <div class="text-center text-muted">Loading...</div>
                </div>
            </div>

            <!-- Leave Utilization -->
            <div class="card">
                <h3 class="mb-4">Employee Status Distribution</h3>
                <div id="leave-stats">
                    <div class="text-center text-muted">Loading...</div>
                </div>
            </div>

            <!-- Diversity -->
            <div class="card">
                <h3 class="mb-4">Gender Diversity</h3>
                <div id="diversity-stats" class="flex items-center justify-center p-4">
                    <div class="text-center text-muted">Loading...</div>
                </div>
            </div>
        </div>
    `;

    // Load Data
    setTimeout(async () => {
        try {
            await loadAttendanceChart(container);
        } catch (err) {
            console.error('Error loading attendance chart:', err);
            const el = container.querySelector('#attendance-chart');
            if (el) el.innerHTML = '<div class="text-center text-muted">Unable to load attendance data</div>';
        }

        try {
            await loadDeptDistribution(container);
        } catch (err) {
            console.error('Error loading department distribution:', err);
            const el = container.querySelector('#dept-distribution');
            if (el) el.innerHTML = '<div class="text-center text-muted">Unable to load department data</div>';
        }

        try {
            await loadWorkforceSummary(container);
        } catch (err) {
            console.error('Error loading workforce summary:', err);
            const el = container.querySelector('#payroll-stats');
            if (el) el.innerHTML = '<div class="text-center text-muted">Unable to load data</div>';
        }

        try {
            await loadStatusDistribution(container);
        } catch (err) {
            console.error('Error loading status distribution:', err);
            const el = container.querySelector('#leave-stats');
            if (el) el.innerHTML = '<div class="text-center text-muted">Unable to load data</div>';
        }

        try {
            await loadDiversityStats(container);
        } catch (err) {
            console.error('Error loading diversity stats:', err);
            const el = container.querySelector('#diversity-stats');
            if (el) el.innerHTML = '<div class="text-center text-muted">Unable to load diversity data</div>';
        }

        // Button listeners
        container.querySelector('#print-report-btn')?.addEventListener('click', () => window.print());
        container.querySelector('#export-all-btn')?.addEventListener('click', () => exportFullStats());
    }, 0);

    return container;
}

async function loadAttendanceChart(container) {
    const stats = await reportService.getDashboardStats();
    const chart = container.querySelector('#attendance-chart');

    const total = stats.totalEmployees || 1;
    const present = stats.presentToday || 0;
    const absent = stats.absentToday || 0;
    const onLeave = stats.onLeaveToday || 0;

    const items = [
        { label: 'Present', value: present, color: 'var(--success, #10b981)' },
        { label: 'Absent', value: absent, color: 'var(--danger, #ef4444)' },
        { label: 'On Leave', value: onLeave, color: 'var(--warning, #f59e0b)' },
        { label: 'Total', value: total, color: 'var(--primary, #ccff00)' }
    ];

    const max = Math.max(...items.map(i => i.value), 1);

    chart.innerHTML = items.map(item => `
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px;">
            <div style="font-size: 1.25rem; font-weight: bold; color: ${item.color};">${item.value}</div>
            <div style="width: 100%; display: flex; flex-direction: column-reverse; height: 120px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden;">
                <div style="height: ${(item.value / max) * 100}%; background: ${item.color}; transition: height 0.5s; min-height: 2px; border-radius: 4px 4px 0 0;"></div>
            </div>
            <span class="text-xs text-muted">${item.label}</span>
        </div>
    `).join('');
}

async function loadDeptDistribution(container) {
    const report = await reportService.getHeadcountReport();
    const target = container.querySelector('#dept-distribution');
    const deptData = report.departmentDistribution || {};
    const total = report.totalActive || 1;

    if (Object.keys(deptData).length === 0) {
        target.innerHTML = '<div class="text-center text-muted">No department data available</div>';
        return;
    }

    target.innerHTML = Object.entries(deptData).map(([dept, count]) => `
        <div>
            <div class="flex justify-between text-xs mb-1">
                <span>${dept}</span>
                <span>${count} (${Math.round((count / total) * 100)}%)</span>
            </div>
            <div style="height: 6px; background: var(--bg-secondary); border-radius: 3px; overflow: hidden;">
                <div style="height: 100%; width: ${(count / total) * 100}%; background: var(--primary); border-radius: 3px; transition: width 0.5s;"></div>
            </div>
        </div>
    `).join('');
}

async function loadWorkforceSummary(container) {
    const report = await reportService.getHeadcountReport();
    const target = container.querySelector('#payroll-stats');

    const items = [
        { label: 'Total Active', value: report.totalActive || 0 },
        { label: 'Total Exited', value: report.totalExited || 0 },
        { label: 'Draft / Onboarding', value: report.totalDraft || 0 },
        { label: 'Notice Period', value: report.noticePeriod || 0 },
        { label: 'New Joinees (30d)', value: report.newJoinees || 0 },
        { label: 'Attrition Rate', value: `${report.attritionRate || 0}%`, isText: true }
    ];

    target.innerHTML = items.map(item => `
        <div class="flex justify-between items-center mb-2 text-sm">
            <span class="text-muted">
                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--primary); margin-right:5px;"></span>
                ${item.label}
            </span>
            <span class="font-medium">${item.isText ? item.value : item.value}</span>
        </div>
    `).join('');
}

async function loadStatusDistribution(container) {
    const report = await reportService.getHeadcountReport();
    const target = container.querySelector('#leave-stats');

    const total = (report.totalActive || 0) + (report.totalExited || 0) + (report.totalDraft || 0) + (report.noticePeriod || 0);
    if (total === 0) {
        target.innerHTML = '<p class="text-muted text-center">No employee data available</p>';
        return;
    }

    const statusItems = [
        { label: 'Active', count: report.totalActive || 0, color: 'var(--success, #10b981)' },
        { label: 'Exited', count: report.totalExited || 0, color: 'var(--danger, #ef4444)' },
        { label: 'Draft', count: report.totalDraft || 0, color: 'var(--warning, #f59e0b)' },
        { label: 'Notice Period', count: report.noticePeriod || 0, color: 'var(--info, #3b82f6)' }
    ];

    target.innerHTML = statusItems.map(item => {
        const pct = Math.round((item.count / total) * 100);
        return `
            <div class="mb-4">
                <div class="flex justify-between text-xs mb-1">
                    <span class="font-medium">${item.label}</span>
                    <span>${item.count} (${pct}%)</span>
                </div>
                <div style="height: 6px; background: var(--bg-secondary); border-radius: 3px; overflow: hidden;">
                    <div style="height: 100%; width: ${pct}%; background: ${item.color}; border-radius: 3px; transition: width 0.5s;"></div>
                </div>
            </div>
        `;
    }).join('');
}

async function loadDiversityStats(container) {
    const report = await reportService.getHeadcountReport();
    const target = container.querySelector('#diversity-stats');
    const genderData = report.genderDistribution || {};

    const male = genderData['Male'] || genderData['male'] || 0;
    const female = genderData['Female'] || genderData['female'] || 0;
    const other = genderData['Other'] || genderData['other'] || genderData['Not Specified'] || 0;
    const total = male + female + other || 1;

    const maleP = Math.round((male / total) * 100);
    const femaleP = Math.round((female / total) * 100);
    const otherP = Math.round((other / total) * 100);

    target.innerHTML = `
        <div class="text-center">
            <div style="font-size: 2.5rem; font-weight: bold; color: var(--primary);">${femaleP}%</div>
            <div class="text-sm text-muted">Female Representation</div>
            <div style="display: flex; gap: 1rem; margin-top: 1rem; font-size: 0.75rem; justify-content: center;">
                <span><span style="display:inline-block; width:10px; height:10px; background:var(--primary); border-radius:2px;"></span> Male: ${maleP}% (${male})</span>
                <span><span style="display:inline-block; width:10px; height:10px; background:var(--success, #10b981); border-radius:2px;"></span> Female: ${femaleP}% (${female})</span>
                ${other > 0 ? `<span><span style="display:inline-block; width:10px; height:10px; background:var(--warning); border-radius:2px;"></span> Other: ${otherP}% (${other})</span>` : ''}
            </div>
        </div>
    `;
}

async function exportFullStats() {
    try {
        const report = await reportService.getHeadcountReport();

        // Build CSV content manually
        let csv = 'HRMS Full Report\n\n';

        csv += 'HEADCOUNT SUMMARY\n';
        csv += `Total Active,${report.totalActive}\n`;
        csv += `Total Exited,${report.totalExited}\n`;
        csv += `Total Draft,${report.totalDraft}\n`;
        csv += `Notice Period,${report.noticePeriod}\n`;
        csv += `New Joinees (30 days),${report.newJoinees}\n`;
        csv += `Attrition Rate,${report.attritionRate}%\n\n`;

        csv += 'DEPARTMENT DISTRIBUTION\n';
        csv += 'Department,Count\n';
        Object.entries(report.departmentDistribution || {}).forEach(([dept, count]) => {
            csv += `${dept},${count}\n`;
        });
        csv += '\n';

        csv += 'GENDER DIVERSITY\n';
        csv += 'Gender,Count\n';
        Object.entries(report.genderDistribution || {}).forEach(([gender, count]) => {
            csv += `${gender},${count}\n`;
        });

        // Download the CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hrms_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        alert('Full report exported successfully! 📊');
    } catch (err) {
        alert('Error exporting report: ' + err.message);
    }
}
