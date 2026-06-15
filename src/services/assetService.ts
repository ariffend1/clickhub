import { supabase } from '../lib/supabase';

export const assetService = {
  // --- ASSETS ---
  async getAssets() {
    const { data, error } = await supabase.from('Asset').select('*');
    if (error) throw error;
    return data || [];
  },

  async insertAsset(payload: any) {
    const { error } = await supabase.from('Asset').insert([payload]);
    if (error) throw error;
  },

  async updateAsset(id: string, payload: any) {
    const { error } = await supabase.from('Asset').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteAsset(id: string) {
    const { error } = await supabase.from('Asset').delete().eq('id', id);
    if (error) throw error;
  },

  // --- INVENTORY ---
  async getInventories() {
    const { data, error } = await supabase.from('Inventory').select('*');
    if (error) throw error;
    return data || [];
  },

  async getInventoryById(id: string) {
    const { data, error } = await supabase
      .from('Inventory')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async insertInventory(payload: any) {
    const { error } = await supabase.from('Inventory').insert([payload]);
    if (error) throw error;
  },

  async updateInventoryQuantity(id: string, quantity: number) {
    const { error } = await supabase
      .from('Inventory')
      .update({ quantity, updatedAt: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  // --- INVENTORY TRANSACTIONS ---
  async insertInventoryTransaction(payload: any) {
    const { error } = await supabase.from('InventoryTransaction').insert([payload]);
    if (error) throw error;
  },

  // --- PART REQUESTS ---
  async getPartRequests() {
    const { data, error } = await supabase.from('PartRequest').select('*');
    if (error) throw error;
    return data || [];
  },

  async getPartRequestById(id: string) {
    const { data, error } = await supabase
      .from('PartRequest')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async insertPartRequest(payload: any) {
    const { error } = await supabase.from('PartRequest').insert([payload]);
    if (error) throw error;
  },

  async updatePartRequestStatus(id: string, payload: any) {
    const { error } = await supabase
      .from('PartRequest')
      .update({ ...payload, updatedAt: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  // --- STOCK REQUESTS ---
  async getStockRequests() {
    const { data, error } = await supabase.from('StockRequest').select('*');
    if (error) throw error;
    return data || [];
  },

  async getStockRequestById(id: string) {
    const { data, error } = await supabase
      .from('StockRequest')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async insertStockRequest(payload: any) {
    const { error } = await supabase.from('StockRequest').insert([payload]);
    if (error) throw error;
  },

  async updateStockRequestStatus(id: string, payload: any) {
    const { error } = await supabase
      .from('StockRequest')
      .update({ ...payload, updatedAt: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  // --- MAINTENANCE SCHEDULES ---
  async getMaintenanceSchedules() {
    const { data, error } = await supabase.from('MaintenanceSchedule').select('*');
    if (error) throw error;
    return data || [];
  },

  async insertMaintenanceSchedule(payload: any) {
    const { error } = await supabase.from('MaintenanceSchedule').insert([payload]);
    if (error) throw error;
  },

  async updateMaintenanceSchedule(id: string, payload: any) {
    const { error } = await supabase.from('MaintenanceSchedule').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteMaintenanceSchedule(id: string) {
    const { error } = await supabase.from('MaintenanceSchedule').delete().eq('id', id);
    if (error) throw error;
  }
};
