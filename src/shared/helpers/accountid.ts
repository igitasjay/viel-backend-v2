export function generateAccountID(): string {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < 10; i++) {
        result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return result;
}
