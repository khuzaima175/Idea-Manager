import { Idea } from '../types';
import { dbGetAll, dbPut, dbDelete, dbClear } from '../utils/db';

const STORAGE_KEY = 'ideaflow_data_v1';

// Migration function to move data from localStorage to IndexedDB
export const migrateFromLocalStorage = async (): Promise<void> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const ideas: Idea[] = JSON.parse(data);
      for (const idea of ideas) {
        await dbPut(idea);
      }
      // Optional: clear localStorage after migration or keep as backup
      // localStorage.removeItem(STORAGE_KEY);
      console.log('Migration to IndexedDB successful');
    }
  } catch (e) {
    console.error('Migration failed', e);
  }
};

export const getIdeas = async (): Promise<Idea[]> => {
  try {
    return await dbGetAll();
  } catch (e) {
    console.error("Failed to load ideas", e);
    return [];
  }
};

export const saveIdea = async (idea: Idea): Promise<void> => {
  await dbPut(idea);
};

export const deleteIdea = async (id: string): Promise<void> => {
  await dbDelete(id);
};

export const toggleFavorite = async (id: string): Promise<void> => {
  const ideas = await getIdeas();
  const idea = ideas.find(i => i.id === id);
  if (idea) {
    await dbPut({ ...idea, isFavorite: !idea.isFavorite });
  }
};

export const exportVault = async () => {
  const ideas = await getIdeas();
  const dataStr = JSON.stringify(ideas, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

  const exportFileDefaultName = `ideaflow_vault_backup_${new Date().toISOString().slice(0, 10)}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const importVault = async (jsonString: string): Promise<boolean> => {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      await dbClear();
      for (const idea of parsed) {
        await dbPut(idea);
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error("Failed to import vault", e);
    return false;
  }
};