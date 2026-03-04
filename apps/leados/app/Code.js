/**
 * Subix LeadOS - Backend Logic (Google Apps Script)
 * 
 * @OnlyCurrentDoc
 */

const SHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with actual ID
const SHEET_NAME_LEADS = 'Leads';

/**
 * Serves the web app.
 */
function doGet(e) {
    return HtmlService.createTemplateFromFile('index')
        .evaluate()
        .setTitle('Subix LeadOS')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Include helper for HTML templates to include other files.
 */
function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename)
        .getContent();
}

/**
 * API: Get all leads from the sheet.
 */
function getLeads() {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME_LEADS);
    const data = sheet.getDataRange().getValues();
    const headers = data.shift(); // Remove headers

    // Convert to array of objects
    return data.map(row => {
        return {
            id: row[0],
            date: row[1],
            name: row[2],
            phone: row[3],
            email: row[4],
            source: row[5],
            status: row[6],
            stage: row[7],
            score: row[8],
            notes: row[9],
            owner: row[10]
        };
    });
}

/**
 * API: Add a new lead.
 */
function addLead(lead) {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME_LEADS);
    const newRow = [
        Utilities.getUuid(),
        new Date(),
        lead.name,
        lead.phone,
        lead.email,
        lead.source,
        lead.status || 'Inquiry',
        'Inquiry', // Initial Stage
        calculateScore(lead), // Initial Score
        lead.notes,
        Session.getActiveUser().getEmail()
    ];

    sheet.appendRow(newRow);
    return { success: true };
}

/**
 * Trigger: Handle Form Submission
 */
function onFormSubmit(e) {
    const itemResponses = e.response.getItemResponses();
    const lead = {};

    // Map form responses to lead object (adjust indices/titles as needed)
    itemResponses.forEach(item => {
        const title = item.getItem().getTitle();
        const answer = item.getResponse();

        if (title.includes('Name')) lead.name = answer;
        if (title.includes('Email')) lead.email = answer;
        if (title.includes('Phone')) lead.phone = answer;
        if (title.includes('Source')) lead.source = answer;
    });

    addLead(lead);
}

/**
 * Logic: Calculate Lead Score (0-100)
 */
function calculateScore(lead) {
    let score = 30; // Base score

    if (lead.source === 'Referral') score += 40;
    if (lead.source === 'Website Form') score += 20;
    if (lead.email && !lead.email.includes('gmail.com')) score += 10; // Business email check (naive)

    return Math.min(score, 100);
}

/**
 * API: Update Lead Stage (for Kanban Drag & Drop)
 */
function updateLeadStage(leadId, newStage) {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME_LEADS);
    const data = sheet.getDataRange().getValues();

    // Find row by ID (Column A is Index 0)
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] == leadId) {
            // Update Status (Column G, Index 6) and Stage (Column H, Index 7)
            // Assuming Status and Stage are synced in this simple version, or Stage is detailed status
            sheet.getRange(i + 1, 7).setValue(newStage); // Update Status column
            return { success: true };
        }
    }
    return { success: false, error: 'Lead not found' };
}
