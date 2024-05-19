
interface ParsedHttpRequest {
    status: string;
    headers: Map<string, string>;
    body: string;
    success: boolean;
}


export const parseHttpRequest = (httpContent: string): ParsedHttpRequest => {
    try {
        const [meta, body] = httpContent.split('\r\n\r\n');
        const [statusLine, ...headers] = meta.split('\r\n');

        return {
            status: statusLine,
            headers: parseHeaders(headers),
            body: body,
            success: true
        };

    } catch {
        return {
            status: "",
            headers: new Map(),
            body: "",
            success: false
        }
    }
}

const parseHeaders = (headers: string[]): Map<string, string> => {
    if (headers.length === 0) {
        return new Map();
    }

    const headerMap = new Map<string, string>();
    headers.forEach(header => {
        const [key, value] = header.split(':');
        if (!key || !value) return;
        headerMap.set(key.trim(), value.trim());
    });
    return headerMap;
}


interface ParsedHeader {
    url: string
    method: string
}

export const parseStatus = (header: string): ParsedHeader => {
    const [method, url, _] = header.split(" ");
    return { method, url };
}