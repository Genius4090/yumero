/** 998901234567 -> +998 90 123 45 67 */
export const formatPhone = (phone: string) => {
  const d = phone.replace(/\D/g, "").replace(/^998/, "")
  return `+998 ${[d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ")}`
}
