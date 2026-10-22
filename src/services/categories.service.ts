import { apiClient } from './api-client';

export interface CategoryAttribute {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  parentId?: string | null;
  children?: Category[];
  displayOrder?: number;
  attributes?: CategoryAttribute[];
  _count?: {
    listings: number;
  };
}

export const categoriesService = {
  getCategories: async (format: 'tree' | 'flat' = 'tree'): Promise<Category[]> => {
    const res = await apiClient.get<{ success: boolean; data: Category[] }>(
      `/categories?format=${format}`
    );
    return res.data;
  },

  getCategoryByIdOrSlug: async (idOrSlug: string): Promise<Category> => {
    const res = await apiClient.get<{ success: boolean; data: Category }>(
      `/categories/${idOrSlug}`
    );
    return res.data;
  },

  getCategoryAttributes: async (idOrSlug: string): Promise<CategoryAttribute[]> => {
    const res = await apiClient.get<{ success: boolean; data: CategoryAttribute[] }>(
      `/categories/${idOrSlug}/attributes`
    );
    return res.data;
  },
};
