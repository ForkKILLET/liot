'use server'

import * as $ from 'drizzle-orm'
import { db, schema } from '@/lib/db'
import { NewDevice } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/server'

export async function getUserDeviceOverview(userId: string) {
  const [overview] = await db
    .select({ count: $.count(schema.devices) })
    .from(schema.devices)
    .where($.eq(schema.devices.createdBy, userId))

  return overview
}

export async function getUserDevices(userId: string) {
  const devices = await db
    .select()
    .from(schema.devices)
    .where($.eq(schema.devices.createdBy, userId))

  return devices
}

export type DefineDevice = Pick<NewDevice, 'name' | 'description' | 'templateId' | 'createdBy'>

export async function createDevice(device: DefineDevice) {
  await db
    .insert(schema.devices)
    .values({
      ...device,
      state: {},
    })
}

export type DefineDeviceUnderCurrentUser = Omit<DefineDevice, 'createdBy'>

export async function createDeviceUnderCurrentUser(device: DefineDeviceUnderCurrentUser) {
  const user = await getCurrentUser()
  return createDevice({
    ...device,
    createdBy: user.id,
  })
}
