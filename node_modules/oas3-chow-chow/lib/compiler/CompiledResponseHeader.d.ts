import { HeadersObject } from 'openapi3-ts';
import { ChowOptions } from '..';
export default class CompiledResponseHeader {
    private compiledSchema;
    private headerSchema;
    /**
     * If a response header is defined with the name "Content-Type", it SHALL be ignored.
     */
    private ignoreHeaders;
    constructor(headers: HeadersObject | undefined, options: Partial<ChowOptions>);
    validate(header?: any): void;
}
