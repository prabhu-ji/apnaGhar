import { useState, useEffect } from "react";
import "./editPostPage.scss";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import apiRequest from "../../lib/apiRequest";
import UploadWidget from "../../components/uploadWidget/UploadWidget";
import { useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function EditPostPage() {
  const { id } = useParams();
  const [value, setValue] = useState("");
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postData, setPostData] = useState(null);
  const [propertyType, setPropertyType] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPostData = async () => {
      setIsLoading(true);
      try {
        const res = await apiRequest.get(`/posts/${id}`);
        setPostData(res.data);
        setPropertyType(res.data.property);
        setValue(res.data.postDetail?.desc || "");
        setImages(res.data.images || []);
      } catch (err) {
        console.log(err);
        toast.error("Failed to load post data");
        setErrors(["Failed to load post data"]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostData();
  }, [id]);

  const handlePropertyTypeChange = (e) => {
    setPropertyType(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);
    
    const formData = new FormData(e.target);
    const inputs = Object.fromEntries(formData);

    // Client-side validation
    const clientErrors = [];
    
    // Basic validations
    if (!inputs.title || inputs.title.trim() === "") {
      clientErrors.push("Title is required");
    }
    
    if (!inputs.price || parseInt(inputs.price) <= 0) {
      clientErrors.push("Price is required and must be a positive number");
    }
    
    if (!inputs.address || inputs.address.trim() === "") {
      clientErrors.push("Address is required");
    }
    
    if (!inputs.city || inputs.city.trim() === "") {
      clientErrors.push("City is required");
    }
    
    // Description validation
    if (!value || value.trim() === "<p><br></p>") {
      clientErrors.push("Description is required");
    }
    
    // Images validation
    if (!images.length) {
      clientErrors.push("At least one image is required");
    }
    
    // Coordinates validation
    const latitudeRegex = /^(\+|-)?(?:90(?:(?:\.0{1,6})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,6})?))$/;
    const longitudeRegex = /^(\+|-)?(?:180(?:(?:\.0{1,6})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,6})?))$/;
    
    if (!inputs.latitude || !latitudeRegex.test(inputs.latitude)) {
      clientErrors.push("Latitude is required and must be in a valid format (e.g., 27.20201000)");
    }
    
    if (!inputs.longitude || !longitudeRegex.test(inputs.longitude)) {
      clientErrors.push("Longitude is required and must be in a valid format (e.g., 73.73394000)");
    }
    
    // Property-specific validations
    if (propertyType !== "land") {
      if (!inputs.bedroom || parseInt(inputs.bedroom) < 1) {
        clientErrors.push("Bedroom count is required and must be at least 1");
      }
      
      if (!inputs.bathroom || parseInt(inputs.bathroom) < 1) {
        clientErrors.push("Bathroom count is required and must be at least 1");
      }
      
      // Property-specific bedroom/bathroom limitations
      if (propertyType === "apartment") {
        if (parseInt(inputs.bedroom) > 4) {
          clientErrors.push("Apartments can have a maximum of 4 bedrooms");
        }
        
        if (parseInt(inputs.bathroom) > 4) {
          clientErrors.push("Apartments can have a maximum of 4 bathrooms");
        }
      } else {
        if (parseInt(inputs.bedroom) > 6) {
          clientErrors.push("Houses and condos can have a maximum of 6 bedrooms");
        }
        
        if (parseInt(inputs.bathroom) > 6) {
          clientErrors.push("Houses and condos can have a maximum of 6 bathrooms");
        }
      }
    }
    
    // Size validation
    if (!inputs.size || parseInt(inputs.size) <= 0) {
      clientErrors.push("Size is required and must be a positive number");
    }
    
    // Distance fields validation
    const distanceFields = ["school", "bus", "restaurant"];
    distanceFields.forEach(field => {
      if (!inputs[field] || parseInt(inputs[field]) < 0) {
        clientErrors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} distance must be a non-negative number in meters`);
      }
    });
    
    // Income policy validation
    if (!inputs.income || inputs.income.trim() === "") {
      clientErrors.push("Income policy is required");
    }
    
    // If there are client-side validation errors, stop submission
    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      clientErrors.forEach(error => {
        toast.error(error);
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await apiRequest.put(`/posts/${id}`, {
        postData: {
          title: inputs.title,
          price: parseInt(inputs.price),
          address: inputs.address,
          city: inputs.city,
          bedroom: propertyType === "land" ? null : parseInt(inputs.bedroom),
          bathroom: propertyType === "land" ? null : parseInt(inputs.bathroom),
          type: inputs.type,
          property: inputs.property,
          latitude: inputs.latitude,
          longitude: inputs.longitude,
          images: images,
          // Keep isRented status if it exists
          ...(postData.isRented !== undefined && { isRented: postData.isRented }),
        },
        postDetail: {
          desc: value,
          utilities: propertyType === "land" ? null : inputs.utilities,
          pet: propertyType === "land" ? null : inputs.pet,
          income: inputs.income,
          size: parseInt(inputs.size),
          school: parseInt(inputs.school),
          bus: parseInt(inputs.bus),
          restaurant: parseInt(inputs.restaurant),
        },
      });
      
      toast.success("Post updated successfully!");
      navigate("/" + res.data.id);
    } catch (err) {
      console.log(err);
      
      if (err.response && err.response.data) {
        if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
          setErrors(err.response.data.errors);
          err.response.data.errors.forEach(error => {
            toast.error(error);
          });
        } else {
          toast.error(err.response.data.message || "Failed to update post");
        }
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!postData) {
    return <div>Post not found</div>;
  }

  // Get property details data from correct location
  const postDetail = postData.postDetail || {};

  return (
    <div className="editPostPage">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="formContainer">
        <h1>Edit Post</h1>
        {errors.length > 0 && (
          <div className="errorContainer">
            <ul>
              {errors.map((error, index) => (
                <li key={index} className="errorMessage">{error}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="wrapper">
          <form onSubmit={handleSubmit}>
            <div className="item">
              <label htmlFor="title">Title *</label>
              <input 
                id="title" 
                name="title" 
                type="text" 
                defaultValue={postData.title}
                required 
              />
            </div>
            <div className="item">
              <label htmlFor="price">Price *</label>
              <input 
                id="price" 
                name="price" 
                type="number" 
                min="1" 
                defaultValue={postData.price}
                required 
              />
            </div>
            <div className="item">
              <label htmlFor="address">Address *</label>
              <input 
                id="address" 
                name="address" 
                type="text" 
                defaultValue={postData.address}
                required 
              />
            </div>
            <div className="item description">
              <label htmlFor="desc">Description *</label>
              <ReactQuill theme="snow" onChange={setValue} value={value} />
            </div>
            <div className="item">
              <label htmlFor="city">City *</label>
              <input 
                id="city" 
                name="city" 
                type="text" 
                defaultValue={postData.city}
                required 
              />
            </div>
            
            <div className="item">
              <label htmlFor="property">Property Type *</label>
              <select 
                name="property" 
                value={propertyType}
                onChange={handlePropertyTypeChange}
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="land">Land</option>
              </select>
            </div>
            
            {propertyType !== "land" && (
              <>
                <div className="item">
                  <label htmlFor="bedroom">Bedroom Number *</label>
                  <input 
                    min={1} 
                    max={propertyType === "apartment" ? 4 : 6} 
                    id="bedroom" 
                    name="bedroom" 
                    type="number" 
                    defaultValue={postData.bedroom}
                    required 
                  />
                  <small>{propertyType === "apartment" ? "1-4 bedrooms allowed" : "1-6 bedrooms allowed"}</small>
                </div>
                <div className="item">
                  <label htmlFor="bathroom">Bathroom Number *</label>
                  <input 
                    min={1} 
                    max={propertyType === "apartment" ? 4 : 6} 
                    id="bathroom" 
                    name="bathroom" 
                    type="number" 
                    defaultValue={postData.bathroom}
                    required 
                  />
                  <small>{propertyType === "apartment" ? "1-4 bathrooms allowed" : "1-6 bathrooms allowed"}</small>
                </div>
              </>
            )}
            
            <div className="item">
              <label htmlFor="latitude">Latitude *</label>
              <input 
                id="latitude" 
                name="latitude" 
                type="text" 
                placeholder="e.g. 27.20201000"
                defaultValue={postData.latitude}
                required 
              />
            </div>
            <div className="item">
              <label htmlFor="longitude">Longitude *</label>
              <input 
                id="longitude" 
                name="longitude" 
                type="text" 
                placeholder="e.g. 73.73394000"
                defaultValue={postData.longitude}
                required 
              />
            </div>
            <div className="item">
              <label htmlFor="type">Type *</label>
              <select name="type" defaultValue={postData.type}>
                <option value="rent">Rent</option>
                <option value="buy">Buy</option>
              </select>
            </div>

            {propertyType !== "land" && (
              <>
                <div className="item">
                  <label htmlFor="utilities">Utilities Policy *</label>
                  <select name="utilities" defaultValue={postDetail.utilities} required>
                    <option value="owner">Owner is responsible</option>
                    <option value="tenant">Tenant is responsible</option>
                    <option value="shared">Shared</option>
                  </select>
                </div>
                <div className="item">
                  <label htmlFor="pet">Pet Policy *</label>
                  <select name="pet" defaultValue={postDetail.pet} required>
                    <option value="allowed">Allowed</option>
                    <option value="not-allowed">Not Allowed</option>
                  </select>
                </div>
              </>
            )}
            
            <div className="item">
              <label htmlFor="income">Income Policy *</label>
              <input
                id="income"
                name="income"
                type="text"
                placeholder="Income Policy"
                defaultValue={postDetail.income}
                required
              />
            </div>
            <div className="item">
              <label htmlFor="size">Total Size (sqft) *</label>
              <input 
                min={1} 
                id="size" 
                name="size" 
                type="number" 
                defaultValue={postDetail.size}
                required 
              />
            </div>
            <div className="item">
              <label htmlFor="school">School (meters) *</label>
              <input 
                min={0} 
                id="school" 
                name="school" 
                type="number" 
                defaultValue={postDetail.school}
                required 
              />
              <small>Distance in meters</small>
            </div>
            <div className="item">
              <label htmlFor="bus">Bus (meters) *</label>
              <input 
                min={0} 
                id="bus" 
                name="bus" 
                type="number" 
                defaultValue={postDetail.bus}
                required 
              />
              <small>Distance in meters</small>
            </div>
            <div className="item">
              <label htmlFor="restaurant">Restaurant (meters) *</label>
              <input 
                min={0} 
                id="restaurant" 
                name="restaurant" 
                type="number" 
                defaultValue={postDetail.restaurant}
                required 
              />
              <small>Distance in meters</small>
            </div>
            
            <div className="imageUploadSection">
              <label>Images * ({images.length} uploaded)</label>
              <small>At least one image is required</small>
              <UploadWidget
                uwConfig={{
                  multiple: true,
                  cloudName: "dptcsj94f",
                  uploadPreset: "apnaGhar",
                  folder: "posts",
                }}
                setState={setImages}
              />
            </div>
            
            <button className="sendButton" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update"}
            </button>
          </form>
        </div>zzzzz
      </div>
      <div className="sideContainer">
        {images.map((image, index) => (
          <img src={image} key={index} alt="" />
        ))}
      </div>
    </div>
  );
}

export default EditPostPage;