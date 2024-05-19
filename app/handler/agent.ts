import { responseWriter, Response } from "../parser/response_builder";


export const handleUserAgent = (headers: Map<string, string>, segments: string[]): Response => {
    if (segments.length > 0) return responseWriter(404, [], "")

    const agent = headers.get(`User-Agent`) ?? ""
    return responseWriter(200, [`Content-Type: text/plain`], agent)
}