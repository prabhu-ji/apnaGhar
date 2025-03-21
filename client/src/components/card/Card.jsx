import { Link, useNavigate } from "react-router-dom";
import "./card.scss";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import { toast } from "react-toastify";
import EditIcon from "@mui/icons-material/Edit";
import ChatIcon from "@mui/icons-material/Chat";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import EventIcon from "@mui/icons-material/Event";
import SellIcon from "@mui/icons-material/Sell";
import HomeIcon from "@mui/icons-material/Home";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { setHours, setMinutes } from 'date-fns';
import { useOpenChat } from "../../context/OpenChat";

function Card({ item, onDelete, listType }) {
  const {setOpenChat}=useOpenChat();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(item.isSaved || listType === "saved");
  const [showCalendar, setShowCalendar] = useState(false);
  const [visitDate, setVisitDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const isOwnPost = currentUser?.id === item.userId;
  const isSellerUser = currentUser?.userType === "seller";
  const isBuyerUser = currentUser?.userType === "buyer";
  const [isSold, setIsSold] = useState(item.isSold || false);
  const [isRented, setIsRented] = useState(item.isRented || false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [visitData, setVisitData] = useState(null);

  // Property type variables
  const isForSale = item.type === "buy";
  const isForRent = item.type === "rent";

  // Property availability status
  const isPropertyAvailable = !isSold && (!isRented || !isForRent);

  useEffect(() => {
    const fetchVisitData = async () => {
      try {
        const response = await apiRequest.get(`/posts/${item.id}/visit-count`);
        setVisitData(response.data);
      } catch (error) {
        console.error("Error fetching visit data:", error);
      }
    };

    fetchVisitData();
  }, [item.id]);

  useEffect(() => {
    const fetchVisitData = async () => {
      try {
        const response = await apiRequest.get(`/posts/${item.id}/visit-count`);
        setVisitData(response.data);
      } catch (error) {
        console.error("Error fetching visit data:", error);
      }
    };

    if (currentUser) {
      fetchVisitData();
    }
  }, [item.id, currentUser]);

  const fetchBookedSlots = async () => {
    if (!item.id) return;
    
    try {
      const response = await apiRequest.get(`/visits/post/${item.id}`);
      const visits = response.data;
      
      const bookedSlots = visits.map(visit => ({
        date: new Date(visit.date),
        timeSlot: visit.timeSlot
      }));
      
      setBookedSlots(bookedSlots);
    } catch (err) {
      if (err.response?.status === 404) {
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
    
    const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    const dateString = time.toISOString().split('T')[0];
    
    return bookedSlots.some(slot => {
      const slotDateStr = new Date(slot.date).toISOString().split('T')[0];
      return slotDateStr === dateString && slot.timeSlot === timeString;
    });
  };

  const handleDelete = async () => {
    if (isSold) {
      toast.error("Cannot delete a sold property");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;
    try {
      await apiRequest.delete(`/posts/${item.id}`);
      toast.success("Post deleted successfully");
  
      if (onDelete) {
        onDelete(item.id);
      }
      navigate("/profile");
    } catch (err) {
      console.error("Failed to delete post:", err);
      toast.error(err.response?.data?.message || "Failed to delete post. Please try again.");
    }
  };
  

  const handleSave = async (e) => {
    e.stopPropagation(); // Prevent event bubbling
    if (isOwnPost) return toast.info("You cannot save your own post");
    if (!currentUser) return navigate("/login"), toast.error("You need to log in to save posts.");
    
    try {
      await apiRequest.post("/users/save", { postId: item.id });
      setIsSaved(!isSaved);
      toast.success(isSaved ? "Post removed from saved list" : "Post saved successfully!");
    } catch (err) {
      console.error("Failed to save post:", err);
      if (err.response?.status === 403) {
        toast.error(err.response.data.message || "You cannot save this post.");
      } else {
        toast.error("An error occurred while saving the post.");
      }
    }
  };
  
  const handleChatClick = async (e) => {
    e.stopPropagation();
    
    // Handle authentication and validation
    if (!currentUser) {
      toast.error("You need to log in to start a chat.");
      return navigate("/login");
    }
    
    if (!isBuyerUser) {
      toast.info("Only buyers can initiate chats with sellers.");
      return;
    }
    
    if (!isPropertyAvailable) {
      toast.error(`Cannot contact seller for a ${isForSale ? "sold" : "rented"} property`);
      return;
    }
    
    try {
      // Create or find existing chat and send initial message
      const response = await apiRequest.post("/chats", {
        receiverId: item.userId,
        initialMessage: `Hi, I'm interested in your property: ${item.title}`
      });
      
      // Get the chat ID from the response
      const chatId = response.data.id;
      console.log("from handle chat"+item.user);
      
      setOpenChat({id: chatId,receiverId: item.user});
      console.log({id:chatId});
      // Navigate to profile page with specific chat ID as a parameter
      navigate(`/profile?chatId=${chatId}#chat`);
    } catch (err) {
      console.error("Failed to initiate chat:", err);
      toast.error("Unable to connect with the seller. Please try again.");
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    if (!currentUser) return navigate("/login"), toast.error("You need to log in to edit the post.");
    if (!isSellerUser) return toast.error("Only sellers can edit posts.");
    if (isSold) return toast.error("Cannot edit a sold property");
    navigate(`/edit/${item.id}`);
  };

  const handleVisitRequest = async () => {
    if (!currentUser) return navigate("/login");
    if (!isBuyerUser) return toast.error("Only buyers can schedule visits");
    if (!isPropertyAvailable) return toast.error(`Cannot schedule a visit for a ${isForSale ? "sold" : "rented"} property`);
    if (!visitDate) return toast.error("Please select a date and time.");
  
    setIsLoading(true);
    try {
      const formattedDate = visitDate.toISOString().split('T')[0];
      const timeSlot = `${visitDate.getHours().toString().padStart(2, '0')}:${visitDate.getMinutes().toString().padStart(2, '0')}`;
      const response = await apiRequest.post("/visits", {
        postId: item.id,
        date: formattedDate,
        timeSlot,
        visitorId: currentUser.id,
        message: `Visit request for ${visitDate.toLocaleString()}`
      });

      if (response.data.visit) {
        toast.success("Visit request sent successfully!");
        setShowCalendar(false);
        setVisitDate(null);
        await fetchBookedSlots();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to schedule visit.";
      toast.error(errorMessage);
      console.error("Visit request error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    if (!currentUser) return navigate("/login"), toast.error("You need to log in to schedule a visit.");
    if (!isBuyerUser) return toast.error("Only buyers can schedule visits");
    if (isOwnPost) return toast.error("You cannot schedule a visit to your own property");
    if (!isPropertyAvailable) return toast.error(`Cannot schedule a visit for a ${isForSale ? "sold" : "rented"} property`);

    setShowCalendar(true);
  };

  const handleToggleStatus = async (e) => {
    e.stopPropagation(); // Prevent event bubbling
    if (!isOwnPost) return toast.error("You can only change status of your own properties");
    if (!isSellerUser) return toast.error("Only sellers can change property status");
    
    try {
      if (isForSale) {
        // For sale properties
        if (isSold) {
          // Show confirmation dialog before attempting to change a sold property back to available
          setShowConfirmation(true);
          return;
        }
        
        // Mark as sold
        const response = await apiRequest.patch(`/posts/${item.id}/toggle-sold`);
        if (response.status === 200) {
          setIsSold(true);
          toast.success("Property marked as sold");
        }
      } 
      else if (isForRent) {
        // For rent properties
        const response = await apiRequest.patch(`/posts/${item.id}/toggle-rented`);
        if (response.status === 200) {
          setIsRented(!isRented);
          toast.success(isRented ? "Property marked as available for rent" : "Property marked as rented");
        }
      }
      else {
        // Default fallback for other property types
        const response = await apiRequest.patch(`/posts/${item.id}/toggle-sold`);
        if (response.status === 200) {
          setIsSold(!isSold);
          toast.success(isSold ? "Property marked as available" : "Property marked as sold");
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      const errorMessage = err.response?.data?.message || "Failed to update property status";
      toast.error(errorMessage);
    }
  };

  const handleCardClick = async () => {
    if (!showCalendar && !showConfirmation) {
      if (currentUser) {
        try {
          await apiRequest.post(`/posts/${item.id}/track-visit`);
        } catch (error) {
          console.error("Error tracking post visit:", error);
        }
      }
      navigate(`/post/${item.id}`);
    }
  };
  

  const confirmSoldReset = async () => {
    try {
      const response = await apiRequest.patch(`/posts/${item.id}/toggle-sold`);
      if (response.status === 200) {
        setIsSold(false);
        toast.success("Property marked as available");
      } else {
        toast.error("Failed to change property status");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error(err.response?.data?.message || "Failed to update property status");
    } finally {
      setShowConfirmation(false);
    }
  };

  const filterAvailableTimes = (time) => {
    const currentDate = new Date();
    const selectedDate = new Date(time);

    if (selectedDate < currentDate) return false;

    const hours = selectedDate.getHours();
    if (hours < 9 || hours >= 17) return false;

    return !isTimeSlotBooked(selectedDate);
  };

  // Determine status label based on property type and status
  const getStatusLabel = () => {
    if (isForSale && isSold) return "SOLD";
    if (isForRent && isRented) return "RENTED";
    return isSold ? "SOLD" : (isRented ? "RENTED" : "");
  };

  const statusLabel = getStatusLabel();

  // Determine property type label
  const getPropertyTypeLabel = () => {
    return isForSale ? "For Sale" : (isForRent ? "For Rent" : "");
  };

  // Close modals when clicking outside
  const handleModalOutsideClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      setShowCalendar(false);
      setShowConfirmation(false);
    }
  };

  return (
    <>
      <div className={`card ${isSold ? 'sold-property' : ''} ${isRented ? 'rented-property' : ''}`} onClick={handleCardClick}>
        
        <div className="card-img">
          {statusLabel && <div className={`status-overlay ${isForRent && isRented ? 'rented-overlay' : 'sold-overlay'}`}>{statusLabel}</div>}
          <img 
            src={item.images && item.images.length > 0 ? item.images[0] : (item.img || "/placeholder-property.jpg")} 
            alt={item.title} 
          />
        </div>
        <div className="card-content">
          <div className="card-header">
            <h2 className="card-title">
              <Link to={`/post/${item.id}`} onClick={(e) => e.stopPropagation()}>
                {item.title} {statusLabel && <span className={`status-label ${isForRent && isRented ? 'rented-label' : 'sold-label'}`}>({statusLabel})</span>}
              </Link>
            </h2>
            <span className="card-price">₹ {item.price?.toLocaleString()}{isForRent ? " (Monthly)" : ""}</span>
          </div>
          <p className="card-description">{item.desc?.substring(0, 100)}...</p>
          <div className="card-info">
         
          {visitData && (
        <div className="visit-insights">
          <span className="visit-count">
            Visits: {visitData.visitCount}
          </span>
          <span className="visit-frequency">
            {visitData.visitFrequency}
          </span>
        </div>
      )}

            <span className="card-location">{item.location || item.address}</span>
            <span className="card-date">Posted on: {new Date(item.createdAt).toLocaleDateString()}</span>
            <span className="card-type">{getPropertyTypeLabel()}</span>
          </div>
          <div className="card-actions">
            {/* For buyers when property is available */}
            {currentUser && !isOwnPost && isPropertyAvailable && (
              <>
                {/* Save button - Icon only now */}
                <button 
                  className={`save-btn ${isSaved ? 'saved' : ''}`} 
                  onClick={handleSave}
                  title={isSaved ? "Remove from saved" : "Save this post"}
                >
                  <BookmarkIcon />
                </button>
                
                {/* Schedule visit button - only for buyers */}
                {isBuyerUser && (
                  <button 
                    className="schedule-btn" 
                    onClick={handleScheduleClick}
                    title="Schedule a visit"
                  >
                    <EventIcon /> 
                  </button>
                )}
                
                {/* Chat button - only for buyers */}
                {isBuyerUser && (
                  <button 
                    className="chat-btn" 
                    onClick={handleChatClick}
                    title="Chat with seller"
                  >
                    <ChatIcon /> 
                  </button>
                )}
              </>
            )}
            
            {/* For sellers to manage their own property */}
            {isOwnPost && isSellerUser && (
              <>
                {/* Toggle status button - behavior differs based on property type */}
                <button 
                  className={`status-btn ${isSold || isRented ? 'status-active' : ''}`} 
                  onClick={handleToggleStatus}
                  title={
                    isForSale 
                      ? (isSold ? "Property is sold" : "Mark as sold") 
                      : (isRented ? "Mark as available for rent" : "Mark as rented")
                  }
                  disabled={isForSale && isSold} // Disable toggle for sold properties
                >
                  {isForSale 
                    ? <><SellIcon /> {isSold ? "Sold" : "Mark as Sold"}</>
                    : <><HomeIcon /> {isRented ? "Mark as Available" : "Mark as Rented"}</>
                  }
                </button>
                
                {/* Edit button - not available for sold properties */}
                {!isSold && (
                  <button 
                    className="edit-btn" 
                    onClick={handleEditClick}
                    title="Edit this post"
                  >
                    <EditIcon /> Edit
                  </button>
                )}
                
                {/* Delete button - not available for sold properties */}
                {!isSold && (
                  <button 
                    className="delete-btn" 
                    onClick={handleDelete}
                    title="Delete this post"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Calendar modal for scheduling visits */}
      {showCalendar && (
        <div className="modal-overlay" onClick={handleModalOutsideClick}>
          <div className="calendar-popup" onClick={(e) => e.stopPropagation()}>
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
        </div>
      )}

      {/* Confirmation dialog modal for changing sold properties back to available */}
      {showConfirmation && (
        <div className="modal-overlay" onClick={handleModalOutsideClick}>
          <div className="confirmation-popup" onClick={(e) => e.stopPropagation()}>
            <h3>Warning: Changing Sold Status</h3>
            <p>Are you absolutely sure you want to mark this property as available? This should only be done if the sale fell through.</p>
            <div className="confirmation-actions">
              <button 
                className="confirm-btn"
                onClick={confirmSoldReset}
              >
                Yes, Mark as Available
              </button>
              <button 
                className="cancel-btn"
                onClick={() => setShowConfirmation(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Card;