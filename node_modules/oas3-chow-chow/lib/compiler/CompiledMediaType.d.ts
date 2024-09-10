import { MediaTypeObject } from 'openapi3-ts';
import * as Ajv from 'ajv';
export default class CompiledMediaType {
    private name;
    private compiledSchema;
    constructor(name: string, mediaType: MediaTypeObject, opts?: Ajv.Options);
    validate(value: any): any;
    static extractMediaType(contentType: string | undefined): string | undefined;
}
