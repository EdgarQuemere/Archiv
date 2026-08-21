
import React from 'react';
const ImagePreview = (props) => {
  const { record, property } = props;
  const url = record.params[property.name];
  if (!url) return null;
  return <img src={url} style={{ width: '100px', borderRadius: '4px' }} />;
};
export default ImagePreview;
