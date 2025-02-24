import { Link, useNavigate } from "react-router-dom";
import "./card.scss";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import { toast } from "react-toastify";
import EditIcon from "@mui/icons-material/Edit";
import ChatIcon from "@mui/icons-material/Chat";
import EventIcon from "@mui/icons-material/Event";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addHours, setHours, setMinutes } from 'date-fns';


function Card({ item, onDelete, listType }) {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(item.isSaved || listType === "saved");
  const [showCalendar, setShowCalendar] = useState(false);
  const [visitDate, setVisitDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const isOwnPost = currentUser?.id === item.userId;

  useEffect(() => {
    setIsSaved(item.isSaved || listType === "saved");
  }, [item.isSaved, listType]);

  useEffect(() => {
    if (showCalendar) {
      fetchBookedSlots();
    }
  }, [showCalendar]);

  const fetchBookedSlots = async () => {
    if (!item.id) return;
    
    try {
      // Add /api prefix to match your backend route
      const response = await apiRequest.get(`/api/visits/post/${item.id}`);
      
      // Handle different possible response structures
      const slots = Array.isArray(response.data) ? response.data : 
                   Array.isArray(response.data.slots) ? response.data.slots : [];
      setBookedSlots(slots);
    } catch (err) {
      if (err.response?.status === 404) {
        // For new listings with no bookings, set empty array silently
        setBookedSlots([]);
        return;
      }
      console.error("Error fetching booked slots:", err);
      toast.error("Failed to fetch available time slots");
      setBookedSlots([]);
    }
  };


  const isTimeSlotBooked = (time) => {
    if (!bookedSlots.length) return false;
    
    return bookedSlots.some(slot => {
      const slotDate = new Date(slot.date);
      return slotDate.getTime() === time.getTime() && 
             slot.timeSlot === `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    });
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;
    try {
      await apiRequest.delete(`/posts/${item.id}`);
      toast.success("Post deleted successfully");
      onDelete ? onDelete(item.id) : navigate("/profile");
    } catch (err) {
      console.error("Failed to delete post:", err);
      toast.error("Failed to delete post. Please try again.");
    }
  };

  const handleSave = async () => {
    if (isOwnPost) return toast.info("You cannot save your own post");
    if (!currentUser) return navigate("/login"), toast.error("You need to log in to save posts.");
    try {
      await apiRequest.post("/users/save", { postId: item.id });
      setIsSaved(!isSaved);
      toast.success(isSaved ? "Post removed from saved list" : "Post saved successfully!");
    } catch (err) {
      console.error("Failed to save post:", err);
      toast.error("An error occurred while saving the post.");
    }
  };

  const handleChatClick = async () => {
    if (!currentUser) return navigate("/login"), toast.error("You need to log in to start a chat.");
    if (currentUser?.userType !== "buyer") return toast.info("Sellers do not initiate chats.");
    try {
      const response = await apiRequest.post("/chats", { receiverId: item.userId });
      response.status === 200 ? navigate("/profile#chat") : toast.error("Failed to start chat.");
    } catch (err) {
      console.error("Failed to initiate chat:", err);
      toast.error("An error occurred while starting the chat.");
    }
  };

  const handleEditClick = () => {
    if (!currentUser) return navigate("/login"), toast.error("You need to log in to edit the post.");
    if (currentUser?.userType !== "seller") return toast.error("Only sellers can edit posts.");
    navigate(`/edit/${item.id}`);
  };
  const handleVisitRequest = async () => {
    if (!currentUser) return navigate("/login");
    if (currentUser.userType !== "buyer") return toast.error("Only buyers can schedule visits");
    if (!visitDate) return toast.error("Please select a date and time.");
  
    setIsLoading(true);
    try {
      const date = visitDate.toISOString().split('T')[0];
      const timeSlot = `${visitDate.getHours().toString().padStart(2, '0')}:${visitDate.getMinutes().toString().padStart(2, '0')}`;
      
      const response = await apiRequest.post("/visits", {
        postId: item.id,
        date,
        timeSlot,
        message: `Visit request for ${visitDate.toLocaleString()}`
      });
  
      toast.success("Visit request sent successfully!");
      setShowCalendar(false);
      setVisitDate(null);
      // Refresh booked slots after successful booking
      await fetchBookedSlots();
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to schedule visit.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  const handleScheduleClick = () => {
    if (!currentUser) return navigate("/login"), toast.error("You need to log in to schedule a visit.");
    if (currentUser.userType !== "buyer") return toast.error("Only buyers can schedule visits");
    if (isOwnPost) return toast.error("You cannot schedule a visit to your own property");

    setShowCalendar(true);
  };

  const filterAvailableTimes = (time) => {
    const currentDate = new Date();
    const selectedDate = new Date(time);

    if (selectedDate < currentDate) return false;

    const hours = selectedDate.getHours();
    if (hours < 9 || hours >= 17) return false;

    return !isTimeSlotBooked(selectedDate);
  };

  return (
    <div className="card">
      <div className="card-img">
        <img src={item.img || "/placeholder-property.jpg"} alt={item.title} />
      </div>
      <div className="card-content">
        <div className="card-header">
          <h2 className="card-title">
            <Link to={`/post/${item.id}`}>{item.title}</Link>
          </h2>
          <span className="card-price">${item.price?.toLocaleString()}</span>
        </div>
        <p className="card-description">{item.desc?.substring(0, 100)}...</p>
        <div className="card-info">
          <span className="card-location">{item.location}</span>
          <span className="card-date">Posted on: {new Date(item.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="card-actions">
          <button 
            className={`save-btn ${isSaved ? 'saved' : ''}`} 
            onClick={handleSave}
            title={isSaved ? "Remove from saved" : "Save this post"}
          >
            {isSaved ? "Saved" : "Save"}
          </button>
          
          {currentUser?.userType === "buyer" && !isOwnPost && (
            <button 
              className="schedule-btn" 
              onClick={handleScheduleClick}
              title="Schedule a visit"
            >
              <EventIcon /> Schedule Visit
            </button>
          )}
          
          {!isOwnPost && currentUser?.userType === "buyer" && (
            <button 
              className="chat-btn" 
              onClick={handleChatClick}
              title="Chat with seller"
            >
              <ChatIcon /> Contact
            </button>
          )}
          
          {isOwnPost && (
            <>
              <button 
                className="edit-btn" 
                onClick={handleEditClick}
                title="Edit this post"
              >
                <EditIcon /> Edit
              </button>
              <button 
                className="delete-btn" 
                onClick={handleDelete}
                title="Delete this post"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {showCalendar && (
        <div className="calendar-popup">
          <h3>Schedule a Visit</h3>
          <p>Available times: 9 AM - 5 PM, Monday-Friday</p>
          <DatePicker
            selected={visitDate}
            onChange={setVisitDate}
            showTimeSelect
            timeIntervals={60}
            dateFormat="MMMM d, yyyy h:mm aa"
            minDate={new Date()}
            filterTime={filterAvailableTimes}
            minTime={setHours(setMinutes(new Date(), 0), 9)}
            maxTime={setHours(setMinutes(new Date(), 0), 17)}
            placeholderText="Select visit date and time"
            className="datepicker-input"
            inline
          />
          <div className="calendar-actions">
            <button 
              className="confirm-btn"
              onClick={handleVisitRequest} 
              disabled={isLoading || !visitDate}
            >
              {isLoading ? "Sending..." : "Confirm Visit"}
            </button>
            <button 
              className="cancel-btn"
              onClick={() => {
                setShowCalendar(false);
                setVisitDate(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Card;