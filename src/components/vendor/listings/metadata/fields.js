import { metadataSchemas } from './index';

export const normalizeName = (value) => String(value || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
export const fieldLabel = (key) => key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase());
const matches = (schema, name) => [schema.name, ...schema.aliases].some((alias) => normalizeName(alias) === normalizeName(name));

export function getMetadataFields(categoryName, subcategoryName, existing = {}) {
    const category = normalizeName(categoryName).replace(/services$/, '');
    const categorySchema = metadataSchemas.find((schema) => {
        const name = normalizeName(schema.name).replace(/services$/, '');
        return category && (name === category || name.startsWith(category) || category.startsWith(name));
    });
    const subcategorySchema = metadataSchemas.find((schema) => matches(schema, subcategoryName));
    // Category resolves names shared by Bridal Wear and Groom Wear (e.g. Indo Western).
    const schema = categorySchema && matches(categorySchema, subcategoryName) ? categorySchema : subcategorySchema || categorySchema;
    const extra = Object.entries(schema?.extraFields || {}).find(([name]) => normalizeName(name) === normalizeName(subcategoryName))?.[1] || {};
    const examples = { ...schema?.fields, ...extra };
    return [...new Set([...Object.keys(examples), ...Object.keys(existing)])].map((key) => {
        const example = examples[key] ?? existing[key];
        return { key, label: fieldLabel(key), type: Array.isArray(example) ? 'array' : example !== null && typeof example === 'object' ? 'object' : typeof example, example };
    });
}

export function serializeMetadata(values, fields) {
    const result = {};
    for (const field of fields) {
        const value = values[field.key];
        if (value === '' || value === undefined || value === null) continue;
        if (field.type === 'number') {
            const number = Number(value);
            if (!Number.isFinite(number) || number < 0) throw new Error(`${field.label} must be a valid non-negative number.`);
            result[field.key] = number;
        } else if (field.type === 'boolean') {
            result[field.key] = value === true || value === 'true';
        } else if (field.type === 'array') {
            result[field.key] = Array.isArray(value) ? value : String(value).split(',').map((item) => item.trim()).filter(Boolean);
        } else if (field.type === 'object') {
            const parsed = typeof value === 'string' ? JSON.parse(value) : value;
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(`${field.label} must be a JSON object.`);
            result[field.key] = parsed;
        } else {
            result[field.key] = String(value).trim();
        }
    }
    return result;
}
