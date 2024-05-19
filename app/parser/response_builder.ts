import { Method } from "../handler/zip"

const codeMessage = {
    200: "OK",
    201: "Created",
    400: "Bad Request",
    404: "Not Found",
    500: "Internal Server Error"
}

export interface Response {
    code: number,
    msg: string
    headers: string[],
    body: string,
    encoding: Method,
}

export const responseWriter = (code: number, headers: string[], body: string, encoding: Method = Method.NoEncoding): Response => {
    let codeMsg = codeMessage[code]
    if (codeMsg === undefined) {
        codeMsg = codeMessage[500]
    }

    return {
        code: code,
        msg: codeMsg,
        headers: headers,
        body: body,
        encoding: encoding,
    }
}