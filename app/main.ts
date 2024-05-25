import * as net from 'net';
import zlib from "zlib";
import { processArgs } from './cmd_line/argument_processor';
import { handleConnection } from './handler/handler';
import { Method } from './handler/zip';


export const connectionHandler = (directory: string) => (conn: net.Socket) => {
    conn.on('data', (data: Buffer) => {
        const resp = handleConnection(data, directory);
        let respBody: Buffer;
        switch (resp.encoding) {
            case Method.Gzip: {
                respBody = zlib.gzipSync(Buffer.from(resp.body, 'utf-8'));
                resp.headers.push(`Content-Encoding: ${resp.encoding}`);
                break;
            }
            default: {
                respBody = Buffer.from(resp.body);
                break;
            }
        }

        if (respBody.length > 0) {
            resp.headers.push(`Content-Length: ${respBody.length}`);
        }

        conn.write(`HTTP/1.1 ${resp.code} ${resp.msg}\r\n`);
        for (const header of resp.headers) {
            conn.write(`${header}\r\n`);
        }
        conn.write('\r\n');
        conn.write(respBody);
        conn.end();
    });
}

const args = process.argv.slice(2);
const parsedArgs = processArgs(args);
const server = net.createServer(connectionHandler(parsedArgs.get('directory') ?? ""));

// Uncomment this to pass the first stage
server.listen(4221, 'localhost', () => {
    console.log('Server is running on port 4221');
});
