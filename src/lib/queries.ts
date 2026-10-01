/**
 * GROQ queries — images include asset url for the drum.
 */

export const mapContent = `{
  "projects": *[_type == "project"] | order(title asc) {
    _id, title, "slug": slug.current, meta, kind, body,
    images[]{
      ...,
      asset->{
        _id,
        url,
        metadata { dimensions }
      }
    },
    tags[]->{ _id, key, label }
  },
  "research": *[_type == "research"] | order(title asc) {
    _id, title, "slug": slug.current, meta, kind, body,
    images[]{
      ...,
      asset->{
        _id,
        url,
        metadata { dimensions }
      }
    },
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
