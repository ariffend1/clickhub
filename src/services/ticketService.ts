import { supabase } from '../lib/supabase';

export const ticketService = {
  async getAllTickets() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data, error } = await supabase
      .from('Ticket')
      .select('*')
      .or(`status.neq.CLOSED,createdAt.gte.${thirtyDaysAgo.toISOString()}`)
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getArchivedTickets() {
    const { data, error } = await supabase
      .from('Ticket')
      .select('*')
      .eq('status', 'CLOSED')
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createTicket(ticket: any) {
    const { error } = await supabase.from('Ticket').insert([ticket]);
    if (error) throw error;
  },

  async updateTicket(id: string, updates: any) {
    const { error } = await supabase
      .from('Ticket')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  async requestDeleteTicket(id: string) {
    const { error } = await supabase
      .from('Ticket')
      .update({ isDeleteRequested: true, updatedAt: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async deleteTicketPermanently(id: string) {
    const { error } = await supabase
      .from('Ticket')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async updateArchiveStatus(id: string, isArchived: boolean, isDeleteRequested: boolean) {
    const { error } = await supabase
      .from('Ticket')
      .update({ 
        isArchived, 
        isDeleteRequested, 
        updatedAt: new Date().toISOString() 
      })
      .eq('id', id);
    if (error) throw error;
  },

  async getAttachments() {
    const { data, error } = await supabase
      .from('Attachment')
      .select('*')
      .order('uploadedAt', { ascending: true });
    if (error) throw error;
    return data || [];
  }
};
