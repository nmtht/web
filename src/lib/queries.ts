/**
 * GROQ queries for each content type.
 * Keep in sync with /sanity/schemas.
 */

export const allProjects = `*[_type == "project"] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  meta,
  kind,
  body,
  images,
  tags[]->{ _id, key, label }
}`;

export const allResearch = `*[_type == "research"] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  meta,
  kind,
  body,
  images,
  tags[]->{ _id, key, label }
}`;

export const allQuestions = `*[_type == "question"] {
  _id,
  title,
  tags[]->{ _id, key, label },
  leads[]->{ _type, _id, title, "slug": slug.current }
}`;

export const allTags = `*[_type == "tag"] | order(key asc) {
  _id, key, label
}`;

export const practiceInfoQuery = `*[_type == "practiceInfo"][0]{
  inviteLine,
  practiceDescription,
  authorName,
  authorRole,
  authorBio,
  contactEmail,
  contactNote,
  socialLinks
}`;

export const uiStringsQuery = `*[_type == "uiStrings"][0]`;

/** Full payload for the map */
export const mapContentQuery = `{
  "projects": ${allProjects.replace(/`/g, '')},
  "research": ${allResearch.replace(/`/g, '')},
  "questions": ${allQuestions.replace(/`/g, '')},
  "tags": ${allTags.replace(/`/g, '')},
  "practiceInfo": ${practiceInfoQuery.replace(/`/g, '')},
  "uiStrings": ${uiStringsQuery.replace(/`/g, '')}
}`;

// Simpler combined query without nested template issues
export const mapContent = `{
  "projects": *[_type == "project"] | order(title asc) {
    _id, title, "slug": slug.current, meta, kind, body, images,
    tags[]->{ _id, key, label }
  },
  "research": *[_type == "research"] | order(title asc) {
    _id, title, "slug": slug.current, meta, kind, body, images,
    tags[]->{ _id, key, label }
  },
  "questions": *[_type == "question"] {
    _id, title,
    tags[]->{ _id, key, label },
    leads[]->{ _type, _id, title, "slug": slug.current }
  },
  "tags": *[_type == "tag"] | order(key asc) { _id, key, label },
  "practiceInfo": *[_type == "practiceInfo"][0]{
    inviteLine, practiceDescription, authorName, authorRole,
    authorBio, contactEmail, contactNote, socialLinks
  },
  "uiStrings": *[_type == "uiStrings"][0]
}`;
