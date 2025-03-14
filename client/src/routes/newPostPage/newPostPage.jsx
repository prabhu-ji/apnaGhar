import { useState } from "react";
import "./newPostPage.scss";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import apiRequest from "../../lib/apiRequest";
import UploadWidget from "../../components/uploadWidget/UploadWidget";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function NewPostPage() {
  const [value, setValue] = useState("");
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [propertyType, setPropertyType] = useState("apartment");

  const navigate = useNavigate();

  const handlePropertyTypeChange = (e) => {
    setPropertyType(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);
    
    const formData = new FormData(e.target);
    const inputs = Object.fromEntries(formData);

    try {
      const res = await apiRequest.post("/posts", {
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
      
      toast.success("Post created successfully!");
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
          toast.error(err.response.data.message || "Failed to create post");
        }
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="newPostPage">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="formContainer">
        <h1>Add New Post</h1>
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
              <input id="title" name="title" type="text" required />
            </div>
            <div className="item">
              <label htmlFor="price">Price *</label>
              <input id="price" name="price" type="number" min="1" required />
            </div>
            <div className="item">
              <label htmlFor="address">Address *</label>
              <input id="address" name="address" type="text" required />
            </div>
            <div className="item description">
              <label htmlFor="desc">Description *</label>
              <ReactQuill theme="snow" onChange={setValue} value={value} />
            </div>
            <div className="item">
              <label htmlFor="city">City *</label>
              <input id="city" name="city" type="text" required />
            </div>
            
            <div className="item">
              <label htmlFor="property">Property Type *</label>
              <select 
                name="property" 
                onChange={handlePropertyTypeChange} 
                value={propertyType}
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
                required 
              />
            </div>
            <div className="item">
              <label htmlFor="type">Type *</label>
              <select name="type">
                <option value="rent">Rent</option>
                <option value="buy">Buy</option>
              </select>
            </div>

            {propertyType !== "land" && (
              <>
                <div className="item">
                  <label htmlFor="utilities">Utilities Policy *</label>
                  <select name="utilities" required>
                    <option value="owner">Owner is responsible</option>
                    <option value="tenant">Tenant is responsible</option>
                    <option value="shared">Shared</option>
                  </select>
                </div>
                <div className="item">
                  <label htmlFor="pet">Pet Policy *</label>
                  <select name="pet" required>
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
                required
              />
            </div>
            <div className="item">
              <label htmlFor="size">Total Size (sqft) *</label>
              <input min={1} id="size" name="size" type="number" required />
            </div>
            <div className="item">
              <label htmlFor="school">School (meters) *</label>
              <input min={0} id="school" name="school" type="number" required />
              <small>Distance in meters</small>
            </div>
            <div className="item">
              <label htmlFor="bus">Bus (meters) *</label>
              <input min={0} id="bus" name="bus" type="number" required />
              <small>Distance in meters</small>
            </div>
            <div className="item">
              <label htmlFor="restaurant">Restaurant (meters) *</label>
              <input min={0} id="restaurant" name="restaurant" type="number" required />
              <small>Distance in meters</small>
            </div>
            
            <div className="imageUploadSection">
              <label>Images * ({images.length} uploaded)</label>
              <small>At least one image is required</small>
            </div>
            
            <button className="sendButton" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Add"}
            </button>
          </form>
        </div>
      </div>
      <div className="sideContainer">
        {images.map((image, index) => (
          <img src={image} key={index} alt="" />
        ))}
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
    </div>
  );
}

export default NewPostPage;