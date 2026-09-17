import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
  fields: [
    defineField({
      name: 'key',
      title: 'Key',
      type: 'string',
      description: 'Stable slug-like id used in graph logic. Do not change after creation.',
      validation: (Rule) => Rule.required().regex(/^[a-z0-9-]+$/),
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'localeString',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: 'key', subtitle: 'label.en' },
  },
});
