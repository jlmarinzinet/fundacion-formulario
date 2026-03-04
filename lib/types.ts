export type OptionItem = {
  id: string;
  label: string;
  slug?: string;
};

export type RawMetadataItem = {
  id: string;
  name: string;
  slug?: string;
};

export type MetadataPayload = {
  autores?: Array<string | RawMetadataItem>;
  categorias?: Array<string | RawMetadataItem>;
  etiquetas?: Array<string | RawMetadataItem>;
  organizaciones?: Array<string | RawMetadataItem>;
};

export type MetadataResponse = MetadataPayload | MetadataPayload[];

export type MetadataOptions = {
  authors: OptionItem[];
  categories: OptionItem[];
  tags: OptionItem[];
  organizations: OptionItem[];
};
