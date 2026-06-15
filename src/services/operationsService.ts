import { supabase } from '../lib/supabase';

export const operationsService = {
  // --- HOLIDAYS ---
  async getHolidays() {
    const { data, error } = await supabase
      .from('Holiday')
      .select('*')
      .order('date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // --- EQUIPMENT CHECKOUTS ---
  async getEquipmentCheckouts() {
    const { data, error } = await supabase
      .from('EquipmentCheckout')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async insertEquipmentCheckout(payload: any) {
    const { error } = await supabase.from('EquipmentCheckout').insert([payload]);
    if (error) throw error;
  },

  async updateEquipmentCheckout(id: string, payload: any) {
    const { error } = await supabase
      .from('EquipmentCheckout')
      .update({ ...payload, updatedAt: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  // --- CHECKOUT ITEMS ---
  async getCheckoutItems() {
    const { data, error } = await supabase.from('CheckoutItem').select('*');
    if (error) throw error;
    return data || [];
  },

  async getCheckoutItemById(id: string) {
    const { data, error } = await supabase
      .from('CheckoutItem')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getRemainingCheckoutItems(checkoutId: string) {
    const { data, error } = await supabase
      .from('CheckoutItem')
      .select('*')
      .eq('checkoutId', checkoutId)
      .eq('scannedIn', false);
    if (error) throw error;
    return data || [];
  },

  async insertCheckoutItem(payload: any) {
    const { error } = await supabase.from('CheckoutItem').insert([payload]);
    if (error) throw error;
  },

  async updateCheckoutItem(id: string, payload: any) {
    const { error } = await supabase
      .from('CheckoutItem')
      .update(payload)
      .eq('id', id);
    if (error) throw error;
  },

  // --- GOODS RECEIPTS ---
  async getGoodsReceipts() {
    const { data, error } = await supabase
      .from('GoodsReceipt')
      .select('*')
      .order('receivedAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async insertGoodsReceipt(payload: any) {
    const { error } = await supabase.from('GoodsReceipt').insert([payload]);
    if (error) throw error;
  }
};
