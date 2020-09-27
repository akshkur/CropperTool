import React from 'react'
import Cropper from './CropperTool.js';

const WIDTH = 262;
const HEIGHT = 147;

export class ImageWrapper extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      image: null,
      previewUrl: null,
      mapper: []
    }
  }

  componentDidUpdate(props, state) {
    window.onpopstate = e => {
      const { mapper } = state;
      let params = window.location.pathname[1];
      if (!!params) {
        this.setState({ previewUrl: mapper[parseInt(params) - 1] })
      }
    }
  }
  onChange = (evt) => {
    this.setState({
      image: evt.target.files[0]
    })
  }
  crop = () => {
    let { mapper } = this.state;
    !!this.refs.crop && this.refs.crop.cropImage().then((image) => {
      let url = window.URL.createObjectURL(image);
      mapper.push(url);
      window.history.pushState('cropper', 'CroppedImage', mapper.length);
      this.setState({
        previewUrl: url,
        mapper: mapper
      })
    })
  }

  clear = () => {
    this.refs.file.value = null
    this.setState({
      previewUrl: null,
      image: null
    })
  }

  download = () => {
    const { previewUrl } = this.state;
    if (!!previewUrl) {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.setAttribute("download", "CroppedImage.png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  imageLoaded = (img) => {
    if (img.naturalWidth && img.naturalWidth < WIDTH &&
      img.naturalHeight && img.naturalHeight < HEIGHT) {
      this.crop()
    }
  }

  render() {
    return (
      <div>
        <input ref='file' type='file' onChange={this.onChange} />
        <div className='Wrapper'>
          {this.state.image &&
            <div>
              <Cropper
                ref='crop'
                image={this.state.image}
                width={WIDTH}
                height={HEIGHT}
                onImageLoaded={this.imageLoaded} />
            </div>}
        </div>
        <div className="btnsection">
          <button className="btncrop" onClick={this.crop}>Crop</button>
          <button className="btndelete" onClick={this.clear}>Clear</button>
          <button className="btncrop" onClick={this.download}>Download Cropped Image</button>
        </div>
        {this.state.previewUrl &&
          <img src={this.state.previewUrl} />}
      </div>
    )
  }
}