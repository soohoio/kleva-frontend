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

      return translatedRawValue
    } catch (e) {
      return translatedRawValue
    }
  }
}
