const createDisplayName = (fullName: string): string => {
    const nameMap: Record<string, string> = {
        "American Express® Virtual Reward Card (6 Month Expiration) US":
            "Amex Virtual Card",
        "Mastercard Prepaid Reward (£1 to £150) GB": "Mastercard Prepaid",
        "Swype Global Virtual Visa® 3 years ($100 to $499.99) USD US":
            "Swype Visa ($100-$499)",
        "Swype Global Virtual Visa® 3 years ($5 to $99.99) US USD":
            "Swype Visa ($5-$99)",
        "CBSi Paramount Plus": "Paramount Plus",
        "Banana Republic (GAP) US": "Banana Republic",
        "Binance (USDT) US": "Binance USDT",
        "Binance Global (USDT) US": "Binance Global USDT",
    };

    if (nameMap[fullName]) {
        return nameMap[fullName];
    }

    let displayName = fullName;

    displayName = displayName
        .replace(/^App Store & iTunes\s*/i, "iTunes ")
        .replace(/^Mobile Legends Diamonds\s*/i, "Mobile Legends ")
        .replace(/^NetDragon Universal\s*/i, "NetDragon ")
        .replace(/^Crypto Giftcard\s*/i, "Crypto Card ")
        .trim();

    return displayName;
};

export { createDisplayName };
