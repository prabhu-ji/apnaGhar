import "./singlePage.scss";
import Slider from "../../components/slider/Slider";
import Map from "../../components/map/Map";
import { useNavigate, useLoaderData } from "react-router-dom";
import DOMPurify from "dompurify";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

function SinglePage() {
  const post = useLoaderData();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/edit/${post.id}`);
  };

  return (
    <div className="singlePage">
      <div className="details">
        <div className="wrapper">
          <Slider images={post.images} />
          <div className="info">
            <div className="top">
              <div className="post">
                <h1>{post.title}</h1>
                <div className="address">
                  <img src="/pin.png" alt="Location" className="icon-small" />
                  <span>{post.address}</span>
                </div>
                <div className="price">₹ {post.price}</div>
              </div>
              <div className="user">
                <span>Owner :</span>
                <img src={post.user.avatar || "/noavatar.jpg"} alt="Owner Avatar" className="avatar-small" />
                <span>{post.user.username}</span>
                {currentUser && currentUser.id === post.user.id && (
                  <button onClick={handleEdit} className="editButton">
                    ✏️ Edit Post
                  </button>
                )}
              </div>
            </div>
            <div
              className="bottom"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(post.postDetail.desc),
              }}
            ></div>
          </div>
        </div>
      </div>
      <div className="features">
        <div className="wrapper">
          <p className="title">General</p>
          <div className="listVertical">
            <div className="feature">
              <img src="/utility.png" alt="Utility" className="icon-small" />
              <div className="featureText">
                <span>Utilities</span>
                <p>{post.postDetail.utilities === "owner" ? "Owner is responsible" : "Tenant is responsible"}</p>
              </div>
            </div>
            <div className="feature">
              <img src="/pet.png" alt="Pet Policy" className="icon-small" />
              <div className="featureText">
                <span>Pet Policy</span>
                <p>{post.postDetail.pet === "allowed" ? "Pets Allowed" : "Pets not Allowed"}</p>
              </div>
            </div>
            <div className="feature">
              <img src="/fee.png" alt="Income Policy" className="icon-small" />
              <div className="featureText">
                <span>Income Policy</span>
                <p>{post.postDetail.income}</p>
              </div>
            </div>
          </div>
          <p className="title">Sizes</p>
          <div className="sizes">
            <div className="size">
              <img src="/size.png" alt="Size" className="icon-small" />
              <span>{post.postDetail.size} sqft</span>
            </div>
            <div className="size">
              <img src="/bed.png" alt="Beds" className="icon-small" />
              <span>{post.bedroom} beds</span>
            </div>
            <div className="size">
              <img src="/bath.png" alt="Bathroom" className="icon-small" />
              <span>{post.bathroom} bathroom</span>
            </div>
          </div>
          <p className="title">Nearby Places</p>
          <div className="listHorizontal">
            <div className="feature">
              <img src="/school.png" alt="School" className="icon-small" />
              <div className="featureText">
                <span>School</span>
                <p>{post.postDetail.school > 999 ? post.postDetail.school / 1000 + "km" : post.postDetail.school + "m"} away</p>
              </div>
            </div>
            <div className="feature">
              <img src="/bus.png" alt="Bus Stop" className="icon-small" />
              <div className="featureText">
                <span>Bus Stop</span>
                <p>{post.postDetail.bus}m away</p>
              </div>
            </div>
            <div className="feature">
              <img src="/restaurant.png" alt="Restaurant" className="icon-small" />
              <div className="featureText">
                <span>Restaurant</span>
                <p>{post.postDetail.restaurant}m away</p>
              </div>
            </div>
          </div>
          <p className="title">Location</p>
          <div className="mapContainer">
            <Map items={[post]} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SinglePage;
