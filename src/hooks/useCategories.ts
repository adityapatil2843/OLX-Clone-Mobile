import { useQuery } from '@tanstack/react-query';
import { categoriesService, Category } from '../services/categories.service';

export const CATEGORY_QUERY_KEYS = {
  all: ['categories'] as const,
  tree: () => [...CATEGORY_QUERY_KEYS.all, 'tree'] as const,
  flat: () => [...CATEGORY_QUERY_KEYS.all, 'flat'] as const,
  detail: (idOrSlug: string) => [...CATEGORY_QUERY_KEYS.all, 'detail', idOrSlug] as const,
  attributes: (idOrSlug: string) => [...CATEGORY_QUERY_KEYS.all, 'attributes', idOrSlug] as const,
};

export const useCategoriesQuery = (format: 'tree' | 'flat' = 'tree') => {
  return useQuery<Category[]>({
    queryKey: format === 'tree' ? CATEGORY_QUERY_KEYS.tree() : CATEGORY_QUERY_KEYS.flat(),
    queryFn: () => categoriesService.getCategories(format),
  });
};

export const useCategoryDetailQuery = (idOrSlug: string) => {
  return useQuery({
    queryKey: CATEGORY_QUERY_KEYS.detail(idOrSlug),
    queryFn: () => categoriesService.getCategoryByIdOrSlug(idOrSlug),
    enabled: Boolean(idOrSlug),
  });
};

export const useCategoryAttributesQuery = (idOrSlug: string) => {
  return useQuery({
    queryKey: CATEGORY_QUERY_KEYS.attributes(idOrSlug),
    queryFn: () => categoriesService.getCategoryAttributes(idOrSlug),
    enabled: Boolean(idOrSlug),
  });
};
