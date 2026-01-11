export const CLASS_MAPPING: Record<number, string> = {
    1: "Primary 1",
    2: "Primary 2",
    3: "Primary 3",
    4: "Primary 4",
    5: "Primary 5",
    6: "JSS 1",
    7: "JSS 2",
    8: "JSS 3",
    9: "SS 1",
    10: "SS 2",
    11: "SS 3",
};

export function getClassLabel(level: number): string {
    return CLASS_MAPPING[level] || `Level ${level}`;
}

export const LEVELS = Object.keys(CLASS_MAPPING).map(Number).sort((a, b) => a - b);
export const FINAL_LEVEL = 11;
