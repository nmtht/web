import { defineType } from 'sanity';

export default defineType({
  name: 'localeString',
  title: 'Localized string',
  type: 'object',
  fields: [
    { name: 'en', type: 'string', title: 'English' },
    { name: 'ru', type: 'string', title: 'Russian' },
  ],
});
