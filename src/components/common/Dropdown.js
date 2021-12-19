import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, fromEvent } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './Dropdown.scss'

const DropdownItem = ({ isOpen, selected, title, iconSrc, iconSrcList, rightContent, onClick }) => {
  return (
    <div
      className={cx("Dropdown__item", {
        "Dropdown__item--selected": !isOpen && selected,
        "Dropdown__item--selectedAndOpen": isOpen && selected,
      })}
      onClick={onClick}
    >
      {iconSrcList && iconSrcList.map((_iconSrc) =>
        <img className="Dropdown__itemIcon" src={_iconSrc} />
      )}
      {iconSrc && <img className="Dropdown__itemIcon" src={iconSrc} />}
      <span className="Dropdown__itemTitle">{title}</span>
      {rightContent && (
        <div className="Dropdown__itemRight">
          {rightContent}
        </div>
      )}
    </div>
  )
}

class Dropdown extends Component {
  destroy$ = new Subject()

  state = {
    isOpen: false,
    searchKey: '',
  }

  componentDidMount() {
    fromEvent(window, 'click').pipe(
      takeUntil(this.destroy$)
    ).subscribe((e) => {
      if (this.isClickOuterArea(e)) {
        this.setState({ isOpen: false })
      }
    })
  }

  componentWillUnMount() {
    this.destroy$.next(true)
  }

  isClickOuterArea = (e) => {
    return e.target.className.indexOf("Dropdown__") === -1
  }

  filterSearch = (item, searchKey) => {
    return item.title.toLowerCase().indexOf(String(searchKey).toLowerCase()) !== -1
  }

  render() {
    const { isOpen, searchKey } = this.state
    const { items = [], selectedItem, onSelect, noSearch } = this.props

    return (
      <div className="Dropdown">
        <DropdownItem
          key="selectedItem"
          isOpen={isOpen}
          selected
          {...selectedItem}
          onClick={() => {
            // No need to open dropdown menu when there is only one item.
            if (items.length === 1) return
            this.setState({ isOpen: !isOpen })
          }}
        />
        {isOpen && !noSearch && (
          <>
            <div className="Dropdown__searchWrapper">
              <input
                ref={(elem) => {
                  if (!elem) return
                  elem.focus()
                }}
                className="Dropdown__search"
                placeholder="Search"
                onChange={(e) => this.setState({ searchKey: e.target.value })}
              />
            </div>
            <div ref={(elem) => {
              if (!elem) return

              const $list = document.querySelector('.Dropdown__list')
              const $selected = elem.querySelector('.Dropdown__item--selected')

              if (!$selected || !$list || $list.dirty) return

              const selectedRect = $selected.getBoundingClientRect()
              const listRect = $list.getBoundingClientRect()

              const _scrollTop = selectedRect.top - listRect.top - 48

              $list.scrollTop = _scrollTop
              $list.dirty = true

            }} className="Dropdown__list">
              {items
                // .filter((item) => this.filterSearch(item, searchKey))
                .map((item) => {
                  const { iconSrc, iconSrcList, title, key, rightContent } = item

                  return (
                    <DropdownItem
                      isOpen={isOpen}
                      selected={key == (selectedItem && selectedItem.key)}
                      key={key}
                      title={title}
                      iconSrc={iconSrc}
                      iconSrcList={iconSrcList}
                      rightContent={rightContent}
                      onClick={() => {
                        onSelect(item)
                        this.setState({ isOpen: false })
                      }}
                    />
                  )
                })}
            </div>
          </>
        )}
      </div>
    )
  }
}

export default Dropdown