import type { CollectionConfig, Field } from 'payload'

import { authenticated } from '../../access/authenticated'

// APIKEY_OVERRIDE=none  -> unmodified template + `useAPIKey: true` (control)
// APIKEY_OVERRIDE=docs  -> the override from docs/fields/default-fields.mdx (create/update)
// APIKEY_OVERRIDE=read  -> the same override plus `read`, so `apiKey` is readable
const variant = process.env.APIKEY_OVERRIDE || 'none'

const overrideFields: Field[] =
  variant === 'none'
    ? []
    : [
        {
          name: 'enableAPIKey',
          type: 'checkbox',
          access: {
            ...(variant === 'read' ? { read: authenticated } : {}),
            create: authenticated,
            update: authenticated,
          },
        },
        {
          name: 'apiKey',
          type: 'text',
          access: {
            ...(variant === 'read' ? { read: authenticated } : {}),
            create: authenticated,
            update: authenticated,
          },
        },
      ]

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: {
    useAPIKey: true,
  },
  fields: [
    ...overrideFields,
    {
      name: 'name',
      type: 'text',
    },
  ],
  timestamps: true,
}
