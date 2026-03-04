import { supabase } from './supabase.js';

// =============================================================================
// Supabase Database Layer
// All methods are async. Services must await them.
// =============================================================================

class SupabaseDB {
    constructor() {
        this._cache = {};
    }

    // ---- Generic Table CRUD ----

    async getAll(table, filters = {}, orderBy = null) {
        let query = supabase.from(table).select('*');

        Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
        });

        if (orderBy) {
            query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
        }

        const { data, error } = await query;
        if (error) {
            console.error(`DB getAll(${table}):`, error);
            return [];
        }
        return data || [];
    }

    async getOne(table, idField, idValue) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq(idField, idValue)
            .maybeSingle();

        if (error) {
            console.error(`DB getOne(${table}):`, error);
            return null;
        }
        return data;
    }

    async insert(table, row) {
        const { data, error } = await supabase
            .from(table)
            .insert(row)
            .select()
            .single();

        if (error) {
            console.error(`DB insert(${table}):`, error);
            return null;
        }
        return data;
    }

    async upsert(table, row, options = {}) {
        const { data, error } = await supabase
            .from(table)
            .upsert(row, options)
            .select()
            .single();

        if (error) {
            console.error(`DB upsert(${table}):`, error);
            return null;
        }
        return data;
    }

    async update(table, idField, idValue, updates) {
        const { data, error } = await supabase
            .from(table)
            .update(updates)
            .eq(idField, idValue)
            .select()
            .single();

        if (error) {
            console.error(`DB update(${table}):`, error);
            return null;
        }
        return data;
    }

    async deleteRow(table, idField, idValue) {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq(idField, idValue);

        if (error) {
            console.error(`DB delete(${table}):`, error);
            return false;
        }
        return true;
    }

    async deleteWhere(table, filters) {
        let query = supabase.from(table).delete();
        Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
        });
        const { error } = await query;
        if (error) {
            console.error(`DB deleteWhere(${table}):`, error);
            return false;
        }
        return true;
    }

    async count(table, filters = {}) {
        let query = supabase.from(table).select('*', { count: 'exact', head: true });
        Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
        });
        const { count, error } = await query;
        if (error) {
            console.error(`DB count(${table}):`, error);
            return 0;
        }
        return count || 0;
    }

    // ---- App State (key-value store for misc config) ----

    async getState(key) {
        const row = await this.getOne('app_state', 'key', key);
        return row ? row.value : null;
    }

    async setState(key, value) {
        return await this.upsert('app_state', {
            key,
            value: typeof value === 'object' ? value : JSON.parse(JSON.stringify(value)),
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
    }
}

export const db = new SupabaseDB();
