import React, { Component, Fragment, createRef } from 'react'
import cx from 'classnames'
import { Subject, merge, fromEvent } from 'rxjs'
import { takeUntil, tap } from 'rxjs/operators'

import './Opener.scss'

const OpenerItem = ({ isOpen, selectedRoot, selected, title, iconSrc, iconSrcList, rightContent, onClick }) => {
  return (
    <div
      className={cx("Opener__item", {
        "Opener__item--selected": !isOpen && selected,
        "Opener__item--selectedAndOpen": isOpen && selected,
        "Opener__item--selectedRoot": selectedRoot,
      })}
      onClick={onClick}
    >
      {iconSrcList && iconSrcList.map((_iconSrc) =>
        <img className="Opener__itemIcon" src={_iconSrc} />
      )}
      {iconSrc && <img className="Opener__itemIcon" src={iconSrc} />}
      <span className="Opener__itemTitle">{title}</span>
      {rightContent && (
        <div className="Opener__itemRight">
          {rightContent}
        </div>
      )}
    </div>
  )
}

class Opener extends Component {
  $container = createRef()

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

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  isClickOuterArea = (e) => {

    return !this.$container.current.contains(e.target)
    // return e.target.className.indexOf("Opener__") === -1
  }

  filterSearch = (item, searchKey) => {
    return item.title.toLowerCase().indexOf(String(searchKey).toLowerCase()) !== -1
  }

  render() {
    const { isOpen, searchKey } = this.state
    const { items = [], selectedItem, onSelect, noSearch, openMethod } = this.props

    return (
      <div 
        ref={this.$container} 
        className={cx("Opener", {
          "Opener--open": isOpen,
          [`Opener--${openMethod}`]: openMethod,
        })}
      >
        <OpenerItem
          key="selectedItem"
          isOpen={isOpen}
          selected
          selectedRoot
          {...selectedItem}
          onClick={() => {
            // No need to open Opener menu when there is only one item.
            // if (items.length === 1) return
            this.setState({ isOpen: !isOpen })
          }}
        />
        {isOpen && !noSearch && (
          <>
            <div className="Opener__searchContainer">
              <input
                ref={(elem) => {
                  if (!elem) return
                  elem.focus()
                }}
                className="Opener__search"
                placeholder="Search"
                onChange={(e) => this.setState({ searchKey: e.target.value })}
              />
            </div>
            <div 
              ref={(elem) => {
                if (!elem) return

                const $list = document.querySelector('.Opener__list')
                const $selected = elem.querySelector('.Opener__item--selected')
              
                // const containerRect = this.$container.current.getBoundingClientRect()

                // console.log(containerRect, '@containerRect')

                // $list.style.position = "fixed"
                // $list.style.left = `${containerRect.x}px`
                // $list.style.top = `${containerRect.y}px`
                // $list.style.width = `${containerRect.width}px`

                if (!$selected || !$list || $list.dirty) return



                const selectedRect = $selected.getBoundingClientRect()
                const listRect = $list.getBoundingClientRect()

                const _scrollTop = selectedRect.top - listRect.top - 48

                $list.scrollTop = _scrollTop
                $list.dirty = true

              }} 
              className="Opener__list"
            >
              {items
                // .filter((item) => this.filterSearch(item, searchKey))
                .map((item) => {
                  const { iconSrc, iconSrcList, title, key, rightContent } = item

                  return (
                    <OpenerItem
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

export default Opener