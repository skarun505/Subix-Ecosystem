import { db } from '../core/database.js';
import { supabase } from '../core/supabase.js';

// Seed Data Initialization (Supabase-backed)
// This checks if seed data already exists in Supabase and skips if so.
// The primary seed data is inserted via the SQL migration script.

export async function initializeSeedData() {
    try {
        // Check if already initialized
        const state = await db.getState('initialized');
        if (state) {
            console.log('✅ Supabase already initialized with seed data');
            return;
        }

        console.log('🔄 Checking Supabase seed data...');

        // Check if users exist
        const userCount = await db.count('users');
        if (userCount === 0) {
            console.log('⚠️ No users found — run the SQL migration script in Supabase SQL Editor first!');
            console.log('📄 See: supabase_migration.sql');
            return;
        }

        console.log(`✅ Found ${userCount} users in Supabase`);

        // Mark as initialized locally
        await db.setState('initialized', true);
        console.log('✅ Supabase seed data verified');

    } catch (error) {
        console.error('❌ Error checking seed data:', error);
    }
}

// Generate sample attendance data for demo purposes
export async function generateSampleAttendanceData() {
    try {
        const { data: activeUsers } = await supabase
            .from('users')
            .select('id, employee_id, name')
            .eq('status', 'active');

        if (!activeUsers || activeUsers.length === 0) {
            console.log('No active users found for attendance data generation');
            return;
        }

        const now = new Date();
        const records = [];

        for (let i = 0; i < 30; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            if (date.getDay() === 0 || date.getDay() === 6) continue;

            const dateStr = date.toISOString().split('T')[0];

            for (const user of activeUsers) {
                const inVariation = Math.floor(Math.random() * 45) - 15;
                const inHour = 10;
                const inMin = 0 + inVariation;
                const inTime = `${String(inHour).padStart(2, '0')}:${String(Math.max(0, inMin)).padStart(2, '0')}`;

                const outVariation = Math.floor(Math.random() * 60) - 15;
                const outHour = 19;
                const outMin = 0 + outVariation;
                const outTime = `${String(outHour).padStart(2, '0')}:${String(Math.max(0, outMin)).padStart(2, '0')}`;

                const workingHours = (outHour * 60 + outMin - inHour * 60 - inMin) / 60;
                const isLate = inMin > 15;

                records.push({
                    employee_id: user.id,
                    employee_name: user.name,
                    date: dateStr,
                    in_time: inTime,
                    out_time: outTime,
                    break_logs: [],
                    status: 'present',
                    working_hours: Math.round(workingHours * 100) / 100,
                    is_late: isLate,
                    is_early_checkout: false,
                    overtime_hours: Math.max(0, Math.round((workingHours - 8) * 100) / 100),
                    source: 'generated',
                    shift_id: 'GS',
                    shift_name: 'General Shift'
                });
            }
        }

        // Upsert in batches
        const batchSize = 50;
        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            const { error } = await supabase
                .from('attendance')
                .upsert(batch, { onConflict: 'employee_id,date' });

            if (error) console.error('Batch insert error:', error);
        }

        console.log(`✅ Generated ${records.length} attendance records`);
    } catch (error) {
        console.error('Error generating attendance data:', error);
    }
}
