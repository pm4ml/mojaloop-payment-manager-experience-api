import { ResponseObject } from 'openapi3-ts';
import { ResponseMeta } from '.';
import { ChowOptions } from '..';
export default class CompiledResponse {
    private compiledResponseHeader;
    private content;
    constructor(response: ResponseObject, options: Partial<ChowOptions>);
    validate(response: ResponseMeta): any;
}
