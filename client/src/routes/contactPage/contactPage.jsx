import { useState } from "react";
import "./contactPage.scss";
import { toast } from "react-toastify";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const ContactPage = () => {
  const [activeSection, setActiveSection] = useState("email");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const position = [17.385044, 78.486671]; 
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    
    // Clear error for this field when user types
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Validate phone (optional but if provided, ensure it's valid)
    if (formData.phone.trim() && !/^[0-9+\s-()]{10,15}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    // Validate message
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Option 1: Open mail client with prefilled information
      const subject = `Contact Request from ${formData.name}`;
      const body = `
Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}
Message: ${formData.message}
      `;
      
      // Create mailto link
      const mailtoLink = `mailto:info@apnaghar.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Open the mail client
      window.location.href = mailtoLink;
      
      toast.success("Opening your email client with your message");
      
      // Don't clear form data immediately, in case the user comes back
      setTimeout(() => {
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: "",
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      toast.error("There was an error processing your request");
      setIsLoading(false);
    }
  };

  const officeHours = [
    { day: "Monday", hours: "9:00 AM - 5:00 PM" },
    { day: "Tuesday", hours: "9:00 AM - 5:00 PM" },
    { day: "Wednesday", hours: "9:00 AM - 5:00 PM" },
    { day: "Thursday", hours: "9:00 AM - 5:00 PM" },
    { day: "Friday", hours: "9:00 AM - 5:00 PM" },
    { day: "Saturday & Sunday", hours: "Closed" }
  ];

  return (
    <div className="contactPage">
      <div className="contact-header">
        <div className="header-content">
          <h1>Get in Touch</h1>
          <p>We are here to help you with all your real estate needs</p>
        </div>
      </div>

      <div className="contact-container">
        <div className="contact-sidebar">
          <div className="contact-methods">
            <div
              className={`method ${activeSection === "email" ? "active" : ""}`}
              onClick={() => setActiveSection("email")}
            >
              <img src="https://cdn-icons-png.flaticon.com/512/3059/3059989.png" alt="Email" style={{ width: "23px", height: "23px" }} />
              <div className="method-text">
                <h3>Email Us</h3>
                <p>Get a response within 24 hours</p>
              </div>
            </div>
            <div
              className={`method ${activeSection === "visit" ? "active" : ""}`}
              onClick={() => setActiveSection("visit")}
            >
              <img src="https://cdn-icons-png.flaticon.com/512/14831/14831599.png" alt="Visit" style={{ width: "23px", height: "23px" }} />
              <div className="method-text">
                <h3>Visit Us</h3>
                <p>Come to our office</p>
              </div>
            </div>
            <div
              className={`method ${activeSection === "call" ? "active" : ""}`}
              onClick={() => setActiveSection("call")}
            >
              <img src="https://cdn-icons-png.flaticon.com/512/11462/11462844.png" alt="Call" style={{ width: "23px", height: "23px" }} />
              <div className="method-text">
                <h3>Call Us</h3>
                <p>Speak with an agent</p>
              </div>
            </div>
          </div>

          <div className="contact-info">
            {activeSection === "email" && (
              <div className="info-section">
                <h3>Email Addresses</h3>
                <p>General Inquiries: info@apnaghar.com</p>
                <p>Support: support@apnaghar.com</p>
                <p>Careers: careers@apnaghar.com</p>
              </div>
            )}
            {activeSection === "visit" && (
              <div className="info-section">
                <h3>Office Address</h3>
                <p>Ayyapa Society, Hilton Colive</p>
                <p>Madhapur, Hyderabad</p>
                <p>Telangana, India</p>
              </div>
            )}
            {activeSection === "call" && (
              <div className="info-section">
                <h3>Phone Numbers</h3>
                <p>Main: +91 800-123-4567</p>
                <p>Support: +91 800-987-6543</p>
                <p>Emergency: +91 800-555-1212</p>
              </div>
            )}
          </div>

          <div className="office-hours">
            <h3>Office Hours</h3>
            <div className="hours-grid">
              {officeHours.map((schedule) => (
                <div key={schedule.day} className="hour-item">
                  <span className="day">{schedule.day}</span>
                  <span className="hours">{schedule.hours}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="contact-main">
          <div className="form-section">
            <h2>Send us a Message</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                  className={errors.name ? "error" : ""}
                />
                {errors.name && <div className="error-message">{errors.name}</div>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email <span className="required">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Your email address"
                    className={errors.email ? "error" : ""}
                  />
                  {errors.email && <div className="error-message">{errors.email}</div>}
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Your phone number"
                    className={errors.phone ? "error" : ""}
                  />
                  {errors.phone && <div className="error-message">{errors.phone}</div>}
                </div>
              </div>
              <div className="form-group">
                <label>Message <span className="required">*</span></label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="How can we help you?"
                  rows="6"
                  className={errors.message ? "error" : ""}
                ></textarea>
                {errors.message && <div className="error-message">{errors.message}</div>}
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          <div className="map-section">
            <MapContainer
              center={position}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={position}>
                <Popup>
                  ApnaGhar Headquarters <br /> Madhapur Street, Hyderabad.
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;