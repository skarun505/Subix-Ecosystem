/**
 * @subix/db — Shared Database Module
 * ====================================
 * Provides a unified Supabase client and common database helpers
 * for all Subix products.
 * 
 * Usage:
 *   import { supabase, getRecords, insertRecord, updateRecord, deleteRecord } from '@subix/db';
 */

import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseKey } from '@subix/config';

// ─── Supabase Client (Singleton) ────────────────────────────
export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Generic CRUD Helpers ───────────────────────────────────

/**
 * Fetch all records from a table with optional filters
 * @param {string} table - Table name
 * @param {Object} options - { select, filters, orderBy, limit }
 */
export async function getRecords(table, options = {}) {
    let query = supabase.from(table).select(options.select || '*');

    if (options.filters) {
        for (const [column, value] of Object.entries(options.filters)) {
            query = query.eq(column, value);
        }
    }

    if (options.orderBy) {
        query = query.order(options.orderBy.column, {
            ascending: options.orderBy.ascending ?? false,
        });
    }

    if (options.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

/**
 * Get a single record by ID
 */
export async function getRecordById(table, id, idField = 'id') {
    const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(idField, id)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Insert a record into a table
 */
export async function insertRecord(table, record) {
    const { data, error } = await supabase
        .from(table)
        .insert([record])
        .select();

    if (error) throw error;
    return data[0];
}

/**
 * Update a record by ID
 */
export async function updateRecord(table, id, updates, idField = 'id') {
    const { data, error } = await supabase
        .from(table)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq(idField, id)
        .select();

    if (error) throw error;
    return data[0];
}

/**
 * Delete a record by ID
 */
export async function deleteRecord(table, id, idField = 'id') {
    const { error } = await supabase
        .from(table)
        .delete()
        .eq(idField, id);

    if (error) throw error;
    return true;
}

/**
 * Count records in a table with optional filters
 */
export async function countRecords(table, filters = {}) {
    let query = supabase.from(table).select('*', { count: 'exact', head: true });

    for (const [column, value] of Object.entries(filters)) {
        query = query.eq(column, value);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count;
}

/**
 * Upsert a record (insert or update if exists)
 */
export async function upsertRecord(table, record, conflictColumn = 'id') {
    const { data, error } = await supabase
        .from(table)
        .upsert([record], { onConflict: conflictColumn })
        .select();

    if (error) throw error;
    return data[0];
}
