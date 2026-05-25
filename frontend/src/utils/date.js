export const formatDateTimeLong = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return date.toLocaleString();
};

export const formatDateTimeShort = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return date.toLocaleDateString();
};