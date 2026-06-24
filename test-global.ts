export {};
declare global {
    var prismaGlobal: string | undefined;
}
const p = globalThis.prismaGlobal ?? "test";
if (process.env.NODE_ENV !== "production") {
    globalThis.prismaGlobal = p;
}
