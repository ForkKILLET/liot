import { redirect } from 'next/navigation'

export default async function DeviceDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/dashboard/devices/${id}/properties`)
}
