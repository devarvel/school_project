export const CLASS_LEVELS = [
    { id: 1, name: "Primary 1" },
    { id: 2, name: "Primary 2" },
    { id: 3, name: "Primary 3" },
    { id: 4, name: "Primary 4" },
    { id: 5, name: "Primary 5" },
    { id: 6, name: "JSS 1" },
    { id: 7, name: "JSS 2" },
    { id: 8, name: "JSS 3" },
    { id: 9, name: "SSS 1" },
    { id: 10, name: "SSS 2" },
    { id: 11, name: "SSS 3" }
];

// Provide backwards compatibility for existing imports
export const LEVELS = CLASS_LEVELS.map(c => c.id);
export const FINAL_LEVEL = 11;

export function getClassName(level: number): string {
    const classObj = CLASS_LEVELS.find(c => c.id === level);
    return classObj ? classObj.name : `Level ${level}`;
}

// Alias for getClassName to not break existing imports
export const getClassLabel = getClassName;

const PRIMARY_SUBJECTS = [
    "Mathematics",
    "English Language",
    "Basic Science and Technology",
    "Religion and National Value",
    "Pre-vocational Studies",
    "Cultural and Creative Art",
    "History",
    "Quantitative Reasoning",
    "Verbal Reasoning",
    "Literature",
    "Handwriting"
];

const JSS_SUBJECTS = [
    "Business Studies",
    "B.S.T",
    "English Language",
    "P.V.S",
    "Mathematics",
    "N.V",
    "C.R.S",
    "Literature",
    "History",
    "C.C.A"
];

const SSS_SUBJECTS = [
    "Mathematics",
    "Commerce",
    "Marketing",
    "English Language",
    "Biology",
    "Chemistry",
    "Economics",
    "Agricultural Science",
    "Computer",
    "Government",
    "Literature in English",
    "Physics",
    "History",
    "Financial Accounting",
    "Geography",
    "C.R.S",
    "Civic Education"
];

export function getSubjectsForLevel(level: number): string[] {
    if (level >= 1 && level <= 5) return PRIMARY_SUBJECTS;
    if (level >= 6 && level <= 8) return JSS_SUBJECTS;
    if (level >= 9 && level <= 11) return SSS_SUBJECTS;
    return [];
}

export function getCurrentSession(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0 is January, 8 is September

    // In Nigeria, academic sessions typically start in September
    if (month >= 8) {
        return `${year}/${year + 1}`;
    } else {
        return `${year - 1}/${year}`;
    }
}

export function getSessionOptions(): string[] {
    const current = getCurrentSession();
    const [startYear] = current.split('/').map(Number);

    const options = [];
    // Range: 2023/2024 up to 3 years from current start year
    const baseYear = 2023;
    const maxYear = Math.max(startYear + 2, 2027);

    for (let y = baseYear; y <= maxYear; y++) {
        options.push(`${y}/${y + 1}`);
    }

    return options.sort((a, b) => b.localeCompare(a)); // Newest first
}
