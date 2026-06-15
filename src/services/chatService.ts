import { supabase } from '../lib/supabase';

export const chatService = {
  async getChatSessions() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data, error } = await supabase
      .from('ChatSession')
      .select('*')
      .or(`status.neq.CLOSED,createdAt.gte.${sevenDaysAgo.toISOString()}`)
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getChatMessages(sessionIds?: string[]) {
    if (sessionIds && sessionIds.length === 0) return [];
    let query = supabase.from('ChatMessage').select('*');
    if (sessionIds) {
      query = query.in('sessionId', sessionIds);
    }
    const { data, error } = await query.order('createdAt', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getActiveSessionByEmployee(employeeId: string) {
    const { data, error } = await supabase
      .from('ChatSession')
      .select('*')
      .eq('employeeId', employeeId)
      .neq('status', 'CLOSED')
      .limit(1);
    if (error) throw error;
    return data || [];
  },

  async getMessagesBySessionId(sessionId: string) {
    const { data, error } = await supabase
      .from('ChatMessage')
      .select('*')
      .eq('sessionId', sessionId)
      .order('createdAt', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async insertChatSession(payload: any) {
    const { error } = await supabase.from('ChatSession').insert([payload]);
    if (error) throw error;
  },

  async updateChatSession(id: string, payload: any) {
    const { error } = await supabase
      .from('ChatSession')
      .update({ ...payload, updatedAt: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async insertChatMessage(payload: any) {
    const { error } = await supabase.from('ChatMessage').insert([payload]);
    if (error) throw error;
  }
};
