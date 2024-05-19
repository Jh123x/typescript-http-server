import { responseWriter, Response } from "../parser/response_builder";
import { Method } from "./zip";


export const handleEcho = (headers: Map<string, string>, rest: string[], body: string): Response => {
    const encodingHeader = headers.get(`Accept-Encoding`) ?? ""
    const respHeaders = encodingHeader.split(",")
        .map(e => e.trim())
        .filter(e => Object.values(Method).includes(e as Method))

    if (respHeaders.length > 0) {
        return responseWriter(200, [`Content-Type: text/plain`], rest.join("/"), respHeaders[0] as Method)
    }

    return responseWriter(200, [`Content-Type: text/plain`], rest.join("/"))
}