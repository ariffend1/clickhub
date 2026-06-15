import { supabase } from '../lib/supabase';

export const knowledgeService = {
  async getArticles() {
    const { data, error } = await supabase.from('Article').select('*');
    if (error) throw error;
    return data || [];
  },

  async insertArticle(payload: any) {
    const { error } = await supabase.from('Article').insert([payload]);
    if (error) throw error;
  },

  async updateArticle(id: string, payload: any) {
    const { error } = await supabase
      .from('Article')
      .update({ ...payload, updatedAt: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async deleteArticle(id: string) {
    const { error } = await supabase.from('Article').delete().eq('id', id);
    if (error) throw error;
  }
};
