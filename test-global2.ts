export {};
declare global {
    var prismaGlobal: string | undefined;
}
const p = prismaGlobal ?? "test";
if (process.env.NODE_ENV !== "production") {
    globalThis.prismaGlobal = p;
}
