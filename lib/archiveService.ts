import { supabase, Database } from './supabase';

export type Archive = Database['public']['Tables']['archives']['Row'];

export const archiveService = {
  async getAllArchives(limit?: number, offset?: number, contentType?: string): Promise<{ data: Archive[], hasMore: boolean }> {
    try {
      const limitValue = limit || 10;
      const offsetValue = offset || 0;

      let query = supabase
        .from('archives')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (contentType && contentType !== 'All') {
        query = query.eq('content_type', contentType);
      }

      const { data, error, count } = await query.range(offsetValue, offsetValue + limitValue - 1);

      if (error) {
        console.error('Error fetching archives:', error);
        throw error;
      }

      const hasMore = count ? offsetValue + limitValue < count : false;
      return { data: data || [], hasMore };
    } catch (error) {
      console.error('Error in getAllArchives:', error);
      throw error;
    }
  },

  async getArchiveById(id: number): Promise<Archive | null> {
    try {
      const { data, error } = await supabase
        .from('archives')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching archive by id:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getArchiveById:', error);
      throw error;
    }
  },

  async getArchivesByContentType(contentType: string): Promise<Archive[]> {
    try {
      const { data, error } = await supabase
        .from('archives')
        .select('*')
        .eq('content_type', contentType)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching archives by content type:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getArchivesByContentType:', error);
      throw error;
    }
  },

  async searchArchives(query: string): Promise<Archive[]> {
    try {
      const { data, error } = await supabase
        .from('archives')
        .select('*')
        .or(`archive_name.ilike.%${query}%,place_of_origin.ilike.%${query}%,languages.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching archives:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchArchives:', error);
      throw error;
    }
  }
};
