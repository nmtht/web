import { defineType } from 'sanity';

export default defineType({
  name: 'localeText',
  title: 'Localized text',
  type: 'object',
  fields: [
    { name: 'en', type: 'text', title: 'English' },
    { name: 'ru', type: 'text', title: 'Russian' },
  ],
});
