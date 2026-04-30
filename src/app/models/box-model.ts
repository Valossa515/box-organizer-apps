export interface BoxModel {
  id: string;
  name: string;
  description: string;
  imgUrl?: string;
  userId?: string;
  createdAt?: string;
}

export type BoxOrderBy = 'ID' | 'NAME' | 'DESCRIPTION' | 'CREATED_AT';
export type SortDirection = 'ASC' | 'DESC';