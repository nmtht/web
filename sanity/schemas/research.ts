import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'research',
  title: 'Research (THINK)',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', title: 'Title', validation: (R) => R.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: { source: 'title' },
      validation: (R) => R.required(),
    }),
    defineField({ name: 'meta', type: 'localeString', title: 'Meta (city / year)' }),
    defineField({
      name: 'kind',
      type: 'localeString',
      title: 'Category',
      description: 'Observation / Software / Text / Speculative or custom',
    }),
    defineField({ name: 'body', type: 'localeText', title: 'Body' }),
    defineField({
      name: 'images',
      type: 'array',
      title: 'Images (0–3)',
      of: [{ type: 'image', options: { hotspot: true } }],
      validation: (R) => R.max(3),
    }),
    defineField({
      name: 'tags',
      type: 'array',
      title: 'Tags',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'kind.en' },
  },
});
