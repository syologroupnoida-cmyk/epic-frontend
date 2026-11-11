const endpoint = '/admin/ecommerce/subcategories';
const record = (value) => value && typeof value === 'object' && !Array.isArray(value);
export const ecommerceSubcategoryId = (row) => String(row?.ecommerceSubcategoryId || row?.id || row?._id || '');
export const ecommerceSubcategoryError = (error) => error?.response?.data?.message || error?.message || 'Unable to load subcategories. Please try again.';

export function validateEcommerceSubcategory(values) {
  const errors = {};
  if (typeof values.categoryId !== 'string' || !values.categoryId.trim()) errors.categoryId = 'Choose a parent category.';
  if (typeof values.name !== 'string' || !values.name.trim()) errors.name = 'Enter a subcategory name.';
  const fields = values.specificationTemplate?.fields;
  if (!Array.isArray(fields)) errors.specificationTemplate = 'Add a valid specification template.';
  else {
    const keys = new Set();
    for (const [index, field] of fields.entries()) {
      const prefix = `Field ${index + 1}: `;
      if (!record(field) || typeof field.key !== 'string' || !/^[A-Za-z][A-Za-z0-9_]*$/.test(field.key.trim())) { errors.specificationTemplate = `${prefix}enter a field key using letters, numbers and underscores.`; break; }
      if (keys.has(field.key.trim().toLowerCase())) { errors.specificationTemplate = `${prefix}use a unique field key.`; break; }
      keys.add(field.key.trim().toLowerCase());
      if (typeof field.label !== 'string' || !field.label.trim()) { errors.specificationTemplate = `${prefix}enter a display label.`; break; }
      if (!['SELECT', 'BOOLEAN'].includes(field.type)) { errors.specificationTemplate = `${prefix}choose Select or Boolean.`; break; }
      if (typeof field.required !== 'boolean') { errors.specificationTemplate = `${prefix}choose whether this field is required.`; break; }
      if (field.type === 'SELECT' && (!Array.isArray(field.options) || !field.options.length || field.options.some((option) => typeof option !== 'string' || !option.trim()) || new Set(field.options.map((option) => option.trim().toLowerCase())).size !== field.options.length)) { errors.specificationTemplate = `${prefix}add at least one option and remove empty or duplicate options.`; break; }
    }
  }
  return errors;
}

export function ecommerceSubcategoryPayload(values) {
  const errors = validateEcommerceSubcategory(values);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  return { categoryId: values.categoryId.trim(), name: values.name.trim(), specificationTemplate: { fields: values.specificationTemplate.fields.map((field) => ({ key: field.key.trim(), label: field.label.trim(), type: field.type, required: field.required, ...(field.type === 'SELECT' ? { options: field.options.map((option) => option.trim()) } : {}) })) } };
}

function unwrap(response) {
  const body = response?.data;
  if (body?.success === false) throw new Error(body.message || 'The subcategory request failed.');
  return record(body) && Object.hasOwn(body, 'data') ? body.data : body;
}

export async function createEcommerceSubcategory(api, values, signal) {
  const response = await api.post(endpoint, ecommerceSubcategoryPayload(values), { signal });
  const data = unwrap(response);
  return { subcategory: data?.subcategory ?? data?.ecommerceSubcategory ?? data, message: response.data?.message || 'Subcategory created successfully.' };
}

export async function fetchEcommerceSubcategories(api, { categoryId = '', signal } = {}) {
  const response = await api.get(endpoint, { signal, ...(categoryId ? { params: { categoryId } } : {}) });
  const data = unwrap(response);
  const items = Array.isArray(data) ? data : data?.subcategories ?? data?.ecommerceSubcategories ?? data?.items ?? data?.results;
  if (!Array.isArray(items) || items.some((item) => !record(item))) throw new Error('The server returned an invalid subcategory list.');
  return { items };
}

export function filterEcommerceSubcategories(items, search, categories = []) {
  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter((row) => {
    const parentId = row.categoryId || row.category?.ecommerceCategoryId || row.category?.id;
    const parent = categories.find((item) => (item.ecommerceCategoryId || item.id || item._id) === parentId);
    const fields = row.specificationTemplate?.fields;
    const text = [row.name, row.category?.name, parent?.name, ...(Array.isArray(fields) ? fields.flatMap((field) => [field?.label, field?.key]) : [])].filter(Boolean).join(' ').toLowerCase();
    return words.every((word) => text.includes(word));
  });
}
