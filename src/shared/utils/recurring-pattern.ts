export function calculateNextScheduledDate(
    currentDate: Date,
    pattern: string,
): Date {
    const nextDate = new Date(currentDate);

    switch (pattern.toLowerCase()) {
        case "daily":
            nextDate.setDate(nextDate.getDate() + 1);
            break;

        case "weekly":
            nextDate.setDate(nextDate.getDate() + 7);
            break;

        case "monthly":
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;

        case "weekdays":
            do {
                nextDate.setDate(nextDate.getDate() + 1);
            } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
            break;

        case "weekends":
            do {
                nextDate.setDate(nextDate.getDate() + 1);
            } while (nextDate.getDay() !== 0 && nextDate.getDay() !== 6);
            break;

        default:
            // Handle interval patterns like "every-3-days", "every-2-weeks"
            if (pattern.startsWith("every-") && pattern.includes("-days")) {
                const days = parseInt(pattern.match(/every-(\d+)-days/)?.[1] || "1");
                nextDate.setDate(nextDate.getDate() + days);
            } else if (pattern.startsWith("every-") && pattern.includes("-weeks")) {
                const weeks = parseInt(pattern.match(/every-(\d+)-weeks/)?.[1] || "1");
                nextDate.setDate(nextDate.getDate() + weeks * 7);
            } else if (pattern.startsWith("every-") && pattern.includes("-months")) {
                const months = parseInt(
                    pattern.match(/every-(\d+)-months/)?.[1] || "1",
                );
                nextDate.setMonth(nextDate.getMonth() + months);
            }
            // Handle specific weekdays like "monday,wednesday,friday"
            else if (
                pattern.includes(",") &&
                isNaN(Number(pattern.split(",")[0].charAt(0)))
            ) {
                const daysOfWeek = pattern
                    .toLowerCase()
                    .split(",")
                    .map((d) => d.trim());
                const dayMap: { [key: string]: number } = {
                    sunday: 0,
                    monday: 1,
                    tuesday: 2,
                    wednesday: 3,
                    thursday: 4,
                    friday: 5,
                    saturday: 6,
                };

                const targetDays = daysOfWeek
                    .map((day) => dayMap[day])
                    .filter((day) => day !== undefined)
                    .sort((a, b) => a - b);

                if (targetDays.length > 0) {
                    const currentDay = nextDate.getDay();
                    let daysToAdd = 1;

                    // Find next occurrence of target days
                    for (let i = 1; i <= 7; i++) {
                        const testDay = (currentDay + i) % 7;
                        if (targetDays.includes(testDay)) {
                            daysToAdd = i;
                            break;
                        }
                    }

                    nextDate.setDate(nextDate.getDate() + daysToAdd);
                }
            }
            // Handle specific dates like "1,15" (1st and 15th of month)
            else if (pattern.includes(",") && !isNaN(Number(pattern.split(",")[0]))) {
                const daysOfMonth = pattern
                    .split(",")
                    .map((d) => parseInt(d.trim()))
                    .sort((a, b) => a - b);
                const currentDay = nextDate.getDate();

                let nextDay = daysOfMonth.find((day) => day > currentDay);

                if (nextDay) {
                    nextDate.setDate(nextDay);
                } else {
                    // Move to next month and use first day in pattern
                    nextDate.setMonth(nextDate.getMonth() + 1);
                    nextDate.setDate(daysOfMonth[0]);
                }
            }
            // Default to daily if pattern not recognized
            else {
                nextDate.setDate(nextDate.getDate() + 1);
            }
            break;
    }

    return nextDate;
}

// Validate if a recurring pattern is valid
export function isValidRecurringPattern(pattern: string): boolean {
    const validSimplePatterns = [
        "daily",
        "weekly",
        "monthly",
        "weekdays",
        "weekends",
    ];

    if (validSimplePatterns.includes(pattern.toLowerCase())) {
        return true;
    }

    // Check interval patterns
    if (/^every-\d+-(days|weeks|months)$/.test(pattern)) {
        return true;
    }

    // Check weekday patterns
    const weekdays = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
    ];
    if (pattern.includes(",") && !pattern.match(/\d/)) {
        const days = pattern
            .toLowerCase()
            .split(",")
            .map((d) => d.trim());
        return days.every((day) => weekdays.includes(day));
    }

    // Check day-of-month patterns
    if (pattern.includes(",") && pattern.match(/^\d+(,\d+)*$/)) {
        const days = pattern.split(",").map((d) => parseInt(d.trim()));
        return days.every((day) => day >= 1 && day <= 31);
    }

    return false;
}

// Get human-readable description of a recurring pattern
export function getRecurringPatternDescription(pattern: string): string {
    switch (pattern.toLowerCase()) {
        case "daily":
            return "Every day";
        case "weekly":
            return "Every week";
        case "monthly":
            return "Every month";
        case "weekdays":
            return "Every weekday (Mon-Fri)";
        case "weekends":
            return "Every weekend (Sat-Sun)";
        default:
            if (pattern.startsWith("every-") && pattern.includes("-days")) {
                const days = pattern.match(/every-(\d+)-days/)?.[1];
                return `Every ${days} days`;
            }
            if (pattern.startsWith("every-") && pattern.includes("-weeks")) {
                const weeks = pattern.match(/every-(\d+)-weeks/)?.[1];
                return `Every ${weeks} weeks`;
            }
            if (pattern.startsWith("every-") && pattern.includes("-months")) {
                const months = pattern.match(/every-(\d+)-months/)?.[1];
                return `Every ${months} months`;
            }
            if (pattern.includes(",") && !pattern.match(/\d/)) {
                return `On ${pattern}`;
            }
            if (pattern.includes(",") && pattern.match(/^\d+(,\d+)*$/)) {
                const days = pattern.split(",").join(", ");
                return `On day ${days} of each month`;
            }
            return pattern;
    }
}
