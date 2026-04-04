export function getDeviceTemplateDetailPath(templateId: number | string) {
  return `/dashboard/templates/${encodeURIComponent(String(templateId))}`
}
