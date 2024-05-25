import { afterEach, describe, expect, test } from "bun:test";
import * as net from 'net';
import * as path from 'path';
import * as fs from "fs";
import { connectionHandler } from './main';


const addr = 'localhost';
const port = 3000;
const baseDirectory = path.dirname(__dirname);

describe("main", () => {
    describe("/", () => {
        test("should return 200 Ok", (done) => {
            testServerFn(
                done,
                "GET / HTTP/1.1\r\nHost: localhost:3000\r\n\r\n",
                "HTTP/1.1 200 OK\r\n\r\n",
            )
        });
    });

    describe("/echo", () => {
        test("should return 200 Ok with body", (done) => {
            testServerFn(
                done,
                "GET /echo/test HTTP/1.1\r\nHost: localhost:3000\r\n\r\n",
                "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 4\r\n\r\ntest",
            )
        });
        test("should return header if content encoding is present", (done) => {
            testServerFn(
                done,
                "GET /echo/foo HTTP/1.1\r\nHost: localhost:3000\r\nAccept-Encoding: gzip\r\n\r\n",
                "HTTP/1.1 200 OK\r\nContent-Encoding: gzip\r\nContent-Type: text/plain\r\nContent-Length: 46\r\n\r\n1f8b08008c643b6602ff4bcbcf07002165738c03000000",
            )
        });

        test("should not return header if content encoding is invalid", (done) => {
            testServerFn(
                done,
                "GET /echo/test HTTP/1.1\r\nHost: localhost:3000\r\nAccept-Encoding: random\r\n\r\n",
                "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 4\r\n\r\ntest",
            )
        });

        test("should only use supported headers", (done) => {
            testServerFn(
                done,
                "GET /echo/foo HTTP/1.1\r\nHost: localhost:3000\r\nAccept-Encoding: random, random1, no_supported, gzip\r\n\r\n",
                "HTTP/1.1 200 OK\r\nContent-Encoding: gzip\r\nContent-Type: text/plain\r\nContent-Length: 46\r\n\r\n1f8b08008c643b6602ff4bcbcf07002165738c03000000",
            )
        })
    });

    describe("/not_found", () => {
        test("should return 404", (done) => {
            testServerFn(
                done,
                "GET /not_found HTTP/1.1\r\nHost: localhost:3000\r\n\r\n",
                "HTTP/1.1 404 Not Found\r\n\r\n",
            )
        });
    })

    describe("/user-agent", () => {
        test("should return 200 Ok with body", (done) => {
            testServerFn(
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
                    done,
                    "GET /files/.gitignore HTTP/1.1\r\nHost: localhost:3000\r\n\r\n",
                    "HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: 15\r\n\r\nnode_modules/\r\n",
                    baseDirectory,
                )
            });

            test("should return 404", (done) => {
                testServerFn(
                    done,
                    "GET /files/not_found HTTP/1.1\r\nHost: localhost:3000\r\n\r\n",
                    "HTTP/1.1 404 Not Found\r\n\r\n",
                    baseDirectory,
                )
            });
        });

        describe("POST", () => {
            test.skip("should return 201 Created", (done) => {
                testServerFn(
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


const testServerFn = (done: any, req: string, expectedResp: string, directory: string = "", callback: Function = () => { }) => {
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