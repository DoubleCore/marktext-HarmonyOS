/// <reference types="vite/client" />

interface ISegmenterOptions {
  granularity?: 'grapheme' | 'word' | 'sentence'
}

interface ISegmenterSegment {
  segment: string
  index: number
  input: string
  isWordLike?: boolean
}

interface ISegmenter {
  segment(input: string): Iterable<ISegmenterSegment>
}

interface ISegmenterConstructor {
  new (locales?: string | string[], options?: ISegmenterOptions): ISegmenter
}

declare namespace Intl {
  let Segmenter: ISegmenterConstructor | undefined
}
