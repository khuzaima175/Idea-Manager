import { Idea } from '../types';

const STORAGE_KEY = 'ideaflow_data_v1';

export const getIdeas = (): Idea[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load ideas", e);
    return [];
  }
};

export const saveIdea = (idea: Idea): void => {
  const ideas = getIdeas();
  const existingIndex = ideas.findIndex(i => i.id === idea.id);

  if (existingIndex !== -1) {
    // Update existing idea in place
    ideas[existingIndex] = idea;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
  } else {
    // Prepend new idea
    const updated = [idea, ...ideas];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
};

export const deleteIdea = (id: string): void => {
  const ideas = getIdeas();
  const updated = ideas.filter(i => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const toggleFavorite = (id: string): void => {
  const ideas = getIdeas();
  const updated = ideas.map(idea =>
    idea.id === id ? { ...idea, isFavorite: !idea.isFavorite } : idea
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const exportVault = () => {
  const ideas = getIdeas();
  const dataStr = JSON.stringify(ideas, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

  const exportFileDefaultName = `ideaflow_vault_backup_${new Date().toISOString().slice(0, 10)}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const importVault = (jsonString: string): boolean => {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      // Basic validation: check if first item looks like an Idea
      if (parsed.length > 0 && (!parsed[0].id || !parsed[0].title)) {
        throw new Error("Invalid format");
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return true;
    }
    return false;
  } catch (e) {
    console.error("Failed to import vault", e);
    return false;
  }
};