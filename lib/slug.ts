export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

export function uniqueSlug(base: string, suffix: string | number) {
  const slug = slugify(base);
  return `${slug || "articol"}-${suffix}`;
}
