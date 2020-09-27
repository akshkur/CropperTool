import React from 'react'

export default class DraggableResizableBox extends React.PureComponent {
  constructor(props) {
    super(props);
    let [width, height] = this.aspectRatioCalculation(this.props.width, this.props.height)
    let centerYOffset = (this.props.height - height) / 2
    let centerXOffset = (this.props.width - width) / 2
    this.state = {
      top: centerYOffset,
      left: centerXOffset,
      bottom: centerYOffset,
      right: centerXOffset,
      width: width,
      height: height
    }
  }

  componentDidMount() {
    document.addEventListener('mousemove', this.eventMove)
    document.addEventListener('mouseup', this.eventEnd)
    document.addEventListener('touchmove', this.eventMove)
    document.addEventListener('touchend', this.eventEnd)
    this.props.onChange({
      top: this.state.top,
      left: this.state.left
    }, {
      width: this.state.width,
      height: this.state.height
    })
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.eventMove)
    document.removeEventListener('mouseup', this.eventEnd)
    document.removeEventListener('touchmove', this.eventMove)
    document.removeEventListener('touchend', this.eventEnd)
  }

  calcDim({ top, left, bottom, right }) {
    return { width: this.props.width - left - right, height: this.props.height - top - bottom }
  }

  aspectRatioCalculation(width, height) {
    if (this.props.minConstraints) {
      width = Math.max(width, this.props.minConstraints[0])
      height = Math.max(height, this.props.minConstraints[1])
    }
    const currentAspectRatio = width / height

    if (currentAspectRatio < this.props.aspectRatio) {
      return [width, width / this.props.aspectRatio]
    } else if (currentAspectRatio > this.props.aspectRatio) {
      return [height * this.props.aspectRatio, height]
    } else {
      return [width, height]
    }
  }

  boundaryLimit(side) {
    return side < 0 ? 0 : side
  }

  getClientCoordinates(evt) {
    return evt.touches ? {
      clientX: evt.touches[0].clientX,
      clientY: evt.touches[0].clientY
    } :
      {
        clientX: evt.clientX,
        clientY: evt.clientY
      }
  }

  eventMove = (evt) => {
    if (this.state.resizing) {
      this.onResize(evt)
    } else if (this.state.moving) {
      this.eventMoveBox(evt)
    }
  }

  eventEnd = (evt) => {
    if (this.state.resizing) {
      this.stopResize(evt)
    } else if (this.state.moving) {
      this.stopMove(evt)
    }
  }

  startChangeSize = (corner, event) => {
    event.stopPropagation()
    event.preventDefault()
    this.setState({
      resizing: true,
      corner
    })
  }

  stopResize = () => {
    this.setState({ resizing: false })
  }

  leftUpper(mousePos, boxPos) {
    let pos = Object.assign({}, this.state, {
      top: this.boundaryLimit(mousePos.clientY - boxPos.top),
      left: this.boundaryLimit(mousePos.clientX - boxPos.left)
    })
    let dimensions = this.calcDim(pos)
    let [width, height] = this.aspectRatioCalculation(dimensions.width, dimensions.height)
    pos.top = this.props.height - pos.bottom - height
    pos.left = this.props.width - pos.right - width
    return pos
  }
  rightUpper(mousePos, boxPos) {
    let pos = Object.assign({}, this.state, {
      top: this.boundaryLimit(mousePos.clientY - boxPos.top),
      right: this.boundaryLimit(boxPos.right - mousePos.clientX)
    })
    let dimensions = this.calcDim(pos)
    let [width, height] = this.aspectRatioCalculation(dimensions.width, dimensions.height)
    pos.top = this.props.height - pos.bottom - height
    pos.right = this.props.width - pos.left - width
    return pos
  }
  rightBottom(mousePos, boxPos) {
    let pos = Object.assign({}, this.state, {
      bottom: this.boundaryLimit(boxPos.bottom - mousePos.clientY),
      right: this.boundaryLimit(boxPos.right - mousePos.clientX)
    })
    let dimensions = this.calcDim(pos)
    let [width, height] = this.aspectRatioCalculation(dimensions.width, dimensions.height)
    pos.bottom = this.props.height - pos.top - height
    pos.right = this.props.width - pos.left - width
    return pos
  }
  leftBottom(mousePos, boxPos) {
    let pos = Object.assign({}, this.state, {
      bottom: this.boundaryLimit(boxPos.bottom - mousePos.clientY),
      left: this.boundaryLimit(mousePos.clientX - boxPos.left)
    })
    let dimensions = this.calcDim(pos)
    let [width, height] = this.aspectRatioCalculation(dimensions.width, dimensions.height)
    pos.bottom = this.props.height - pos.top - height
    pos.left = this.props.width - pos.right - width
    return pos
  }

  onResize(event) {
    let box = this.refs.box.parentElement.parentElement.getBoundingClientRect()
    let coordinates = this.getClientCoordinates(event)
    let position = this[this.state.corner](coordinates, box)
    this.resize(position, coordinates)
  }

  controlsResize(event) {
    let box = this.refs.box.parentElement.parentElement.getBoundingClientRect()
    let width = event.target.name === 'width' ? +event.target.value : +event.target.value * this.props.aspectRatio
    let height = event.target.name === 'height' ? +event.target.value : +event.target.value / this.props.aspectRatio
    let dimensions = this.aspectRatioCalculation(width, height)
    width = dimensions[0]
    height = dimensions[1]

    if (width > box.width - this.state.left ||
      height > box.height - this.state.top) return

    let widthDifference = this.state.width - width
    let heightDifference = this.state.height - height
    let pos = Object.assign({}, this.state, {
      right: this.state.right + widthDifference,
      bottom: this.state.bottom + heightDifference
    })
    let coordinates = {
      clientX: box.right - pos.right,
      clientY: box.bottom - pos.bottom
    }

    this.resize(pos, coordinates)
  }

  resize(position, coordinates) {
    let dimensions = this.calcDim(position)
    var widthChanged = dimensions.width !== this.state.width, heightChanged = dimensions.height !== this.state.height
    if (!widthChanged && !heightChanged) return

    this.setState(Object.assign({}, coordinates, position, dimensions), () => {
      this.props.onChange({
        top: position.top,
        left: position.left
      }, dimensions)
    })
  }
  startMove = (evt) => {
    let { clientX, clientY } = this.getClientCoordinates(evt)
    this.setState({
      moving: true,
      clientX: clientX,
      clientY: clientY
    })
  }

  stopMove = (evt) => {
    this.setState({
      moving: false
    })
  }

  eventMoveBox(evt) {
    evt.preventDefault()
    let { clientX, clientY } = this.getClientCoordinates(evt)
    let movedX = clientX - this.state.clientX
    let movedY = clientY - this.state.clientY

    this.moveBox(clientX, clientY, movedX, movedY)
  }

  dragBoxControls(evt) {
    let movedX = evt.target.name === 'x' ? evt.target.value - this.state.left : 0
    let movedY = evt.target.name === 'y' ? evt.target.value - this.state.top : 0
    this.moveBox(0, 0, movedX, movedY)
  }

  moveBox(clientX, clientY, movedX, movedY) {
    let position = {
      top: this.boundaryLimit(this.state.top + movedY),
      left: this.boundaryLimit(this.state.left + movedX),
      bottom: this.boundaryLimit(this.state.bottom - movedY),
      right: this.boundaryLimit(this.state.right - movedX)
    }

    if (!position.top) {
      position.bottom = this.props.height - this.state.height
    }
    if (!position.bottom) {
      position.top = this.props.height - this.state.height
    }
    if (!position.left) {
      position.right = this.props.width - this.state.width
    }
    if (!position.right) {
      position.left = this.props.width - this.state.width
    }

    this.setState(Object.assign({}, {
      clientX: clientX,
      clientY: clientY
    }, position), () => {
      this.props.onChange({
        top: position.top,
        left: position.left
      }, this.calcDim(position))
    })
  }

  render() {
    let style = {
      position: 'absolute',
      top: this.state.top,
      left: this.state.left,
      right: this.state.right,
      bottom: this.state.bottom
    }
    let { width, height } = this.calcDim(this.state)
    let topStyle = {
      height: this.state.top
    }
    let bottomStyle = {
      height: this.state.bottom
    }
    let leftStyle = {
      top: this.state.top,
      right: width + this.state.right,
      bottom: this.state.bottom
    }
    let rightStyle = {
      top: this.state.top,
      left: width + this.state.left,
      bottom: this.state.bottom
    }

    return (
      <div ref='box' className='DraggableResizable'>
        <div className='DraggableResizable-controls'>
          <label>
            {this.props.offsetXLabel}
            <input
              name='x'
              value={Math.round(this.state.left)}
              onChange={this.dragBoxControls}
              tabIndex="-1"
              type='number' />
          </label>
          <label>
            {this.props.offsetYLabel}
            <input
              name='y'
              value={Math.round(this.state.top)}
              onChange={this.dragBoxControls}
              tabIndex="-1"
              type='number' />
          </label>
          <label>
            {this.props.widthLabel}
            <input
              name='width'
              value={Math.round(width)}
              type='number'
              tabIndex="-1"
              onChange={this.controlsResize} />
          </label>
          <label>
            {this.props.heightLabel}
            <input
              value={Math.round(height)}
              type='number'
              name='height'
              tabIndex="-1"
              onChange={this.controlsResize} />
          </label>
        </div>
        <div className='DraggableResizable-top' style={topStyle}></div>
        <div className='DraggableResizable-left' style={leftStyle}></div>
        <div style={style} onMouseDown={this.startMove} onTouchStart={this.startMove}>
          {this.props.children}
          <div className='resize-handle resize-handle-se'
            onMouseDown={this.startChangeSize.bind(null, 'rightBottom')}
            onTouchStart={this.startChangeSize.bind(null, 'rightBottom')}>
          </div>
          <div className='resize-handle resize-handle-ne'
            onMouseDown={this.startChangeSize.bind(null, 'rightUpper')}
            onTouchStart={this.startChangeSize.bind(null, 'rightUpper')}>
          </div>
          <div className='resize-handle resize-handle-sw'
            onMouseDown={this.startChangeSize.bind(null, 'leftBottom')}
            onTouchStart={this.startChangeSize.bind(null, 'leftBottom')}>
          </div>
          <div className='resize-handle resize-handle-nw'
            onMouseDown={this.startChangeSize.bind(null, 'leftUpper')}
            onTouchStart={this.startChangeSize.bind(null, 'leftUpper')}>
          </div>
        </div>
        <div className='DraggableResizable-right' style={rightStyle}></div>
        <div className='DraggableResizable-bottom' style={bottomStyle}></div>
      </div>
    )
  }
}
