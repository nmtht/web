import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'uiStrings',
  title: 'UI Strings',
  type: 'document',
  // Singleton
  fields: [
    defineField({ name: 'hint', type: 'localeString', title: 'Bottom hint' }),
    defineField({ name: 'resetMap', type: 'localeString', title: 'Reset map' }),
    defineField({ name: 'tags', type: 'localeString', title: 'Tags label' }),
    defineField({ name: 'related', type: 'localeString', title: 'Related label' }),
    defineField({ name: 'leadsTo', type: 'localeString', title: 'Leads to label' }),
    defineField({ name: 'practice', type: 'localeString', title: 'Practice label' }),
    defineField({ name: 'founder', type: 'localeString', title: 'Author label' }),
    defineField({ name: 'elsewhere', type: 'localeString', title: 'Elsewhere label' }),
    defineField({ name: 'contact', type: 'localeString', title: 'Contact label' }),
  ],
});
