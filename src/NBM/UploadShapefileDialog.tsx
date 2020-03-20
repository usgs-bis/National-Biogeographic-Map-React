import Dialog from 'react-dialog'
import React, {FunctionComponent, useState} from 'react'
import geojsonhint from '@mapbox/geojsonhint'
import shp from 'shpjs'
import {Alert} from 'reactstrap'

// @Matt TODO: #current make better
import loadingGif from './loading.gif'

export interface IUploadShapefileDialog {
  showUploadDialog: boolean
  setShowUploadDialog: Function
  handleUploadedGeojson: Function
}

const UploadShapefileDialog: FunctionComponent<IUploadShapefileDialog> = ({
  showUploadDialog,
  setShowUploadDialog,
  handleUploadedGeojson,
}) => {

  const [uploadError, setUploadError] = useState<null|string>(null)
  const [uploading, setUploading] = useState(false)

  const handleClose = () => {
    setShowUploadDialog(false)
    setUploadError(null)
    setUploading(false)
  }

  const handleGeojson = (geojson: any) => {
    const hints = geojsonhint.hint(geojson)

    if (hints.length !== 0) {
      setUploadError(`GeoJSON Validation Error: ${hints[0].message}`)
      setUploading(false)
      return
    }

    const geometry = geojson.type === 'FeatureCollection' ? geojson = geojson.features[0].geometry : geojson.geometry
    geometry.crs = {type: 'name', properties: {name: 'EPSG:4326'}}
    if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') {
      setUploadError('Only Polygons are accepted for upload.')
      setUploading(false)
      return
    }
    setUploadError(null)
    handleClose()

    handleUploadedGeojson(geojson, geometry)
  }

  const parseGeojsonFile = (file: Blob) => {
    const fileReader = new FileReader()
    fileReader.onload = (event) => {
      const result = event?.target?.result as string
      const geojson = JSON.parse(result)
      // @Matt DEBUG
      debugger
      handleGeojson(geojson)
    }
    fileReader.readAsText(file)
  }

  const parseShapefile = (file: Blob) => {
    const fileReader = new FileReader()
    fileReader.onload = () => {
      shp(fileReader.result as string)
        .then((geojson: any) => {
          handleGeojson(geojson)
          setUploadError(null)
        })
        .catch((ex: any) => {
          setUploadError('Shapefile parse issue: ' + ex.message)
          setUploading(false)
        })
    }
    fileReader.readAsArrayBuffer(file)
  }

  const uploadFile = (event: any) => {
    const file = event.target.files[0]
    if (file.size > 5000000) {
      setUploadError('File size is greater than 5MB')

      return
    }

    setUploading(true)
    setUploadError(null)

    try {
      const fileNameArr = file.name.split('.')
      const fileExt = fileNameArr[fileNameArr.length - 1]

      switch (fileExt) {
        case 'zip':
          parseShapefile(file)
          break

        case 'geojson':
        case 'json':
          parseGeojsonFile(file)
          break

        default:
          setUploadError(`Uploads of files with the extension ${fileExt} are not supported.`)
          setUploading(false)
          break
      }

    } catch (ex) {
      setUploadError('File read failure: ' + ex.message)
      setUploading(false)
    }

    event.target.value = '' // make sure the user can upload the same file again
  }

  if (showUploadDialog) {

    // @Matt TODO: #current fix the help info to make shapefile uploading more clear
    return (
      <Dialog
        title={'Upload a shapefile'}
        modal={true}
        height="400px"
        onClose={handleClose}
      >
        <div className="sbinfo-popout-window">
          <ul>
            <li>Only zipped (.zip) and GeoJSON (.json , .geojson) files under 5MB are accepted.</li>
            <li>Your shapefile (.shp) must be zipped into a '.zip' extension and be under 5MB.</li>
            <li>Only the first <b>polygon</b> feature in your file will be used. Point and line geometries are not accepted.</li>
            <li>Valid .shp, .shx, .dbf, and .prj files must be included.</li>
            <li>Most common coordinate systems are supported.</li>
          </ul>
          {uploadError &&
            <Alert color="danger">
              <b>Sorry, there was an error!</b>
              <div>{uploadError}</div>
            </Alert>
          }
          <label className="mb-0 pt-1 rounded float-right" title="Upload a shp file">
            <span className="btn submit-analysis-btn">Upload</span>
            <input type="file" name="file-upload" id="file-upload" accept=".zip, .json, .geojson" style={{display: 'none'}}
              onChange={uploadFile} />
          </label>
          {uploading &&
            <img src={loadingGif} alt="Loading..."></img>
          }
        </div>
      </Dialog>

    )
  }

  return null
}

export default UploadShapefileDialog
