import fs from "fs";
import path from "path";
import { responseWriter, Response } from "../parser/response_builder";


export const handleFile = (method: string, directory: string, rest: string[], body: string): Response => {
    console.log("Handling file request: ", method, directory, rest, body)
    if (directory.length == 0 || rest.length === 0) return responseWriter(404, [], "");
    const filePath = path.join(directory, rest.join("/"));
    switch (method) {
        case "GET":
            return handleGet(filePath);
        case "POST":
            console.log("HIT")
            return handlePost(filePath, body);
        default:
            return responseWriter(404, [], "")
    }
}

const handlePost = (filePath: string, body: string): Response => {
    console.log("Writing to file: ", filePath, ", with contents: ", body)
    fs.writeFileSync(filePath, body);
    return responseWriter(201, [], "")
}


const handleGet = (readPath: string): Response => {
    try {
        const data = fs.readFileSync(readPath, 'utf8')
        return responseWriter(200, [`Content-Type: application/octet-stream`], data)
    } catch {
        return responseWriter(404, [], "")
    }
}