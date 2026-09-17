import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'practiceInfo',
  title: 'Practice Info (NEXT)',
  type: 'document',
  // Treat as singleton in Studio (via structure or plugin)
  fields: [
    defineField({ name: 'inviteLine', type: 'localeString', title: 'Invite line' }),
    defineField({ name: 'practiceDescription', type: 'localeText', title: 'Practice description' }),
    defineField({ name: 'authorName', type: 'string', title: 'Author name' }),
    defineField({ name: 'authorRole', type: 'localeString', title: 'Author role' }),
    defineField({ name: 'authorBio', type: 'localeText', title: 'Author bio' }),
    defineField({ name: 'contactEmail', type: 'string', title: 'Contact email' }),
    defineField({ name: 'contactNote', type: 'localeString', title: 'Contact note' }),
    defineField({
      name: 'socialLinks',
      type: 'array',
      title: 'Social links',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', type: 'string', title: 'Label' },
            { name: 'url', type: 'url', title: 'URL' },
          ],
        },
      ],
    }),
  ],
});
