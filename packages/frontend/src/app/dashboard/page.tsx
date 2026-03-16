import { Card, CardContent, CardHeader, CardTitle } from '@/comps/ui/card'
import { ButtonLink } from '@/comps/ui/link'
import { Descriptions, DescriptionItem } from '@/comps/ui/descriptions'
import { getSession } from '@/lib/auth/server'
import { getUserDeviceOverview } from '@/lib/devices'
import { Plus } from 'lucide-react'

export default async function DashboardPage() {
  const { user } = await getSession()

  const userDeviceOverview = await getUserDeviceOverview(user.id)

  return (
    <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      <Card>
        <CardHeader>
          <CardTitle>账户信息</CardTitle>
        </CardHeader>
        <CardContent>
          <Descriptions>
            <DescriptionItem label='用户名'>{user.name}</DescriptionItem>
            <DescriptionItem label='邮箱'>{user.email}</DescriptionItem>
          </Descriptions>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>设备总览</CardTitle>
        </CardHeader>
        <CardContent>
          <Descriptions>
            <DescriptionItem label='设备数'>{userDeviceOverview.count}</DescriptionItem>
          </Descriptions>
        </CardContent>
      </Card>

      {! userDeviceOverview.count && (
        <Card>
          <CardHeader>
            <CardTitle>下一步</CardTitle>
          </CardHeader>
          <CardContent className='text-sm text-slate-300 space-y-3'>
            <p>你还没有设备，点击下方按钮来添加你的第一个设备！</p>
            <ButtonLink href='/dashboard/devices/new' icon={Plus}>添加设备</ButtonLink>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
