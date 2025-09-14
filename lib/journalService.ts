import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';
import { v4 as uuidv4 } from 'uuid';

export interface JournalEntry {
  id: string;
  created_at: string;
  user_id: string;
  monastery_id: string;
  title?: string;
  content: string;
  image_urls: string[];
  latitude?: number;
  longitude?: number;
}

export interface CreateJournalEntryData {
  monastery_id: string;
  title?: string;
  content: string;
  images: ImagePicker.ImagePickerAsset[];
  latitude?: number;
  longitude?: number;
}

export const createJournalEntry = async (data: CreateJournalEntryData): Promise<JournalEntry> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Upload images to Supabase Storage
  const imageUrls: string[] = [];
  for (const image of data.images) {
    try {
      // Generate a UUID filename and store directly in bucket root
      const fileName = `${uuidv4()}.jpg`;
      
      // Use FormData for React Native compatibility
      const formData = new FormData();
      formData.append('file', {
        uri: image.uri,
        type: 'image/jpeg',
        name: fileName,
      } as any);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('journal_images')
        .upload(fileName, formData, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        continue; // Skip this image if upload fails
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('journal_images')
        .getPublicUrl(fileName);

      imageUrls.push(publicUrl);
      
    } catch (error) {
      console.error('Error processing image:', error);
      // Continue with other images if one fails
    }
  }

  // Insert journal entry
  const { data: entry, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: user.id,
      monastery_id: data.monastery_id,
      title: data.title,
      content: data.content,
      image_urls: imageUrls,
      latitude: data.latitude,
      longitude: data.longitude,
    })
    .select()
    .single();

  if (error) throw error;
  return entry;
};

export const getJournalEntriesForUser = async (): Promise<JournalEntry[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const updateJournalEntry = async (
  entryId: string,
  updates: Partial<Pick<JournalEntry, 'title' | 'content'>>
): Promise<JournalEntry> => {
  const { data, error } = await supabase
    .from('journal_entries')
    .update(updates)
    .eq('id', entryId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteJournalEntry = async (entryId: string): Promise<void> => {
  // First, get the journal entry to retrieve image URLs
  const { data: entry, error: fetchError } = await supabase
    .from('journal_entries')
    .select('image_urls')
    .eq('id', entryId)
    .single();

  if (fetchError) {
    // If the entry doesn't exist, that's fine - it's already "deleted"
    if (fetchError.code === 'PGRST116') {
      return;
    }
    throw fetchError;
  }

  // Delete associated images from storage
  if (entry && entry.image_urls && entry.image_urls.length > 0) {
    for (const imageUrl of entry.image_urls) {
      try {
        // Extract the file path from the public URL
        // URL format: https://[project].supabase.co/storage/v1/object/public/journal_images/[filename]
        const urlParts = imageUrl.split('/storage/v1/object/public/journal_images/');
        if (urlParts.length === 2) {
          const fileName = urlParts[1];
          
          const { error: deleteError } = await supabase.storage
            .from('journal_images')
            .remove([fileName]);

          if (deleteError) {
            console.warn('Error deleting image:', fileName, deleteError);
          }
        }
      } catch (error) {
        console.warn('Error processing image deletion:', imageUrl, error);
      }
    }
  }

  // Delete the journal entry
  const { error: deleteError } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', entryId);

  if (deleteError) throw deleteError;
};

export const getJournalEntryById = async (entryId: string): Promise<JournalEntry> => {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', entryId)
    .single();

  if (error) throw error;
  return data;
};

// Simple test function to debug storage issues
export const testStorageConnection = async (): Promise<void> => {
  try {
    console.log('Testing storage connection...');
    
    // Test 1: Check if we can list buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.error('Bucket list error:', bucketError);
      return;
    }
    console.log('Available buckets:', buckets?.map(b => b.name));
    
    // Test 2: Check if journal_images bucket exists and is accessible
    const { data: files, error: listError } = await supabase.storage
      .from('journal_images')
      .list('', { limit: 1 });
    
    if (listError) {
      console.error('Journal images bucket error:', listError);
      return;
    }
    console.log('Journal images bucket accessible, files:', files?.length || 0);
    
  } catch (error) {
    console.error('Storage connection test failed:', error);
  }
};
