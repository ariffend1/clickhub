import { supabase } from '../lib/supabase';

export const userService = {
  // --- USERS ---
  async getUsers() {
    const { data, error } = await supabase.from('User').select('*');
    if (error) throw error;
    return data || [];
  },

  async getUserByEmailMaybe(email: string) {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getUserByEmailSingle(email: string) {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    if (error) throw error;
    return data;
  },

  async insertUser(payload: any) {
    const { error } = await supabase.from('User').insert([payload]);
    if (error) throw error;
  },

  // --- AUDIT LOGS ---
  async getAuditLogs() {
    const { data, error } = await supabase
      .from('AuditLog')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(250);
    if (error) throw error;
    return data || [];
  },

  async insertAuditLog(payload: any) {
    const { error } = await supabase.from('AuditLog').insert([payload]);
    if (error) throw error;
  },

  // --- NOTIFICATIONS ---
  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('Notification')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async insertNotifications(payloads: any[]) {
    const { error } = await supabase.from('Notification').insert(payloads);
    if (error) throw error;
  },

  async markNotificationRead(id: string) {
    const { error } = await supabase
      .from('Notification')
      .update({ isRead: true })
      .eq('id', id);
    if (error) throw error;
  },

  async markAllNotificationsRead(userId: string) {
    const { error } = await supabase
      .from('Notification')
      .update({ isRead: true })
      .eq('userId', userId)
      .eq('isRead', false);
    if (error) throw error;
  },

  async clearNotifications(userId: string) {
    const { error } = await supabase
      .from('Notification')
      .delete()
      .eq('userId', userId);
    if (error) throw error;
  }
};
