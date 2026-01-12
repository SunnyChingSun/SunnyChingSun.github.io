export function getDecimalYear(item) {
    let decimalYear = parseFloat(item.year);
    if (item.date) {
        const parts = item.date.split(' '); // "Sep. 2023"
        if (parts.length >= 2) {
            const monthStr = parts[0].replace('.', '').substr(0, 3).toLowerCase();
            const yearStr = parts[parts.length - 1];
            const months = {
                'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
                'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
            };
            if (months.hasOwnProperty(monthStr) && !isNaN(yearStr)) {
                decimalYear = parseInt(yearStr) + (months[monthStr] / 12);
            }
        }
    }
    return isNaN(decimalYear) ? parseFloat(item.year) : decimalYear;
}

export function parseDateStr(str) {
    if (!str) return NaN;
    const parts = str.split(' ');
    if (parts.length >= 2) {
        const monthStr = parts[0].replace('.', '').substr(0, 3).toLowerCase();
        const yearStr = parts[parts.length - 1];
        const months = {
            'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
            'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };
        if (months.hasOwnProperty(monthStr) && !isNaN(yearStr)) {
            return parseInt(yearStr) + (months[monthStr] / 12);
        }
    }
    return parseFloat(str);
}
