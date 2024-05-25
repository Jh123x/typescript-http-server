import { afterEach, describe, expect, test } from "bun:test";
import * as net from 'net';
import * as path from 'path';
import * as fs from "fs";
import { connectionHandler } from './main';


const addr = 'localhost';
const baseDirectory = path.dirname(__dirname);

describe("main", () => {
    describe("/", () => {
        test("should return 200 Ok", (done) => {
            testServerFn(
                3000,
                done,
                "GET / HTTP/1.1\r\nHost: localhost:3000\r\n\r\n",
                "HTTP/1.1 200 OK\r\n\r\n",
            )
        });
    });

    describe("/echo", () => {
        test("should return 200 Ok with body", (done) => {
            testServerFn(
                3001,
                done,
                "GET /echo/test HTTP/1.1\r\nHost: localhost:3000\r\n\r\n",
                "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 4\r\n\r\ntest",
            )
        });
        test("should return header if content encoding is present", (done) => {
            testServerFn(
                3002,
                done,
                "GET /echo/foo HTTP/1.1\r\nHost: localhost:3000\r\nAccept-Encoding: gzip\r\n\r\n",
                "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Encoding: gzip\r\nContent-Length: 23\r\n\r\n\u001f�\b\u0000\u0000\u0000\u0000\u0000\u0000\u0003K��\u0007\u0000!es�\u0003\u0000\u0000\u0000",
            )
        });

        test("should not return header if content encoding is invalid", (done) => {
            testServerFn(
                3003,
                done,
                "GET /echo/test HTTP/1.1\r\nHost: localhost:3000\r\nAccept-Encoding: random\r\n\r\n",
                "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 4\r\n\r\ntest",
            )
        });

        test("should only use supported headers", (done) => {
            testServerFn(
                3004,
                done,
                "GET /echo/foo HTTP/1.1\r\nHost: localhost:3000\r\nAccept-Encoding: random, random1, no_supported, gzip\r\n\r\n",
                "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Encoding: gzip\r\nContent-Length: 23\r\n\r\n\u001f�\b\u0000\u0000\u0000\u0000\u0000\u0000\u0003K��\u0007\u0000!es�\u0003\u0000\u0000\u0000",
            )
        })
    });

    describe("/not_found", () => {
        test("should return 404", (done) => {
            testServerFn(
                3005,
                done,
                "GET /not_found HTTP/1.1\r\nHost: localhost:3000\r\n\r\n",
                "HTTP/1.1 404 Not Found\r\n\r\n",
            )
        });
    })

    describe("/user-agent", () => {
        test("should return 200 Ok with body", (done) => {
            testServerFn(
                3006,
                done,
                "GET /user-agent HTTP/1.1\r\nHost: localhost:3000\r\nUser-Agent: test\r\n\r\n",
                "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 4\r\n\r\ntest",
            )
        });
    });

    describe("/files", () => {
        describe("GET", () => {
            test("should return gitignore contents", (done) => {
                testServerFn(
                    3007,
                    done,
                    "GET /files/.gitignore HTTP/1.1\r\nHost: localhost:3000\r\n\r\n",
                    "HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: 15\r\n\r\nnode_modules/\n",
                    baseDirectory,
                )
            });

            test("should return 404", (done) => {
                testServerFn(
                    3008,
                    done,
                    "GET /files/not_found HTTP/1.1\r\nHost: localhost:3000\r\n\r\n",
                    "HTTP/1.1 404 Not Found\r\n\r\n",
                    baseDirectory,
                )
            });
        });

        describe("POST", () => {
            test("should return 201 Created", (done) => {
                testServerFn(
                    3009,
                    done,
                    "POST /files/test.txt HTTP/1.1\r\nHost: localhost:3000\r\n\r\nHello, World!\r\n",
                    "HTTP/1.1 201 Created\r\n\r\n",
                    baseDirectory,
                    () => {
                        const tmpPath = path.join(baseDirectory, "test.txt");
                        expect(fs.existsSync(tmpPath)).toBeTrue();

                        const contents = fs.readFileSync(tmpPath, 'utf8');
                        expect(contents).toBe("Hello, World!\r\n");
                        fs.rmSync(tmpPath);
                    }
                )
            });
        });
    });
});


const testServerFn = (port: number, done: any, req: string, expectedResp: string, directory: string = "", callback: Function = () => { }) => {
    const server = net.createServer(connectionHandler(directory));
    server.listen(port, addr, () => {
        const client = net.connect({ port });
        client.on("connect", () => {
            console.log("Connected to server");
            client.write(req);
        });

        client.on("data", (data: Buffer) => {
            expect(data.toString()).toBe(expectedResp);
            server.close();
        });

        client.on("error", () => {
            expect(false).toBeTrue();
        })

        client.on("close", () => {
            client.end();
            callback();
            done();
        })

        afterEach(() => {
            done();
        })
    });
};