import { type ZodType } from "zod";

type StructuredFormData =
  | string
  | boolean
  | number
  | File
  | null
  | StructuredFormData[];

export function formBody(body: FormData) {
  return [...body.entries()].reduce((data, [k, v]) => {

    let value: StructuredFormData = v;
    if (v === "true" || v == "on") value = true;
    else if (v === "false") value = false;
    else if ((v as string).trim() == "") value = null;
    else if (!isNaN(Number(v))) value = Number(v);

    // For grouped fields like multi-selects and checkboxes, we need to
    // store the values in an array.
    let keyIsArray = false;
    if (k.endsWith('[]')) {
      k = k.slice(0, -2);
      keyIsArray = true;
    }

    if (k in data) {
      const val = data[k];
      data[k] = Array.isArray(val) ? [...val, value] : [val, value];
    } else 
      data[k] = keyIsArray ? [value] : value;

    return data;
  }, {} as Record<string, StructuredFormData>);
}

Request.prototype.validate = async function(schema: ZodType) {
    const contentType = this.headers.get('Content-Type') ?? "";
    
    let data;
    if (contentType.includes('application/json')) {
        data = await this.json();
    } else if (contentType.includes('multipart/form-data')) {
        data = formBody(await this.formData());
    } else {
        throw new Error('Unsupported Content-Type');
    }

    const validation = await schema.safeParseAsync(data);
    if (!validation.success) {
        const errors: { [key: string]: unknown } = {};
        for (const error of validation.error.errors)
            errors[error.path.join('.')] = error.message;

        return { ...data, errors }
    }
    else 
        return validation.data;
}