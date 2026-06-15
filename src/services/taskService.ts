import { supabase } from '../lib/supabase';

export const taskService = {
  // --- SPACES ---
  async getSpaces() {
    const { data, error } = await supabase
      .from('Space')
      .select('*')
      .order('order');
    if (error) throw error;
    return data || [];
  },

  async insertSpace(payload: any) {
    const { error } = await supabase.from('Space').insert([payload]);
    if (error) throw error;
  },

  async updateSpace(id: string, payload: any) {
    const { error } = await supabase.from('Space').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteSpace(id: string) {
    const { error } = await supabase.from('Space').delete().eq('id', id);
    if (error) throw error;
  },

  // --- TASK LISTS ---
  async getTaskLists() {
    const { data, error } = await supabase
      .from('TaskList')
      .select('*')
      .order('order');
    if (error) throw error;
    return data || [];
  },

  async insertTaskList(payload: any) {
    const { error } = await supabase.from('TaskList').insert([payload]);
    if (error) throw error;
  },

  async updateTaskList(id: string, payload: any) {
    const { error } = await supabase.from('TaskList').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteTaskList(id: string) {
    const { error } = await supabase.from('TaskList').delete().eq('id', id);
    if (error) throw error;
  },

  // --- TASKS ---
  async getTasks() {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    const { data, error } = await supabase
      .from('Task')
      .select('*')
      .or(`status.neq.DONE,createdAt.gte.${fifteenDaysAgo.toISOString()}`);
    if (error) throw error;
    return data || [];
  },

  async insertTask(payload: any) {
    const { error } = await supabase.from('Task').insert([payload]);
    if (error) throw error;
  },

  async updateTask(id: string, payload: any) {
    const { error } = await supabase.from('Task').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteTask(id: string) {
    const { error } = await supabase.from('Task').delete().eq('id', id);
    if (error) throw error;
  },

  // --- CHECKLIST / SUBTASKS ---
  async getChecklists(taskIds: string[]) {
    if (!taskIds || taskIds.length === 0) return [];
    const { data, error } = await supabase
      .from('Checklist')
      .select('*')
      .in('taskId', taskIds);
    if (error) throw error;
    return data || [];
  },

  async insertChecklist(payload: any) {
    const { error } = await supabase.from('Checklist').insert([payload]);
    if (error) throw error;
  },

  async updateChecklist(id: string, payload: any) {
    const { error } = await supabase.from('Checklist').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteChecklist(id: string) {
    const { error } = await supabase.from('Checklist').delete().eq('id', id);
    if (error) throw error;
  },

  // --- COMMENTS ---
  async insertComment(payload: any) {
    const { error } = await supabase.from('Comment').insert([payload]);
    if (error) throw error;
  },

  async deleteComment(id: string) {
    const { error } = await supabase.from('Comment').delete().eq('id', id);
    if (error) throw error;
  },

  // --- UTILITY / COMBINED READS ---
  async getDefaultSpaceAndList() {
    const { data: dbSpaces, error: spaceError } = await supabase
      .from('Space')
      .select('id')
      .order('order')
      .limit(1);
    if (spaceError) throw spaceError;

    if (dbSpaces && dbSpaces.length > 0) {
      const defSpaceId = dbSpaces[0].id;
      const { data: dbLists, error: listError } = await supabase
        .from('TaskList')
        .select('id')
        .eq('spaceId', defSpaceId)
        .limit(1);
      if (listError) throw listError;

      return {
        spaceId: defSpaceId,
        listId: dbLists && dbLists.length > 0 ? dbLists[0].id : null
      };
    }

    return { spaceId: null, listId: null };
  }
};
