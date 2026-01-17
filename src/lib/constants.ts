export const CLASS_MAPPING: Record<number, string> = {
    1: "KG 1",
    2: "KG 2",
    3: "KG 3",
    4: "Primary 1",
    5: "Primary 2",
    6: "Primary 3",
    7: "Primary 4",
    8: "Primary 5",
    9: "JSS 1",
    10: "JSS 2",
    11: "JSS 3",
    12: "SS 1",
    13: "SS 2",
    14: "SS 3",
};

export function getClassLabel(level: number): string {
    return CLASS_MAPPING[level] || `Level ${level}`;
}

export const LEVELS = Object.keys(CLASS_MAPPING).map(Number).sort((a, b) => a - b);
export const FINAL_LEVEL = 14;
