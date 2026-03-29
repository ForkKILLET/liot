import { SettingsMenu } from '@/comps/settings-menu'
import { UserMenu } from '@/comps/user-menu'

export function PageToolbar() {
  return (
    <div className='flex items-center gap-3'>
      <SettingsMenu />
      <UserMenu />
    </div>
  )
}
