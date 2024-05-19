import { parseHttpRequest, parseStatus } from "../parser/parser";
import { responseWriter, Response } from "../parser/response_builder";
import { handleUserAgent } from "./agent";
import { handleEcho } from "./echo";
import { handleFile } from "./file";

export const handleConnection = (data: Buffer, directory: string): Response => {
    const req = data.toString();
    console.log("Request received: ", req);
    const resp = handleResp(req, directory);
    console.log("Response sent: ", resp);
    return resp;
}

// handleResp is exported for testing.
export const handleResp = (req: string, directory: string): Response => {
    const { success, headers, body, status } = parseHttpRequest(req) ?? ["", "", ""];
    if (!success) {
        return responseWriter(400, [], "")
    }

    const { method, url } = parseStatus(status);
    const [_, baseURL, ...segments] = url.split("/");
    switch (baseURL) {
        case "":
            return responseWriter(200, [], "")
        case "echo":
            return handleEcho(headers, segments, body)
        case "user-agent":
            return handleUserAgent(headers, segments);
        case "files":
            return handleFile(method, directory, segments, body)
        default:
            return responseWriter(404, [], "")
    }
}