import type { Note } from '../types'
import { makeId } from './id'
import { parseTags } from './tags'

const DAY = 86_400_000
const MINUTE = 60_000

function seedNote(
  content: string,
  createdAt: number,
  extra: Partial<Pick<Note, 'pinned' | 'starred'>> = {}
): Note {
  return {
    id: makeId(),
    content,
    tags: parseTags(content),
    pinned: extra.pinned ?? false,
    starred: extra.starred ?? false,
    createdAt,
    updatedAt: createdAt
  }
}

export function createSeedNotes(now = Date.now()): Note[] {
  return [
    seedNote(
      '欢迎来到灵感便签 ✳\n这里收留一闪而过的念头：项目的火花、读到的句子、半夜的胡思乱想。写下第一条吧，给未来的自己留一颗时间胶囊。\n#欢迎 #使用指南',
      now - 36 * MINUTE,
      { pinned: true, starred: true }
    ),
    seedNote(
      '界面不一定要填满。留白是让注意力休息的地方，也是让重点呼吸的地方。\n#设计/排版 #读书笔记',
      now - 3 * 60 * MINUTE - 12 * MINUTE,
      { starred: true }
    ),
    seedNote(
      '给产品起名字时，试着从「动词」而不是「名词」出发，会更有生命力。与其叫「灵感库」，不如叫「灵感便签」。\n#命名/方法 #产品想法',
      now - DAY - 2 * 60 * MINUTE
    ),
    seedNote(
      '想法：做一个「每日随机回顾」功能，让旧便签像漂流瓶一样，偶尔漂回眼前。\n#项目/灵感便签 #灵感回顾',
      now - 2 * DAY - 40 * MINUTE
    ),
    seedNote(
      '配色先定两三个颜色就够了，剩下的交给灰度与留白。\n#设计/配色',
      now - 5 * DAY - 90 * MINUTE
    ),
    seedNote(
      '深夜的 idea 不一定要当时做完，但一定要当时记下来。\n#写作 #灵感',
      now - 12 * DAY - 30 * MINUTE
    ),
    seedNote(
      '读到：「创造力不过是将事物联系起来。」把不同领域的标签放在一起，也许灵感就自己长出来了。\n#读书笔记 #灵感',
      now - 26 * DAY - 60 * MINUTE
    )
  ]
}
