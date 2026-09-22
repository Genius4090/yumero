/** True when a form's current values differ from the values it started with (deep compare by JSON). */
export const isDirty = (current: unknown, initial: unknown) => JSON.stringify(current) !== JSON.stringify(initial)
