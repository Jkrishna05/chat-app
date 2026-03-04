export function formatmessageTime(date) {
    return new Date(date).toLocaleTimeString('en-US',{
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
})
}

export function formatLastSeen(date) {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const time = formatmessageTime(d);

    if (isSameDay(d, today)) return `Last seen Today ${time}`;
    if (isSameDay(d, yesterday)) return `Last seen Yesterday ${time}`;

    return `Last seen ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} ${time}`;
}