'use client'

import { DeviceField, DeviceTemplate } from '@/lib/db/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/comps/ui/card'
import { DeviceMessageTypeBadge } from '@/comps/dashboard/device-message-type-badge'
import { CollapsibleSection } from '@/comps/dashboard/collapsible-section'

function getMessageAnchorId(messageId: string) {
  return `template-message-${encodeURIComponent(messageId)}`
}

function formatFieldType(field: DeviceField) {
  if (field.type === 'number') {
    return <>number (<span className='text-muted-foreground'>{field.unit}</span>)</>
  }

  else if (field.type === 'boolean') {
    return <>boolean</>
  }
}

export function DeviceTemplateDetail({
  template,
}: {
  template: DeviceTemplate
}) {
  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>状态</CardTitle>
        </CardHeader>
        <CardContent>
          {template.state.fields.length === 0
            ? (
              <p className='text-sm text-muted-foreground'>未定义任何状态字段。</p>
            )
            : (
              <div className='overflow-x-auto rounded-md border border-border'>
                <table className='w-full min-w-160 text-sm'>
                  <thead className='bg-muted/30 text-left text-muted-foreground'>
                    <tr>
                      <th className='px-3 py-2 font-medium'>字段</th>
                      <th className='px-3 py-2 font-medium'>标签</th>
                      <th className='px-3 py-2 font-medium'>类型</th>
                      <th className='px-3 py-2 font-medium'>描述</th>
                    </tr>
                  </thead>
                  <tbody>
                    {template.state.fields.map((field) => (
                      <tr key={field.field} className='border-t border-border/80 align-top'>
                        <td className='px-3 py-2 font-mono text-xs'>{field.field}</td>
                        <td className='px-3 py-2'>{field.label}</td>
                        <td className='px-3 py-2'>{formatFieldType(field)}</td>
                        <td className='px-3 py-2 text-muted-foreground'>{field.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>协议</CardTitle>
        </CardHeader>
        <CardContent>
          {template.protocol.messages.length === 0
            ? (
              <p className='text-sm text-muted-foreground'>未定义任何协议消息。</p>
            )
            : (
              <div className='space-y-3'>
                {template.protocol.messages.map((message) => (
                  <div
                    key={message.id}
                    id={getMessageAnchorId(message.id)}
                    className='space-y-2 rounded-md border border-border p-3 transition-[border-color,box-shadow] target:border-primary target:shadow-[0_0_0_1px_hsl(var(--primary))]'
                  >
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='font-mono text-xs'>{message.id}</span>
                      <DeviceMessageTypeBadge type={message.type} />
                      <span className='text-xs text-muted-foreground'>{message.description}</span>
                    </div>


                    <div>
                      <div className='text-xs text-muted-foreground'>Topic 模板</div>
                      <div className='mt-1 rounded bg-muted/20 px-2 py-1 font-mono text-xs'>
                        {message.topicTemplate}
                      </div>
                    </div>

                    <div>
                      <div className='text-xs text-muted-foreground'>消息配置</div>
                      <div className='mt-1 rounded bg-muted/20 px-2 py-1 text-xs'>
                        {message.type === 'request' && (
                          <div className='flex flex-wrap items-baseline gap-2'>
                            <span className='text-muted-foreground'>响应消息</span>
                            <a
                              href={`#${getMessageAnchorId(message.responseId)}`}
                              className='font-mono text-primary underline decoration-primary/50 underline-offset-2 hover:text-primary/80'
                            >
                              {message.responseId}
                            </a>
                          </div>
                        )}

                        {(message.type === 'report' || message.type === 'set') && (
                          <div className='flex flex-wrap items-center gap-2'>
                            <span className='text-muted-foreground'>更新字段</span>
                            <span className='font-mono'>
                              {message.fields.length ? message.fields.join(', ') : '无'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <CollapsibleSection title='Payload 模板' className='pt-1'>
                      <pre className='mt-2 overflow-x-auto rounded bg-muted/20 p-2 text-xs'>
                        {JSON.stringify(message.payloadTemplate, null, 2)}
                      </pre>
                    </CollapsibleSection>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
