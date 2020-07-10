type FicheTravailEmploi = {
  date: string
  description: string
  intro: string
  pubId: string
  sections: Section[]
  title: string
  url: string
}

type Section = {
  anchor: string
  description: string
  html: string
  references: ReferencesMap
  text: string
  titre: string
}

type ReferencesMap = {
  [key: string]: {
    name: string
    articles: ReferenceFTE[]
  }
}

type ReferenceFTE = {
  id: string
  cid: string
  fmt: string
  text: string
}
