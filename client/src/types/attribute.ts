export type AttributeCategory = "CERTIFICATION" | "DOMAIN_KNOWLEDGE" | "PERSONAL_INFORMATION" | "SOFT_SKILLS";
export type AttributeDataType = "STRING" | "TEXT" | "IMAGE" | "NUMERIC" | "DATE" | "PERIOD" | "BOOLEAN" | "ONE_OF_MANY";

export interface Attribute {
  id: string;
  name: string;
  category: AttributeCategory;
  dataType: AttributeDataType;
  options: string[];
  createdAt: string;
}
