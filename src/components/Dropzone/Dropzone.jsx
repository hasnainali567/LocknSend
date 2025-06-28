import React, {useCallback} from 'react'
import {useDropzone} from 'react-dropzone'
import './style.scss'

function Dropzone({ title, onDrop, className }) {
  
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

  return (
    <div className={className} {...getRootProps()}>
      <input {...getInputProps()} />
      <div>
        {title}
      </div>
    </div>
  )
}

export default Dropzone;