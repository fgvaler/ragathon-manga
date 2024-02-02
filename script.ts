
// hard coded to only work for 'https://bato.to'

export const downloadWebP = async (imgUrl: string, outputPath: string, fileName: string) => {
  const res = await fetch(imgUrl)
  const blob = await res.blob()
  const arrBuf = await blob.arrayBuffer()
  Deno.writeFile(`${outputPath}/${fileName}.webp`, new Uint8Array(arrBuf))
}

export const getImgURLsForChapter = async (chapterURL: string) => {
  const res = await fetch(chapterURL)
  const raw_html = await res.text()
  const lines = raw_html.split('\n')
  const imgHttpsLine = lines.filter(line=>line.includes('const imgHttps'))[0]
  const quotedSegments = imgHttpsLine.split('"')
  const imgUrls = quotedSegments.filter(str=>str.includes('https:'))
  return imgUrls
}

const getChapterURLs = async (mangaURL: string) => {
  const res = await fetch(mangaURL)
  const raw_html = await res.text()
  const lines = raw_html.split('\n')
  const endOfChapterURLs = lines.flatMap(line=>{
    const quotedSegments = line.split('"')
    const chapterURLS = quotedSegments.filter(str=>str.includes('/chapter/'))
    return chapterURLS
  })
  const chapterURLs = endOfChapterURLs.slice(1).map(endOfUrl=>`https://bato.to${endOfUrl}`)
  chapterURLs.reverse()
  return chapterURLs
}

const mangaURL = 'https://bato.to/series/74597/spy-x-family-official'
const mangaTitle = mangaURL.split('/').pop() as string

//create a folder in downloads for the manga
await Deno.mkdir(`./downloads/${mangaTitle}`, {recursive: true})

//find all links for chapters in order
const chapterURLs = await getChapterURLs(mangaURL)

//for each link, make a folder
const chapterPaths = chapterURLs.map((_, i) => `./downloads/${mangaTitle}/${i}`)
await Promise.all(chapterPaths.map((path)=>
  Deno.mkdir(path, {recursive: true})
))

//for each link add all the imgs in that chapter to that folder
for (let i = 0; i < chapterURLs.length; i++) {
  const downloadPath = chapterPaths[i]
  const imgURLs = await getImgURLsForChapter(chapterURLs[i])
  console.log(`downloading chapter ${i.toString()}`)
  for (let j = 0; j < imgURLs.length; j++) {
    await downloadWebP(imgURLs[j], downloadPath, j.toString())
  }
}
