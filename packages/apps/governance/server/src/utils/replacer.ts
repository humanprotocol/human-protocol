export function replacer(key, value) {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
}
