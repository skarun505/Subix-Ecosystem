/**
 * Subix LeadOS - Database Layer
 * Handles all data operations with support for Supabase backend
 * Version: 2.1
 */

// ============================================
// DATABASE CONFIGURATION
// ============================================

// ✅ Auto-detect local dev mode (localhost / 127.0.0.1 / file://)
const _IS_LOCAL_DEV = (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:'
);

const DB_CONFIG = {
    // In local dev: always use localStorage. In production: use supabase.
    storage: _IS_LOCAL_DEV ? 'localStorage' : 'supabase',
    // ✅ Unified Subix Accounts project — shared with all products
    supabaseUrl: window.SubixConfig.supabaseUrl,
    supabaseKey: window.SubixConfig.supabaseKey,
    prefix: 'leadOS_',
    version: '2.1'
};

if (_IS_LOCAL_DEV) {
    console.warn('🛠️ DATABASE: Local dev mode — using localStorage (no Supabase needed).');
}

// Initialize Supabase Client
let db_client = null;

// Determine if we should use Supabase
const canUseSupabase = (typeof supabase !== 'undefined' || typeof createClient !== 'undefined') &&
    DB_CONFIG.supabaseUrl &&
    DB_CONFIG.supabaseKey;

if (canUseSupabase) {
    try {
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            db_client = supabase.createClient(DB_CONFIG.supabaseUrl, DB_CONFIG.supabaseKey);
        } else if (typeof createClient !== 'undefined') {
            db_client = createClient(DB_CONFIG.supabaseUrl, DB_CONFIG.supabaseKey);
        }

        if (db_client) {
            console.log('✅ Supabase Client Initialized');
        } else {
            throw new Error('Could not create client');
        }
    } catch (e) {
        console.error('❌ Failed to initialize Supabase:', e);
        DB_CONFIG.storage = 'localStorage'; // Fallback
    }
} else {
    console.warn('⚠️ Supabase credentials missing or SDK not loaded. Falling back to LocalStorage.');
    DB_CONFIG.storage = 'localStorage';
}

// ============================================
// DATA MODELS & SCHEMAS
// ============================================

class LeadModel {
    constructor(data = {}) {
        // Core identification
        this.lead_id = data.lead_id || this.generateUUID();
        this.created_at = data.created_at || new Date().toISOString();
        this.updated_at = data.updated_at || new Date().toISOString();

        // Contact information
        this.name = data.name || '';
        this.phone = data.phone || '';
        this.email = data.email || null;
        this.secondary_phone = data.secondary_phone || null;

        // Lead details
        this.source = data.source || 'Manual';
        this.campaign = data.campaign || null;
        this.status = data.status || 'New';
        this.lead_score = data.lead_score || 0;
        this.assigned_to = data.assigned_to || null;

        // Business context
        this.industry = data.industry || null;
        this.company = data.company || null;
        this.budget = data.budget || null;
        this.expected_close_date = data.expected_close_date || null;

        // Custom fields
        this.property_type = data.property_type || null;
        this.location_preference = data.location_preference || null;
        this.custom_field_1 = data.custom_field_1 || null;
        this.custom_field_2 = data.custom_field_2 || null;

        // Tracking
        this.follow_up_date = data.follow_up_date || null;
        this.last_contacted_at = data.last_contacted_at || null;
        this.lost_reason = data.lost_reason || null;
        this.conversion_probability = data.conversion_probability || null;

        // Metadata
        this.notes = data.notes || '';
        this.tags = data.tags || []; // Changed to array for Supabase compatibility
        this.is_archived = data.is_archived || false;
        this.duplicate_of = data.duplicate_of || null;
    }

    generateUUID() {
        // Use standard UUID if available, otherwise simple fallback
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    validate() {
        const errors = [];

        if (!this.name || this.name.trim() === '') {
            errors.push('Name is required');
        }

        if (!this.phone || this.phone.trim() === '') {
            errors.push('Phone is required');
        }

        if (this.email && !this.isValidEmail(this.email)) {
            errors.push('Invalid email format');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    calculateAge() {
        const created = new Date(this.created_at);
        const now = new Date();
        const days = Math.floor((now - created) / (1000 * 60 * 60 * 24));

        if (days <= 1) return { days, status: 'Fresh', color: '#10b981' };
        if (days <= 3) return { days, status: 'Warm', color: '#f59e0b' };
        return { days, status: 'Risk', color: '#ef4444' };
    }

    toJSON() {
        return { ...this };
    }
}

class ActivityModel {
    constructor(data = {}) {
        this.activity_id = data.activity_id || this.generateUUID();
        this.lead_id = data.lead_id || '';
        this.created_at = data.created_at || new Date().toISOString();
        this.activity_type = data.activity_type || '';
        this.activity_subtype = data.activity_subtype || null;
        this.performed_by = data.performed_by || 'system';
        this.description = data.description || '';
        this.metadata = data.metadata || {};
        this.external_id = data.external_id || null;
    }

    generateUUID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    toJSON() {
        return { ...this };
    }
}

class UserModel {
    constructor(data = {}) {
        this.user_id = data.user_id || this.generateUUID();
        this.created_at = data.created_at || new Date().toISOString();
        this.email = data.email || '';
        this.full_name = data.full_name || '';
        this.role = data.role || 'sales_rep';
        this.phone = data.phone || null;
        this.profile_picture_url = data.profile_picture_url || null;
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        this.last_login_at = data.last_login_at || null;
        this.timezone = data.timezone || 'UTC';
        this.language = data.language || 'en';
        this.notification_preferences = data.notification_preferences || {};
    }

    generateUUID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    toJSON() {
        return { ...this };
    }
}

// ============================================
// DATABASE MANAGER
// ============================================

class DatabaseManager {
    constructor() {
        this.storage = DB_CONFIG.storage;
        this.prefix = DB_CONFIG.prefix;
        this.initializeDatabase();
    }

    async initializeDatabase() {
        if (this.storage === 'localStorage') {
            // Initialize tables if they don't exist
            const tables = ['leads', 'activities', 'users', 'automations', 'communications', 'templates', 'webhooks', 'config', 'follow_ups'];

            tables.forEach(table => {
                if (!this.tableExists(table)) {
                    this.createTable(table);
                }
            });

            // Seed default data
            this.seedDefaultData();
        } else if (this.storage === 'supabase') {
            // Supabase handles initialization via SQL scripts
            // We'll just verify connection here
            if (!db_client) {
                console.warn('⚠️ Supabase client not initialized. Falling back to LocalStorage.');
                this.storage = 'localStorage';
                return;
            }
            const { data, error } = await db_client.from('leads').select('count', { count: 'exact', head: true });
            if (error) {
                console.error('❌ Error connecting to Supabase:', error);

                // If tables don't exist or connection fails, we might want to alert the user
                if (error.code === '42P01') { // undefined_table
                    console.warn('⚠️ Supabase tables missing! Make sure you ran the SQL script.');
                }
            } else {
                console.log('✅ Connected to Supabase. Lead count:', data); // data is count when head: true
            }
        }
    }

    tableExists(tableName) {
        return localStorage.getItem(this.prefix + tableName) !== null;
    }

    createTable(tableName) {
        localStorage.setItem(this.prefix + tableName, JSON.stringify([]));
        console.log(`✓ Created table: ${tableName}`);
    }

    seedDefaultData() {
        // Check if already seeded
        if (localStorage.getItem(this.prefix + 'seeded') === 'true') {
            return;
        }

        // Create default user
        const defaultUser = new UserModel({
            user_id: '00000000-0000-0000-0000-000000000001',
            email: 'admin@subix.local',
            full_name: 'System Administrator',
            role: 'admin'
        });

        this.insertRecordLocalStorage('users', defaultUser.toJSON());

        // Create sample leads
        this.seedSampleLeads();

        localStorage.setItem(this.prefix + 'seeded', 'true');
        console.log('✓ Database seeded with default data (Local)');
    }

    seedSampleLeads() {
        // Seed using generateRandomLeads logic synchronously for localStorage
        const firstNames = ['Aarav', 'Vihaan', 'Aditya', 'Sai', 'Arjun', 'Rohan', 'Vivaan', 'Reyansh', 'Muhammad', 'Ishaan', 'Diya', 'Saanvi', 'Ananya', 'Kiara', 'Pari'];
        const lastNames = ['Patel', 'Singh', 'Sharma', 'Kumar', 'Gupta', 'Reddy', 'Iyer', 'Khan', 'Joshi', 'Mehta', 'Verma', 'Rao', 'Nair', 'Shah', 'Malhotra'];
        const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Ahmedabad', 'Kolkata'];
        const sources = ['Website Form', 'Manual Entry', 'Referral', 'WhatsApp', 'MagicBricks', '99Acres', 'Facebook Ads'];
        const statuses = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

        for (let i = 0; i < 15; i++) {
            const firstName = firstNames[i % firstNames.length];
            const lastName = lastNames[i % lastNames.length];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const daysAgo = Math.floor(Math.random() * 60);
            const createdDate = new Date();
            createdDate.setDate(createdDate.getDate() - daysAgo);

            const lead = new LeadModel({
                name: `${firstName} ${lastName}`,
                phone: `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`,
                email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
                source: sources[Math.floor(Math.random() * sources.length)],
                status: status,
                created_at: createdDate.toISOString(),
                updated_at: createdDate.toISOString(),
                budget: Math.floor(Math.random() * 200) * 100000 + 2000000,
                location_preference: cities[Math.floor(Math.random() * cities.length)],
                notes: 'Sample lead for demonstration.',
                assigned_to: '00000000-0000-0000-0000-000000000001'
            });
            lead.lead_score = this.calculateLeadScore(lead);
            this.insertRecordLocalStorage('leads', lead.toJSON());
            this.insertRecordLocalStorage('activities', new ActivityModel({
                lead_id: lead.lead_id,
                activity_type: 'lead_created',
                description: `Lead created from ${lead.source}`,
                created_at: createdDate.toISOString()
            }).toJSON());
        }
        console.log('✓ Seeded 15 sample leads into localStorage');
    }

    calculateLeadScore(lead) {
        let score = 30; // Base score

        // Source scoring
        const sourceScores = {
            'Referral': 40,
            'Website Form': 30,
            'MagicBricks': 25,
            '99Acres': 25,
            'Facebook Ads': 20,
            'Manual': 15
        };
        score += sourceScores[lead.source] || 10;

        // Budget scoring
        if (lead.budget) {
            if (lead.budget > 10000000) score += 30;
            else if (lead.budget > 5000000) score += 20;
            else score += 10;
        }

        // Email quality
        if (lead.email && !lead.email.includes('gmail') && !lead.email.includes('yahoo')) {
            score += 10; // Business email
        }

        return Math.min(score, 100);
    }


    // ============================================
    // DATA GENERATION
    // ============================================

    async generateRandomLeads(count = 10) {
        const firstNames = ['Aarav', 'Vihaan', 'Aditya', 'Sai', 'Arjun', 'Rohan', 'Vivaan', 'Reyansh', 'Muhammad', 'Ishaan', 'Diya', 'Saanvi', 'Ananya', 'Kiara', 'Pari', 'Riya', 'Aadhya', 'Myra', 'Zara', 'Fatima'];
        const lastNames = ['Patel', 'Singh', 'Sharma', 'Kumar', 'Gupta', 'Reddy', 'Iyer', 'Khan', 'Joshi', 'Mehta', 'Verma', 'Rao', 'Nair', 'Shah', 'Malhotra', 'Kapoor', 'Chatterjee', 'Das', 'Bhat', 'More'];
        const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Ahmedabad', 'Kolkata', 'Jaipur', 'Lucknow'];
        const sources = ['Website Form', 'Manual Entry', 'Referral', 'WhatsApp', 'MagicBricks', '99Acres', 'Facebook Ads', 'Google Ads', 'Cold Outreach'];
        const statuses = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost', 'On Hold'];

        let addedCount = 0;

        for (let i = 0; i < count; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];

            // Random date within last 60 days
            const daysAgo = Math.floor(Math.random() * 60);
            const createdDate = new Date();
            createdDate.setDate(createdDate.getDate() - daysAgo);

            const lead = new LeadModel({
                name: `${firstName} ${lastName}`,
                phone: `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`,
                email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@example.com`,
                source: sources[Math.floor(Math.random() * sources.length)],
                status: status,
                created_at: createdDate.toISOString(),
                updated_at: createdDate.toISOString(),
                budget: Math.floor(Math.random() * 200) * 100000 + 2000000, // 20L to 2Cr+
                location_preference: cities[Math.floor(Math.random() * cities.length)],
                notes: 'Auto-generated dummy lead for testing purposes.',
                assigned_to: '00000000-0000-0000-0000-000000000001'
            });

            // Calculate score
            lead.lead_score = this.calculateLeadScore(lead);

            try {
                await this.insertRecord('leads', lead.toJSON());

                // Add an activity
                await this.logActivity({
                    lead_id: lead.lead_id,
                    activity_type: 'lead_created',
                    description: `Lead created from ${lead.source}`,
                    created_at: createdDate.toISOString()
                });

                addedCount++;
            } catch (e) {
                console.error('❌ Error generating lead:', e);
                // Continue to next one
            }
        }

        console.log(`✅ Generated ${addedCount} random leads`);
        return addedCount;
    }

    // ============================================
    // CRUD OPERATIONS (Hybrid: Local + Supabase)
    // ============================================

    // --- GET ---

    async getAllRecords(tableName) {
        if (this.storage === 'supabase') {
            const { data, error } = await db_client.from(tableName).select('*');
            if (error) {
                console.error(`Error fetching ${tableName}:`, error);
                return [];
            }
            return data;
        } else {
            return this.getAllRecordsLocalStorage(tableName);
        }
    }

    getAllRecordsLocalStorage(tableName) {
        const data = localStorage.getItem(this.prefix + tableName);
        return data ? JSON.parse(data) : [];
    }

    async getRecordById(tableName, id, idField = 'lead_id') {
        if (this.storage === 'supabase') {
            const { data, error } = await db_client
                .from(tableName)
                .select('*')
                .eq(idField, id)
                .single();
            if (error) {
                console.error(`Error fetching record from ${tableName}:`, error);
                return null;
            }
            return data;
        } else {
            const records = this.getAllRecordsLocalStorage(tableName);
            return records.find(record => record[idField] === id);
        }
    }

    // --- INSERT ---

    async insertRecord(tableName, record) {
        if (this.storage === 'supabase') {
            // Data Cleaning: Supabase rejects extra fields not in table schema
            const cleanRecord = { ...record };
            const validLeadsColumns = ['lead_id', 'created_at', 'updated_at', 'name', 'phone', 'email', 'secondary_phone', 'source', 'status', 'company', 'designation', 'lead_score', 'budget', 'expected_close_date', 'tags', 'assigned_to', 'notes', 'is_archived', 'owner_id', 'location_preference', 'property_type', 'industry', 'campaign', 'follow_up_date', 'last_contacted_at', 'lost_reason', 'conversion_probability', 'duplicate_of'];
            const validActivityColumns = ['activity_id', 'created_at', 'lead_id', 'activity_type', 'description', 'performed_by', 'metadata'];

            const validColumns = tableName === 'leads' ? validLeadsColumns : (tableName === 'activities' ? validActivityColumns : null);

            if (validColumns) {
                Object.keys(cleanRecord).forEach(key => {
                    if (!validColumns.includes(key)) delete cleanRecord[key];
                });
            }

            const { data, error } = await db_client
                .from(tableName)
                .insert([cleanRecord])
                .select();

            if (error) {
                console.error(`Error inserting into ${tableName}:`, error);
                throw error;
            }
            return data[0];
        } else {
            return this.insertRecordLocalStorage(tableName, record);
        }
    }

    insertRecordLocalStorage(tableName, record) {
        const records = this.getAllRecordsLocalStorage(tableName);
        records.push(record);
        localStorage.setItem(this.prefix + tableName, JSON.stringify(records));
        return record;
    }

    // --- UPDATE ---

    async updateRecord(tableName, id, updates, idField = 'lead_id') {
        if (this.storage === 'supabase') {
            updates.updated_at = new Date().toISOString(); // Auto-update timestamp

            const { data, error } = await db_client
                .from(tableName)
                .update(updates)
                .eq(idField, id)
                .select();

            if (error) {
                console.error(`Error updating ${tableName}:`, error);
                throw error;
            }
            return data[0];
        } else {
            const records = this.getAllRecordsLocalStorage(tableName);
            const index = records.findIndex(record => record[idField] === id);

            if (index !== -1) {
                records[index] = { ...records[index], ...updates, updated_at: new Date().toISOString() };
                localStorage.setItem(this.prefix + tableName, JSON.stringify(records));
                return records[index];
            }
            return null;
        }
    }

    // --- DELETE ---

    async deleteRecord(tableName, id, idField = 'lead_id') {
        if (this.storage === 'supabase') {
            const { error } = await db_client
                .from(tableName)
                .delete()
                .eq(idField, id);

            if (error) {
                console.error(`Error deleting from ${tableName}:`, error);
                return false;
            }
            return true;
        } else {
            const records = this.getAllRecordsLocalStorage(tableName);
            const filtered = records.filter(record => record[idField] !== id);
            localStorage.setItem(this.prefix + tableName, JSON.stringify(filtered));
            return filtered.length < records.length;
        }
    }

    // ============================================
    // QUERY OPERATIONS
    // ============================================

    async queryRecords(tableName, filterFn) {
        if (this.storage === 'supabase') {
            // NOTE: Client-side filtering of ALL records is inefficient for DBs.
            // Ideally, we convert filterFn to Supabase queries.
            // For now, to keep API compatible with existing code, we fetch all and filter client-side.
            // TODO: Optimize this for production with real queries.
            const records = await this.getAllRecords(tableName);
            return records.filter(filterFn);
        } else {
            const records = this.getAllRecordsLocalStorage(tableName);
            return records.filter(filterFn);
        }
    }

    async countRecords(tableName, filterFn = null) {
        if (this.storage === 'supabase') {
            // Optimized count for no-filter case
            if (!filterFn) {
                const { count, error } = await db_client.from(tableName).select('*', { count: 'exact', head: true });
                return error ? 0 : count;
            }

            const records = await this.getAllRecords(tableName);
            return records.filter(filterFn).length;
        } else {
            const records = this.getAllRecordsLocalStorage(tableName);
            return filterFn ? records.filter(filterFn).length : records.length;
        }
    }

    // ============================================
    // LEAD-SPECIFIC OPERATIONS (Async wrappers)
    // ============================================

    async createLead(leadData) {
        const lead = new LeadModel(leadData);
        // Validate locally first
        const validation = lead.validate();
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        // Check duplicates (Optimized for Supabase)
        const duplicate = await this.checkDuplicate(lead.phone, lead.email);
        if (duplicate) {
            throw new Error(`Duplicate lead found: ${duplicate.name} (${duplicate.phone})`);
        }

        // Calculate score
        lead.lead_score = this.calculateLeadScore(lead);

        // Insert
        try {
            const savedLead = await this.insertRecord('leads', lead.toJSON());

            // Log activity
            await this.logActivity({
                lead_id: savedLead.lead_id,
                activity_type: 'lead_created',
                description: `Lead ${savedLead.name} was created from source ${savedLead.source}`,
                performed_by: savedLead.assigned_to || 'system'
            });

            return savedLead;
        } catch (e) {
            throw e;
        }
    }

    async updateLead(leadId, updates) {
        const updated = await this.updateRecord('leads', leadId, updates);

        if (updated) {
            await this.logActivity({
                lead_id: leadId,
                activity_type: 'lead_updated',
                description: `Lead information was updated`,
                metadata: updates
            });
        }
        return updated;
    }

    async updateLeadStatus(leadId, newStatus) {
        const lead = await this.getRecordById('leads', leadId);
        const oldStatus = lead?.status;

        const updated = await this.updateRecord('leads', leadId, {
            status: newStatus
        });

        if (updated) {
            await this.logActivity({
                lead_id: leadId,
                activity_type: 'status_changed',
                description: `Status changed from ${oldStatus} to ${newStatus}`,
                metadata: { old_status: oldStatus, new_status: newStatus }
            });
        }
        return updated;
    }

    async checkDuplicate(phone, email) {
        if (this.storage === 'supabase') {
            // OR query: phone = X OR email = Y
            let query = db_client.from('leads').select('*').or(`phone.eq.${phone}`);
            if (email) {
                query = db_client.from('leads').select('*').or(`phone.eq.${phone},email.eq.${email}`);
            }
            const { data, error } = await query;
            if (error || !data) return null;
            return data.length > 0 ? data[0] : null;

        } else {
            const leads = this.getAllRecordsLocalStorage('leads');
            return leads.find(lead =>
                (lead.phone === phone) ||
                (email && lead.email === email)
            );
        }
    }

    // ============================================
    // ACTIVITY OPERATIONS
    // ============================================

    async logActivity(activityData) {
        const activity = new ActivityModel(activityData);
        return await this.insertRecord('activities', activity.toJSON());
    }

    async getLeadActivities(leadId, limit = 50) {
        if (this.storage === 'supabase') {
            const { data, error } = await db_client
                .from('activities')
                .select('*')
                .eq('lead_id', leadId)
                .order('created_at', { ascending: false })
                .limit(limit);

            return error ? [] : data;
        } else {
            const activities = this.queryRecords('activities', activity =>
                activity.lead_id === leadId
            );
            activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            return limit ? activities.slice(0, limit) : activities;
        }
    }

    async getRecentActivities(limit = 10) {
        if (this.storage === 'supabase') {
            const { data, error } = await db_client
                .from('activities')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);
            return error ? [] : data;
        } else {
            const activities = this.getAllRecordsLocalStorage('activities');
            activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            return activities.slice(0, limit);
        }
    }

    // Phase 2 Compatibility
    async getActivitiesForLead(leadId) {
        return this.getLeadActivities(leadId);
    }

    async getNotesForLead(leadId) {
        // We'll use activities of type 'note_added' as notes, or you might have a 'notes' table
        // For simplicity, let's look for activities with 'note_added' type
        const activities = await this.getLeadActivities(leadId);
        return activities
            .filter(a => a.activity_type === 'note_added' || a.activity_type === 'note')
            .map(a => ({
                note_id: a.activity_id,
                lead_id: a.lead_id,
                content: a.description,
                created_at: a.created_at,
                created_by: a.performed_by
            }));
    }

    async addNote(noteData) {
        return this.logActivity({
            lead_id: noteData.lead_id,
            activity_type: 'note_added',
            description: noteData.content,
            performed_by: noteData.created_by
        });
    }

    async scheduleFollowup(followupData) {
        // Implement followup storage (using 'follow_ups' table or activity)
        if (this.storage === 'supabase') {
            const { data, error } = await db_client
                .from('follow_ups')
                .insert([followupData])
                .select();
            if (error) throw error;
            return data[0];
        } else {
            return this.insertRecordLocalStorage('follow_ups', followupData);
        }
    }

    // ============================================
    // ANALYTICS & REPORTING
    // ============================================

    async getDashboardStats() {
        const leads = await this.getAllRecords('leads');
        const totalLeads = leads.length;
        const wonLeads = leads.filter(l => l.status === 'Won').length;
        const lostLeads = leads.filter(l => l.status === 'Lost').length;
        const activeLeads = totalLeads - wonLeads - lostLeads;

        const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

        const totalRevenue = leads
            .filter(l => l.status === 'Won' && l.budget)
            .reduce((sum, l) => sum + parseFloat(l.budget || 0), 0);

        const projectedRevenue = leads
            .filter(l => !['Won', 'Lost'].includes(l.status) && l.budget)
            .reduce((sum, l) => sum + parseFloat(l.budget || 0), 0);

        const avgResponseTime = '45s'; // Mock

        return {
            totalLeads,
            activeLeads,
            wonLeads,
            lostLeads,
            conversionRate,
            totalRevenue,
            projectedRevenue,
            avgResponseTime
        };
    }

    // ... Additional analytics methods would follow similar async patterns ...
    // For brevity, using the generic queryRecords which is now async compatible.

    async getLeadsByStatusCount() {
        const leads = await this.getAllRecords('leads');
        const statusCounts = {};
        leads.forEach(lead => {
            statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
        });
        return statusCounts;
    }
}


// ============================================
// GLOBAL DATABASE INSTANCE
// ============================================

window.DB = new DatabaseManager();

// Also expose models for global use
window.LeadModel = LeadModel;
window.ActivityModel = ActivityModel;
window.UserModel = UserModel;
window.DatabaseManager = DatabaseManager;

// Export for use in other modules (Node/CommonJS)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DB: window.DB, LeadModel, ActivityModel, UserModel, DatabaseManager };
}
