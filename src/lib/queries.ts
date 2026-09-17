/**
 * GROQ queries for each content type.
 * Keep in sync with /sanity/schemas.
 */

export const allProjects = `*[_type == "project"]{
  _id, title, "slug": slug.current, meta, kind, body, images, tags[]->{key, label}
}`;

export const allResearch = `*[_type == "research"]{
  _id, title, "slug": slug.current, meta, kind, body, images, tags[]->{key, label}
}`;

export const allQuestions = `*[_type == "question"]{
  _id, title, tags[]->{key, label},
  leads[]->{ _type, _id, title, "slug": slug.current }
}`;

export const allTags = `*[_type == "tag"]{ _id, key, label }`;

export const practiceInfo = `*[_type == "practiceInfo"][0]`;

export const uiStrings = `*[_type == "uiStrings"][0]`;

/** Orphans: projects/research not referenced by any question.leads */
export const orphanedLeaves = `{
  "projects": *[_type == "project" && count(*[_type == "question" && references(^._id)]) == 0],
  "research": *[_type == "research" && count(*[_type == "question" && references(^._id)]) == 0]
}`;
