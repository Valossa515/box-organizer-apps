export interface ItemModel {
  id: string;
  name: string;
  description: string;
  boxId: string;
  boxName?: string;
  quantity: number;
  imgUrl?: string;
  userId?: string;
  createdAt?: string;
}

export type ItemOrderBy = 'ID' | 'NAME' | 'DESCRIPTION' | 'QUANTITY' | 'CREATED_AT';