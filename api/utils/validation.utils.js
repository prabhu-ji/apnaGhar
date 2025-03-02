// utils/validation.utils.js
export const validatePostData = (postData, propertyType) => {
    const errors = [];
  
    if (!postData.title || typeof postData.title !== 'string' || postData.title.trim() === '') {
      errors.push('Title is required and must be a valid string');
    }
    if (!postData.price || isNaN(parseInt(postData.price)) || parseInt(postData.price) <= 0) {
      errors.push('Price is required and must be a positive number');
    }
    if (!postData.address || typeof postData.address !== 'string' || postData.address.trim() === '') {
      errors.push('Address is required and must be a valid string');
    }
    if (!postData.city || typeof postData.city !== 'string' || postData.city.trim() === '') {
      errors.push('City is required and must be a valid string');
    }
  
    const latitudeRegex = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/;
    const longitudeRegex = /^[-+]?((1[0-7]\d|\d{1,2})(\.\d+)?|180(\.0+)?)$/;
  
    if (!postData.latitude || !latitudeRegex.test(postData.latitude)) {
      errors.push('Latitude is required and must be in a valid format');
    }
    if (!postData.longitude || !longitudeRegex.test(postData.longitude)) {
      errors.push('Longitude is required and must be in a valid format');
    }
    if (!postData.images || !Array.isArray(postData.images) || postData.images.length === 0) {
      errors.push('At least one image is required');
    }
  
    if (propertyType === 'land') {
      if (postData.bedroom !== undefined) errors.push('Bedroom count should not be specified for land properties');
      if (postData.bathroom !== undefined) errors.push('Bathroom count should not be specified for land properties');
    } else {
      if (!postData.bedroom || isNaN(parseInt(postData.bedroom)) || parseInt(postData.bedroom) < 1) {
        errors.push('Bedroom count is required and must be at least 1');
      }
      if (!postData.bathroom || isNaN(parseInt(postData.bathroom)) || parseInt(postData.bathroom) < 1) {
        errors.push('Bathroom count is required and must be at least 1');
      }
    }
  
    return errors;
  };
  
  export const validatePostDetail = (postDetail, propertyType) => {
    const errors = [];
  
    if (!postDetail.desc || typeof postDetail.desc !== 'string' || postDetail.desc.trim() === '') {
      errors.push('Description is required');
    }
  
    ['school', 'bus', 'restaurant'].forEach(field => {
      if (postDetail[field] === undefined || isNaN(parseInt(postDetail[field])) || parseInt(postDetail[field]) < 0) {
        errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} distance must be a non-negative number`);
      }
    });
  
    if (!postDetail.size || isNaN(parseInt(postDetail.size)) || parseInt(postDetail.size) <= 0) {
      errors.push('Size is required and must be a positive number');
    }
  
    if (propertyType === 'land' && postDetail.pet !== undefined) {
      errors.push('Pet policy should not be specified for land properties');
    } else if (!propertyType === 'land' && (!postDetail.pet || !['allowed', 'not-allowed'].includes(postDetail.pet))) {
      errors.push('Valid pet policy is required');
    }
  
    return errors;
  };
  
 