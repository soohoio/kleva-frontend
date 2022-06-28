import React, { Component } from 'react'
import cx from 'classnames'
import { Subject } from 'rxjs'
import { map, filter, takeUntil } from 'rxjs/operators'

import { localeChange$, localeMap$ } from 'streams/i18n'

export const I18n = {
  t: (label, option) => {

    let translatedRawValue = (localeMap$.value && localeMap$.value[label]) || ""

    let matched

    try {
      while (matched = translatedRawValue.match(new RegExp(/%{(\S+)}/))) {
        const matchedKey = matched && matched[1]

        if (matchedKey) {
          translatedRawValue = translatedRawValue.replace(new RegExp(/%{\S+}/), option[matchedKey])
        }
      }

      // html tag
      let translatedArrayValue = takeApartHTMLTag(translatedRawValue, [])

      return translatedArrayValue.length == 0 
        ? translatedRawValue
        : translatedArrayValue

    } catch (e) {
      return translatedRawValue
    }
  }
}

const takeApartHTMLTag = (str, arr = []) => {
  const matched = str.match(new RegExp(/<.+?<\/.+?>/))

  if (!matched) {
    if (arr.length != 0) {
      arr.push(str)
    }
    return arr
  }

  arr.push(str.slice(0, matched.index))
  arr.push(<span dangerouslySetInnerHTML={{ __html: matched[0] }}></span>)
  
  return takeApartHTMLTag(str.slice(matched.index + matched[0].length), arr)
}

window.takeApartHTMLTag = takeApartHTMLTag