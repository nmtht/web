import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'question',
  title: 'Question (WHAT IF?)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'localeText',
      title: 'Question',
      description: 'Full question including “what if…?”',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'tags',
      type: 'array',
      title: 'Tags',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
    }),
    defineField({
      name: 'leads',
      type: 'array',
      title: 'Leads to',
      description: 'Projects / research this question opens. Every leaf must be linked from at least one question.',
      of: [
        {
          type: 'reference',
          to: [{ type: 'project' }, { type: 'research' }],
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title.en' },
  },
});
