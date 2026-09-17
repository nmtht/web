import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'project',
  title: 'Project (THAT!)',
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
    defineField({ name: 'kind', type: 'localeString', title: 'Kind / type of work' }),
    defineField({ name: 'body', type: 'localeText', title: 'Body' }),
    defineField({
      name: 'images',
      type: 'array',
      title: 'Images (1–3, order = drum order)',
      of: [{ type: 'image', options: { hotspot: true } }],
      validation: (R) => R.min(1).max(3),
    }),
    defineField({
      name: 'tags',
      type: 'array',
      title: 'Tags',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'meta.en' },
  },
});
